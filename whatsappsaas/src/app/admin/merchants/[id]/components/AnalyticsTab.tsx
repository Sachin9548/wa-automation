"use client";
import { FaSync, FaSpinner } from "react-icons/fa";

interface AnalyticsTabProps {
  analytics: any;
  analyticsLoading: boolean;
  analyticsDays: number;
  setAnalyticsDays: (v: number) => void;
  fetchAnalytics: (days: number) => void;
}

export default function AnalyticsTab({
  analytics,
  analyticsLoading,
  analyticsDays,
  setAnalyticsDays,
  fetchAnalytics,
}: AnalyticsTabProps) {
  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-white font-extrabold text-lg">Message Analytics</h2>
        <div className="flex gap-2 flex-wrap">
          {[7, 30, 90].map((d) => (
            <button key={d} onClick={() => { setAnalyticsDays(d); fetchAnalytics(d); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${analyticsDays === d ? "bg-teal-500/20 border-teal-500/30 text-teal-300" : "bg-white/5 border-white/10 text-slate-400 hover:text-white"}`}>
              {d}d
            </button>
          ))}
          <button onClick={() => fetchAnalytics(analyticsDays)} disabled={analyticsLoading}
            className="bg-teal-500/20 hover:bg-teal-500 border border-teal-500/30 text-teal-300 hover:text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition">
            {analyticsLoading ? <FaSpinner className="animate-spin" /> : <FaSync />} Refresh
          </button>
        </div>
      </div>

      {analyticsLoading ? (
        <div className="flex items-center justify-center py-20">
          <FaSpinner className="animate-spin text-4xl text-teal-400" />
        </div>
      ) : analytics ? (
        <>
          {/* Message metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Sent",          value: analytics.messages.sent,       color: "text-teal-400",   bg: "bg-teal-500/10" },
              { label: "Delivered",     value: analytics.messages.delivered,  sub: `${analytics.messages.deliveryRate}% rate`,      color: "text-blue-400",   bg: "bg-blue-500/10" },
              { label: "Read (Opened)", value: analytics.messages.read,       sub: `${analytics.messages.openRate}% open rate`,      color: "text-purple-400", bg: "bg-purple-500/10" },
              { label: "Failed",        value: analytics.messages.failed,     color: "text-red-400",    bg: "bg-red-500/10" },
            ].map((s, i) => (
              <div key={i} className={`${s.bg} border border-white/5 rounded-2xl p-5`}>
                <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
                <p className="text-slate-400 text-xs mt-1 font-bold uppercase tracking-wider">{s.label}</p>
                {(s as any).sub && <p className="text-slate-500 text-xs mt-0.5">{(s as any).sub}</p>}
              </div>
            ))}
          </div>

          {/* Click & Conversion metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Link Clicks",        value: analytics.clicks.total,      sub: `${analytics.clicks.clickRate}% click rate`,       color: "text-orange-400", bg: "bg-orange-500/10" },
              { label: "Conversions",        value: analytics.clicks.converted,  sub: `${analytics.clicks.conversionRate}% conv. rate`,   color: "text-green-400",  bg: "bg-green-500/10" },
              { label: "Revenue from Clicks",value: `₹${analytics.clicks.revenueFromClicks?.toFixed(0) || 0}`,  color: "text-yellow-400", bg: "bg-yellow-500/10" },
              { label: "Total Revenue",      value: `₹${analytics.revenue.total?.toFixed(0) || 0}`,             color: "text-teal-400",   bg: "bg-teal-500/10" },
            ].map((s, i) => (
              <div key={i} className={`${s.bg} border border-white/5 rounded-2xl p-5`}>
                <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
                <p className="text-slate-400 text-xs mt-1 font-bold uppercase tracking-wider">{s.label}</p>
                {(s as any).sub && <p className="text-slate-500 text-xs mt-0.5">{(s as any).sub}</p>}
              </div>
            ))}
          </div>

          {/* Discount code performance */}
          {analytics.revenue.byDiscountCode?.length > 0 && (
            <div className="bg-slate-800 border border-white/5 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5">
                <p className="text-white font-extrabold">Discount Code Performance</p>
              </div>
              <div className="divide-y divide-white/5">
                {analytics.revenue.byDiscountCode.map((d: any, i: number) => (
                  <div key={i} className="px-6 py-3 flex items-center justify-between">
                    <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-mono font-bold px-3 py-1 rounded-lg text-sm">
                      {d.discountCode}
                    </span>
                    <div className="flex gap-6 text-right">
                      <div><p className="text-white font-bold">{d._count.id}</p><p className="text-slate-500 text-xs">Conversions</p></div>
                      <div><p className="text-green-400 font-bold">₹{(d._sum.convertedRevenue || 0).toFixed(0)}</p><p className="text-slate-500 text-xs">Revenue</p></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Failed messages */}
          {analytics.failedMessages.total > 0 && (
            <div className="bg-slate-800 border border-red-500/10 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5">
                <p className="text-white font-extrabold">Failed Messages ({analytics.failedMessages.total})</p>
              </div>
              <div className="px-6 py-4 flex gap-3 flex-wrap border-b border-white/5">
                {Object.entries(analytics.failedMessages.reasons || {}).map(([reason, count]: any) => (
                  <span key={reason} className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold px-3 py-1.5 rounded-lg">
                    {reason}: {count}
                  </span>
                ))}
              </div>
              <div className="divide-y divide-white/5 max-h-64 overflow-y-auto">
                {analytics.failedMessages.recent?.slice(0, 20).map((m: any) => (
                  <div key={m.id} className="px-6 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-mono">{m.customerPhone}</p>
                      <p className="text-red-400 text-xs mt-0.5">{m.failReason || "Unknown error"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400 text-xs">{m.templateName}</p>
                      <p className="text-slate-500 text-xs">{new Date(m.timestamp).toLocaleDateString("en-IN")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All time stats */}
          {analytics.allTime && (
            <div className="bg-slate-800 border border-white/5 rounded-2xl p-5">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">All Time Stats</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: "Total Sent",      value: analytics.allTime.totalSent },
                  { label: "Total Read",      value: analytics.allTime.totalRead },
                  { label: "Total Clicked",   value: analytics.allTime.totalClicked },
                  { label: "Total Converted", value: analytics.allTime.totalConverted },
                  { label: "Total Revenue",   value: `₹${(analytics.allTime.recoveredRevenue || 0).toFixed(0)}` },
                ].map((s, i) => (
                  <div key={i} className="bg-slate-900 rounded-xl p-3 text-center">
                    <p className="text-white font-extrabold text-lg">{s.value}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <p className="text-slate-500">Click Refresh to load analytics</p>
        </div>
      )}
    </div>
  );
}
