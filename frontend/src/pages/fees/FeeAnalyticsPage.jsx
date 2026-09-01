import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, AlertTriangle, CheckCircle2, DollarSign, Users, 
  Calendar, CreditCard, ArrowUpRight, BarChart3, PieChart as PieIcon, RefreshCw, Zap
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area 
} from 'recharts';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PrintableReceipt from '../../components/receipts/PrintableReceipt';

const MONTHS = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' },
  { value: 3, label: 'March' }, { value: 4, label: 'April' },
  { value: 5, label: 'May' }, { value: 6, label: 'June' },
  { value: 7, label: 'July' }, { value: 8, label: 'August' },
  { value: 9, label: 'September' }, { value: 10, label: 'October' },
  { value: 11, label: 'November' }, { value: 12, label: 'December' }
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

const FeeAnalyticsPage = () => {
  const currentDate = new Date();
  const [year, setYear] = useState(currentDate.getFullYear());
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [analytics, setAnalytics] = useState(null);
  const [defaulters, setDefaulters] = useState([]);
  const [minDaysFilter, setMinDaysFilter] = useState(1);
  const [loading, setLoading] = useState(true);

  // Quick Collect Modal for defaulters
  const [collectTarget, setCollectTarget] = useState(null);
  const [collectAmount, setCollectAmount] = useState('');
  const [collectMode, setCollectMode] = useState('UPI');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdReceipt, setCreatedReceipt] = useState(null);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const [aRes, dRes] = await Promise.all([
        api.get('/fees/analytics', { params: { year, month } }),
        api.get('/fees/defaulters', { params: { min_days: minDaysFilter } })
      ]);
      setAnalytics(aRes.data);
      setDefaulters(dRes.data);
    } catch (err) {
      console.error('Failed to load fee analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [year, month, minDaysFilter]);

  const handleOpenCollect = (defaulter) => {
    setCollectTarget(defaulter);
    setCollectAmount(defaulter.total_overdue_amount.toString());
    setCollectMode('UPI');
  };

  const handleExecuteCollect = async () => {
    setSubmitting(true);
    try {
      const res = await api.post('/payments/fast-collect', {
        student_id: collectTarget.student_id,
        months_count: collectTarget.overdue_months_count || 1,
        billing_cycle: collectTarget.billing_cycle,
        custom_amount: Number(collectAmount),
        payment_mode: collectMode,
        notes: `Overdue fee clearance for ${collectTarget.student_name}`
      });
      setCreatedReceipt(res.data);
      setConfirmOpen(false);
      setCollectTarget(null);
      fetchAnalyticsData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to record fee collection');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans max-w-7xl mx-auto">
      {/* Header & Month/Year Selectors */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <TrendingUp className="h-6 w-6 text-brand-400" />
            <span>Intelligent Fee Analytics & Defaulters Hub</span>
          </h1>
          <p className="text-sm text-slate-400">Real-time revenue metrics, collection rates, and cycle-aware overdue defaulter tracking</p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-bold focus:outline-none"
          >
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>

          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-bold focus:outline-none"
          >
            {MONTHS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          <button
            onClick={fetchAnalyticsData}
            className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white"
            title="Refresh Analytics"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 5 Executive KPI Metric Cards */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Expected Revenue</span>
            <p className="text-2xl font-extrabold text-white mt-1.5 font-mono">₹{analytics.total_expected_revenue}</p>
            <p className="text-xs text-slate-400 mt-1">{analytics.total_students_count} Active Students</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Total Collected</span>
            <p className="text-2xl font-extrabold text-emerald-400 mt-1.5 font-mono">₹{analytics.total_collected_revenue}</p>
            <p className="text-xs text-slate-400 mt-1">{analytics.collection_rate_percentage}% Collection Rate</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Pending Dues</span>
            <p className="text-2xl font-extrabold text-amber-400 mt-1.5 font-mono">₹{analytics.total_pending_dues}</p>
            <p className="text-xs text-slate-400 mt-1">{analytics.pending_students_count} Students Pending</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-red-500/30 bg-red-500/5">
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Overdue Defaulters</span>
            <p className="text-2xl font-extrabold text-red-400 mt-1.5 font-mono">₹{analytics.total_overdue_dues}</p>
            <p className="text-xs text-red-300 mt-1 font-semibold">{analytics.defaulters_count} Defaulter Accounts</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Advance Paid</span>
            <p className="text-2xl font-extrabold text-purple-300 mt-1.5 font-mono">{analytics.advance_paid_count}</p>
            <p className="text-xs text-slate-400 mt-1">Paid ahead in advance</p>
          </div>
        </div>
      )}

      {/* Visual Recharts Row */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Trend Chart */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">6-Month Collection Trend</h3>
                <p className="text-xs text-slate-400">Monthly Expected vs Actually Collected Revenue (₹)</p>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.monthly_collection_trend}>
                  <defs>
                    <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="expected" name="Expected (₹)" stroke="#3b82f6" fillOpacity={1} fill="url(#colorExpected)" />
                  <Area type="monotone" dataKey="collected" name="Collected (₹)" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCollected)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue by Fee Plan */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Collections by Fee Plan</h3>
              <p className="text-xs text-slate-400">Share of collections across active plans</p>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.plan_distribution}
                    dataKey="collected"
                    nameKey="plan_name"
                    cx="50%"
                    cy="50%"
                    outerRadius={65}
                    innerRadius={35}
                    paddingAngle={4}
                  >
                    {analytics.plan_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 text-xs">
              {analytics.plan_distribution.map((p, idx) => (
                <div key={idx} className="flex justify-between items-center text-slate-300">
                  <div className="flex items-center space-x-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                    <span>{p.plan_name}</span>
                  </div>
                  <span className="font-mono font-bold text-white">₹{p.collected}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Overdue Defaulters Watchlist Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <span>Overdue Defaulters Watchlist ({defaulters.length})</span>
            </h2>
            <p className="text-xs text-slate-400">Students with past-due unpaid accounts (filtered by billing cycle)</p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Filter By:</span>
            <select
              value={minDaysFilter}
              onChange={(e) => setMinDaysFilter(Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value={1}>All Overdue (&gt; 0 Days)</option>
              <option value={7}>Overdue &gt; 7 Days</option>
              <option value={15}>Overdue &gt; 15 Days</option>
              <option value={30}>Overdue &gt; 30 Days (Critical)</option>
            </select>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {defaulters.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
              <p className="font-bold text-white text-base">Zero Defaulters!</p>
              <p className="text-xs text-slate-500">All student accounts are fully settled and within their billing cycles.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-xs font-semibold text-slate-400 uppercase border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Assigned Desk</th>
                    <th className="px-6 py-4">Plan & Cycle</th>
                    <th className="px-6 py-4">Overdue Duration</th>
                    <th className="px-6 py-4">Total Overdue</th>
                    <th className="px-6 py-4">Days Overdue</th>
                    <th className="px-6 py-4">Mobile</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {defaulters.map((d) => (
                    <tr key={d.student_id} className="hover:bg-slate-800/40">
                      <td className="px-6 py-4">
                        <p className="font-bold text-white leading-snug">{d.student_name}</p>
                        <p className="text-xs text-brand-400 font-mono">{d.student_code}</p>
                      </td>
                      <td className="px-6 py-4 font-bold text-amber-400 font-mono">{d.seat_number || 'Flexi'}</td>
                      <td className="px-6 py-4 text-xs">
                        <p className="text-slate-200 font-medium">{d.plan_name}</p>
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 uppercase">
                          {d.billing_cycle}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-white">{d.overdue_months_count} Month(s)</td>
                      <td className="px-6 py-4 font-mono font-extrabold text-red-400">₹{d.total_overdue_amount}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          d.days_overdue > 30 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {d.days_overdue} Days Late
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-300">{d.mobile}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenCollect(d)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-md inline-flex items-center space-x-1"
                        >
                          <DollarSign className="h-3.5 w-3.5" />
                          <span>Collect Now</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Quick Collect Modal for Defaulter */}
      {collectTarget && (
        <Modal isOpen={true} onClose={() => setCollectTarget(null)} title={`Clear Overdue Dues: ${collectTarget.student_name}`}>
          <form onSubmit={(e) => { e.preventDefault(); setConfirmOpen(true); }} className="space-y-4">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1.5 text-slate-300">
              <p><span className="text-slate-500">Student ID:</span> <strong className="font-mono text-brand-400">{collectTarget.student_code}</strong></p>
              <p><span className="text-slate-500">Plan:</span> {collectTarget.plan_name} ({collectTarget.billing_cycle})</p>
              <p><span className="text-slate-500">Total Outstanding Overdue:</span> <strong className="text-red-400 font-mono font-bold text-sm">₹{collectTarget.total_overdue_amount}</strong></p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Collection Amount (₹) *</label>
              <input
                type="number"
                value={collectAmount}
                onChange={(e) => setCollectAmount(e.target.value)}
                required
                min={1}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-lg font-bold text-emerald-400 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Payment Mode *</label>
              <select
                value={collectMode}
                onChange={(e) => setCollectMode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
              >
                <option value="UPI">UPI / QR Code</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Debit / Credit Card</option>
                <option value="BANK_TRANSFER">Net Banking</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
              <button type="button" onClick={() => setCollectTarget(null)} className="px-4 py-2 bg-slate-800 text-slate-400 rounded-xl text-sm">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl text-sm">Proceed to Confirm</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleExecuteCollect}
        loading={submitting}
        title="Confirm Overdue Fee Collection"
        financialDetails={collectTarget ? {
          studentName: collectTarget.student_name,
          studentCode: collectTarget.student_code,
          paymentType: collectTarget.billing_cycle === 'YEARLY' ? 'YEARLY' : 'MONTHLY',
          month: `${collectTarget.overdue_months_count} Overdue Month(s)`,
          amount: collectTarget.total_overdue_amount,
          discount: 0,
          finalAmount: collectAmount,
          mode: collectMode
        } : null}
      />

      {/* Advanced Printable Receipt Modal */}
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

export default FeeAnalyticsPage;
