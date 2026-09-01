import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  User, Phone, Mail, Calendar, MapPin, CreditCard, Clock, 
  BadgeCheck, FileText, ArrowLeft, Edit, UserX, ShieldCheck, DollarSign, Settings
} from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import StudentIDCard from '../../components/students/StudentIDCard';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const StudentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [structures, setStructures] = useState([]);
  const [payments, setPayments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [feeDues, setFeeDues] = useState([]);
  const [tab, setTab] = useState('OVERVIEW');
  const [loading, setLoading] = useState(true);

  // Edit Profile State
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editConfirmOpen, setEditConfirmOpen] = useState(false);

  // Edit Fee Mapping State
  const [feeMappingOpen, setFeeMappingOpen] = useState(false);
  const [feeMappingForm, setFeeMappingForm] = useState({
    fee_structure_id: null,
    custom_monthly_fee: '',
    fee_discount: 0,
    billing_cycle: 'MONTHLY',
    fee_due_day: 5
  });
  const [feeMappingConfirmOpen, setFeeMappingConfirmOpen] = useState(false);

  const [deactivateConfirmOpen, setDeactivateConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      const [sRes, strRes, pRes, aRes, fRes] = await Promise.all([
        api.get(`/students/${id}`),
        api.get('/fees/structures'),
        api.get('/payments', { params: { student_id: id } }),
        api.get('/attendance/sessions', { params: { student_id: id } }),
        api.get(`/fees/student/${id}`)
      ]);
      setStudent(sRes.data);
      setEditForm(sRes.data);
      setStructures(strRes.data);
      setPayments(pRes.data);
      setAttendance(aRes.data);
      setFeeDues(fRes.data.fee_months || []);
      
      setFeeMappingForm({
        fee_structure_id: sRes.data.fee_structure_id || '',
        custom_monthly_fee: sRes.data.custom_monthly_fee !== null ? sRes.data.custom_monthly_fee : '',
        fee_discount: sRes.data.fee_discount || 0,
        billing_cycle: sRes.data.billing_cycle || 'MONTHLY',
        fee_due_day: sRes.data.fee_due_day || 5
      });
    } catch (err) {
      console.error('Failed to load student profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [id]);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(f => ({ ...f, [name]: value }));
  };

  const handleExecuteUpdate = async () => {
    setSubmitting(true);
    try {
      await api.put(`/students/${student.id}`, editForm);
      setEditConfirmOpen(false);
      setEditOpen(false);
      fetchStudentData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update student profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecuteFeeMappingUpdate = async () => {
    setSubmitting(true);
    try {
      const payload = {
        fee_structure_id: feeMappingForm.fee_structure_id ? Number(feeMappingForm.fee_structure_id) : undefined,
        custom_monthly_fee: feeMappingForm.custom_monthly_fee !== '' ? Number(feeMappingForm.custom_monthly_fee) : undefined,
        fee_discount: Number(feeMappingForm.fee_discount || 0),
        billing_cycle: feeMappingForm.billing_cycle,
        fee_due_day: Number(feeMappingForm.fee_due_day || 5)
      };
      await api.put(`/fees/student/${student.id}/mapping`, payload);
      setFeeMappingConfirmOpen(false);
      setFeeMappingOpen(false);
      fetchStudentData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update fee plan mapping');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecuteDeactivate = async () => {
    setSubmitting(true);
    try {
      await api.delete(`/students/${student.id}`);
      setDeactivateConfirmOpen(false);
      fetchStudentData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to deactivate student');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p className="text-lg font-bold">Student Profile Not Found</p>
        <Link to="/students" className="mt-4 inline-block px-4 py-2 bg-brand-600 text-white rounded-xl text-sm">
          Return to Student Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link to="/students" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-white tracking-tight">{student.first_name} {student.last_name}</h1>
              <StatusBadge status={student.status} />
            </div>
            <p className="text-sm font-mono text-brand-400 font-semibold">{student.student_id}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setFeeMappingOpen(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-xl shadow-lg transition-all"
          >
            <DollarSign className="h-4 w-4" />
            <span>Edit Fee Plan & Rates</span>
          </button>
          <button
            onClick={() => setEditOpen(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
          >
            <Edit className="h-4 w-4" />
            <span>Edit Profile</span>
          </button>
          {student.status === 'ACTIVE' && (
            <button
              onClick={() => setDeactivateConfirmOpen(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-300 text-xs font-bold rounded-xl transition-all"
            >
              <UserX className="h-4 w-4" />
              <span>Deactivate</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setTab('OVERVIEW')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
            tab === 'OVERVIEW' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setTab('FEES')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center space-x-1.5 ${
            tab === 'FEES' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <DollarSign className="h-4 w-4" />
          <span>Fee Ledger ({feeDues.length})</span>
        </button>
        <button
          onClick={() => setTab('PAYMENTS')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center space-x-1.5 ${
            tab === 'PAYMENTS' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          <span>Receipts ({payments.length})</span>
        </button>
        <button
          onClick={() => setTab('ATTENDANCE')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center space-x-1.5 ${
            tab === 'ATTENDANCE' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Attendance ({attendance.length})</span>
        </button>
        <button
          onClick={() => setTab('IDCARD')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center space-x-1.5 ${
            tab === 'IDCARD' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BadgeCheck className="h-4 w-4" />
          <span>Digital ID Pass</span>
        </button>
      </div>

      {/* Tab Content */}
      {tab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Main Brief */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 text-center md:text-left flex flex-col items-center md:items-start">
            <div className="w-32 h-36 rounded-2xl overflow-hidden bg-slate-800 border-2 border-slate-700 shadow-md">
              {student.photo_url ? (
                <img src={student.photo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                  <User className="h-12 w-12" />
                  <span className="text-xs">No Photo</span>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{student.first_name} {student.last_name}</h2>
              <p className="text-xs text-brand-400 font-mono font-semibold">{student.student_id}</p>
              <p className="text-xs text-slate-400 mt-1">Enrolled on {student.enrollment_date}</p>
            </div>
            <div className="w-full pt-3 border-t border-slate-800 space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Assigned Desk:</span>
                <span className="font-bold text-amber-400">{student.seat_number || 'Flexi Desk'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Timing Shift:</span>
                <span className="font-medium text-slate-200">{student.preferred_timing || 'Full Day'}</span>
              </div>
            </div>
          </div>

          {/* Details & Fee Mapping Snapshot */}
          <div className="md:col-span-2 space-y-6">
            {/* Fee Plan Mapping Box */}
            <div className="p-6 bg-slate-900 border border-brand-500/30 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-emerald-400" />
                  <span>Mapped Fee Plan & Pricing</span>
                </h3>
                <button
                  onClick={() => setFeeMappingOpen(true)}
                  className="text-xs text-brand-400 hover:underline font-bold flex items-center space-x-1"
                >
                  <Edit className="h-3.5 w-3.5" />
                  <span>Change Plan / Discount</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Fee Plan:</span>
                  <span className="font-bold text-white text-sm">{student.fee_structure?.name || 'Custom Plan'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Effective Monthly Fee:</span>
                  <span className="font-bold text-emerald-400 font-mono text-sm">
                    ₹{(student.custom_monthly_fee !== null && student.custom_monthly_fee !== undefined ? student.custom_monthly_fee : (student.fee_structure?.monthly_fee || 0)) - (student.fee_discount || 0)} / mo
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Recurring Concession:</span>
                  <span className="font-bold text-amber-400 font-mono text-sm">₹{student.fee_discount || 0}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Billing Cycle:</span>
                  <span className="text-white font-medium">{student.billing_cycle || 'MONTHLY'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Paid-Until Date:</span>
                  <span className="font-mono text-slate-200 font-bold">{student.paid_until_date || 'Not Paid Yet'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Next Due Date:</span>
                  <span className="font-mono text-amber-400 font-bold">{student.next_due_date || 'Immediate'}</span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2">Contact & Personal Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs text-slate-500 block">Mobile Number</span>
                  <span className="font-mono text-white">{student.mobile}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Email Address</span>
                  <span className="text-white">{student.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Gender</span>
                  <span className="text-white">{student.gender || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">City / State</span>
                  <span className="text-white">{student.city || 'Delhi'}, {student.state || 'Delhi'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'FEES' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 font-bold text-white flex justify-between items-center">
            <span>Student Monthly Fee Schedule</span>
            <Link to="/fees/collect" className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow">
              Open Cashier Terminal
            </Link>
          </div>
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-xs font-semibold text-slate-400 uppercase">
              <tr>
                <th className="px-6 py-3">Month / Year</th>
                <th className="px-6 py-3">Due Amount</th>
                <th className="px-6 py-3">Paid Amount</th>
                <th className="px-6 py-3">Pending</th>
                <th className="px-6 py-3">Due Date</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {feeDues.map(fm => (
                <tr key={fm.id} className="hover:bg-slate-800/40">
                  <td className="px-6 py-3 font-bold text-white">{fm.month}/{fm.year}</td>
                  <td className="px-6 py-3">₹{fm.due_amount}</td>
                  <td className="px-6 py-3 text-emerald-400">₹{fm.paid_amount}</td>
                  <td className="px-6 py-3 text-amber-400">₹{fm.pending_amount}</td>
                  <td className="px-6 py-3 text-xs text-slate-400">{fm.due_date}</td>
                  <td className="px-6 py-3 font-sans"><StatusBadge status={fm.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'IDCARD' && (
        <StudentIDCard student={student} />
      )}

      {tab === 'PAYMENTS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 font-bold text-white">Payment Receipt History</div>
          {payments.length === 0 ? (
            <p className="p-8 text-center text-slate-500 text-sm">No payment records found for this student.</p>
          ) : (
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs font-semibold text-slate-400 uppercase">
                <tr>
                  <th className="px-6 py-3">Receipt #</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Mode</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    <td className="px-6 py-3 font-mono font-bold text-brand-400">{p.receipt_number}</td>
                    <td className="px-6 py-3 text-xs">{new Date(p.payment_date).toLocaleDateString()}</td>
                    <td className="px-6 py-3">{p.payment_type}</td>
                    <td className="px-6 py-3 font-medium uppercase text-xs">{p.payment_mode}</td>
                    <td className="px-6 py-3 font-bold text-emerald-400">₹{p.total_amount}</td>
                    <td className="px-6 py-3"><StatusBadge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'ATTENDANCE' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 font-bold text-white">Attendance Sessions Log</div>
          {attendance.length === 0 ? (
            <p className="p-8 text-center text-slate-500 text-sm">No attendance check-in sessions recorded yet.</p>
          ) : (
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs font-semibold text-slate-400 uppercase">
                <tr>
                  <th className="px-6 py-3">Session ID</th>
                  <th className="px-6 py-3">Check In</th>
                  <th className="px-6 py-3">Check Out</th>
                  <th className="px-6 py-3">Duration</th>
                  <th className="px-6 py-3">Source</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {attendance.map(a => (
                  <tr key={a.id} className="hover:bg-slate-800/40">
                    <td className="px-6 py-3 font-mono text-xs">#SESS-{a.id}</td>
                    <td className="px-6 py-3 font-mono text-xs">{new Date(a.check_in_time).toLocaleString()}</td>
                    <td className="px-6 py-3 font-mono text-xs">{a.check_out_time ? new Date(a.check_out_time).toLocaleString() : 'Currently Inside'}</td>
                    <td className="px-6 py-3 font-bold text-brand-300">{a.duration_formatted}</td>
                    <td className="px-6 py-3 text-xs">{a.source}</td>
                    <td className="px-6 py-3"><StatusBadge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Edit Profile Modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title={`Edit Student: ${student.first_name} ${student.last_name}`}>
        <form onSubmit={(e) => { e.preventDefault(); setEditConfirmOpen(true); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">First Name</label>
              <input
                type="text"
                name="first_name"
                value={editForm.first_name || ''}
                onChange={handleEditChange}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={editForm.last_name || ''}
                onChange={handleEditChange}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Mobile Number</label>
              <input
                type="text"
                name="mobile"
                value={editForm.mobile || ''}
                onChange={handleEditChange}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Assigned Seat #</label>
              <input
                type="text"
                name="seat_number"
                value={editForm.seat_number || ''}
                onChange={handleEditChange}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Timing Shift</label>
              <input
                type="text"
                name="preferred_timing"
                value={editForm.preferred_timing || ''}
                onChange={handleEditChange}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Status</label>
              <select
                name="status"
                value={editForm.status || 'ACTIVE'}
                onChange={handleEditChange}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
            <button type="button" onClick={() => setEditOpen(false)} className="px-4 py-2 rounded-xl text-sm text-slate-400 bg-slate-800">Cancel</button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-brand-600 text-white font-bold text-sm">Save Changes</button>
          </div>
        </form>
      </Modal>

      {/* Edit Fee Mapping Modal */}
      <Modal isOpen={feeMappingOpen} onClose={() => setFeeMappingOpen(false)} title={`Map Fee Plan: ${student.first_name} ${student.last_name}`}>
        <form onSubmit={(e) => { e.preventDefault(); setFeeMappingConfirmOpen(true); }} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Select Fee Plan *</label>
            <select
              value={feeMappingForm.fee_structure_id || ''}
              onChange={(e) => setFeeMappingForm(f => ({ ...f, fee_structure_id: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none"
            >
              <option value="">-- Choose Fee Plan --</option>
              {structures.map(fs => (
                <option key={fs.id} value={fs.id}>{fs.name} (Standard: ₹{fs.monthly_fee}/mo)</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Custom Monthly Fee (₹) <span className="text-slate-500 lowercase">(optional override)</span>
              </label>
              <input
                type="number"
                value={feeMappingForm.custom_monthly_fee}
                onChange={(e) => setFeeMappingForm(f => ({ ...f, custom_monthly_fee: e.target.value }))}
                placeholder="Leave blank for plan rate"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Recurring Concession / Discount (₹)</label>
              <input
                type="number"
                value={feeMappingForm.fee_discount}
                onChange={(e) => setFeeMappingForm(f => ({ ...f, fee_discount: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-emerald-400 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Billing Cycle</label>
              <select
                value={feeMappingForm.billing_cycle}
                onChange={(e) => setFeeMappingForm(f => ({ ...f, billing_cycle: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly (3 Months)</option>
                <option value="HALF_YEARLY">Half Yearly (6 Months)</option>
                <option value="YEARLY">Yearly (12 Months)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Fee Due Day of Month</label>
              <input
                type="number"
                min={1}
                max={28}
                value={feeMappingForm.fee_due_day}
                onChange={(e) => setFeeMappingForm(f => ({ ...f, fee_due_day: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
            <button type="button" onClick={() => setFeeMappingOpen(false)} className="px-4 py-2 rounded-xl text-sm text-slate-400 bg-slate-800">Cancel</button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-sm">Save Fee Mapping</button>
          </div>
        </form>
      </Modal>

      {/* Fee Mapping Confirm Dialog */}
      <ConfirmDialog
        isOpen={feeMappingConfirmOpen}
        onClose={() => setFeeMappingConfirmOpen(false)}
        onConfirm={handleExecuteFeeMappingUpdate}
        loading={submitting}
        title="Confirm Fee Plan Re-mapping"
        message={`Are you sure you want to update fee plan mapping and recalculate future dues for student '${student.student_id}' (${student.first_name} ${student.last_name})?`}
      />

      {/* Edit Profile Confirmation Dialog */}
      <ConfirmDialog
        isOpen={editConfirmOpen}
        onClose={() => setEditConfirmOpen(false)}
        onConfirm={handleExecuteUpdate}
        loading={submitting}
        title="Confirm Profile Update"
        message={`Are you sure you want to save modifications to student profile '${student.student_id}' (${editForm.first_name} ${editForm.last_name})?`}
      />

      {/* Deactivate Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deactivateConfirmOpen}
        onClose={() => setDeactivateConfirmOpen(false)}
        onConfirm={handleExecuteDeactivate}
        loading={submitting}
        confirmVariant="danger"
        confirmText="Deactivate Student"
        title="Confirm Student Deactivation"
        message={`Are you sure you want to deactivate student '${student.student_id}' (${student.first_name} ${student.last_name})?`}
      />
    </div>
  );
};

export default StudentDetailPage;
