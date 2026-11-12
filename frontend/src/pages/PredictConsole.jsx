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
  Clock,
  Sparkles,
  Layers,
  ChevronRight,
  TrendingUp,
  Filter,
  Eye,
} from 'lucide-react';
import MapView from '../components/MapView';
import api from '../services/api';

const INDIAN_REGIONS = [
  { id: 'Jalandhar', label: 'Jalandhar (Punjab)', center: [31.3260, 75.5762], zoom: 13 },
  { id: 'Ludhiana', label: 'Ludhiana (Punjab)', center: [30.9010, 75.8573], zoom: 13 },
  { id: 'Amritsar', label: 'Amritsar (Punjab)', center: [31.6340, 74.8723], zoom: 13 },
  { id: 'Phagwara', label: 'Phagwara (Punjab)', center: [31.2240, 75.7708], zoom: 13 },
  { id: 'Kapurthala', label: 'Kapurthala (Punjab)', center: [31.3800, 75.3800], zoom: 13 },
  { id: 'Hoshiarpur', label: 'Hoshiarpur (Punjab)', center: [31.5300, 75.9100], zoom: 13 },
  { id: 'All', label: 'All Punjab Region', center: [31.2500, 75.7000], zoom: 9 },
];

const QUICK_CASES = [
  { id: 'COMP000009', label: 'COMP000009 (Jalandhar ₹25k)', type: 'complaint', region: 'Jalandhar' },
  { id: 'COMP000021', label: 'COMP000021 (Ludhiana ₹45k)', type: 'complaint', region: 'Ludhiana' },
  { id: 'COMP000042', label: 'COMP000042 (Amritsar High-Risk)', type: 'complaint', region: 'Amritsar' },
  { id: 'ACC000397', label: 'ACC000397 (Mule Master)', type: 'account', region: 'Jalandhar' },
  { id: 'ACC000001', label: 'ACC000001 (Rapid Extraction)', type: 'account', region: 'Phagwara' },
];

export default function PredictConsole({ selectedComplaintId, setSelectedComplaintId }) {
  const [complaintId, setComplaintId] = useState(selectedComplaintId || '');
  const [accountId, setAccountId] = useState('');
  const [amount, setAmount] = useState(25000);
  const [topK, setTopK] = useState(3);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Region and ATMs on OpenStreetMap
  const [selectedRegion, setSelectedRegion] = useState('Jalandhar');
  const [regionalAtms, setRegionalAtms] = useState([]);
  const [loadingAtms, setLoadingAtms] = useState(false);

  // Prediction History Modal state
  const [showPredictionHistoryModal, setShowPredictionHistoryModal] = useState(false);
  const [predictionHistoryList, setPredictionHistoryList] = useState([]);
  const [loadingPredHistory, setLoadingPredHistory] = useState(false);

  // Suspect history modal state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [accountDetail, setAccountDetail] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Fetch ATMs for the active region in India
  useEffect(() => {
    fetchRegionalAtms(selectedRegion);
  }, [selectedRegion]);

  const fetchRegionalAtms = async (regionId) => {
    try {
      setLoadingAtms(true);
      const queryCity = regionId === 'All' ? undefined : regionId;
      const res = await api.getAtms({ city: queryCity });
      setRegionalAtms(res.atms || []);
    } catch (e) {
      console.error('Failed to load ATMs for region:', e);
    } finally {
      setLoadingAtms(false);
    }
  };

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

      // Automatically sync OpenStreetMap region with the complaint/account's registered city
      if (res.account_summary?.registered_city) {
        const city = res.account_summary.registered_city;
        setSelectedRegion(city);
        fetchRegionalAtms(city);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to generate prediction. Check input IDs.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const openPredictionHistory = async () => {
    try {
      setLoadingPredHistory(true);
      setShowPredictionHistoryModal(true);
      const res = await api.getPredictionHistory({ limit: 50 });
      setPredictionHistoryList(res.history || []);
    } catch (e) {
      console.error('Failed to load prediction history:', e);
    } finally {
      setLoadingPredHistory(false);
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
Registered Region: ${prediction.account_summary.registered_city}, India
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
Location:   ${r.city}, Punjab, India (Lat: ${r.latitude}, Lon: ${r.longitude})
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
AUTHORIZED LAW ENFORCEMENT CYBERCRIME INTELLIGENCE UNIT (INDIA)
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

  // Active Indian region center & zoom
  const currentRegionConfig =
    INDIAN_REGIONS.find((r) => r.id.toLowerCase() === selectedRegion.toLowerCase()) ||
    INDIAN_REGIONS[0];

  const mapCenter = prediction?.account_summary?.ref_latitude
    ? [prediction.account_summary.ref_latitude, prediction.account_summary.ref_longitude]
    : currentRegionConfig.center;

  const mapZoom = currentRegionConfig.zoom;

  return (
    <div className="space-y-6">
      {/* Search & Control Console */}
      <div className="bg-[#183a2e]/90 border border-[#2e6250] rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-4 border-b border-[#2e6250]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#143227] text-[#c5e48d] border border-[#2e6250]">
                MODULE 05
              </span>
              <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#c5e48d]" />
                LIVE AI RADAR &amp; OPENSTREETMAP PREDICTIVE EXTRACTION
              </h2>
            </div>
            <p className="text-xs font-mono text-[#95b8a5] mt-0.5">
              Forecast likely cash withdrawal ATMs in advance on the OpenStreetMap of Indian jurisdictions.
            </p>
          </div>

          <button
            onClick={openPredictionHistory}
            className="px-3.5 py-2 bg-[#143227] hover:bg-[#20493b] border border-[#2e6250] hover:border-[#c5e48d] text-[#c5e48d] rounded-xl text-xs font-mono transition-all flex items-center gap-2 cursor-pointer shadow-sm self-start md:self-center"
          >
            <History className="w-4 h-4" />
            PREDICTION HISTORY
          </button>
        </div>

        {/* Quick Suspect & Case Chips */}
        <div className="flex flex-wrap items-center gap-1.5 mb-4 pb-3 border-b border-[#2e6250]/60">
          <span className="text-[11px] font-mono text-[#95b8a5] mr-1">Quick Scenarios:</span>
          {QUICK_CASES.map((qc) => (
            <button
              key={qc.id}
              onClick={() => {
                if (qc.region) setSelectedRegion(qc.region);
                if (qc.type === 'complaint') {
                  setComplaintId(qc.id);
                  setAccountId('');
                  runPrediction({ complaint_id: qc.id, amount, top_k: topK });
                } else {
                  setAccountId(qc.id);
                  setComplaintId('');
                  runPrediction({ account_id: qc.id, amount, top_k: topK });
                }
              }}
              className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-[#143227] text-[#95b8a5] border border-[#2e6250] hover:text-white hover:border-[#3e7863] transition-all cursor-pointer"
            >
              {qc.label}
            </button>
          ))}
        </div>

        {/* Input Parameters Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-mono text-[#cfe0d5] mb-1.5">
              COMPLAINT ID (TRIGGER)
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
              className="w-full py-2.5 px-4 bg-[#c5e48d] hover:bg-[#d6f0a4] text-[#143227] text-xs font-mono font-bold tracking-wider uppercase rounded-xl shadow-lg shadow-[#c5e48d]/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
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
          <div className="mt-4 p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-200 flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* Indian Region Explorer Bar */}
      <div className="bg-[#183a2e]/90 border border-[#2e6250] rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-mono text-white shrink-0">
          <Navigation className="w-4 h-4 text-[#c5e48d]" />
          <span className="font-bold">REGION OF INDIA (OPENSTREETMAP):</span>
        </div>

        {/* Region Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {INDIAN_REGIONS.map((reg) => {
            const isSelected = selectedRegion.toLowerCase() === reg.id.toLowerCase();
            return (
              <button
                key={reg.id}
                onClick={() => {
                  setSelectedRegion(reg.id);
                  fetchRegionalAtms(reg.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all shrink-0 cursor-pointer ${isSelected
                    ? 'bg-[#c5e48d] text-[#183a2e] font-bold shadow-md'
                    : 'bg-[#143227] text-[#95b8a5] border border-[#2e6250] hover:text-white'
                  }`}
              >
                {reg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Prediction Advisory Header Banner (If Prediction Generated) */}
      {prediction && (
        <div className="bg-gradient-to-r from-[#143227] via-[#1a3f32] to-[#143227] border-2 border-[#c5e48d] rounded-2xl p-5 shadow-2xl relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#c5e48d]/10 border border-[#c5e48d]/40 flex items-center justify-center shrink-0 mt-0.5 text-[#c5e48d]">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#c5e48d] text-[#143227]">
                    PREDICTED EXTRACTION WINDOW
                  </span>
                  <span className="text-[11px] font-mono text-emerald-300 font-bold">
                    ACTIVE WINDOW: NEXT 1.5 TO 3.5 HOURS
                  </span>
                  <span className="text-[11px] font-mono text-[#cfe0d5]">
                    • Expected Amount: <strong className="text-white">₹{prediction.reported_amount.toLocaleString('en-IN')}</strong>
                  </span>
                  <span className="text-[11px] font-mono text-[#c5e48d]">
                    • Region: <strong className="text-white">{prediction.account_summary?.registered_city}, Punjab, India</strong>
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
      )}

      {/* Main Interactive OpenStreetMap Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* OpenStreetMap Column (7 cols or 12 cols if standby) */}
        <div className={prediction ? 'lg:col-span-7 space-y-3' : 'lg:col-span-12 space-y-3'}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#c5e48d]" />
              OPENSTREETMAP TACTICAL RADAR — {selectedRegion.toUpperCase()}, PUNJAB, INDIA
            </h3>
            <span className="text-[11px] font-mono text-[#95b8a5]">
              {loadingAtms ? (
                'Loading cashpoints...'
              ) : (
                <>
                  Displaying <strong className="text-[#c5e48d]">{regionalAtms.length} ATMs</strong> on OpenStreetMap
                </>
              )}
            </span>
          </div>

            <div
              className="rounded-2xl overflow-hidden border border-[#2e6250] shadow-2xl relative w-full"
              style={{ height: prediction ? '540px' : '480px', minHeight: prediction ? '540px' : '480px' }}
            >
              <MapView
                center={mapCenter}
                zoom={mapZoom}
                recommendations={prediction?.recommendations || []}
                accountSummary={prediction?.account_summary || null}
                allAtms={regionalAtms}
                height={prediction ? '540px' : '480px'}
                className="w-full h-full"
                defaultTileMode="osm"
              />
            </div>

            {!prediction && (
              <div className="p-3 bg-[#143227] border border-[#2e6250] rounded-xl flex items-center justify-between text-xs font-mono text-[#95b8a5]">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#c5e48d] animate-ping" />
                  All {regionalAtms.length} monitored ATMs in {selectedRegion}, India plotted on OpenStreetMap above.
                </span>
                <span className="text-[#c5e48d]">Click any ATM for banking coordinates &amp; fraud telemetry.</span>
              </div>
            )}
          </div>

          {/* Recommendation Cards Column (5 cols, visible when prediction is active) */}
          {prediction && (
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#c5e48d]" />
                  TOP 3 RANKED INTERCEPTION ATMS
                </h3>
                <span className="text-[11px] font-mono text-[#95b8a5]">
                  Calibrated RF Model
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
                      className={`p-4 rounded-2xl border transition-all ${isPrimary
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
                            className={`w-6 h-6 rounded-full font-mono text-xs font-bold flex items-center justify-center ${isPrimary
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
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${isPrimary
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
                          <span className="font-semibold text-white">{rec.city}, Punjab, India</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#95b8a5]">Distance from Last Location:</span>
                          <span className="font-bold text-[#c5e48d]">{rec.distance_km} km</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#95b8a5]">Usage Habit:</span>
                          <span className="text-[#d4e9a8] font-semibold">{rec.habit_tag}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#95b8a5]">Historical Fraud Extraction:</span>
                          <span className="text-rose-400 font-bold">{(rec.atm_fraud_intensity_ratio * 100).toFixed(1)}%</span>
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
                          <span>RF Prob: {rfPercent}%</span>
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
                    View Extraction Timeline →
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <div>Account: <strong className="text-white">{prediction.account_summary.account_id}</strong></div>
                  <div>Bank: <span className="text-white">{prediction.account_summary.bank_id}</span></div>
                  <div>Region: <span className="text-white">{prediction.account_summary.registered_city}, India</span></div>
                  <div>Prior Extractions: <span className="text-white">{prediction.account_summary.prior_withdrawals_count}</span></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PREDICTION HISTORY MODAL */}
        {showPredictionHistoryModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#183a2e] border border-[#2e6250] rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl relative max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#2e6250]">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-[#c5e48d]" />
                  <h3 className="font-mono font-bold text-white text-sm">
                    HISTORICAL PREDICTIONS &amp; DISPATCH RADAR LOGS
                  </h3>
                </div>
                <button
                  onClick={() => setShowPredictionHistoryModal(false)}
                  className="text-[#95b8a5] hover:text-white p-1 rounded-lg hover:bg-[#20493b] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loadingPredHistory ? (
                <div className="py-12 text-center text-[#95b8a5] font-mono text-xs">
                  <div className="w-6 h-6 border-2 border-[#2e6250] border-t-[#c5e48d] rounded-full animate-spin mx-auto mb-2"></div>
                  Loading predictions archive from database...
                </div>
              ) : predictionHistoryList.length === 0 ? (
                <div className="py-8 text-center text-[#95b8a5] font-mono text-xs">
                  No past predictions logged yet. Run a prediction to record in this log.
                </div>
              ) : (
                <div className="space-y-2">
                  {predictionHistoryList.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-[#143227] border border-[#2e6250] hover:border-[#c5e48d] rounded-xl flex items-center justify-between text-xs font-mono transition-all"
                    >
                      <div>
                        <div className="flex items-center gap-2 text-white font-bold">
                          <span>{item.complaint_id || 'STANDALONE_RUN'}</span>
                          <span className="text-[#95b8a5] font-normal">• Account: {item.account_id}</span>
                          <span className="text-[#c5e48d]">₹{(item.amount || item.expected_amount || 0).toLocaleString()}</span>
                        </div>
                        <div className="text-[11px] text-[#95b8a5] mt-1 flex items-center gap-3">
                          <span>Top 1: <strong className="text-white">{item.top1_atm_id}</strong> ({((item.top1_score || 0) * 100).toFixed(1)}%)</span>
                          <span>City: {item.registered_city}, India</span>
                          <span>Officer: {item.generated_by_officer_name || item.generated_by_officer_id}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] text-[#95b8a5]">{item.created_at?.slice(0, 16) || 'Recent'}</div>
                        <button
                          onClick={() => {
                            setShowPredictionHistoryModal(false);
                            if (item.registered_city) setSelectedRegion(item.registered_city);
                            if (item.complaint_id) {
                              setComplaintId(item.complaint_id);
                              runPrediction({ complaint_id: item.complaint_id, amount: item.amount, top_k: 3 });
                            } else {
                              setAccountId(item.account_id);
                              runPrediction({ account_id: item.account_id, amount: item.amount, top_k: 3 });
                            }
                          }}
                          className="mt-1 px-2.5 py-1 bg-[#183a2e] hover:bg-[#c5e48d] hover:text-[#183a2e] text-[#c5e48d] font-bold text-[10px] rounded-lg border border-[#2e6250] cursor-pointer transition-all inline-flex items-center gap-1"
                        >
                          Re-load Radar <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                          <th className="py-2">DATE &amp; TIME</th>
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
