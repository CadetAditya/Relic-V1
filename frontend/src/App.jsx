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
      <div className="min-h-screen bg-[#183a2e] flex items-center justify-center font-mono text-[#c5e48d] text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#2e6250] border-t-[#c5e48d] rounded-full animate-spin"></div>
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
    <div className="min-h-screen bg-[#224d3f] text-white flex flex-col font-sans relative overflow-x-hidden">
      {/* Persistent Vertical Guidelines (Theme Signature) */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute left-[7%] top-0 bottom-0 w-px bg-[#2b5a4b] opacity-60" />
        <div className="absolute left-[26%] top-0 bottom-0 w-px bg-[#2b5a4b] opacity-60" />
        <div className="absolute left-[46%] top-0 bottom-0 w-px bg-[#2b5a4b] opacity-60" />
        <div className="absolute left-[72%] top-0 bottom-0 w-px bg-[#2b5a4b] opacity-60" />
        <div className="absolute left-[88%] top-0 bottom-0 w-px bg-[#2b5a4b] opacity-60" />
        <div className="absolute left-[95%] top-0 bottom-0 w-px bg-[#2b5a4b] opacity-60" />
      </div>

      {/* Top Officer Navbar (rendered on interior sub-pages) */}
      {activeTab !== 'dashboard' && (
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      )}

      {/* Main Content Area */}
      <main
        className={
          activeTab === 'dashboard'
            ? 'flex-1 w-full flex flex-col relative z-10'
            : 'flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10'
        }
      >
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

      {/* Footer (shown on sub-pages) */}
      {activeTab !== 'dashboard' && (
        <footer className="border-t border-[#2e6250] bg-[#183a2e]/95 py-4 text-center text-[11px] font-mono text-[#95b8a5] relative z-10">
          PROJECT RELIC • CYBERCRIME ATM WITHDRAWAL PREDICTION & EXTRACTION INTERCEPTION • RESTRICTED GOV ACCESS
        </footer>
      )}
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
