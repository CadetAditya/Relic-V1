import React, { useState, useEffect } from 'react';
import { TrendingUp, Cpu, Award, BarChart2, ShieldCheck, CheckCircle2, GitCommit } from 'lucide-react';
import api from '../services/api';

export default function ModelAnalytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const data = await api.getStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const rfMetrics = stats?.evaluation_metrics?.random_forest_calibrated || null;
  const baselineMetrics = stats?.evaluation_metrics?.baseline_basic_heuristic || null;
  const featureImportances = stats?.feature_importances || [];

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 font-mono text-xs">
        <div className="w-8 h-8 border-2 border-slate-700 border-t-cyan-400 rounded-full animate-spin mx-auto mb-3"></div>
        <div>LOADING MODEL INTELLIGENCE BENCHMARKS...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                EVALUATION BENCHMARK
              </span>
              <span className="text-xs font-mono text-slate-400">
                CHRONOLOGICAL TEMPORAL SPLIT (ZERO LEAKAGE)
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white font-mono flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              MACHINE LEARNING ARCHITECTURE & MODEL BENCHMARK
            </h2>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              Calibrated Random Forest Classifier with Isotonic Regression & Spatial Decay Ensemble
            </p>
          </div>

          {rfMetrics && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs font-mono">
              <div className="text-slate-400 text-[10px]">RECALL @ TOP-3 ATMS</div>
              <div className="text-2xl font-extrabold text-emerald-400">
                {(rfMetrics.recall_at_3 * 100).toFixed(1)}%
              </div>
              {baselineMetrics && (
                <div className="text-[10px] text-emerald-400/80 mt-0.5">
                  +{( (rfMetrics.recall_at_3 - baselineMetrics.recall_at_3) * 100 ).toFixed(1)}% over baseline heuristic
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Metric Comparison Table & Feature Importances */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Comparison Table */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-sm font-bold text-white font-mono mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-cyan-400" />
            MODEL EVALUATION VS BASIC HEURISTIC
          </h3>

          {rfMetrics && baselineMetrics ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 text-left">METRIC</th>
                    <th className="py-2.5 text-center text-cyan-400 font-bold">CALIBRATED RF</th>
                    <th className="py-2.5 text-center text-slate-400">HEURISTIC BASELINE</th>
                    <th className="py-2.5 text-right text-emerald-400">GAIN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  <tr>
                    <td className="py-3 font-semibold text-slate-200">Recall@1 (Rank 1 Primary)</td>
                    <td className="py-3 text-center font-bold text-white">{(rfMetrics.recall_at_1 * 100).toFixed(1)}%</td>
                    <td className="py-3 text-center text-slate-400">{(baselineMetrics.recall_at_1 * 100).toFixed(1)}%</td>
                    <td className="py-3 text-right font-bold text-emerald-400">
                      +{((rfMetrics.recall_at_1 - baselineMetrics.recall_at_1) * 100).toFixed(1)}%
                    </td>
                  </tr>
                  <tr className="bg-emerald-950/20">
                    <td className="py-3 font-bold text-emerald-300">Recall@3 (Top-3 Intercept Ring)</td>
                    <td className="py-3 text-center font-bold text-emerald-400 text-sm">{(rfMetrics.recall_at_3 * 100).toFixed(1)}%</td>
                    <td className="py-3 text-center text-slate-400">{(baselineMetrics.recall_at_3 * 100).toFixed(1)}%</td>
                    <td className="py-3 text-right font-bold text-emerald-400">
                      +{((rfMetrics.recall_at_3 - baselineMetrics.recall_at_3) * 100).toFixed(1)}%
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-slate-200">Recall@5 (Extended Perimeter)</td>
                    <td className="py-3 text-center font-bold text-white">{(rfMetrics.recall_at_5 * 100).toFixed(1)}%</td>
                    <td className="py-3 text-center text-slate-400">{(baselineMetrics.recall_at_5 * 100).toFixed(1)}%</td>
                    <td className="py-3 text-right font-bold text-emerald-400">
                      +{((rfMetrics.recall_at_5 - baselineMetrics.recall_at_5) * 100).toFixed(1)}%
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-slate-200">Recall@10</td>
                    <td className="py-3 text-center font-bold text-white">{(rfMetrics.recall_at_10 * 100).toFixed(1)}%</td>
                    <td className="py-3 text-center text-slate-400">{(baselineMetrics.recall_at_10 * 100).toFixed(1)}%</td>
                    <td className="py-3 text-right font-bold text-emerald-400">
                      +{((rfMetrics.recall_at_10 - baselineMetrics.recall_at_10) * 100).toFixed(1)}%
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-slate-200">Mean Reciprocal Rank (MRR)</td>
                    <td className="py-3 text-center font-bold text-cyan-400">{rfMetrics.mrr.toFixed(3)}</td>
                    <td className="py-3 text-center text-slate-400">{baselineMetrics.mrr.toFixed(3)}</td>
                    <td className="py-3 text-right font-bold text-emerald-400">
                      +{(rfMetrics.mrr - baselineMetrics.mrr).toFixed(3)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 font-mono text-xs">
              No benchmark metrics currently available.
            </div>
          )}
        </div>

        {/* Feature Importances Ranking */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-sm font-bold text-white font-mono mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-cyan-400" />
            TOP PREDICTIVE FEATURE IMPORTANCES
          </h3>

          {featureImportances.length > 0 ? (
            <div className="space-y-3">
              {featureImportances.slice(0, 8).map((item) => (
                <div key={item.feature}>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-slate-300 font-semibold">{item.feature}</span>
                    <span className="text-cyan-400 font-bold">{(item.importance * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                      style={{ width: `${Math.min(item.importance * 350, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 font-mono text-xs">
              No feature importances recorded.
            </div>
          )}
        </div>
      </div>

      {/* 4-Tier Calibration Formula & Split Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl text-xs font-mono text-slate-300 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            FOUR-TIER ENSEMBLE PROBABILITY CALIBRATION
          </h3>
          <p className="text-slate-400 leading-relaxed">
            The operational dispatch advisory uses isotonic probability calibration blended with spatial proximity decay and historical account habit:
          </p>
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-cyan-300 text-xs overflow-x-auto text-center leading-loose">
            Score = 0.45 &times; P(RF) + 0.25 &times; [exp(-d<sub>last</sub>/2) + exp(-d<sub>cent</sub>/2)] + 0.20 &times; PastUsageRatio + 0.10 &times; IsLastATM
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl text-xs font-mono text-slate-300 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <GitCommit className="w-4 h-4 text-cyan-400" />
            ZERO-LEAKAGE CHRONOLOGICAL SPLIT
          </h3>
          <div className="space-y-2 text-slate-400">
            <div className="flex justify-between p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-300">Train Set (72.2%):</span>
              <span className="text-white font-bold">Jan 2025 &ndash; Apr 2026 (Events 1-254)</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-300">Test Set (14.8%):</span>
              <span className="text-cyan-400 font-bold">Apr 2026 &ndash; Jul 2026 (Events 255-306)</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-300">Validation Set (13.0%):</span>
              <span className="text-amber-400 font-bold">Jul 2026 &ndash; Nov 2026 (Events 307-352)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
