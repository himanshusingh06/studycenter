import React, { useState, useEffect } from 'react';
import { CreditCard, Search, Calendar, DollarSign, CheckCircle2, FileText, Printer, Edit, RotateCcw, Filter, Zap } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Modal from '../../components/common/Modal';
import PrintableReceipt from '../../components/receipts/PrintableReceipt';

const MONTHS = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' },
  { value: 3, label: 'March' }, { value: 4, label: 'April' },
  { value: 5, label: 'May' }, { value: 6, label: 'June' },
  { value: 7, label: 'July' }, { value: 8, label: 'August' },
  { value: 9, label: 'September' }, { value: 10, label: 'October' },
  { value: 11, label: 'November' }, { value: 12, label: 'December' }
];

const MonthlyFeeGridPage = () => {
  const currentDate = new Date();
  const [year, setYear] = useState(currentDate.getFullYear());
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [timingFilter, setTimingFilter] = useState('');
  const [structures, setStructures] = useState([]);
  
  const [gridItems, setGridItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected fee item for payment collection
  const [selectedFeeItem, setSelectedFeeItem] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('UPI');
  const [payNotes, setPayNotes] = useState('');
  
  // Selected fee item for fee adjustment edit
  const [editFeeItem, setEditFeeItem] = useState(null);
  const [editDueAmount, setEditDueAmount] = useState('');
  const [editStatus, setEditStatus] = useState('');

  // Confirmation modals
  const [collectConfirmOpen, setCollectConfirmOpen] = useState(false);
  const [editConfirmOpen, setEditConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdReceipt, setCreatedReceipt] = useState(null);

  const fetchStructures = async () => {
    try {
      const res = await api.get('/fees/structures');
      setStructures(res.data);
    } catch (err) {
      console.error('Failed to load structures:', err);
    }
  };

  const fetchGrid = async () => {
    setLoading(true);
    try {
      const res = await api.get('/fees/monthly-grid', {
        params: {
          year,
          month,
          q: search || undefined,
          status: statusFilter || undefined,
          plan_id: planFilter || undefined,
          timing: timingFilter || undefined
        }
      });
      setGridItems(res.data);
    } catch (err) {
      console.error('Failed to load fee grid:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStructures();
  }, []);

  useEffect(() => {
    fetchGrid();
  }, [year, month, statusFilter, planFilter, timingFilter]);

  const handleOpenPaymentModal = (item) => {
    setSelectedFeeItem(item);
    setPayAmount(item.pending_amount.toString());
    setPayMode('UPI');
    setPayNotes(`Monthly fee collection for ${item.month_name} ${item.year}`);
  };

  const handleOpenEditModal = (item) => {
    setEditFeeItem(item);
    setEditDueAmount(item.due_amount.toString());
    setEditStatus(item.status);
  };

  const handleExecutePayment = async () => {
    setSubmitting(true);
    try {
      const payload = {
        student_id: selectedFeeItem.student_id,
        payment_type: selectedFeeItem.billing_cycle === 'YEARLY' ? 'YEARLY' : 'MONTHLY',
        payment_mode: payMode,
        total_amount: Number(payAmount),
        notes: payNotes,
        items: [
          {
            fee_month_id: selectedFeeItem.fee_month_id,
            description: `Fee Payment - ${selectedFeeItem.month_name} ${selectedFeeItem.year}`,
            amount: Number(payAmount)
          }
        ]
      };
      const res = await api.post('/payments', payload);
      setCreatedReceipt(res.data);
      setCollectConfirmOpen(false);
      setSelectedFeeItem(null);
      fetchGrid();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecuteFeeUpdate = async () => {
    setSubmitting(true);
    try {
      await api.put(`/fees/monthly-grid/${editFeeItem.fee_month_id}`, {
        due_amount: Number(editDueAmount),
        status: editStatus
      });
      setEditConfirmOpen(false);
      setEditFeeItem(null);
      fetchGrid();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to adjust fee record');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Monthly Fee Schedule Ledger</h1>
          <p className="text-sm text-slate-400">View student monthly fee schedules, filter by plan/shift, and collect dues with confirmation</p>
        </div>
      </div>

      {/* Advanced Filter Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Year</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none font-bold"
          >
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Month</label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none font-bold"
          >
            {MONTHS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Fee Plan</label>
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
          >
            <option value="">All Fee Plans</option>
            {structures.map(fs => (
              <option key={fs.id} value={fs.id}>{fs.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="PAID">PAID</option>
            <option value="PENDING">PENDING</option>
            <option value="OVERDUE">OVERDUE</option>
            <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Search Student</label>
          <div className="relative">
            <Search className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchGrid()}
              placeholder="Name, ID, Seat..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Grid Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto mb-2"></div>
            <span>Loading monthly fee matrix...</span>
          </div>
        ) : gridItems.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="text-base font-semibold">No fee records found for {MONTHS.find(m => m.value === month)?.label} {year}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs font-semibold text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Assigned Desk</th>
                  <th className="px-6 py-4">Plan & Cycle</th>
                  <th className="px-6 py-4">Due Amount</th>
                  <th className="px-6 py-4">Paid</th>
                  <th className="px-6 py-4">Pending</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Paid-Until</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {gridItems.map((item) => (
                  <tr key={item.fee_month_id} className="hover:bg-slate-800/40">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-white leading-snug">{item.student_name}</p>
                        <p className="text-xs text-brand-400 font-mono">{item.student_code}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-amber-400">{item.seat_number || 'Flexi'}</td>
                    <td className="px-6 py-4 text-xs">
                      <p className="text-slate-200 font-medium">{item.plan_name}</p>
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 uppercase">
                        {item.billing_cycle}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold">₹{item.due_amount}</td>
                    <td className="px-6 py-4 font-mono text-emerald-400 font-semibold">₹{item.paid_amount}</td>
                    <td className="px-6 py-4 font-mono text-amber-400 font-semibold">₹{item.pending_amount}</td>
                    <td className="px-6 py-4"><StatusBadge status={item.status} /></td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-400">{item.paid_until_date || 'N/A'}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
                        title="Adjust Fee Record"
                      >
                        <Edit className="h-3.5 w-3.5 inline" />
                      </button>
                      {item.pending_amount > 0 ? (
                        <button
                          onClick={() => handleOpenPaymentModal(item)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-md transition-all inline-flex items-center space-x-1"
                        >
                          <DollarSign className="h-3.5 w-3.5" />
                          <span>Collect</span>
                        </button>
                      ) : (
                        <span className="text-xs text-emerald-400 font-semibold inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-500/10 rounded-lg">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Paid</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Collect Fee Modal */}
      {selectedFeeItem && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedFeeItem(null)}
          title={`Collect Fee: ${selectedFeeItem.student_name}`}
        >
          <form onSubmit={(e) => { e.preventDefault(); setCollectConfirmOpen(true); }} className="space-y-4">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1 text-slate-300">
              <p><span className="text-slate-500">Student Code:</span> <strong className="font-mono text-brand-400">{selectedFeeItem.student_code}</strong></p>
              <p><span className="text-slate-500">Plan:</span> {selectedFeeItem.plan_name} ({selectedFeeItem.billing_cycle})</p>
              <p><span className="text-slate-500">Month:</span> {selectedFeeItem.month_name} {selectedFeeItem.year}</p>
              <p><span className="text-slate-500">Pending Dues:</span> <strong className="text-amber-400 font-mono text-sm">₹{selectedFeeItem.pending_amount}</strong></p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Collection Amount (₹) *</label>
              <input
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                required
                max={selectedFeeItem.pending_amount}
                min={1}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-lg font-bold text-emerald-400 focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Payment Mode *</label>
              <select
                value={payMode}
                onChange={(e) => setPayMode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500"
              >
                <option value="UPI">UPI / QR Payment</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Debit / Credit Card</option>
                <option value="BANK_TRANSFER">Net Banking / Bank Transfer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Notes / Remarks</label>
              <input
                type="text"
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedFeeItem(null)}
                className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg"
              >
                Review & Confirm Payment
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Adjust Fee Month Modal */}
      {editFeeItem && (
        <Modal isOpen={true} onClose={() => setEditFeeItem(null)} title={`Adjust Fee Record: ${editFeeItem.student_name}`}>
          <form onSubmit={(e) => { e.preventDefault(); setEditConfirmOpen(true); }} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Total Due Amount (₹)</label>
              <input
                type="number"
                value={editDueAmount}
                onChange={(e) => setEditDueAmount(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Status Override</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
              >
                <option value="PENDING">PENDING</option>
                <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
                <option value="PAID">PAID</option>
                <option value="OVERDUE">OVERDUE</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
              <button type="button" onClick={() => setEditFeeItem(null)} className="px-4 py-2 bg-slate-800 text-slate-400 rounded-xl text-sm">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-brand-600 text-white font-bold rounded-xl text-sm">Save Fee Adjustment</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Payment Confirmation Dialog */}
      <ConfirmDialog
        isOpen={collectConfirmOpen}
        onClose={() => setCollectConfirmOpen(false)}
        onConfirm={handleExecutePayment}
        loading={submitting}
        title="Confirm Fee Collection"
        financialDetails={selectedFeeItem ? {
          studentName: selectedFeeItem.student_name,
          studentCode: selectedFeeItem.student_code,
          paymentType: "MONTHLY",
          month: `${selectedFeeItem.month_name} ${selectedFeeItem.year}`,
          amount: selectedFeeItem.pending_amount,
          discount: 0,
          finalAmount: payAmount,
          mode: payMode
        } : null}
      />

      {/* Edit Fee Confirmation Dialog */}
      <ConfirmDialog
        isOpen={editConfirmOpen}
        onClose={() => setEditConfirmOpen(false)}
        onConfirm={handleExecuteFeeUpdate}
        loading={submitting}
        title="Confirm Fee Adjustment"
        message={`Are you sure you want to adjust fee record for ${editFeeItem?.student_name} (${editFeeItem?.month_name} ${editFeeItem?.year}) to due amount ₹${editDueAmount}?`}
      />

      {/* Printable Receipt Modal */}
      {createdReceipt && (
        <Modal 
          isOpen={true} 
          onClose={() => setCreatedReceipt(null)} 
          title="Official StudyCenter Pro Fee Receipt" 
          maxWidth="max-w-2xl"
        >
          <PrintableReceipt
            receiptData={createdReceipt}
            onClose={() => setCreatedReceipt(null)}
          />
        </Modal>
      )}
    </div>
  );
};

export default MonthlyFeeGridPage;
