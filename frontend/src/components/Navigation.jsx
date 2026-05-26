import React from 'react';
import { LayoutDashboard, CreditCard, Bell, LogOut, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navigation = ({ currentPage, setCurrentPage }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'subscriptions', name: 'Subscriptions', icon: CreditCard },
    { id: 'reminders', name: 'Reminders', icon: Bell },
  ];

  return (
    <aside className="w-64 bg-slate-900/80 backdrop-blur-xl border-r border-slate-800/60 flex flex-col justify-between h-screen sticky top-0">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="p-2 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl shadow-lg shadow-indigo-500/20">
            <Wallet className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              SubSpace
            </h1>
            <span className="text-[10px] text-slate-500 font-mono tracking-wider">TRACKER v1.0</span>
          </div>
        </div>

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`h-5 w-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'}`} />
                <span className="font-medium text-sm">{item.name}</span>
                {isActive && (
                  <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-6 border-t border-slate-800/50">
        <div className="flex items-center gap-3 mb-5 p-2 rounded-lg bg-slate-950/40 border border-slate-800/30">
          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center text-white font-bold font-mono text-sm">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-slate-200 truncate">{user?.email}</p>
            <p className="text-[10px] text-slate-500">Premium Account</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all duration-300 font-medium text-sm group"
        >
          <LogOut className="h-5 w-5 group-hover:translate-x-0.5 transition-transform duration-300" />
          Log Out
        </button>
      </div>
    </aside>
  );
};

export default Navigation;
