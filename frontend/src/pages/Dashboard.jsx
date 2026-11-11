import React, { useEffect, useState } from 'react';
import {
  Menu,
  X,
  ArrowUpRight,
  Shield,
  Zap,
  Activity,
  MapPin,
  UserCheck,
  LogOut,
  RefreshCw,
  Search,
  ExternalLink,
  Plus,
  Minus,
  SlidersHorizontal,
  FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// Sector tactical narratives
const SECTOR_NARRATIVES = {
  ALL: {
    title: 'PUNJAB ZONE',
    tagline: 'PRIMARY EXTRACTION CORRIDOR',
    description:
      'The primary high-velocity cybercrime extraction corridor in northern grid. Monitored across 120 ATMs in 6 key urban districts with calibrated Random Forest risk surveillance and automated dispatch intercept.',
  },
  Jalandhar: {
    title: 'JALANDHAR',
    tagline: 'CRITICAL HIGH-VELOCITY NEXUS',
    description:
      'Central Punjab financial hub with 20 monitored ATMs. Identified as the highest extraction velocity sector with 75 registered fraud complaints and ₹43.34 Lakhs in illicit cashout volume.',
  },
  Kapurthala: {
    title: 'KAPURTHALA',
    tagline: 'TRANSIT EXTRACTION CORRIDOR',
    description:
      'Key transit corridor connecting urban extraction hubs. Monitored across 20 high-traffic ATMs with 65 registered cybercrime complaints and 246 historical fraudulent cashouts.',
  },
  Phagwara: {
    title: 'PHAGWARA',
    tagline: 'GT ROAD ARTERIAL ARTERY',
    description:
      'Grand Trunk arterial corridor with high repeat mule activity. 64 registered cybercrime complaints and ₹32.82 Lakhs cashout footprint under continuous perimeter surveillance.',
  },
  Ludhiana: {
    title: 'LUDHIANA',
    tagline: 'INDUSTRIAL CASH EXTRACTION BELT',
    description:
      'Major industrial extraction zone across Sutlej belt. 55 active complaints with 20 critical ATMs tagged for high-denomination fraud cash withdrawal interception.',
  },
  Amritsar: {
    title: 'AMRITSAR',
    tagline: 'WESTERN BORDER EXTRACTION HUB',
    description:
      'Western border zone commercial hub. 55 registered fraud incidents and 256 high-frequency suspicious ATM withdrawals under machine learning anomaly detection.',
  },
  Hoshiarpur: {
    title: 'HOSHIARPUR',
    tagline: 'FOOTHILL PERIMETER CORRIDOR',
    description:
      'Foothill perimeter corridor. 46 active complaints and 289 ATM extraction events under real-time ML anomaly surveillance across 20 registered cashpoints.',
  },
};

// SVG Cartographic boundaries (active surveillance + buffer districts)
const ACTIVE_DISTRICTS = [
  {
    id: 'Amritsar',
    name: 'AMRITSAR',
    path: 'M 90 110 L 130 85 L 185 95 L 210 135 L 205 175 L 175 205 L 125 210 L 85 180 L 70 140 Z',
    center: [140, 155],
    defaultColor: '#5e8b6a',
  },
  {
    id: 'Kapurthala',
    name: 'KAPURTHALA',
    path: 'M 185 95 L 235 90 L 270 120 L 285 165 L 265 215 L 215 220 L 205 175 L 210 135 Z',
    center: [240, 160],
    defaultColor: '#b5d2a1',
  },
  {
    id: 'Hoshiarpur',
    name: 'HOSHIARPUR',
    path: 'M 270 120 L 320 70 L 390 60 L 440 90 L 450 145 L 420 190 L 365 195 L 320 170 L 285 165 Z',
    center: [370, 130],
    defaultColor: '#3e6b54',
  },
  {
    id: 'Jalandhar',
    name: 'JALANDHAR',
    path: 'M 285 165 L 320 170 L 365 195 L 375 235 L 355 270 L 305 275 L 265 240 L 265 215 Z',
    center: [315, 220],
    defaultColor: '#d4e9a8',
  },
  {
    id: 'Phagwara',
    name: 'PHAGWARA',
    path: 'M 365 195 L 420 190 L 445 225 L 435 265 L 395 280 L 355 270 L 375 235 Z',
    center: [400, 235],
    defaultColor: '#9fc58f',
  },
  {
    id: 'Ludhiana',
    name: 'LUDHIANA',
    path: 'M 305 275 L 355 270 L 395 280 L 435 265 L 485 295 L 500 350 L 460 395 L 390 405 L 330 380 L 290 330 Z',
    center: [395, 340],
    defaultColor: '#7ca980',
  },
];

// Surrounding buffer districts (context geography)
const BUFFER_DISTRICTS = [
  {
    id: 'Gurdaspur',
    path: 'M 130 85 L 180 35 L 250 30 L 280 65 L 320 70 L 270 120 L 235 90 L 185 95 Z',
  },
  {
    id: 'TarnTaran',
    path: 'M 85 180 L 125 210 L 175 205 L 205 175 L 215 220 L 210 265 L 160 280 L 105 255 L 75 220 Z',
  },
  {
    id: 'Firozpur',
    path: 'M 105 255 L 160 280 L 210 265 L 265 240 L 260 290 L 220 330 L 160 335 L 115 305 Z',
  },
  {
    id: 'Moga',
    path: 'M 265 240 L 305 275 L 290 330 L 280 365 L 225 365 L 220 330 L 260 290 Z',
  },
  {
    id: 'Nawanshahr',
    path: 'M 435 265 L 475 240 L 525 260 L 530 305 L 485 295 Z',
  },
  {
    id: 'PatialaBelt',
    path: 'M 485 295 L 530 305 L 545 365 L 500 395 L 460 395 L 500 350 Z',
  },
];

// Representative ATM coordinate nodes in SVG space
const ATM_NODES = [
  // Amritsar
  { id: 'ATM0004', city: 'Amritsar', x: 120, y: 130 },
  { id: 'ATM0008', city: 'Amritsar', x: 145, y: 165 },
  { id: 'ATM0012', city: 'Amritsar', x: 165, y: 140 },
  { id: 'ATM0016', city: 'Amritsar', x: 110, y: 175 },
  { id: 'ATM0020', city: 'Amritsar', x: 135, y: 190 },
  // Kapurthala
  { id: 'ATM0006', city: 'Kapurthala', x: 220, y: 135 },
  { id: 'ATM0014', city: 'Kapurthala', x: 245, y: 170 },
  { id: 'ATM0022', city: 'Kapurthala', x: 260, y: 145 },
  { id: 'ATM0030', city: 'Kapurthala', x: 235, y: 195 },
  // Hoshiarpur
  { id: 'ATM0005', city: 'Hoshiarpur', x: 340, y: 105 },
  { id: 'ATM0011', city: 'Hoshiarpur', x: 380, y: 95 },
  { id: 'ATM0018', city: 'Hoshiarpur', x: 415, y: 130 },
  { id: 'ATM0026', city: 'Hoshiarpur', x: 360, y: 155 },
  // Jalandhar
  { id: 'ATM0002', city: 'Jalandhar', x: 300, y: 200 },
  { id: 'ATM0010', city: 'Jalandhar', x: 330, y: 190 },
  { id: 'ATM0019', city: 'Jalandhar', x: 340, y: 235 },
  { id: 'ATM0025', city: 'Jalandhar', x: 295, y: 245 },
  { id: 'ATM0033', city: 'Jalandhar', x: 320, y: 255 },
  // Phagwara
  { id: 'ATM0001', city: 'Phagwara', x: 385, y: 225 },
  { id: 'ATM0009', city: 'Phagwara', x: 410, y: 215 },
  { id: 'ATM0017', city: 'Phagwara', x: 420, y: 250 },
  { id: 'ATM0024', city: 'Phagwara', x: 395, y: 265 },
  // Ludhiana
  { id: 'ATM0003', city: 'Ludhiana', x: 340, y: 320 },
  { id: 'ATM0007', city: 'Ludhiana', x: 380, y: 305 },
  { id: 'ATM0015', city: 'Ludhiana', x: 420, y: 330 },
  { id: 'ATM0023', city: 'Ludhiana', x: 460, y: 345 },
  { id: 'ATM0031', city: 'Ludhiana', x: 390, y: 375 },
  { id: 'ATM0039', city: 'Ludhiana', x: 345, y: 360 },
];

export default function Dashboard({ setActiveTab, setSelectedComplaintId }) {
  const { officer, logout } = useAuth();

  // Selection states
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [hoveredCity, setHoveredCity] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Drawer / Menu states
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [navMenuOpen, setNavMenuOpen] = useState(false);
  const [dotsMenuOpen, setDotsMenuOpen] = useState(false);

  // Data states
  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load telemetry data from real APIs
  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, complaintsRes] = await Promise.all([
        api.getStats(),
        api.getComplaints({ limit: 100 }),
      ]);
      setStats(statsRes);
      setComplaints(complaintsRes.complaints || []);
    } catch (err) {
      console.error('Failed to load dashboard telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute active narrative
  const currentNarrative =
    SECTOR_NARRATIVES[selectedCity] || SECTOR_NARRATIVES['ALL'];

  // City details helper
  const cityData = stats?.city_details?.[selectedCity];

  // Right column stats calculation
  let stat1Number = stats ? `${stats.total_complaints}` : '360';
  let stat1Label = 'complaints logged under active cybercrime surveillance';

  let stat2Number = stats ? `${stats.total_atms}` : '120';
  let stat2Label = 'monitored ATM extraction cashpoints across 6 districts';

  let stat3Number = '88.5%';
  let stat3Label = 'predictive intercept recall@3 accuracy across past extraction waves';

  if (selectedCity !== 'ALL' && cityData) {
    stat1Number = `${cityData.complaints_count}`;
    stat1Label = `active complaints registered in ${selectedCity} sector`;

    stat2Number = `${cityData.atm_count}`;
    stat2Label = `monitored ATMs actively surveilled in ${selectedCity}`;

    const cashoutLakhs = (cityData.fraud_cashout_volume / 100000).toFixed(1);
    stat3Number = `₹${cashoutLakhs} L`;
    stat3Label = `total fraudulent cashout volume extracted in ${selectedCity}`;
  }

  // Filter complaints for drawer
  const filteredComplaints = complaints
    .filter((c) => selectedCity === 'ALL' || c.beneficiary_city === selectedCity)
    .slice(0, 15);

  const handleInterceptComplaint = (complaintId) => {
    if (setSelectedComplaintId) {
      setSelectedComplaintId(complaintId);
    }
    setDrawerOpen(false);
    setActiveTab('predict');
  };

  return (
    <div className="relative w-full min-h-screen bg-[#224d3f] text-white font-sans overflow-x-hidden select-none flex flex-col justify-between">
      {/* =========================================================================
          BACKGROUND ARCHITECTURAL VERTICAL GUIDELINES (Matches template grid)
         ========================================================================= */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Subtle grid lines across full screen */}
        <div className="absolute left-[7%] top-0 bottom-0 w-px bg-[#2b5a4b] opacity-80" />
        <div className="absolute left-[26%] top-0 bottom-0 w-px bg-[#2b5a4b] opacity-80" />
        <div className="absolute left-[46%] top-0 bottom-0 w-px bg-[#2b5a4b] opacity-80" />
        <div className="absolute left-[72%] top-0 bottom-0 w-px bg-[#2b5a4b] opacity-80" />
        <div className="absolute left-[88%] top-0 bottom-0 w-px bg-[#2b5a4b] opacity-80" />
        <div className="absolute left-[95%] top-0 bottom-0 w-px bg-[#2b5a4b] opacity-80" />
      </div>

      {/* =========================================================================
          TOP NAVIGATION BAR (Template header with =, Region Tabs, ··)
         ========================================================================= */}
      <header className="relative z-20 w-full px-4 sm:px-8 py-5 flex items-center justify-between">
        {/* Left: Minimal Hamburger Icon (=) */}
        <div className="w-[7%] flex items-center">
          <button
            onClick={() => setNavMenuOpen(true)}
            title="Open RELIC Operations Menu"
            className="group p-2 -ml-2 rounded-lg hover:bg-[#2b5a4b]/50 transition-colors cursor-pointer"
          >
            <div className="w-6 h-0.5 bg-white mb-1.5 transition-transform group-hover:scale-x-110" />
            <div className="w-6 h-0.5 bg-white transition-transform group-hover:scale-x-110" />
          </button>
        </div>

        {/* Center: Region Tabs with Underline Indicator */}
        <nav className="flex-1 flex items-center justify-center gap-4 sm:gap-8 overflow-x-auto no-scrollbar py-1">
          {/* ALL REGIONS / PUNJAB ZONE */}
          <button
            onClick={() => setSelectedCity('ALL')}
            className={`text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer whitespace-nowrap pb-1 ${
              selectedCity === 'ALL'
                ? 'text-white font-bold'
                : 'text-[#95b8a5] hover:text-white'
            }`}
          >
            PUNJAB ZONE
            {selectedCity === 'ALL' && (
              <div className="h-0.5 w-6 bg-[#c5e48d] mx-auto mt-1 rounded-full" />
            )}
          </button>

          {/* 6 Districts */}
          {['AMRITSAR', 'HOSHIARPUR', 'JALANDHAR', 'KAPURTHALA', 'LUDHIANA', 'PHAGWARA'].map(
            (city) => {
              const isActive =
                selectedCity.toUpperCase() === city.toUpperCase();
              return (
                <button
                  key={city}
                  onClick={() =>
                    setSelectedCity(
                      city.charAt(0) + city.slice(1).toLowerCase()
                    )
                  }
                  className={`text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer whitespace-nowrap pb-1 ${
                    isActive
                      ? 'text-white font-bold'
                      : 'text-[#95b8a5] hover:text-white'
                  }`}
                >
                  {city}
                  {isActive && (
                    <div className="h-0.5 w-6 bg-[#c5e48d] mx-auto mt-1 rounded-full" />
                  )}
                </button>
              );
            }
          )}

          {/* Quick jump to Live Prediction Radar */}
          <button
            onClick={() => setActiveTab('predict')}
            className="text-xs uppercase tracking-wider font-semibold text-[#c5e48d] hover:text-white transition-colors cursor-pointer whitespace-nowrap pb-1 hidden lg:flex items-center gap-1"
          >
            RADAR ↗
          </button>
        </nav>

        {/* Right: Minimal Two-Dots Icon (··) */}
        <div className="w-[7%] flex items-center justify-end relative">
          <button
            onClick={() => setDotsMenuOpen(!dotsMenuOpen)}
            title="Options & Actions"
            className="p-2 -mr-2 rounded-lg hover:bg-[#2b5a4b]/50 transition-colors cursor-pointer flex items-center gap-1"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
          </button>

          {/* Dots Dropdown Popover */}
          {dotsMenuOpen && (
            <div className="absolute right-0 top-12 w-56 bg-[#1a3d31] border border-[#2e6250] rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-2 border-b border-[#2e6250]/80">
                <div className="text-[10px] font-mono text-[#95b8a5]">
                  OFFICER LOGGED IN
                </div>
                <div className="text-xs font-bold text-white">
                  {officer?.name || 'Officer'}
                </div>
                <div className="text-[10px] font-mono text-[#c5e48d]">
                  {officer?.badge_id} • {officer?.city}
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setDotsMenuOpen(false);
                    setActiveTab('predict');
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-white hover:bg-[#265648] rounded-lg flex items-center gap-2 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-[#c5e48d]" />
                  Launch Prediction Radar
                </button>

                <button
                  onClick={() => {
                    setDotsMenuOpen(false);
                    setActiveTab('complaints');
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-white hover:bg-[#265648] rounded-lg flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-[#95b8a5]" />
                  Complaints Explorer
                </button>

                <button
                  onClick={() => {
                    setDotsMenuOpen(false);
                    loadData();
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-white hover:bg-[#265648] rounded-lg flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 text-[#95b8a5] ${
                      loading ? 'animate-spin' : ''
                    }`}
                  />
                  Refresh Telemetry
                </button>

                <button
                  onClick={() => {
                    setDotsMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-rose-300 hover:bg-rose-950/40 rounded-lg flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* =========================================================================
          MAIN HERO WORKSPACE (Central Map + Bottom-Left Briefing + Right Stats)
         ========================================================================= */}
      <div className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 flex flex-col justify-between py-2 sm:py-6">
        {/* CENTER HERO CARTOGRAPHIC CHOROPLETH MAP */}
        <div className="relative flex-1 flex items-center justify-center min-h-[380px] sm:min-h-[480px]">
          <div
            className="w-full max-w-3xl transition-transform duration-300 ease-out"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            <svg
              viewBox="0 0 650 460"
              className="w-full h-auto drop-shadow-2xl overflow-visible"
            >
              {/* Filter for glowing active borders */}
              <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* 1. Surrounding Context / Buffer Districts */}
              <g className="buffer-regions opacity-60">
                {BUFFER_DISTRICTS.map((bd) => (
                  <path
                    key={bd.id}
                    d={bd.path}
                    fill="#1b3d30"
                    stroke="#265241"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />
                ))}
              </g>

              {/* 2. Active Monitored Districts (Choropleth polygons) */}
              <g className="active-regions">
                {ACTIVE_DISTRICTS.map((district) => {
                  const isSelected =
                    selectedCity.toUpperCase() === district.name;
                  const isHovered = hoveredCity === district.id;

                  // Get color from API or fallback
                  const fillColor =
                    stats?.city_details?.[district.id]?.fill_color ||
                    district.defaultColor;

                  return (
                    <path
                      key={district.id}
                      d={district.path}
                      fill={fillColor}
                      stroke={
                        isSelected
                          ? '#ffffff'
                          : isHovered
                          ? '#ffffff'
                          : '#1b3f32'
                      }
                      strokeWidth={isSelected ? '2.5' : isHovered ? '2' : '1.5'}
                      strokeLinejoin="round"
                      filter={
                        isSelected || isHovered ? 'url(#glow)' : undefined
                      }
                      className="cursor-pointer transition-all duration-200"
                      onMouseEnter={() => setHoveredCity(district.id)}
                      onMouseLeave={() => setHoveredCity(null)}
                      onClick={() => setSelectedCity(district.id)}
                    />
                  );
                })}
              </g>

              {/* 3. ATM Surveillance Nodes (20 real extraction sites) */}
              <g className="atm-points pointer-events-none">
                {ATM_NODES.map((atm) => {
                  const isCityActive =
                    selectedCity === 'ALL' || selectedCity === atm.city;
                  return (
                    <circle
                      key={atm.id}
                      cx={atm.x}
                      cy={atm.y}
                      r={isCityActive ? '2.5' : '1.5'}
                      fill={isCityActive ? '#ffffff' : '#224d3f'}
                      opacity={isCityActive ? 0.9 : 0.2}
                      className="transition-all"
                    />
                  );
                })}
              </g>
            </svg>

            {/* Interactive Hover Tooltip */}
            {hoveredCity && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#17372c]/95 border border-[#3e7260] px-4 py-2 rounded-xl text-center shadow-xl backdrop-blur-md pointer-events-none z-30 animate-in fade-in duration-150">
                <div className="text-[10px] font-mono tracking-widest text-[#c5e48d] uppercase">
                  {stats?.city_details?.[hoveredCity]?.risk_level ||
                    'SURVEILLANCE SECTOR'}
                </div>
                <div className="text-sm font-bold text-white uppercase">
                  {hoveredCity}
                </div>
                <div className="text-xs text-[#a8cdb8] font-mono mt-0.5">
                  Complaints: {stats?.city_details?.[hoveredCity]?.complaints_count || '--'} • ATMs: 20 • Volume: ₹
                  {((stats?.city_details?.[hoveredCity]?.fraud_cashout_volume || 0) / 100000).toFixed(1)}L
                </div>
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM METRICS & BRIEFING OVERLAY (Matches template bottom layout) */}
        <div className="relative z-10 w-full flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4 pb-2">
          {/* Bottom-Left: Title, Editorial Briefing & DETAILS ↗ link */}
          <div className="max-w-md">
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase leading-none">
              {currentNarrative.title}
            </h1>

            <p className="text-xs sm:text-[13px] text-[#cfe0d5] leading-relaxed mt-3 mb-4 font-normal">
              {currentNarrative.description}
            </p>

            <button
              onClick={() => setDrawerOpen(true)}
              className="group text-xs font-bold tracking-widest text-white hover:text-[#c5e48d] flex items-center gap-1.5 transition-colors cursor-pointer uppercase"
            >
              DETAILS
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-[#c5e48d]" />
            </button>
          </div>

          {/* Bottom-Right Controls: Risk Gradient Legend + Zoom Controls */}
          <div className="flex items-center gap-6 self-start md:self-end">
            {/* Risk Gradient Bar (LOW —— HIGH) */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest text-[#95b8a5] uppercase">
                LOW
              </span>
              <div className="w-24 sm:w-32 h-1.5 rounded-full bg-gradient-to-r from-[#3e6b54] via-[#7ca980] to-[#d4e9a8]" />
              <span className="text-[10px] font-mono tracking-widest text-[#95b8a5] uppercase">
                HIGH
              </span>
            </div>

            {/* Minimal Zoom Controls (+ / -) */}
            <div className="flex flex-col border border-[#346353] rounded-md overflow-hidden bg-[#224d3f]/90 shadow-lg">
              <button
                onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 1.6))}
                title="Zoom In Map"
                className="p-1.5 text-[#c5e48d] hover:bg-[#2c5f4e] transition-colors border-b border-[#346353] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.85))}
                title="Zoom Out Map"
                className="p-1.5 text-[#c5e48d] hover:bg-[#2c5f4e] transition-colors cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          RIGHT COLUMN STATISTICS (3 Massive Bold Figures, matches template)
         ========================================================================= */}
      <div className="hidden lg:flex absolute right-[7%] top-[24%] bottom-[24%] flex-col justify-around z-10 w-44 pointer-events-none">
        {/* Stat 1 */}
        <div className="transition-all duration-300">
          <div className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-none">
            {stat1Number}
          </div>
          <div className="text-[11px] text-[#9bbca9] leading-snug mt-1.5 font-normal">
            {stat1Label}
          </div>
        </div>

        {/* Stat 2 */}
        <div className="transition-all duration-300">
          <div className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-none">
            {stat2Number}
          </div>
          <div className="text-[11px] text-[#9bbca9] leading-snug mt-1.5 font-normal">
            {stat2Label}
          </div>
        </div>

        {/* Stat 3 */}
        <div className="transition-all duration-300">
          <div className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-none">
            {stat3Number}
          </div>
          <div className="text-[11px] text-[#9bbca9] leading-snug mt-1.5 font-normal">
            {stat3Label}
          </div>
        </div>
      </div>

      {/* Mobile Stat Bar for Smaller Screens */}
      <div className="lg:hidden relative z-10 grid grid-cols-3 gap-2 px-4 py-3 bg-[#1b3d31]/80 border-t border-[#2b5a4b] text-center">
        <div>
          <div className="text-xl font-bold text-white">{stat1Number}</div>
          <div className="text-[9px] text-[#9bbca9] line-clamp-1">{stat1Label}</div>
        </div>
        <div>
          <div className="text-xl font-bold text-white">{stat2Number}</div>
          <div className="text-[9px] text-[#9bbca9] line-clamp-1">{stat2Label}</div>
        </div>
        <div>
          <div className="text-xl font-bold text-white">{stat3Number}</div>
          <div className="text-[9px] text-[#9bbca9] line-clamp-1">{stat3Label}</div>
        </div>
      </div>

      {/* =========================================================================
          SLIDE-OVER SECTOR INTELLIGENCE DRAWER (DETAILS ↗)
         ========================================================================= */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer Body */}
          <div className="relative w-full max-w-lg bg-[#183a2e] border-l border-[#2e6250] shadow-2xl h-full flex flex-col z-10 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-[#2e6250] flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono tracking-widest text-[#c5e48d] uppercase">
                  SECTOR DOSSIER
                </div>
                <h2 className="text-xl font-black text-white tracking-tight uppercase">
                  {currentNarrative.title} INTELLIGENCE
                </h2>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-lg text-[#95b8a5] hover:text-white hover:bg-[#235043] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sector KPI Summary */}
            <div className="p-6 grid grid-cols-3 gap-3 border-b border-[#2e6250]/70 bg-[#143227]">
              <div className="p-3 rounded-xl bg-[#1b3d31] border border-[#2e6250]/80">
                <div className="text-[10px] font-mono text-[#95b8a5]">COMPLAINTS</div>
                <div className="text-lg font-bold text-white mt-0.5">
                  {selectedCity === 'ALL'
                    ? stats?.total_complaints || 360
                    : cityData?.complaints_count || 0}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#1b3d31] border border-[#2e6250]/80">
                <div className="text-[10px] font-mono text-[#95b8a5]">CASHPOINTS</div>
                <div className="text-lg font-bold text-white mt-0.5">
                  {selectedCity === 'ALL' ? '120 ATMs' : '20 ATMs'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#1b3d31] border border-[#2e6250]/80">
                <div className="text-[10px] font-mono text-[#95b8a5]">EXTRACTION</div>
                <div className="text-lg font-bold text-[#c5e48d] mt-0.5">
                  {selectedCity === 'ALL'
                    ? '₹75.6 L'
                    : `₹${((cityData?.fraud_cashout_volume || 0) / 100000).toFixed(1)} L`}
                </div>
              </div>
            </div>

            {/* Complaints Feed */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-mono text-[#95b8a5] tracking-wider uppercase">
                  ACTIVE FRAUD INCIDENTS ({filteredComplaints.length})
                </div>
                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    setActiveTab('complaints');
                  }}
                  className="text-[11px] font-mono text-[#c5e48d] hover:underline cursor-pointer"
                >
                  View All 360 →
                </button>
              </div>

              {filteredComplaints.length === 0 ? (
                <div className="text-xs text-[#95b8a5] font-mono py-8 text-center">
                  No active incidents recorded for this filter.
                </div>
              ) : (
                filteredComplaints.map((c) => (
                  <div
                    key={c.complaint_id}
                    className="p-3.5 rounded-xl bg-[#1b3d31] border border-[#2e6250]/80 hover:border-[#c5e48d]/60 transition-all"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white">
                          {c.complaint_id}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-[#285343] text-[#c5e48d] border border-[#3e7260]">
                          {c.fraud_type}
                        </span>
                      </div>
                      <div className="text-xs font-bold font-mono text-white">
                        ₹{Number(c.reported_amount).toLocaleString()}
                      </div>
                    </div>

                    <div className="text-[10px] font-mono text-[#95b8a5] flex items-center justify-between">
                      <span>Mule: {c.beneficiary_account_id}</span>
                      <span>City: {c.beneficiary_city}</span>
                    </div>

                    <button
                      onClick={() => handleInterceptComplaint(c.complaint_id)}
                      className="mt-2.5 w-full py-1.5 bg-[#2a5b4a] hover:bg-[#c5e48d] hover:text-[#143227] text-white text-xs font-mono font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      INTERCEPT DISPATCH MEMO
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Drawer Footer Action */}
            <div className="p-4 border-t border-[#2e6250] bg-[#143227]">
              <button
                onClick={() => {
                  setDrawerOpen(false);
                  setActiveTab('predict');
                }}
                className="w-full py-2.5 bg-[#c5e48d] hover:bg-white text-[#143227] text-xs font-mono font-bold tracking-wider uppercase rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
              >
                <Zap className="w-4 h-4 fill-current" />
                Launch Live Prediction Radar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SLIDE-OUT RELIC OPERATIONS MENU (= Icon)
         ========================================================================= */}
      {navMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={() => setNavMenuOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          />

          {/* Nav Drawer Body */}
          <div className="relative w-full max-w-xs bg-[#183a2e] border-r border-[#2e6250] shadow-2xl h-full flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {/* Brand Header */}
            <div className="p-6 border-b border-[#2e6250] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#285343] border border-[#3e7260] flex items-center justify-center text-[#c5e48d]">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-black tracking-tight text-white text-base">
                    RELIC
                  </div>
                  <div className="text-[10px] font-mono text-[#95b8a5]">
                    EXTRACTION INTERCEPT
                  </div>
                </div>
              </div>
              <button
                onClick={() => setNavMenuOpen(false)}
                className="p-1.5 rounded-lg text-[#95b8a5] hover:text-white hover:bg-[#235043] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Officer Identity Card */}
            <div className="p-4 m-4 rounded-xl bg-[#143227] border border-[#2e6250]/80">
              <div className="text-[10px] font-mono text-[#c5e48d] font-bold">
                SESSION AUTHENTICATED
              </div>
              <div className="text-xs font-bold text-white mt-1">
                {officer?.name || 'Officer'}
              </div>
              <div className="text-[10px] font-mono text-[#95b8a5] mt-0.5">
                Badge: {officer?.badge_id} • Unit: {officer?.unit} ({officer?.city})
              </div>
            </div>

            {/* Navigation Sections */}
            <div className="flex-1 px-4 py-2 space-y-1">
              {[
                { id: 'dashboard', label: 'Operations Desk', icon: Activity },
                { id: 'predict', label: 'Live Prediction Radar', icon: Zap },
                { id: 'complaints', label: 'Complaints Explorer', icon: FileText },
                { id: 'map', label: 'ATM Network Map', icon: MapPin },
                { id: 'analytics', label: 'Model Intelligence', icon: SlidersHorizontal },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setNavMenuOpen(false);
                      setActiveTab(item.id);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl text-xs font-mono font-medium text-white hover:bg-[#285343] transition-all flex items-center gap-3 cursor-pointer text-left"
                  >
                    <Icon className="w-4 h-4 text-[#c5e48d]" />
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Logout Footer */}
            <div className="p-4 border-t border-[#2e6250]">
              <button
                onClick={() => {
                  setNavMenuOpen(false);
                  logout();
                }}
                className="w-full py-2 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-200 text-xs font-mono font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out Officer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
