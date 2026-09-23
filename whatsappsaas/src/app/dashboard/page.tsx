"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import {
  FaChartLine,
  FaWhatsapp,
  FaSignOutAlt,
  FaSpinner,
  FaEye,
  FaMousePointer,
  FaMoneyBillWave,
  FaClock,
  FaHome,
  FaWallet,
  FaCalendarAlt,
  FaArrowUp,
  FaExclamationTriangle,
  FaShoppingCart,
  FaBullhorn,
  FaBoxOpen,
  FaCheckCircle,
  FaTimesCircle,
  FaEnvelope,
  FaCheckDouble,
} from "react-icons/fa";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtext: string;
  trend?: string;
  accentClass: string;
}

const StatCard = ({
  title,
  value,
  icon,
  subtext,
  trend,
  accentClass,
}: StatCardProps) => (
  <div className="relative overflow-hidden rounded-2xl border border-white/5 p-6 shadow-xl bg-slate-800">
    <div className="flex items-start justify-between mb-4">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${accentClass}`}
      >
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
const FLOW_META: Record<
  string,
  { label: string; icon: React.ReactNode; color: string }
> = {
  ABANDONED_CART_1: {
    label: "Cart Reminder 1",
    icon: <FaShoppingCart />,
    color: "text-orange-400",
  },
  ABANDONED_CART_2: {
    label: "Cart Reminder 2 (Discount)",
    icon: <FaBullhorn />,
    color: "text-red-400",
  },
  ORDER_CONFIRM: {
    label: "Order Confirmation",
    icon: <FaBoxOpen />,
    color: "text-green-400",
  },
  POST_PURCHASE_UPSELL: {
    label: "Post-Purchase Upsell",
    icon: <FaArrowUp />,
    color: "text-purple-400",
  },
  COD_CONVERT: {
    label: "COD → Prepaid Converter",
    icon: <FaWallet />,
    color: "text-yellow-400",
  },
  STORE_ANNIVERSARY: {
    label: "Store Anniversary",
    icon: <FaCalendarAlt />,
    color: "text-pink-400",
  },
};

export default function MerchantDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [flows, setFlows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsDays, setAnalyticsDays] = useState(30);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return router.push("/login");
        const [profile, stats] = await Promise.all([
          axios.get(`${API_URL}/merchant/me`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_URL}/merchant/stats`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const mergedData = { ...profile.data.merchant, ...stats.data };
        setData(mergedData);
        if (mergedData.status === "ACTIVE") fetchAnalytics(30);

        try {
          const flowRes = await axios.get(`${API_URL}/flows`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setFlows(flowRes.data.flows || []);
        } catch {
          /* ignore */
        }
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const fetchAnalytics = async (days: number) => {
    setAnalyticsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const r = await axios.get(`${API_URL}/merchant/analytics?days=${days}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnalytics(r.data);
    } catch {
    } finally {
      setAnalyticsLoading(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-teal-500/20 rounded-2xl flex items-center justify-center">
            <FaSpinner className="animate-spin text-2xl text-teal-400" />
          </div>
          <p className="text-slate-400 text-sm font-medium">
            Loading dashboard...
          </p>
        </div>
      </div>
    );

  const daysLeft = data?.subscriptionExpiry
    ? Math.ceil(
        (new Date(data.subscriptionExpiry).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      )
    : 0;

  const isActive = data?.status === "ACTIVE";
  const activeFlowCount = flows.filter((f) => f.isActive).length;

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-white/5 flex flex-col py-8 px-5 shrink-0">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
            <FaWhatsapp className="text-white text-lg" />
          </div>
          <div>
            <p className="text-white font-extrabold text-sm leading-tight">
              WA-Auto
            </p>
            <p className="text-teal-400 text-xs font-medium">Business Panel</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold bg-teal-500/20 text-teal-400 border border-teal-500/30"
          >
            <FaHome /> Overview
          </Link>
          <Link
            href="/dashboard/inbox"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-400 hover:bg-white/5 hover:text-white transition"
          >
            <FaWhatsapp /> Inbox
          </Link>
        </nav>

        <div className="space-y-3">
          <div className="bg-teal-500/10 border border-teal-500/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <FaWallet className="text-teal-400 text-xs" />
              <p className="text-teal-300 text-xs font-bold uppercase tracking-wider">
                Wallet
              </p>
            </div>
            <p className="text-2xl font-extrabold text-white">
              ₹{data?.walletBalance?.toFixed(2)}
            </p>
            <p className="text-slate-500 text-[10px] mt-1">₹0.80 per message</p>
          </div>

          <div
            className={`rounded-2xl p-3 border text-xs font-bold flex items-center gap-2 ${
              daysLeft < 5
                ? "bg-red-500/10 border-red-500/20 text-red-400"
                : daysLeft < 10
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                  : "bg-slate-800 border-white/5 text-slate-400"
            }`}
          >
            <FaCalendarAlt />
            {daysLeft > 0 ? `${daysLeft} days left` : "Subscription expired"}
          </div>

          <button
            onClick={() => {
              localStorage.clear();
              router.push("/login");
            }}
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
            <h1 className="text-lg font-extrabold text-white">
              Welcome back, {data?.brandName} 👋
            </h1>
            <p className="text-slate-500 text-xs">
              Here&apos;s your WhatsApp marketing performance.
            </p>
          </div>
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold ${
              isActive
                ? "bg-green-500/10 border-green-500/20 text-green-400"
                : "bg-amber-500/10 border-amber-500/20 text-amber-400"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${isActive ? "bg-green-400 animate-pulse" : "bg-amber-400"}`}
            />
            {isActive ? "Store Active" : "Pending Setup"}
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          <div
            className={
              isActive ? "" : "blur-sm pointer-events-none select-none"
            }
          >
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
              <StatCard
                title="Recovered Revenue"
                value={`₹${(data?.recoveredRevenue || 0).toFixed(2)}`}
                icon={<FaMoneyBillWave className="text-sm" />}
                subtext="Revenue from WhatsApp"
                accentClass="bg-green-500/20 text-green-400"
              />
              <StatCard
                title="Messages Sent"
                value={data?.totalSent || 0}
                icon={<FaEnvelope className="text-sm" />}
                subtext="Via Meta Cloud API"
                accentClass="bg-teal-500/20 text-teal-400"
              />
              <StatCard
                title="Open Rate"
                value={`${data?.openRate || 0}%`}
                icon={<FaEye className="text-sm" />}
                subtext={`${data?.totalRead || 0} messages read`}
                accentClass="bg-indigo-500/20 text-indigo-400"
              />
              <StatCard
                title="Link Clicks"
                value={data?.totalClicked || 0}
                icon={<FaMousePointer className="text-sm" />}
                subtext={`${data?.clickRate || 0}% click rate`}
                accentClass="bg-orange-500/20 text-orange-400"
              />
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Conversion funnel */}
              <div className="lg:col-span-2 bg-slate-800 border border-white/5 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-white font-bold">Conversion Funnel</h3>
                    <p className="text-slate-400 text-xs mt-0.5">
                      From message sent to purchase
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    {
                      label: "Messages Sent",
                      value: data?.totalSent || 0,
                      max: data?.totalSent || 1,
                      color: "bg-teal-500",
                    },
                    {
                      label: "Read by Customer",
                      value: data?.totalRead || 0,
                      max: data?.totalSent || 1,
                      color: "bg-indigo-500",
                    },
                    {
                      label: "Clicked Link",
                      value: data?.totalClicked || 0,
                      max: data?.totalSent || 1,
                      color: "bg-orange-500",
                    },
                    {
                      label: "Purchased",
                      value: data?.totalConverted || 0,
                      max: data?.totalSent || 1,
                      color: "bg-green-500",
                    },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-slate-400 text-xs">
                          {item.label}
                        </span>
                        <span className="text-white font-bold text-sm">
                          {item.value}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all duration-700`}
                          style={{
                            width: `${Math.min((item.value / item.max) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-slate-400 text-xs">
                    Recovered Revenue
                  </span>
                  <span className="text-green-400 font-extrabold text-lg">
                    ₹{(data?.recoveredRevenue || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Automation Status */}
              <div className="bg-slate-800 border border-white/5 rounded-2xl p-6 shadow-xl">
                <h3 className="text-white font-bold mb-1">Automation Status</h3>
                <p className="text-slate-400 text-xs mb-1">
                  Managed by your account team
                </p>
                <div
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-full mb-5 ${
                    activeFlowCount > 0
                      ? "bg-green-500/10 text-green-400 border border-green-500/20"
                      : "bg-slate-700 text-slate-400 border border-white/5"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${activeFlowCount > 0 ? "bg-green-400 animate-pulse" : "bg-slate-500"}`}
                  />
                  {activeFlowCount} / {Object.keys(FLOW_META).length} active
                </div>

                <div className="space-y-3">
                  {Object.entries(FLOW_META).map(([type, meta]) => {
                    const flow = flows.find((f) => f.type === type);
                    const on = flow?.isActive ?? false;
                    return (
                      <div
                        key={type}
                        className={`flex items-center justify-between p-3 rounded-xl border ${
                          on
                            ? "bg-green-500/5 border-green-500/20"
                            : "bg-slate-900/50 border-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`${meta.color} text-sm`}>
                            {meta.icon}
                          </span>
                          <span className="text-slate-300 text-xs font-medium">
                            {meta.label}
                          </span>
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

            {/* ── Analytics Section ─────────────────────────────────── */}
            {isActive && (
              <div className="mt-8 space-y-6">
                {/* Header + Period Selector */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <h2 className="text-white font-extrabold text-lg flex items-center gap-2">
                    <FaChartLine className="text-teal-400" /> Message Analytics
                  </h2>
                  <div className="flex gap-2">
                    {[7, 30, 90].map((d) => (
                      <button
                        key={d}
                        onClick={() => {
                          setAnalyticsDays(d);
                          fetchAnalytics(d);
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
                          analyticsDays === d
                            ? "bg-teal-500/20 border-teal-500/30 text-teal-300"
                            : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                        }`}
                      >
                        {d}d
                      </button>
                    ))}
                    <button
                      onClick={() => fetchAnalytics(analyticsDays)}
                      disabled={analyticsLoading}
                      className="bg-teal-500/20 hover:bg-teal-500 border border-teal-500/30 text-teal-300 hover:text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition"
                    >
                      {analyticsLoading ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        <FaChartLine />
                      )}{" "}
                      Refresh
                    </button>
                  </div>
                </div>

                {analyticsLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <FaSpinner className="animate-spin text-3xl text-teal-400" />
                  </div>
                ) : analytics ? (
                  <>
                    {/* Message metrics — 4 cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        {
                          label: "Sent",
                          value: analytics.messages.sent,
                          sub: `Last ${analyticsDays} days`,
                          color: "text-teal-400",
                          bg: "bg-teal-500/10",
                        },
                        {
                          label: "Delivered",
                          value: analytics.messages.delivered,
                          sub: `${analytics.messages.deliveryRate}% delivery rate`,
                          color: "text-blue-400",
                          bg: "bg-blue-500/10",
                        },
                        {
                          label: "Read (Opened)",
                          value: analytics.messages.read,
                          sub: `${analytics.messages.openRate}% open rate`,
                          color: "text-purple-400",
                          bg: "bg-purple-500/10",
                        },
                        {
                          label: "Failed",
                          value: analytics.messages.failed,
                          sub:
                            analytics.messages.failed > 0
                              ? "Check details below"
                              : "All good ✅",
                          color: "text-red-400",
                          bg: "bg-red-500/10",
                        },
                      ].map((s, i) => (
                        <div
                          key={i}
                          className={`${s.bg} border border-white/5 rounded-2xl p-5`}
                        >
                          <p className={`text-3xl font-extrabold ${s.color}`}>
                            {s.value}
                          </p>
                          <p className="text-slate-400 text-xs mt-1 font-bold uppercase tracking-wider">
                            {s.label}
                          </p>
                          <p className="text-slate-500 text-xs mt-0.5">
                            {s.sub}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Click & Revenue metrics — 4 cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        {
                          label: "Link Clicks",
                          value: analytics.clicks.total,
                          sub: `${analytics.clicks.clickRate}% click rate`,
                          color: "text-orange-400",
                          bg: "bg-orange-500/10",
                        },
                        {
                          label: "Conversions",
                          value: analytics.clicks.converted,
                          sub: `${analytics.clicks.conversionRate}% conv. rate`,
                          color: "text-green-400",
                          bg: "bg-green-500/10",
                        },
                        {
                          label: "Revenue from Clicks",
                          value: `₹${(analytics.clicks.revenueFromClicks || 0).toFixed(0)}`,
                          sub: "Attributed to link clicks",
                          color: "text-yellow-400",
                          bg: "bg-yellow-500/10",
                        },
                        {
                          label: "Total Revenue",
                          value: `₹${(analytics.revenue.total || 0).toFixed(0)}`,
                          sub: "From WhatsApp conversions",
                          color: "text-teal-400",
                          bg: "bg-teal-500/10",
                        },
                      ].map((s, i) => (
                        <div
                          key={i}
                          className={`${s.bg} border border-white/5 rounded-2xl p-5`}
                        >
                          <p className={`text-3xl font-extrabold ${s.color}`}>
                            {s.value}
                          </p>
                          <p className="text-slate-400 text-xs mt-1 font-bold uppercase tracking-wider">
                            {s.label}
                          </p>
                          <p className="text-slate-500 text-xs mt-0.5">
                            {s.sub}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Discount Code Performance — only if data exists */}
                    {analytics.revenue.byDiscountCode?.length > 0 && (
                      <div className="bg-slate-800 border border-white/5 rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/5">
                          <p className="text-white font-extrabold">
                            🏷️ Discount Code Performance
                          </p>
                        </div>
                        <div className="divide-y divide-white/5">
                          {analytics.revenue.byDiscountCode.map(
                            (d: any, i: number) => (
                              <div
                                key={i}
                                className="px-6 py-3 flex items-center justify-between"
                              >
                                <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-mono font-bold px-3 py-1 rounded-lg text-sm">
                                  {d.discountCode}
                                </span>
                                <div className="flex gap-6 text-right">
                                  <div>
                                    <p className="text-white font-bold">
                                      {d._count.id}
                                    </p>
                                    <p className="text-slate-500 text-xs">
                                      Conversions
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-green-400 font-bold">
                                      ₹
                                      {(d._sum.convertedRevenue || 0).toFixed(
                                        0,
                                      )}
                                    </p>
                                    <p className="text-slate-500 text-xs">
                                      Revenue
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                    {/* Failed Messages — only if failures exist */}
                    {analytics.failedMessages.total > 0 && (
                      <div className="bg-slate-800 border border-red-500/10 rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/5">
                          <p className="text-white font-extrabold">
                            ❌ Failed Messages ({analytics.failedMessages.total}
                            )
                          </p>
                        </div>
                        <div className="px-6 py-3 flex gap-2 flex-wrap border-b border-white/5">
                          {Object.entries(
                            analytics.failedMessages.reasons || {},
                          ).map(([reason, count]: any) => (
                            <span
                              key={reason}
                              className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold px-3 py-1.5 rounded-lg"
                            >
                              {reason}: {count}
                            </span>
                          ))}
                        </div>
                        <div className="divide-y divide-white/5 max-h-48 overflow-y-auto">
                          {analytics.failedMessages.recent
                            ?.slice(0, 10)
                            .map((m: any) => (
                              <div
                                key={m.id}
                                className="px-6 py-3 flex items-center justify-between"
                              >
                                <div>
                                  <p className="text-white text-xs font-mono">
                                    {m.customerPhone}
                                  </p>
                                  <p className="text-red-400 text-xs mt-0.5">
                                    {m.failReason || "Unknown error"}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-slate-400 text-xs">
                                    {m.templateName}
                                  </p>
                                  <p className="text-slate-500 text-xs">
                                    {new Date(m.timestamp).toLocaleDateString(
                                      "en-IN",
                                    )}
                                  </p>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* All Time Stats */}
                    {analytics.allTime && (
                      <div className="bg-slate-800 border border-white/5 rounded-2xl p-5">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">
                          All Time Stats
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          {[
                            {
                              label: "Total Sent",
                              value: analytics.allTime.totalSent,
                            },
                            {
                              label: "Total Read",
                              value: analytics.allTime.totalRead,
                            },
                            {
                              label: "Total Clicked",
                              value: analytics.allTime.totalClicked,
                            },
                            {
                              label: "Total Converted",
                              value: analytics.allTime.totalConverted,
                            },
                            {
                              label: "Total Revenue",
                              value: `₹${(analytics.allTime.recoveredRevenue || 0).toFixed(0)}`,
                            },
                          ].map((s, i) => (
                            <div
                              key={i}
                              className="bg-slate-900 rounded-xl p-3 text-center"
                            >
                              <p className="text-white font-extrabold text-lg">
                                {s.value}
                              </p>
                              <p className="text-slate-500 text-xs mt-0.5">
                                {s.label}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-slate-500 text-sm">
                      Click Refresh to load analytics
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pending Overlay */}
          {!isActive && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="bg-slate-900/95 backdrop-blur-md border border-white/10 p-10 rounded-3xl shadow-2xl text-center max-w-md mx-4">
                <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <FaClock className="text-4xl text-amber-400 animate-pulse" />
                </div>
                <h2 className="text-2xl font-extrabold text-white mb-3">
                  Setting Up Your Store
                </h2>
                <p className="text-slate-400 mb-6">
                  Our team is connecting your Shopify store and configuring your
                  WhatsApp automations. You&apos;ll be live within 2 hours!
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
