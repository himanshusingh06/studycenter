import React, { useState, useEffect } from 'react';
import { 
  Search, LogIn, LogOut, Clock, Users, ShieldCheck, 
  CheckCircle, AlertCircle, QrCode, User, Sparkles
} from 'lucide-react';
import api, { getFileUrl } from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';

const FrontDeskAttendancePage = () => {
  const [occupancy, setOccupancy] = useState(null);
  const [activeSessions, setActiveSessions] = useState([]);
  const [query, setQuery] = useState('');
  const [foundStudent, setFoundStudent] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [actionMessage, setActionMessage] = useState(null); // { type: 'success'|'error', text: '' }
  const [processing, setProcessing] = useState(false);

  const fetchFrontDeskData = async () => {
    try {
      const occRes = await api.get('/attendance/occupancy');
      setOccupancy(occRes.data);

      const actRes = await api.get('/attendance/active-sessions');
      setActiveSessions(actRes.data);
    } catch (err) {
      console.error('Failed to load attendance occupancy data:', err);
    }
  };

  useEffect(() => {
    fetchFrontDeskData();
  }, []);

  const handleSearchStudent = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setSearchError('');
    setFoundStudent(null);
    setActionMessage(null);

    try {
      // Try fetching student by ID/code
      const res = await api.get(`/students/${query.trim()}`);
      setFoundStudent(res.data);
    } catch (err) {
      setSearchError(`No student found matching '${query.trim()}'`);
    }
  };

  const handleCheckIn = async (studentIdCode) => {
    setProcessing(true);
    setActionMessage(null);

    try {
      const res = await api.post('/attendance/check-in', {
        student_identifier: studentIdCode,
        source: 'DESK'
      });
      setActionMessage({
        type: 'success',
        text: `SUCCESS: Checked IN '${res.data.student_name}' at ${new Date(res.data.check_in_time).toLocaleTimeString()}`
      });
      setFoundStudent(null);
      setQuery('');
      fetchFrontDeskData();
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Check-in failed'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCheckOut = async (studentIdCode) => {
    setProcessing(true);
    setActionMessage(null);

    try {
      const res = await api.post('/attendance/check-out', {
        student_identifier: studentIdCode
      });
      setActionMessage({
        type: 'success',
        text: `SUCCESS: Checked OUT '${res.data.student_name}' (Study Duration: ${res.data.duration_formatted})`
      });
      setFoundStudent(null);
      setQuery('');
      fetchFrontDeskData();
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Check-out failed'
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Clock className="h-6 w-6 text-brand-400" />
            <span>Front Desk Attendance Reception</span>
          </h1>
          <p className="text-sm text-slate-400">Fast multi-session student check-in, check-out, and live occupancy counter</p>
        </div>
      </div>

      {/* Live Occupancy KPI Cards */}
      {occupancy && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-900/50 to-slate-900 border border-brand-500/40">
            <span className="text-xs font-bold text-brand-300 uppercase tracking-wider">Students Inside Now</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-white">{occupancy.currently_inside}</span>
              <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Occupied</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Visits</span>
            <div className="mt-2">
              <span className="text-3xl font-extrabold text-white">{occupancy.today_total_visits}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unique Students Today</span>
            <div className="mt-2">
              <span className="text-3xl font-extrabold text-white">{occupancy.today_unique_students}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Study Hours Today</span>
            <div className="mt-2">
              <span className="text-2xl font-extrabold text-brand-400">{occupancy.today_total_hours_formatted}</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Notification Banner */}
      {actionMessage && (
        <div className={`p-4 rounded-2xl border text-sm font-semibold flex items-center space-x-3 shadow-lg ${
          actionMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'
        }`}>
          {actionMessage.type === 'success' ? <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" /> : <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Reception Action Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Search & Quick Action Box */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-6">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Search className="h-5 w-5 text-brand-400" />
              <span>Search Student ID or Mobile</span>
            </h2>

            <form onSubmit={handleSearchStudent} className="flex gap-3">
              <div className="relative flex-1">
                <Search className="h-5 w-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter Student ID (e.g. STU-2026-00001) or Mobile Number..."
                  className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-base text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono font-bold"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-brand-600/25 transition-all"
              >
                Search Student
              </button>
            </form>

            {searchError && (
              <p className="text-xs text-red-400 flex items-center space-x-1">
                <AlertCircle className="h-4 w-4" />
                <span>{searchError}</span>
              </p>
            )}

            {/* Found Student Result Box */}
            {foundStudent && (
              <div className="p-6 bg-slate-950 border-2 border-brand-500/50 rounded-2xl space-y-4 animate-fadeIn">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  <div className="w-20 h-24 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0">
                    {foundStudent.photo_url ? (
                      <img src={getFileUrl(foundStudent.photo_url)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">
                        <User className="h-8 w-8" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 text-center sm:text-left space-y-1">
                    <h3 className="text-xl font-extrabold text-white">{foundStudent.first_name} {foundStudent.last_name}</h3>
                    <p className="text-sm font-mono text-brand-400 font-bold">{foundStudent.student_id}</p>
                    <p className="text-xs text-slate-400">Seat: <strong className="text-amber-400">{foundStudent.seat_number || 'General Desk'}</strong> • Shift: {foundStudent.preferred_timing || 'Full Day'}</p>
                    <div className="pt-2">
                      <StatusBadge status={foundStudent.status} />
                    </div>
                  </div>
                </div>

                {/* Instant Action Buttons */}
                <div className="pt-4 border-t border-slate-800 flex justify-end space-x-4">
                  <button
                    onClick={() => handleCheckIn(foundStudent.student_id)}
                    disabled={processing}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center space-x-2"
                  >
                    <LogIn className="h-5 w-5" />
                    <span>CHECK IN</span>
                  </button>
                  <button
                    onClick={() => handleCheckOut(foundStudent.student_id)}
                    disabled={processing}
                    className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-purple-600/25 transition-all flex items-center justify-center space-x-2"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>CHECK OUT</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Currently Inside Students List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[500px]">
          <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
            <h3 className="font-bold text-white text-sm flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Currently Inside ({activeSessions.length})</span>
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2">
            {activeSessions.length === 0 ? (
              <p className="p-8 text-center text-xs text-slate-500">No active students inside right now.</p>
            ) : (
              activeSessions.map((sess) => (
                <div key={sess.id} className="p-3 hover:bg-slate-800/40 rounded-xl transition-colors flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white text-sm">{sess.student_name}</p>
                    <p className="text-xs font-mono text-brand-400">{sess.student_code} • Seat {sess.seat_number || 'A-12'}</p>
                    <p className="text-[10px] text-slate-500">In at {new Date(sess.check_in_time).toLocaleTimeString()}</p>
                  </div>
                  <button
                    onClick={() => handleCheckOut(sess.student_code)}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center space-x-1"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Check-out</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FrontDeskAttendancePage;
