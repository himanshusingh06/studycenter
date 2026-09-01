import React from 'react';

const StatusBadge = ({ status }) => {
  if (!status) return null;

  const s = String(status).toUpperCase();

  let styles = 'bg-slate-800 text-slate-300 border-slate-700';

  if (s === 'ACTIVE' || s === 'PAID' || s === 'COMPLETED') {
    styles = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  } else if (s === 'PENDING' || s === 'PARTIALLY_PAID') {
    styles = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  } else if (s === 'EXPIRING_SOON' || s === 'SUSPENDED') {
    styles = 'bg-orange-500/10 text-orange-400 border-orange-500/20';
  } else if (s === 'OVERDUE' || s === 'EXPIRED' || s === 'CANCELLED' || s === 'INACTIVE') {
    styles = 'bg-red-500/10 text-red-400 border-red-500/20';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
      {s.replace('_', ' ')}
    </span>
  );
};

export default StatusBadge;
