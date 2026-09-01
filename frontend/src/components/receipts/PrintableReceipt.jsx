import React from 'react';
import { Printer, CheckCircle2, ShieldCheck, QrCode, BookOpen } from 'lucide-react';

const PrintableReceipt = ({ receiptData, onClose }) => {
  if (!receiptData) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Printable Sheet Container */}
      <div 
        id="printable-receipt" 
        className="bg-white text-slate-900 p-8 rounded-2xl border border-slate-300 shadow-2xl space-y-6 print:p-6 print:border-none print:shadow-none print:m-0 print:w-full"
        style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}
      >
        {/* Receipt Header */}
        <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <img src="/buddha-logo.png" alt="Buddha Library" className="h-12 w-12 object-contain rounded-full shadow-sm" />
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase leading-tight">
                  BUDDHA <span className="text-amber-600">LIBRARY</span>
                </h1>
                <p className="text-xs text-amber-700 font-bold tracking-wide">A UNIT OF FLAIR FOUNDATION</p>
                <p className="text-[10px] text-slate-500 font-serif italic">बुद्धम शरणम् गच्छामि।</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-600 font-medium pt-1">Flair Foundation Complex, Main Road, New Delhi • Helpline: +91 98765 43210</p>
          </div>

          <div className="text-right space-y-1">
            <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-black rounded-md uppercase tracking-wider border border-emerald-300">
              OFFICIAL FEE RECEIPT
            </span>
            <p className="text-sm font-mono font-bold text-slate-900 mt-1">
              {receiptData.receipt_number}
            </p>
            <p className="text-xs text-slate-600">
              Date: {new Date(receiptData.payment_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Student & Cashier Information Grid */}
        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          <div className="space-y-1.5 border-r border-slate-200 pr-4">
            <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Student Details</p>
            <p className="text-sm font-bold text-slate-900">{receiptData.student_name}</p>
            <p className="font-mono text-blue-700 font-bold">ID: {receiptData.student_code}</p>
            <p className="text-slate-600">Mobile: {receiptData.student_mobile || 'N/A'}</p>
            <p className="text-slate-600">
              Desk / Seat: <strong className="text-slate-900 font-mono">{receiptData.seat_number || 'General Flexi'}</strong> ({receiptData.preferred_timing || 'Full Day'})
            </p>
          </div>

          <div className="space-y-1.5 pl-2">
            <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Payment & Billing Info</p>
            <p className="text-slate-700">
              Fee Plan: <strong className="text-slate-900">{receiptData.plan_name || 'Standard Plan'}</strong>
            </p>
            <p className="text-slate-700">
              Billing Cycle: <strong className="text-slate-900 uppercase">{receiptData.billing_cycle || 'MONTHLY'}</strong>
            </p>
            <p className="text-slate-700">
              Period Covered: <strong className="text-blue-700 font-medium">{receiptData.period_covered || 'Current Cycle'}</strong>
            </p>
            <p className="text-slate-600">
              Cashier: <span className="font-medium text-slate-800">{receiptData.collected_by_name || 'Administrator'}</span>
            </p>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="border border-slate-300 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-300">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Description / Breakdown</th>
                <th className="p-3 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-sans">
              {receiptData.items && receiptData.items.length > 0 ? (
                receiptData.items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-3 text-slate-500 font-mono">{idx + 1}</td>
                    <td className="p-3 font-medium text-slate-800">{it.description}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">₹{it.amount.toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-3 text-slate-500 font-mono">1</td>
                  <td className="p-3 font-medium text-slate-800">
                    {receiptData.period_covered ? `Library Fee (${receiptData.period_covered})` : 'Study Center Fee Collection'}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900">₹{receiptData.total_amount.toFixed(2)}</td>
                </tr>
              )}

              {receiptData.discount_applied > 0 && (
                <tr className="bg-emerald-50 text-emerald-900">
                  <td className="p-3 text-emerald-700 font-mono">•</td>
                  <td className="p-3 font-semibold">Special Concession / Scholarship Discount</td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-700">-₹{receiptData.discount_applied.toFixed(2)}</td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-slate-100 border-t-2 border-slate-900 font-bold">
              <tr>
                <td colSpan={2} className="p-3 text-sm text-slate-900 uppercase font-black">
                  Total Amount Paid:
                </td>
                <td className="p-3 text-right text-base font-mono font-black text-slate-900">
                  ₹{receiptData.total_amount.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Amount in Words Highlight Box */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs flex items-start space-x-2">
          <span className="font-bold text-blue-900 whitespace-nowrap">Amount in Words:</span>
          <span className="font-bold text-blue-900 uppercase font-mono">
            {receiptData.amount_in_words || 'Rupees Only'}
          </span>
        </div>

        {/* Payment Mode & Stamp Footer */}
        <div className="pt-2 flex justify-between items-end text-xs text-slate-600">
          <div className="space-y-1">
            <p>
              Payment Mode: <strong className="uppercase text-slate-900 font-mono px-2 py-0.5 bg-slate-100 rounded border border-slate-300">{receiptData.payment_mode}</strong>
            </p>
            <p>Status: <strong className="text-emerald-700">PAID & VERIFIED</strong></p>
            <p className="text-[10px] text-slate-400 mt-2 italic">
              * Non-refundable & non-transferable. Generated securely via Buddha Library ERP (A Unit of Flair Foundation).
            </p>
          </div>

          <div className="text-center space-y-1">
            <div className="h-12 w-32 border-b-2 border-dashed border-slate-400 mx-auto flex items-end justify-center pb-1">
              <span className="text-[10px] text-slate-400">Digitally Verified</span>
            </div>
            <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Authorized Signatory</p>
          </div>
        </div>
      </div>

      {/* Screen Action Controls (Hidden on Print) */}
      <div className="flex justify-end space-x-3 print:hidden">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition-all"
        >
          Close
        </button>
        <button
          type="button"
          onClick={handlePrint}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-xl shadow-blue-600/30 flex items-center space-x-2 transition-all"
        >
          <Printer className="h-4 w-4" />
          <span>Print Official Receipt</span>
        </button>
      </div>
    </div>
  );
};

export default PrintableReceipt;
