import React, { useState } from 'react';
import { 
  Search, CreditCard, DollarSign, Calendar, User, CheckCircle2, 
  AlertTriangle, ShieldCheck, Printer, ArrowRight, Sparkles, RefreshCw, Zap
} from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PrintableReceipt from '../../components/receipts/PrintableReceipt';

const FeeCollectionTerminalPage = () => {
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [feeProfile, setFeeProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Fast Collection Form State
  const [presetMonths, setPresetMonths] = useState(1);
  const [customAmount, setCustomAmount] = useState('');
  const [discountApplied, setDiscountApplied] = useState(0);
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [notes, setNotes] = useState('');
  
  // Modals & Confirmation
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdReceipt, setCreatedReceipt] = useState(null);

  // Fast Student Search
  const handleSearch = async (val) => {
    setSearch(val);
    if (!val || val.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await api.get('/students', { params: { q: val.trim(), page_size: 10 } });
      setSearchResults(res.data.students || []);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectStudent = async (student) => {
    setSelectedStudent(student);
    setSearchResults([]);
    setSearch(`${student.first_name} ${student.last_name} (${student.student_id})`);
    fetchStudentFeeProfile(student.id);
  };

  const fetchStudentFeeProfile = async (studentId) => {
    setLoadingProfile(true);
    try {
      const res = await api.get(`/fees/student/${studentId}`);
      setFeeProfile(res.data);
      
      // Auto-configure duration according to student's billing cycle
      if (res.data.billing_cycle === 'YEARLY') {
        setPresetMonths(12);
        setNotes(`Annual 1-Year Fee Collection for ${res.data.student_name}`);
      } else if (res.data.billing_cycle === 'QUARTERLY') {
        setPresetMonths(3);
        setNotes(`Quarterly Fee Collection for ${res.data.student_name}`);
      } else {
        setPresetMonths(1);
        setNotes(`Monthly Fee Collection for ${res.data.student_name}`);
      }
      
      setCustomAmount('');
      setDiscountApplied(0);
    } catch (err) {
      console.error('Failed to load fee profile:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const effectiveMonthly = feeProfile ? feeProfile.effective_monthly_fee : 0;
  const standardTotal = presetMonths > 0 ? (effectiveMonthly * presetMonths) : Number(customAmount || 0);
  const netPayable = Math.max(0, (customAmount !== '' ? Number(customAmount) : standardTotal) - Number(discountApplied || 0));

  const handleExecutePayment = async () => {
    setSubmitting(true);
    try {
      const payload = {
        student_id: feeProfile.student_id,
        months_count: Number(presetMonths),
        billing_cycle: feeProfile.billing_cycle,
        custom_amount: customAmount !== '' ? Number(customAmount) : undefined,
        discount_applied: Number(discountApplied || 0),
        payment_mode: paymentMode,
        notes: notes || `Fee collection for ${presetMonths} month(s)`
      };
      const res = await api.post('/payments/fast-collect', payload);
      setCreatedReceipt(res.data);
      setConfirmOpen(false);
      
      // Re-fetch updated profile to synchronize live status
      await fetchStudentFeeProfile(feeProfile.student_id);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to collect payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Zap className="h-6 w-6 text-amber-400" />
            <span>Intelligent Cashier & Fee Collection Terminal</span>
          </h1>
          <p className="text-sm text-slate-400">
            Cycle-aware cashier desk for collecting Monthly, Quarterly, or Yearly fees with live status sync & official receipt printing
          </p>
        </div>
      </div>

      {/* Student Lookup Search Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl relative shadow-xl">
        <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
          Student Quick Lookup (Scan QR Code / Search Name / ID / Seat / Phone)
        </label>
        <div className="relative">
          <Search className="h-5 w-5 text-brand-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="e.g. STU-2026-00001, Rahul Sharma, 9876543210, Desk A-12..."
            className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl text-base text-white placeholder-slate-500 focus:outline-none transition-all font-medium"
          />
          {searching && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin rounded-full h-4 w-4 border-b-2 border-brand-500"></div>
          )}
        </div>

        {/* Live Search Autocomplete Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute left-4 right-4 top-full mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 max-h-72 overflow-y-auto divide-y divide-slate-800">
            {searchResults.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => handleSelectStudent(st)}
                className="w-full px-4 py-3 text-left hover:bg-slate-800/80 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-9 w-9 rounded-full bg-brand-600/30 text-brand-300 flex items-center justify-center font-bold text-xs border border-brand-500/20">
                    {st.first_name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">{st.first_name} {st.last_name}</p>
                    <p className="text-xs text-brand-400 font-mono">{st.student_id} • Desk {st.seat_number || 'Flexi'}</p>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <span className="text-slate-400 font-mono">{st.mobile}</span>
                  <div className="mt-0.5"><StatusBadge status={st.status} /></div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Cashier Workspace */}
      {loadingProfile ? (
        <div className="p-16 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto mb-2"></div>
          <span>Loading student fee account...</span>
        </div>
      ) : feeProfile ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Student Financial Snapshot */}
          <div className="space-y-6">
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-xl">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-20 rounded-xl overflow-hidden bg-slate-800 border-2 border-slate-700 shrink-0">
                  {feeProfile.photo_url ? (
                    <img src={feeProfile.photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500"><User className="h-8 w-8" /></div>
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white leading-tight">{feeProfile.student_name}</h2>
                  <p className="text-xs font-mono text-brand-400 font-bold">{feeProfile.student_code}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-brand-500/20 text-brand-300 border border-brand-500/30">
                      {feeProfile.billing_cycle} CYCLE
                    </span>
                    <span className="text-xs text-amber-400 font-mono font-bold">Desk {feeProfile.seat_number || 'Flexi'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Assigned Plan:</span>
                  <span className="font-bold text-white">{feeProfile.plan_name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Monthly Effective Rate:</span>
                  <span className="font-bold text-brand-400 font-mono">₹{feeProfile.effective_monthly_fee} / mo</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Annual 1-Year Rate:</span>
                  <span className="font-bold text-purple-400 font-mono">₹{feeProfile.annual_fee_estimate} / yr</span>
                </div>
                {feeProfile.fee_discount > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-800/50 text-emerald-400">
                    <span>Monthly Concession:</span>
                    <span className="font-bold font-mono">-₹{feeProfile.fee_discount}</span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Paid-Until Date:</span>
                  <span className="font-mono font-bold text-slate-200">{feeProfile.paid_until_date || 'Not Paid Yet'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Next Due Date:</span>
                  <span className="font-mono font-bold text-amber-400">{feeProfile.next_due_date || 'Immediate'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Total Lifetime Paid:</span>
                  <span className="font-mono text-emerald-400 font-bold">₹{feeProfile.total_lifetime_paid}</span>
                </div>
              </div>
            </div>

            {/* Live Synchronized Dues Status Card */}
            <div className={`p-6 rounded-2xl border shadow-xl ${
              feeProfile.is_fee_settled
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                : 'bg-red-500/10 border-red-500/40 text-red-300'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider">Account Status</span>
                {feeProfile.is_fee_settled ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>FEES SETTLED</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-red-500/20 text-red-300 border border-red-500/30 flex items-center space-x-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>PENDING DUES</span>
                  </span>
                )}
              </div>
              <p className="text-3xl font-extrabold font-mono mt-2 text-white">₹{feeProfile.current_pending_dues}</p>
              <p className="text-xs mt-2">
                {feeProfile.is_fee_settled ? (
                  <span className="text-emerald-400">Fees are paid up-to-date up to {feeProfile.paid_until_date || 'current cycle'}.</span>
                ) : (
                  <span className="text-red-400 font-semibold">{feeProfile.overdue_months_count} month(s) pending payment.</span>
                )}
              </p>
            </div>
          </div>

          {/* Right Column: Intelligent Collection Box & Ledger */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-emerald-400" />
                  <span>Configure Fee Collection ({feeProfile.billing_cycle} Student)</span>
                </h3>
                <span className="text-xs text-slate-400">
                  Rate: <strong className="text-emerald-400 font-mono">₹{effectiveMonthly}/mo</strong>
                </span>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); setConfirmOpen(true); }} className="space-y-5">
                {/* Cycle Presets */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                    Select Collection Cycle Duration
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { count: 1, label: '1 Month', tag: 'Monthly' },
                      { count: 3, label: '3 Months', tag: 'Quarterly' },
                      { count: 6, label: '6 Months', tag: 'Half-Yearly' },
                      { count: 12, label: '12 Months', tag: 'Annual / Yearly' },
                      { count: 24, label: '2 Years', tag: '2-Year Plan' },
                    ].map((opt) => (
                      <button
                        key={opt.count}
                        type="button"
                        onClick={() => { 
                          setPresetMonths(opt.count); 
                          setCustomAmount(''); 
                          setNotes(`${opt.tag} Fee Collection (${opt.count} mos) for ${feeProfile.student_name}`);
                        }}
                        className={`py-3 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                          presetMonths === opt.count && customAmount === ''
                            ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg ring-2 ring-emerald-500/20'
                            : (feeProfile.billing_cycle === 'YEARLY' && opt.count === 12) || (feeProfile.billing_cycle === 'QUARTERLY' && opt.count === 3)
                              ? 'bg-slate-950 border-brand-500/50 text-brand-300 hover:border-brand-400'
                              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-[10px] text-slate-400 font-normal">{opt.tag}</div>
                        <div className="font-bold text-sm mt-0.5">{opt.label}</div>
                        <div className="text-[11px] font-mono text-emerald-300 mt-1">₹{effectiveMonthly * opt.count}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Amount / Concession Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                      Custom Amount Override (₹) <span className="text-slate-500 lowercase">(optional)</span>
                    </label>
                    <input
                      type="number"
                      value={customAmount}
                      onChange={(e) => { setCustomAmount(e.target.value); if (e.target.value) setPresetMonths(0); }}
                      placeholder={`Calculated: ₹${standardTotal}`}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono focus:border-brand-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                      Special Concession / Instant Discount (₹)
                    </label>
                    <input
                      type="number"
                      value={discountApplied}
                      onChange={(e) => setDiscountApplied(Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-emerald-400 font-mono focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Payment Mode Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Payment Mode *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'UPI', label: 'UPI / QR Code' },
                      { id: 'CASH', label: 'Cash Receipt' },
                      { id: 'CARD', label: 'Debit / Credit Card' },
                      { id: 'BANK_TRANSFER', label: 'Net Banking / NEFT' },
                    ].map(mode => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setPaymentMode(mode.id)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                          paymentMode === mode.id
                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Remarks / Note</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Annual fee collection paid via PhonePe UPI"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none"
                  />
                </div>

                {/* Net Payable Summary & Submit Button */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-semibold">Net Collection Amount:</span>
                    <p className="text-3xl font-extrabold font-mono text-emerald-400">₹{netPayable}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Mode: <strong className="text-white uppercase">{paymentMode}</strong></p>
                  </div>

                  <button
                    type="submit"
                    disabled={netPayable <= 0}
                    className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-xl shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all"
                  >
                    <CreditCard className="h-5 w-5" />
                    <span>Review & Collect Fee</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Fee Month History Ledger */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-4 border-b border-slate-800 font-bold text-white text-sm flex justify-between items-center">
                <span>Student Fee Schedule Ledger</span>
                <span className="text-xs text-slate-400 font-normal">Shows live status per month</span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-semibold sticky top-0">
                    <tr>
                      <th className="px-4 py-2.5">Month</th>
                      <th className="px-4 py-2.5">Due Amount</th>
                      <th className="px-4 py-2.5">Paid Amount</th>
                      <th className="px-4 py-2.5">Pending</th>
                      <th className="px-4 py-2.5">Due Date</th>
                      <th className="px-4 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {feeProfile.fee_months.map(fm => (
                      <tr key={fm.id} className="hover:bg-slate-800/40">
                        <td className="px-4 py-2.5 font-bold text-white">{fm.month}/{fm.year}</td>
                        <td className="px-4 py-2.5">₹{fm.due_amount}</td>
                        <td className="px-4 py-2.5 text-emerald-400">₹{fm.paid_amount}</td>
                        <td className="px-4 py-2.5 text-amber-400">₹{fm.pending_amount}</td>
                        <td className="px-4 py-2.5 text-slate-400">{fm.due_date}</td>
                        <td className="px-4 py-2.5 font-sans"><StatusBadge status={fm.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-16 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-3 shadow-xl">
          <DollarSign className="h-12 w-12 text-slate-600 mx-auto" />
          <h2 className="text-base font-bold text-white">Search Student to Begin Cashier Fee Collection</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Scan student digital card or search student name, ID, or desk above to inspect dues and collect payment instantly.
          </p>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleExecutePayment}
        loading={submitting}
        title="Confirm Payment Collection"
        financialDetails={feeProfile ? {
          studentName: feeProfile.student_name,
          studentCode: feeProfile.student_code,
          paymentType: presetMonths >= 12 ? "YEARLY" : (presetMonths === 3 ? "QUARTERLY" : "MONTHLY"),
          month: `${presetMonths} Month(s) Cycle`,
          amount: standardTotal,
          discount: discountApplied,
          finalAmount: netPayable,
          mode: paymentMode
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

export default FeeCollectionTerminalPage;
