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
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
              <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                OPERATIONAL EXTRACTION PREDICTION RADAR
              </h2>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              Forecast likely cash withdrawal ATMs in advance of fraudulent cash extraction
            </p>
          </div>
        </div>

        {/* Input Parameters Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5">
              COMPLAINT ID (PREDICTION TRIGGER)
            </label>
            <input
              type="text"
              value={complaintId}
              onChange={(e) => setComplaintId(e.target.value)}
              placeholder="e.g. COMP000009"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-cyan-400 font-bold focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5">
              OR SUSPECT MULE ACCOUNT ID
            </label>
            <input
              type="text"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="e.g. ACC000397"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-amber-400 font-bold focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5">
              REPORTED AMOUNT (INR ₹)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="25000"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-emerald-400 font-bold focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => runPrediction()}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white text-xs font-mono font-bold tracking-wider uppercase rounded-xl shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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
          <div className="mt-4 p-3 bg-red-950/60 border border-red-800 rounded-xl text-xs text-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* Standby Prompt when no prediction active */}
      {!prediction && !loading && (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-12 text-center">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 mx-auto rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-200 font-mono">
              Prediction Radar Standby
            </h3>
            <p className="text-xs font-mono text-slate-400 leading-relaxed">
              Enter a Complaint ID or Suspect Mule Account ID above, or select an incident from the Complaints Explorer to forecast likely cash extraction coordinates.
            </p>
          </div>
        </div>
      )}

      {/* Prediction Output Results */}
      {prediction && (
        <div className="space-y-6">
          {/* Official Law Enforcement Dispatch Advisory Banner */}
          <div className="bg-gradient-to-r from-red-950/80 via-slate-900 to-slate-900 border-2 border-red-600/60 rounded-2xl p-5 shadow-2xl relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldAlert className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-600 text-white">
                      OFFICIAL DISPATCH ADVISORY
                    </span>
                    <span className="text-[11px] font-mono text-slate-300">
                      Target Account: <strong className="text-amber-400">{prediction.target_account_id}</strong> ({prediction.account_summary.bank_id}) • City: <strong className="text-white">{prediction.account_summary.registered_city}</strong>
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-200 leading-relaxed">
                    {prediction.operational_advisory}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                <button
                  onClick={copyAdvisory}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-200 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button
                  onClick={downloadMemo}
                  title="Download Official Dispatch Memo text"
                  className="px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-xs font-mono text-cyan-300 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
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
                  <Compass className="w-4 h-4 text-cyan-400" />
                  GEOSPATIAL PERIMETER & RADAR VISUALIZATION
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  Target Perimeter: <span className="text-red-400 font-bold">3.0 km radius</span>
                </span>
              </div>

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

            {/* Recommendation Cards Column (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  TOP RECOMMENDED INTERCEPTION SITES
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
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
                          ? 'bg-red-950/30 border-red-600/80 shadow-xl shadow-red-950/50'
                          : rec.rank === 2
                          ? 'bg-slate-900/90 border-orange-500/50'
                          : 'bg-slate-900/90 border-slate-800'
                      }`}
                    >
                      {/* Card Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-6 h-6 rounded-full font-mono text-xs font-bold flex items-center justify-center text-white ${
                              isPrimary
                                ? 'bg-red-600'
                                : rec.rank === 2
                                ? 'bg-orange-500'
                                : 'bg-blue-600'
                            }`}
                          >
                            {rec.rank}
                          </span>
                          <span className="font-mono text-sm font-extrabold text-white">
                            {rec.candidate_atm_id}
                          </span>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {rec.bank_id}
                          </span>
                        </div>

                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            isPrimary
                              ? 'bg-red-600/20 text-red-400 border border-red-500/40'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {rec.status_tag}
                        </span>
                      </div>

                      {/* Distance & Habit telemetry */}
                      <div className="text-xs font-mono space-y-1 mb-3 text-slate-300">
                        <div className="flex justify-between">
                          <span className="text-slate-400">City / Jurisdiction:</span>
                          <span className="font-semibold text-white">{rec.city}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Distance from Last Location:</span>
                          <span className="font-bold text-cyan-400">{rec.distance_km} km</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Distance to Past Centroid:</span>
                          <span>{rec.dist_to_centroid} km</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Suspect Usage Habit:</span>
                          <span className="text-amber-400 font-semibold">{rec.habit_tag}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">ATM Fraud Extraction Rate:</span>
                          <span>{(rec.atm_fraud_intensity_ratio * 100).toFixed(1)}%</span>
                        </div>
                      </div>

                      {/* Calibrated Probability Bar */}
                      <div>
                        <div className="flex justify-between text-[11px] font-mono mb-1">
                          <span className="text-slate-400">Calibrated Intercept Score:</span>
                          <span className="font-bold text-white">{scorePercent}%</span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isPrimary
                                ? 'bg-gradient-to-r from-red-600 to-rose-500'
                                : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                            }`}
                            style={{ width: `${Math.min(Number(scorePercent), 100)}%` }}
                          ></div>
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 mt-1 flex justify-between">
                          <span>Model RF Prob: {rfPercent}%</span>
                          <span>Spatial Decay: {rec.spatial_decay_score}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Suspect Account Snapshot & Trail Button */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl text-xs font-mono space-y-2 text-slate-300">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-200 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-cyan-400" />
                    SUSPECT ACCOUNT DOSSIER
                  </div>
                  <button
                    onClick={openAccountHistory}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer"
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-cyan-400" />
                <h3 className="font-mono font-bold text-white text-sm">
                  SUSPECT ATM EXTRACTION TIMELINE ({prediction?.target_account_id})
                </h3>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingHistory ? (
              <div className="py-12 text-center text-slate-400 font-mono text-xs">
                <div className="w-6 h-6 border-2 border-slate-600 border-t-cyan-400 rounded-full animate-spin mx-auto mb-2"></div>
                Loading historical withdrawal records...
              </div>
            ) : accountDetail?.withdrawals?.length === 0 ? (
              <div className="py-8 text-center text-slate-400 font-mono text-xs">
                No previous ATM cash extractions recorded for this account.
              </div>
            ) : (
              <div className="space-y-3 font-mono text-xs">
                <div className="text-[11px] text-slate-400">
                  Total Withdrawals: <strong className="text-white">{accountDetail?.account?.historical_withdrawals_count}</strong> | Total Amount Extracted: <strong className="text-emerald-400">₹{accountDetail?.account?.total_withdrawn_amount?.toLocaleString('en-IN')}</strong>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                        <th className="py-2">DATE & TIME</th>
                        <th className="py-2">ATM ID</th>
                        <th className="py-2">CITY</th>
                        <th className="py-2 text-right">AMOUNT (₹)</th>
                        <th className="py-2 text-center">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-[11px]">
                      {accountDetail?.withdrawals?.map((w) => (
                        <tr key={w.withdrawal_id} className="hover:bg-slate-800/30">
                          <td className="py-2 text-slate-300">{w.withdrawal_datetime}</td>
                          <td className="py-2 font-bold text-cyan-400">{w.atm_id}</td>
                          <td className="py-2 text-slate-300">{w.atm_city}</td>
                          <td className="py-2 text-right font-bold text-emerald-400">
                            ₹{w.amount?.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2 text-center">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px]">
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
