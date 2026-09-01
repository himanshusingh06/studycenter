import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, UserPlus, Filter, Eye, BadgeCheck, Phone, Mail, Edit, Trash2 } from 'lucide-react';
import api, { getFileUrl } from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const StudentListPage = () => {
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Edit / Deactivate states
  const [editStudent, setEditStudent] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deactivateTarget, setDeactivateTarget] = useState(null);

  const [editConfirmOpen, setEditConfirmOpen] = useState(false);
  const [deactivateConfirmOpen, setDeactivateConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/students', {
        params: {
          q: search,
          status: statusFilter || undefined,
          page,
          page_size: 15
        }
      });
      setStudents(res.data.students);
      setTotal(res.data.total);
    } catch (err) {
      console.error('Failed to fetch students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchStudents();
  };

  const handleOpenEdit = (stu) => {
    setEditStudent(stu);
    setEditForm({ ...stu });
  };

  const handleExecuteEdit = async () => {
    setSubmitting(true);
    try {
      await api.put(`/students/${editStudent.id}`, editForm);
      setEditConfirmOpen(false);
      setEditStudent(null);
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update student profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecuteDeactivate = async () => {
    setSubmitting(true);
    try {
      await api.delete(`/students/${deactivateTarget.id}`);
      setDeactivateConfirmOpen(false);
      setDeactivateTarget(null);
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to deactivate student');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Title & Enroll Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Student Directory</h1>
          <p className="text-sm text-slate-400">Search and manage enrolled study center students ({total} total)</p>
        </div>
        <Link
          to="/students/new"
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-brand-600/25 transition-all self-start md:self-auto"
        >
          <UserPlus className="h-4 w-4" />
          <span>Enroll New Student</span>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row gap-4 justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="h-5 w-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Student ID (e.g. STU-2026-00001), Name, Mobile..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </form>

        <div className="flex items-center space-x-3">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto mb-2"></div>
            <span>Loading student directory...</span>
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="text-base font-semibold">No students found matching your criteria</p>
            <p className="text-xs text-slate-500 mt-1">Try resetting search filters or enroll a new student.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Student ID</th>
                  <th className="px-6 py-4">Student Name</th>
                  <th className="px-6 py-4">Course / Class</th>
                  <th className="px-6 py-4">Seat #</th>
                  <th className="px-6 py-4">Mobile</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {students.map((stu) => (
                  <tr key={stu.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-mono font-semibold text-brand-400">{stu.student_id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-9 w-9 rounded-full bg-brand-600/30 text-brand-300 flex items-center justify-center font-bold text-xs border border-brand-500/20">
                          {stu.photo_url ? (
                            <img src={getFileUrl(stu.photo_url)} alt="" className="w-full h-full object-cover rounded-full" />
                          ) : (
                            stu.first_name[0]
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-white leading-snug">{stu.first_name} {stu.last_name}</p>
                          <p className="text-xs text-slate-500">{stu.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{stu.course || 'N/A'}</td>
                    <td className="px-6 py-4 font-semibold text-amber-400">{stu.seat_number || 'Flexi'}</td>
                    <td className="px-6 py-4 text-slate-400 font-mono text-xs">{stu.mobile}</td>
                    <td className="px-6 py-4"><StatusBadge status={stu.status} /></td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Link
                        to={`/students/${stu.id}`}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Profile</span>
                      </Link>
                      <button
                        onClick={() => handleOpenEdit(stu)}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors inline-flex items-center space-x-1"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      {stu.status === 'ACTIVE' && (
                        <button
                          onClick={() => { setDeactivateTarget(stu); setDeactivateConfirmOpen(true); }}
                          className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-semibold rounded-lg transition-colors inline-flex items-center space-x-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Showing page {page} of {Math.ceil(total / 15) || 1}</span>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-50 text-slate-300 font-semibold"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page * 15 >= total}
              className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-50 text-slate-300 font-semibold"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editStudent && (
        <Modal isOpen={true} onClose={() => setEditStudent(null)} title={`Edit Student: ${editStudent.first_name} ${editStudent.last_name}`}>
          <form onSubmit={(e) => { e.preventDefault(); setEditConfirmOpen(true); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">First Name</label>
                <input
                  type="text"
                  value={editForm.first_name || ''}
                  onChange={(e) => setEditForm(f => ({ ...f, first_name: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Last Name</label>
                <input
                  type="text"
                  value={editForm.last_name || ''}
                  onChange={(e) => setEditForm(f => ({ ...f, last_name: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Mobile Number</label>
                <input
                  type="text"
                  value={editForm.mobile || ''}
                  onChange={(e) => setEditForm(f => ({ ...f, mobile: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Seat Number</label>
                <input
                  type="text"
                  value={editForm.seat_number || ''}
                  onChange={(e) => setEditForm(f => ({ ...f, seat_number: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
              <button type="button" onClick={() => setEditStudent(null)} className="px-4 py-2 bg-slate-800 text-slate-400 rounded-xl text-sm">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-brand-600 text-white font-bold rounded-xl text-sm">Save Modifications</button>
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
        title="Confirm Student Update"
        message={`Are you sure you want to update student details for ${editStudent?.first_name} ${editStudent?.last_name}?`}
      />

      {/* Deactivate Confirm Dialog */}
      <ConfirmDialog
        isOpen={deactivateConfirmOpen}
        onClose={() => setDeactivateConfirmOpen(false)}
        onConfirm={handleExecuteDeactivate}
        loading={submitting}
        confirmVariant="danger"
        confirmText="Deactivate Student"
        title="Confirm Deactivation"
        message={`Are you sure you want to deactivate student ${deactivateTarget?.student_id} (${deactivateTarget?.first_name} ${deactivateTarget?.last_name})?`}
      />
    </div>
  );
};

export default StudentListPage;
