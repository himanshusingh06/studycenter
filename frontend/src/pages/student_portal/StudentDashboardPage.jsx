import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Clock, BadgeCheck, CreditCard, Calendar, User, Printer, FileText, CheckCircle, ShieldCheck, DollarSign } from 'lucide-react';
import api from '../../api/client';
import StudentIDCard from '../../components/students/StudentIDCard';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import PrintableReceipt from '../../components/receipts/PrintableReceipt';

const StudentDashboardPage = () => {
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [summary, setSummary] = useState(null);
  const [payments, setPayments] = useState([]);
  const [feeDues, setFeeDues] = useState([]);
  const [attendanceSessions, setAttendanceSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Date filter for attendance tab
  const [attDateFilter, setAttDateFilter] = useState('');

  // Determine active tab from current route path
  let activeTab = 'dashboard';
  if (location.pathname.includes('/student/attendance')) activeTab = 'attendance';
  else if (location.pathname.includes('/student/fees')) activeTab = 'fees';
  else if (location.pathname.includes('/student/id-card')) activeTab = 'id-card';

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      const pRes = await api.get('/students/me');
      setProfile(pRes.data);

      const sRes = await api.get('/attendance/my-summary');
      setSummary(sRes.data);

      const payRes = await api.get('/payments');
      setPayments(payRes.data);

      const duesRes = await api.get('/fees/my-dues');
      setFeeDues(duesRes.data);

      const attRes = await api.get('/attendance/sessions');
      setAttendanceSessions(attRes.data);
    } catch (err) {
      console.error('Failed to load student portal:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  const filteredSessions = attDateFilter 
    ? attendanceSessions.filter(s => s.check_in_time.startsWith(attDateFilter))
    : attendanceSessions;

  const effectiveMonthlyFee = profile ? ((profile.custom_monthly_fee !== null && profile.custom_monthly_fee !== undefined ? profile.custom_monthly_fee : (profile.fee_structure?.monthly_fee || 0)) - (profile.fee_discount || 0)) : 0;

  return (
    <div className="space-y-6 font-sans max-w-6xl mx-auto">
      {/* Student Banner Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-brand-900 via-slate-900 to-slate-900 border border-brand-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4 text-center md:text-left">
          <div className="w-16 h-20 rounded-xl overflow-hidden bg-slate-800 border-2 border-brand-400/50 shrink-0">
            {profile?.photo_url ? (
              <img src={profile.photo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500"><User className="h-8 w-8" /></div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Welcome back, {profile?.first_name}!</h1>
            <p className="text-sm font-mono text-brand-300 font-bold">{profile?.student_id}</p>
            <p className="text-xs text-slate-400 mt-1">Assigned Desk: <strong className="text-amber-400">{profile?.seat_number || 'General Desk'}</strong> • {profile?.course || 'Student'}</p>
          </div>
        </div>

        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-center space-y-1">
          <span className="text-xs text-slate-400">Current Occupancy Status</span>
          <div>
            {summary?.is_currently_inside ? (
              <span className="inline-flex items-center px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-extrabold rounded-full animate-pulse">
                Currently Checked In
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 bg-slate-800 text-slate-400 text-xs font-semibold rounded-full">
                Outside Center
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation Buttons */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2">
        <Link
          to="/student/dashboard"
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center space-x-2 ${
            activeTab === 'dashboard' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Overview</span>
        </Link>

        <Link
          to="/student/attendance"
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center space-x-2 ${
            activeTab === 'attendance' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>My Attendance Log ({attendanceSessions.length})</span>
        </Link>

        <Link
          to="/student/fees"
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center space-x-2 ${
            activeTab === 'fees' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          <span>Dues & Payment Receipts ({payments.length})</span>
        </Link>

        <Link
          to="/student/id-card"
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center space-x-2 ${
            activeTab === 'id-card' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BadgeCheck className="h-4 w-4" />
          <span>Digital Student ID Pass</span>
        </Link>
      </div>

      {/* TAB 1: OVERVIEW DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Fee Plan Snapshot Box */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block">Enrolled Fee Plan:</span>
              <strong className="text-white font-bold text-sm">{profile?.fee_structure?.name || 'Standard Plan'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Effective Monthly Fee:</span>
              <strong className="text-emerald-400 font-bold font-mono text-sm">₹{effectiveMonthlyFee} / mo</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Fees Settled Up-to:</span>
              <strong className="text-brand-300 font-mono text-sm">{profile?.paid_until_date || 'Current Cycle'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Next Due Date:</span>
              <strong className="text-amber-400 font-mono text-sm">{profile?.next_due_date || '5th of Month'}</strong>
            </div>
          </div>

          {summary && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Study Hours</span>
                <p className="text-3xl font-extrabold text-brand-400 mt-2">{summary.total_study_hours_formatted}</p>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Visits</span>
                <p className="text-3xl font-extrabold text-white mt-2">{summary.total_visits} Sessions</p>
              </div>
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Session</span>
                <p className="text-3xl font-extrabold text-purple-400 mt-2">{summary.average_session_formatted}</p>
              </div>
            </div>
          )}

          {summary?.active_session && (
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Active Study Session</p>
                <p className="text-lg font-bold text-white mt-1">Checked in at {new Date(summary.active_session.check_in_time).toLocaleTimeString()}</p>
                <p className="text-xs text-slate-400">Source: {summary.active_session.source} • Desk {summary.active_session.seat_number || profile?.seat_number || 'A-12'}</p>
              </div>
              <span className="px-3 py-1 bg-emerald-500 text-slate-950 font-extrabold text-xs rounded-full">ACTIVE INSIDE</span>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 font-bold text-white">Recent Study Sessions</div>
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs font-semibold text-slate-400 uppercase">
                <tr>
                  <th className="px-6 py-3">Check In</th>
                  <th className="px-6 py-3">Check Out</th>
                  <th className="px-6 py-3">Study Duration</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {attendanceSessions.slice(0, 5).map(s => (
                  <tr key={s.id} className="hover:bg-slate-800/40">
                    <td className="px-6 py-3 font-mono text-xs">{new Date(s.check_in_time).toLocaleString()}</td>
                    <td className="px-6 py-3 font-mono text-xs">{s.check_out_time ? new Date(s.check_out_time).toLocaleString() : 'Currently Active'}</td>
                    <td className="px-6 py-3 font-bold text-brand-300">{s.duration_formatted}</td>
                    <td className="px-6 py-3"><StatusBadge status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MY ATTENDANCE LOG */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl">
            <h2 className="font-bold text-white text-base">Attendance History Log</h2>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">Filter Date:</span>
              <input
                type="date"
                value={attDateFilter}
                onChange={(e) => setAttDateFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
              />
              {attDateFilter && (
                <button onClick={() => setAttDateFilter('')} className="text-xs text-brand-400 hover:underline">Clear</button>
              )}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {filteredSessions.length === 0 ? (
              <p className="p-8 text-center text-xs text-slate-500">No attendance sessions match the selected filter.</p>
            ) : (
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-xs font-semibold text-slate-400 uppercase">
                  <tr>
                    <th className="px-6 py-3">Check In Time</th>
                    <th className="px-6 py-3">Check Out Time</th>
                    <th className="px-6 py-3">Study Duration</th>
                    <th className="px-6 py-3">Source</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredSessions.map(s => (
                    <tr key={s.id} className="hover:bg-slate-800/40">
                      <td className="px-6 py-3 font-mono text-xs text-emerald-400">{new Date(s.check_in_time).toLocaleString()}</td>
                      <td className="px-6 py-3 font-mono text-xs text-purple-400">{s.check_out_time ? new Date(s.check_out_time).toLocaleString() : 'Currently Inside'}</td>
                      <td className="px-6 py-3 font-bold text-white">{s.duration_formatted}</td>
                      <td className="px-6 py-3 text-xs text-slate-400">{s.source}</td>
                      <td className="px-6 py-3"><StatusBadge status={s.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DUES & PAYMENT RECEIPTS */}
      {activeTab === 'fees' && (
        <div className="space-y-8">
          {/* Monthly Fee Dues Schedule */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white">Monthly Fee Schedule Ledger</h2>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              {feeDues.length === 0 ? (
                <p className="p-6 text-center text-xs text-slate-500">No fee schedule generated yet.</p>
              ) : (
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950 text-xs font-semibold text-slate-400 uppercase border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-3">Month</th>
                      <th className="px-6 py-3">Due Amount</th>
                      <th className="px-6 py-3">Paid Amount</th>
                      <th className="px-6 py-3">Pending</th>
                      <th className="px-6 py-3">Due Date</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {feeDues.map(d => (
                      <tr key={d.id} className="hover:bg-slate-800/40">
                        <td className="px-6 py-3 font-bold text-white">{d.month_name} {d.year}</td>
                        <td className="px-6 py-3 font-mono">₹{d.due_amount}</td>
                        <td className="px-6 py-3 font-mono text-emerald-400">₹{d.paid_amount}</td>
                        <td className="px-6 py-3 font-mono text-amber-400">₹{d.pending_amount}</td>
                        <td className="px-6 py-3 text-xs font-mono">{d.due_date}</td>
                        <td className="px-6 py-3"><StatusBadge status={d.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Payment Receipts History */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white">Official Payment Receipts</h2>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              {payments.length === 0 ? (
                <p className="p-6 text-center text-xs text-slate-500">No payment receipts recorded yet.</p>
              ) : (
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950 text-xs font-semibold text-slate-400 uppercase border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-3">Receipt #</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Payment Mode</th>
                      <th className="px-6 py-3">Amount</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {payments.map(p => (
                      <tr key={p.id} className="hover:bg-slate-800/40">
                        <td className="px-6 py-3 font-mono font-bold text-brand-400 text-xs">{p.receipt_number}</td>
                        <td className="px-6 py-3 text-xs">{new Date(p.payment_date).toLocaleDateString()}</td>
                        <td className="px-6 py-3 text-xs uppercase font-medium">{p.payment_mode}</td>
                        <td className="px-6 py-3 font-bold text-emerald-400">₹{p.total_amount}</td>
                        <td className="px-6 py-3"><StatusBadge status={p.status} /></td>
                        <td className="px-6 py-3 text-right">
                          <button
                            onClick={() => setSelectedReceipt(p)}
                            className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold rounded-lg inline-flex items-center space-x-1"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            <span>View & Print Receipt</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DIGITAL STUDENT ID CARD */}
      {activeTab === 'id-card' && (
        <StudentIDCard student={profile} />
      )}

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
    </div>
  );
};

export default StudentDashboardPage;
