import React, { useEffect, useState } from 'react';
import {
  Bell,
  X,
  AlertTriangle,
  Zap,
  Clock,
  UserCheck,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import api from '../services/api';

export default function AlertsDrawer({ isOpen, onClose, setActiveTab, setSelectedComplaintId }) {
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await api.getAlerts();
      setAlerts(res.alerts || []);
      setUnreadCount(res.unread_count || 0);
    } catch (e) {
      console.error('Failed to load alerts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAlerts();
    }
  }, [isOpen]);

  const handleMarkAsRead = async (alertId) => {
    try {
      await api.markAlertRead(alertId);
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, is_read: 1 } : a))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {
      console.error('Failed to mark alert as read:', e);
    }
  };

  const handleAction = (alert) => {
    if (alert.complaint_id && setSelectedComplaintId) {
      setSelectedComplaintId(alert.complaint_id);
    }
    if (alert.alert_type === 'NEW_PREDICTION' || alert.alert_type === 'APPROACHING_WINDOW') {
      setActiveTab('predict');
    } else {
      setActiveTab('complaints');
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer Body */}
      <div className="relative w-full max-w-md bg-[#183a2e] border-l border-[#2e6250] shadow-2xl h-full flex flex-col z-10 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#2e6250] flex items-center justify-between bg-[#143227]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#20493b] border border-[#3e7260] flex items-center justify-center text-[#c5e48d]">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono tracking-widest text-[#c5e48d] uppercase">
                TACTICAL INTELLIGENCE NOTIFICATIONS
              </div>
              <h2 className="text-base font-black text-white font-mono uppercase">
                ACTIVE ALERTS ({unreadCount} UNREAD)
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#95b8a5] hover:text-white hover:bg-[#20493b] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="px-6 py-2.5 bg-[#143227]/70 border-b border-[#2e6250] flex items-center justify-between text-xs font-mono text-[#95b8a5]">
          <span>Priority dispatch & imminent window warnings</span>
          <button
            onClick={fetchAlerts}
            className="flex items-center gap-1 text-[#c5e48d] hover:underline cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && alerts.length === 0 ? (
            <div className="py-16 text-center text-[#95b8a5] font-mono text-xs">
              <div className="w-6 h-6 border-2 border-[#2e6250] border-t-[#c5e48d] rounded-full animate-spin mx-auto mb-2" />
              Polling tactical alarm channels...
            </div>
          ) : alerts.length === 0 ? (
            <div className="py-16 text-center text-[#95b8a5] font-mono text-xs">
              All tactical sectors clear. No unhandled alerts.
            </div>
          ) : (
            alerts.map((alert) => {
              const isCritical = alert.severity === 'CRITICAL';
              const isUnread = alert.is_read === 0;

              return (
                <div
                  key={alert.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isCritical
                      ? 'bg-rose-950/40 border-rose-800/80 shadow-sm'
                      : isUnread
                      ? 'bg-[#1b3d31] border-[#c5e48d]/60 shadow-sm'
                      : 'bg-[#143227] border-[#2e6250] opacity-80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                          isCritical
                            ? 'bg-rose-900 text-rose-200'
                            : 'bg-[#20493b] text-[#c5e48d]'
                        }`}
                      >
                        {alert.alert_type.replace(/_/g, ' ')}
                      </span>
                      {alert.zone && (
                        <span className="text-[10px] font-mono text-[#95b8a5]">
                          Zone: {alert.zone}
                        </span>
                      )}
                    </div>
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-[#c5e48d] animate-pulse" />
                    )}
                  </div>

                  <h3 className="text-xs font-bold text-white font-mono">
                    {alert.title}
                  </h3>
                  <p className="text-[11px] text-[#cfe0d5] font-mono mt-1 leading-relaxed">
                    {alert.message}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-[#2e6250]/80 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-[#95b8a5]">{alert.created_at}</span>
                    <div className="flex items-center gap-2">
                      {isUnread && (
                        <button
                          onClick={() => handleMarkAsRead(alert.id)}
                          className="text-[#95b8a5] hover:text-white cursor-pointer"
                        >
                          Mark read
                        </button>
                      )}
                      <button
                        onClick={() => handleAction(alert)}
                        className="px-2 py-1 bg-[#20493b] hover:bg-[#c5e48d] hover:text-[#143227] text-white font-bold rounded cursor-pointer transition-colors"
                      >
                        Action →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

