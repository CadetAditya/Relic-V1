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
} from 'lucide-react';
import api from '../services/api';

export default function ComplaintsList({ setActiveTab, setSelectedComplaintId }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const res = await api.getComplaints({
        city: selectedCity || undefined,
        limit: 360,
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

  // Client-side search and type filtering
  const filtered = complaints.filter((c) => {
    const matchesSearch =
      !search.trim() ||
      c.complaint_id.toLowerCase().includes(search.toLowerCase()) ||
      c.beneficiary_account_id?.toLowerCase().includes(search.toLowerCase()) ||
      c.victim_account_id?.toLowerCase().includes(search.toLowerCase()) ||
      c.fraud_type?.toLowerCase().includes(search.toLowerCase());

    const matchesType =
      !selectedType ||
      c.fraud_type?.toLowerCase() === selectedType.toLowerCase();

    return matchesSearch && matchesType;
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
              <span className="w-2.5 h-2.5 rounded-full bg-[#c5e48d] animate-ping"></span>
              <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#c5e48d]" />
                CYBERCRIME COMPLAINTS EXPLORER
              </h2>
            </div>
            <p className="text-xs font-mono text-[#95b8a5] mt-0.5">
              Repository of 360 logged cybercrime complaints with linked beneficiary mule accounts
            </p>
          </div>

          <button
            onClick={loadComplaints}
            className="p-2 bg-[#143227] hover:bg-[#20493b] border border-[#2e6250] text-[#c5e48d] rounded-xl transition-all cursor-pointer flex items-center gap-2 text-xs font-mono self-start md:self-center"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-[#95b8a5] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by Complaint ID, Mule, or Victim..."
              className="w-full pl-9 pr-3.5 py-2.5 bg-[#143227] border border-[#2e6250] rounded-xl text-xs font-mono text-white focus:border-[#c5e48d] focus:outline-none placeholder-[#95b8a5]/60 transition-colors"
            />
          </div>

          <div>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#143227] border border-[#2e6250] rounded-xl text-xs font-mono text-[#c5e48d] font-bold focus:border-[#c5e48d] focus:outline-none cursor-pointer"
            >
              <option value="">All Jurisdictions (6 Cities)</option>
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
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3.5 py-2.5 bg-[#143227] border border-[#2e6250] rounded-xl text-xs font-mono text-[#cfe0d5] focus:border-[#c5e48d] focus:outline-none cursor-pointer"
            >
              <option value="">All Fraud Types</option>
              <option value="card fraud">Card Fraud</option>
              <option value="UPI fraud">UPI Fraud</option>
              <option value="phishing">Phishing</option>
              <option value="investment scam">Investment Scam</option>
              <option value="remote access scam">Remote Access Scam</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-[#183a2e]/90 border border-[#2e6250] rounded-2xl">
          <div className="text-[10px] font-mono text-[#95b8a5] uppercase">
            FILTERED INCIDENTS
          </div>
          <div className="text-2xl font-black text-white mt-1">
            {filtered.length}{' '}
            <span className="text-xs font-normal text-[#95b8a5]">of 360</span>
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
            SURVEILLANCE COVERAGE
          </div>
          <div className="text-2xl font-black text-white mt-1">
            100%{' '}
            <span className="text-xs font-normal text-[#95b8a5]">
              Ground Truth Mapped
            </span>
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
                  <th className="py-3 px-4">FRAUD CATEGORY</th>
                  <th className="py-3 px-4 text-right">REPORTED LOSS</th>
                  <th className="py-3 px-4">MULE ACCOUNT</th>
                  <th className="py-3 px-4">JURISDICTION</th>
                  <th className="py-3 px-4 text-center">INTERCEPT ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2e6250]/60 text-[11px]">
                {paginated.map((c) => (
                  <tr
                    key={c.complaint_id}
                    className="hover:bg-[#20493b]/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-bold text-white">
                      {c.complaint_id}
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
                      {c.beneficiary_account_id}
                    </td>
                    <td className="py-3 px-4 text-[#cfe0d5]">
                      {c.beneficiary_city || 'Punjab'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleIntercept(c.complaint_id)}
                        className="px-3 py-1 bg-[#285343] hover:bg-[#c5e48d] hover:text-[#143227] text-white text-[10px] font-bold uppercase rounded-lg border border-[#3e7260] hover:border-[#c5e48d] transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                      >
                        <Zap className="w-3 h-3 fill-current" />
                        Intercept
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="px-6 py-4 border-t border-[#2e6250] bg-[#143227] flex items-center justify-between text-xs font-mono text-[#95b8a5]">
          <div>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}{' '}
            complaints
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-[#183a2e] border border-[#2e6250] text-white hover:bg-[#20493b] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-white font-bold">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-[#183a2e] border border-[#2e6250] text-white hover:bg-[#20493b] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
