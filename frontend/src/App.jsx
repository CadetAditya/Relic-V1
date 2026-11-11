import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import PredictConsole from './pages/PredictConsole';
import ComplaintsList from './pages/ComplaintsList';
import AtmNetworkMap from './pages/AtmNetworkMap';
import ModelAnalytics from './pages/ModelAnalytics';

function MainPortal() {
  const { isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedComplaintId, setSelectedComplaintId] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center font-mono text-cyan-400 text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin"></div>
          <div>AUTHENTICATING SECURITY CLEARANCE...</div>
        </div>
      </div>
    );
  }

  // Guard: If not logged in, show Officer Login Page
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Officer Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            setActiveTab={setActiveTab}
            setSelectedComplaintId={setSelectedComplaintId}
          />
        )}

        {activeTab === 'predict' && (
          <PredictConsole
            selectedComplaintId={selectedComplaintId}
            setSelectedComplaintId={setSelectedComplaintId}
          />
        )}

        {activeTab === 'complaints' && (
          <ComplaintsList
            setActiveTab={setActiveTab}
            setSelectedComplaintId={setSelectedComplaintId}
          />
        )}

        {activeTab === 'map' && <AtmNetworkMap />}

        {activeTab === 'analytics' && <ModelAnalytics />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-[11px] font-mono text-slate-500">
        PROJECT RELIC • CYBERCRIME ATM WITHDRAWAL PREDICTION & EXTRACTION INTERCEPTION • RESTRICTED GOV ACCESS
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainPortal />
    </AuthProvider>
  );
}

