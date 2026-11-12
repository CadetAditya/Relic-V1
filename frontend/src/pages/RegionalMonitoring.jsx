import React, { useState, useEffect } from 'react';
import {
  Compass,
  MapPin,
  AlertTriangle,
  Users,
  Shield,
  Activity,
  ArrowRight,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  Clock,
  ChevronRight,
  Eye,
  Filter,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const ZONES = [
  'All Zones',
  'Jalandhar',
  'Ludhiana',
  'Amritsar',
  'Phagwara',
  'Kapurthala',
  'Hoshiarpur',
];

export default function RegionalMonitoring({
  setActiveTab,
  setSelectedComplaintId,
}) {
  const { officer } = useAuth();
  // Default to officer's zone if assigned to a specific zone, else Jalandhar or All Zones
  const defaultZone =
    officer?.zone && officer.zone !== 'All Zones'
      ? officer.zone
      : 'Jalandhar';

  const [selectedZone, setSelectedZone] = useState(defaultZone);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRegionalData(selectedZone);
  }, [selectedZone]);

  const fetchRegionalData = async (zone) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getRegionalMonitoring(zone);
      setData(res);
    } catch (err) {
      console.error('Failed to load regional monitoring data:', err);
      setError('Failed to fetch regional telemetry from zonal command database.');
    } finally {
      setLoading(false);
    }
  };

  const atmHotspots = data?.atm_hotspots?.atms || [];
  const workload = data?.investigator_workload || [];
  const recentComplaints = data?.recent_complaints || [];
  const recentAlerts = data?.recent_alerts || [];

  return (
    <div className="space-y-6">
      {/* Top Header & Zonal Selector */}
      <div className="bg-[#183a2e]/90 border border-[#2e6250] rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-[#2e6250]/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#143227] text-[#c5e48d] border border-[#2e6250]">
                MODULE 11
              </span>
              <span className="text-xs font-mono text-[#95b8a5] tracking-wider">
                TACTICAL COMMAND OVERVIEW
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
              Regional &amp; Zonal Monitoring Desk
            </h1>
            <p className="text-xs text-[#95b8a5] mt-0.5">
              Territorial cybercrime triage, ATM hotspot dispersion, and active investigator case distribution across Punjab.
            </p>
          </div>

          {/* Officer Command Zone Badge */}
          {officer && (
            <div className="bg-[#143227] border border-[#2e6250] px-3.5 py-2 rounded-xl flex items-center gap-2.5">
              <Compass className="w-4 h-4 text-[#c5e48d]" />
              <div className="text-left text-xs font-mono">
                <span className="text-[#95b8a5] text-[10px] block">YOUR JURISDICTION</span>
                <span className="text-white font-bold">{officer.zone || 'All Punjab Zones'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Zonal Selector Pills */}
        <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-mono text-[#95b8a5] shrink-0 flex items-center gap-1.5 mr-1">
            <Filter className="w-3.5 h-3.5" /> Zone:
          </span>
          {ZONES.map((zone) => {
            const isSelected = selectedZone === zone;
            return (
              <button
                key={zone}
                onClick={() => setSelectedZone(zone)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-[#c5e48d] text-[#183a2e] font-bold shadow-md'
                    : 'bg-[#143227] text-[#95b8a5] border border-[#2e6250] hover:text-white hover:border-[#3e7863]'
                }`}
              >
                {zone === 'All Zones' ? 'All Punjab Zones' : `${zone} Zone`}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="bg-[#183a2e]/60 border border-[#2e6250] rounded-2xl p-16 text-center">
          <div className="w-8 h-8 border-2 border-[#2e6250] border-t-[#c5e48d] rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-mono text-[#c5e48d]">COMPILING ZONAL RADAR &amp; CASE TELEMETRY...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-950/30 border border-rose-800/60 rounded-2xl p-8 text-center text-rose-300">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-rose-400" />
          <p className="text-xs font-mono font-bold">{error}</p>
        </div>
      ) : (
        <>
          {/* Key Zonal Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#183a2e]/90 border border-[#2e6250] rounded-xl p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-[#95b8a5]">ZONAL COMPLAINTS</span>
                <Shield className="w-4 h-4 text-[#c5e48d]" />
              </div>
              <div className="text-2xl font-bold font-mono text-white mt-2">
                {data?.total_complaints || 0}
              </div>
              <div className="text-[11px] font-mono text-[#95b8a5] mt-1">
                Total reported in {selectedZone}
              </div>
            </div>

            <div className="bg-[#183a2e]/90 border border-[#2e6250] rounded-xl p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-amber-300">ACTIVE &amp; PENDING</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-amber-300 mt-2">
                {data?.pending_complaints || 0}
              </div>
              <div className="text-[11px] font-mono text-[#95b8a5] mt-1">
                Requiring officer resolution
              </div>
            </div>

            <div className="bg-[#183a2e]/90 border border-[#2e6250] rounded-xl p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-rose-400">HIGH PRIORITY CASUALTIES</span>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-rose-400 mt-2">
                {data?.high_priority_complaints || 0}
              </div>
              <div className="text-[11px] font-mono text-[#95b8a5] mt-1">
                Urgent cashpoint interception required
              </div>
            </div>

            <div className="bg-[#183a2e]/90 border border-[#2e6250] rounded-xl p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-emerald-400">REPORTED FRAUD VOLUME</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">
                ₹{(data?.total_fraud_volume || 0).toLocaleString()}
              </div>
              <div className="text-[11px] font-mono text-[#95b8a5] mt-1">
                Financial impact in {selectedZone}
              </div>
            </div>
          </div>

          {/* Section 1: Hotspots & Workload Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Regional ATM Hotspots */}
            <div className="bg-[#183a2e]/90 border border-[#2e6250] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[#2e6250]">
                  <div>
                    <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#c5e48d]" />
                      REGIONAL ATM HOTSPOTS ({selectedZone})
                    </h3>
                    <p className="text-xs text-[#95b8a5]">
                      Cashpoints classified by fraud extraction intensity.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (setActiveTab) setActiveTab('map');
                    }}
                    className="text-xs font-mono text-[#c5e48d] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    view GIS map <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Hotspot Intensity Breakdown Bar */}
                <div className="grid grid-cols-3 gap-2 my-4">
                  <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800/60 text-center">
                    <div className="text-[10px] font-mono text-rose-300">RED HOTSPOTS (&gt;20%)</div>
                    <div className="text-base font-bold font-mono text-rose-400 mt-0.5">
                      {data?.atm_hotspots?.red_hotspots || 0}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-800/60 text-center">
                    <div className="text-[10px] font-mono text-amber-300">ORANGE (10-20%)</div>
                    <div className="text-base font-bold font-mono text-amber-400 mt-0.5">
                      {data?.atm_hotspots?.orange_hotspots || 0}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-yellow-950/60 border border-yellow-800/60 text-center">
                    <div className="text-[10px] font-mono text-yellow-300">YELLOW (5-10%)</div>
                    <div className="text-base font-bold font-mono text-yellow-400 mt-0.5">
                      {data?.atm_hotspots?.yellow_hotspots || 0}
                    </div>
                  </div>
                </div>

                {/* Hotspots List */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {atmHotspots.length === 0 ? (
                    <div className="py-8 text-center text-xs font-mono text-[#95b8a5]">
                      No ATM nodes found for this zone.
                    </div>
                  ) : (
                    atmHotspots.slice(0, 7).map((atm) => {
                      const colorBadge =
                        atm.hotspot_color === 'red'
                          ? 'bg-rose-950/90 text-rose-300 border-rose-800'
                          : atm.hotspot_color === 'orange'
                          ? 'bg-amber-950/90 text-amber-300 border-amber-800'
                          : 'bg-yellow-950/90 text-yellow-300 border-yellow-800';

                      return (
                        <div
                          key={atm.atm_id}
                          className="p-2.5 rounded-xl bg-[#143227] border border-[#2e6250] flex items-center justify-between hover:border-[#3e7863] transition-all"
                        >
                          <div>
                            <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
                              <span>{atm.atm_id}</span>
                              <span className="text-[10px] font-normal text-[#95b8a5]">
                                ({atm.bank_id} • {atm.city})
                              </span>
                            </div>
                            <div className="text-[10px] font-mono text-[#95b8a5] mt-0.5">
                              {atm.fraud_withdrawals} / {atm.total_withdrawals} extractions confirmed fraud
                            </div>
                          </div>

                          <div className="text-right">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${colorBadge}`}
                            >
                              {(atm.fraud_intensity_ratio * 100).toFixed(1)}% RISK
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Investigator Workload Matrix */}
            <div className="bg-[#183a2e]/90 border border-[#2e6250] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[#2e6250]">
                  <div>
                    <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#c5e48d]" />
                      INVESTIGATOR CASELOAD DISTRIBUTION
                    </h3>
                    <p className="text-xs text-[#95b8a5]">
                      Active cases assigned to field and cybercrime investigators.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-[#c5e48d] bg-[#143227] px-2 py-0.5 rounded border border-[#2e6250]">
                    {workload.length} Officers
                  </span>
                </div>

                <div className="mt-4 space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {workload.length === 0 ? (
                    <div className="py-8 text-center text-xs font-mono text-[#95b8a5]">
                      No active investigators registered for this zone.
                    </div>
                  ) : (
                    workload.map((inv) => (
                      <div
                        key={inv.badge_id}
                        className="p-3 rounded-xl bg-[#143227] border border-[#2e6250] flex items-center justify-between hover:border-[#3e7863] transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-[#20493b] border border-[#3e7863] flex items-center justify-center text-[#c5e48d] font-bold text-xs font-mono">
                            {inv.badge_id.slice(-3)}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">
                              {inv.name}
                            </div>
                            <div className="text-[10px] font-mono text-[#95b8a5]">
                              {inv.badge_id} • {inv.rank} • {inv.zone}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                              inv.active_cases > 5
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : inv.active_cases > 2
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-[#183a2e] text-[#c5e48d] border border-[#2e6250]'
                            }`}
                          >
                            {inv.active_cases} Active Cases
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Recent Zonal Complaints & Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Regional Complaints */}
            <div className="bg-[#183a2e]/90 border border-[#2e6250] rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#2e6250]">
                <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#c5e48d]" />
                  RECENT COMPLAINTS IN {selectedZone.toUpperCase()}
                </h3>
                <button
                  onClick={() => {
                    if (setActiveTab) setActiveTab('complaints');
                  }}
                  className="text-xs font-mono text-[#c5e48d] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  open full list <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mt-3 space-y-2">
                {recentComplaints.length === 0 ? (
                  <div className="py-6 text-center text-xs font-mono text-[#95b8a5]">
                    No recent complaints recorded for this region.
                  </div>
                ) : (
                  recentComplaints.map((c) => (
                    <div
                      key={c.complaint_id}
                      onClick={() => {
                        if (setSelectedComplaintId) setSelectedComplaintId(c.complaint_id);
                        if (setActiveTab) setActiveTab('complaints');
                      }}
                      className="p-3 rounded-xl bg-[#143227] border border-[#2e6250] hover:border-[#c5e48d] cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div>
                        <div className="text-xs font-mono font-bold text-white group-hover:text-[#c5e48d] flex items-center gap-2">
                          <span>{c.complaint_id}</span>
                          <span className="text-[10px] text-[#95b8a5] font-normal">
                            {c.fraud_type}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-[#95b8a5] mt-0.5">
                          Target Account: {c.beneficiary_account_id} • Status: {c.complaint_status}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-[#c5e48d]">
                          ₹{(c.reported_amount || 0).toLocaleString()}
                        </div>
                        <span className="text-[9px] font-mono text-[#95b8a5]">
                          {c.priority === 'HIGH' ? (
                            <span className="text-rose-400 font-bold">HIGH PRIORITY</span>
                          ) : (
                            c.priority
                          )}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Regional Tactical Alerts */}
            <div className="bg-[#183a2e]/90 border border-[#2e6250] rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#2e6250]">
                <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-400" />
                  LIVE REGIONAL WARNINGS &amp; ALERTS
                </h3>
                <span className="text-[10px] font-mono text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                  REAL-TIME DISPATCH
                </span>
              </div>

              <div className="mt-3 space-y-2">
                {recentAlerts.length === 0 ? (
                  <div className="py-6 text-center text-xs font-mono text-[#95b8a5]">
                    No active threat alerts for this region at this time.
                  </div>
                ) : (
                  recentAlerts.map((a) => (
                    <div
                      key={a.id}
                      className="p-3 rounded-xl bg-[#143227] border border-[#2e6250] flex items-start gap-3"
                    >
                      <div className="w-2 h-2 rounded-full bg-rose-400 mt-1.5 shrink-0 animate-ping" />
                      <div className="flex-1">
                        <div className="text-xs font-mono font-bold text-white flex items-center justify-between">
                          <span>{a.title}</span>
                          <span className="text-[9px] text-[#95b8a5]">{a.created_at?.slice(11, 16) || 'Now'}</span>
                        </div>
                        <p className="text-[11px] font-mono text-[#95b8a5] mt-0.5">
                          {a.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

