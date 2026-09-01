import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, KeyRound, User, Lock, AlertCircle, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState('STAFF'); // STAFF or STUDENT
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!usernameOrEmail || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const data = await login(usernameOrEmail, password);
      if (tab === 'STUDENT') {
        navigate('/student/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (role) => {
    setError('');
    if (role === 'ADMIN') {
      setTab('STAFF');
      setUsernameOrEmail('admin');
      setPassword('Admin@123');
    } else if (role === 'STAFF') {
      setTab('STAFF');
      setUsernameOrEmail('staff1');
      setPassword('Staff@123');
    } else if (role === 'STUDENT') {
      setTab('STUDENT');
      setUsernameOrEmail('stu-2026-00001');
      setPassword('Student@123');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-900/15 via-slate-950 to-slate-950"></div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 relative z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex relative mb-1">
            <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-lg"></div>
            <img 
              src="/buddha-logo.png" 
              alt="Buddha Library" 
              className="h-20 w-20 object-contain rounded-full relative z-10 mx-auto ring-2 ring-amber-400/40 shadow-xl"
            />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Buddha Library</h1>
            <p className="text-xs font-semibold text-amber-400">A Unit of Flair Foundation</p>
            <p className="text-[11px] text-slate-400 font-serif italic mt-0.5">बुद्धम शरणम् गच्छामि।</p>
          </div>
        </div>

        {/* Role Tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => { setTab('STAFF'); setError(''); }}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
              tab === 'STAFF' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Staff / Admin</span>
          </button>
          <button
            type="button"
            onClick={() => { setTab('STUDENT'); setError(''); }}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
              tab === 'STUDENT' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="h-4 w-4" />
            <span>Student Portal</span>
          </button>
        </div>

        {error && (
          <div className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              {tab === 'STUDENT' ? 'Student ID / Username / Email' : 'Username or Email'}
            </label>
            <div className="relative">
              <User className="h-5 w-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder={tab === 'STUDENT' ? 'e.g. STU-2026-00001' : 'admin or staff1'}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <Lock className="h-5 w-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-lg shadow-brand-600/25 transition-all flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
            ) : (
              <>
                <span>Sign In to System</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Fast Login Shortcuts */}
        <div className="pt-4 border-t border-slate-800 text-center space-y-2">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Quick Fill Demo Accounts</p>
          <div className="flex justify-center space-x-2">
            <button
              onClick={() => setDemoCredentials('ADMIN')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Admin Demo
            </button>
            <button
              onClick={() => setDemoCredentials('STAFF')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Staff Demo
            </button>
            <button
              onClick={() => setDemoCredentials('STUDENT')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Student Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
