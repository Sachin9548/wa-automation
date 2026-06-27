"use client";
import { API_URL } from "@/lib/api";

import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import {
  FaUserSecret, FaWallet, FaChartPie, FaUsers, FaSearch,
  FaSignOutAlt, FaExternalLinkAlt, FaCheckCircle, FaExclamationTriangle,
  FaRupeeSign, FaStore, FaBell, FaShieldAlt, FaChartLine
} from "react-icons/fa";



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

  const fetchAll = async (key: string) => {
    try {
      const headers = { "x-admin-api-key": key };
      const [mRes, sRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/merchants`, { headers }),
        axios.get(`${API_BASE_URL}/stats`, { headers }),
      ]);
      setMerchants(mRes.data.merchants);
      setStats(sRes.data);
      setIsAuth(true);
      sessionStorage.setItem("adminKey", key);
    } catch {
      alert("Access Denied: Invalid Key");
    }
  };

  useEffect(() => {
    const saved = sessionStorage.getItem("adminKey");
    if (saved) fetchAll(saved);
  }, []);

  // ── Login Screen ────────────────────────────────────────────────
  if (!isAuth) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-teal-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="relative z-10 bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-2xl w-full max-w-sm">
        {/* Icon */}
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

  const activeCount = merchants.filter((m) => m.status === "ACTIVE").length;
  const pendingCount = merchants.filter((m) => m.status !== "ACTIVE").length;

  // ── Main Dashboard ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 flex">

      {/* ── Sidebar ── */}
      <aside className="w-72 bg-slate-900 border-r border-white/5 flex flex-col py-8 px-5 shrink-0">
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
              onClick={() => setActiveNav(item.label)}
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
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Top Header */}
        <header className="h-16 bg-slate-900/80 backdrop-blur border-b border-white/5 flex items-center justify-between px-8 shrink-0">
          <div>
            <h1 className="text-xl font-extrabold text-white">Master Control</h1>
            <p className="text-slate-400 text-xs">Monitoring {merchants.length} businesses in real-time</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input
                type="text"
                placeholder="Search merchant..."
                className="pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl text-sm w-56 outline-none focus:ring-2 focus:ring-teal-500 transition"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="relative w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-400 transition">
              <FaBell className="text-sm" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">

          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Revenue */}
            <div className="bg-gradient-to-br from-teal-600 to-teal-800 rounded-2xl p-6 shadow-xl shadow-teal-900/40 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full" />
              <div className="absolute -right-2 bottom-2 w-16 h-16 bg-white/5 rounded-full" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-teal-100 text-xs font-bold uppercase tracking-wider">Total Revenue</p>
                  <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                    <FaRupeeSign className="text-white text-sm" />
                  </div>
                </div>
                <p className="text-4xl font-extrabold text-white mb-2">
                  ₹{stats?.totalEarnings?.toLocaleString() ?? "—"}
                </p>
                <div className="flex items-center gap-2">
                  <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">+12%</span>
                  <span className="text-teal-200 text-xs">from last month</span>
                </div>
              </div>
            </div>

            {/* Active Subscriptions */}
            <div className="bg-slate-800 border border-white/5 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Active Subs</p>
                <div className="w-9 h-9 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <FaCheckCircle className="text-green-400 text-sm" />
                </div>
              </div>
              <p className="text-4xl font-extrabold text-white mb-2">{stats?.totalActiveClients ?? "—"}</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-700 rounded-full h-1.5">
                  <div
                    className="bg-green-400 h-1.5 rounded-full"
                    style={{ width: `${merchants.length > 0 ? (activeCount / merchants.length) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-slate-400 text-xs">
                  {merchants.length > 0 ? Math.round((activeCount / merchants.length) * 100) : 0}% retention
                </span>
              </div>
            </div>

            {/* Total Registered */}
            <div className="bg-slate-800 border border-white/5 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Registered</p>
                <div className="w-9 h-9 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                  <FaStore className="text-indigo-400 text-sm" />
                </div>
              </div>
              <p className="text-4xl font-extrabold text-white mb-2">{merchants.length}</p>
              <p className="text-slate-400 text-xs">
                <span className="text-amber-400 font-bold">{pendingCount} pending</span> activation
              </p>
            </div>
          </div>

          {/* ── Merchants Table ── */}
          <div className="bg-slate-800 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h2 className="text-white font-bold text-base">All Merchants</h2>
              <span className="bg-teal-500/20 text-teal-300 text-xs font-bold px-3 py-1 rounded-full border border-teal-500/20">
                {filtered.length} records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Merchant</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Wallet / Plan</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Expiry</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map((m) => (
                    <tr key={m.id} className="hover:bg-white/3 transition group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500/30 to-indigo-500/30 flex items-center justify-center border border-white/10 shrink-0">
                            <FaStore className="text-teal-300 text-xs" />
                          </div>
                          <div>
                            <p className="text-white font-bold text-sm">{m.brandName}</p>
                            <p className="text-slate-500 text-xs truncate max-w-[180px]">{m.storeUrl || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-teal-400 font-extrabold">₹{m.walletBalance?.toFixed(2)}</p>
                        <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">{m.plan} plan</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-300 text-sm font-semibold">
                          {m.subscriptionExpiry ? new Date(m.subscriptionExpiry).toLocaleDateString("en-IN") : "N/A"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {m.status === "ACTIVE" ? (
                          <span className="inline-flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                            <FaExclamationTriangle className="text-[8px]" />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link
                          href={`/admin/merchants/${m.id}`}
                          className="inline-flex items-center gap-2 bg-teal-500/10 hover:bg-teal-500 border border-teal-500/30 hover:border-teal-500 text-teal-300 hover:text-white text-[11px] font-extrabold px-4 py-2 rounded-xl transition duration-200 uppercase tracking-wider"
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
