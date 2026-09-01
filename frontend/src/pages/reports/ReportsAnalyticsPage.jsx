import React, { useState, useEffect } from 'react';
import { Download, BarChart3, TrendingUp, Users, DollarSign, CalendarCheck } from 'lucide-react';
import api from '../../api/client';

const ReportsAnalyticsPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/dashboard').then(res => {
      setStats(res.data);
      setLoading(false);
    });
  }, []);

  const handleExportCSV = () => {
    if (!stats) return;
    const csvRows = [
      ['Metric', 'Value'],
      ['Total Active Students', stats.total_active_students],
      ['New Enrollments This Month', stats.new_enrollments_this_month],
      ['Active Subscriptions', stats.active_subscriptions],
      ['Today Collection', stats.today_collection],
      ['This Month Collection', stats.this_month_collection],
      ['Pending Fees', stats.pending_fees],
      ['Overdue Fees', stats.overdue_fees],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `study_center_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Reports & Business Analytics</h1>
          <p className="text-sm text-slate-400">Financial collection breakdown and attendance summary reports</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/20 transition-all self-start md:self-auto"
        >
          <Download className="h-4 w-4" />
          <span>Export Summary CSV</span>
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-emerald-400" />
              <span>Financial Overview</span>
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between p-3 bg-slate-950 rounded-xl">
                <span className="text-slate-400">Today's Collection:</span>
                <span className="font-bold text-emerald-400">₹{stats.today_collection.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-950 rounded-xl">
                <span className="text-slate-400">This Month's Collection:</span>
                <span className="font-bold text-emerald-400">₹{stats.this_month_collection.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-950 rounded-xl">
                <span className="text-slate-400">Total Pending Dues:</span>
                <span className="font-bold text-amber-400">₹{stats.pending_fees.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-950 rounded-xl">
                <span className="text-slate-400">Total Overdue Dues:</span>
                <span className="font-bold text-red-400">₹{stats.overdue_fees.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Users className="h-5 w-5 text-brand-400" />
              <span>Attendance & Membership Metrics</span>
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between p-3 bg-slate-950 rounded-xl">
                <span className="text-slate-400">Total Active Enrolled Students:</span>
                <span className="font-bold text-white">{stats.total_active_students}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-950 rounded-xl">
                <span className="text-slate-400">New Enrollments This Month:</span>
                <span className="font-bold text-brand-400">+{stats.new_enrollments_this_month}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-950 rounded-xl">
                <span className="text-slate-400">Active Subscriptions:</span>
                <span className="font-bold text-emerald-400">{stats.active_subscriptions}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-950 rounded-xl">
                <span className="text-slate-400">Expiring Soon Subscriptions:</span>
                <span className="font-bold text-amber-400">{stats.expiring_subscriptions}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsAnalyticsPage;
