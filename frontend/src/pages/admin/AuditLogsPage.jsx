import React, { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import api from '../../api/client';

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/audit').then(res => {
      setLogs(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">System Audit Logs</h1>
        <p className="text-sm text-slate-400">Comprehensive security audit trail of student, fee, and attendance operations</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading audit records...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs font-semibold text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Entity</th>
                  <th className="px-6 py-4">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logs.map(l => (
                  <tr key={l.id} className="hover:bg-slate-800/40">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">{new Date(l.timestamp).toLocaleString()}</td>
                    <td className="px-6 py-4 font-bold text-white">{l.username}</td>
                    <td className="px-6 py-4 font-mono text-xs text-brand-300 font-bold">{l.action}</td>
                    <td className="px-6 py-4 text-xs">{l.entity} (ID: {l.entity_id || 'N/A'})</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400 max-w-md truncate">{l.new_value || l.old_value || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogsPage;
