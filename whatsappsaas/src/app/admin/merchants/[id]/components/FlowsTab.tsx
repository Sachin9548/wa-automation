"use client";
import axios from "axios";
import { FaRobot, FaSpinner, FaCheckCircle, FaTag, FaGift } from "react-icons/fa";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const ah = () => ({ "x-admin-api-key": typeof window !== "undefined" ? sessionStorage.getItem("adminKey") || "" : "" });

const FLOW_TYPES = [
  { type: "ABANDONED_CART_1", label: "Abandoned Cart — Reminder 1", icon: "🛒", color: "text-orange-400", bg: "bg-orange-500/20", border: "border-orange-500/30", defaultDelay: 30 },
  { type: "ABANDONED_CART_2", label: "Abandoned Cart — Reminder 2 (Discount)", icon: "🎁", color: "text-red-400", bg: "bg-red-500/20", border: "border-red-500/30", defaultDelay: 1440 },
  { type: "ORDER_CONFIRM",    label: "Order Confirmation", icon: "✅", color: "text-green-400", bg: "bg-green-500/20", border: "border-green-500/30", defaultDelay: 0 },
  { type: "POST_PURCHASE_UPSELL", label: "Post-Purchase Upsell", icon: "⬆️", color: "text-purple-400", bg: "bg-purple-500/20", border: "border-purple-500/30", defaultDelay: 120 },
];

interface FlowsTabProps {
  merchantId: string;
  flows: any[];
  metaTemplates: any[];
  loading: string | null;
  setLoading: (v: string | null) => void;
  flowDrafts: Record<string, { template: string; delay: number; active: boolean; lang: string; discount: string }>;
  setFlowDrafts: React.Dispatch<React.SetStateAction<Record<string, { template: string; delay: number; active: boolean; lang: string; discount: string }>>>;
  fetchAll: () => Promise<void>;
  fetchMetaTemplates: () => void;
  setActiveTab: (tab: any) => void;
}

export default function FlowsTab({
  merchantId, flows, metaTemplates, loading, setLoading,
  flowDrafts, setFlowDrafts, fetchAll, fetchMetaTemplates, setActiveTab,
}: FlowsTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-xl p-4 text-sm text-slate-300 flex items-start gap-3">
        <FaRobot className="text-indigo-400 mt-0.5 shrink-0 text-lg" />
        <div>
          <p className="text-indigo-300 font-bold mb-1">How to set up a flow</p>
          <p>1. Select approved WhatsApp template &nbsp;·&nbsp; 2. Set delay &nbsp;·&nbsp; 3. Toggle ON &nbsp;·&nbsp; 4. Click <strong>Save &amp; Publish</strong></p>
        </div>
      </div>

      {FLOW_TYPES.map((ft) => {
        const db = flows.find((f: any) => f.type === ft.type);
        const draft = flowDrafts[ft.type];
        const currentTemplate = draft?.template ?? db?.metaTemplateName ?? "";
        const currentDelay    = draft?.delay    ?? db?.delayMinutes    ?? ft.defaultDelay;
        const currentActive   = draft?.active   ?? db?.isActive        ?? false;
        const currentLang     = draft?.lang     ?? (db as any)?.metaTemplateLang ?? "en_US";
        const currentDiscount = draft?.discount ?? (db as any)?.discountCode    ?? "";
        const isDirty         = draft !== undefined;
        const approvedTemplates = metaTemplates.filter((t: any) => t.status === "APPROVED");

        const updateDraft = (patch: Partial<{ template: string; delay: number; active: boolean; lang: string; discount: string }>) => {
          setFlowDrafts((prev) => ({
            ...prev,
            [ft.type]: {
              template: patch.template !== undefined ? patch.template : currentTemplate,
              delay:    patch.delay    !== undefined ? patch.delay    : currentDelay,
              active:   patch.active   !== undefined ? patch.active   : currentActive,
              lang:     patch.lang     !== undefined ? patch.lang     : currentLang,
              discount: patch.discount !== undefined ? patch.discount : currentDiscount,
            },
          }));
        };

        const handleSaveFlow = async () => {
          if (!currentTemplate) { alert("Please select a WhatsApp template first."); return; }
          setLoading(`flow-${ft.type}`);
          try {
            await axios.post(`${API_URL}/admin/flows/save`, {
              merchantId, type: ft.type, delayMinutes: currentDelay,
              template: "", metaTemplateName: currentTemplate,
              metaTemplateLang: currentLang, discountCode: currentDiscount || null,
              isActive: currentActive,
            }, { headers: ah() });
            setFlowDrafts((prev) => { const n = { ...prev }; delete n[ft.type]; return n; });
            await fetchAll();
            alert(`✅ Flow "${ft.label}" saved!`);
          } catch (e: any) { alert(e.response?.data?.message || "Save failed"); }
          finally { setLoading(null); }
        };

        return (
          <div key={ft.type} className={`bg-slate-800 rounded-2xl overflow-hidden border-2 transition ${currentActive && !isDirty ? "border-green-500/40" : isDirty ? "border-amber-500/40" : "border-white/5"}`}>
            {/* Header */}
            <div className={`px-6 py-4 flex items-center justify-between ${currentActive && !isDirty ? "bg-green-500/5" : isDirty ? "bg-amber-500/5" : ""}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${ft.bg} rounded-xl flex items-center justify-center text-lg`}>{ft.icon}</div>
                <div>
                  <p className="text-white font-extrabold text-sm">{ft.label}</p>
                  <p className="text-slate-500 text-xs">
                    {currentActive && !isDirty ? `🟢 LIVE · ${currentTemplate} (${currentLang}) · ${currentDelay} min delay` : isDirty ? "🟡 Unsaved changes" : "Not configured"}
                  </p>
                </div>
              </div>
              <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${currentActive && !isDirty ? "bg-green-500/10 border-green-500/20 text-green-400" : isDirty ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-slate-700 border-white/10 text-slate-400"}`}>
                {currentActive && !isDirty ? "● LIVE" : isDirty ? "UNSAVED" : "OFF"}
              </span>
            </div>

            {/* Form */}
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Template */}
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-2 block">WhatsApp Template <span className="text-red-400">*</span></label>
                  {approvedTemplates.length === 0 ? (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
                      ⚠️ No approved templates. <button onClick={() => setActiveTab("templates")} className="underline font-bold">Create one →</button>
                    </div>
                  ) : (
                    <select value={currentTemplate}
                      onChange={(e) => { const selected = e.target.value; const tmpl = metaTemplates.find((t: any) => t.name === selected); updateDraft({ template: selected, lang: tmpl?.language || "en_US" }); }}
                      className="w-full p-3 bg-slate-900 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                      <option value="">-- Select Template --</option>
                      {approvedTemplates.map((t: any) => <option key={t.name} value={t.name}>{t.name} ({t.language})</option>)}
                    </select>
                  )}
                  {currentTemplate && (() => {
                    const body = metaTemplates.find((t: any) => t.name === currentTemplate)?.components?.find((c: any) => c.type === "BODY");
                    return body ? <div className="mt-2 bg-slate-900 border border-white/5 rounded-lg p-3 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">{body.text.substring(0, 150)}{body.text.length > 150 ? "..." : ""}</div> : null;
                  })()}
                </div>

                {/* Delay */}
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-2 block">Send After (minutes)</label>
                  <input type="number" min="1" value={currentDelay} onChange={(e) => updateDraft({ delay: parseInt(e.target.value) || 1 })}
                    className="w-full p-3 bg-slate-900 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                  <div className="mt-2 grid grid-cols-4 gap-1">
                    {(ft.type === "POST_PURCHASE_UPSELL"
                      ? [{ label: "30 min", val: 30 }, { label: "1 hr", val: 60 }, { label: "2 hrs", val: 120 }, { label: "4 hrs", val: 240 }]
                      : [{ label: "1 min", val: 1 }, { label: "30 min", val: 30 }, { label: "1 hr", val: 60 }, { label: "24 hrs", val: 1440 }]
                    ).map((p) => (
                      <button key={p.val} type="button" onClick={() => updateDraft({ delay: p.val })}
                        className={`text-xs py-1.5 rounded-lg border font-bold transition ${currentDelay === p.val ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300" : "bg-white/5 border-white/10 text-slate-400 hover:text-white"}`}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-slate-600 text-xs mt-1.5">
                    {ft.type === "POST_PURCHASE_UPSELL" ? "2 hrs recommended · gives customer time to receive order first" : "Use 1 min for testing · 30 min for production"}
                  </p>
                </div>
              </div>

              {/* Discount code */}
              <div>
                <label className="text-xs font-bold text-slate-400 mb-2 block">Discount Code <span className="text-slate-600">(optional)</span></label>
                <input type="text" placeholder="e.g. VIP10, SAVE5" value={currentDiscount}
                  onChange={(e) => updateDraft({ discount: e.target.value.toUpperCase() })}
                  className="w-full p-3 bg-slate-900 border border-white/10 text-white placeholder-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono" />
              </div>

              {/* Upsell hint */}
              {ft.type === "POST_PURCHASE_UPSELL" && (
                <div className="bg-purple-900/20 border border-purple-500/20 rounded-xl p-4 text-xs text-slate-300">
                  <p className="text-purple-300 font-bold mb-2 flex items-center gap-2"><FaGift /> Post-Purchase Upsell — Template Variables</p>
                  <div className="space-y-1 font-mono">
                    <p><span className="text-purple-400">{"{{1}}"}</span> <span className="text-slate-400">= Customer first name</span></p>
                    <p><span className="text-purple-400">{"{{2}}"}</span> <span className="text-slate-400">= Product they just bought</span></p>
                    <p><span className="text-purple-400">{"{{3}}"}</span> <span className="text-slate-400">= Store link (tracked)</span></p>
                    <p><span className="text-purple-400">{"{{4}}"}</span> <span className="text-slate-400">= Discount code (if set)</span></p>
                  </div>
                  <p className="text-slate-500 text-[10px] mt-2">⚡ 7-day dedup — same customer won&apos;t get upsell again within 7 days</p>
                </div>
              )}

              {/* Toggle + Save */}
              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div onClick={() => updateDraft({ active: !currentActive })}
                    className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 cursor-pointer ${currentActive ? "bg-green-500" : "bg-slate-600"}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${currentActive ? "translate-x-6" : "translate-x-0"}`} />
                  </div>
                  <span className={`text-sm font-bold ${currentActive ? "text-green-400" : "text-slate-400"}`}>{currentActive ? "Enabled" : "Disabled"}</span>
                </label>

                <div className="flex items-center gap-3">
                  {db && (
                    <button type="button"
                      onClick={async () => { try { await axios.post(`${API_URL}/admin/flows/toggle`, { merchantId, type: ft.type, isActive: !db.isActive }, { headers: ah() }); await fetchAll(); } catch { alert("Toggle failed"); } }}
                      className={`px-4 py-2.5 rounded-xl font-bold text-sm border transition flex items-center gap-2 ${db.isActive ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20" : "bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20"}`}>
                      {db.isActive ? "⏸ Pause" : "▶ Resume"}
                    </button>
                  )}
                  <button onClick={handleSaveFlow} disabled={loading === `flow-${ft.type}`}
                    className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-bold px-6 py-2.5 rounded-xl disabled:opacity-40 flex items-center gap-2 transition text-sm">
                    {loading === `flow-${ft.type}` ? <><FaSpinner className="animate-spin" /> Saving...</> : <><FaCheckCircle /> Save &amp; Publish</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <div className="flex gap-4">
        <button onClick={() => { fetchMetaTemplates(); setActiveTab("templates"); }}
          className="bg-indigo-500/20 hover:bg-indigo-500 border border-indigo-500/30 text-indigo-300 hover:text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition">
          <FaTag /> Manage Templates
        </button>
      </div>
    </div>
  );
}
