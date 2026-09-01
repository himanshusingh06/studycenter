import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Search, Edit, Trash2 } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const AttendanceReportsPage = () => {
  const [dateVal, setDateVal] = useState(new Date().toISOString().split('T')[0]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit / Delete states
  const [editSession, setEditSession] = useState(null);
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);

  const [editConfirmOpen, setEditConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/attendance/sessions', { params: { date_val: dateVal } });
      setSessions(res.data);
    } catch (err) {
      console.error('Failed to load attendance sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [dateVal]);

  const handleOpenEdit = (s) => {
    setEditSession(s);
    setEditNotes(s.notes || '');
    setEditStatus(s.status);
  };

  const handleExecuteEdit = async () => {
    setSubmitting(true);
    try {
      await api.put(`/attendance/sessions/${editSession.id}`, {
        notes: editNotes,
        status: editStatus
      });
      setEditConfirmOpen(false);
      setEditSession(null);
      fetchSessions();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update attendance session');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecuteDelete = async () => {
    setSubmitting(true);
    try {
      await api.delete(`/attendance/sessions/${deleteTarget.id}`);
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
      fetchSessions();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete attendance session');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Attendance Session History</h1>
          <p className="text-sm text-slate-400">View detailed check-in, check-out times and study duration logs</p>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-slate-400" />
          <input
            type="date"
            value={dateVal}
            onChange={(e) => setDateVal(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none font-bold"
          />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto mb-2"></div>
            <span>Loading sessions log...</span>
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="text-base font-semibold">No attendance sessions recorded for {dateVal}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs font-semibold text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Check-in Time</th>
                  <th className="px-6 py-4">Check-out Time</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Source</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {sessions.map(s => (
                  <tr key={s.id} className="hover:bg-slate-800/40">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-white leading-snug">{s.student_name}</p>
                        <p className="text-xs text-brand-400 font-mono">{s.student_code}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-emerald-400">{new Date(s.check_in_time).toLocaleTimeString()}</td>
                    <td className="px-6 py-4 font-mono text-xs text-purple-400">{s.check_out_time ? new Date(s.check_out_time).toLocaleTimeString() : 'Active Inside'}</td>
                    <td className="px-6 py-4 font-bold text-white">{s.duration_formatted}</td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-400">{s.source}</td>
                    <td className="px-6 py-4"><StatusBadge status={s.status} /></td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors inline-flex items-center space-x-1"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => { setDeleteTarget(s); setDeleteConfirmOpen(true); }}
                        className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-semibold rounded-lg transition-colors inline-flex items-center space-x-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Session Modal */}
      {editSession && (
        <Modal isOpen={true} onClose={() => setEditSession(null)} title={`Edit Attendance Session: ${editSession.student_name}`}>
          <form onSubmit={(e) => { e.preventDefault(); setEditConfirmOpen(true); }} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Session Notes / Remarks</label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Session Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CORRECTED">CORRECTED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
              <button type="button" onClick={() => setEditSession(null)} className="px-4 py-2 bg-slate-800 text-slate-400 rounded-xl text-sm">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-brand-600 text-white font-bold rounded-xl text-sm">Save Changes</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Confirm Dialog */}
      <ConfirmDialog
        isOpen={editConfirmOpen}
        onClose={() => setEditConfirmOpen(false)}
        onConfirm={handleExecuteEdit}
        loading={submitting}
        title="Confirm Session Update"
        message={`Are you sure you want to save session notes / status update for ${editSession?.student_name}?`}
      />

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleExecuteDelete}
        loading={submitting}
        confirmVariant="danger"
        confirmText="Delete Session"
        title="Confirm Session Deletion"
        message={`Are you sure you want to delete attendance session #${deleteTarget?.id} for ${deleteTarget?.student_name}?`}
      />
    </div>
  );
};

export default AttendanceReportsPage;
