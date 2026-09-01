import React, { useState, useEffect } from 'react';
import { FileText, Printer, Search, RotateCcw } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PrintableReceipt from '../../components/receipts/PrintableReceipt';

const PaymentsHistoryPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Refund state
  const [refundTarget, setRefundTarget] = useState(null);
  const [refundReason, setRefundReason] = useState('Student requested cancellation / fee adjustment');
  const [refundConfirmOpen, setRefundConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payments');
      setPayments(res.data);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleExecuteRefund = async () => {
    setSubmitting(true);
    try {
      await api.post(`/payments/${refundTarget.id}/refund`, {
        refund_amount: refundTarget.total_amount,
        reason: refundReason
      });
      setRefundConfirmOpen(false);
      setRefundTarget(null);
      fetchPayments();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to process refund');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Payments & Receipts Ledger</h1>
        <p className="text-sm text-slate-400">All collected fee transactions with official receipt printing</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto mb-2"></div>
            <span>Loading payment records...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs font-semibold text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Receipt #</th>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Type / Plan</th>
                  <th className="px-6 py-4">Payment Mode</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    <td className="px-6 py-4 font-mono font-bold text-brand-400">{p.receipt_number}</td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-white leading-snug">{p.student_name}</p>
                        <p className="text-xs text-slate-500 font-mono">{p.student_code} • Desk {p.seat_number || 'Flexi'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono">{new Date(p.payment_date).toLocaleString()}</td>
                    <td className="px-6 py-4 text-xs">
                      <p className="font-medium text-slate-200">{p.payment_type}</p>
                      <p className="text-slate-500">{p.plan_name}</p>
                    </td>
                    <td className="px-6 py-4 font-bold uppercase text-xs text-slate-200">{p.payment_mode}</td>
                    <td className="px-6 py-4 font-mono font-extrabold text-emerald-400">₹{p.total_amount}</td>
                    <td className="px-6 py-4"><StatusBadge status={p.status} /></td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedReceipt(p)}
                        className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-bold rounded-lg transition-colors inline-flex items-center space-x-1"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        <span>Print Receipt</span>
                      </button>
                      {p.status === 'PAID' && (
                        <button
                          onClick={() => { setRefundTarget(p); setRefundConfirmOpen(true); }}
                          className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold rounded-lg transition-colors inline-flex items-center space-x-1"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Refund</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Advanced Printable Receipt Modal */}
      {selectedReceipt && (
        <Modal 
          isOpen={true} 
          onClose={() => setSelectedReceipt(null)} 
          title="Official StudyCenter Pro Fee Receipt" 
          maxWidth="max-w-2xl"
        >
          <PrintableReceipt
            receiptData={selectedReceipt}
            onClose={() => setSelectedReceipt(null)}
          />
        </Modal>
      )}

      {/* Refund Confirm Dialog */}
      <ConfirmDialog
        isOpen={refundConfirmOpen}
        onClose={() => setRefundConfirmOpen(false)}
        onConfirm={handleExecuteRefund}
        loading={submitting}
        confirmVariant="danger"
        confirmText="Confirm Refund"
        title="Confirm Payment Refund"
        message={`Are you sure you want to refund payment receipt #${refundTarget?.receipt_number} of ₹${refundTarget?.total_amount} for ${refundTarget?.student_name}?`}
      />
    </div>
  );
};

export default PaymentsHistoryPage;
