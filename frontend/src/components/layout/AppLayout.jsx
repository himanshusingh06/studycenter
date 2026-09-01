import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, Users, UserPlus, CreditCard, CalendarCheck, 
  BarChart3, ShieldCheck, LogOut, BookOpen, Clock, Settings, FileText,
  Menu, X, BadgeCheck, ShieldAlert, User, Zap, TrendingUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AppLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = user?.role === 'ADMIN';
  const isStaff = user?.role === 'LIBRARY_STAFF';
  const isStudent = user?.role === 'STUDENT';

  const adminStaffNav = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Front Desk Attendance', path: '/attendance/desk', icon: Clock, highlight: true },
    { name: 'Fast Fee Terminal', path: '/fees/collect', icon: Zap, highlight: true },
    { name: 'Fee Analytics & Defaulters', path: '/fees/analytics', icon: TrendingUp },
    { name: 'Monthly Fee Ledger', path: '/fees/monthly', icon: CreditCard },
    { name: 'Students Directory', path: '/students', icon: Users },
    { name: 'Enroll Student', path: '/students/new', icon: UserPlus },
    { name: 'Fee Plans & Pricing', path: '/fees/structures', icon: BookOpen },
    { name: 'Payments & Receipts', path: '/payments', icon: FileText },
    { name: 'Attendance Reports', path: '/attendance/reports', icon: BarChart3 },
  ];

  if (isAdmin) {
    adminStaffNav.push(
      { name: 'User Accounts', path: '/users', icon: Settings },
      { name: 'Audit Logs', path: '/audit-logs', icon: ShieldCheck }
    );
  }

  const studentNav = [
    { name: 'Student Portal', path: '/student/dashboard', icon: LayoutDashboard },
    { name: 'My Attendance', path: '/student/attendance', icon: Clock },
    { name: 'My Dues & Receipts', path: '/student/fees', icon: CreditCard },
    { name: 'Digital Student ID', path: '/student/id-card', icon: BadgeCheck },
  ];

  const navItems = isStudent ? studentNav : adminStaffNav;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Top Navbar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
        <Link to="/" className="flex items-center space-x-2.5">
          <img src="/buddha-logo.png" alt="Buddha Library Logo" className="h-8 w-8 object-contain rounded-full shadow-sm" />
          <div className="flex flex-col">
            <span className="font-bold text-base text-white leading-none">Buddha Library</span>
            <span className="text-[10px] text-amber-400 font-medium leading-tight">Flair Foundation</span>
          </div>
        </Link>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-400 hover:text-white rounded-lg focus:outline-none"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out md:static md:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <Link to="/" className="hidden md:flex items-center space-x-3 px-5 py-4 border-b border-slate-800 hover:bg-slate-850/50 transition-colors">
          <img src="/buddha-logo.png" alt="Buddha Library Logo" className="h-10 w-10 object-contain rounded-full shadow-md shrink-0 ring-2 ring-amber-400/30" />
          <div className="min-w-0">
            <h1 className="font-bold text-base text-white leading-tight truncate">Buddha Library</h1>
            <p className="text-[11px] text-amber-400 font-medium truncate">A Unit of Flair Foundation</p>
          </div>
        </Link>

        {/* User Brief Banner */}
        <div className="mx-4 my-4 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
            {user?.first_name ? user.first_name[0] : (user?.username ? user.username[0].toUpperCase() : 'U')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username}
            </p>
            <div className="flex items-center space-x-1">
              <span className={`inline-block h-2 w-2 rounded-full ${user?.role === 'ADMIN' ? 'bg-purple-400' : (user?.role === 'LIBRARY_STAFF' ? 'bg-amber-400' : 'bg-emerald-400')}`}></span>
              <p className="text-xs text-slate-400 capitalize">{user?.role?.replace('_', ' ').toLowerCase()}</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150
                  ${isActive 
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25 border border-brand-500/30' 
                    : (item.highlight 
                        ? 'text-brand-300 hover:bg-slate-800/80 border border-brand-500/20 bg-brand-500/5' 
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                      )
                  }
                `}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-white' : (item.highlight ? 'text-brand-400' : 'text-slate-400')}`} />
                <span className="flex-1 truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Logout */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 font-medium text-sm hover:bg-red-500/20 transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
