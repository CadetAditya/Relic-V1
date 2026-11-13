import React, { useState, useEffect } from 'react';
import {
  Shield,
  LayoutDashboard,
  FilePlus,
  FolderKanban,
  Zap,
  CreditCard,
  MapPin,
  Compass,
  Users,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AlertsDrawer from './AlertsDrawer';
import api from '../services/api';

export default function Navbar({
  activeTab,
  setActiveTab,
  collapsed = false,
  setCollapsed = () => {},
  mobileOpen = false,
  setMobileOpen = () => {},
}) {
  const { officer, logout } = useAuth();
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
    { id: 'dashboard', label: 'Operations Desk', icon: LayoutDashboard, mod: 'MOD 02' },
    { id: 'register', label: 'File Complaint', icon: FilePlus, mod: 'MOD 03' },
    { id: 'complaints', label: 'Complaints & Dossiers', icon: FolderKanban, mod: 'MOD 04' },
    { id: 'predict', label: 'Live AI Radar', icon: Zap, mod: 'MOD 05' },
    { id: 'accounts', label: 'Money Trail', icon: CreditCard, mod: 'MOD 07' },
    { id: 'map', label: 'ATM GIS Map', icon: MapPin, mod: 'MOD 06' },
    { id: 'regional', label: 'Zonal Command', icon: Compass, mod: 'MOD 11' },
    { id: 'officers', label: 'Officer Admin', icon: Users, mod: 'MOD 12' },
  ];

  const handleNavClick = (id) => {
    setActiveTab(id);
    if (setMobileOpen) setMobileOpen(false);
  };

  const renderNavContent = (isMobile = false) => {
    const isCompact = !isMobile && collapsed;

    return (
      <div className="flex flex-col h-full">
        {/* Top Header / Branding */}
        <div className="p-4 border-b border-[#2e6250]/70 flex items-center justify-between shrink-0">
          <div
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-3 cursor-pointer group select-none min-w-0"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#20493b] to-[#3a755d] border border-[#488d71] flex items-center justify-center shadow-lg shadow-[#143227]/50 ring-1 ring-[#c5e48d]/20 text-[#c5e48d] group-hover:border-[#c5e48d] transition-all shrink-0">
              <Shield className="w-5 h-5" />
            </div>

            {!isCompact && (
              <div className="min-w-0">
                <div className="flex items-center leading-none">
                  <span className="font-extrabold tracking-tight text-white text-base">RELIC</span>
                </div>
                <div className="text-[9px] font-mono text-[#95b8a5] tracking-wider mt-1 truncate">
                  CASHPOINT INTELLIGENCE
                </div>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          {!isMobile && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              className="p-1.5 rounded-lg text-[#95b8a5] hover:text-white hover:bg-[#20493b] border border-transparent hover:border-[#2e6250] transition-colors cursor-pointer"
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          )}

          {/* Mobile Close Button */}
          {isMobile && (
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-lg text-[#95b8a5] hover:text-white hover:bg-[#20493b] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-3 px-2 space-y-1 overflow-y-auto no-scrollbar">
          <div className={`px-3 py-1 text-[10px] font-mono text-[#95b8a5] tracking-wider uppercase ${isCompact ? 'text-center' : ''}`}>
            {isCompact ? '•••' : 'Navigation Desk'}
          </div>

          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={isCompact ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-mono transition-all cursor-pointer select-none ${
                  isActive
                    ? 'bg-[#285343] text-white font-bold border-l-4 border-l-[#c5e48d] shadow-sm shadow-[#c5e48d]/10'
                    : 'text-[#95b8a5] hover:text-white hover:bg-[#20493b]/70 border-l-4 border-l-transparent'
                } ${isCompact ? 'justify-center px-0' : ''}`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-[#c5e48d]' : 'text-[#95b8a5] group-hover:text-white'
                  }`}
                />

                {!isCompact && (
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <span className="truncate">{item.label}</span>
                    <span
                      className={`text-[9px] font-mono px-1 py-0.2 rounded ${
                        isActive
                          ? 'bg-[#183a2e] text-[#c5e48d] border border-[#c5e48d]/40'
                          : 'text-[#5f8772]'
                      }`}
                    >
                      {item.mod}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Officer Console & Controls (Simple, unboxed) */}
        <div className="p-3 border-t border-[#2e6250]/60 space-y-1 shrink-0">
          {/* Alerts Notification Row */}
          <button
            onClick={() => setAlertsDrawerOpen(true)}
            title="Threat Alerts & Warnings"
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono text-[#cfe0d5] hover:text-white hover:bg-[#20493b]/60 transition-all cursor-pointer ${
              isCompact ? 'justify-center px-0' : ''
            }`}
          >
            <div className="relative shrink-0">
              <Bell className="w-4 h-4 text-[#c5e48d]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-rose-600 text-white font-mono text-[8px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            {!isCompact && (
              <div className="flex-1 flex items-center justify-between text-left">
                <span className="text-[11px]">Threat Alerts</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800/80">
                    {unreadCount} NEW
                  </span>
                )}
              </div>
            )}
          </button>

          {/* Officer Identity (Simple text, unboxed) */}
          {officer && !isCompact && (
            <div className="px-3 py-2 flex items-center gap-2.5 text-xs font-mono">
              <UserCheck className="w-4 h-4 text-[#c5e48d] shrink-0" />
              <div className="text-left min-w-0 flex-1">
                <div className="font-bold text-white text-[11px] leading-tight truncate">
                  {officer.name}
                </div>
                <div className="text-[10px] text-[#95b8a5] flex items-center gap-1.5 mt-0.5 truncate">
                  <span className="text-[#c5e48d] uppercase font-semibold">
                    {officer.role || 'Officer'}
                  </span>
                  <span>•</span>
                  <span className="truncate">{officer.badge_id}</span>
                </div>
              </div>
            </div>
          )}

          {officer && isCompact && (
            <div
              className="flex justify-center py-1.5 text-[#c5e48d]"
              title={`${officer.name} (${officer.role || 'Officer'} - ${officer.badge_id})`}
            >
              <UserCheck className="w-4 h-4" />
            </div>
          )}

          {/* Sign Out Button */}
          <button
            onClick={logout}
            title="Sign out officer session"
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono text-[#95b8a5] hover:text-rose-300 hover:bg-rose-950/30 transition-all cursor-pointer ${
              isCompact ? 'justify-center px-0' : ''
            }`}
          >
            <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
            {!isCompact && <span className="text-[11px]">Sign Out Officer</span>}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* 1. Desktop Left-Hand Navigation Sidebar (Fixed on the Left - Never moves on scroll) */}
      <aside
        className={`hidden lg:flex flex-col fixed top-0 left-0 bottom-0 h-screen bg-[#183a2e]/98 backdrop-blur-xl border-r border-[#2e6250] shadow-2xl z-40 transition-all duration-300 ease-in-out shrink-0 select-none ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {renderNavContent(false)}
      </aside>

      {/* 2. Mobile Left-Hand Slide-Out Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer container on left-hand side */}
          <div className="relative w-72 max-w-[85vw] bg-[#183a2e] border-r border-[#2e6250] h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {renderNavContent(true)}
          </div>
        </div>
      )}

      {/* Slide-over Threat Notifications Panel */}
      <AlertsDrawer
        isOpen={alertsDrawerOpen}
        onClose={() => setAlertsDrawerOpen(false)}
        onSelectComplaint={(complaintId) => {
          setActiveTab('complaints');
          setAlertsDrawerOpen(false);
        }}
      />
    </>
  );
}
