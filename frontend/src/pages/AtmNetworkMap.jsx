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
  const mapCenter = atms.length > 0
    ? [
        atms.reduce((sum, a) => sum + a.latitude, 0) / atms.length,
        atms.reduce((sum, a) => sum + a.longitude, 0) / atms.length,
      ]
    : [28.6139, 77.2090];

  const mapZoom = selectedCity ? 13 : 5;

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
  const modRiskCount = atms.filter((a) => a.fraud_intensity_ratio >= 0.05 && a.fraud_intensity_ratio < 0.10).length;

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
              <MapPin className="w-5 h-5 text-cyan-400" />
              NATIONAL ATM SPATIAL RISK NETWORK
            </h2>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              120 Cash extraction points monitored across 6 key cybercrime hotspot clusters
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-mono text-slate-400">Jurisdiction:</span>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-cyan-400 font-bold focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="">All Regions ({atms.length} ATMs)</option>
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
          <div className="p-3 bg-red-950/30 border border-red-800/50 rounded-xl text-xs font-mono">
            <div className="text-slate-400 text-[10px]">HIGH FRAUD INTENSITY (&ge;10%)</div>
            <div className="text-xl font-extrabold text-red-400 mt-0.5">{highRiskCount} ATMs</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Frequent suspect extraction targets</div>
          </div>
          <div className="p-3 bg-amber-950/30 border border-amber-800/50 rounded-xl text-xs font-mono">
            <div className="text-slate-400 text-[10px]">MODERATE RISK (5% – 10%)</div>
            <div className="text-xl font-extrabold text-amber-400 mt-0.5">{modRiskCount} ATMs</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Secondary perimeter candidate sites</div>
          </div>
          <div className="p-3 bg-cyan-950/30 border border-cyan-800/50 rounded-xl text-xs font-mono">
            <div className="text-slate-400 text-[10px]">STANDARD SURVEILLANCE (&lt;5%)</div>
            <div className="text-xl font-extrabold text-cyan-400 mt-0.5">{atms.length - highRiskCount - modRiskCount} ATMs</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Normal baseline withdrawal activity</div>
          </div>
        </div>
      </div>

      {/* Geospatial Map */}
      <MapView
        center={mapCenter}
        zoom={mapZoom}
        allAtms={atms}
        className="w-full h-[540px]"
      />

      {/* Searchable ATM Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Building className="w-4 h-4 text-cyan-400" />
              REGISTERED ATM INVENTORY ({filteredAtms.length} of {atms.length})
            </h3>
            <p className="text-xs font-mono text-slate-400">
              Coordinates, bank ownership, and historical cash extraction rates
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ATM ID or Bank..."
              className="w-full pl-9 pr-3.5 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="sticky top-0 bg-slate-950 border-b border-slate-800 text-slate-400">
              <tr>
                <th className="py-2.5 px-3">ATM ID</th>
                <th className="py-2.5 px-3">BANK</th>
                <th className="py-2.5 px-3">CITY</th>
                <th className="py-2.5 px-3">LATITUDE</th>
                <th className="py-2.5 px-3">LONGITUDE</th>
                <th className="py-2.5 px-3 text-right">TOTAL WDs</th>
                <th className="py-2.5 px-3 text-right">FRAUD WDs</th>
                <th className="py-2.5 px-3 text-right">FRAUD INTENSITY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredAtms.slice(0, 30).map((atm) => {
                const ratio = atm.fraud_intensity_ratio * 100;
                const riskColor =
                  ratio >= 10
                    ? 'text-red-400 font-bold'
                    : ratio >= 5
                    ? 'text-amber-400'
                    : 'text-slate-300';

                return (
                  <tr key={atm.atm_id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-bold text-cyan-400">{atm.atm_id}</td>
                    <td className="py-2.5 px-3 text-slate-200">{atm.bank_id}</td>
                    <td className="py-2.5 px-3 text-slate-300">{atm.city}</td>
                    <td className="py-2.5 px-3 text-slate-400">{atm.latitude.toFixed(5)}</td>
                    <td className="py-2.5 px-3 text-slate-400">{atm.longitude.toFixed(5)}</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-slate-200">
                      {atm.historical_withdrawals_count}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-red-400">
                      {atm.fraud_withdrawals_count}
                    </td>
                    <td className={`py-2.5 px-3 text-right ${riskColor}`}>
                      {ratio.toFixed(1)}%
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
