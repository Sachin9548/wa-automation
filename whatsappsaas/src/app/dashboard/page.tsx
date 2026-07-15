"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import {
  FaChartLine, FaWhatsapp, FaSignOutAlt, FaSpinner,
  FaEye, FaMousePointer, FaMoneyBillWave, FaClock,
  FaHome, FaWallet, FaCalendarAlt, FaArrowUp, FaExclamationTriangle,
  FaShoppingCart, FaBullhorn, FaBoxOpen, FaCheckCircle, FaTimesCircle,
  FaEnvelope, FaCheckDouble
} from "react-icons/fa";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtext: string;
  trend?: string;
  accentClass: string;
}

const StatCard = ({ title, value, icon, subtext, trend, accentClass }: StatCardProps) => (
  <div className="relative overflow-hidden rounded-2xl border border-white/5 p-6 shadow-xl bg-slate-800">
    <div className="flex items-start justify-between mb-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accentClass}`}>
        {icon}
      </div>
      {trend && (
        <span className="flex items-center gap-1 bg-green-500/10 text-green-400 text-[10px] font-bold px-2 py-1 rounded-full border border-green-500/20">
          <FaArrowUp className="text-[8px]" /> {trend}
        </span>
      )}
    </div>
    <p className="text-3xl font-extrabold text-white mb-1">{value}</p>
    <p className="text-slate-400 text-xs font-medium">{title}</p>
    <p className="text-slate-500 text-[11px] mt-1">{subtext}</p>
  </div>
);

// Flow type definitions for display
const FLOW_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  ABANDONED_CART_1: { label: "Cart Reminder 1", icon: <FaShoppingCart />, color: "text-orange-400" },
  ABANDONED_CART_2: { label: "Cart Reminder 2 (Discount)", icon: <FaBullhorn />, color: "text-red-400" },
  ORDER_CONFIRM:    { label: "Order Confirmation", icon: <FaBoxOpen />, color: "text-green-400" },
};

export default function MerchantDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [flows, setFlows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return router.push("/login");
        const [profile, stats] = await Promise.all([
          axios.get(`${API_URL}/merchant/me`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/merchant/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setData({ ...profile.data.merchant, ...stats.data });
        try {
          const flowRes = await axios.get(`${API_URL}/flows`, { headers: { Authorization: `Bearer ${token}` } });
          setFlows(flowRes.data.flows || []);
        } catch { /* ignore */ }
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 bg-teal-500/20 rounded-2xl flex items-center justify-center">
          <FaSpinner className="animate-spin text-2xl text-teal-400" />
        </div>
        <p className="text-slate-400 text-sm font-medium">Loading dashboard...</p>
      </div>
    </div>
  );

  const daysLeft = data?.subscriptionExpiry
    ? Math.ceil((new Date(data.subscriptionExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  const isActive = data?.status === "ACTIVE";
  const activeFlowCount = flows.filter(f => f.isActive).length;

  return (
    <div className="min-h-screen bg-slate-950 flex">

      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-white/5 flex flex-col py-8 px-5 shrink-0">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
            <FaWhatsapp className="text-white text-lg" />
          </div>
          <div>
            <p className="text-white font-extrabold text-sm leading-tight">WA-Auto</p>
            <p className="text-teal-400 text-xs font-medium">Business Panel</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold bg-teal-500/20 text-teal-400 border border-teal-500/30">
            <FaHome /> Overview
          </Link>
        </nav>

        <div className="space-y-3">
          <div className="bg-teal-500/10 border border-teal-500/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <FaWallet className="text-teal-400 text-xs" />
              <p className="text-teal-300 text-xs font-bold uppercase tracking-wider">Wallet</p>
            </div>
            <p className="text-2xl font-extrabold text-white">₹{data?.walletBalance?.toFixed(2)}</p>
            <p className="text-slate-500 text-[10px] mt-1">₹0.80 per message</p>
          </div>

          <div className={`rounded-2xl p-3 border text-xs font-bold flex items-center gap-2 ${
            daysLeft < 5 ? "bg-red-500/10 border-red-500/20 text-red-400"
            : daysLeft < 10 ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
            : "bg-slate-800 border-white/5 text-slate-400"
          }`}>
            <FaCalendarAlt />
            {daysLeft > 0 ? `${daysLeft} days left` : "Subscription expired"}
          </div>

          <button
            onClick={() => { localStorage.clear(); router.push("/login"); }}
            className="w-full flex items-center gap-2 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition text-sm font-bold"
          >
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="h-16 bg-slate-900/80 backdrop-blur border-b border-white/5 flex items-center justify-between px-8 shrink-0">
          <div>
            <h1 className="text-lg font-extrabold text-white">Welcome back, {data?.brandName} 👋</h1>
            <p className="text-slate-500 text-xs">Here&apos;s your WhatsApp marketing performance.</p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold ${
            isActive ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"
          }`}>
            <span className={`w-2 h-2 rounded-full ${isActive ? "bg-green-400 animate-pulse" : "bg-amber-400"}`} />
            {isActive ? "Store Active" : "Pending Setup"}
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          <div className={isActive ? "" : "blur-sm pointer-events-none select-none"}>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
              <StatCard title="Recovered Revenue" value={`₹${(data?.recoveredRevenue || 0).toFixed(2)}`}
                icon={<FaMoneyBillWave className="text-sm" />}
                subtext="Revenue from WhatsApp" accentClass="bg-green-500/20 text-green-400" />
              <StatCard title="Messages Sent" value={data?.totalSent || 0}
                icon={<FaEnvelope className="text-sm" />}
                subtext="Via Meta Cloud API" accentClass="bg-teal-500/20 text-teal-400" />
              <StatCard title="Open Rate" value={`${data?.openRate || 0}%`}
                icon={<FaEye className="text-sm" />}
                subtext={`${data?.totalRead || 0} messages read`} accentClass="bg-indigo-500/20 text-indigo-400" />
              <StatCard title="Link Clicks" value={data?.totalClicked || 0}
                icon={<FaMousePointer className="text-sm" />}
                subtext={`${data?.clickRate || 0}% click rate`} accentClass="bg-orange-500/20 text-orange-400" />
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Conversion funnel */}
              <div className="lg:col-span-2 bg-slate-800 border border-white/5 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-white font-bold">Conversion Funnel</h3>
                    <p className="text-slate-400 text-xs mt-0.5">From message sent to purchase</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { label: "Messages Sent", value: data?.totalSent || 0, max: data?.totalSent || 1, color: "bg-teal-500" },
                    { label: "Read by Customer", value: data?.totalRead || 0, max: data?.totalSent || 1, color: "bg-indigo-500" },
                    { label: "Clicked Link", value: data?.totalClicked || 0, max: data?.totalSent || 1, color: "bg-orange-500" },
                    { label: "Purchased", value: data?.totalConverted || 0, max: data?.totalSent || 1, color: "bg-green-500" },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-slate-400 text-xs">{item.label}</span>
                        <span className="text-white font-bold text-sm">{item.value}</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all duration-700`}
                          style={{ width: `${Math.min((item.value / item.max) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-slate-400 text-xs">Recovered Revenue</span>
                  <span className="text-green-400 font-extrabold text-lg">₹{(data?.recoveredRevenue || 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Automation Status */}
              <div className="bg-slate-800 border border-white/5 rounded-2xl p-6 shadow-xl">
                <h3 className="text-white font-bold mb-1">Automation Status</h3>
                <p className="text-slate-400 text-xs mb-1">Managed by your account team</p>
                <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-full mb-5 ${
                  activeFlowCount > 0 ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-slate-700 text-slate-400 border border-white/5"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${activeFlowCount > 0 ? "bg-green-400 animate-pulse" : "bg-slate-500"}`} />
                  {activeFlowCount} / {Object.keys(FLOW_META).length} active
                </div>

                <div className="space-y-3">
                  {Object.entries(FLOW_META).map(([type, meta]) => {
                    const flow = flows.find(f => f.type === type);
                    const on = flow?.isActive ?? false;
                    return (
                      <div key={type} className={`flex items-center justify-between p-3 rounded-xl border ${
                        on ? "bg-green-500/5 border-green-500/20" : "bg-slate-900/50 border-white/5"
                      }`}>
                        <div className="flex items-center gap-2">
                          <span className={`${meta.color} text-sm`}>{meta.icon}</span>
                          <span className="text-slate-300 text-xs font-medium">{meta.label}</span>
                        </div>
                        {on ? (
                          <FaCheckCircle className="text-green-400 text-xs" />
                        ) : (
                          <FaTimesCircle className="text-slate-600 text-xs" />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 pt-4 border-t border-white/5">
                  <p className="text-slate-500 text-[11px] text-center">
                    Contact your account manager to update automation flows
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pending Overlay */}
          {!isActive && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="bg-slate-900/95 backdrop-blur-md border border-white/10 p-10 rounded-3xl shadow-2xl text-center max-w-md mx-4">
                <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <FaClock className="text-4xl text-amber-400 animate-pulse" />
                </div>
                <h2 className="text-2xl font-extrabold text-white mb-3">Setting Up Your Store</h2>
                <p className="text-slate-400 mb-6">
                  Our team is connecting your Shopify store and configuring your WhatsApp automations. You&apos;ll be live within 2 hours!
                </p>
                <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm font-bold px-4 py-3 rounded-xl justify-center">
                  <FaExclamationTriangle className="text-xs" />
                  Awaiting admin activation
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
