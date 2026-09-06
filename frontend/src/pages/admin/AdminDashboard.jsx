import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, UserCheck, CreditCard, CalendarCheck, Clock, 
  TrendingUp, DollarSign, AlertCircle, RefreshCw, LogIn, LogOut, Zap, BarChart3
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, 
  Tooltip, CartesianGrid, PieChart, Pie, Cell 
} from 'recharts';
import api from '../../api/client';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/reports/dashboard');
      setStats(res.data);
    } catch (err) {
      setError('Failed to load dashboard analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center justify-between">
        <span>{error || 'Error loading dashboard data'}</span>
        <button onClick={fetchStats} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      {/* Top Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Executive Operations Dashboard</h1>
          <p className="text-sm text-slate-400">Live operational overview of student attendance, fee collections, and study center revenue</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/fees/dues"
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-600/20 transition-all"
          >
            <AlertCircle className="h-4 w-4" />
            <span>Dues List Hub</span>
          </Link>
          <Link
            to="/fees/collect"
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all"
          >
            <Zap className="h-4 w-4" />
            <span>Fast Fee Terminal</span>
          </Link>
          <Link
            to="/fees/analytics"
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Fee Analytics Hub</span>
          </Link>
          <button
            onClick={fetchStats}
            className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Currently Inside */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-brand-900/40 to-slate-900 border border-brand-500/30 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-300 uppercase tracking-wider">Students Inside Now</span>
            <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white">{stats.students_currently_inside}</span>
            <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Active Sessions</span>
          </div>
        </div>

        {/* Card 2: Today's Collection */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Collection</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-emerald-400 font-mono">₹{stats.today_collection.toLocaleString()}</span>
          </div>
        </div>

        {/* Card 3: Monthly Revenue */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">This Month's Collection</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white font-mono">₹{stats.this_month_collection.toLocaleString()}</span>
            <span className="text-xs font-bold text-emerald-400 font-mono">{stats.collection_rate_percentage}% Rate</span>
          </div>
        </div>

        {/* Card 4: Total Active Students */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Students</span>
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white">{stats.total_active_students}</span>
            <span className="text-xs text-slate-400">+{stats.new_enrollments_this_month} new this mo</span>
          </div>
        </div>

        {/* Card 5: Today's Checkins */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg"><LogIn className="h-4 w-4" /></div>
            <div>
              <p className="text-xs text-slate-400">Today Check-ins</p>
              <p className="text-xl font-bold text-white">{stats.today_checkins}</p>
            </div>
          </div>
        </div>

        {/* Card 6: Today's Checkouts */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg"><LogOut className="h-4 w-4" /></div>
            <div>
              <p className="text-xs text-slate-400">Today Check-outs</p>
              <p className="text-xl font-bold text-white">{stats.today_checkouts}</p>
            </div>
          </div>
        </div>

        {/* Card 7: Pending Fees */}
        <Link to="/fees/dues?type=pending" className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/60 transition-all group">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg group-hover:scale-105 transition-transform"><CreditCard className="h-4 w-4" /></div>
            <div>
              <p className="text-xs text-slate-400 group-hover:text-amber-300 transition-colors">Pending Dues →</p>
              <p className="text-xl font-bold text-amber-400 font-mono">₹{stats.pending_fees.toLocaleString()}</p>
            </div>
          </div>
        </Link>

        {/* Card 8: Overdue Defaulters */}
        <Link to="/fees/dues?type=overdue" className="p-4 rounded-xl bg-slate-900/60 border border-red-500/30 hover:border-red-500/60 hover:bg-red-500/10 transition-all group">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-500/10 text-red-400 rounded-lg group-hover:scale-105 transition-transform"><AlertCircle className="h-4 w-4" /></div>
            <div>
              <p className="text-xs text-slate-400 group-hover:text-red-300 transition-colors">Overdue Defaulters →</p>
              <p className="text-xl font-bold text-red-400 font-mono">{stats.defaulters_count} Accounts</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Monthly Revenue Trend */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <h3 className="text-base font-bold text-white">Monthly Revenue Trend (Last 6 Months)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.monthly_revenue_chart}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Daily Attendance Visits */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <h3 className="text-base font-bold text-white">Daily Attendance Check-ins (Last 7 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.daily_attendance_chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Fee Status Distribution */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <h3 className="text-base font-bold text-white">Fee Status Distribution</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.fee_status_chart}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {stats.fee_status_chart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Quick Summary Status */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4 shadow-xl">
          <h3 className="text-base font-bold text-white">Study Center Ledger Health</h3>
          <div className="space-y-3">
            <div className="p-3 bg-slate-950 rounded-xl flex justify-between items-center text-sm">
              <span className="text-slate-400">Paid Up-to-date Students</span>
              <span className="font-bold text-emerald-400">{stats.paid_students_count}</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl flex justify-between items-center text-sm">
              <span className="text-slate-400">Overdue Defaulters</span>
              <span className="font-bold text-red-400">{stats.defaulters_count}</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl flex justify-between items-center text-sm">
              <span className="text-slate-400">New Enrollments This Month</span>
              <span className="font-bold text-brand-400">{stats.new_enrollments_this_month}</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 text-center">Fully managed in PostgreSQL database with real-time audit trail.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
