import React, { useState } from 'react';
import { Shield, LogOut, Radio, UserCheck, AlertCircle, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ activeTab, setActiveTab }) {
  const { officer, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Operations Desk' },
    { id: 'predict', label: 'Live Prediction Radar' },
    { id: 'complaints', label: 'Complaints Explorer' },
    { id: 'map', label: 'ATM Network Map' },
    { id: 'analytics', label: 'Model Intelligence' },
  ];

  return (
    <header className="bg-[#183a2e]/95 backdrop-blur-md border-b border-[#2e6250] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-[#95b8a5] hover:text-white hover:bg-[#235043] transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#285343] to-[#3a755d] border border-[#488d71] flex items-center justify-center shadow-lg shadow-[#143227]/40 ring-1 ring-[#c5e48d]/20 text-[#c5e48d]">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-white text-base">RELIC</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-[#143227] text-[#c5e48d] border border-[#2e6250]">
                v1.0 ML
              </span>
            </div>
            <div className="text-[10px] font-mono text-[#95b8a5] tracking-wider">
              CYBERCRIME EXTRACTION INTERCEPT
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Desktop) */}
        <nav className="hidden md:flex items-center gap-1 bg-[#143227]/90 p-1 rounded-xl border border-[#2e6250]">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#285343] text-white border border-[#c5e48d]/60 shadow-sm shadow-[#c5e48d]/10 font-bold'
                    : 'text-[#95b8a5] hover:text-white hover:bg-[#20493b]'
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
            <div className="hidden sm:flex items-center gap-2.5 bg-[#143227] border border-[#2e6250] px-3 py-1.5 rounded-xl">
              <div className="w-7 h-7 rounded-lg bg-[#20493b] border border-[#3e7260] flex items-center justify-center text-[#c5e48d]">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-white leading-tight">
                  {officer.name}
                </div>
                <div className="text-[10px] font-mono text-[#c5e48d] leading-tight">
                  {officer.badge_id} • {officer.rank}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={logout}
            title="Sign out of portal"
            className="p-2 text-[#95b8a5] hover:text-rose-300 hover:bg-rose-950/40 border border-[#2e6250] hover:border-rose-800/60 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-mono"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#2e6250] bg-[#183a2e] px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#285343] text-white border border-[#c5e48d]/60 font-bold'
                    : 'text-[#95b8a5] hover:text-white hover:bg-[#20493b]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
