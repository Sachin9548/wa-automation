"use client";
import { FaSync, FaSpinner } from "react-icons/fa";

interface ActivityLogTabProps {
  merchantId: string;
  activityLogs: any[];
  activityLoading: boolean;
  activityTotal: number;
  activityPage: number;
  activityFilter: string;
  setActivityFilter: (v: string) => void;
  loadActivityLog: (page: number, filter: string) => void;
}

export default function ActivityLogTab({
  activityLogs,
  activityLoading,
  activityTotal,
  activityPage,
  activityFilter,
  setActivityFilter,
  loadActivityLog,
}: ActivityLogTabProps) {
  const actionMeta: Record<string, { icon: string; color: string; bg: string }> = {
    MERCHANT_ACTIVATED:    { icon: "🚀", color: "text-green-400",   bg: "bg-green-500/10" },
    SUBSCRIPTION_EXTENDED: { icon: "📅", color: "text-blue-400",    bg: "bg-blue-500/10" },
    PAYMENT_ADDED:         { icon: "💰", color: "text-emerald-400", bg: "bg-emerald-500/10" },
    PAYMENT_RECORDED:      { icon: "💰", color: "text-emerald-400", bg: "bg-emerald-500/10" },
    CAMPAIGN_LAUNCHED:     { icon: "📢", color: "text-indigo-400",  bg: "bg-indigo-500/10" },
    CAMPAIGN_SCHEDULED:    { icon: "⏰", color: "text-teal-400",    bg: "bg-teal-500/10" },
    CAMPAIGN_CANCELLED:    { icon: "⛔", color: "text-red-400",     bg: "bg-red-500/10" },
    FLOW_SAVED:            { icon: "⚙️", color: "text-purple-400",  bg: "bg-purple-500/10" },
    FLOW_TOGGLED:          { icon: "🔄", color: "text-purple-400",  bg: "bg-purple-500/10" },
    SERVICE_TOGGLED:       { icon: "🔌", color: "text-orange-400",  bg: "bg-orange-500/10" },
    MERCHANT_FREE_SET:     { icon: "🎁", color: "text-pink-400",    bg: "bg-pink-500/10" },
    CUSTOMER_SYNCED:       { icon: "👥", color: "text-cyan-400",    bg: "bg-cyan-500/10" },
    FULL_SYNC:             { icon: "🔁", color: "text-cyan-400",    bg: "bg-cyan-500/10" },
    CREDENTIALS_UPDATED:   { icon: "🔑", color: "text-yellow-400",  bg: "bg-yellow-500/10" },
    TEMPLATE_CREATED:      { icon: "📝", color: "text-slate-300",   bg: "bg-slate-700" },
    TEMPLATE_DELETED:      { icon: "🗑️", color: "text-red-400",     bg: "bg-red-500/10" },
    WEBHOOKS_REGISTERED:   { icon: "🔗", color: "text-blue-400",    bg: "bg-blue-500/10" },
  };

  return (
    <div className="space-y-5">
      {/* Header + filter row */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h3 className="text-white font-extrabold text-sm">🕐 Activity Log</h3>
          <p className="text-slate-500 text-xs mt-0.5">{activityTotal} total events</p>
        </div>
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <select
            value={activityFilter}
            onChange={(e) => { setActivityFilter(e.target.value); loadActivityLog(1, e.target.value); }}
            className="bg-slate-800 border border-white/10 text-slate-300 text-xs font-bold px-3 py-2 rounded-xl outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="">All Actions</option>
            <option value="MERCHANT_ACTIVATED">Merchant Activated</option>
            <option value="SUBSCRIPTION_EXTENDED">Subscription Extended</option>
            <option value="PAYMENT_ADDED">Payment Added</option>
            <option value="CAMPAIGN_LAUNCHED">Campaign Launched</option>
            <option value="CAMPAIGN_SCHEDULED">Campaign Scheduled</option>
            <option value="CAMPAIGN_CANCELLED">Campaign Cancelled</option>
            <option value="FLOW_SAVED">Flow Saved</option>
            <option value="FLOW_TOGGLED">Flow Toggled</option>
            <option value="SERVICE_TOGGLED">Service Toggled</option>
            <option value="CUSTOMER_SYNCED">Customer Synced</option>
            <option value="FULL_SYNC">Full Sync</option>
            <option value="CREDENTIALS_UPDATED">Credentials Updated</option>
            <option value="TEMPLATE_CREATED">Template Created</option>
            <option value="TEMPLATE_DELETED">Template Deleted</option>
          </select>
          <button
            onClick={() => loadActivityLog(activityPage, activityFilter)}
            disabled={activityLoading}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white text-xs font-bold rounded-xl transition disabled:opacity-40"
          >
            <FaSync className={activityLoading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Log list */}
      <div className="bg-slate-800 border border-white/5 rounded-2xl overflow-hidden">
        {activityLoading ? (
          <div className="flex items-center justify-center py-16 gap-3">
            <FaSpinner className="animate-spin text-teal-400 text-xl" />
            <span className="text-slate-400 text-sm">Loading activity...</span>
          </div>
        ) : activityLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-8">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-slate-400 text-sm font-bold">No activity yet</p>
            <p className="text-slate-600 text-xs mt-1">
              Actions like activating merchants, launching campaigns, saving flows will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {activityLogs.map((log: any) => {
              const meta = actionMeta[log.action] || { icon: "📋", color: "text-slate-400", bg: "bg-slate-700" };
              const timeStr = new Date(log.createdAt).toLocaleString("en-IN", {
                day: "2-digit", month: "short", year: "numeric",
                hour: "2-digit", minute: "2-digit", hour12: true,
              });
              return (
                <div key={log.id} className="px-5 py-4 flex items-start gap-4 hover:bg-white/2 transition">
                  <div className={`w-9 h-9 ${meta.bg} rounded-xl flex items-center justify-center flex-shrink-0 text-base`}>
                    {meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>
                        {log.action.replace(/_/g, " ")}
                      </span>
                      <span className="text-slate-600 text-[10px]">by {log.actor}</span>
                    </div>
                    <p className="text-slate-200 text-sm mt-1 leading-relaxed">{log.description}</p>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <details className="mt-1">
                        <summary className="text-slate-600 text-[10px] cursor-pointer hover:text-slate-400 select-none">
                          Show details
                        </summary>
                        <div className="mt-1 bg-slate-900 rounded-lg p-2 text-[10px] text-slate-400 font-mono">
                          {Object.entries(log.metadata).map(([k, v]) => (
                            <div key={k} className="flex gap-2">
                              <span className="text-slate-500">{k}:</span>
                              <span className="text-slate-300">{JSON.stringify(v)}</span>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-slate-500 text-[10px] whitespace-nowrap">{timeStr}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {activityTotal > 30 && (
        <div className="flex items-center justify-between">
          <p className="text-slate-500 text-xs">
            Showing {(activityPage - 1) * 30 + 1}–{Math.min(activityPage * 30, activityTotal)} of {activityTotal}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => loadActivityLog(activityPage - 1, activityFilter)}
              disabled={activityPage <= 1 || activityLoading}
              className="px-3 py-1.5 bg-slate-800 border border-white/10 text-slate-400 hover:text-white text-xs font-bold rounded-xl disabled:opacity-40 transition"
            >← Prev</button>
            <span className="px-3 py-1.5 text-slate-400 text-xs font-bold">
              Page {activityPage} / {Math.ceil(activityTotal / 30)}
            </span>
            <button
              onClick={() => loadActivityLog(activityPage + 1, activityFilter)}
              disabled={activityPage >= Math.ceil(activityTotal / 30) || activityLoading}
              className="px-3 py-1.5 bg-slate-800 border border-white/10 text-slate-400 hover:text-white text-xs font-bold rounded-xl disabled:opacity-40 transition"
            >Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}
