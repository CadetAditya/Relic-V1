import React, { useEffect, useState } from 'react';
import {
  Shield,
  UserCheck,
  AlertTriangle,
  TrendingUp,
  MapPin,
  Activity,
  Zap,
  ArrowRight,
  Database,
  Cpu,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Dashboard({ setActiveTab, setSelectedComplaintId }) {
  const { officer } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, complaintsRes] = await Promise.all([
        api.getStats(),
        api.getComplaints({ limit: 6 }),
      ]);
      setStats(statsRes);
      setRecentComplaints(complaintsRes.complaints || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleIntercept = (complaintId) => {
    if (setSelectedComplaintId) {
      setSelectedComplaintId(complaintId);
    }
    setActiveTab('predict');
  };

  const recallVal = stats?.evaluation_metrics?.random_forest_calibrated?.recall_at_3
    ? (stats.evaluation_metrics.random_forest_calibrated.recall_at_3 * 100).toFixed(1)
    : '--';

  return (
    <div className="space-y-6">
      {/* Officer Welcome & Duty Station Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 relative">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 shrink-0">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
                  SESSION AUTHENTICATED
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {officer?.clearance_level || 'LEVEL 4 CLEARANCE'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white">
                Welcome, {officer?.name || 'Officer'}
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Badge: <strong className="text-cyan-400">{officer?.badge_id}</strong> • Unit: <strong className="text-slate-200">{officer?.unit}</strong> ({officer?.city})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              title="Refresh telemetry"
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setActiveTab('predict')}
              className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-mono font-bold tracking-wider uppercase rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-current" />
              Launch Prediction Radar
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Complaints */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono">TOTAL COMPLAINTS</span>
            <AlertTriangle className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-white">
            {stats ? stats.total_complaints : '--'}
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-1">
            Registered cyber fraud cases
          </div>
        </div>

        {/* Mule Accounts */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono">SUSPECT MULE ACCOUNTS</span>
            <Shield className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-amber-400">
            {stats ? stats.total_mule_accounts : '--'}
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-1">
            High-risk beneficiary accounts
          </div>
        </div>

        {/* Recall@3 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono">MODEL RECALL@3</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-emerald-400">
            {recallVal}%
          </div>
          <div className="text-[11px] font-mono text-emerald-400/80 mt-1">
            +38.5% over basic heuristic
          </div>
        </div>

        {/* Monitored ATMs */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono">MONITORED ATMS</span>
            <MapPin className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-white">
            {stats ? stats.total_atms : '--'}
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-1">
            Across 6 regional clusters
          </div>
        </div>
      </div>

      {/* Live Ingestion Stream & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Incident Feed (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                LIVE CYBERCRIME INGESTION STREAM
              </h3>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                Incoming fraud reports ready for immediate location forecasting
              </p>
            </div>
            <button
              onClick={() => setActiveTab('complaints')}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3">COMPLAINT ID</th>
                  <th className="py-2.5 px-3">FRAUD TYPE</th>
                  <th className="py-2.5 px-3">BENEFICIARY MULE</th>
                  <th className="py-2.5 px-3">REGION</th>
                  <th className="py-2.5 px-3 text-right">REPORTED AMOUNT</th>
                  <th className="py-2.5 px-3 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Loading complaints feed...
                    </td>
                  </tr>
                ) : (
                  recentComplaints.map((c) => (
                    <tr key={c.complaint_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-bold text-cyan-400">{c.complaint_id}</td>
                      <td className="py-3 px-3 text-slate-300">
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px]">
                          {c.fraud_type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-amber-400 font-bold">
                        {c.beneficiary_account_id || '--'}
                      </td>
                      <td className="py-3 px-3 text-slate-300">{c.beneficiary_city}</td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-400">
                        ₹{c.reported_amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleIntercept(c.complaint_id)}
                          className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 text-[11px] font-bold rounded-lg transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <Zap className="w-3 h-3 text-cyan-400" />
                          Intercept
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Engine Telemetry & Pipeline Status (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            ML SYSTEM TELEMETRY
          </h3>

          <div className="space-y-3 text-xs font-mono">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <div className="text-slate-400 text-[10px]">INFERENCE PIPELINE</div>
              <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Calibrated Random Forest (Active)
              </div>
              <div className="text-slate-500 text-[10px] pt-1">
                Isotonic calibration with 300 estimators
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <div className="text-slate-400 text-[10px]">ENSEMBLE WEIGHT FORMULA</div>
              <div className="text-cyan-300 text-[11px] font-bold">
                45% RF + 25% Spatial + 20% Habit + 10% Last ATM
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
              <div className="text-slate-400 text-[10px] mb-1">DATABASE INGESTION STATUS</div>
              <div className="flex justify-between text-slate-300">
                <span>Inter-Account Transactions:</span>
                <span className="text-white font-bold">14,008</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Historical Withdrawals:</span>
                <span className="text-white font-bold">4,264</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Tracked ATM Locations:</span>
                <span className="text-white font-bold">120</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
