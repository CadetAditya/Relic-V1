import React, { useState, useEffect } from 'react';
import {
  Search,
  ArrowRight,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Building,
  CreditCard,
  MapPin,
  AlertTriangle,
  Clock,
  Radio,
  ExternalLink,
  ShieldAlert,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import api from '../services/api';

const QUICK_ACCOUNTS = [
  { id: 'ACC000397', label: 'ACC000397 (Mule Master)' },
  { id: 'ACC000001', label: 'ACC000001 (Rapid Extraction)' },
  { id: 'ACC000021', label: 'ACC000021 (Multi-ATM Mule)' },
  { id: 'ACC000045', label: 'ACC000045 (Punjab Layer 2)' },
  { id: 'ACC000088', label: 'ACC000088 (High Velocity)' },
];

export default function AccountAnalysis({
  setActiveTab,
  setSelectedComplaintId,
  initialAccountId = 'ACC000397',
}) {
  const [searchInput, setSearchInput] = useState(initialAccountId);
  const [activeAccount, setActiveAccount] = useState(initialAccountId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [networkData, setNetworkData] = useState(null);
  const [activeViewTab, setActiveViewTab] = useState('trail'); // 'trail' | 'transactions' | 'withdrawals' | 'counterparties'

  useEffect(() => {
    fetchAccountNetwork(activeAccount);
  }, [activeAccount]);

  const fetchAccountNetwork = async (accId) => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAccountNetwork(accId);
      setNetworkData(data);
    } catch (err) {
      console.error('Failed to load account network data:', err);
      setError('Account not found in forensic ledger or network failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setActiveAccount(searchInput.trim());
    }
  };

  const account = networkData?.account || {};
  const transactions = networkData?.transactions || [];
  const withdrawals = networkData?.withdrawals || [];
  const counterparties = networkData?.counterparties || [];
  const totalReceived = networkData?.total_received || 0;
  const totalSent = networkData?.total_sent || 0;
  const totalWithdrawn = networkData?.total_withdrawn || 0;

  return (
    <div className="space-y-6">
      {/* Top Header & Search Bar */}
      <div className="bg-[#183a2e]/90 border border-[#2e6250] rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-[#2e6250]/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#143227] text-[#c5e48d] border border-[#2e6250]">
                MODULE 07
              </span>
              <span className="text-xs font-mono text-[#95b8a5] tracking-wider">
                FORENSIC FINANCIAL TRAIL
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
              Account &amp; Money Trail Analysis
            </h1>
            <p className="text-xs text-[#95b8a5] mt-0.5">
              Multi-hop counterparty network, beneficiary flow visualization, and cashpoint ATM extraction mapping.
            </p>
          </div>

          {/* Quick Account Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-mono text-[#95b8a5] mr-1">Suspect Mules:</span>
            {QUICK_ACCOUNTS.map((qa) => (
              <button
                key={qa.id}
                onClick={() => {
                  setSearchInput(qa.id);
                  setActiveAccount(qa.id);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                  activeAccount === qa.id
                    ? 'bg-[#c5e48d] text-[#183a2e] font-bold shadow'
                    : 'bg-[#143227] text-[#95b8a5] border border-[#2e6250] hover:text-white hover:border-[#3e7863]'
                }`}
              >
                {qa.id}
              </button>
            ))}
          </div>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearchSubmit} className="mt-5 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#95b8a5] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Enter suspect account ID (e.g. ACC_00000000, ACC_00000021)..."
              className="w-full bg-[#143227] border border-[#2e6250] focus:border-[#c5e48d] focus:ring-1 focus:ring-[#c5e48d] rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-white placeholder-[#95b8a5]/50 outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-[#c5e48d] hover:bg-[#d6f0a4] text-[#183a2e] font-bold rounded-xl text-xs font-mono transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Activity className="w-4 h-4" />
            TRACE ACCOUNT TRAIL
          </button>
        </form>
      </div>

      {loading ? (
        <div className="bg-[#183a2e]/60 border border-[#2e6250] rounded-2xl p-16 text-center">
          <div className="w-8 h-8 border-2 border-[#2e6250] border-t-[#c5e48d] rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-mono text-[#c5e48d]">INTERROGATING LEDGER &amp; EXTRACTION GRAPH...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-950/30 border border-rose-800/60 rounded-2xl p-8 text-center text-rose-300">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-rose-400" />
          <p className="text-xs font-mono font-bold">{error}</p>
        </div>
      ) : (
        <>
          {/* Account Identity Card */}
          <div className="bg-[#183a2e]/90 border border-[#2e6250] rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#20493b] to-[#2c614f] border border-[#3e7863] flex items-center justify-center text-[#c5e48d] shrink-0 shadow-lg">
                  <CreditCard className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl font-bold font-mono text-white tracking-wide">
                      {account.account_id || activeAccount}
                    </h2>
                    {account.fraud_confirmed === 1 ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-900/60 text-rose-300 border border-rose-700/80">
                        CONFIRMED FRAUD MULE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-900/60 text-amber-300 border border-amber-700/80">
                        UNDER RECONNAISSANCE
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#143227] text-[#c5e48d] border border-[#2e6250]">
                      KYC: {account.kyc_status || 'VERIFIED'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 mt-3 text-xs font-mono text-[#95b8a5]">
                    <div>
                      <span className="text-[#95b8a5]/60 text-[10px] block">BANK NAME</span>
                      <span className="text-white font-semibold">{account.bank_id || 'STATE_BANK'}</span>
                    </div>
                    <div>
                      <span className="text-[#95b8a5]/60 text-[10px] block">BRANCH IFSC</span>
                      <span className="text-white font-semibold">{account.branch_ifsc || 'SBIN009210'}</span>
                    </div>
                    <div>
                      <span className="text-[#95b8a5]/60 text-[10px] block">REGISTERED CITY</span>
                      <span className="text-white font-semibold">{account.branch_city || account.registered_address_region || 'Jalandhar'}</span>
                    </div>
                    <div>
                      <span className="text-[#95b8a5]/60 text-[10px] block">CURRENT BALANCE</span>
                      <span className="text-[#c5e48d] font-bold">
                        ₹{(account.balance || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 self-stretch lg:self-auto justify-end">
                <button
                  onClick={() => {
                    if (setActiveTab) setActiveTab('predict');
                  }}
                  className="px-4 py-2.5 bg-[#c5e48d] hover:bg-[#d6f0a4] text-[#183a2e] font-bold rounded-xl text-xs font-mono transition-all flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Sparkles className="w-4 h-4" />
                  PREDICT ATM EXTRACTION
                </button>
                <button
                  onClick={() => {
                    if (setActiveTab) setActiveTab('register');
                  }}
                  className="px-4 py-2.5 bg-[#143227] hover:bg-[#20493b] text-white border border-[#2e6250] rounded-xl text-xs font-mono transition-all flex items-center gap-2 cursor-pointer"
                >
                  <ShieldAlert className="w-4 h-4 text-[#c5e48d]" />
                  FILE CASE AGAINST MULE
                </button>
              </div>
            </div>

            {/* Financial Flow Statistics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-[#2e6250]">
              <div className="bg-[#143227] border border-[#2e6250] rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono text-[#95b8a5]">TOTAL INFLOW (CRIME PROCEEDS)</div>
                  <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                    +₹{totalReceived.toLocaleString()}
                  </div>
                  <div className="text-[10px] font-mono text-[#95b8a5] mt-1">
                    {transactions.filter((t) => t.receiver_account_id === activeAccount).length} Inbound Transfers
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
                  <ArrowDownLeft className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-[#143227] border border-[#2e6250] rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono text-[#95b8a5]">OUTFLOW CASHPOINTS (ATMS)</div>
                  <div className="text-lg font-bold font-mono text-[#c5e48d] mt-0.5">
                    -₹{totalWithdrawn.toLocaleString()}
                  </div>
                  <div className="text-[10px] font-mono text-[#95b8a5] mt-1">
                    {withdrawals.length} ATM Cash Withdrawals
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-[#20493b] border border-[#3e7863] flex items-center justify-center text-[#c5e48d]">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-[#143227] border border-[#2e6250] rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono text-[#95b8a5]">ACCOUNT DRAIN VELOCITY</div>
                  <div className="text-lg font-bold font-mono text-amber-300 mt-0.5">
                    {totalReceived > 0
                      ? `${Math.min(100, Math.round(((totalSent + totalWithdrawn) / totalReceived) * 100))}%`
                      : '0%'}
                  </div>
                  <div className="text-[10px] font-mono text-[#95b8a5] mt-1">
                    Proceeds Extracted via Cash
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-amber-950/60 border border-amber-800/60 flex items-center justify-center text-amber-400">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Sub Navigation Bar for Data Views */}
          <div className="flex items-center gap-2 border-b border-[#2e6250] pb-2">
            {[
              { id: 'trail', label: 'Money Trail Visualization', icon: Layers },
              { id: 'transactions', label: `Transactions (${transactions.length})`, icon: ArrowRight },
              { id: 'withdrawals', label: `ATM Withdrawals (${withdrawals.length})`, icon: CreditCard },
              { id: 'counterparties', label: `Counterparty Nodes (${counterparties.length})`, icon: Building },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeViewTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveViewTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-medium transition-all flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-[#c5e48d] text-[#183a2e] font-bold shadow'
                      : 'text-[#95b8a5] hover:text-white hover:bg-[#183a2e]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB 1: Money Trail Visualization */}
          {activeViewTab === 'trail' && (
            <div className="bg-[#183a2e]/90 border border-[#2e6250] rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#c5e48d]" />
                    MONEY TRAIL EXTRACTION TOPOLOGY
                  </h3>
                  <p className="text-xs text-[#95b8a5]">
                    Trace source cybercrime deposits funneling through this mule into physical cashpoints.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-[#c5e48d] bg-[#143227] px-2.5 py-1 rounded-lg border border-[#2e6250]">
                  LIVE RADAR TOPOLOGY
                </span>
              </div>

              {/* 3-Column Visual Flow Diagram */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch mt-4">
                {/* Column 1: Inflow Sources */}
                <div className="bg-[#143227] border border-[#2e6250] rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-[#2e6250]">
                      <span className="text-xs font-bold font-mono text-emerald-400 flex items-center gap-1.5">
                        <ArrowDownLeft className="w-4 h-4" />
                        1. INFLOW SOURCES (VICTIMS / ACCOUNTS)
                      </span>
                      <span className="text-[10px] font-mono text-[#95b8a5]">
                        {counterparties.filter((c) => c.direction === 'inbound').length} Senders
                      </span>
                    </div>

                    <div className="mt-3 space-y-2 max-h-[340px] overflow-y-auto pr-1">
                      {counterparties.filter((c) => c.direction === 'inbound').length === 0 ? (
                        <div className="text-xs font-mono text-[#95b8a5] py-6 text-center">
                          No inbound digital transfers recorded
                        </div>
                      ) : (
                        counterparties
                          .filter((c) => c.direction === 'inbound')
                          .slice(0, 5)
                          .map((cp) => (
                            <div
                              key={cp.account_id}
                              onClick={() => {
                                setSearchInput(cp.account_id);
                                setActiveAccount(cp.account_id);
                              }}
                              className="p-2.5 rounded-lg bg-[#183a2e] border border-[#2e6250] hover:border-[#c5e48d] cursor-pointer transition-all flex items-center justify-between group"
                            >
                              <div>
                                <div className="text-xs font-mono font-semibold text-white group-hover:text-[#c5e48d]">
                                  {cp.account_id}
                                </div>
                                <div className="text-[10px] font-mono text-[#95b8a5]">
                                  {cp.tx_count} transfers • Source Account
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs font-mono font-bold text-emerald-400">
                                  +₹{cp.total_amount.toLocaleString()}
                                </div>
                                <span className="text-[9px] font-mono text-[#95b8a5] group-hover:text-[#c5e48d] flex items-center gap-0.5 justify-end">
                                  inspect <ArrowRight className="w-2.5 h-2.5" />
                                </span>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#2e6250] text-[11px] font-mono text-emerald-400 flex justify-between">
                    <span>Total Inbound Flow:</span>
                    <span className="font-bold">+₹{totalReceived.toLocaleString()}</span>
                  </div>
                </div>

                {/* Column 2: Central Suspect Hub */}
                <div className="bg-gradient-to-b from-[#1b4334] to-[#143227] border-2 border-[#c5e48d]/60 rounded-xl p-5 flex flex-col justify-between shadow-lg relative">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-2xl bg-[#c5e48d] text-[#183a2e] mx-auto flex items-center justify-center font-bold text-xl shadow-md">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <span className="inline-block mt-2 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#143227] text-[#c5e48d] border border-[#2e6250]">
                      FOCAL SUSPECT NODE
                    </span>
                    <h4 className="text-base font-bold font-mono text-white mt-1">
                      {account.account_id || activeAccount}
                    </h4>
                    <p className="text-[11px] font-mono text-[#95b8a5]">
                      {account.bank_id} • {account.branch_city || 'Punjab Zone'}
                    </p>
                  </div>

                  {/* Flow Arrow Indicators */}
                  <div className="my-4 py-3 bg-[#183a2e]/90 rounded-lg border border-[#2e6250] text-center space-y-2">
                    <div className="text-[11px] font-mono text-[#95b8a5]">
                      Rapid Liquidation Time Window:
                    </div>
                    <div className="text-xs font-mono font-bold text-[#c5e48d]">
                      Typically &lt; 2.5 hrs after deposit
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs font-mono text-amber-300">
                      <span>Fund Absorption:</span>
                      <span className="font-bold">
                        ₹{(totalReceived - totalSent - totalWithdrawn).toLocaleString()} Remaining
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        if (setActiveTab) setActiveTab('predict');
                      }}
                      className="w-full py-2 bg-[#c5e48d] hover:bg-[#d6f0a4] text-[#183a2e] font-bold rounded-lg text-xs font-mono transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      PREDICT WITHDRAWAL ATMS
                    </button>
                  </div>
                </div>

                {/* Column 3: Outflow & ATM Extractions */}
                <div className="bg-[#143227] border border-[#2e6250] rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-[#2e6250]">
                      <span className="text-xs font-bold font-mono text-rose-400 flex items-center gap-1.5">
                        <ArrowUpRight className="w-4 h-4" />
                        3. PHYSICAL CASH EXTRACTIONS (ATMS)
                      </span>
                      <span className="text-[10px] font-mono text-[#95b8a5]">
                        {withdrawals.length} Extractions
                      </span>
                    </div>

                    <div className="mt-3 space-y-2 max-h-[340px] overflow-y-auto pr-1">
                      {withdrawals.length === 0 ? (
                        <div className="text-xs font-mono text-[#95b8a5] py-6 text-center">
                          No direct ATM withdrawals logged for this account
                        </div>
                      ) : (
                        withdrawals.slice(0, 5).map((w, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-lg bg-[#183a2e] border border-[#2e6250] hover:border-rose-500/60 transition-all flex items-center justify-between"
                          >
                            <div>
                              <div className="text-xs font-mono font-semibold text-white flex items-center gap-1.5">
                                <MapPin className="w-3 h-3 text-rose-400" />
                                {w.atm_id}
                              </div>
                              <div className="text-[10px] font-mono text-[#95b8a5]">
                                {w.city || 'Punjab'} • {w.withdrawal_datetime?.slice(0, 16) || 'Recent'}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-mono font-bold text-rose-400">
                                -₹{parseFloat(w.amount).toLocaleString()}
                              </div>
                              <span className="text-[9px] font-mono text-rose-300">
                                Cash Dispensed
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#2e6250] text-[11px] font-mono text-rose-400 flex justify-between">
                    <span>Total Cash Siphoned:</span>
                    <span className="font-bold">-₹{totalWithdrawn.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Full Transaction Ledger */}
          {activeViewTab === 'transactions' && (
            <div className="bg-[#183a2e]/90 border border-[#2e6250] rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-[#c5e48d]" />
                    FORENSIC TRANSACTION LEDGER
                  </h3>
                  <p className="text-xs text-[#95b8a5]">
                    All banking layer transfers, IMPS/UPI routing, and balance delta.
                  </p>
                </div>
                <span className="text-xs font-mono text-[#95b8a5]">
                  Showing last {transactions.length} records
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[#2e6250] text-[#95b8a5] bg-[#143227]">
                      <th className="py-2.5 px-3">UTR REFERENCE</th>
                      <th className="py-2.5 px-3">DATETIME</th>
                      <th className="py-2.5 px-3">DIRECTION</th>
                      <th className="py-2.5 px-3">COUNTERPARTY</th>
                      <th className="py-2.5 px-3">CHANNEL</th>
                      <th className="py-2.5 px-3 text-right">AMOUNT</th>
                      <th className="py-2.5 px-3 text-right">POST BALANCE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2e6250]/50">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-[#95b8a5]">
                          No transactions found for this account.
                        </td>
                      </tr>
                    ) : (
                      transactions.map((tx, idx) => {
                        const isInbound = tx.receiver_account_id === activeAccount;
                        const cParty = isInbound ? tx.sender_account_id : tx.receiver_account_id;
                        return (
                          <tr key={idx} className="hover:bg-[#143227]/60 transition-colors">
                            <td className="py-2.5 px-3 font-semibold text-white">
                              {tx.utr_reference || `UTR${idx + 1000}`}
                            </td>
                            <td className="py-2.5 px-3 text-[#95b8a5]">
                              {tx.transaction_datetime || '2026-11-10'}
                            </td>
                            <td className="py-2.5 px-3">
                              {isInbound ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                                  INBOUND
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800/60">
                                  OUTBOUND
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-white">
                              <button
                                onClick={() => {
                                  setSearchInput(cParty);
                                  setActiveAccount(cParty);
                                }}
                                className="hover:text-[#c5e48d] hover:underline cursor-pointer"
                              >
                                {cParty || 'ATM_DISPENSE'}
                              </button>
                            </td>
                            <td className="py-2.5 px-3 text-[#95b8a5]">
                              {tx.channel || 'IMPS'}
                            </td>
                            <td
                              className={`py-2.5 px-3 text-right font-bold ${
                                isInbound ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {isInbound ? '+' : '-'}₹{parseFloat(tx.amount || 0).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right text-[#95b8a5]">
                              ₹{(tx.balance_after || 0).toLocaleString()}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ATM Withdrawals */}
          {activeViewTab === 'withdrawals' && (
            <div className="bg-[#183a2e]/90 border border-[#2e6250] rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#c5e48d]" />
                    ATM EXTRACTIONS LOG
                  </h3>
                  <p className="text-xs text-[#95b8a5]">
                    Ground-level physical cashpoints targeted by the syndicate.
                  </p>
                </div>
                <span className="text-xs font-mono text-[#95b8a5]">
                  {withdrawals.length} cash extractions logged
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {withdrawals.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-xs font-mono text-[#95b8a5]">
                    No ATM cash extractions directly associated with this account.
                  </div>
                ) : (
                  withdrawals.map((w, idx) => (
                    <div
                      key={idx}
                      className="bg-[#143227] border border-[#2e6250] rounded-xl p-4 flex flex-col justify-between hover:border-[#c5e48d]/60 transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#183a2e] text-[#c5e48d] border border-[#2e6250]">
                            {w.atm_id}
                          </span>
                          <span className="text-xs font-mono font-bold text-rose-400">
                            -₹{parseFloat(w.amount).toLocaleString()}
                          </span>
                        </div>
                        <div className="mt-3 space-y-1 text-xs font-mono text-[#95b8a5]">
                          <div className="flex items-center gap-1.5 text-white">
                            <MapPin className="w-3.5 h-3.5 text-[#c5e48d]" />
                            <span>{w.city || 'Punjab'} Location</span>
                          </div>
                          <div>Bank: {w.bank_id || 'SBI'}</div>
                          <div className="text-[10px] text-[#95b8a5]/80">
                            Time: {w.withdrawal_datetime || '2026-11-10 14:22:00'}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#2e6250] flex items-center justify-between text-[11px] font-mono">
                        <span className="text-rose-400">
                          {w.fraud_linked ? 'FRAUD LINKED' : 'STANDARD WD'}
                        </span>
                        <button
                          onClick={() => {
                            if (setActiveTab) setActiveTab('map');
                          }}
                          className="text-[#c5e48d] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          view on map <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Counterparty Nodes */}
          {activeViewTab === 'counterparties' && (
            <div className="bg-[#183a2e]/90 border border-[#2e6250] rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                    <Building className="w-4 h-4 text-[#c5e48d]" />
                    LINKED COUNTERPARTY ACCOUNTS
                  </h3>
                  <p className="text-xs text-[#95b8a5]">
                    Accounts directly exchanging funds with {activeAccount}. Click any account to pivot investigation.
                  </p>
                </div>
                <span className="text-xs font-mono text-[#95b8a5]">
                  {counterparties.length} counterparty relationships
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {counterparties.map((cp) => (
                  <div
                    key={cp.account_id}
                    onClick={() => {
                      setSearchInput(cp.account_id);
                      setActiveAccount(cp.account_id);
                    }}
                    className="p-4 rounded-xl bg-[#143227] border border-[#2e6250] hover:border-[#c5e48d] cursor-pointer transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-white group-hover:text-[#c5e48d]">
                          {cp.account_id}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            cp.direction === 'inbound'
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                              : 'bg-amber-950/80 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {cp.direction.toUpperCase()}
                        </span>
                      </div>
                      <div className="mt-2 text-xs font-mono text-[#95b8a5]">
                        <div>Total Exchange: ₹{cp.total_amount.toLocaleString()}</div>
                        <div>Transactions: {cp.tx_count} transfers</div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[#2e6250] flex items-center justify-between text-[11px] font-mono text-[#c5e48d]">
                      <span>Pivot to this account</span>
                      <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
