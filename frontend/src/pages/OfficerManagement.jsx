import React, { useState, useEffect } from 'react';
import {
  Shield,
  UserPlus,
  Users,
  KeyRound,
  FileText,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Compass,
  Clock,
  Filter,
  Check,
  X,
  Edit2,
  UserCheck,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const ROLES = ['Head Admin', 'Regional Admin', 'Investigator'];
const ZONES = ['All Zones', 'Jalandhar', 'Ludhiana', 'Amritsar', 'Phagwara', 'Kapurthala', 'Hoshiarpur'];
const RANKS = ['Director General', 'Superintendent of Police (Cyber)', 'DSP (Cyber Operations)', 'Inspector', 'Sub-Inspector', 'Cyber Forensic Analyst'];

export default function OfficerManagement() {
  const { officer: currentOfficer } = useAuth();
  const [activeTab, setActiveTab] = useState('roster'); // 'roster' | 'audit_logs'
  const [officers, setOfficers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Search & Filter
  const [searchRoster, setSearchRoster] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterModule, setFilterModule] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState(null);
  const [formData, setFormData] = useState({
    badge_id: '',
    name: '',
    rank: 'Inspector',
    role: 'Investigator',
    zone: 'Jalandhar',
    phone: '',
    email: '',
    password: '',
    is_active: 1,
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [officersData, logsData] = await Promise.all([
        api.getOfficers(),
        api.getAuditLogs({ limit: 100 }),
      ]);
      setOfficers(officersData.officers || []);
      setAuditLogs(logsData.logs || []);
    } catch (err) {
      console.error('Failed to load officer data:', err);
      setError('Failed to load officers or audit logs.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingOfficer(null);
    setFormData({
      badge_id: `OFFICER_${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      rank: 'Inspector',
      role: 'Investigator',
      zone: 'Jalandhar',
      phone: '',
      email: '',
      password: 'ChangeMe2026!',
      is_active: 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (off) => {
    setEditingOfficer(off);
    setFormData({
      badge_id: off.badge_id,
      name: off.name,
      rank: off.rank,
      role: off.role,
      zone: off.zone,
      phone: off.phone || '',
      email: off.email || '',
      password: '',
      is_active: off.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSubmitOfficer = async (e) => {
    e.preventDefault();
    try {
      if (editingOfficer) {
        await api.updateOfficer(editingOfficer.badge_id, formData);
        setSuccessMsg(`Officer ${formData.name} updated successfully.`);
      } else {
        await api.createOfficer(formData);
        setSuccessMsg(`Officer ${formData.name} registered successfully.`);
      }
      setIsModalOpen(false);
      fetchInitialData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Save failed:', err);
      setError('Could not save officer profile.');
    }
  };

  const filteredOfficers = officers.filter((off) => {
    const matchesSearch =
      off.name.toLowerCase().includes(searchRoster.toLowerCase()) ||
      off.badge_id.toLowerCase().includes(searchRoster.toLowerCase()) ||
      off.zone.toLowerCase().includes(searchRoster.toLowerCase());
    const matchesRole = filterRole === 'ALL' || off.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const filteredLogs = auditLogs.filter((log) => {
    if (filterModule === 'ALL') return true;
    return log.module === filterModule;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-[#183a2e]/90 border border-[#2e6250] rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-[#2e6250]/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#143227] text-[#c5e48d] border border-[#2e6250]">
                MODULE 12
              </span>
              <span className="text-xs font-mono text-[#95b8a5] tracking-wider">
                ADMINISTRATION &amp; COMPLIANCE
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
              Officer Management &amp; Audit Logs
            </h1>
            <p className="text-xs text-[#95b8a5] mt-0.5">
              Role-Based Access Control (RBAC), jurisdiction assignments, and immutable operational audit logs.
            </p>
          </div>

          {/* Action Button */}
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-[#c5e48d] hover:bg-[#d6f0a4] text-[#183a2e] font-bold rounded-xl text-xs font-mono transition-all flex items-center gap-2 cursor-pointer shadow-md"
          >
            <UserPlus className="w-4 h-4" />
            REGISTER NEW OFFICER
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="mt-5 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('roster')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'roster'
                ? 'bg-[#c5e48d] text-[#183a2e] font-bold shadow'
                : 'text-[#95b8a5] hover:text-white hover:bg-[#143227]'
            }`}
          >
            <Users className="w-4 h-4" />
            Officer Roster ({officers.length})
          </button>
          <button
            onClick={() => setActiveTab('audit_logs')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'audit_logs'
                ? 'bg-[#c5e48d] text-[#183a2e] font-bold shadow'
                : 'text-[#95b8a5] hover:text-white hover:bg-[#143227]'
            }`}
          >
            <FileText className="w-4 h-4" />
            Audit Logs Trail ({auditLogs.length})
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-950/70 border border-emerald-600 rounded-xl text-xs font-mono text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {successMsg}
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-950/70 border border-rose-600 rounded-xl text-xs font-mono text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-[#183a2e]/60 border border-[#2e6250] rounded-2xl p-16 text-center">
          <div className="w-8 h-8 border-2 border-[#2e6250] border-t-[#c5e48d] rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-mono text-[#c5e48d]">RETRIEVING ACCESS CONTROL LEDGER...</p>
        </div>
      ) : activeTab === 'roster' ? (
        /* TAB 1: OFFICER ROSTER */
        <div className="bg-[#183a2e]/90 border border-[#2e6250] rounded-2xl p-6 shadow-xl">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-5">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[#95b8a5] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchRoster}
                onChange={(e) => setSearchRoster(e.target.value)}
                placeholder="Search by name, badge, zone..."
                className="w-full bg-[#143227] border border-[#2e6250] focus:border-[#c5e48d] rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-white placeholder-[#95b8a5]/50 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-mono text-[#95b8a5]">Role:</span>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="bg-[#143227] border border-[#2e6250] text-xs font-mono text-white rounded-xl px-3 py-2 outline-none focus:border-[#c5e48d]"
              >
                <option value="ALL">All Roles</option>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Officers Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#2e6250] text-[#95b8a5] bg-[#143227]">
                  <th className="py-2.5 px-3">OFFICER / BADGE</th>
                  <th className="py-2.5 px-3">RANK</th>
                  <th className="py-2.5 px-3">ROLE (RBAC)</th>
                  <th className="py-2.5 px-3">ASSIGNED ZONE</th>
                  <th className="py-2.5 px-3">STATUS</th>
                  <th className="py-2.5 px-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2e6250]/50">
                {filteredOfficers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#95b8a5]">
                      No officers matched criteria.
                    </td>
                  </tr>
                ) : (
                  filteredOfficers.map((off) => {
                    const isSelf = currentOfficer?.badge_id === off.badge_id;
                    const roleColor =
                      off.role === 'Head Admin'
                        ? 'bg-purple-950/80 text-purple-300 border-purple-800'
                        : off.role === 'Regional Admin'
                        ? 'bg-blue-950/80 text-blue-300 border-blue-800'
                        : 'bg-[#143227] text-[#c5e48d] border-[#2e6250]';

                    return (
                      <tr key={off.badge_id} className="hover:bg-[#143227]/60 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-[#20493b] border border-[#3e7863] flex items-center justify-center text-[#c5e48d] font-bold">
                              {off.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-white flex items-center gap-1.5">
                                {off.name}
                                {isSelf && (
                                  <span className="text-[9px] font-mono text-[#c5e48d] bg-[#183a2e] px-1.5 py-0.2 rounded border border-[#2e6250]">
                                    YOU
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-[#95b8a5]">{off.badge_id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-white">{off.rank}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${roleColor}`}
                          >
                            {off.role}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[#95b8a5]">
                          <span className="flex items-center gap-1">
                            <Compass className="w-3 h-3 text-[#c5e48d]" />
                            {off.zone}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {off.is_active ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                              ACTIVE
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800">
                              SUSPENDED
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleOpenEditModal(off)}
                            className="p-1.5 bg-[#143227] hover:bg-[#20493b] text-[#c5e48d] border border-[#2e6250] rounded-lg transition-all cursor-pointer inline-flex items-center gap-1 text-[11px]"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* TAB 2: AUDIT LOGS TRAIL */
        <div className="bg-[#183a2e]/90 border border-[#2e6250] rounded-2xl p-6 shadow-xl">
          {/* Filter Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-[#2e6250] mb-4">
            <div>
              <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#c5e48d]" />
                IMMUTABLE AUDIT TRAIL
              </h3>
              <p className="text-xs text-[#95b8a5]">
                Log of all operational actions, case assignments, status changes, and prediction runs.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#95b8a5]">Module:</span>
              <select
                value={filterModule}
                onChange={(e) => setFilterModule(e.target.value)}
                className="bg-[#143227] border border-[#2e6250] text-xs font-mono text-white rounded-xl px-3 py-1.5 outline-none focus:border-[#c5e48d]"
              >
                <option value="ALL">All Modules</option>
                <option value="AUTH">AUTH</option>
                <option value="COMPLAINTS">COMPLAINTS</option>
                <option value="PREDICTION">PREDICTION</option>
                <option value="EVIDENCE">EVIDENCE</option>
                <option value="OFFICERS">OFFICERS</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredLogs.length === 0 ? (
              <div className="py-8 text-center text-xs font-mono text-[#95b8a5]">
                No audit entries found matching the criteria.
              </div>
            ) : (
              filteredLogs.map((log) => {
                const badgeColor =
                  log.module === 'AUTH'
                    ? 'bg-blue-950 text-blue-300 border-blue-800'
                    : log.module === 'PREDICTION'
                    ? 'bg-purple-950 text-purple-300 border-purple-800'
                    : log.module === 'COMPLAINTS'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    : 'bg-[#143227] text-[#c5e48d] border-[#2e6250]';

                return (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-[#143227] border border-[#2e6250] flex items-start justify-between hover:border-[#3e7863] transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#c5e48d] mt-1.5 shrink-0" />
                      <div>
                        <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono border ${badgeColor}`}>
                            {log.module}
                          </span>
                          <span className="text-[#c5e48d]">{log.action}</span>
                          {log.target_id && (
                            <span className="text-[10px] text-[#95b8a5]">
                              Target: {log.target_id}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-mono text-[#95b8a5] mt-1">
                          {log.details}
                        </p>
                        <div className="text-[10px] font-mono text-[#95b8a5]/70 mt-1">
                          By: {log.officer_name} ({log.officer_id})
                        </div>
                      </div>
                    </div>

                    <div className="text-[10px] font-mono text-[#95b8a5] shrink-0 text-right">
                      {log.created_at || 'Recently'}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* CREATE / EDIT OFFICER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#183a2e] border border-[#2e6250] rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#2e6250]">
              <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#c5e48d]" />
                {editingOfficer ? 'EDIT OFFICER PROFILE' : 'REGISTER NEW OFFICER'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#95b8a5] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitOfficer} className="mt-4 space-y-3.5 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#95b8a5] mb-1">BADGE ID</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingOfficer}
                    value={formData.badge_id}
                    onChange={(e) => setFormData({ ...formData, badge_id: e.target.value })}
                    className="w-full bg-[#143227] border border-[#2e6250] rounded-lg px-3 py-2 text-white outline-none focus:border-[#c5e48d] disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-[#95b8a5] mb-1">FULL NAME</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#143227] border border-[#2e6250] rounded-lg px-3 py-2 text-white outline-none focus:border-[#c5e48d]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#95b8a5] mb-1">OFFICIAL RANK</label>
                  <select
                    value={formData.rank}
                    onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                    className="w-full bg-[#143227] border border-[#2e6250] rounded-lg px-3 py-2 text-white outline-none focus:border-[#c5e48d]"
                  >
                    {RANKS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[#95b8a5] mb-1">ROLE (RBAC)</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-[#143227] border border-[#2e6250] rounded-lg px-3 py-2 text-white outline-none focus:border-[#c5e48d]"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#95b8a5] mb-1">ASSIGNED ZONE</label>
                  <select
                    value={formData.zone}
                    onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                    className="w-full bg-[#143227] border border-[#2e6250] rounded-lg px-3 py-2 text-white outline-none focus:border-[#c5e48d]"
                  >
                    {ZONES.map((z) => (
                      <option key={z} value={z}>
                        {z}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[#95b8a5] mb-1">
                    {editingOfficer ? 'NEW PASSWORD (OPTIONAL)' : 'PASSWORD'}
                  </label>
                  <input
                    type="password"
                    required={!editingOfficer}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingOfficer ? 'Leave blank to keep' : 'Enter password'}
                    className="w-full bg-[#143227] border border-[#2e6250] rounded-lg px-3 py-2 text-white outline-none focus:border-[#c5e48d]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_active_cb"
                  checked={formData.is_active === 1}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })
                  }
                  className="rounded border-[#2e6250] text-[#c5e48d] focus:ring-0 cursor-pointer"
                />
                <label htmlFor="is_active_cb" className="text-white cursor-pointer">
                  Officer Account is Active and Cleared for System Access
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-[#2e6250]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-[#143227] hover:bg-[#20493b] text-[#95b8a5] rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#c5e48d] hover:bg-[#d6f0a4] text-[#183a2e] font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Save Officer Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

