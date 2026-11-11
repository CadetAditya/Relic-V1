import React, { useState, useEffect } from 'react';
import { MapPin, ShieldAlert, Layers, Filter, Search, Building } from 'lucide-react';
import MapView from '../components/MapView';
import api from '../services/api';

export default function AtmNetworkMap() {
  const [atms, setAtms] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

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

  const filteredAtms = atms.filter((a) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      a.atm_id.toLowerCase().includes(s) ||
      a.bank_id.toLowerCase().includes(s) ||
      a.city.toLowerCase().includes(s)
    );
  });

  const highRiskCount = atms.filter((a) => a.fraud_intensity_ratio >= 0.10).length;
  const modRiskCount = atms.filter(
    (a) => a.fraud_intensity_ratio >= 0.05 && a.fraud_intensity_ratio < 0.10
  ).length;

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="bg-[#183a2e]/90 border border-[#2e6250] rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-4 border-b border-[#2e6250]">
          <div>
            <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#c5e48d]" />
              PUNJAB ZONE ATM SPATIAL RISK NETWORK
            </h2>
            <p className="text-xs font-mono text-[#95b8a5] mt-0.5">
              120 Cash extraction points monitored across 6 key cybercrime hotspot clusters
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-mono text-[#95b8a5]">Jurisdiction:</span>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-3.5 py-2 bg-[#143227] border border-[#2e6250] rounded-xl text-xs font-mono text-[#c5e48d] font-bold focus:outline-none focus:border-[#c5e48d] cursor-pointer"
            >
              <option value="">All Jurisdictions ({atms.length} ATMs)</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Risk Breakdown Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs font-mono">
            <div className="text-[#95b8a5] text-[10px]">HIGH FRAUD INTENSITY (&ge;10%)</div>
            <div className="text-xl font-extrabold text-rose-300 mt-0.5">
              {highRiskCount} ATMs
            </div>
            <div className="text-[10px] text-[#cfe0d5] mt-0.5">
              Frequent suspect extraction targets
            </div>
          </div>
          <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-xs font-mono">
            <div className="text-[#95b8a5] text-[10px]">MODERATE RISK (5% – 10%)</div>
            <div className="text-xl font-extrabold text-amber-300 mt-0.5">
              {modRiskCount} ATMs
            </div>
            <div className="text-[10px] text-[#cfe0d5] mt-0.5">
              Secondary perimeter candidate sites
            </div>
          </div>
          <div className="p-3 bg-[#143227] border border-[#2e6250] rounded-xl text-xs font-mono">
            <div className="text-[#95b8a5] text-[10px]">STANDARD SURVEILLANCE (&lt;5%)</div>
            <div className="text-xl font-extrabold text-[#c5e48d] mt-0.5">
              {atms.length - highRiskCount - modRiskCount} ATMs
            </div>
            <div className="text-[10px] text-[#95b8a5] mt-0.5">
              Baseline automated sensor feeds
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Map Surface */}
      <div className="bg-[#183a2e]/90 border border-[#2e6250] rounded-2xl p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-3 px-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#c5e48d]" />
            <span className="text-xs font-mono font-bold text-white uppercase">
              Cartographic Geospatial Feed
            </span>
          </div>
          <div className="text-[11px] font-mono text-[#95b8a5]">
            Displaying {atms.length} Monitored Terminals
          </div>
        </div>

        <div className="rounded-xl overflow-hidden border border-[#2e6250] shadow-inner">
          <MapView
            center={mapCenter}
            zoom={mapZoom}
            allAtms={atms}
            className="w-full h-[520px]"
          />
        </div>
      </div>

      {/* ATM Directory Search & Table */}
      <div className="bg-[#183a2e]/90 border border-[#2e6250] rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
            <Building className="w-4 h-4 text-[#c5e48d]" />
            ATM DIRECTORY & FRAUD TELEMETRY ({filteredAtms.length})
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
                <th className="py-2.5 px-3 text-center">RISK TIER</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2e6250]/60 text-[11px]">
              {filteredAtms.map((a) => {
                const ratio = a.fraud_intensity_ratio;
                const isHigh = ratio >= 0.10;
                const isMod = ratio >= 0.05 && ratio < 0.10;

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
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isHigh
                            ? 'bg-rose-950/60 text-rose-300 border border-rose-800/80'
                            : isMod
                            ? 'bg-amber-950/60 text-amber-300 border border-amber-800/80'
                            : 'bg-[#143227] text-[#c5e48d] border border-[#2e6250]'
                        }`}
                      >
                        {isHigh ? 'HIGH RISK' : isMod ? 'MODERATE' : 'MONITORED'}
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
