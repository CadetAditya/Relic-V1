import React from 'react';
import { Shield, LogOut, Radio, UserCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ activeTab, setActiveTab }) {
  const { officer, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Operations Desk' },
    { id: 'predict', label: 'Live Prediction Radar' },
    { id: 'complaints', label: 'Complaints Explorer' },
    { id: 'map', label: 'ATM Network Map' },
    { id: 'analytics', label: 'Model Intelligence' },
  ];

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-2 ring-cyan-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-white text-base">RELIC</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800/80">
                v1.0 ML
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 tracking-wider">
              CYBERCRIME EXTRACTION INTERCEPT
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-500/10 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Officer Identity & Logout */}
        <div className="flex items-center gap-3">
          {officer && (
            <div className="hidden sm:flex items-center gap-2.5 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl">
              <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-800/80 flex items-center justify-center text-cyan-400">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-slate-200 leading-tight">
                  {officer.name}
                </div>
                <div className="text-[10px] font-mono text-cyan-400 leading-tight">
                  {officer.badge_id} • {officer.rank}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={logout}
            title="Sign out of portal"
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-950/30 border border-slate-800 hover:border-red-800/50 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-mono"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}

