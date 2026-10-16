"use client";
import React from "react";
import axios from "axios";
import {
  FaRobot,
  FaSpinner,
  FaCheckCircle,
  FaTag,
  FaGift,
  FaPlus,
  FaTrash,
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

const VARIABLE_OPTIONS = [
  { value: "customer_name", label: "👤 Customer Name" },
  { value: "product_name", label: "📦 First Product Name" },
  { value: "products_list", label: "🛒 All Products (List)" },
  { value: "cart_url", label: "🔗 Cart / Store URL (Tracked)" },
  { value: "discount_code", label: "🎟️ Discount Code" },
  { value: "total_price", label: "💰 Total Price" },
  { value: "store_name", label: "🏪 Store Name" },
];

export interface FlowDraftItem {
  template: string;
  delay: number;
  active: boolean;
  lang: string;
  discount: string;
  variableMapping: string[];
}

interface FlowsTabProps {
  merchantId: string;
  flows: any[];
  metaTemplates: any[];
  loading: string | null;
  setLoading: (v: string | null) => void;
  flowDrafts: Record<string, FlowDraftItem>;
  setFlowDrafts: React.Dispatch<
    React.SetStateAction<Record<string, FlowDraftItem>>
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
            1. Select approved WhatsApp template &nbsp;·&nbsp; 2. Map variables
            ({"{{1}}"}, {"{{2}}"}) &nbsp;·&nbsp; 3. Set delay &nbsp;·&nbsp; 4.
            Click <strong>Save &amp; Publish</strong>
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

        // Parse DB Variable Mapping fallback
        let dbMapping: string[] = [];
        try {
          if (db?.variableMapping) {
            dbMapping =
              typeof db.variableMapping === "string"
                ? JSON.parse(db.variableMapping)
                : db.variableMapping;
          }
        } catch {}

        const currentMapping = draft?.variableMapping ?? dbMapping ?? [];
        const isDirty = draft !== undefined;
        const approvedTemplates = metaTemplates.filter(
          (t: any) => t.status === "APPROVED",
        );

        const updateDraft = (patch: Partial<FlowDraftItem>) => {
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
                  : currentMapping,
            },
          }));
        }; 
        

        const handleTemplateSelect = (templateName: string) => {
          const tmpl = metaTemplates.find((t: any) => t.name === templateName);
          updateDraft({
            template: templateName,
            lang: tmpl?.language,
          });

          const bodyComponent = tmpl?.components?.find(
            (component: any) => component.type === "BODY",
          );
          const text = bodyComponent?.text || "";
          const matches = text.match(/\{\{\d+\}\}/g) || [];
          const newMapping = matches.map(() => "customer_name");
          updateDraft({ variableMapping: newMapping });
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
                metaTemplateLang: currentLang,
                discountCode: currentDiscount || null,
                variableMapping: JSON.stringify(currentMapping), // 👈 100% Safe crash-proof stringify
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
            className={`bg-slate-800 rounded-2xl overflow-hidden border-2 transition ${
              currentActive && !isDirty
                ? "border-green-500/40"
                : isDirty
                  ? "border-amber-500/40"
                  : "border-white/5"
            }`}
          >
            {/* Header */}
            <div
              className={`px-6 py-4 flex items-center justify-between ${
                currentActive && !isDirty
                  ? "bg-green-500/5"
                  : isDirty
                    ? "bg-amber-500/5"
                    : ""
              }`}
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
                className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
                  currentActive && !isDirty
                    ? "bg-green-500/10 border-green-500/20 text-green-400"
                    : isDirty
                      ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                      : "bg-slate-700 border-white/10 text-slate-400"
                }`}
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
                {/* Template Selection */}
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
                      onChange={(e) => handleTemplateSelect(e.target.value)}
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
                </div>

                {/* Delay Selection */}
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
                    {[
                      { label: "1 min", val: 1 },
                      { label: "30 min", val: 30 },
                      { label: "2 hrs", val: 120 },
                      { label: "24 hrs", val: 1440 },
                    ].map((p) => (
                      <button
                        key={p.val}
                        type="button"
                        onClick={() => updateDraft({ delay: p.val })}
                        className={`text-xs py-1.5 rounded-lg border font-bold transition ${
                          currentDelay === p.val
                            ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                            : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 🌟 DYNAMIC VARIABLE MAPPING UI SECTION */}
              <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                      🧩 Template Variable Mapping ({"{{1}}"}, {"{{2}}"}...)
                    </p>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Map each variable slot to customer/cart data accurately to
                      prevent Meta 132000 errors.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      updateDraft({
                        variableMapping: [...currentMapping, "customer_name"],
                      });
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-teal-400 hover:text-teal-300 bg-teal-500/10 border border-teal-500/20 px-2.5 py-1.5 rounded-lg transition"
                  >
                    <FaPlus className="text-[10px]" /> Add Variable
                  </button>
                </div>

                {/* Mapping UI - Dynamic based on template */}
                {currentMapping.length > 0 && (
                  <div className="bg-slate-900 p-4 rounded-xl space-y-3">
                    <p className="text-xs font-bold text-teal-400">
                      Map your template variables:
                    </p>
                    {currentMapping.map((mapVal, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-400 w-12">
                          {"{{"}
                          {idx + 1}
                          {"}}"}
                        </span>
                        <select
                          value={mapVal}
                          onChange={(e) => {
                            const newMap = [...currentMapping];
                            newMap[idx] = e.target.value;
                            updateDraft({ variableMapping: newMap });
                          }}
                          className="flex-1 p-2 bg-slate-800 border rounded-lg text-xs text-white"
                        >
                          {VARIABLE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                          <option value="custom_text">✎ Custom Value</option>
                        </select>

                        {/* Agar custom select kiya, toh niche input dikhao */}
                        {mapVal === "custom_text" && (
                          <input
                            type="text"
                            placeholder="Enter text..."
                            className="w-1/3 p-2 bg-slate-800 border rounded-lg text-xs text-white"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {currentMapping.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-1">
                    No variables mapped. (Default fallback: Customer Name,
                    Products List, Cart URL)
                  </p>
                ) : (
                  <div className="space-y-2 pt-1">
                    {currentMapping.map((val, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-slate-400 w-12 shrink-0">
                          {"{{"}
                          {idx + 1}
                          {"}}"}
                        </span>
                        <select
                          value={val}
                          onChange={(e) => {
                            const updated = [...currentMapping];
                            updated[idx] = e.target.value;
                            updateDraft({ variableMapping: updated });
                          }}
                          className="flex-1 p-2 bg-slate-800 border border-white/10 rounded-lg text-xs text-white outline-none focus:ring-1 focus:ring-teal-500"
                        >
                          {VARIABLE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = currentMapping.filter(
                              (_, i) => i !== idx,
                            );
                            updateDraft({ variableMapping: updated });
                          }}
                          className="p-2 text-slate-500 hover:text-red-400 rounded transition"
                          title="Remove Variable"
                        >
                          <FaTrash className="text-xs" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Discount Code */}
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">
                  Discount Code{" "}
                  <span className="text-slate-600">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. VIP10, SAVE5"
                  value={currentDiscount}
                  onChange={(e) =>
                    updateDraft({ discount: e.target.value.toUpperCase() })
                  }
                  className="w-full p-3 bg-slate-900 border border-white/10 text-white placeholder-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                />
              </div>

              {/* Toggle + Save Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div
                    onClick={() => updateDraft({ active: !currentActive })}
                    className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 cursor-pointer ${
                      currentActive ? "bg-green-500" : "bg-slate-600"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        currentActive ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </div>
                  <span
                    className={`text-sm font-bold ${currentActive ? "text-green-400" : "text-slate-400"}`}
                  >
                    {currentActive ? "Enabled" : "Disabled"}
                  </span>
                </label>

                <button
                  onClick={handleSaveFlow}
                  disabled={loading === `flow-${ft.type}`}
                  className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-bold px-6 py-2.5 rounded-xl disabled:opacity-40 flex items-center gap-2 transition text-sm shadow-lg shadow-teal-500/20"
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
