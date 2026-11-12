import React, { useState, useEffect } from 'react';
import {
  Shield,
  LogOut,
  Radio,
  UserCheck,
  AlertCircle,
  Menu,
  X,
  Bell,
  Layers,
  Compass,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AlertsDrawer from './AlertsDrawer';
import api from '../services/api';

export default function Navbar({ activeTab, setActiveTab }) {
  const { officer, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [alertsDrawerOpen, setAlertsDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchUnreadAlerts();
    const timer = setInterval(fetchUnreadAlerts, 30000);
    return () => clearInterval(timer);
  }, []);

  const fetchUnreadAlerts = async () => {
    try {
      const data = await api.getAlerts({ unread_only: true, limit: 10 });
      setUnreadCount(data.unread_count || 0);
    } catch (e) {
      // ignore
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Operations Desk' },
    { id: 'register', label: 'File Complaint' },
    { id: 'complaints', label: 'Complaints & Dossiers' },
    { id: 'predict', label: 'Live AI Radar' },
    { id: 'accounts', label: 'Money Trail' },
    { id: 'map', label: 'ATM GIS Map' },
    { id: 'regional', label: 'Zonal Command' },
    { id: 'officers', label: 'Officer Admin' },
  ];

  return (
    <>
      <header className="bg-[#183a2e]/95 backdrop-blur-md border-b border-[#2e6250] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          {/* Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-lg text-[#95b8a5] hover:text-white hover:bg-[#235043] transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 text-left cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#285343] to-[#3a755d] border border-[#488d71] flex items-center justify-center shadow-lg shadow-[#143227]/40 ring-1 ring-[#c5e48d]/20 text-[#c5e48d] group-hover:border-[#c5e48d] transition-all">
                <Shield className="w-4 h-4" />
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-extrabold tracking-tight text-white text-base">RELIC</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#143227] text-[#c5e48d] border border-[#2e6250]">
                    v1.0 ML
                  </span>
                </div>
                <div className="text-[9px] font-mono text-[#95b8a5] tracking-wider mt-0.5">
                  CASHPOINT INTELLIGENCE
                </div>
              </div>
            </button>
          </div>

          {/* Navigation Tabs (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1 bg-[#143227]/90 p-1 rounded-xl border border-[#2e6250] overflow-x-auto">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-medium transition-all whitespace-nowrap cursor-pointer ${
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

          {/* Right Controls: Notifications Bell, Officer Profile & Logout */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Alerts Notification Bell */}
            <button
              onClick={() => setAlertsDrawerOpen(true)}
              title="Threat Alerts & Notifications"
              className="relative p-2 bg-[#143227] hover:bg-[#20493b] text-[#95b8a5] hover:text-[#c5e48d] border border-[#2e6250] hover:border-[#3e7863] rounded-xl transition-all cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white font-mono text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Officer Profile Badge */}
            {officer && (
              <div className="hidden sm:flex items-center gap-2 bg-[#143227] border border-[#2e6250] px-3 py-1.5 rounded-xl">
                <div className="w-7 h-7 rounded-lg bg-[#20493b] border border-[#3e7260] flex items-center justify-center text-[#c5e48d]">
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
                <div className="text-left text-xs font-mono">
                  <div className="font-semibold text-white leading-tight flex items-center gap-1.5">
                    {officer.name}
                    <span className="text-[9px] px-1 py-0.2 rounded bg-[#183a2e] text-[#c5e48d] border border-[#2e6250]">
                      {officer.role || 'Officer'}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#95b8a5] leading-tight">
                    {officer.badge_id} • {officer.zone || 'Punjab'}
                  </div>
                </div>
              </div>
            )}

            {/* Sign Out Button */}
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
          <div className="lg:hidden border-t border-[#2e6250] bg-[#183a2e] px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer flex items-center justify-between ${
                    isActive
                      ? 'bg-[#285343] text-white border border-[#c5e48d]/60 font-bold'
                      : 'text-[#95b8a5] hover:text-white hover:bg-[#20493b]'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && <span className="text-[#c5e48d] text-[10px]">● ACTIVE</span>}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Slide-over Threat Notifications Panel */}
      <AlertsDrawer
        isOpen={alertsDrawerOpen}
        onClose={() => {
          setAlertsDrawerOpen(false);
          fetchUnreadAlerts();
        }}
        onSelectComplaint={(complaintId) => {
          setActiveTab('complaints');
        }}
      />
    </>
  );
}
