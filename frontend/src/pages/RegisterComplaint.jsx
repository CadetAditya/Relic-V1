import React, { useState } from 'react';
import {
  FilePlus,
  Shield,
  Zap,
  CheckCircle2,
  AlertCircle,
  Calendar,
  DollarSign,
  User,
  CreditCard,
  MapPin,
  Clock,
  ArrowRight,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const QUICK_MULES = [
  { id: 'ACC000014', city: 'Jalandhar', upi: 'user0014@syntheticupi', label: 'Mule ACC000014 (Jalandhar)' },
  { id: 'ACC000397', city: 'Jalandhar', upi: 'user0397@syntheticupi', label: 'Mule ACC000397 (Jalandhar)' },
  { id: 'ACC000043', city: 'Phagwara', upi: 'user0043@syntheticupi', label: 'Mule ACC000043 (Phagwara)' },
  { id: 'ACC000029', city: 'Hoshiarpur', upi: 'user0029@syntheticupi', label: 'Mule ACC000029 (Hoshiarpur)' },
  { id: 'ACC000017', city: 'Hoshiarpur', upi: 'user0017@syntheticupi', label: 'Mule ACC000017 (Hoshiarpur)' },
];

export default function RegisterComplaint({ setActiveTab, setSelectedComplaintId }) {
  const { officer } = useAuth();

  // Form states
  const [complaintId, setComplaintId] = useState('');
  const [complaintDate, setComplaintDate] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 19).replace('T', ' ');
  });
  const [fraudType, setFraudType] = useState('UPI fraud');
  const [reportedAmount, setReportedAmount] = useState('35000');
  const [transactionId, setTransactionId] = useState('TX00018492');
  const [victimAccountId, setVictimAccountId] = useState('ACC000512');
  const [beneficiaryAccountId, setBeneficiaryAccountId] = useState('ACC000014');
  const [beneficiaryUpiId, setBeneficiaryUpiId] = useState('user0014@syntheticupi');
  const [beneficiaryCity, setBeneficiaryCity] = useState('Jalandhar');
  const [complaintStatus, setComplaintStatus] = useState('unresolved');
  const [linkedFraudAccount, setLinkedFraudAccount] = useState(1);
  const [officerNotes, setOfficerNotes] = useState('Immediate cyber-cell report of unauthorized debit. Suspect mule account flagged for high-velocity ATM cashout.');

  // Submission states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [registeredComplaint, setRegisteredComplaint] = useState(null);

  // Quick auto-fill helper
  const handleSelectQuickMule = (mule) => {
    setBeneficiaryAccountId(mule.id);
    setBeneficiaryUpiId(mule.upi);
    setBeneficiaryCity(mule.city);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!victimAccountId.trim() || !beneficiaryAccountId.trim() || !reportedAmount) {
      setError('Please provide Victim Account ID, Beneficiary Mule Account ID, and Disputed Amount.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        complaint_id: complaintId.trim() || undefined,
        complaint_date: complaintDate.trim() || undefined,
        fraud_type: fraudType,
        reported_amount: Number(reportedAmount) || 25000,
        victim_account_id: victimAccountId.trim(),
        transaction_id: transactionId.trim() || undefined,
        beneficiary_account_id: beneficiaryAccountId.trim(),
        beneficiary_upi_id: beneficiaryUpiId.trim() || undefined,
        beneficiary_city: beneficiaryCity,
        complaint_status: complaintStatus,
        linked_fraud_account: linkedFraudAccount,
        officer_notes: officerNotes.trim() || undefined,
      };

      const res = await api.createComplaint(payload);
      setRegisteredComplaint(res);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to register cybercrime complaint.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleInterceptNow = () => {
    if (registeredComplaint && setSelectedComplaintId) {
      setSelectedComplaintId(registeredComplaint.complaint_id);
    }
    setActiveTab('predict');
  };

  const handleReset = () => {
    setRegisteredComplaint(null);
    setComplaintId('');
    setError(null);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#183a2e]/90 border border-[#2e6250] rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-4 border-b border-[#2e6250]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#143227] text-[#c5e48d] border border-[#2e6250]">
                LAW ENFORCEMENT INTAKE DOCKET
              </span>
              <span className="text-xs font-mono text-[#95b8a5]">
                NCR PORTAL SYNCHRONIZED
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white font-mono flex items-center gap-2">
              <FilePlus className="w-5 h-5 text-[#c5e48d]" />
              REGISTER A CYBERCRIME COMPLAINT
            </h2>
            <p className="text-xs font-mono text-[#cfe0d5] mt-0.5">
              Enter reported cybercrime incident metadata to instantly feed the predictive ATM extraction interception model
            </p>
          </div>

          {officer && (
            <div className="px-3.5 py-2 bg-[#143227] border border-[#2e6250] rounded-xl text-right">
              <div className="text-[10px] font-mono text-[#95b8a5]">RECORDING OFFICER</div>
              <div className="text-xs font-bold text-white">{officer.name}</div>
              <div className="text-[10px] font-mono text-[#c5e48d]">{officer.badge_id} ({officer.city})</div>
            </div>
          )}
        </div>

        {/* Quick Tips */}
        <div className="flex items-center gap-2 text-xs font-mono text-[#95b8a5]">
          <Sparkles className="w-4 h-4 text-[#c5e48d] shrink-0" />
          <span>
            Once registered, the ML engine will immediately calculate candidate ATMs in the registered jurisdiction.
          </span>
        </div>
      </div>

      {/* Success Confirmation Modal / Card */}
      {registeredComplaint ? (
        <div className="bg-[#183a2e] border-2 border-[#c5e48d] rounded-2xl p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#c5e48d]/20 border border-[#c5e48d] flex items-center justify-center text-[#c5e48d] shrink-0">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <div className="text-[11px] font-mono font-bold tracking-widest text-[#c5e48d] uppercase">
                COMPLAINT OFFICIALLY LOGGED
              </div>
              <h3 className="text-2xl font-black text-white font-mono mt-0.5">
                DOCKET #{registeredComplaint.complaint_id}
              </h3>
              <p className="text-xs font-mono text-[#cfe0d5] mt-1">
                Incident registered in national database under jurisdiction of <strong>{registeredComplaint.beneficiary_city}</strong>.
              </p>
            </div>
          </div>

          {/* Quick Dossier Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-[#143227] border border-[#2e6250] text-xs font-mono">
            <div>
              <div className="text-[10px] text-[#95b8a5]">FRAUD TYPE</div>
              <div className="font-bold text-white uppercase mt-0.5">{registeredComplaint.fraud_type}</div>
            </div>
            <div>
              <div className="text-[10px] text-[#95b8a5]">DISPUTED AMOUNT</div>
              <div className="font-bold text-[#c5e48d] mt-0.5">₹{Number(registeredComplaint.reported_amount).toLocaleString('en-IN')}</div>
            </div>
            <div>
              <div className="text-[10px] text-[#95b8a5]">SUSPECT MULE</div>
              <div className="font-bold text-white mt-0.5">{registeredComplaint.beneficiary_account_id}</div>
            </div>
            <div>
              <div className="text-[10px] text-[#95b8a5]">STATUS</div>
              <div className="font-bold text-[#d4e9a8] uppercase mt-0.5">{registeredComplaint.complaint_status}</div>
            </div>
          </div>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={handleInterceptNow}
              className="w-full sm:w-auto flex-1 py-3 px-6 bg-[#c5e48d] hover:bg-white text-[#143227] font-mono font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#c5e48d]/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-current" />
              Launch Live Prediction Radar (Intercept Extraction)
            </button>

            <button
              onClick={() => setActiveTab('complaints')}
              className="w-full sm:w-auto py-3 px-4 bg-[#143227] hover:bg-[#20493b] border border-[#2e6250] text-white font-mono font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              View in Complaints Explorer
            </button>

            <button
              onClick={handleReset}
              className="w-full sm:w-auto py-3 px-4 bg-[#143227] hover:bg-[#20493b] border border-[#2e6250] text-[#95b8a5] hover:text-white font-mono text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              File Another
            </button>
          </div>
        </div>
      ) : (
        /* Form Card */
        <form onSubmit={handleSubmit} className="bg-[#183a2e]/90 border border-[#2e6250] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 backdrop-blur-md">
          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Mule Chips */}
          <div>
            <div className="text-[11px] font-mono text-[#95b8a5] mb-2 flex items-center justify-between">
              <span>RAPID PRE-FILL (KNOWN SUSPECT MULES IN DATABASE):</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_MULES.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => handleSelectQuickMule(m)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono border transition-all cursor-pointer ${
                    beneficiaryAccountId === m.id
                      ? 'bg-[#c5e48d] text-[#143227] border-[#c5e48d] font-bold shadow-sm'
                      : 'bg-[#143227] text-[#cfe0d5] border-[#2e6250] hover:border-[#c5e48d]'
                  }`}
                >
                  + {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 1: INCIDENT IDENTIFIERS & AMOUNTS */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#2e6250] pb-2">
              <DollarSign className="w-4 h-4 text-[#c5e48d]" />
              1. Incident Details & Disputed Amount
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-mono text-[#cfe0d5] mb-1">
                  COMPLAINT ID (OPTIONAL DOCKET #)
                </label>
                <input
                  type="text"
                  value={complaintId}
                  onChange={(e) => setComplaintId(e.target.value)}
                  placeholder="Leave blank for auto-ID (e.g. COMP000361)"
                  className="w-full px-3.5 py-2.5 bg-[#143227] border border-[#2e6250] rounded-xl text-xs font-mono text-[#c5e48d] font-bold focus:border-[#c5e48d] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#cfe0d5] mb-1">
                  INCIDENT DATE & TIME
                </label>
                <input
                  type="text"
                  value={complaintDate}
                  onChange={(e) => setComplaintDate(e.target.value)}
                  placeholder="YYYY-MM-DD HH:MM:SS"
                  className="w-full px-3.5 py-2.5 bg-[#143227] border border-[#2e6250] rounded-xl text-xs font-mono text-white focus:border-[#c5e48d] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#cfe0d5] mb-1">
                  FRAUD CATEGORY / MODUS OPERANDI *
                </label>
                <select
                  value={fraudType}
                  onChange={(e) => setFraudType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#143227] border border-[#2e6250] rounded-xl text-xs font-mono text-[#c5e48d] font-bold focus:border-[#c5e48d] focus:outline-none cursor-pointer"
                >
                  <option value="UPI fraud">UPI Fraud</option>
                  <option value="card fraud">Card Fraud</option>
                  <option value="phishing">Phishing</option>
                  <option value="investment scam">Investment Scam</option>
                  <option value="remote access scam">Remote Access Scam</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#cfe0d5] mb-1">
                  DISPUTED AMOUNT (INR ₹) *
                </label>
                <input
                  type="number"
                  value={reportedAmount}
                  onChange={(e) => setReportedAmount(e.target.value)}
                  placeholder="35000"
                  className="w-full px-3.5 py-2.5 bg-[#143227] border border-[#2e6250] rounded-xl text-xs font-mono text-white font-bold focus:border-[#c5e48d] focus:outline-none"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-mono text-[#cfe0d5] mb-1">
                  BANK TRANSACTION ID / UTR NUMBER (OPTIONAL)
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="e.g. TX00018492"
                  className="w-full px-3.5 py-2.5 bg-[#143227] border border-[#2e6250] rounded-xl text-xs font-mono text-white focus:border-[#c5e48d] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: MONEY TRAIL (VICTIM & MULE ACCOUNTS) */}
          <div className="space-y-4 pt-4">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#2e6250] pb-2">
              <CreditCard className="w-4 h-4 text-[#c5e48d]" />
              2. Money Trail (Victim & Beneficiary Mule Accounts)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-[#cfe0d5] mb-1">
                  VICTIM (COMPLAINANT) ACCOUNT ID *
                </label>
                <input
                  type="text"
                  value={victimAccountId}
                  onChange={(e) => setVictimAccountId(e.target.value)}
                  placeholder="e.g. ACC000512"
                  className="w-full px-3.5 py-2.5 bg-[#143227] border border-[#2e6250] rounded-xl text-xs font-mono text-white font-bold focus:border-[#c5e48d] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#cfe0d5] mb-1">
                  BENEFICIARY (SUSPECT MULE) ACCOUNT ID *
                </label>
                <input
                  type="text"
                  value={beneficiaryAccountId}
                  onChange={(e) => setBeneficiaryAccountId(e.target.value)}
                  placeholder="e.g. ACC000014"
                  className="w-full px-3.5 py-2.5 bg-[#143227] border border-[#2e6250] rounded-xl text-xs font-mono text-[#c5e48d] font-bold focus:border-[#c5e48d] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#cfe0d5] mb-1">
                  BENEFICIARY UPI ID / VPA HANDLE
                </label>
                <input
                  type="text"
                  value={beneficiaryUpiId}
                  onChange={(e) => setBeneficiaryUpiId(e.target.value)}
                  placeholder="user0014@syntheticupi"
                  className="w-full px-3.5 py-2.5 bg-[#143227] border border-[#2e6250] rounded-xl text-xs font-mono text-[#cfe0d5] focus:border-[#c5e48d] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#cfe0d5] mb-1">
                  TARGET EXTRACTION JURISDICTION (CITY) *
                </label>
                <select
                  value={beneficiaryCity}
                  onChange={(e) => setBeneficiaryCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#143227] border border-[#2e6250] rounded-xl text-xs font-mono text-white font-bold focus:border-[#c5e48d] focus:outline-none cursor-pointer"
                >
                  <option value="Jalandhar">Jalandhar</option>
                  <option value="Ludhiana">Ludhiana</option>
                  <option value="Amritsar">Amritsar</option>
                  <option value="Phagwara">Phagwara</option>
                  <option value="Kapurthala">Kapurthala</option>
                  <option value="Hoshiarpur">Hoshiarpur</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 3: CLASSIFICATION & REMARKS */}
          <div className="space-y-4 pt-4">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#2e6250] pb-2">
              <Shield className="w-4 h-4 text-[#c5e48d]" />
              3. Status & Investigation Remarks
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-[#cfe0d5] mb-1">
                  INVESTIGATION STATUS
                </label>
                <select
                  value={complaintStatus}
                  onChange={(e) => setComplaintStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#143227] border border-[#2e6250] rounded-xl text-xs font-mono text-white focus:border-[#c5e48d] focus:outline-none cursor-pointer"
                >
                  <option value="unresolved">Unresolved (Active Surveillance)</option>
                  <option value="under investigation">Under Investigation</option>
                  <option value="confirmed">Confirmed Fraud</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="flagMule"
                  checked={linkedFraudAccount === 1}
                  onChange={(e) => setLinkedFraudAccount(e.target.checked ? 1 : 0)}
                  className="w-4 h-4 rounded bg-[#143227] border-[#2e6250] text-[#c5e48d] focus:ring-0 cursor-pointer"
                />
                <label htmlFor="flagMule" className="text-xs font-mono text-white cursor-pointer">
                  Flag Beneficiary as Confirmed Fraud Mule Account
                </label>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-mono text-[#cfe0d5] mb-1">
                  OFFICER CASE NOTES / OPERATIONAL REMARKS
                </label>
                <textarea
                  rows={3}
                  value={officerNotes}
                  onChange={(e) => setOfficerNotes(e.target.value)}
                  placeholder="Case notes, complainant statement synopsis, or immediate patrol alerts..."
                  className="w-full px-3.5 py-2.5 bg-[#143227] border border-[#2e6250] rounded-xl text-xs font-mono text-white focus:border-[#c5e48d] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-between border-t border-[#2e6250]">
            <button
              type="button"
              onClick={() => {
                setReportedAmount('25000');
                setOfficerNotes('');
              }}
              className="px-4 py-2 bg-[#143227] hover:bg-[#20493b] border border-[#2e6250] text-[#95b8a5] hover:text-white text-xs font-mono rounded-xl transition-all cursor-pointer"
            >
              Clear Fields
            </button>

            <button
              type="submit"
              disabled={loading}
              className="py-3 px-8 bg-[#c5e48d] hover:bg-white text-[#143227] text-xs font-mono font-black tracking-wider uppercase rounded-xl transition-all shadow-lg shadow-[#c5e48d]/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[#143227]/30 border-t-[#143227] rounded-full animate-spin"></div>
                  Logging Incident...
                </>
              ) : (
                <>
                  <FilePlus className="w-4 h-4" />
                  Submit & Log Complaint
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

