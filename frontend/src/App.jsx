import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import PredictConsole from './pages/PredictConsole';
import ComplaintsList from './pages/ComplaintsList';
import RegisterComplaint from './pages/RegisterComplaint';
import AtmNetworkMap from './pages/AtmNetworkMap';
import ModelAnalytics from './pages/ModelAnalytics';
import AccountAnalysis from './pages/AccountAnalysis';
import RegionalMonitoring from './pages/RegionalMonitoring';
import OfficerManagement from './pages/OfficerManagement';

function MainPortal() {
  const { isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedComplaintId, setSelectedComplaintId] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
    <div className="min-h-screen bg-[#224d3f] text-white flex font-sans relative overflow-x-hidden">
      {/* Persistent Vertical Guidelines (Theme Signature) */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute left-[7%] top-0 bottom-0 w-px bg-[#2b5a4b] opacity-60" />
        <div className="absolute left-[26%] top-0 bottom-0 w-px bg-[#2b5a4b] opacity-60" />
        <div className="absolute left-[46%] top-0 bottom-0 w-px bg-[#2b5a4b] opacity-60" />
        <div className="absolute left-[72%] top-0 bottom-0 w-px bg-[#2b5a4b] opacity-60" />
        <div className="absolute left-[88%] top-0 bottom-0 w-px bg-[#2b5a4b] opacity-60" />
        <div className="absolute left-[95%] top-0 bottom-0 w-px bg-[#2b5a4b] opacity-60" />
      </div>

      {/* Left-Hand Navigation Sidebar (Always on the Left) */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area on the Right (Offset to accommodate fixed left-hand sidebar) */}
      <div
        className={`flex-1 flex flex-col min-w-0 relative z-10 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Mobile Header Bar (Only visible on small screens where sidebar is hidden) */}
        <div className="lg:hidden h-14 bg-[#183a2e]/95 backdrop-blur-md border-b border-[#2e6250] flex items-center justify-between px-4 sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            title="Open Navigation"
            className="p-2 rounded-lg text-[#95b8a5] hover:text-white hover:bg-[#20493b] cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white text-sm tracking-tight">RELIC</span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#143227] text-[#c5e48d] border border-[#2e6250]">
              v1.0 ML
            </span>
          </div>

          <div className="w-8" />
        </div>

        {/* Dynamic Route Pages */}
        <main
          className={
            activeTab === 'dashboard'
              ? 'flex-1 w-full flex flex-col relative'
              : 'flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 relative'
          }
        >
          {activeTab === 'dashboard' && (
            <Dashboard
              setActiveTab={setActiveTab}
              setSelectedComplaintId={setSelectedComplaintId}
              onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
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

          {activeTab === 'register' && (
            <RegisterComplaint
              setActiveTab={setActiveTab}
              setSelectedComplaintId={setSelectedComplaintId}
            />
          )}

          {activeTab === 'accounts' && (
            <AccountAnalysis
              setActiveTab={setActiveTab}
              setSelectedComplaintId={setSelectedComplaintId}
            />
          )}

          {activeTab === 'map' && <AtmNetworkMap />}

          {activeTab === 'regional' && (
            <RegionalMonitoring
              setActiveTab={setActiveTab}
              setSelectedComplaintId={setSelectedComplaintId}
            />
          )}

          {activeTab === 'officers' && <OfficerManagement />}

          {activeTab === 'analytics' && <ModelAnalytics />}
        </main>

        {/* Footer (shown on sub-pages) */}
        {activeTab !== 'dashboard' && (
          <footer className="border-t border-[#2e6250] bg-[#183a2e]/95 py-4 text-center text-[11px] font-mono text-[#95b8a5] relative z-10 mt-auto">
            PROJECT RELIC • CYBERCRIME ATM WITHDRAWAL PREDICTION &amp; EXTRACTION INTERCEPTION • RESTRICTED GOV ACCESS
          </footer>
        )}
      </div>
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
