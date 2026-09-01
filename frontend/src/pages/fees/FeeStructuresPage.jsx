import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, CheckCircle2, ShieldAlert, Edit, Trash2 } from 'lucide-react';
import api from '../../api/client';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const FeeStructuresPage = () => {
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    one_time_fee: 1000,
    monthly_fee: 700,
    validity_months: 12
  });

  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [deactivateConfirmOpen, setDeactivateConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchStructures = async () => {
    setLoading(true);
    try {
      const res = await api.get('/fees/structures');
      setStructures(res.data);
    } catch (err) {
      console.error('Failed to fetch fee structures:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStructures();
  }, []);

  const handleOpenCreate = () => {
    setEditTarget(null);
    setForm({ name: '', description: '', one_time_fee: 1000, monthly_fee: 700, validity_months: 12 });
    setModalOpen(true);
  };

  const handleOpenEdit = (fs) => {
    setEditTarget(fs);
    setForm({
      name: fs.name,
      description: fs.description || '',
      one_time_fee: fs.one_time_fee,
      monthly_fee: fs.monthly_fee,
      validity_months: fs.validity_months
    });
    setModalOpen(true);
  };

  const handleExecuteSave = async () => {
    setSubmitting(true);
    try {
      if (editTarget) {
        await api.put(`/fees/structures/${editTarget.id}`, form);
      } else {
        await api.post('/fees/structures', form);
      }
      setSaveConfirmOpen(false);
      setModalOpen(false);
      fetchStructures();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save fee structure');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecuteDeactivate = async () => {
    setSubmitting(true);
    try {
      await api.delete(`/fees/structures/${deactivateTarget.id}`);
      setDeactivateConfirmOpen(false);
      setDeactivateTarget(null);
      fetchStructures();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to deactivate fee structure');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Configurable Fee Structures</h1>
          <p className="text-sm text-slate-400">Define registration fees, monthly subscription rates, and membership terms</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-brand-600/25 transition-all self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Fee Plan</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {structures.map(fs => (
          <div key={fs.id} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 relative flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">{fs.name}</h3>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                  fs.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500'
                }`}>
                  {fs.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2">{fs.description || 'No description'}</p>

              <div className="mt-6 pt-4 border-t border-slate-800 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">One-Time Registration:</span>
                  <span className="font-bold text-white">₹{fs.one_time_fee}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Monthly Subscription:</span>
                  <span className="font-bold text-brand-400">₹{fs.monthly_fee} / mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Validity Term:</span>
                  <span className="text-slate-300 font-medium">{fs.validity_months} Months</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-end space-x-2">
              <button
                onClick={() => handleOpenEdit(fs)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg flex items-center space-x-1"
              >
                <Edit className="h-3.5 w-3.5" />
                <span>Edit</span>
              </button>
              {fs.is_active && (
                <button
                  onClick={() => { setDeactivateTarget(fs); setDeactivateConfirmOpen(true); }}
                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-semibold rounded-lg flex items-center space-x-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Deactivate</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? `Edit Fee Plan: ${editTarget.name}` : 'Create New Fee Structure'}>
        <form onSubmit={(e) => { e.preventDefault(); setSaveConfirmOpen(true); }} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Plan Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              required
              placeholder="e.g. Plan D - Weekend Pass"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="Describe plan features..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">One-Time Fee (₹)</label>
              <input
                type="number"
                value={form.one_time_fee}
                onChange={(e) => setForm(f => ({ ...f, one_time_fee: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Monthly Fee (₹)</label>
              <input
                type="number"
                value={form.monthly_fee}
                onChange={(e) => setForm(f => ({ ...f, monthly_fee: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl text-sm text-slate-400 bg-slate-800">Cancel</button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm">Save Fee Structure</button>
          </div>
        </form>
      </Modal>

      {/* Save Confirm Dialog */}
      <ConfirmDialog
        isOpen={saveConfirmOpen}
        onClose={() => setSaveConfirmOpen(false)}
        onConfirm={handleExecuteSave}
        loading={submitting}
        title="Confirm Save Fee Plan"
        message={`Are you sure you want to save fee structure '${form.name}' with monthly fee ₹${form.monthly_fee}?`}
      />

      {/* Deactivate Confirm Dialog */}
      <ConfirmDialog
        isOpen={deactivateConfirmOpen}
        onClose={() => setDeactivateConfirmOpen(false)}
        onConfirm={handleExecuteDeactivate}
        loading={submitting}
        confirmVariant="danger"
        confirmText="Deactivate Plan"
        title="Confirm Plan Deactivation"
        message={`Are you sure you want to deactivate fee structure '${deactivateTarget?.name}'?`}
      />
    </div>
  );
};

export default FeeStructuresPage;
