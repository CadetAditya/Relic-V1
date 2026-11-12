import React, { useState, useEffect } from 'react';
import {
  MapPin,
  ShieldAlert,
  Layers,
  Filter,
  Search,
  Building,
  Clock,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  Compass,
} from 'lucide-react';
import MapView from '../components/MapView';
import api from '../services/api';

const TIME_WINDOWS = [
  { id: '24h', label: 'Past 24 Hours' },
  { id: '7d', label: 'Past 7 Days' },
  { id: '30d', label: 'Past 30 Days' },
  { id: 'all', label: 'All-Time Historical' },
];

export default function AtmNetworkMap() {
  const [atms, setAtms] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedTimeWindow, setSelectedTimeWindow] = useState('all');
  const [riskFilter, setRiskFilter] = useState('ALL'); // 'ALL' | 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN'
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedAtm, setSelectedAtm] = useState(null);

  useEffect(() => {
    async function fetchAtms() {
      try {
        setLoading(true);
        const data = await api.getAtms({ city: selectedCity || undefined });
        setAtms(data.atms || []);
        if (data.cities && data.cities.length > 0 && cities.length === 0) {
          setCities(data.cities);
        }
      } catch (err) {
        console.error('Failed to load ATMs:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAtms();
  }, [selectedCity]);

  // Dynamically compute center from real ATM coordinates
  const mapCenter =
    atms.length > 0
      ? [
        atms.reduce((sum, a) => sum + a.latitude, 0) / atms.length,
        atms.reduce((sum, a) => sum + a.longitude, 0) / atms.length,
      ]
      : [31.3202, 75.5773];

  const mapZoom = selectedCity ? 13 : 9;

  // Filter ATMs based on search and risk level
  const filteredAtms = atms.filter((a) => {
    const ratio = a.fraud_intensity_ratio || 0;
    const matchesSearch =
      !search.trim() ||
      a.atm_id.toLowerCase().includes(search.toLowerCase()) ||
      a.bank_id.toLowerCase().includes(search.toLowerCase()) ||
      a.city.toLowerCase().includes(search.toLowerCase());

    let matchesRisk = true;
    if (riskFilter === 'RED') matchesRisk = ratio >= 0.44;
    else if (riskFilter === 'ORANGE') matchesRisk = ratio >= 0.37 && ratio < 0.44;
    else if (riskFilter === 'YELLOW') matchesRisk = ratio >= 0.31 && ratio < 0.37;
    else if (riskFilter === 'GREEN') matchesRisk = ratio < 0.31;

    return matchesSearch && matchesRisk;
  });

  const redCount = atms.filter((a) => (a.fraud_intensity_ratio || 0) >= 0.44).length;
  const orangeCount = atms.filter(
    (a) => (a.fraud_intensity_ratio || 0) >= 0.37 && (a.fraud_intensity_ratio || 0) < 0.44
  ).length;
  const yellowCount = atms.filter(
    (a) => (a.fraud_intensity_ratio || 0) >= 0.31 && (a.fraud_intensity_ratio || 0) < 0.37
  ).length;
  const greenCount = atms.filter((a) => (a.fraud_intensity_ratio || 0) < 0.31).length;

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="bg-[#183a2e]/90 border border-[#2e6250] rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-4 border-b border-[#2e6250]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#143227] text-[#c5e48d] border border-[#2e6250]">
                MODULE 06
              </span>
              <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#c5e48d]" />
                INTERACTIVE GIS INTELLIGENCE MAP &amp; HOTSPOTS
              </h2>
            </div>
            <p className="text-xs font-mono text-[#95b8a5] mt-0.5">
              Visualizing 120 Punjab ATM terminals color-coded by historical cybercrime fraud extraction intensity.
            </p>
          </div>

          {/* Region & Time Window Selectors */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono text-[#95b8a5]">Jurisdiction:</span>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="px-3 py-2 bg-[#143227] border border-[#2e6250] rounded-xl text-xs font-mono text-[#c5e48d] font-bold focus:outline-none focus:border-[#c5e48d] cursor-pointer"
              >
                <option value="">All Jurisdictions ({atms.length} ATMs)</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono text-[#95b8a5]">Window:</span>
              <select
                value={selectedTimeWindow}
                onChange={(e) => setSelectedTimeWindow(e.target.value)}
                className="px-3 py-2 bg-[#143227] border border-[#2e6250] rounded-xl text-xs font-mono text-white font-bold focus:outline-none focus:border-[#c5e48d] cursor-pointer"
              >
                {TIME_WINDOWS.map((tw) => (
                  <option key={tw.id} value={tw.id}>
                    {tw.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Quick Region Selector Pills */}
        <div className="flex flex-wrap items-center gap-1.5 mb-4 pb-3 border-b border-[#2e6250]/60">
          <span className="text-[11px] font-mono text-[#95b8a5] mr-1 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-[#c5e48d]" />
            Quick District:
          </span>
          <button
            onClick={() => setSelectedCity('')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer font-bold ${selectedCity === ''
                ? 'bg-[#c5e48d] text-[#143227] shadow'
                : 'bg-[#143227] text-[#95b8a5] hover:text-white border border-[#2e6250]'
              }`}
          >
            All Punjab ({atms.length})
          </button>
          {cities.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCity(c)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer font-bold ${selectedCity === c
                  ? 'bg-[#c5e48d] text-[#143227] shadow'
                  : 'bg-[#143227] text-[#95b8a5] hover:text-white border border-[#2e6250]'
                }`}
            >
              {c}
            </button>
          ))}
          {riskFilter !== 'ALL' && (
            <button
              onClick={() => setRiskFilter('ALL')}
              className="ml-auto px-2.5 py-1 rounded-lg text-[10px] font-mono bg-rose-950/70 border border-rose-800 text-rose-300 hover:text-white transition-all cursor-pointer"
            >
              ✕ Reset Tier Filter (Show All 4 Tiers)
            </button>
          )}
        </div>

        {/* Interactive Hotspot Legend Strip (Red, Orange, Yellow, Monitored Green) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => setRiskFilter(riskFilter === 'RED' ? 'ALL' : 'RED')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${riskFilter === 'RED'
                ? 'bg-rose-950/90 border-rose-500 shadow-md ring-1 ring-rose-500'
                : 'bg-rose-950/40 border-rose-800/60 hover:border-rose-600'
              }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-rose-300 text-[10px] font-mono font-bold flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm" />
                RED HOTSPOTS (&ge;44%)
              </span>
            </div>
            <div className="text-xl font-extrabold text-rose-300 font-mono mt-1">
              {redCount} ATMs
            </div>
            <div className="text-[10px] font-mono text-[#cfe0d5] mt-0.5">
              Critical extraction clusters
            </div>
          </button>

          <button
            onClick={() => setRiskFilter(riskFilter === 'ORANGE' ? 'ALL' : 'ORANGE')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${riskFilter === 'ORANGE'
                ? 'bg-orange-950/90 border-orange-500 shadow-md ring-1 ring-orange-500'
                : 'bg-orange-950/40 border-orange-800/60 hover:border-orange-600'
              }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-orange-300 text-[10px] font-mono font-bold flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm" />
                ORANGE (37% – 44%)
              </span>
            </div>
            <div className="text-xl font-extrabold text-orange-300 font-mono mt-1">
              {orangeCount} ATMs
            </div>
            <div className="text-[10px] font-mono text-[#cfe0d5] mt-0.5">
              Elevated risk targets
            </div>
          </button>

          <button
            onClick={() => setRiskFilter(riskFilter === 'YELLOW' ? 'ALL' : 'YELLOW')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${riskFilter === 'YELLOW'
                ? 'bg-yellow-950/90 border-yellow-500 shadow-md ring-1 ring-yellow-500'
                : 'bg-yellow-950/40 border-yellow-800/60 hover:border-yellow-600'
              }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-yellow-300 text-[10px] font-mono font-bold flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-sm" />
                YELLOW (31% – 37%)
              </span>
            </div>
            <div className="text-xl font-extrabold text-yellow-300 font-mono mt-1">
              {yellowCount} ATMs
            </div>
            <div className="text-[10px] font-mono text-[#cfe0d5] mt-0.5">
              Moderate perimeter risk
            </div>
          </button>

          <button
            onClick={() => setRiskFilter(riskFilter === 'GREEN' ? 'ALL' : 'GREEN')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${riskFilter === 'GREEN'
                ? 'bg-[#183a2e] border-[#c5e48d] shadow-md ring-1 ring-[#c5e48d]'
                : 'bg-[#143227] border-[#2e6250] hover:border-[#3e7863]'
              }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[#c5e48d] text-[10px] font-mono font-bold flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#c5e48d] shadow-sm" />
                MONITORED (&lt;31%)
              </span>
            </div>
            <div className="text-xl font-extrabold text-[#c5e48d] font-mono mt-1">
              {greenCount} ATMs
            </div>
            <div className="text-[10px] font-mono text-[#95b8a5] mt-0.5">
              Standard surveillance
            </div>
          </button>
        </div>
      </div>

      {/* Interactive Map Surface */}
      <div className="bg-[#183a2e]/90 border border-[#2e6250] rounded-2xl p-4 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 px-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#c5e48d]" />
            <span className="text-xs font-mono font-bold text-white uppercase">
              Tactical GIS Cartographic Layer — OpenStreetMap
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-[#95b8a5]">
            <span>
              Displaying <strong className="text-[#c5e48d]">{filteredAtms.length}</strong> of {atms.length} Terminals
            </span>
            {riskFilter !== 'ALL' && (
              <span className="px-2 py-0.5 rounded bg-[#143227] text-[#c5e48d] border border-[#2e6250] font-bold">
                Filtered: {riskFilter}
              </span>
            )}
          </div>
        </div>

          <div
            className="rounded-xl overflow-hidden border border-[#2e6250] shadow-inner w-full"
            style={{ height: '540px', minHeight: '540px' }}
          >
            <MapView
              center={mapCenter}
              zoom={mapZoom}
              allAtms={filteredAtms}
              height="540px"
              className="w-full h-full"
            />
          </div>
        </div>

        {/* ATM Directory Search & Table */}
        <div className="bg-[#183a2e]/90 border border-[#2e6250] rounded-2xl p-6 shadow-xl backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-[#c5e48d]" />
              ATM DIRECTORY &amp; RISK INTENSITY REGISTER ({filteredAtms.length})
            </h3>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[#95b8a5] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ATM ID, Bank, or City..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-[#143227] border border-[#2e6250] rounded-xl text-xs font-mono text-white placeholder-[#95b8a5]/60 focus:border-[#c5e48d] focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto max-h-96 overflow-y-auto rounded-xl border border-[#2e6250]">
            <table className="w-full text-left font-mono text-xs">
              <thead className="sticky top-0 bg-[#143227] text-[#95b8a5] border-b border-[#2e6250] text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">ATM ID</th>
                  <th className="py-2.5 px-3">BANK</th>
                  <th className="py-2.5 px-3">JURISDICTION</th>
                  <th className="py-2.5 px-3">COORDINATES</th>
                  <th className="py-2.5 px-3 text-right">TOTAL WITHDRAWALS</th>
                  <th className="py-2.5 px-3 text-right">FRAUD RATE</th>
                  <th className="py-2.5 px-3 text-center">HOTSPOT TIER</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2e6250]/60 text-[11px]">
                {filteredAtms.map((a) => {
                  const ratio = a.fraud_intensity_ratio || 0;
                  const isRed = ratio >= 0.44;
                  const isOrange = ratio >= 0.37 && ratio < 0.44;
                  const isYellow = ratio >= 0.31 && ratio < 0.37;

                  const tierBadge = isRed
                    ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                    : isOrange
                      ? 'bg-orange-950/80 text-orange-300 border-orange-800'
                      : isYellow
                        ? 'bg-yellow-950/80 text-yellow-300 border-yellow-800'
                        : 'bg-[#143227] text-[#c5e48d] border-[#2e6250]';

                  const tierLabel = isRed
                    ? 'RED HOTSPOT'
                    : isOrange
                      ? 'ORANGE HOTSPOT'
                      : isYellow
                        ? 'YELLOW HOTSPOT'
                        : 'MONITORED';

                  return (
                    <tr
                      key={a.atm_id}
                      className="hover:bg-[#20493b]/40 transition-colors"
                    >
                      <td className="py-2 px-3 font-bold text-[#c5e48d]">{a.atm_id}</td>
                      <td className="py-2 px-3 text-white">{a.bank_id}</td>
                      <td className="py-2 px-3 text-[#cfe0d5]">{a.city}</td>
                      <td className="py-2 px-3 text-[#95b8a5] text-[10px]">
                        {a.latitude.toFixed(4)}, {a.longitude.toFixed(4)}
                      </td>
                      <td className="py-2 px-3 text-right text-white">
                        {a.historical_withdrawals_count}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-white">
                        {(ratio * 100).toFixed(1)}%
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${tierBadge}`}>
                          {tierLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      );
}
