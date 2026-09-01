import React, { useState, useEffect } from 'react';
import { CalendarCheck, RefreshCw, AlertCircle, CheckCircle2, Edit, XCircle } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const SubscriptionsPage = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Renew State
  const [selectedSub, setSelectedSub] = useState(null);
  const [renewMonths, setRenewMonths] = useState(1);
  const [renewConfirmOpen, setRenewConfirmOpen] = useState(false);

  // Edit State
  const [editSub, setEditSub] = useState(null);
  const [editEndDate, setEditEndDate] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editConfirmOpen, setEditConfirmOpen] = useState(false);

  // Cancel State
  const [cancelSub, setCancelSub] = useState(null);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/subscriptions');
      setSubscriptions(res.data);
    } catch (err) {
      console.error('Failed to fetch subscriptions:', err);
    } finalising: {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleOpenEdit = (s) => {
    setEditSub(s);
    setEditEndDate(s.end_date);
    setEditStatus(s.status);
  };

  const handleExecuteRenew = async () => {
    setSubmitting(true);
    try {
      await api.post(`/subscriptions/${selectedSub.id}/renew`, {
        months_to_extend: Number(renewMonths)
      });
      setRenewConfirmOpen(false);
      setSelectedSub(null);
      fetchSubscriptions();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to renew subscription');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecuteEdit = async () => {
    setSubmitting(true);
    try {
      await api.put(`/subscriptions/${editSub.id}`, {
        end_date: editEndDate,
        status: editStatus
      });
      setEditConfirmOpen(false);
      setEditSub(null);
      fetchSubscriptions();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update subscription');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecuteCancel = async () => {
    setSubmitting(true);
    try {
      await api.delete(`/subscriptions/${cancelSub.id}`);
      setCancelConfirmOpen(false);
      setCancelSub(null);
      fetchSubscriptions();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to cancel subscription');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Subscription Management</h1>
          <p className="text-sm text-slate-400">Track active memberships, expiry dates, and renewals</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto mb-2"></div>
            <span>Loading subscriptions...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs font-semibold text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Fee Plan</th>
                  <th className="px-6 py-4">Start Date</th>
                  <th className="px-6 py-4">End Date</th>
                  <th className="px-6 py-4">Days Remaining</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {subscriptions.map(s => (
                  <tr key={s.id} className="hover:bg-slate-800/40">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-white leading-snug">{s.student_name}</p>
                        <p className="text-xs text-brand-400 font-mono">{s.student_code}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{s.plan_name}</td>
                    <td className="px-6 py-4 text-xs font-mono">{s.start_date}</td>
                    <td className="px-6 py-4 text-xs font-mono font-bold text-white">{s.end_date}</td>
                    <td className="px-6 py-4 font-bold text-amber-400">{s.days_remaining} Days</td>
                    <td className="px-6 py-4"><StatusBadge status={s.status} /></td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedSub(s)}
                        className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-lg shadow-md transition-all inline-flex items-center space-x-1"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Renew</span>
                      </button>
                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors inline-flex items-center space-x-1"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>
                      {s.status === 'ACTIVE' && (
                        <button
                          onClick={() => { setCancelSub(s); setCancelConfirmOpen(true); }}
                          className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-semibold rounded-lg transition-colors inline-flex items-center space-x-1"
                        >
                          <XCircle className="h-3.5 w-3.5" />
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

      {/* Renew Modal */}
      {selectedSub && (
        <Modal isOpen={true} onClose={() => setSelectedSub(null)} title={`Renew Subscription: ${selectedSub.student_name}`}>
          <form onSubmit={(e) => { e.preventDefault(); setRenewConfirmOpen(true); }} className="space-y-4">
            <p className="text-sm text-slate-300">
              Current Expiry Date: <strong className="text-white font-mono">{selectedSub.end_date}</strong>
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Months to Extend *</label>
              <select
                value={renewMonths}
                onChange={(e) => setRenewMonths(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500"
              >
                <option value={1}>1 Month Extension</option>
                <option value={3}>3 Months Extension</option>
                <option value={6}>6 Months Extension</option>
                <option value={12}>12 Months (1 Year) Extension</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
              <button type="button" onClick={() => setSelectedSub(null)} className="px-4 py-2 rounded-xl text-sm text-slate-400 bg-slate-800">Cancel</button>
              <button type="submit" className="px-5 py-2 rounded-xl bg-brand-600 text-white font-bold text-sm">Review & Confirm Renewal</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {editSub && (
        <Modal isOpen={true} onClose={() => setEditSub(null)} title={`Edit Subscription: ${editSub.student_name}`}>
          <form onSubmit={(e) => { e.preventDefault(); setEditConfirmOpen(true); }} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">End Date</label>
              <input
                type="date"
                value={editEndDate}
                onChange={(e) => setEditEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Subscription Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="EXPIRED">EXPIRED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
              <button type="button" onClick={() => setEditSub(null)} className="px-4 py-2 bg-slate-800 text-slate-400 rounded-xl text-sm">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-brand-600 text-white font-bold rounded-xl text-sm">Save Changes</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Renew Confirm Dialog */}
      <ConfirmDialog
        isOpen={renewConfirmOpen}
        onClose={() => setRenewConfirmOpen(false)}
        onConfirm={handleExecuteRenew}
        loading={submitting}
        title="Confirm Subscription Renewal"
        message={`Are you sure you want to extend subscription for ${selectedSub?.student_name} by ${renewMonths} month(s)?`}
      />

      {/* Edit Confirm Dialog */}
      <ConfirmDialog
        isOpen={editConfirmOpen}
        onClose={() => setEditConfirmOpen(false)}
        onConfirm={handleExecuteEdit}
        loading={submitting}
        title="Confirm Subscription Update"
        message={`Are you sure you want to update subscription for ${editSub?.student_name}?`}
      />

      {/* Cancel Confirm Dialog */}
      <ConfirmDialog
        isOpen={cancelConfirmOpen}
        onClose={() => setCancelConfirmOpen(false)}
        onConfirm={handleExecuteCancel}
        loading={submitting}
        confirmVariant="danger"
        confirmText="Cancel Subscription"
        title="Confirm Cancellation"
        message={`Are you sure you want to cancel subscription for ${cancelSub?.student_name}?`}
      />
    </div>
  );
};

export default SubscriptionsPage;
