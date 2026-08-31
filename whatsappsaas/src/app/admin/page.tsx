"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import {
  FaUserSecret, FaWallet, FaChartPie, FaUsers, FaSearch,
  FaSignOutAlt, FaExternalLinkAlt, FaCheckCircle, FaExclamationTriangle,
  FaRupeeSign, FaStore, FaBell, FaShieldAlt, FaChartLine,
  FaDatabase, FaServer, FaLayerGroup, FaSync, FaTimesCircle,
  FaBars, FaTimes
} from "react-icons/fa";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const NAV_ITEMS = [
  { icon: <FaChartPie />, label: "Dashboard", active: true },
  { icon: <FaUsers />, label: "Merchants", active: false },
  { icon: <FaChartLine />, label: "Analytics", active: false },
  { icon: <FaShieldAlt />, label: "Security", active: false },
];

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

        </div>
      </main>
    </div>
  );
}
