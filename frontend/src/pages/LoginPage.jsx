import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, Shield, Radio, MapPin, Compass, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('OFFICER_007');
  const [password, setPassword] = useState('relic2026');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const authorizedOfficers = [
    { id: 'OFFICER_007', pass: 'relic2026', label: 'Insp. Vikram Sen' },
    { id: 'OFFICER_704', pass: 'relic2026', label: 'ACP Ananya Roy' },
    { id: 'admin', pass: 'admin', label: 'Command Admin' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please provide both Username and Password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login(username.trim(), password.trim());
    } catch (err) {
      const msg = err.response?.data?.detail || 'Authentication failed. Invalid credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const selectCredentials = (u, p) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div
      className="min-h-screen w-full relative flex items-center justify-center p-6 sm:p-10 lg:p-16 bg-black text-white overflow-hidden bg-cover bg-center bg-no-repeat selection:bg-blue-600 selection:text-white"
      style={{ backgroundImage: "url('/bg-space-earth.jpg')" }}
    >
      {/* Ultra-light subtle tint: zero blur, sharp & clear view of Earth and stars */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-black/40 pointer-events-none"></div>

      {/* Main Container - No Enclosing Boxes */}
      <div className="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
        
        {/* ========================================================
            LEFT COLUMN: Login Form (Without Any Box)
            ======================================================== */}
        <div className="lg:col-span-5 max-w-md w-full mx-auto lg:mx-0 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl font-light tracking-tight text-white mb-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              Welcome!
            </h1>
            <p className="text-slate-200 text-sm font-light tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
              Predict the Risk. Locate the Threat. Prevent the Fraud.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-950/90 border border-red-700 text-red-200 text-xs flex items-center gap-2 shadow-lg backdrop-blur-sm">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form directly on the background */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div className="relative border-b-2 border-white/60 focus-within:border-white transition-colors pb-1">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-white/90 shrink-0" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  autoComplete="username"
                  className="w-full bg-transparent text-sm text-white placeholder-white/80 focus:outline-none py-1.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="relative border-b-2 border-white/60 focus-within:border-white transition-colors pb-1">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-white/90 shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete="current-password"
                  className="w-full bg-transparent text-sm text-white placeholder-white/80 focus:outline-none py-1.5 pr-8 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-white/70 hover:text-white transition-colors focus:outline-none cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember my Username Checkbox */}
            <div className="flex items-center gap-2.5 pt-1">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-white/80 bg-transparent text-blue-600 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-blue-600"
              />
              <label htmlFor="rememberMe" className="text-xs text-slate-200 cursor-pointer select-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                Remember my Username
              </label>
            </div>

            {/* Solid Blue Rounded Button (Template 1) */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#2470c7] hover:bg-[#1d5ea8] text-white font-medium text-sm tracking-widest uppercase rounded-lg shadow-xl shadow-blue-950/60 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>AUTHENTICATING...</span>
                </>
              ) : (
                'LOGIN'
              )}
            </button>
          </form>

          {/* Quick Officer Credentials selection directly on background (No Box) */}
          <div className="mt-8 pt-4 border-t border-white/20">
            <div className="text-[11px] font-mono tracking-wider text-slate-300 mb-2 uppercase flex items-center justify-between">
              <span>AUTHORIZED CREDENTIALS:</span>
              <span className="text-cyan-300">CLICK TO FILL</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {authorizedOfficers.map((c) => {
                const isSelected = username === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectCredentials(c.id, c.pass)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/40 border border-blue-400'
                        : 'bg-black/60 hover:bg-black/80 text-slate-200 border border-white/30'
                    }`}
                  >
                    <span>{c.id}</span>
                    <span className="opacity-75 text-[10px]">({c.pass})</span>
                    {isSelected && <CheckCircle2 className="w-3 h-3 text-white inline" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ========================================================
            RIGHT COLUMN: Intelligence Details (Without Any Box)
            ======================================================== */}
        <div className="lg:col-span-7 space-y-6 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
          {/* Main Title & Acronym */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/70 border border-blue-400/40 text-blue-300 text-xs font-mono tracking-wider uppercase mb-3 backdrop-blur-sm">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span>LAW ENFORCEMENT & CYBERCRIME INTELLIGENCE</span>
            </div>

            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
              RELIC
            </h2>
            <div className="text-base sm:text-lg font-medium text-cyan-300 font-mono mt-1 tracking-wide drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
              Risk Evaluation & Location Intelligence for Cashpoints
            </div>
          </div>

          {/* Mission Description */}
          <p className="text-slate-200 text-sm sm:text-base leading-relaxed font-light drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] max-w-2xl">
            An AI-powered intelligence platform designed to help law enforcement agencies anticipate suspicious cash withdrawals, identify high-risk ATM locations, and support proactive cybercrime investigations.
          </p>

          {/* Three Feature Pillars - Direct on Background (No Boxes) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
            {/* Pillar 1 */}
            <div className="space-y-1.5">
              <div className="w-9 h-9 rounded-lg bg-blue-600/30 border border-blue-400/50 flex items-center justify-center text-blue-300 mb-2">
                <Radio className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold font-mono text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                Predictive Intelligence
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-light">
                Forecast likely withdrawal locations and time windows.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="space-y-1.5">
              <div className="w-9 h-9 rounded-lg bg-cyan-600/30 border border-cyan-400/50 flex items-center justify-center text-cyan-300 mb-2">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold font-mono text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                Geospatial Risk Analysis
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-light">
                Visualize ATM hotspots and location-based risk patterns.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="space-y-1.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-600/30 border border-emerald-400/50 flex items-center justify-center text-emerald-300 mb-2">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold font-mono text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                Proactive Intervention
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-light">
                Generate actionable intelligence to support timely investigation.
              </p>
            </div>
          </div>

          {/* Bottom Tagline */}
          <div className="pt-4 border-t border-white/20 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-slate-300">
            <div className="tracking-widest text-white font-bold drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
              INTELLIGENCE • INVESTIGATION • PREVENTION
            </div>
            <div className="text-[11px] text-cyan-300">
              ML RANDOM FOREST • CALIBRATED
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
