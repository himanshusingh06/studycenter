import React, { useState, useEffect } from 'react';
import { Settings, UserPlus, ShieldCheck } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [createConfirmOpen, setCreateConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'LIBRARY_STAFF'
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleExecuteCreate = async () => {
    setSubmitting(true);
    try {
      await api.post('/users', form);
      setCreateConfirmOpen(false);
      setModalOpen(false);
      setForm({ username: '', email: '', password: '', role: 'LIBRARY_STAFF' });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create user account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System User Accounts</h1>
          <p className="text-sm text-slate-400">Manage admin and library staff permissions</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm rounded-xl shadow-lg transition-all self-start md:self-auto"
        >
          <UserPlus className="h-4 w-4" />
          <span>Create Staff Account</span>
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading user accounts...</div>
        ) : (
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-xs font-semibold text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">User ID</th>
                <th className="px-6 py-4">Username</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-800/40">
                  <td className="px-6 py-4 font-mono font-bold text-brand-400">#{u.id}</td>
                  <td className="px-6 py-4 font-bold text-white">{u.username}</td>
                  <td className="px-6 py-4 text-slate-300">{u.email}</td>
                  <td className="px-6 py-4 font-semibold uppercase text-xs text-brand-300">{u.role}</td>
                  <td className="px-6 py-4"><StatusBadge status={u.is_active ? 'ACTIVE' : 'INACTIVE'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Staff Account">
        <form onSubmit={(e) => { e.preventDefault(); setCreateConfirmOpen(true); }} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Username *</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm(f => ({ ...f, username: e.target.value }))}
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Email Address *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Password *</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Role *</label>
            <select
              value={form.role}
              onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
            >
              <option value="LIBRARY_STAFF">LIBRARY_STAFF</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-400 rounded-xl text-sm">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-brand-600 text-white font-bold rounded-xl text-sm">Review & Save Account</button>
          </div>
        </form>
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={createConfirmOpen}
        onClose={() => setCreateConfirmOpen(false)}
        onConfirm={handleExecuteCreate}
        loading={submitting}
        title="Confirm User Account Creation"
        message={`Are you sure you want to create account for user '${form.username}' with role ${form.role}?`}
      />
    </div>
  );
};

export default UserManagementPage;
