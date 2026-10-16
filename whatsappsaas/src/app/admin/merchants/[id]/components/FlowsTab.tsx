"use client";
import axios from "axios";
import {
  FaRobot,
  FaSpinner,
  FaCheckCircle,
  FaTag,
  FaGift,
} from "react-icons/fa";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const ah = () => ({
  "x-admin-api-key":
    typeof window !== "undefined"
      ? sessionStorage.getItem("adminKey") || ""
      : "",
});

const FLOW_TYPES = [
  {
    type: "ABANDONED_CART_1",
    label: "Abandoned Cart — Reminder 1",
    icon: "🛒",
    color: "text-orange-400",
    bg: "bg-orange-500/20",
    border: "border-orange-500/30",
    defaultDelay: 30,
  },
  {
    type: "ABANDONED_CART_2",
    label: "Abandoned Cart — Reminder 2 (Discount)",
    icon: "🎁",
    color: "text-red-400",
    bg: "bg-red-500/20",
    border: "border-red-500/30",
    defaultDelay: 1440,
  },
  {
    type: "ORDER_CONFIRM",
    label: "Order Confirmation",
    icon: "✅",
    color: "text-green-400",
    bg: "bg-green-500/20",
    border: "border-green-500/30",
    defaultDelay: 0,
  },
  {
    type: "POST_PURCHASE_UPSELL",
    label: "Post-Purchase Upsell",
    icon: "⬆️",
    color: "text-purple-400",
    bg: "bg-purple-500/20",
    border: "border-purple-500/30",
    defaultDelay: 120,
  },
  {
    type: "COD_CONVERT",
    label: "COD → Prepaid Converter (RTO Killer)",
    icon: "💳",
    color: "text-yellow-400",
    bg: "bg-yellow-500/20",
    border: "border-yellow-500/30",
    defaultDelay: 2,
  },
  {
    type: "STORE_ANNIVERSARY",
    label: "Store Anniversary (1-Year Customer)",
    icon: "🎂",
    color: "text-pink-400",
    bg: "bg-pink-500/20",
    border: "border-pink-500/30",
    defaultDelay: 0,
  },
];

export interface FlowDraftItem {
  template: string;
  delay: number;
  active: boolean;
  lang: string;
  discount: string;
  customMessage?: string;
  variableMapping: string[];
  variableSources?: string[];
}

const VARIABLE_OPTIONS = [
  { value: "customer_name",  label: "👤 Customer Name" },
  { value: "product_name",   label: "📦 First Product Name" },
  { value: "products_list",  label: "🛒 All Products (list)" },
  { value: "cart_url",       label: "🔗 Tracking Link / Cart URL" },
  { value: "discount_code",  label: "🎟️ Discount Code" },
  { value: "total_price",    label: "💰 Cart Total Price" },
  { value: "store_name",     label: "🏪 Store / Brand Name" },
  { value: "order_number",   label: "📋 Order Number (#1001)" },
  { value: "store_url",      label: "🌐 Store URL" },
  { value: "Common Message", label: "✏️ Custom Text (same for all)" },
];

interface FlowsTabProps {
  merchantId: string;
  flows: any[];
  metaTemplates: any[];
  loading: string | null;
  setLoading: (v: string | null) => void;
  flowDrafts: Record<
    string,
    {
      template: string;
      delay: number;
      active: boolean;
      lang: string;
      discount: string;
      variableMapping: string[];
      customMessage?: string;
      variableSources?: string[];
    }
  >;
  setFlowDrafts: React.Dispatch<
    React.SetStateAction<
      Record<
        string,
        {
          template: string;
          delay: number;
          active: boolean;
          lang: string;
          discount: string;
          variableMapping: string[];
          customMessage?: string;
          variableSources?: string[];
        }
      >
    >
  >;
  fetchAll: () => Promise<void>;
  fetchMetaTemplates: () => void;
  setActiveTab: (tab: any) => void;
}

export default function FlowsTab({
  merchantId,
  flows,
  metaTemplates,
  loading,
  setLoading,
  flowDrafts,
  setFlowDrafts,
  fetchAll,
  fetchMetaTemplates,
  setActiveTab,
}: FlowsTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-xl p-4 text-sm text-slate-300 flex items-start gap-3">
        <FaRobot className="text-indigo-400 mt-0.5 shrink-0 text-lg" />
        <div>
          <p className="text-indigo-300 font-bold mb-1">How to set up a flow</p>
          <p>
            1. Select approved WhatsApp template &nbsp;·&nbsp; 2. Set delay
            &nbsp;·&nbsp; 3. Toggle ON &nbsp;·&nbsp; 4. Click{" "}
            <strong>Save &amp; Publish</strong>
          </p>
        </div>
      </div>

      {FLOW_TYPES.map((ft) => {
        const db = flows.find((f: any) => f.type === ft.type);
        const draft = flowDrafts[ft.type];
        const currentTemplate = draft?.template ?? db?.metaTemplateName ?? "";
        const currentDelay =
          draft?.delay ?? db?.delayMinutes ?? ft.defaultDelay;
        const currentActive = draft?.active ?? db?.isActive ?? false;
        const currentLang =
          draft?.lang ?? (db as any)?.metaTemplateLang ?? "en_US";
        const currentDiscount =
          draft?.discount ?? (db as any)?.discountCode ?? "";
        const isDirty = draft !== undefined;
        const approvedTemplates = metaTemplates.filter(
          (t: any) => t.status === "APPROVED",
        );

        const updateDraft = (
          patch: Partial<{
            template: string;
            delay: number;
            active: boolean;
            lang: string;
            discount: string;
            variableMapping: string[];
            customMessage?: string;
            variableSources: string[];
          }>,
        ) => {
          setFlowDrafts((prev) => ({
            ...prev,
            [ft.type]: {
              template:
                patch.template !== undefined ? patch.template : currentTemplate,
              delay: patch.delay !== undefined ? patch.delay : currentDelay,
              active: patch.active !== undefined ? patch.active : currentActive,
              lang: patch.lang !== undefined ? patch.lang : currentLang,
              discount:
                patch.discount !== undefined ? patch.discount : currentDiscount,
              variableMapping:
                patch.variableMapping !== undefined
                  ? patch.variableMapping
                  : (draft?.variableMapping ?? []),
              customMessage:
                patch.customMessage !== undefined
                  ? patch.customMessage
                  : (draft?.customMessage ?? ""),
              variableSources:
                patch.variableSources !== undefined
                  ? patch.variableSources
                  : (draft?.variableSources ?? []),
            },
          }));
        };

        const handleSaveFlow = async () => {
          if (!currentTemplate) {
            alert("Please select a WhatsApp template first.");
            return;
          }
          setLoading(`flow-${ft.type}`);
          try {
            await axios.post(
              `${API_URL}/admin/flows/save`,
              {
                merchantId,
                type: ft.type,
                delayMinutes: currentDelay,
                template: "",
                metaTemplateName: currentTemplate,
                variableMapping: JSON.stringify(draft?.variableMapping || []),
                variableSources: JSON.stringify(draft?.variableSources || []),
                metaTemplateLang: currentLang,
                discountCode: currentDiscount || null,
                customMessage: draft?.customMessage || null,
                isActive: currentActive,
              },
              { headers: ah() },
            );
            setFlowDrafts((prev) => {
              const n = { ...prev };
              delete n[ft.type];
              return n;
            });
            await fetchAll();
            alert(`✅ Flow "${ft.label}" saved!`);
          } catch (e: any) {
            alert(e.response?.data?.message || "Save failed");
          } finally {
            setLoading(null);
          }
        };

        return (
          <div
            key={ft.type}
            className={`bg-slate-800 rounded-2xl overflow-hidden border-2 transition ${currentActive && !isDirty ? "border-green-500/40" : isDirty ? "border-amber-500/40" : "border-white/5"}`}
          >
            {/* Header */}
            <div
              className={`px-6 py-4 flex items-center justify-between ${currentActive && !isDirty ? "bg-green-500/5" : isDirty ? "bg-amber-500/5" : ""}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 ${ft.bg} rounded-xl flex items-center justify-center text-lg`}
                >
                  {ft.icon}
                </div>
                <div>
                  <p className="text-white font-extrabold text-sm">
                    {ft.label}
                  </p>
                  <p className="text-slate-500 text-xs">
                    {currentActive && !isDirty
                      ? `🟢 LIVE · ${currentTemplate} (${currentLang}) · ${currentDelay} min delay`
                      : isDirty
                        ? "🟡 Unsaved changes"
                        : "Not configured"}
                  </p>
                </div>
              </div>
              <span
                className={`text-xs font-extrabold px-3 py-1 rounded-full border ${currentActive && !isDirty ? "bg-green-500/10 border-green-500/20 text-green-400" : isDirty ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-slate-700 border-white/10 text-slate-400"}`}
              >
                {currentActive && !isDirty
                  ? "● LIVE"
                  : isDirty
                    ? "UNSAVED"
                    : "OFF"}
              </span>
            </div>

            {/* Form */}
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Template */}
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-2 block">
                    WhatsApp Template <span className="text-red-400">*</span>
                  </label>
                  {approvedTemplates.length === 0 ? (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
                      ⚠️ No approved templates.{" "}
                      <button
                        onClick={() => setActiveTab("templates")}
                        className="underline font-bold"
                      >
                        Create one →
                      </button>
                    </div>
                  ) : (
                    <select
                      value={currentTemplate}
                      onChange={(e) => {
                        const selected = e.target.value;
                        const tmpl = metaTemplates.find(
                          (t: any) => t.name === selected,
                        );

                        // ── Auto-detect all variables from template structure ──
                        // Order: header vars first, then body vars, then button URL vars
                        // This matches exactly what Meta API expects in components[]
                        const newMapping: string[] = [];
                        const newSources: string[] = [];

                        // 1. Header text variables
                        const headerComp = tmpl?.components?.find((c: any) => c.type === "HEADER");
                        if (headerComp?.format === "TEXT") {
                          const hMatches = (headerComp.text || "").match(/\{\{\d+\}\}/g) || [];
                          hMatches.forEach(() => {
                            newMapping.push("store_name");
                            newSources.push("header");
                          });
                        }

                        // 2. Body variables
                        const bodyText = tmpl?.components?.find((c: any) => c.type === "BODY")?.text || "";
                        const bMatches = bodyText.match(/\{\{\d+\}\}/g) || [];
                        const bodyDefaults = ["customer_name", "products_list", "total_price", "discount_code", "store_name"];
                        bMatches.forEach((_: any, i: number) => {
                          newMapping.push(bodyDefaults[i] || "customer_name");
                          newSources.push("body");
                        });

                        // 3. Button URL variables (dynamic suffix only)
                        const buttonsComp = tmpl?.components?.find((c: any) => c.type === "BUTTONS");
                        if (buttonsComp?.buttons) {
                          buttonsComp.buttons.forEach((btn: any, btnIdx: number) => {
                            if (btn.type === "URL" && btn.url && btn.url.includes("{{")) {
                              (btn.url.match(/\{\{\d+\}\}/g) || []).forEach(() => {
                                newMapping.push("cart_url");
                                newSources.push(`button_url_${btnIdx}`);
                              });
                            }
                          });
                        }

                        updateDraft({
                          template: selected,
                          lang: tmpl?.language || "en_US",
                          variableMapping: newMapping,
                          variableSources: newSources,
                        });
                      }}
                      className="w-full p-3 bg-slate-900 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    >
                      <option value="">-- Select Template --</option>
                      {approvedTemplates.map((t: any) => (
                        <option key={t.name} value={t.name}>
                          {t.name} ({t.language})
                        </option>
                      ))}
                    </select>
                  )}
                  {currentTemplate &&
                    (() => {
                      const tmpl = metaTemplates.find(
                        (t: any) => t.name === currentTemplate,
                      );
                      if (!tmpl) return null;

                      const header = tmpl.components?.find(
                        (c: any) => c.type === "HEADER",
                      );
                      const body = tmpl.components?.find(
                        (c: any) => c.type === "BODY",
                      );
                      const footer = tmpl.components?.find(
                        (c: any) => c.type === "FOOTER",
                      );
                      const buttons = tmpl.components?.find(
                        (c: any) => c.type === "BUTTONS",
                      );

                      return (
                        <div className="mt-2 bg-[#0a1929] border border-white/10 rounded-xl overflow-hidden text-xs">
                          {/* WhatsApp-style message bubble */}
                          <div className="bg-slate-800 px-3 py-1.5 border-b border-white/5">
                            <span className="text-slate-400 text-[10px] font-bold uppercase">
                              📱 Preview
                            </span>
                          </div>
                          <div className="p-3 space-y-1.5">
                            {header?.text && (
                              <p className="text-white font-bold text-sm">
                                {header.text}
                              </p>
                            )}
                            {body?.text && (
                              <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                                {body.text}
                              </p>
                            )}
                            {footer?.text && (
                              <p className="text-slate-500 text-[10px] italic">
                                {footer.text}
                              </p>
                            )}
                            {buttons?.buttons?.length > 0 && (
                              <div className="border-t border-white/10 pt-2 space-y-1 mt-1">
                                {buttons.buttons.map((btn: any, i: number) => (
                                  <div
                                    key={i}
                                    className="text-center py-1.5 border border-teal-500/30 rounded-lg text-teal-400 text-[11px] font-bold"
                                  >
                                    {btn.type === "QUICK_REPLY"
                                      ? "↩ "
                                      : btn.type === "URL"
                                        ? "🔗 "
                                        : "📞 "}
                                    {btn.text}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                </div>

                {/* Delay */}
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-2 block">
                    Send After (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={currentDelay}
                    onChange={(e) =>
                      updateDraft({ delay: parseInt(e.target.value) || 1 })
                    }
                    className="w-full p-3 bg-slate-900 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                  <div className="mt-2 grid grid-cols-4 gap-1">
                    {(ft.type === "POST_PURCHASE_UPSELL"
                      ? [
                          { label: "30 min", val: 30 },
                          { label: "1 hr", val: 60 },
                          { label: "2 hrs", val: 120 },
                          { label: "4 hrs", val: 240 },
                        ]
                      : [
                          { label: "1 min", val: 1 },
                          { label: "30 min", val: 30 },
                          { label: "1 hr", val: 60 },
                          { label: "24 hrs", val: 1440 },
                        ]
                    ).map((p) => (
                      <button
                        key={p.val}
                        type="button"
                        onClick={() => updateDraft({ delay: p.val })}
                        className={`text-xs py-1.5 rounded-lg border font-bold transition ${currentDelay === p.val ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300" : "bg-white/5 border-white/10 text-slate-400 hover:text-white"}`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-slate-600 text-xs mt-1.5">
                    {ft.type === "POST_PURCHASE_UPSELL"
                      ? "2 hrs recommended · gives customer time to receive order first"
                      : "Use 1 min for testing · 30 min for production"}
                  </p>
                </div>
              </div>

              {/* Custom message input — sirf tab dikhao jab koi variable "Common Message" select ho */}
              {draft?.variableMapping?.some(
                (item: any) =>
                  (typeof item === "string" ? item : item.key) ===
                  "Common Message",
              ) && (
                <div className="mt-2">
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">
                    Custom Message Text (same for all customers)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Happy Diwali! 🎉"
                    value={draft.customMessage || ""}
                    onChange={(e) =>
                      updateDraft({ customMessage: e.target.value })
                    }
                    className="w-full p-2 bg-slate-800 border border-white/10 rounded-xl text-xs text-white placeholder-slate-600"
                  />
                </div>
              )}

              {(() => {
                const activeMapping =
                  draft?.variableMapping?.length > 0
                    ? draft.variableMapping
                    : (() => {
                        try {
                          return JSON.parse(db?.variableMapping || "[]");
                        } catch {
                          return [];
                        }
                      })();
                return activeMapping.length > 0 ? (
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5 space-y-2">
                    <label className="text-xs font-bold text-teal-400 block">
                      Map Template Variables
                    </label>
                    {activeMapping.map((val: string, idx: number) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-mono text-slate-400 w-10">{`{{${idx + 1}}}`}</span>
                          <select
                            value={val}
                            onChange={(e) => {
                              const newMap = [...activeMapping];
                              newMap[idx] = e.target.value;
                              updateDraft({ variableMapping: newMap });
                            }}
                            className="flex-1 p-2 bg-slate-800 border border-white/10 rounded-lg text-xs text-white"
                          >
                            {VARIABLE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        {val === "discount_code" && (
                          <div className="ml-14">
                            <input
                              type="text"
                              placeholder="Enter discount code e.g. VIP10"
                              value={currentDiscount}
                              onChange={(e) =>
                                updateDraft({
                                  discount: e.target.value.toUpperCase(),
                                })
                              }
                              className="w-full p-2 bg-slate-900 border border-teal-500/30 text-white placeholder-slate-600 rounded-lg text-xs font-mono focus:ring-1 focus:ring-teal-500 outline-none"
                            />
                            {currentDiscount && (
                              <p className="text-teal-400 text-[10px] mt-0.5 font-bold">
                                🎟️ {currentDiscount} will be sent
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : null;
              })()}

              {/* Upsell hint */}
              {ft.type === "POST_PURCHASE_UPSELL" && (
                <div className="bg-purple-900/20 border border-purple-500/20 rounded-xl p-4 text-xs text-slate-300">
                  <p className="text-purple-300 font-bold mb-2 flex items-center gap-2">
                    <FaGift /> Post-Purchase Upsell — Template Variables
                  </p>
                  <div className="space-y-1 font-mono">
                    <p>
                      <span className="text-purple-400">{"{{1}}"}</span>{" "}
                      <span className="text-slate-400">
                        = Customer first name
                      </span>
                    </p>
                    <p>
                      <span className="text-purple-400">{"{{2}}"}</span>{" "}
                      <span className="text-slate-400">
                        = Product they just bought
                      </span>
                    </p>
                    <p>
                      <span className="text-purple-400">{"{{3}}"}</span>{" "}
                      <span className="text-slate-400">
                        = Store link (tracked)
                      </span>
                    </p>
                    <p>
                      <span className="text-purple-400">{"{{4}}"}</span>{" "}
                      <span className="text-slate-400">
                        = Discount code (if set)
                      </span>
                    </p>
                  </div>
                  <p className="text-slate-500 text-[10px] mt-2">
                    ⚡ 7-day dedup — same customer won&apos;t get upsell again
                    within 7 days
                  </p>
                </div>
              )}

              {/* COD Convert  */}
              {ft.type === "COD_CONVERT" && (
                <div className="bg-yellow-900/20 border border-yellow-500/20 rounded-xl p-4 text-xs text-slate-300">
                  <p className="text-yellow-300 font-bold mb-2">
                    💳 COD → Prepaid Converter — Template Variables
                  </p>
                  <p className="text-slate-400 mb-1">
                    Use these variables in your Meta template:
                  </p>
                  <div className="space-y-1 font-mono">
                    <p>
                      <span className="text-yellow-300">{"{{1}}"}</span> —
                      Customer first name
                    </p>
                    <p>
                      <span className="text-yellow-300">{"{{2}}"}</span> — Order
                      number (e.g. #1001)
                    </p>
                    <p>
                      <span className="text-yellow-300">{"{{3}}"}</span> —
                      Payment / store link
                    </p>
                    <p>
                      <span className="text-yellow-300">{"{{4}}"}</span> —
                      Discount code (optional)
                    </p>
                  </div>
                  <p className="text-slate-500 mt-2">
                    Triggers automatically 2 min after every COD order. Delay
                    field is ignored.
                  </p>
                </div>
              )}

              {ft.type === "STORE_ANNIVERSARY" && (
                <div className="bg-pink-900/20 border border-pink-500/20 rounded-xl p-4 text-xs text-slate-300">
                  <p className="text-pink-300 font-bold mb-2">
                    🎂 Store Anniversary — Template Variables
                  </p>
                  <p className="text-slate-400 mb-1">
                    Sent on the anniversary of customer&apos;s first order:
                  </p>
                  <div className="space-y-1 font-mono">
                    <p>
                      <span className="text-pink-300">{"{{1}}"}</span> —
                      Customer first name
                    </p>
                    <p>
                      <span className="text-pink-300">{"{{2}}"}</span> — Years
                      completed (e.g. 1)
                    </p>
                    <p>
                      <span className="text-pink-300">{"{{3}}"}</span> — Store
                      link
                    </p>
                    <p>
                      <span className="text-pink-300">{"{{4}}"}</span> —
                      Discount code (optional)
                    </p>
                  </div>
                  <p className="text-slate-500 mt-2">
                    Runs daily at midnight. Checks all customers whose first
                    order was exactly 1 year ago today.
                  </p>
                </div>
              )}

              {/* Toggle + Save */}
              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div
                    onClick={() => updateDraft({ active: !currentActive })}
                    className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 cursor-pointer ${currentActive ? "bg-green-500" : "bg-slate-600"}`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${currentActive ? "translate-x-6" : "translate-x-0"}`}
                    />
                  </div>
                  <span
                    className={`text-sm font-bold ${currentActive ? "text-green-400" : "text-slate-400"}`}
                  >
                    {currentActive ? "Enabled" : "Disabled"}
                  </span>
                </label>

                <div className="flex items-center gap-3">
                  {db && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await axios.post(
                            `${API_URL}/admin/flows/toggle`,
                            {
                              merchantId,
                              type: ft.type,
                              isActive: !db.isActive,
                            },
                            { headers: ah() },
                          );
                          await fetchAll();
                        } catch {
                          alert("Toggle failed");
                        }
                      }}
                      className={`px-4 py-2.5 rounded-xl font-bold text-sm border transition flex items-center gap-2 ${db.isActive ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20" : "bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20"}`}
                    >
                      {db.isActive ? "⏸ Pause" : "▶ Resume"}
                    </button>
                  )}
                  <button
                    onClick={handleSaveFlow}
                    disabled={loading === `flow-${ft.type}`}
                    className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-bold px-6 py-2.5 rounded-xl disabled:opacity-40 flex items-center gap-2 transition text-sm"
                  >
                    {loading === `flow-${ft.type}` ? (
                      <>
                        <FaSpinner className="animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <FaCheckCircle /> Save &amp; Publish
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <div className="flex gap-4">
        <button
          onClick={() => {
            fetchMetaTemplates();
            setActiveTab("templates");
          }}
          className="bg-indigo-500/20 hover:bg-indigo-500 border border-indigo-500/30 text-indigo-300 hover:text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition"
        >
          <FaTag /> Manage Templates
        </button>
      </div>
    </div>
  );
}
