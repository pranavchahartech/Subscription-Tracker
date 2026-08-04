import React from 'react';
import { LayoutDashboard, CreditCard, Bell, LogOut, Wallet, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { id: 'dashboard',     name: 'Dashboard',     icon: LayoutDashboard },
  { id: 'subscriptions', name: 'Subscriptions', icon: CreditCard },
  { id: 'reminders',    name: 'Reminders',     icon: Bell },
];

const Navigation = ({ currentPage, setCurrentPage }) => {
  const { user, logout } = useAuth();
  const initial = user?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col justify-between h-screen sticky top-0 border-r"
      style={{ background: 'linear-gradient(180deg,#0d1526 0%,#080c14 100%)', borderColor: 'rgba(30,58,95,0.55)' }}>

      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="relative">
            <div className="p-2.5 rounded-xl animate-glow-pulse"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#06b6d4)' }}>
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <Zap className="h-3 w-3 text-amber-400 absolute -top-1 -right-1 animate-bounce" />
          </div>
          <div>
            <h1 className="text-lg font-bold gradient-text tracking-tight">SubSpace</h1>
            <span className="text-[10px] font-mono tracking-widest" style={{ color:'#334155' }}>TRACKER v2.0</span>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="space-y-1 stagger-children">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group relative animate-slide-up ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
                style={isActive ? {
                  background: 'linear-gradient(135deg,rgba(124,58,237,0.25),rgba(6,182,212,0.15))',
                  borderColor: 'rgba(124,58,237,0.4)',
                  border: '1px solid rgba(124,58,237,0.4)',
                } : {}}
              >
                {/* Active glow dot */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r-full"
                    style={{ background: 'linear-gradient(180deg,#7c3aed,#06b6d4)' }} />
                )}
                <Icon className={`h-4.5 w-4.5 transition-all duration-300 ${
                  isActive ? 'text-violet-400' : 'text-slate-500 group-hover:text-violet-400 group-hover:scale-110'
                }`} style={{ height: '1.125rem', width: '1.125rem' }} />
                <span>{item.name}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#06b6d4)' }} />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User + Logout */}
      <div className="p-5 border-t" style={{ borderColor: 'rgba(30,58,95,0.55)' }}>
        <div className="flex items-center gap-3 mb-4 p-3 rounded-xl"
          style={{ background: 'rgba(13,21,38,0.6)', border: '1px solid rgba(30,58,95,0.4)' }}>
          <div className="h-9 w-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#06b6d4)' }}>
            {initial}
          </div>
          <div className="overflow-hidden flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: '#e2eaf5' }}>{user?.email}</p>
            <p className="text-[10px] font-mono" style={{ color: '#334155' }}>Pro Account</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group"
          style={{ color: '#64748b', border: '1px solid transparent' }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#f43f5e';
            e.currentTarget.style.background = 'rgba(244,63,94,0.08)';
            e.currentTarget.style.borderColor = 'rgba(244,63,94,0.2)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = '#64748b';
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'transparent';
          }}
        >
          <LogOut className="h-4 w-4 group-hover:translate-x-0.5 transition-transform duration-300" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Navigation;
