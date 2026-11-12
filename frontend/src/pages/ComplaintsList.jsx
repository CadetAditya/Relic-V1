import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  Zap,
  RefreshCw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Eye,
  CheckCircle2,
  Clock,
  Layers,
  UserCheck,
} from 'lucide-react';
import api from '../services/api';
import ComplaintDetailModal from '../components/ComplaintDetailModal';

export default function ComplaintsList({ setActiveTab, setSelectedComplaintId }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeModalComplaintId, setActiveModalComplaintId] = useState(null);
  const pageSize = 12;

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const res = await api.getComplaints({
        city: selectedCity || undefined,
        limit: 400,
      });
      setComplaints(res.complaints || []);
      setCurrentPage(1);
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, [selectedCity]);

  // Client-side filtering
  const filtered = complaints.filter((c) => {
    const matchesSearch =
      !search.trim() ||
      c.complaint_id.toLowerCase().includes(search.toLowerCase()) ||
      c.beneficiary_account_id?.toLowerCase().includes(search.toLowerCase()) ||
      c.victim_account_id?.toLowerCase().includes(search.toLowerCase()) ||
      c.fraud_type?.toLowerCase().includes(search.toLowerCase()) ||
      c.assigned_officer_name?.toLowerCase().includes(search.toLowerCase());

    const matchesType =
      !selectedType ||
      c.fraud_type?.toLowerCase() === selectedType.toLowerCase();

    const matchesStatus =
      selectedStatus === 'ALL' ||
      (selectedStatus === 'UNASSIGNED' && (!c.assigned_officer_id || c.assigned_officer_id === 'UNASSIGNED')) ||
      (selectedStatus === 'PENDING' && (c.complaint_status === 'unresolved' || c.complaint_status === 'under investigation')) ||
      c.complaint_status?.toLowerCase() === selectedStatus.toLowerCase();

    const matchesPriority =
      selectedPriority === 'ALL' ||
      c.priority?.toUpperCase() === selectedPriority.toUpperCase();

    return matchesSearch && matchesType && matchesStatus && matchesPriority;
  });

  // Pagination slice
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleIntercept = (complaintId) => {
    if (setSelectedComplaintId) {
      setSelectedComplaintId(complaintId);
    }
    setActiveTab('predict');
  };

  const totalVolume = filtered.reduce(
    (sum, c) => sum + (Number(c.reported_amount) || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header & Controls Panel */}
      <div className="bg-[#183a2e]/90 border border-[#2e6250] rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-5 border-b border-[#2e6250]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#143227] text-[#c5e48d] border border-[#2e6250]">
                MODULE 04 &amp; 10
              </span>
              <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#c5e48d]" />
                CYBERCRIME COMPLAINTS &amp; INVESTIGATION MANAGEMENT
              </h2>
            </div>
            <p className="text-xs font-mono text-[#95b8a5] mt-0.5">
              Repository of registered cybercrime incidents with linked beneficiary mules, evidence dossiers, and investigator assignments.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              onClick={() => setActiveTab('register')}
              className="px-3.5 py-2 bg-[#c5e48d] hover:bg-[#d6f0a4] text-[#183a2e] font-bold rounded-xl text-xs font-mono transition-all cursor-pointer shadow-md"
            >
              + REGISTER NEW CASE
            </button>
            <button
              onClick={loadComplaints}
              title="Refresh ledger"
              className="p-2 bg-[#143227] hover:bg-[#20493b] border border-[#2e6250] text-[#c5e48d] rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-mono"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-[#95b8a5] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by Complaint ID, Mule Account, Fraud Type, or Officer..."
              className="w-full bg-[#143227] border border-[#2e6250] focus:border-[#c5e48d] rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-white placeholder-[#95b8a5]/50 outline-none transition-all"
            />
          </div>

          <div>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full bg-[#143227] border border-[#2e6250] text-xs font-mono text-white rounded-xl px-3 py-2.5 outline-none focus:border-[#c5e48d] cursor-pointer"
            >
              <option value="">All Jurisdictions / Zones</option>
              <option value="Jalandhar">Jalandhar</option>
              <option value="Ludhiana">Ludhiana</option>
              <option value="Amritsar">Amritsar</option>
              <option value="Phagwara">Phagwara</option>
              <option value="Kapurthala">Kapurthala</option>
              <option value="Hoshiarpur">Hoshiarpur</option>
            </select>
          </div>

          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-[#143227] border border-[#2e6250] text-xs font-mono text-white rounded-xl px-3 py-2.5 outline-none focus:border-[#c5e48d] cursor-pointer"
            >
              <option value="">All Fraud Categories</option>
              <option value="fake customer care">Fake Customer Care</option>
              <option value="apk fraud">APK Fraud</option>
              <option value="digital arrest">Digital Arrest</option>
              <option value="phishing">Phishing</option>
              <option value="investment scam">Investment Scam</option>
              <option value="remote access scam">Remote Access Scam</option>
            </select>
          </div>
        </div>

        {/* Status and Priority Quick Filter Pills */}
        <div className="mt-4 pt-3 border-t border-[#2e6250] flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-mono text-[#95b8a5] mr-1">Status:</span>
            {[
              { id: 'ALL', label: 'All Cases' },
              { id: 'PENDING', label: 'Active / Pending' },
              { id: 'under investigation', label: 'Under Investigation' },
              { id: 'unresolved', label: 'Unresolved' },
              { id: 'UNASSIGNED', label: 'Unassigned' },
              { id: 'cleared', label: 'Cleared / Solved' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => {
                  setSelectedStatus(st.id);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                  selectedStatus === st.id
                    ? 'bg-[#c5e48d] text-[#183a2e] font-bold shadow'
                    : 'bg-[#143227] text-[#95b8a5] border border-[#2e6250] hover:text-white'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono text-[#95b8a5] mr-1">Priority:</span>
            {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((pr) => (
              <button
                key={pr}
                onClick={() => {
                  setSelectedPriority(pr);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                  selectedPriority === pr
                    ? pr === 'HIGH'
                      ? 'bg-rose-600 text-white font-bold'
                      : 'bg-[#c5e48d] text-[#183a2e] font-bold'
                    : 'bg-[#143227] text-[#95b8a5] border border-[#2e6250] hover:text-white'
                }`}
              >
                {pr === 'ALL' ? 'All Priority' : pr}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-[#183a2e]/90 border border-[#2e6250] rounded-2xl">
          <div className="text-[10px] font-mono text-[#95b8a5] uppercase">
            FILTERED CASES
          </div>
          <div className="text-2xl font-black text-white mt-1">
            {filtered.length}{' '}
            <span className="text-xs font-normal text-[#95b8a5]">records</span>
          </div>
        </div>

        <div className="p-4 bg-[#183a2e]/90 border border-[#2e6250] rounded-2xl">
          <div className="text-[10px] font-mono text-rose-400 uppercase">
            HIGH PRIORITY CASUALTIES
          </div>
          <div className="text-2xl font-black text-rose-400 mt-1">
            {filtered.filter((c) => c.priority === 'HIGH').length}
          </div>
        </div>

        <div className="p-4 bg-[#183a2e]/90 border border-[#2e6250] rounded-2xl">
          <div className="text-[10px] font-mono text-[#95b8a5] uppercase">
            REPORTED LOSS VOLUME
          </div>
          <div className="text-2xl font-black text-[#c5e48d] mt-1">
            ₹{(totalVolume / 100000).toFixed(2)}{' '}
            <span className="text-xs font-normal text-[#95b8a5]">Lakhs</span>
          </div>
        </div>

        <div className="p-4 bg-[#183a2e]/90 border border-[#2e6250] rounded-2xl">
          <div className="text-[10px] font-mono text-[#95b8a5] uppercase">
            UNASSIGNED CASES
          </div>
          <div className="text-2xl font-black text-amber-300 mt-1">
            {filtered.filter((c) => !c.assigned_officer_id || c.assigned_officer_id === 'UNASSIGNED').length}
          </div>
        </div>
      </div>

      {/* Interactive Complaints Table */}
      <div className="bg-[#183a2e]/90 border border-[#2e6250] rounded-2xl shadow-xl overflow-hidden backdrop-blur-md">
        {loading ? (
          <div className="py-20 text-center text-[#95b8a5] font-mono text-xs">
            <div className="w-8 h-8 border-2 border-[#2e6250] border-t-[#c5e48d] rounded-full animate-spin mx-auto mb-3"></div>
            RETRIEVING ENCRYPTED COMPLAINT LOGS...
          </div>
        ) : paginated.length === 0 ? (
          <div className="py-16 text-center text-[#95b8a5] font-mono text-xs">
            No cybercrime complaints match the current filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-[#2e6250] bg-[#143227] text-[#95b8a5] text-[11px]">
                  <th className="py-3 px-4">COMPLAINT ID</th>
                  <th className="py-3 px-4">DATE</th>
                  <th className="py-3 px-4">CATEGORY</th>
                  <th className="py-3 px-4 text-right">REPORTED LOSS</th>
                  <th className="py-3 px-4">MULE ACCOUNT</th>
                  <th className="py-3 px-4">STATUS &amp; ASSIGNEE</th>
                  <th className="py-3 px-4 text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2e6250]/60 text-[11px]">
                {paginated.map((c) => {
                  const isHighPriority = c.priority === 'HIGH';
                  const isAssigned = c.assigned_officer_id && c.assigned_officer_id !== 'UNASSIGNED';

                  return (
                    <tr
                      key={c.complaint_id}
                      className="hover:bg-[#20493b]/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-bold text-white">
                        <div className="flex items-center gap-1.5">
                          {isHighPriority && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="High Priority" />
                          )}
                          <button
                            onClick={() => setActiveModalComplaintId(c.complaint_id)}
                            className="hover:text-[#c5e48d] hover:underline cursor-pointer text-left"
                          >
                            {c.complaint_id}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[#95b8a5]">
                        {c.complaint_date?.split(' ')[0] || c.complaint_date}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-[#143227] text-[#c5e48d] border border-[#2e6250]">
                          {c.fraud_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-white">
                        ₹{Number(c.reported_amount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#d4e9a8]">
                        <button
                          onClick={() => {
                            if (setActiveTab) setActiveTab('accounts');
                          }}
                          className="hover:text-white hover:underline cursor-pointer"
                          title="View Money Trail"
                        >
                          {c.beneficiary_account_id}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                              c.complaint_status === 'cleared'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : c.complaint_status === 'under investigation'
                                ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}
                          >
                            {c.complaint_status || 'Unresolved'}
                          </span>
                          <div className="text-[10px] text-[#95b8a5] mt-0.5">
                            {isAssigned ? (
                              <span className="text-[#c5e48d]">
                                {c.assigned_officer_name || c.assigned_officer_id}
                              </span>
                            ) : (
                              <span className="text-amber-400">Unassigned</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setActiveModalComplaintId(c.complaint_id)}
                            className="px-2.5 py-1 bg-[#143227] hover:bg-[#20493b] text-[#c5e48d] text-[10px] font-bold rounded-lg border border-[#2e6250] transition-all cursor-pointer inline-flex items-center gap-1 shadow-sm"
                            title="Open Case Dossier, Notes & Evidence"
                          >
                            <Eye className="w-3 h-3" />
                            Dossier
                          </button>
                          <button
                            onClick={() => handleIntercept(c.complaint_id)}
                            className="px-2.5 py-1 bg-[#285343] hover:bg-[#c5e48d] hover:text-[#143227] text-white text-[10px] font-bold uppercase rounded-lg border border-[#3e7260] hover:border-[#c5e48d] transition-all cursor-pointer inline-flex items-center gap-1 shadow-sm"
                            title="Run ATM Extraction Prediction"
                          >
                            <Zap className="w-3 h-3 fill-current" />
                            Intercept
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="px-6 py-4 bg-[#143227] border-t border-[#2e6250] flex items-center justify-between font-mono text-xs text-[#95b8a5]">
          <div>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} entries
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-[#183a2e] border border-[#2e6250] text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#20493b] transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-white font-bold">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-[#183a2e] border border-[#2e6250] text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#20493b] transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Case Dossier, Notes & Evidence Modal */}
      {activeModalComplaintId && (
        <ComplaintDetailModal
          complaintId={activeModalComplaintId}
          onClose={() => setActiveModalComplaintId(null)}
          onStatusUpdated={loadComplaints}
        />
      )}
    </div>
  );
}
