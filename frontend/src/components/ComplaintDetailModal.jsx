import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  UserCheck,
  Zap,
  Calendar,
  Clock,
  Video,
  FilePlus,
  Plus,
  Send,
  AlertCircle,
  CheckCircle2,
  Building,
  CreditCard,
  History,
  Shield,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function ComplaintDetailModal({ complaintId, onClose, setActiveTab, setSelectedComplaintId, onComplaintUpdated }) {
  const { officer } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [officersList, setOfficersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTabSub, setActiveTabSub] = useState('overview'); // 'overview', 'timeline', 'evidence'

  // Edit status state
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Assign state
  const [assignedOfficerId, setAssignedOfficerId] = useState('');
  const [assigning, setAssigning] = useState(false);

  // New Note state
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Evidence / CCTV form state
  const [showEvidenceForm, setShowEvidenceForm] = useState(false);
  const [evTitle, setEvTitle] = useState('');
  const [evType, setEvType] = useState('CCTV Footage Reference');
  const [evAtmId, setEvAtmId] = useState('');
  const [evCameraId, setEvCameraId] = useState('CAM-ATM-01');
  const [evWindowStart, setEvWindowStart] = useState('');
  const [evWindowEnd, setEvWindowEnd] = useState('');
  const [evBankContact, setEvBankContact] = useState('');
  const [evDesc, setEvDesc] = useState('');
  const [savingEvidence, setSavingEvidence] = useState(false);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const [compRes, offRes] = await Promise.all([
        api.getComplaintById(complaintId),
        api.getOfficers(),
      ]);
      setComplaint(compRes);
      setNewStatus(compRes.complaint_status || 'unresolved');
      setAssignedOfficerId(compRes.assigned_officer_id || '');
      setOfficersList(offRes || []);

      // If prediction exists, default footage window around prediction time
      if (compRes.predictions && compRes.predictions.length > 0) {
        const p = compRes.predictions[0];
        setEvAtmId(p.top1_atm_id || '');
        setEvWindowStart(p.predicted_window_start || '');
        setEvWindowEnd(p.predicted_window_end || '');
      }
    } catch (e) {
      console.error('Failed to load complaint detail:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (complaintId) {
      fetchDetail();
    }
  }, [complaintId]);

  const handleUpdateStatus = async () => {
    if (!newStatus) return;
    try {
      setUpdatingStatus(true);
      const updated = await api.updateComplaintStatus(complaintId, {
        status: newStatus,
        notes: statusNotes,
        officer_id: officer?.badge_id || 'OFFICER_007',
        officer_name: officer?.name || 'Officer',
      });
      setComplaint(updated);
      setStatusNotes('');
      if (onComplaintUpdated) onComplaintUpdated();
    } catch (e) {
      console.error('Status update failed:', e);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAssignOfficer = async () => {
    if (!assignedOfficerId) return;
    try {
      setAssigning(true);
      const updated = await api.assignInvestigator(complaintId, {
        investigator_badge_id: assignedOfficerId,
        assigned_by_id: officer?.badge_id || 'ADMIN',
        assigned_by_name: officer?.name || 'Admin',
      });
      setComplaint(updated);
      if (onComplaintUpdated) onComplaintUpdated();
    } catch (e) {
      console.error('Assignment failed:', e);
    } finally {
      setAssigning(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    try {
      setAddingNote(true);
      await api.addComplaintNote(complaintId, {
        note_text: noteText.trim(),
        action_type: 'NOTE_ADDED',
        officer_id: officer?.badge_id || 'OFFICER_007',
        officer_name: officer?.name || 'Officer',
      });
      setNoteText('');
      fetchDetail();
      if (onComplaintUpdated) onComplaintUpdated();
    } catch (e) {
      console.error('Failed to add note:', e);
    } finally {
      setAddingNote(false);
    }
  };

  const handleSaveEvidence = async (e) => {
    e.preventDefault();
    if (!evTitle.trim()) return;
    try {
      setSavingEvidence(true);
      await api.attachEvidence(complaintId, {
        title: evTitle.trim(),
        evidence_type: evType,
        description: evDesc.trim() || undefined,
        atm_id: evAtmId.trim() || undefined,
        cctv_camera_id: evCameraId.trim() || undefined,
        footage_window_start: evWindowStart.trim() || undefined,
        footage_window_end: evWindowEnd.trim() || undefined,
        bank_contact_person: evBankContact.trim() || undefined,
        officer_id: officer?.badge_id || 'OFFICER_007',
        officer_name: officer?.name || 'Officer',
      });
      setShowEvidenceForm(false);
      setEvTitle('');
      setEvDesc('');
      fetchDetail();
      if (onComplaintUpdated) onComplaintUpdated();
    } catch (e) {
      console.error('Failed to save evidence:', e);
    } finally {
      setSavingEvidence(false);
    }
  };

  const handleUpdateEvidenceStatus = async (evidenceId, status) => {
    try {
      await api.updateEvidenceStatus(evidenceId, {
        status,
        officer_id: officer?.badge_id || 'OFFICER_007',
        officer_name: officer?.name || 'Officer',
      });
      fetchDetail();
    } catch (e) {
      console.error('Failed to update evidence status:', e);
    }
  };

  const handleLaunchRadar = () => {
    if (setSelectedComplaintId) {
      setSelectedComplaintId(complaintId);
    }
    setActiveTab('predict');
    onClose();
  };

  if (!complaintId) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#183a2e] border border-[#2e6250] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="px-6 py-4 bg-[#143227] border-b border-[#2e6250] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#20493b] border border-[#3e7260] flex items-center justify-center text-[#c5e48d]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-white font-mono uppercase">
                  CASE DOSSIER: {complaintId}
                </span>
                {complaint && (
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                      complaint.priority === 'HIGH'
                        ? 'bg-rose-900/80 text-rose-200 border border-rose-700'
                        : 'bg-[#20493b] text-[#c5e48d] border border-[#2e6250]'
                    }`}
                  >
                    {complaint.priority || 'NORMAL'} PRIORITY
                  </span>
                )}
              </div>
              <div className="text-[11px] font-mono text-[#95b8a5]">
                Jurisdiction: {complaint?.beneficiary_city || 'Punjab Zone'} • Filed:{' '}
                {complaint?.complaint_date}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLaunchRadar}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#c5e48d] hover:bg-white text-[#143227] text-xs font-mono font-bold rounded-lg transition-all cursor-pointer shadow-sm"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              Launch Radar
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#95b8a5] hover:text-white hover:bg-[#20493b] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="px-6 bg-[#143227]/60 border-b border-[#2e6250] flex gap-4 text-xs font-mono">
          {[
            { id: 'overview', label: 'Case Overview & Financials' },
            { id: 'timeline', label: `Investigation Timeline (${complaint?.timeline?.length || 0})` },
            { id: 'evidence', label: `Evidence & CCTV (${complaint?.evidence?.length || 0})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTabSub(tab.id)}
              className={`py-3 font-semibold transition-all cursor-pointer border-b-2 ${
                activeTabSub === tab.id
                  ? 'border-[#c5e48d] text-white'
                  : 'border-transparent text-[#95b8a5] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-20 text-center text-[#95b8a5] font-mono text-xs">
              <div className="w-8 h-8 border-2 border-[#2e6250] border-t-[#c5e48d] rounded-full animate-spin mx-auto mb-2" />
              Loading case intelligence file...
            </div>
          ) : !complaint ? (
            <div className="py-12 text-center text-rose-300 font-mono text-xs">
              Case record not found.
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW & FINANCIALS */}
              {activeTabSub === 'overview' && (
                <div className="space-y-6">
                  {/* Status & Assignment Action Bar */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-[#143227] border border-[#2e6250]">
                    {/* Status update */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-mono text-[#95b8a5] block uppercase font-bold">
                        Update Case Status
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-[#183a2e] border border-[#2e6250] rounded-lg text-xs font-mono text-white focus:border-[#c5e48d] focus:outline-none"
                        >
                          <option value="unresolved">Unresolved (Active Surveillance)</option>
                          <option value="under investigation">Under Investigation</option>
                          <option value="confirmed">Confirmed Fraud</option>
                          <option value="cleared">Cleared / Resolved</option>
                        </select>
                        <button
                          onClick={handleUpdateStatus}
                          disabled={updatingStatus}
                          className="px-3 py-1.5 bg-[#20493b] hover:bg-[#c5e48d] hover:text-[#143227] text-white text-xs font-mono font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {updatingStatus ? 'Updating...' : 'Save'}
                        </button>
                      </div>
                    </div>

                    {/* Investigator assignment */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-mono text-[#95b8a5] block uppercase font-bold">
                        Assign Lead Investigator
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={assignedOfficerId}
                          onChange={(e) => setAssignedOfficerId(e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-[#183a2e] border border-[#2e6250] rounded-lg text-xs font-mono text-white focus:border-[#c5e48d] focus:outline-none"
                        >
                          <option value="">Unassigned</option>
                          {officersList.map((off) => (
                            <option key={off.badge_id} value={off.badge_id}>
                              {off.name} ({off.badge_id} - {off.zone})
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={handleAssignOfficer}
                          disabled={assigning}
                          className="px-3 py-1.5 bg-[#20493b] hover:bg-[#c5e48d] hover:text-[#143227] text-white text-xs font-mono font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {assigning ? 'Assigning...' : 'Assign'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Financial & Modus Operandi Dossier */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[#143227] border border-[#2e6250] text-xs font-mono">
                    <div>
                      <div className="text-[10px] text-[#95b8a5] uppercase">Reported Fraud Type</div>
                      <div className="font-bold text-white uppercase mt-1">{complaint.fraud_type}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#95b8a5] uppercase">Disputed Amount</div>
                      <div className="font-bold text-[#c5e48d] text-base mt-1">
                        ₹{Number(complaint.reported_amount).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#95b8a5] uppercase">Transaction / UTR #</div>
                      <div className="font-bold text-white mt-1">{complaint.transaction_id || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#95b8a5] uppercase">Assigned Officer</div>
                      <div className="font-bold text-[#d4e9a8] mt-1">
                        {complaint.assigned_officer_name || 'Unassigned'}
                      </div>
                    </div>
                  </div>

                  {/* Account Flow Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-[#143227] border border-[#2e6250] text-xs font-mono space-y-2">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-[#95b8a5]" />
                        VICTIM (COMPLAINANT) ACCOUNT
                      </div>
                      <div className="text-[11px] text-[#cfe0d5]">
                        Account ID: <strong className="text-white">{complaint.victim_account_id}</strong>
                      </div>
                      <div className="text-[11px] text-[#95b8a5]">
                        Funds unlawfully debited from this account via fraudulent transfer.
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-[#1f4b3a] border border-[#c5e48d]/60 text-xs font-mono space-y-2">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-[#c5e48d]" />
                        BENEFICIARY (MULE) ACCOUNT
                      </div>
                      <div className="text-[11px] text-white">
                        Mule Account: <strong className="text-[#c5e48d]">{complaint.beneficiary_account_id}</strong>
                      </div>
                      <div className="text-[11px] text-[#cfe0d5]">
                        UPI Handle: {complaint.beneficiary_upi_id || 'N/A'}
                      </div>
                      <div className="text-[11px] text-[#c5e48d]">
                        Extraction Jurisdiction: {complaint.beneficiary_city}
                      </div>
                    </div>
                  </div>

                  {/* Officer Notes Section */}
                  <div className="p-4 rounded-xl bg-[#143227] border border-[#2e6250] text-xs font-mono space-y-1.5">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-[#c5e48d]" />
                      INITIAL OFFICER CASE NOTES
                    </div>
                    <p className="text-[#cfe0d5] text-[11px] leading-relaxed">
                      {complaint.officer_notes || 'No preliminary notes recorded.'}
                    </p>
                  </div>

                  {/* Linked Banking Transactions Table */}
                  {complaint.linked_transactions && complaint.linked_transactions.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-mono font-bold text-white uppercase flex items-center gap-1.5">
                        <History className="w-4 h-4 text-[#c5e48d]" />
                        Associated Bank Transactions ({complaint.linked_transactions.length})
                      </div>
                      <div className="overflow-x-auto rounded-xl border border-[#2e6250]">
                        <table className="w-full text-left font-mono text-xs">
                          <thead className="bg-[#143227] text-[#95b8a5] text-[10px]">
                            <tr>
                              <th className="py-2 px-3">TX ID</th>
                              <th className="py-2 px-3">DATETIME</th>
                              <th className="py-2 px-3 text-right">AMOUNT (₹)</th>
                              <th className="py-2 px-3">SENDER</th>
                              <th className="py-2 px-3">RECEIVER</th>
                              <th className="py-2 px-3 text-center">STATUS</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#2e6250]/60 text-[11px]">
                            {complaint.linked_transactions.map((tx) => (
                              <tr key={tx.transaction_id} className="hover:bg-[#20493b]/40">
                                <td className="py-2 px-3 font-bold text-white">{tx.transaction_id}</td>
                                <td className="py-2 px-3 text-[#95b8a5]">{tx.transaction_datetime}</td>
                                <td className="py-2 px-3 text-right font-bold text-[#c5e48d]">
                                  ₹{Number(tx.amount).toLocaleString('en-IN')}
                                </td>
                                <td className="py-2 px-3 text-[#cfe0d5]">{tx.sender_account_id}</td>
                                <td className="py-2 px-3 text-[#d4e9a8]">{tx.receiver_account_id}</td>
                                <td className="py-2 px-3 text-center text-[#95b8a5]">
                                  {tx.transaction_status}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: INVESTIGATION TIMELINE & NOTES */}
              {activeTabSub === 'timeline' && (
                <div className="space-y-6">
                  {/* Add note input form */}
                  <form onSubmit={handleAddNote} className="p-4 rounded-xl bg-[#143227] border border-[#2e6250] space-y-3">
                    <label className="text-xs font-mono font-bold text-white block uppercase">
                      Add Investigation Finding or Action Note
                    </label>
                    <textarea
                      rows={2}
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Enter field notes, suspect interrogation updates, bank compliance feedback..."
                      className="w-full px-3 py-2 bg-[#183a2e] border border-[#2e6250] rounded-xl text-xs font-mono text-white focus:border-[#c5e48d] focus:outline-none"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={addingNote || !noteText.trim()}
                        className="px-4 py-1.5 bg-[#c5e48d] hover:bg-white text-[#143227] font-mono text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {addingNote ? 'Saving...' : 'Add Note to Dossier'}
                      </button>
                    </div>
                  </form>

                  {/* Timeline stream */}
                  <div className="space-y-3">
                    {complaint.timeline && complaint.timeline.length > 0 ? (
                      complaint.timeline.map((item) => (
                        <div
                          key={item.id}
                          className="p-3.5 rounded-xl bg-[#143227] border border-[#2e6250] font-mono text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-[#c5e48d]">
                              {item.officer_name} ({item.officer_id})
                            </span>
                            <span className="text-[#95b8a5]">{item.created_at}</span>
                          </div>
                          <p className="text-white text-[12px] leading-relaxed pt-1">
                            {item.note_text}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center text-[#95b8a5] font-mono text-xs">
                        No case activity notes recorded yet.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: EVIDENCE & CCTV FOOTAGE REQUESTS */}
              {activeTabSub === 'evidence' && (
                <div className="space-y-6">
                  {/* Header & Add Evidence Button */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-mono font-bold text-white uppercase">
                        Evidence & Bank CCTV Surveillance Preservation
                      </h4>
                      <p className="text-[11px] font-mono text-[#95b8a5]">
                        Track Section 91 CrPC CCTV preservation orders and forensic documents
                      </p>
                    </div>
                    <button
                      onClick={() => setShowEvidenceForm(!showEvidenceForm)}
                      className="px-3 py-1.5 bg-[#20493b] hover:bg-[#c5e48d] hover:text-[#143227] text-white text-xs font-mono font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {showEvidenceForm ? 'Cancel' : 'Record CCTV / Evidence'}
                    </button>
                  </div>

                  {/* Add Evidence Form */}
                  {showEvidenceForm && (
                    <form onSubmit={handleSaveEvidence} className="p-4 rounded-xl bg-[#143227] border border-[#c5e48d]/60 space-y-4 animate-in fade-in duration-150">
                      <div className="text-xs font-mono font-bold text-[#c5e48d] uppercase">
                        New CCTV Reference / Supporting Document Request
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                        <div>
                          <label className="text-[#95b8a5] text-[10px] block mb-1">EVIDENCE TITLE *</label>
                          <input
                            type="text"
                            value={evTitle}
                            onChange={(e) => setEvTitle(e.target.value)}
                            placeholder="e.g. Bank CCTV Camera 01 Footage Request"
                            className="w-full px-3 py-1.5 bg-[#183a2e] border border-[#2e6250] rounded-lg text-white focus:border-[#c5e48d] focus:outline-none"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[#95b8a5] text-[10px] block mb-1">EVIDENCE TYPE</label>
                          <select
                            value={evType}
                            onChange={(e) => setEvType(e.target.value)}
                            className="w-full px-3 py-1.5 bg-[#183a2e] border border-[#2e6250] rounded-lg text-white focus:border-[#c5e48d] focus:outline-none cursor-pointer"
                          >
                            <option value="CCTV Footage Reference">CCTV Footage Reference</option>
                            <option value="Bank Account Statement">Bank Account Statement</option>
                            <option value="Transaction Slip">Transaction Slip</option>
                            <option value="ATM Log Journal">ATM Log Journal</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[#95b8a5] text-[10px] block mb-1">TARGET ATM ID</label>
                          <input
                            type="text"
                            value={evAtmId}
                            onChange={(e) => setEvAtmId(e.target.value)}
                            placeholder="e.g. ATM0061"
                            className="w-full px-3 py-1.5 bg-[#183a2e] border border-[#2e6250] rounded-lg text-[#c5e48d] font-bold focus:border-[#c5e48d] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[#95b8a5] text-[10px] block mb-1">CCTV CAMERA ID / CHANNEL</label>
                          <input
                            type="text"
                            value={evCameraId}
                            onChange={(e) => setEvCameraId(e.target.value)}
                            placeholder="e.g. CAM-ATM-01 or PINPAD-CAM"
                            className="w-full px-3 py-1.5 bg-[#183a2e] border border-[#2e6250] rounded-lg text-white focus:border-[#c5e48d] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[#95b8a5] text-[10px] block mb-1">FOOTAGE TIME WINDOW START</label>
                          <input
                            type="text"
                            value={evWindowStart}
                            onChange={(e) => setEvWindowStart(e.target.value)}
                            placeholder="YYYY-MM-DD HH:MM:SS"
                            className="w-full px-3 py-1.5 bg-[#183a2e] border border-[#2e6250] rounded-lg text-white focus:border-[#c5e48d] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[#95b8a5] text-[10px] block mb-1">FOOTAGE TIME WINDOW END</label>
                          <input
                            type="text"
                            value={evWindowEnd}
                            onChange={(e) => setEvWindowEnd(e.target.value)}
                            placeholder="YYYY-MM-DD HH:MM:SS"
                            className="w-full px-3 py-1.5 bg-[#183a2e] border border-[#2e6250] rounded-lg text-white focus:border-[#c5e48d] focus:outline-none"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-[#95b8a5] text-[10px] block mb-1">BANK BRANCH / NODAL OFFICER CONTACT</label>
                          <input
                            type="text"
                            value={evBankContact}
                            onChange={(e) => setEvBankContact(e.target.value)}
                            placeholder="e.g. Nodal Officer SBI Civil Lines, Branch Code 0142"
                            className="w-full px-3 py-1.5 bg-[#183a2e] border border-[#2e6250] rounded-lg text-white focus:border-[#c5e48d] focus:outline-none"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-[#95b8a5] text-[10px] block mb-1">CASE SUMMARY / PRESERVATION PURPOSE</label>
                          <textarea
                            rows={2}
                            value={evDesc}
                            onChange={(e) => setEvDesc(e.target.value)}
                            placeholder="Physical description of suspect, CCTV camera angles required..."
                            className="w-full px-3 py-1.5 bg-[#183a2e] border border-[#2e6250] rounded-lg text-white focus:border-[#c5e48d] focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowEvidenceForm(false)}
                          className="px-3 py-1.5 bg-[#183a2e] border border-[#2e6250] text-[#95b8a5] hover:text-white rounded-lg cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={savingEvidence}
                          className="px-4 py-1.5 bg-[#c5e48d] hover:bg-white text-[#143227] font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          {savingEvidence ? 'Saving...' : 'Save Evidence Reference'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Evidence list */}
                  <div className="space-y-3">
                    {complaint.evidence && complaint.evidence.length > 0 ? (
                      complaint.evidence.map((ev) => (
                        <div
                          key={ev.id}
                          className="p-4 rounded-xl bg-[#143227] border border-[#2e6250] font-mono text-xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Video className="w-4 h-4 text-[#c5e48d]" />
                              <strong className="text-white text-sm">{ev.title}</strong>
                              <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#20493b] text-[#c5e48d] border border-[#3e7260]">
                                {ev.evidence_type}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  ev.request_status === 'ANALYZED'
                                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                    : ev.request_status === 'COLLECTED'
                                    ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                                }`}
                              >
                                {ev.request_status}
                              </span>
                              <select
                                value={ev.request_status}
                                onChange={(e) => handleUpdateEvidenceStatus(ev.id, e.target.value)}
                                className="px-2 py-0.5 bg-[#183a2e] border border-[#2e6250] rounded text-[10px] text-white cursor-pointer"
                              >
                                <option value="REQUESTED">REQUESTED</option>
                                <option value="PRESERVED">PRESERVED</option>
                                <option value="COLLECTED">COLLECTED</option>
                                <option value="ANALYZED">ANALYZED</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-[#cfe0d5] pt-1">
                            <div>Target ATM: <strong className="text-white">{ev.atm_id || 'N/A'}</strong></div>
                            <div>Camera ID: <strong className="text-white">{ev.cctv_camera_id || 'N/A'}</strong></div>
                            <div>Branch: <strong className="text-white">{ev.bank_contact_person || 'N/A'}</strong></div>
                          </div>

                          {ev.footage_window_start && (
                            <div className="text-[11px] text-[#c5e48d] bg-[#183a2e] p-2 rounded-lg border border-[#2e6250]">
                              Footage Window: {ev.footage_window_start} to {ev.footage_window_end}
                            </div>
                          )}

                          {ev.description && (
                            <p className="text-[11px] text-[#95b8a5]">{ev.description}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center text-[#95b8a5] font-mono text-xs">
                        No CCTV footage preservation requests or evidence documents attached yet.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

