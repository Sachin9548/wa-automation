"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import {
  FaUserSecret, FaWallet, FaChartPie, FaUsers, FaSearch,
  FaSignOutAlt, FaExternalLinkAlt, FaCheckCircle, FaExclamationTriangle,
  FaRupeeSign, FaStore, FaBell, FaShieldAlt, FaChartLine,
  FaDatabase, FaServer, FaLayerGroup, FaSync, FaTimesCircle,
  FaBars, FaTimes, FaBook, FaWhatsapp, FaBoxOpen, FaCheck
} from "react-icons/fa";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const NAV_ITEMS = [
  { icon: <FaChartPie />, label: "Dashboard", active: true },
  { icon: <FaUsers />, label: "Merchants", active: false },
  { icon: <FaChartLine />, label: "Analytics", active: false },
  { icon: <FaShieldAlt />, label: "Security", active: false },
  { icon: <FaStore />, label: "Shopify Installs", active: false },
  { icon: <FaBoxOpen />, label: "Shopify Guide", active: false },
  { icon: <FaWhatsapp />, label: "Meta Guide", active: false },
];

// ── Guide helper components ───────────────────────────────────────────────────
function GuideCard({ title, children, accent = "teal" }: { title: string; children: React.ReactNode; accent?: string }) {
  const colors: Record<string, string> = {
    teal:   "bg-teal-500/10 border-teal-500/20",
    yellow: "bg-yellow-500/10 border-yellow-500/20",
    red:    "bg-red-500/10 border-red-500/20",
    blue:   "bg-blue-500/10 border-blue-500/20",
  };
  const titleColors: Record<string, string> = {
    teal: "text-teal-300", yellow: "text-yellow-300", red: "text-red-300", blue: "text-blue-300"
  };
  return (
    <div className={`border rounded-2xl px-4 py-4 ${colors[accent] || colors.teal}`}>
      <p className={`font-bold text-sm mb-2 ${titleColors[accent] || titleColors.teal}`}>{title}</p>
      {children}
    </div>
  );
}

function GuideStep({ num, title, children, accent }: { num: number; title: string; children: React.ReactNode; accent?: string }) {
  return (
    <div className="bg-slate-800 border border-white/5 rounded-2xl px-4 py-4">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0 ${accent === "red" ? "bg-red-500/20 text-red-400" : "bg-teal-500/20 text-teal-400"}`}>
          {num}
        </div>
        <p className="text-white font-bold text-sm">{title}</p>
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function AdminConsole() {
  const [merchants, setMerchants] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [adminKey, setAdminKey] = useState("");
  const [isAuth, setIsAuth] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeNav, setActiveNav] = useState("Dashboard");

  // Mobile sidebar toggle
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // System Health state
  const [sysHealth, setSysHealth]   = useState<any>(null);
  const [sysLoading, setSysLoading] = useState(false);

  // Shopify Install Logs state
  const [installLogs,     setInstallLogs]     = useState<any[]>([]);
  const [installLogsTotal,setInstallLogsTotal]= useState(0);
  const [installLogsLoading, setInstallLogsLoading] = useState(false);

  const fetchInstallLogs = async (key: string) => {
    setInstallLogsLoading(true);
    try {
      const r = await axios.get(`${API_URL}/admin/shopify-install-logs?limit=50`, {
        headers: { "x-admin-api-key": key }
      });
      setInstallLogs(r.data.logs || []);
      setInstallLogsTotal(r.data.total || 0);
    } catch { /* silent */ }
    finally { setInstallLogsLoading(false); }
  };

  const fetchSystemHealth = async (key: string) => {
    setSysLoading(true);
    try {
      const r = await axios.get(`${API_URL}/admin/system-health`, {
        headers: { "x-admin-api-key": key }
      });
      setSysHealth(r.data);
    } catch { /* silent */ }
    finally { setSysLoading(false); }
  };

  const fetchAll = async (key: string) => {
    try {
      const headers = { "x-admin-api-key": key };
      const [mRes, sRes] = await Promise.all([
        axios.get(`${API_URL}/admin/merchants`, { headers }),
        axios.get(`${API_URL}/admin/stats`, { headers }),
      ]);
      setMerchants(mRes.data.merchants);
      setStats(sRes.data);
      setIsAuth(true);
      sessionStorage.setItem("adminKey", key);
      fetchSystemHealth(key);
      fetchInstallLogs(key);
    } catch {
      alert("Access Denied: Invalid Key");
    }
  };

  useEffect(() => {
    const saved = sessionStorage.getItem("adminKey");
    if (saved) fetchAll(saved);
  }, []);

  // Close sidebar when route changes (nav click on mobile)
  const handleNavClick = (label: string) => {
    setActiveNav(label);
    setSidebarOpen(false);
    if (label === "Shopify Installs") {
      fetchInstallLogs(sessionStorage.getItem("adminKey") || "");
    }
  };

  // ── Login Screen ────────────────────────────────────────────────
  if (!isAuth) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 relative overflow-hidden px-4">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-teal-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      <div className="relative z-10 bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl w-full max-w-sm">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-teal-500/30">
          <FaUserSecret className="text-4xl text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-white text-center mb-1">Admin Portal</h1>
        <p className="text-slate-400 text-sm text-center mb-8">Enter your master key to access the control panel</p>
        <div className="space-y-4">
          <div className="relative">
            <FaShieldAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              type="password"
              placeholder="Master API Key"
              className="w-full pl-11 pr-4 py-4 bg-white/10 border border-white/10 text-white placeholder-slate-400 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 transition"
              onChange={(e) => setAdminKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchAll(adminKey)}
            />
          </div>
          <button
            onClick={() => fetchAll(adminKey)}
            className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white py-4 rounded-xl font-bold hover:from-teal-400 hover:to-teal-500 transition shadow-lg shadow-teal-500/30 flex items-center justify-center gap-2"
          >
            <FaShieldAlt /> Unlock Console
          </button>
        </div>
      </div>
    </div>
  );

  const filtered = merchants.filter((m) =>
    m.brandName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const activeCount  = merchants.filter((m) => m.status === "ACTIVE").length;
  const pendingCount = merchants.filter((m) => m.status !== "ACTIVE").length;

  // ── Main Dashboard ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row">

      {/* ── Mobile overlay backdrop ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-slate-900 border-r border-white/5 flex flex-col py-8 px-5 shrink-0
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:flex
      `}>
        {/* Mobile close button */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white lg:hidden"
        >
          <FaTimes className="text-lg" />
        </button>

        {/* Brand */}
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center shadow-lg">
            <FaShieldAlt className="text-white text-lg" />
          </div>
          <div>
            <p className="text-white font-extrabold text-base leading-tight">WA-SaaS</p>
            <p className="text-teal-400 text-xs font-medium">Admin Console</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNavClick(item.label)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${
                activeNav === item.label
                  ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="space-y-3">
          <div className="bg-teal-500/10 border border-teal-500/20 rounded-2xl p-4">
            <p className="text-teal-300 text-xs font-bold uppercase tracking-wider mb-1">Active Clients</p>
            <p className="text-3xl font-extrabold text-white">{activeCount}</p>
            <p className="text-slate-400 text-xs mt-1">of {merchants.length} total</p>
          </div>
          <button
            onClick={() => { sessionStorage.clear(); location.reload(); }}
            className="w-full flex items-center gap-2 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition text-sm font-bold"
          >
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </aside>

      {/* ── Main Area ── */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Top Header */}
        <header className="h-14 lg:h-16 bg-slate-900/80 backdrop-blur border-b border-white/5 flex items-center justify-between px-4 lg:px-8 shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition"
            >
              <FaBars className="text-lg" />
            </button>
            <div>
              <h1 className="text-base lg:text-xl font-extrabold text-white leading-tight">Master Control</h1>
              <p className="text-slate-400 text-[10px] lg:text-xs hidden sm:block">Monitoring {merchants.length} businesses</p>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            {/* Search — hidden on very small screens, visible from sm */}
            <div className="relative hidden sm:block">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input
                type="text"
                placeholder="Search merchant..."
                className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl text-sm w-40 lg:w-56 outline-none focus:ring-2 focus:ring-teal-500 transition"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="relative w-9 h-9 lg:w-10 lg:h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-400 transition">
              <FaBell className="text-sm" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Mobile search bar (shown below header on small screens) */}
        <div className="sm:hidden px-4 py-2 bg-slate-900/60 border-b border-white/5">
          <div className="relative">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              type="text"
              placeholder="Search merchant..."
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500 transition"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8">

          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
            {/* Revenue */}
            <div className="bg-gradient-to-br from-teal-600 to-teal-800 rounded-2xl p-5 lg:p-6 shadow-xl shadow-teal-900/40 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full" />
              <div className="absolute -right-2 bottom-2 w-16 h-16 bg-white/5 rounded-full" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3 lg:mb-4">
                  <p className="text-teal-100 text-xs font-bold uppercase tracking-wider">Total Revenue</p>
                  <div className="w-8 h-8 lg:w-9 lg:h-9 bg-white/20 rounded-xl flex items-center justify-center">
                    <FaRupeeSign className="text-white text-sm" />
                  </div>
                </div>
                <p className="text-3xl lg:text-4xl font-extrabold text-white mb-2">
                  ₹{stats?.totalEarnings?.toLocaleString() ?? "—"}
                </p>
                <div className="flex items-center gap-2">
                  <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">+12%</span>
                  <span className="text-teal-200 text-xs">from last month</span>
                </div>
              </div>
            </div>

            {/* Active Subscriptions */}
            <div className="bg-slate-800 border border-white/5 rounded-2xl p-5 lg:p-6 shadow-xl">
              <div className="flex items-center justify-between mb-3 lg:mb-4">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Active Subs</p>
                <div className="w-8 h-8 lg:w-9 lg:h-9 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <FaCheckCircle className="text-green-400 text-sm" />
                </div>
              </div>
              <p className="text-3xl lg:text-4xl font-extrabold text-white mb-2">{stats?.totalActiveClients ?? "—"}</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-700 rounded-full h-1.5">
                  <div
                    className="bg-green-400 h-1.5 rounded-full"
                    style={{ width: `${merchants.length > 0 ? (activeCount / merchants.length) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-slate-400 text-xs">
                  {merchants.length > 0 ? Math.round((activeCount / merchants.length) * 100) : 0}%
                </span>
              </div>
            </div>

            {/* Total Registered */}
            <div className="bg-slate-800 border border-white/5 rounded-2xl p-5 lg:p-6 shadow-xl">
              <div className="flex items-center justify-between mb-3 lg:mb-4">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Registered</p>
                <div className="w-8 h-8 lg:w-9 lg:h-9 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                  <FaStore className="text-indigo-400 text-sm" />
                </div>
              </div>
              <p className="text-3xl lg:text-4xl font-extrabold text-white mb-2">{merchants.length}</p>
              <p className="text-slate-400 text-xs">
                <span className="text-amber-400 font-bold">{pendingCount} pending</span> activation
              </p>
            </div>
          </div>

          {/* ── System Health ── */}
          <div className="bg-slate-800 border border-white/5 rounded-2xl p-4 lg:p-5 mb-6 lg:mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <div className={`w-2.5 h-2.5 rounded-full ${
                  !sysHealth ? 'bg-slate-500' :
                  sysHealth.overall === 'ok'      ? 'bg-green-400 animate-pulse' :
                  sysHealth.overall === 'warning' ? 'bg-yellow-400 animate-pulse' :
                                                    'bg-red-400 animate-pulse'
                }`} />
                <p className="text-white font-bold text-sm">System Health</p>
                {sysHealth?.checkedAt && (
                  <span className="text-slate-600 text-[10px]">
                    checked {new Date(sysHealth.checkedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
              <button
                onClick={() => fetchSystemHealth(sessionStorage.getItem("adminKey") || "")}
                disabled={sysLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white text-xs font-bold rounded-xl transition disabled:opacity-40"
              >
                <FaSync className={sysLoading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>

            {!sysHealth ? (
              <p className="text-slate-500 text-xs text-center py-2">Loading system status...</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {Object.values(sysHealth.checks).map((check: any) => (
                  <div key={check.label} className={`flex items-center gap-3 rounded-xl p-3 border ${
                    check.status === 'ok'      ? 'bg-green-500/5 border-green-500/20'  :
                    check.status === 'warning' ? 'bg-yellow-500/5 border-yellow-500/20' :
                                                 'bg-red-500/5 border-red-500/20'
                  }`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${
                      check.status === 'ok'      ? 'bg-green-500/20 text-green-400'  :
                      check.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                                                   'bg-red-500/20 text-red-400'
                    }`}>
                      {check.status === 'ok' ? <FaCheckCircle /> :
                       check.status === 'error' ? <FaTimesCircle /> : <FaExclamationTriangle />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white text-xs font-bold">{check.label}</span>
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                          check.status === 'ok'      ? 'bg-green-500/20 text-green-400'   :
                          check.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                                                       'bg-red-500/20 text-red-400'
                        }`}>{check.status}</span>
                      </div>
                      <p className="text-slate-500 text-[10px] truncate mt-0.5">{check.message}</p>
                      {check.stats && (
                        <div className="flex gap-2 mt-1 flex-wrap">
                          {[
                            { label: 'wait',   val: check.stats.waiting,  color: 'text-slate-400' },
                            { label: 'active', val: check.stats.active,   color: 'text-blue-400' },
                            { label: 'delay',  val: check.stats.delayed,  color: 'text-teal-400' },
                            { label: 'failed', val: check.stats.failed,   color: check.stats.failed > 0 ? 'text-red-400 font-bold' : 'text-slate-500' },
                          ].map(s => (
                            <span key={s.label} className={`text-[9px] ${s.color}`}>
                              {s.val} {s.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Merchants Table ── */}
          <div className="bg-slate-800 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-4 lg:px-6 py-4 border-b border-white/5">
              <h2 className="text-white font-bold text-sm lg:text-base">All Merchants</h2>
              <span className="bg-teal-500/20 text-teal-300 text-xs font-bold px-3 py-1 rounded-full border border-teal-500/20">
                {filtered.length} records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[540px]">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-4 lg:px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Merchant</th>
                    <th className="px-4 lg:px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Wallet</th>
                    <th className="px-4 lg:px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Expiry</th>
                    <th className="px-4 lg:px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 lg:px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map((m) => (
                    <tr key={m.id} className="hover:bg-white/3 transition group">
                      <td className="px-4 lg:px-6 py-3 lg:py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-xl bg-gradient-to-br from-teal-500/30 to-indigo-500/30 flex items-center justify-center border border-white/10 shrink-0">
                            <FaStore className="text-teal-300 text-xs" />
                          </div>
                          <div>
                            <p className="text-white font-bold text-sm">{m.brandName}</p>
                            <p className="text-slate-500 text-xs truncate max-w-[120px] lg:max-w-[180px]">{m.storeUrl || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4">
                        <p className="text-teal-400 font-extrabold text-sm">₹{m.totalPaidAmount?.toFixed(0) || '0'}</p>
                        <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                          {m.isFree ? '🎁 Free' : '💰 Paid'}
                        </p>
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4">
                        <p className="text-slate-300 text-xs lg:text-sm font-semibold whitespace-nowrap">
                          {m.subscriptionExpiry ? new Date(m.subscriptionExpiry).toLocaleDateString("en-IN") : "N/A"}
                        </p>
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4">
                        <div className="space-y-1">
                          {m.status === "ACTIVE" ? (
                            <span className="inline-flex items-center gap-1 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                              <FaExclamationTriangle className="text-[8px]" />
                              Pending
                            </span>
                          )}
                          {m.status === "ACTIVE" && (
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${m.serviceActive !== false ? 'bg-teal-500/10 border-teal-500/20 text-teal-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                              {m.serviceActive !== false ? '● ON' : '● OFF'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 text-center">
                        <Link
                          href={`/admin/merchants/${m.id}`}
                          className="inline-flex items-center gap-1.5 bg-teal-500/10 hover:bg-teal-500 border border-teal-500/30 hover:border-teal-500 text-teal-300 hover:text-white text-[11px] font-extrabold px-3 py-1.5 rounded-xl transition duration-200 whitespace-nowrap"
                        >
                          <FaExternalLinkAlt className="text-[9px]" /> Manage
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <FaUsers className="text-slate-600 text-4xl mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">No merchants found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Shopify Installs Tab ── */}
          {activeNav === "Shopify Installs" && (
            <div className="mt-6">
              <div className="bg-slate-800 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                <div className="flex items-center justify-between px-4 lg:px-6 py-4 border-b border-white/5">
                  <div>
                    <h2 className="text-white font-bold text-sm lg:text-base">Shopify App Installs</h2>
                    <p className="text-slate-500 text-xs mt-0.5">{installLogsTotal} total install callbacks</p>
                  </div>
                  <button
                    onClick={() => fetchInstallLogs(sessionStorage.getItem("adminKey") || "")}
                    disabled={installLogsLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white text-xs font-bold rounded-xl transition disabled:opacity-40"
                  >
                    <FaSync className={installLogsLoading ? "animate-spin" : ""} /> Refresh
                  </button>
                </div>

                {installLogsLoading ? (
                  <div className="flex items-center justify-center py-16 gap-3">
                    <FaSync className="animate-spin text-teal-400 text-xl" />
                    <span className="text-slate-400 text-sm">Loading install logs...</span>
                  </div>
                ) : installLogs.length === 0 ? (
                  <div className="px-6 py-16 text-center">
                    <FaStore className="text-slate-600 text-4xl mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No install callbacks yet</p>
                    <p className="text-slate-600 text-xs mt-1">When a client installs the app, it will appear here</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[600px]">
                      <thead>
                        <tr className="border-b border-white/5">
                          <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase">Shop</th>
                          <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase">Merchant</th>
                          <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase">Status</th>
                          <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase">Token</th>
                          <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {installLogs.map((log: any) => (
                          <tr key={log.id} className="hover:bg-white/3 transition">
                            <td className="px-4 py-3">
                              <p className="text-white text-sm font-mono">{log.shop}</p>
                            </td>
                            <td className="px-4 py-3">
                              {log.merchant ? (
                                <div>
                                  <p className="text-white text-sm font-bold">{log.merchant.brandName}</p>
                                  <p className="text-slate-500 text-xs">{log.merchant.status}</p>
                                </div>
                              ) : (
                                <span className="text-red-400 text-xs font-bold">Not matched</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] font-extrabold px-2 py-1 rounded-full border ${
                                log.status === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                                log.status === 'failed'  ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                                           'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                              }`}>
                                {log.status === 'success' ? '✅ Success' : log.status === 'failed' ? '❌ Failed' : '⏳ Pending'}
                              </span>
                              {log.errorMsg && <p className="text-red-400 text-[10px] mt-1 truncate max-w-[200px]">{log.errorMsg}</p>}
                            </td>
                            <td className="px-4 py-3">
                              {log.accessToken ? (
                                <span className="text-green-400 text-xs font-mono">{log.accessToken}</span>
                              ) : (
                                <span className="text-slate-600 text-xs">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-slate-400 text-xs whitespace-nowrap">
                                {new Date(log.callbackAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Shopify Guide Tab ── */}
          {activeNav === "Shopify Guide" && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <FaBoxOpen className="text-green-400" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">Shopify Custom App Setup</h2>
                  <p className="text-slate-500 text-xs">Per-client guide — creates permanent non-expiring access token</p>
                </div>
              </div>

              {/* Prerequisites */}
              <GuideCard title="Prerequisites (one-time)" accent="yellow">
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex gap-2"><span className="text-yellow-400 mt-0.5">•</span>Shopify Partner account already set up</li>
                  <li className="flex gap-2"><span className="text-yellow-400 mt-0.5">•</span>Backend callback endpoint live: <code className="bg-slate-900 text-green-400 px-1.5 py-0.5 rounded text-xs">https://api.wautomation.shop/shopify/callback/tokengenerate</code></li>
                </ul>
              </GuideCard>

              {/* Steps */}
              <GuideStep num={1} title="Create a new app in Dev Dashboard">
                <ol className="space-y-1.5 text-sm text-slate-300 list-decimal ml-4">
                  <li>Go to <a href="https://dev.shopify.com/dashboard" target="_blank" rel="noreferrer" className="text-teal-400 underline">dev.shopify.com/dashboard</a></li>
                  <li>Click <strong className="text-white">Create app</strong></li>
                  <li>Name it: <code className="bg-slate-900 text-green-400 px-1.5 py-0.5 rounded text-xs">Wautomation - &lt;ClientName&gt;</code></li>
                </ol>
              </GuideStep>

              <GuideStep num={2} title="Configure the app version">
                <div className="overflow-x-auto mt-2">
                  <table className="w-full text-sm border-collapse">
                    <thead><tr className="border-b border-white/10"><th className="text-left py-2 pr-4 text-slate-400 font-bold text-xs uppercase">Field</th><th className="text-left py-2 text-slate-400 font-bold text-xs uppercase">Value</th></tr></thead>
                    <tbody className="text-slate-300 divide-y divide-white/5">
                      <tr><td className="py-2 pr-4 font-mono text-xs">App URL</td><td className="py-2 text-green-400 font-mono text-xs">https://api.wautomation.shop/health</td></tr>
                      <tr><td className="py-2 pr-4 font-mono text-xs">Embed in Shopify admin</td><td className="py-2"><span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full font-bold">OFF</span></td></tr>
                      <tr><td className="py-2 pr-4 font-mono text-xs">Preferences URL</td><td className="py-2 text-slate-500 text-xs">leave blank</td></tr>
                      <tr><td className="py-2 pr-4 font-mono text-xs">Webhooks API version</td><td className="py-2 text-xs">latest available</td></tr>
                    </tbody>
                  </table>
                </div>
              </GuideStep>

              <GuideStep num={3} title="Set scopes">
                <p className="text-slate-400 text-xs mb-2">In the Scopes field, enter exactly:</p>
                <code className="block bg-slate-900 text-green-400 px-3 py-2 rounded-xl text-xs font-mono">read_customers,read_orders,read_products,read_all_orders</code>
              </GuideStep>

              <GuideStep num={4} title='Enable "Use legacy install flow"' accent="red">
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 mt-1">
                  <span className="text-red-400 text-base mt-0.5">⚠️</span>
                  <p className="text-red-300 text-xs">Find the <strong>&quot;Use legacy install flow&quot;</strong> toggle and turn it <strong>ON</strong>. Without this, Shopify forces the new managed-install flow which only issues expiring tokens.</p>
                </div>
              </GuideStep>

              <GuideStep num={5} title="Set the redirect URL">
                <p className="text-slate-400 text-xs mb-2">In <strong>Allowed redirection URL(s)</strong>, enter:</p>
                <code className="block bg-slate-900 text-green-400 px-3 py-2 rounded-xl text-xs font-mono">https://api.wautomation.shop/shopify/callback/tokengenerate</code>
                <p className="text-slate-600 text-xs mt-1">Same for every client — built once.</p>
              </GuideStep>

              <GuideStep num={6} title="Release and collect credentials">
                <ol className="space-y-1.5 text-sm text-slate-300 list-decimal ml-4">
                  <li>Click <strong className="text-white">Release</strong></li>
                  <li>Go to the app&apos;s credentials section and copy:</li>
                </ol>
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center gap-2 bg-slate-900 rounded-xl px-3 py-2">
                    <span className="text-slate-400 text-xs w-24">Client ID</span>
                    <span className="text-white font-mono text-xs flex-1">Copy from Shopify Partner dashboard</span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-900 rounded-xl px-3 py-2">
                    <span className="text-slate-400 text-xs w-24">Client Secret</span>
                    <span className="text-white font-mono text-xs flex-1">Copy and save encrypted in DB</span>
                  </div>
                </div>
              </GuideStep>

              <GuideStep num={7} title="Set distribution to Custom" accent="red">
                <ol className="space-y-1.5 text-sm text-slate-300 list-decimal ml-4">
                  <li>Open <strong className="text-white">App settings → Distribution</strong></li>
                  <li>Select <strong className="text-white">Custom distribution</strong></li>
                  <li>Confirm</li>
                </ol>
                <div className="flex items-start gap-2 bg-teal-500/10 border border-teal-500/20 rounded-xl px-3 py-2 mt-2">
                  <span className="text-teal-400 mt-0.5">ℹ️</span>
                  <p className="text-teal-300 text-xs">This is what makes a non-expiring token possible. Custom distribution apps are exempt from Shopify&apos;s expiring-token requirement.</p>
                </div>
              </GuideStep>

              <GuideStep num={8} title="Build the install link for this client">
                <p className="text-slate-400 text-xs mb-2">From Shopify Partner dashboard, copy the install link — it looks like:</p>
                <code className="block bg-slate-900 text-green-400 px-3 py-2 rounded-xl text-xs font-mono break-all">https://admin.shopify.com/oauth/install_custom_app?client_id=&#123;CLIENT_ID&#125;&amp;no_redirect=true&amp;signature=...</code>
                <p className="text-slate-500 text-xs mt-1.5">Paste this in the merchant&apos;s <strong className="text-white">App Install Link</strong> field → share with client.</p>
              </GuideStep>

              <GuideStep num={9} title="Client installs the app">
                <p className="text-slate-300 text-sm">Send the install link to the client. They log into their Shopify admin, review the permissions, and click <strong className="text-white">Install</strong>. The token auto-saves via the callback endpoint.</p>
              </GuideStep>

              <GuideStep num={10} title="Verify token received">
                <p className="text-slate-300 text-sm">After client installs, go to the merchant&apos;s page → Shopify Admin Token field → click <strong className="text-white">🔄 Check Status</strong>. Token auto-fills if received.</p>
              </GuideStep>

              {/* Checklist */}
              <GuideCard title="Per-client checklist" accent="teal">
                <div className="space-y-2 mt-1">
                  {[
                    "App created in Dev Dashboard, named for the client",
                    "Distribution set to Custom",
                    "App URL, scopes, redirect URI configured",
                    "Legacy install flow enabled",
                    "Version released",
                    "Client ID + Secret saved (encrypted)",
                    "Install link sent to client",
                    "Token exchanged and saved (encrypted)",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                      <FaCheck className="text-teal-400 text-xs flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </GuideCard>
            </div>
          )}

          {/* ── Meta Guide Tab ── */}
          {activeNav === "Meta Guide" && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <FaWhatsapp className="text-blue-400 text-lg" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">WhatsApp (Meta) Client Onboarding</h2>
                  <p className="text-slate-500 text-xs">Option B — fully separate per-client setup. No Meta App Review needed.</p>
                </div>
              </div>

              <GuideCard title="Why this approach?" accent="blue">
                <ul className="space-y-1.5 text-sm text-slate-300">
                  <li className="flex gap-2"><span className="text-blue-400 mt-0.5">•</span>No business verification or App Review needed</li>
                  <li className="flex gap-2"><span className="text-blue-400 mt-0.5">•</span>Everything created inside the <strong className="text-white">client&apos;s own</strong> Facebook/Business account</li>
                  <li className="flex gap-2"><span className="text-blue-400 mt-0.5">•</span>Works immediately — zero Meta approval wait</li>
                  <li className="flex gap-2"><span className="text-yellow-400 mt-0.5">⚠️</span>Repeat entire setup for every client (do over screen-share with client logged in)</li>
                </ul>
              </GuideCard>

              <GuideStep num={1} title="Create a Meta App inside the client's own account">
                <ol className="space-y-1.5 text-sm text-slate-300 list-decimal ml-4">
                  <li>Log into <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="text-blue-400 underline">developers.facebook.com</a> using the <strong className="text-white">client&apos;s</strong> Facebook account</li>
                  <li>Click <strong className="text-white">My Apps → Create App</strong></li>
                  <li>Choose <strong className="text-white">Other → Next → Business → Next</strong></li>
                  <li>Name it: <code className="bg-slate-900 text-green-400 px-1.5 py-0.5 rounded text-xs">&lt;ClientName&gt; WhatsApp</code></li>
                  <li>Click <strong className="text-white">Create app</strong></li>
                  <li>On products page, find <strong className="text-white">WhatsApp → Set up</strong></li>
                </ol>
              </GuideStep>

              <GuideStep num={2} title="Add and verify the client's phone number">
                <ol className="space-y-1.5 text-sm text-slate-300 list-decimal ml-4">
                  <li>Left menu: <strong className="text-white">WhatsApp → API Setup</strong></li>
                  <li>Scroll down, click <strong className="text-white">Add Phone Number</strong></li>
                  <li>Fill in client&apos;s business name and details</li>
                  <li>Enter their WhatsApp number — they&apos;ll receive OTP by SMS, verify it</li>
                </ol>
                <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-3 py-2 mt-2">
                  <span className="text-yellow-400 mt-0.5">⚠️</span>
                  <p className="text-yellow-300 text-xs">The number must NOT be active in regular WhatsApp or WhatsApp Business app. Use a fresh number or migrate their existing one first.</p>
                </div>
                <p className="text-slate-400 text-xs mt-2">Once verified, copy and save: <strong className="text-white">Phone Number ID</strong> and <strong className="text-white">WABA ID</strong></p>
              </GuideStep>

              <GuideStep num={3} title="Create a System User">
                <ol className="space-y-1.5 text-sm text-slate-300 list-decimal ml-4">
                  <li>Open <a href="https://business.facebook.com/settings" target="_blank" rel="noreferrer" className="text-blue-400 underline">business.facebook.com/settings</a> (still as the client)</li>
                  <li>Left menu → <strong className="text-white">Users → System Users → Add</strong></li>
                  <li>Name: <code className="bg-slate-900 text-green-400 px-1.5 py-0.5 rounded text-xs">&lt;ClientName&gt;-Bot</code> | Role: <strong className="text-white">Admin</strong></li>
                  <li>Click <strong className="text-white">Create</strong></li>
                </ol>
              </GuideStep>

              <GuideStep num={4} title="Assign BOTH the App and WABA to the System User" accent="red">
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 mb-2">
                  <span className="text-red-400 mt-0.5">⚠️</span>
                  <p className="text-red-300 text-xs">Most common mistake — skipping this produces a token that cannot send messages.</p>
                </div>
                <ol className="space-y-1.5 text-sm text-slate-300 list-decimal ml-4">
                  <li>Click the System User → <strong className="text-white">Assign Assets</strong></li>
                  <li><strong className="text-white">Apps tab</strong> → select client&apos;s App → turn ON <strong className="text-white">Full Control</strong></li>
                  <li><strong className="text-white">WhatsApp Accounts tab</strong> → select client&apos;s WABA → turn ON <strong className="text-white">Full Control</strong></li>
                  <li>Click <strong className="text-white">Save Changes</strong></li>
                </ol>
              </GuideStep>

              <GuideStep num={5} title="Generate the permanent token">
                <ol className="space-y-1.5 text-sm text-slate-300 list-decimal ml-4">
                  <li>On the System User&apos;s page, click <strong className="text-white">Generate New Token</strong></li>
                  <li>Select the client&apos;s App</li>
                  <li>Tick exactly these two permissions:
                    <div className="mt-1 ml-2 space-y-1">
                      <code className="block bg-slate-900 text-green-400 px-2 py-1 rounded text-xs">whatsapp_business_messaging</code>
                      <code className="block bg-slate-900 text-green-400 px-2 py-1 rounded text-xs">whatsapp_business_management</code>
                    </div>
                  </li>
                  <li>Click <strong className="text-white">Generate Token</strong></li>
                </ol>
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 mt-2">
                  <span className="text-red-400 mt-0.5">⚠️</span>
                  <p className="text-red-300 text-xs">Copy the token immediately (starts with <code>EAA...</code>) — Meta shows it <strong>only once</strong>.</p>
                </div>
              </GuideStep>

              <GuideStep num={6} title="Subscribe app to its own WABA's webhooks">
                <p className="text-slate-400 text-xs mb-2">Run this API call:</p>
                <code className="block bg-slate-900 text-green-400 px-3 py-2 rounded-xl text-xs font-mono break-all">
                  POST https://graph.facebook.com/&#123;API_VERSION&#125;/&#123;WABA_ID&#125;/subscribed_apps<br/>
                  Authorization: Bearer &#123;ACCESS_TOKEN&#125;
                </code>
              </GuideStep>

              <GuideStep num={7} title="Point the webhook to your backend">
                <ol className="space-y-1.5 text-sm text-slate-300 list-decimal ml-4">
                  <li>Client&apos;s App Dashboard: <strong className="text-white">WhatsApp → Configuration</strong></li>
                  <li>Set Callback URL: <code className="bg-slate-900 text-green-400 px-1.5 py-0.5 rounded text-xs">https://api.wautomation.shop/api/webhooks/meta</code></li>
                  <li>Set Verify Token — any string (e.g. <code className="bg-slate-900 text-green-400 px-1.5 py-0.5 rounded text-xs">my_secret_token_123</code>)</li>
                  <li>Subscribe to: <code className="bg-slate-900 text-green-400 px-1.5 py-0.5 rounded text-xs">messages</code> and <code className="bg-slate-900 text-green-400 px-1.5 py-0.5 rounded text-xs">account_update</code></li>
                </ol>
                <div className="flex items-start gap-2 bg-teal-500/10 border border-teal-500/20 rounded-xl px-3 py-2 mt-2">
                  <span className="text-teal-400 mt-0.5">ℹ️</span>
                  <p className="text-teal-300 text-xs">Webhook verification endpoint (GET + hub.challenge) must be working <strong>before</strong> setting the callback URL — otherwise Meta will refuse to save it.</p>
                </div>
              </GuideStep>

              <GuideStep num={8} title="Client adds a payment method">
                <p className="text-slate-300 text-sm">Client: <strong className="text-white">Business Settings → Billing & Payments → add a credit card</strong></p>
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 mt-2">
                  <span className="text-red-400 mt-0.5">⚠️</span>
                  <p className="text-red-300 text-xs">Meta will NOT deliver messages until a valid payment method is attached — even if token and webhook are working. Don&apos;t skip during screen-share.</p>
                </div>
              </GuideStep>

              <GuideStep num={9} title="Save everything in the database">
                <p className="text-slate-400 text-xs mb-2">Store encrypted against this client&apos;s record:</p>
                <div className="grid grid-cols-2 gap-2">
                  {["App ID", "Permanent access token (EAA...)", "WABA ID", "Phone Number ID"].map((item) => (
                    <div key={item} className="bg-slate-900 rounded-xl px-3 py-2 text-slate-300 text-xs flex items-center gap-2">
                      <FaCheck className="text-teal-400 text-xs flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </GuideStep>

              {/* 250/day limit warning */}
              <GuideCard title="⚡ 250 messages/day limit — read this!" accent="yellow">
                <p className="text-slate-300 text-sm leading-relaxed">Brand new unverified accounts are capped at <strong className="text-white">250 business-initiated conversations per 24 hours</strong>. Messages beyond this silently fail.</p>
                <p className="text-slate-400 text-sm mt-2">During screen-share, get client to go to <strong className="text-white">Business Settings → Security Center</strong> and submit GST/MSME or business registration documents. Once Meta approves (usually 1–2 days), limit jumps: <strong className="text-white">250 → 1,000 → 10,000+</strong></p>
                <p className="text-red-400 text-xs mt-2 font-bold">Flag this to every client at onboarding — otherwise they hit a silent wall and assume something is broken.</p>
              </GuideCard>

              {/* Checklist */}
              <GuideCard title="Per-client checklist" accent="teal">
                <div className="space-y-2 mt-1">
                  {[
                    "App created inside client's own Facebook account",
                    "Phone number added and OTP-verified, WABA ID + Phone Number ID noted",
                    "System User created (inside same client account)",
                    "Both the App AND WABA assigned to the System User (not just App)",
                    "Permanent token generated and copied immediately",
                    "App subscribed to its own WABA's webhooks",
                    "Backend webhook verification endpoint (GET + hub.challenge) working before setting callback",
                    "Callback URL + verify token configured, subscribed to messages & account_update",
                    "Client's payment method added (Billing & Payments)",
                    "Client told about 250/day limit and asked to start business verification (GST/MSME)",
                    "App ID, token, WABA ID, Phone Number ID saved (encrypted)",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <FaCheck className="text-teal-400 text-xs flex-shrink-0 mt-1" />
                      {item}
                    </div>
                  ))}
                </div>
              </GuideCard>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
