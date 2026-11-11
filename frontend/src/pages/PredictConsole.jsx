import React, { useState, useEffect } from 'react';
import {
  Compass,
  Zap,
  ShieldAlert,
  Copy,
  Check,
  AlertCircle,
  MapPin,
  Download,
  History,
  Building,
  Navigation,
  FileText,
  X,
} from 'lucide-react';
import MapView from '../components/MapView';
import api from '../services/api';

export default function PredictConsole({ selectedComplaintId, setSelectedComplaintId }) {
  const [complaintId, setComplaintId] = useState(selectedComplaintId || '');
  const [accountId, setAccountId] = useState('');
  const [amount, setAmount] = useState(25000);
  const [topK, setTopK] = useState(3);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Suspect history modal state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [accountDetail, setAccountDetail] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Trigger when a complaint is passed from complaints list
  useEffect(() => {
    if (selectedComplaintId) {
      setComplaintId(selectedComplaintId);
      runPrediction({ complaint_id: selectedComplaintId, amount, top_k: topK });
    }
  }, [selectedComplaintId]);

  const runPrediction = async (customPayload = null) => {
    const cId = customPayload?.complaint_id !== undefined ? customPayload.complaint_id : complaintId.trim();
    const aId = customPayload?.account_id !== undefined ? customPayload.account_id : accountId.trim();

    if (!cId && !aId) {
      setError('Please enter either a Complaint ID or a Suspect Mule Account ID.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        complaint_id: cId || undefined,
        account_id: !cId && aId ? aId : undefined,
        amount: Number(amount) || 25000,
        top_k: Number(topK) || 3,
      };

      const res = await api.predict(payload);
      setPrediction(res);
      if (res.target_account_id) {
        setAccountId(res.target_account_id);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to generate prediction. Check input IDs.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const copyAdvisory = () => {
    if (!prediction?.operational_advisory) return;
    navigator.clipboard.writeText(prediction.operational_advisory);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadMemo = () => {
    if (!prediction) return;
    const memo = `============================================================================
      RELIC LAW ENFORCEMENT DISPATCH MEMORANDUM (CONFIDENTIAL)
============================================================================
Generated At:      ${new Date().toLocaleString()}
Target Account:    ${prediction.target_account_id} (${prediction.account_summary.bank_id})
Registered Region: ${prediction.account_summary.registered_city}
Reported Amount:   INR ${prediction.reported_amount.toLocaleString('en-IN')}
Prediction Trigger:${prediction.complaint_id || 'Mule Account Monitoring'}
Prior Extractions: ${prediction.account_summary.prior_withdrawals_count} historical ATM transactions
Last Known ATM:    ${prediction.account_summary.last_atm_id || 'N/A'} (${prediction.account_summary.last_atm_city || prediction.account_summary.registered_city})

----------------------------------------------------------------------------
RECOMMENDED INTERCEPTION TARGETS (RANKED BY ENSEMBLE CALIBRATED SCORE):
----------------------------------------------------------------------------
${prediction.recommendations
  .map(
    (r) => `
[RANK ${r.rank}] ${r.status_tag} -> ${r.candidate_atm_id} (${r.bank_id})
Location:   ${r.city} (Lat: ${r.latitude}, Lon: ${r.longitude})
Distance:   ${r.distance_km} km from last known position
Centroid:   ${r.dist_to_centroid} km from historical centroid
Habit:      ${r.habit_tag}
Confidence: Calibrated Score: ${(r.cal_score * 100).toFixed(1)}% (RF Model Prob: ${(r.rf_prob * 100).toFixed(1)}%)
`
  )
  .join('')}

----------------------------------------------------------------------------
OPERATIONAL ADVISORY DIRECTIVE:
----------------------------------------------------------------------------
${prediction.operational_advisory}

============================================================================
AUTHORIZED LAW ENFORCEMENT CYBERCRIME INTELLIGENCE UNIT
============================================================================`;

    const blob = new Blob([memo], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `RELIC_DISPATCH_${prediction.target_account_id}_${prediction.recommendations[0]?.candidate_atm_id || 'ATM'}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const openAccountHistory = async () => {
    if (!prediction?.target_account_id) return;
    try {
      setLoadingHistory(true);
      setShowHistoryModal(true);
      const detail = await api.getAccountDetail(prediction.target_account_id);
      setAccountDetail(detail);
    } catch (e) {
      console.error('Failed to load account history:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Control Console */}
      <div className="bg-[#183a2e]/90 border border-[#2e6250] rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-5 border-b border-[#2e6250]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#c5e48d] animate-ping"></span>
              <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                OPERATIONAL EXTRACTION PREDICTION RADAR
              </h2>
            </div>
            <p className="text-xs font-mono text-[#95b8a5] mt-0.5">
              Forecast likely cash withdrawal ATMs in advance of fraudulent cash extraction
            </p>
          </div>
        </div>

        {/* Input Parameters Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-mono text-[#cfe0d5] mb-1.5">
              COMPLAINT ID (PREDICTION TRIGGER)
            </label>
            <input
              type="text"
              value={complaintId}
              onChange={(e) => setComplaintId(e.target.value)}
              placeholder="e.g. COMP000009"
              className="w-full px-3.5 py-2.5 bg-[#143227] border border-[#2e6250] rounded-xl text-xs font-mono text-[#c5e48d] font-bold focus:border-[#c5e48d] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-[#cfe0d5] mb-1.5">
              OR SUSPECT MULE ACCOUNT ID
            </label>
            <input
              type="text"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="e.g. ACC000397"
              className="w-full px-3.5 py-2.5 bg-[#143227] border border-[#2e6250] rounded-xl text-xs font-mono text-[#d4e9a8] font-bold focus:border-[#c5e48d] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-[#cfe0d5] mb-1.5">
              REPORTED AMOUNT (INR ₹)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="25000"
              className="w-full px-3.5 py-2.5 bg-[#143227] border border-[#2e6250] rounded-xl text-xs font-mono text-white font-bold focus:border-[#c5e48d] focus:outline-none transition-colors"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => runPrediction()}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#c5e48d] hover:bg-white text-[#143227] text-xs font-mono font-bold tracking-wider uppercase rounded-xl shadow-lg shadow-[#c5e48d]/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[#143227]/30 border-t-[#143227] rounded-full animate-spin"></div>
                  Computing Radar...
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  Predict Interception
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* Standby Prompt when no prediction active */}
      {!prediction && !loading && (
        <div className="bg-[#183a2e]/60 border border-[#2e6250]/80 rounded-2xl p-12 text-center">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 mx-auto rounded-xl bg-[#20493b] border border-[#2e6250] flex items-center justify-center text-[#c5e48d]">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white font-mono">
              Prediction Radar Standby
            </h3>
            <p className="text-xs font-mono text-[#95b8a5] leading-relaxed">
              Enter a Complaint ID or Suspect Mule Account ID above, or select an incident from the Complaints Explorer to forecast likely cash extraction coordinates.
            </p>
          </div>
        </div>
      )}

      {/* Prediction Output Results */}
      {prediction && (
        <div className="space-y-6">
          {/* Official Law Enforcement Dispatch Advisory Banner */}
          <div className="bg-gradient-to-r from-[#143227] via-[#1a3f32] to-[#143227] border-2 border-[#c5e48d]/80 rounded-2xl p-5 shadow-2xl relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#c5e48d]/10 border border-[#c5e48d]/40 flex items-center justify-center shrink-0 mt-0.5 text-[#c5e48d]">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#c5e48d] text-[#143227]">
                      OFFICIAL DISPATCH ADVISORY
                    </span>
                    <span className="text-[11px] font-mono text-[#cfe0d5]">
                      Target Account: <strong className="text-[#c5e48d]">{prediction.target_account_id}</strong> ({prediction.account_summary.bank_id}) • City: <strong className="text-white">{prediction.account_summary.registered_city}</strong>
                    </span>
                  </div>
                  <p className="text-xs font-mono text-white leading-relaxed">
                    {prediction.operational_advisory}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                <button
                  onClick={copyAdvisory}
                  className="px-3 py-1.5 bg-[#20493b] hover:bg-[#285343] border border-[#2e6250] text-xs font-mono text-white rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#c5e48d]" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button
                  onClick={downloadMemo}
                  title="Download Official Dispatch Memo text"
                  className="px-3 py-1.5 bg-[#143227] hover:bg-[#285343] border border-[#c5e48d]/50 text-xs font-mono text-[#c5e48d] rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Save Memo (.txt)
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Map & Top-3 Cards Split View */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Map Column (7 cols) */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#c5e48d]" />
                  GEOSPATIAL PERIMETER & RADAR VISUALIZATION
                </h3>
                <span className="text-[11px] font-mono text-[#95b8a5]">
                  Target Perimeter: <span className="text-[#c5e48d] font-bold">3.0 km radius</span>
                </span>
              </div>

              <div className="rounded-2xl overflow-hidden border border-[#2e6250] shadow-xl">
                <MapView
                  center={[
                    prediction.account_summary.ref_latitude,
                    prediction.account_summary.ref_longitude,
                  ]}
                  zoom={13}
                  recommendations={prediction.recommendations}
                  accountSummary={prediction.account_summary}
                  className="w-full h-[520px]"
                />
              </div>
            </div>

            {/* Recommendation Cards Column (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#c5e48d]" />
                  TOP RECOMMENDED INTERCEPTION SITES
                </h3>
                <span className="text-[11px] font-mono text-[#95b8a5]">
                  Model: Calibrated RF
                </span>
              </div>

              <div className="space-y-3">
                {prediction.recommendations.map((rec) => {
                  const isPrimary = rec.rank === 1;
                  const scorePercent = (rec.cal_score * 100).toFixed(1);
                  const rfPercent = (rec.rf_prob * 100).toFixed(1);

                  return (
                    <div
                      key={rec.candidate_atm_id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isPrimary
                          ? 'bg-[#1f4b3a] border-2 border-[#c5e48d] shadow-xl shadow-[#143227]/60'
                          : rec.rank === 2
                          ? 'bg-[#183a2e] border-[#3e7260]'
                          : 'bg-[#183a2e] border-[#2e6250]'
                      }`}
                    >
                      {/* Card Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-6 h-6 rounded-full font-mono text-xs font-bold flex items-center justify-center ${
                              isPrimary
                                ? 'bg-[#c5e48d] text-[#143227]'
                                : 'bg-[#285343] text-white border border-[#2e6250]'
                            }`}
                          >
                            {rec.rank}
                          </span>
                          <span className="font-mono text-sm font-extrabold text-white">
                            {rec.candidate_atm_id}
                          </span>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#143227] text-[#95b8a5] border border-[#2e6250]">
                            {rec.bank_id}
                          </span>
                        </div>

                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            isPrimary
                              ? 'bg-[#c5e48d]/20 text-[#c5e48d] border border-[#c5e48d]/50'
                              : 'bg-[#143227] text-[#95b8a5] border border-[#2e6250]'
                          }`}
                        >
                          {rec.status_tag}
                        </span>
                      </div>

                      {/* Distance & Habit telemetry */}
                      <div className="text-xs font-mono space-y-1 mb-3 text-[#cfe0d5]">
                        <div className="flex justify-between">
                          <span className="text-[#95b8a5]">City / Jurisdiction:</span>
                          <span className="font-semibold text-white">{rec.city}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#95b8a5]">Distance from Last Location:</span>
                          <span className="font-bold text-[#c5e48d]">{rec.distance_km} km</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#95b8a5]">Distance to Past Centroid:</span>
                          <span>{rec.dist_to_centroid} km</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#95b8a5]">Suspect Usage Habit:</span>
                          <span className="text-[#d4e9a8] font-semibold">{rec.habit_tag}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#95b8a5]">ATM Fraud Extraction Rate:</span>
                          <span>{(rec.atm_fraud_intensity_ratio * 100).toFixed(1)}%</span>
                        </div>
                      </div>

                      {/* Calibrated Probability Bar */}
                      <div>
                        <div className="flex justify-between text-[11px] font-mono mb-1">
                          <span className="text-[#95b8a5]">Calibrated Intercept Score:</span>
                          <span className="font-bold text-white">{scorePercent}%</span>
                        </div>
                        <div className="w-full bg-[#143227] rounded-full h-2 overflow-hidden border border-[#2e6250]">
                          <div
                            className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[#7ca980] via-[#b5d2a1] to-[#d4e9a8]"
                            style={{ width: `${Math.min(Number(scorePercent), 100)}%` }}
                          ></div>
                        </div>
                        <div className="text-[10px] font-mono text-[#95b8a5] mt-1 flex justify-between">
                          <span>Model RF Prob: {rfPercent}%</span>
                          <span>Spatial Decay: {rec.spatial_decay_score}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Suspect Account Snapshot & Trail Button */}
              <div className="p-4 bg-[#183a2e] border border-[#2e6250] rounded-xl text-xs font-mono space-y-2 text-[#cfe0d5]">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-[#c5e48d]" />
                    SUSPECT ACCOUNT DOSSIER
                  </div>
                  <button
                    onClick={openAccountHistory}
                    className="text-[11px] text-[#c5e48d] hover:text-white font-bold underline cursor-pointer"
                  >
                    View Money Trail →
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <div>Account: <strong className="text-white">{prediction.account_summary.account_id}</strong></div>
                  <div>Bank: <span className="text-white">{prediction.account_summary.bank_id}</span></div>
                  <div>Region: <span className="text-white">{prediction.account_summary.registered_city}</span></div>
                  <div>Prior Extractions: <span className="text-white">{prediction.account_summary.prior_withdrawals_count}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suspect Money Trail / History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#183a2e] border border-[#2e6250] rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#2e6250]">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#c5e48d]" />
                <h3 className="font-mono font-bold text-white text-sm">
                  SUSPECT ATM EXTRACTION TIMELINE ({prediction?.target_account_id})
                </h3>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-[#95b8a5] hover:text-white p-1 rounded-lg hover:bg-[#20493b] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingHistory ? (
              <div className="py-12 text-center text-[#95b8a5] font-mono text-xs">
                <div className="w-6 h-6 border-2 border-[#2e6250] border-t-[#c5e48d] rounded-full animate-spin mx-auto mb-2"></div>
                Loading historical withdrawal records...
              </div>
            ) : accountDetail?.withdrawals?.length === 0 ? (
              <div className="py-8 text-center text-[#95b8a5] font-mono text-xs">
                No previous ATM cash extractions recorded for this account.
              </div>
            ) : (
              <div className="space-y-3 font-mono text-xs">
                <div className="text-[11px] text-[#cfe0d5]">
                  Total Withdrawals: <strong className="text-white">{accountDetail?.account?.historical_withdrawals_count}</strong> | Total Amount Extracted: <strong className="text-[#c5e48d]">₹{accountDetail?.account?.total_withdrawn_amount?.toLocaleString('en-IN')}</strong>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[#2e6250] text-[#95b8a5] text-[11px]">
                        <th className="py-2">DATE & TIME</th>
                        <th className="py-2">ATM ID</th>
                        <th className="py-2">CITY</th>
                        <th className="py-2 text-right">AMOUNT (₹)</th>
                        <th className="py-2 text-center">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2e6250]/60 text-[11px]">
                      {accountDetail?.withdrawals?.map((w) => (
                        <tr key={w.withdrawal_id} className="hover:bg-[#20493b]/40">
                          <td className="py-2 text-[#cfe0d5]">{w.withdrawal_datetime}</td>
                          <td className="py-2 font-bold text-[#c5e48d]">{w.atm_id}</td>
                          <td className="py-2 text-[#cfe0d5]">{w.atm_city}</td>
                          <td className="py-2 text-right font-bold text-white">
                            ₹{w.amount?.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2 text-center">
                            <span className="px-1.5 py-0.5 rounded bg-[#143227] text-[#c5e48d] border border-[#2e6250] text-[10px]">
                              {w.withdrawal_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
