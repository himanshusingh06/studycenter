import React from 'react';
import Modal from './Modal';
import { AlertTriangle, DollarSign } from 'lucide-react';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message,
  confirmText = "Confirm",
  confirmVariant = "primary",
  financialDetails = null,
  loading = false
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="space-y-4">
        {financialDetails ? (
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-2">
            <div className="flex items-center space-x-2 text-brand-400 font-semibold mb-2">
              <DollarSign className="h-5 w-5" />
              <span>Financial Transaction Summary</span>
            </div>
            <div className="text-sm space-y-1 text-slate-300">
              <p><span className="text-slate-400">Student:</span> <strong className="text-white">{financialDetails.studentName}</strong> ({financialDetails.studentCode})</p>
              <p><span className="text-slate-400">Payment Type:</span> {financialDetails.paymentType}</p>
              <p><span className="text-slate-400">Month / Period:</span> {financialDetails.month}</p>
              <p><span className="text-slate-400">Base Amount:</span> ₹{financialDetails.amount}</p>
              <p><span className="text-slate-400">Discount Applied:</span> ₹{financialDetails.discount || 0}</p>
              <div className="pt-2 border-t border-slate-700 flex justify-between items-center text-base font-bold text-emerald-400">
                <span>Final Collection Amount:</span>
                <span>₹{financialDetails.finalAmount}</span>
              </div>
              <p><span className="text-slate-400">Payment Mode:</span> <span className="uppercase text-white font-medium">{financialDetails.mode}</span></p>
            </div>
          </div>
        ) : (
          <div className="flex items-start space-x-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-sm">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <p>{message || "This operation cannot be undone. Please confirm to proceed."}</p>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2 rounded-xl text-sm font-semibold text-white shadow-lg transition-all flex items-center space-x-2 ${
              confirmVariant === 'danger'
                ? 'bg-red-600 hover:bg-red-500 shadow-red-600/20'
                : 'bg-brand-600 hover:bg-brand-500 shadow-brand-600/20'
            }`}
          >
            {loading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-1"></div>}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
