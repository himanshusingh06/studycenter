import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  AlertCircle, Clock, DollarSign, CheckCircle2, Send, FileText, 
  Filter, Search, Download, RefreshCw, Edit, ShieldAlert, Users, 
  CheckSquare, Zap, TrendingUp, MessageSquare, Calendar, ChevronRight,
  Sparkles, X, ExternalLink, ShieldCheck
} from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Modal from '../../components/common/Modal';
import PrintableReceipt from '../../components/receipts/PrintableReceipt';

const MONTHS = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' },
  { value: 3, label: 'March' }, { value: 4, label: 'April' },
  { value: 5, label: 'May' }, { value: 6, label: 'June' },
  { value: 7, label: 'July' }, { value: 8, label: 'August' },
  { value: 9, label: 'September' }, { value: 10, label: 'October' },
  { value: 11, label: 'November' }, { value: 12, label: 'December' }
];

const DuesListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialType = searchParams.get('type') || 'ALL';

  const currentDate = new Date();
  const [duesType, setDuesType] = useState(initialType.toUpperCase());
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [minDaysFilter, setMinDaysFilter] = useState('');
  const [sortBy, setSortBy] = useState('due_date_asc');

  const [structures, setStructures] = useState([]);
  const [duesData, setDuesData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals state
  // 1. Payment Collection
  const [collectTarget, setCollectTarget] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('UPI');
  const [payNotes, setPayNotes] = useState('');
  const [collectConfirmOpen, setCollectConfirmOpen] = useState(false);
  const [createdReceipt, setCreatedReceipt] = useState(null);

  // 2. Reminder Modal
  const [reminderTarget, setReminderTarget] = useState(null);
  const [reminderResult, setReminderResult] = useState(null);
  const [sendingReminder, setSendingReminder] = useState(false);

  // 3. Edit Record Modal
  const [editTarget, setEditTarget] = useState(null);
  const [editDueAmount, setEditDueAmount] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // 4. Bulk Action Modal
  const [bulkActionType, setBulkActionType] = useState(null);
  const [bulkReason, setBulkReason] = useState('');
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const fetchStructures = async () => {
    try {
      const res = await api.get('/fees/structures');
      setStructures(res.data);
    } catch (err) {
      console.error('Failed to fetch fee structures:', err);
    }
  };

  const fetchDuesList = async () => {
    setLoading(true);
    try {
      const res = await api.get('/fees/dues-list', {
        params: {
          dues_type: duesType,
          q: search || undefined,
          year: year ? Number(year) : undefined,
          month: month ? Number(month) : undefined,
          plan_id: planFilter ? Number(planFilter) : undefined,
          min_days: minDaysFilter ? Number(minDaysFilter) : undefined,
          sort_by: sortBy
        }
      });
      setDuesData(res.data);
      setSelectedIds([]);
    } catch (err) {
      console.error('Failed to load dues list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStructures();
  }, []);

  useEffect(() => {
    fetchDuesList();
  }, [duesType, year, month, planFilter, minDaysFilter, sortBy]);

  // Sync tab change with query param
  const handleTabChange = (type) => {
    setDuesType(type);
    setSearchParams({ type: type.toLowerCase() });
  };

  // Checkbox Selection
  const handleSelectAll = (e) => {
    if (e.target.checked && duesData?.items) {
      setSelectedIds(duesData.items.map(item => item.fee_month_id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Handlers for Collection
  const handleOpenCollect = (item) => {
    setCollectTarget(item);
    setPayAmount(item.pending_amount.toString());
    setPayMode('UPI');
    setPayNotes(`Dues clearance for ${item.month_name} ${item.year}`);
  };

  const handleExecuteCollect = async () => {
    setSubmitting(true);
    try {
      const payload = {
        student_id: collectTarget.student_id,
        payment_type: collectTarget.billing_cycle === 'YEARLY' ? 'YEARLY' : 'MONTHLY',
        payment_mode: payMode,
        total_amount: Number(payAmount),
        notes: payNotes,
        items: [
          {
            fee_month_id: collectTarget.fee_month_id,
            description: `Dues Collection - ${collectTarget.month_name} ${collectTarget.year}`,
            amount: Number(payAmount)
          }
        ]
      };
      const res = await api.post('/payments', payload);
      setCreatedReceipt(res.data);
      setCollectConfirmOpen(false);
      setCollectTarget(null);
      fetchDuesList();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to record dues payment');
    } finally {
      setSubmitting(false);
    }
  };

  // Handlers for Reminders
  const handleOpenReminder = async (item) => {
    setReminderTarget(item);
    setSendingReminder(true);
    try {
      const res = await api.post('/fees/dues/send-reminder', {
        student_id: item.student_id,
        fee_month_id: item.fee_month_id,
        reminder_type: 'WHATSAPP'
      });
      setReminderResult(res.data);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to send reminder notification');
      setReminderTarget(null);
    } finally {
      setSendingReminder(false);
    }
  };

  // Handlers for Edit Record
  const handleOpenEdit = (item) => {
    setEditTarget(item);
    setEditDueAmount(item.due_amount.toString());
    setEditStatus(item.status);
    setEditNotes(item.notes || '');
  };

  const handleExecuteEdit = async () => {
    setSubmitting(true);
    try {
      await api.put(`/fees/monthly-grid/${editTarget.fee_month_id}`, {
        due_amount: Number(editDueAmount),
        status: editStatus
      });
      setEditTarget(null);
      fetchDuesList();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update dues record');
    } finally {
      setSubmitting(false);
    }
  };

  // Handlers for Bulk Action
  const handleTriggerBulkAction = (actionType) => {
    if (selectedIds.length === 0) return;
    setBulkActionType(actionType);
    setBulkReason('');
    setBulkConfirmOpen(true);
  };

  const handleExecuteBulkAction = async () => {
    setSubmitting(true);
    try {
      const res = await api.post('/fees/dues/bulk-action', {
        action: bulkActionType,
        fee_month_ids: selectedIds,
        reason: bulkReason
      });
      alert(res.data.message);
      setBulkConfirmOpen(false);
      setSelectedIds([]);
      fetchDuesList();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to execute bulk action');
    } finally {
      setSubmitting(false);
    }
  };

  // Export Dues to CSV
  const handleExportCSV = () => {
    if (!duesData || duesData.items.length === 0) {
      alert('No dues records available to export.');
      return;
    }
    const headers = ['Student ID', 'Name', 'Mobile', 'Seat', 'Plan', 'Month', 'Year', 'Due Date', 'Due Amount', 'Paid Amount', 'Pending Dues', 'Status', 'Days Overdue'];
    const rows = duesData.items.map(i => [
      i.student_code,
      `"${i.student_name}"`,
      i.mobile,
      i.seat_number || 'Flexi',
      `"${i.plan_name}"`,
      i.month_name,
      i.year,
      i.due_date,
      i.due_amount,
      i.paid_amount,
      i.pending_amount,
      i.status,
      i.days_overdue
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Dues_Report_${duesType}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const summary = duesData?.summary;
  const items = duesData?.items || [];

  return (
    <div className="space-y-6 font-sans max-w-7xl mx-auto pb-12">
      {/* Top Title & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertCircle className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Dues & Overdues Operations Hub</h1>
              <p className="text-xs text-slate-400">Unified management portal for student dues, fee defaulters, payment reminders, and clearance operations</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-2 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl transition-all shadow-sm"
          >
            <Download className="h-4 w-4 text-brand-400" />
            <span>Export CSV Ledger</span>
          </button>

          <button
            onClick={fetchDuesList}
            className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl transition-all"
            title="Refresh Dues Matrix"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-brand-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Overview Summary Bar */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-lg">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Pending Dues</span>
              <p className="text-2xl font-extrabold text-amber-400 mt-1 font-mono">₹{summary.total_pending_amount.toLocaleString()}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{summary.pending_students_count} Active Pending Students</p>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-red-500/30 bg-red-500/5 flex items-center justify-between shadow-lg">
            <div>
              <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider">Overdue Defaulters</span>
              <p className="text-2xl font-extrabold text-red-400 mt-1 font-mono">₹{summary.total_overdue_amount.toLocaleString()}</p>
              <p className="text-[11px] text-red-300 font-semibold mt-0.5">{summary.overdue_defaulters_count} Accounts Overdue</p>
            </div>
            <div className="p-3 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
              <ShieldAlert className="h-6 w-6" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-lg">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Avg Overdue Delay</span>
              <p className="text-2xl font-extrabold text-white mt-1 font-mono">{summary.avg_days_overdue} Days</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Average delay for defaulters</p>
            </div>
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
              <Clock className="h-6 w-6" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-lg">
            <div>
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Settled & Waived</span>
              <p className="text-2xl font-extrabold text-emerald-400 mt-1 font-mono">{summary.paid_count + summary.waived_count}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{summary.waived_count} Waived Records</p>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>
        </div>
      )}

      {/* Main Filter Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 overflow-x-auto pb-1">
        {[
          { id: 'ALL', label: 'All Dues', count: summary?.total_dues_count },
          { id: 'OVERDUE', label: '⚠️ Overdue Defaulters', count: summary?.overdue_defaulters_count, highlight: true },
          { id: 'PENDING', label: '⏳ Pending Dues', count: summary?.pending_students_count },
          { id: 'PARTIALLY_PAID', label: '📊 Partially Paid', count: summary?.partially_paid_count },
          { id: 'PAID', label: '✅ Paid & Settled', count: summary?.paid_count },
          { id: 'WAIVED', label: '🛡️ Waived Off', count: summary?.waived_count },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`
              px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex items-center space-x-2 border
              ${duesType === tab.id
                ? (tab.highlight 
                    ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-600/20'
                    : 'bg-brand-600 text-white border-brand-500 shadow-lg shadow-brand-600/20'
                  )
                : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800/80 hover:border-slate-700'
              }
            `}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${duesType === tab.id ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Advanced Filter Controls Grid */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        {/* Search */}
        <div className="lg:col-span-2">
          <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Search Student</label>
          <div className="relative">
            <Search className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchDuesList()}
              placeholder="Name, ID, Mobile, Seat..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* Year */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Year</label>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none"
          >
            <option value="">All Years</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
          </select>
        </div>

        {/* Month */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Month</label>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none"
          >
            <option value="">All Months</option>
            {MONTHS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Plan Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Fee Plan</label>
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
          >
            <option value="">All Plans</option>
            {structures.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
          >
            <option value="due_date_asc">Due Date (Earliest)</option>
            <option value="due_date_desc">Due Date (Latest)</option>
            <option value="amount_desc">Highest Dues Amount</option>
            <option value="overdue_days_desc">Most Days Overdue</option>
            <option value="student_name">Student Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Toolbar */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-brand-900/40 border border-brand-500/40 rounded-2xl flex items-center justify-between animate-fade-in">
          <div className="flex items-center space-x-3">
            <span className="px-2.5 py-1 bg-brand-500 text-white rounded-lg text-xs font-extrabold font-mono">
              {selectedIds.length} Selected
            </span>
            <span className="text-xs text-brand-200 font-medium">Bulk operations applicable on selected dues records</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleTriggerBulkAction('BULK_REMINDER')}
              className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow inline-flex items-center space-x-1.5 transition-all"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Send Bulk Reminders</span>
            </button>

            <button
              onClick={() => handleTriggerBulkAction('BULK_WAIVE')}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow inline-flex items-center space-x-1.5 transition-all"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Waive Selected Dues</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Dues Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-16 text-center text-slate-400">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500 mx-auto mb-3"></div>
            <p className="font-semibold text-sm">Fetching dues & overdue defaulter records...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto opacity-80" />
            <p className="font-bold text-white text-base">No Dues Records Found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are no student fee dues matching the currently selected tab ({duesType}) and filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs font-semibold text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3.5 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === items.length && items.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-slate-700 bg-slate-900 text-brand-600 focus:ring-brand-500 h-4 w-4"
                    />
                  </th>
                  <th className="px-5 py-3.5">Student Info</th>
                  <th className="px-5 py-3.5">Seat & Shift</th>
                  <th className="px-5 py-3.5">Plan & Cycle</th>
                  <th className="px-5 py-3.5">Due Month / Date</th>
                  <th className="px-5 py-3.5">Financials</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Dues Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {items.map((item) => {
                  const isSelected = selectedIds.includes(item.fee_month_id);
                  return (
                    <tr 
                      key={item.fee_month_id} 
                      className={`hover:bg-slate-800/50 transition-colors ${isSelected ? 'bg-brand-500/10' : ''}`}
                    >
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(item.fee_month_id)}
                          className="rounded border-slate-700 bg-slate-900 text-brand-600 focus:ring-brand-500 h-4 w-4"
                        />
                      </td>

                      {/* Student Info */}
                      <td className="px-5 py-4">
                        <div className="flex items-center space-x-3">
                          {item.photo_url ? (
                            <img src={item.photo_url} alt="" className="h-9 w-9 rounded-full object-cover ring-1 ring-slate-700" />
                          ) : (
                            <div className="h-9 w-9 rounded-full bg-brand-600/30 text-brand-400 font-bold text-xs flex items-center justify-center border border-brand-500/30">
                              {item.student_name[0]}
                            </div>
                          )}
                          <div>
                            <Link to={`/students/${item.student_id}`} className="font-bold text-white hover:text-brand-300 leading-snug">
                              {item.student_name}
                            </Link>
                            <div className="flex items-center space-x-2 mt-0.5">
                              <span className="text-[10px] text-brand-400 font-mono font-semibold">{item.student_code}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{item.mobile}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Seat & Shift */}
                      <td className="px-5 py-4 text-xs">
                        <p className="font-bold text-amber-400 font-mono">{item.seat_number || 'Flexi Desk'}</p>
                        <p className="text-slate-400 text-[11px] capitalize">{item.preferred_timing?.replace('_', ' ') || 'Full Day'}</p>
                      </td>

                      {/* Plan & Cycle */}
                      <td className="px-5 py-4 text-xs">
                        <p className="text-slate-200 font-semibold">{item.plan_name}</p>
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 uppercase mt-0.5">
                          {item.billing_cycle}
                        </span>
                      </td>

                      {/* Due Month / Date */}
                      <td className="px-5 py-4 text-xs">
                        <p className="font-bold text-white">{item.month_name} {item.year}</p>
                        <p className="text-[11px] text-slate-400 font-mono">Due: {item.due_date}</p>
                        {item.days_overdue > 0 ? (
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            item.days_overdue > 30 ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          }`}>
                            {item.days_overdue} Days Late
                          </span>
                        ) : (item.days_until_due >= 0 && item.pending_amount > 0) ? (
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                            Due in {item.days_until_due} Days
                          </span>
                        ) : null}
                      </td>

                      {/* Financials */}
                      <td className="px-5 py-4 text-xs font-mono">
                        <p className="text-slate-400 text-[11px]">Due: ₹{item.due_amount}</p>
                        <p className="text-emerald-400 text-[11px]">Paid: ₹{item.paid_amount}</p>
                        <p className={`font-bold text-sm mt-0.5 ${item.pending_amount > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                          Pending: ₹{item.pending_amount}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <StatusBadge status={item.status} />
                      </td>

                      {/* Dues Operations Actions */}
                      <td className="px-5 py-4 text-right space-x-1.5 whitespace-nowrap">
                        {item.pending_amount > 0 && item.status !== 'WAIVED' && (
                          <button
                            onClick={() => handleOpenCollect(item)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-md transition-all inline-flex items-center space-x-1"
                            title="Collect Fee & Clear Dues"
                          >
                            <DollarSign className="h-3.5 w-3.5" />
                            <span>Collect Dues</span>
                          </button>
                        )}

                        {item.pending_amount > 0 && item.status !== 'WAIVED' && (
                          <button
                            onClick={() => handleOpenReminder(item)}
                            className="px-2.5 py-1.5 bg-brand-600/20 hover:bg-brand-600/40 text-brand-300 border border-brand-500/30 text-xs font-semibold rounded-lg transition-colors inline-flex items-center space-x-1"
                            title="Send Digital Dues Reminder"
                          >
                            <Send className="h-3.5 w-3.5" />
                            <span>Reminder</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
                          title="Adjust Dues Record"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal 1: Payment Collection Modal */}
      {collectTarget && (
        <Modal
          isOpen={true}
          onClose={() => setCollectTarget(null)}
          title={`Collect Dues: ${collectTarget.student_name}`}
        >
          <form onSubmit={(e) => { e.preventDefault(); setCollectConfirmOpen(true); }} className="space-y-4 font-sans">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1.5 text-slate-300">
              <p><span className="text-slate-500">Student:</span> <strong className="text-white">{collectTarget.student_name}</strong> ({collectTarget.student_code})</p>
              <p><span className="text-slate-500">Fee Plan:</span> {collectTarget.plan_name} ({collectTarget.billing_cycle})</p>
              <p><span className="text-slate-500">Due Month:</span> {collectTarget.month_name} {collectTarget.year}</p>
              <p><span className="text-slate-500">Outstanding Dues:</span> <strong className="text-red-400 font-mono text-sm">₹{collectTarget.pending_amount}</strong></p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Collection Amount (₹) *</label>
              <input
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                required
                max={collectTarget.pending_amount}
                min={1}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-lg font-bold text-emerald-400 focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Payment Mode *</label>
              <select
                value={payMode}
                onChange={(e) => setPayMode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500"
              >
                <option value="UPI">UPI / QR Code</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Debit / Credit Card</option>
                <option value="BANK_TRANSFER">Net Banking</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Staff Remarks</label>
              <input
                type="text"
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setCollectTarget(null)}
                className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg"
              >
                Review & Confirm Clearance
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal 2: Reminder Notice Modal */}
      {reminderTarget && (
        <Modal
          isOpen={true}
          onClose={() => { setReminderTarget(null); setReminderResult(null); }}
          title={`Payment Reminder Notice: ${reminderTarget.student_name}`}
        >
          <div className="space-y-4 font-sans text-xs">
            {sendingReminder ? (
              <div className="py-8 text-center text-slate-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto mb-2"></div>
                <span>Generating payment reminder notice...</span>
              </div>
            ) : reminderResult ? (
              <div className="space-y-4">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <span className="font-bold text-emerald-400 uppercase tracking-wider text-[10px]">In-App & System Notification Sent</span>
                  <p className="text-slate-300 leading-relaxed font-mono">{reminderResult.reminder_payload?.notice_text}</p>
                </div>

                {reminderResult.whatsapp_url && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-bold text-emerald-400">Dispatch via WhatsApp</p>
                      <p className="text-slate-400 text-[11px]">Send direct WhatsApp alert to {reminderTarget.mobile}</p>
                    </div>
                    <a
                      href={reminderResult.whatsapp_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow inline-flex items-center space-x-1.5"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Open WhatsApp</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => { setReminderTarget(null); setReminderResult(null); }}
                    className="px-4 py-2 bg-slate-800 text-slate-200 font-bold rounded-xl text-xs"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </Modal>
      )}

      {/* Modal 3: Edit Fee Dues Record */}
      {editTarget && (
        <Modal
          isOpen={true}
          onClose={() => setEditTarget(null)}
          title={`Adjust Dues Record: ${editTarget.student_name}`}
        >
          <form onSubmit={(e) => { e.preventDefault(); handleExecuteEdit(); }} className="space-y-4 font-sans text-xs">
            <div>
              <label className="block font-semibold text-slate-300 uppercase mb-1">Total Due Amount (₹)</label>
              <input
                type="number"
                value={editDueAmount}
                onChange={(e) => setEditDueAmount(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 uppercase mb-1">Status Override</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
              >
                <option value="PENDING">PENDING</option>
                <option value="OVERDUE">OVERDUE</option>
                <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
                <option value="PAID">PAID</option>
                <option value="WAIVED">WAIVED OFF</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="px-4 py-2 bg-slate-800 text-slate-400 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs shadow"
              >
                {submitting ? 'Saving...' : 'Save Dues Adjustment'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal 4: Bulk Action Confirmation */}
      {bulkConfirmOpen && (
        <Modal
          isOpen={true}
          onClose={() => setBulkConfirmOpen(false)}
          title={`Confirm Bulk Action: ${bulkActionType}`}
        >
          <div className="space-y-4 font-sans text-xs">
            <p className="text-slate-300">
              You have selected <strong className="text-white font-mono">{selectedIds.length}</strong> fee dues records.
            </p>

            {bulkActionType === 'BULK_WAIVE' && (
              <div>
                <label className="block font-semibold text-slate-300 uppercase mb-1">Reason for Waiving Dues *</label>
                <input
                  type="text"
                  value={bulkReason}
                  onChange={(e) => setBulkReason(e.target.value)}
                  placeholder="e.g. Scholarship waiver, Management approval"
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                />
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setBulkConfirmOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-400 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteBulkAction}
                disabled={submitting || (bulkActionType === 'BULK_WAIVE' && !bulkReason)}
                className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs shadow"
              >
                {submitting ? 'Processing...' : 'Confirm Bulk Execution'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Dialog for Collection */}
      <ConfirmDialog
        isOpen={collectConfirmOpen}
        onClose={() => setCollectConfirmOpen(false)}
        onConfirm={handleExecuteCollect}
        loading={submitting}
        title="Confirm Dues Clearance"
        financialDetails={collectTarget ? {
          studentName: collectTarget.student_name,
          studentCode: collectTarget.student_code,
          paymentType: collectTarget.billing_cycle === 'YEARLY' ? 'YEARLY' : 'MONTHLY',
          month: `${collectTarget.month_name} ${collectTarget.year}`,
          amount: collectTarget.pending_amount,
          discount: 0,
          finalAmount: payAmount,
          mode: payMode
        } : null}
      />

      {/* Receipt Modal */}
      {createdReceipt && (
        <Modal 
          isOpen={true} 
          onClose={() => setCreatedReceipt(null)} 
          title="Official StudyCenter Fee Receipt" 
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

export default DuesListPage;
