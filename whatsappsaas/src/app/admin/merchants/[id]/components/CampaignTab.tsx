"use client";
import React from "react";
import { FaSpinner, FaPlay, FaClock } from "react-icons/fa";

const VARIABLE_OPTIONS = [
  { value: "customer_name",  label: "👤 Customer Name" },
  { value: "discount_code",  label: "🎟️ Discount Code" },
  { value: "product_name",   label: "📦 First Product Name" },
  { value: "products_list",  label: "🛒 All Products (list)" },
  { value: "store_name",     label: "🏪 Store / Brand Name" },
  { value: "store_url",      label: "🌐 Store URL" },
  { value: "order_number",   label: "📋 Order Number" },
  { value: "total_price",    label: "💰 Total Price" },
  { value: "Common Message", label: "✏️ Custom Text (same for all)" },
];

interface CampaignTabProps {
  merchantId: string;
  isActive: boolean;
  loading: string | null;
  campaigns: any[];
  customerTotal: number;
  metaTemplates: any[];
  setActiveTab: (tab: any) => void;
  campaignName: string; setCampaignName: (v: string) => void;
  campMetaTemplate: string; setCampMetaTemplate: (v: string) => void;
  campMetaLang: string; setCampMetaLang: (v: string) => void;
  campDiscountCode: string; setCampDiscountCode: (v: string) => void;
  campScheduleMode: "now" | "later"; setCampScheduleMode: (v: "now" | "later") => void;
  campScheduledAt: string; setCampScheduledAt: (v: string) => void;
  campCustomerFilter: string; setCampCustomerFilter: (v: string) => void;
  campVariableMapping: string[]; setCampVariableMapping: (v: string[]) => void;
  campVariableSources: string[]; setCampVariableSources: (v: string[]) => void;
  handleLaunchCampaign: (e: React.FormEvent) => void;
  handleCancelCampaign: (id: string) => void;
}

export default function CampaignTab({
  isActive, loading, campaigns, customerTotal, metaTemplates, setActiveTab,
  campaignName, setCampaignName,
  campMetaTemplate, setCampMetaTemplate, campMetaLang, setCampMetaLang,
  campDiscountCode, setCampDiscountCode,
  campScheduleMode, setCampScheduleMode,
  campScheduledAt, setCampScheduledAt,
  campCustomerFilter, setCampCustomerFilter,
  campVariableMapping, setCampVariableMapping,
  campVariableSources, setCampVariableSources,
  handleLaunchCampaign, handleCancelCampaign,
}: CampaignTabProps) {

  // Auto-detect variables from template structure
  const handleTemplateChange = (name: string) => {
    setCampMetaTemplate(name);
    const tmpl = metaTemplates.find((t: any) => t.name === name);
    if (tmpl?.language) setCampMetaLang(tmpl.language);

    const newMapping: string[] = [];
    const newSources: string[] = [];

    // Header text variables
    const headerComp = tmpl?.components?.find((c: any) => c.type === "HEADER");
    if (headerComp?.format === "TEXT") {
      (headerComp.text || "").match(/\{\{\d+\}\}/g)?.forEach(() => {
        newMapping.push("store_name"); newSources.push("header");
      });
    }

    // Body variables
    const bodyText = tmpl?.components?.find((c: any) => c.type === "BODY")?.text || "";
    const bodyDefaults = ["customer_name", "discount_code", "product_name", "store_name", "total_price"];
    (bodyText.match(/\{\{\d+\}\}/g) || []).forEach((_: any, i: number) => {
      newMapping.push(bodyDefaults[i] || "customer_name");
      newSources.push("body");
    });

    // Button variables
    const buttonsComp = tmpl?.components?.find((c: any) => c.type === "BUTTONS");
    if (buttonsComp?.buttons) {
      buttonsComp.buttons.forEach((btn: any, btnIdx: number) => {
        if (btn.type === "URL" && btn.url && btn.url.includes("{{")) {
          newMapping.push("store_url"); newSources.push(`button_url_${btnIdx}`);
        } else if (btn.type === "COPY_CODE") {
          newMapping.push("discount_code"); newSources.push(`button_coupon_${btnIdx}`);
        }
      });
    }

    setCampVariableMapping(newMapping);
    setCampVariableSources(newSources);
  };

  const approvedTemplates = metaTemplates.filter((t: any) => t.status === "APPROVED");

  // Template preview
  const selectedTmpl = metaTemplates.find((t: any) => t.name === campMetaTemplate);
  const previewHeader  = selectedTmpl?.components?.find((c: any) => c.type === "HEADER");
  const previewBody    = selectedTmpl?.components?.find((c: any) => c.type === "BODY");
  const previewFooter  = selectedTmpl?.components?.find((c: any) => c.type === "FOOTER");
  const previewButtons = selectedTmpl?.components?.find((c: any) => c.type === "BUTTONS");

  return (
    <div className="space-y-6 max-w-3xl">
      {/* ── Launch Form ── */}
      <div className="bg-slate-800 border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <h3 className="text-white font-extrabold">📢 Launch Bulk Campaign</h3>
          <p className="text-slate-400 text-xs mt-0.5">Send Meta-approved template to your customers · 15s per message</p>
        </div>
        <form onSubmit={handleLaunchCampaign} className="p-6 space-y-5">

          {/* Campaign Name */}
          <div>
            <label className="text-xs font-bold text-slate-400 mb-2 block">Campaign Name <span className="text-red-400">*</span></label>
            <input type="text" required placeholder="e.g. Diwali Sale 2025"
              value={campaignName} onChange={(e) => setCampaignName(e.target.value)}
              className="w-full p-3 bg-slate-900 border border-white/10 text-white placeholder-slate-500 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
          </div>

          {/* Template Selector */}
          <div>
            <label className="text-xs font-bold text-slate-400 mb-2 block">WhatsApp Template <span className="text-red-400">*</span></label>
            {approvedTemplates.length === 0 ? (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                ⚠️ No approved templates.
                <button type="button" onClick={() => setActiveTab("templates")} className="underline font-bold">Create one →</button>
              </div>
            ) : (
              <select required value={campMetaTemplate}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full p-3 bg-slate-900 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                <option value="">— Select an approved template —</option>
                {approvedTemplates.map((t: any) => (
                  <option key={t.name} value={t.name}>{t.name} ({t.language})</option>
                ))}
              </select>
            )}

            {/* Template Preview */}
            {campMetaTemplate && (
              <div className="mt-2 bg-[#0a1929] border border-white/10 rounded-xl overflow-hidden text-xs">
                <div className="bg-slate-800 px-3 py-1.5 border-b border-white/5">
                  <span className="text-slate-400 text-[10px] font-bold uppercase">📱 Preview</span>
                </div>
                <div className="p-3 space-y-1.5">
                  {previewHeader?.text && <p className="text-white font-bold text-sm">{previewHeader.text}</p>}
                  {previewBody?.text && <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{previewBody.text}</p>}
                  {previewFooter?.text && <p className="text-slate-500 text-[10px] italic">{previewFooter.text}</p>}
                  {previewButtons?.buttons?.length > 0 && (
                    <div className="border-t border-white/10 pt-2 space-y-1 mt-1">
                      {previewButtons.buttons.map((btn: any, i: number) => (
                        <div key={i} className="text-center py-1.5 border border-teal-500/30 rounded-lg text-teal-400 text-[11px] font-bold">
                          {btn.type === "QUICK_REPLY" ? "↩ " : btn.type === "URL" ? "🔗 " : btn.type === "COPY_CODE" ? "📋 " : "📞 "}
                          {btn.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Variable Mapping */}
            {campVariableMapping.length > 0 && (
              <div className="mt-3 bg-slate-900/60 p-4 rounded-xl border border-white/5 space-y-2">
                <label className="text-xs font-bold text-teal-400 block">Map Template Variables</label>
                {campVariableMapping.map((val, idx) => {
                  const src = campVariableSources[idx] || "body";
                  const isButton = src.startsWith("button_");
                  const isCoupon = src.startsWith("button_coupon_");
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center w-16 shrink-0">
                          <span className="text-[10px] font-mono text-slate-400">{`{{${idx + 1}}}`}</span>
                          {isButton && (
                            <span className={`text-[8px] font-bold px-1 rounded mt-0.5 ${isCoupon ? "bg-yellow-500/20 text-yellow-400" : "bg-teal-500/20 text-teal-400"}`}>
                              {isCoupon ? "COUPON" : "URL BTN"}
                            </span>
                          )}
                        </div>
                        <select
                          value={val}
                          onChange={(e) => {
                            const newMap = [...campVariableMapping];
                            newMap[idx] = e.target.value;
                            setCampVariableMapping(newMap);
                          }}
                          className={`flex-1 p-2 bg-slate-800 border rounded-lg text-xs text-white ${isButton ? "border-teal-500/30" : "border-white/10"}`}
                        >
                          {VARIABLE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                      {/* Discount code input when discount_code selected */}
                      {val === "discount_code" && !isButton && (
                        <div className="ml-16">
                          <input type="text" placeholder="Enter discount code e.g. DIWALI20"
                            value={campDiscountCode}
                            onChange={(e) => setCampDiscountCode(e.target.value.toUpperCase())}
                            className="w-full p-2 bg-slate-900 border border-teal-500/30 text-white placeholder-slate-600 rounded-lg text-xs font-mono outline-none" />
                          {campDiscountCode && <p className="text-teal-400 text-[10px] mt-0.5 font-bold">🎟️ {campDiscountCode} will be sent</p>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Send To */}
          <div>
            <label className="text-xs font-bold text-slate-400 mb-2 block">Send To</label>
            <select value={campCustomerFilter} onChange={(e) => setCampCustomerFilter(e.target.value)}
              className="w-full p-3 bg-slate-900 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
              <option value="all">All Customers ({customerTotal})</option>
              <option value="abandoned">Abandoned Cart only</option>
              <option value="ordered">Placed Order only</option>
            </select>
          </div>

          {/* Schedule Toggle */}
          <div className="border border-white/10 rounded-xl overflow-hidden">
            <div className="flex">
              <button type="button" onClick={() => setCampScheduleMode("now")}
                className={`flex-1 py-3 text-sm font-bold transition flex items-center justify-center gap-2 ${campScheduleMode === "now" ? "bg-indigo-500/20 text-indigo-300 border-b-2 border-indigo-400" : "bg-slate-900 text-slate-400 hover:text-white"}`}>
                <FaPlay className="text-xs" /> Send Now
              </button>
              <button type="button" onClick={() => setCampScheduleMode("later")}
                className={`flex-1 py-3 text-sm font-bold transition flex items-center justify-center gap-2 ${campScheduleMode === "later" ? "bg-teal-500/20 text-teal-300 border-b-2 border-teal-400" : "bg-slate-900 text-slate-400 hover:text-white"}`}>
                <FaClock className="text-xs" /> Schedule
              </button>
            </div>
            {campScheduleMode === "later" && (
              <div className="p-4 bg-slate-900/50">
                <label className="text-xs font-bold text-slate-400 mb-2 block">Pick Date & Time</label>
                <input type="datetime-local" required={campScheduleMode === "later"} value={campScheduledAt}
                  min={new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16)}
                  onChange={(e) => setCampScheduledAt(e.target.value)}
                  className="w-full p-3 bg-slate-800 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
                {campScheduledAt && (
                  <p className="text-teal-400 text-xs mt-2 font-bold">
                    📅 Will send on: {new Date(campScheduledAt).toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" })}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ETA */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300 flex items-start gap-2">
            <FaClock className="mt-0.5 shrink-0" />
            <div>
              <span className="font-bold">{customerTotal} customers × 15s = ~{Math.ceil((customerTotal * 15) / 60)} min total</span>
              <span className="text-amber-400/70 ml-2">· Customers without phone & opted-out are auto-skipped</span>
            </div>
          </div>

          {!isActive && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-400">
              ❌ Merchant must be ACTIVE to launch campaigns
            </div>
          )}

          <button type="submit" disabled={loading === "campaign" || !isActive || !campMetaTemplate || customerTotal === 0}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-bold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2 text-sm transition">
            {loading === "campaign"
              ? <><FaSpinner className="animate-spin" /> {campScheduleMode === "later" ? "Scheduling..." : "Launching..."}</>
              : campScheduleMode === "later" ? <><FaClock /> Schedule Campaign</> : <><FaPlay /> Launch Now</>}
          </button>
        </form>
      </div>

      {/* Campaign History */}
      {campaigns.length > 0 && (
        <div className="bg-slate-800 border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <span className="text-white font-bold text-sm">Campaign History</span>
            <span className="text-slate-500 text-xs">{campaigns.length} campaigns</span>
          </div>
          <div className="divide-y divide-white/5">
            {campaigns.map((c: any) => (
              <div key={c.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-bold text-sm">{c.name}</p>
                    {c.metaTemplateName && <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-mono">{c.metaTemplateName}</span>}
                    {c.discountCode && <span className="text-[10px] bg-green-500/10 border border-green-500/20 text-green-300 px-1.5 py-0.5 rounded font-mono">{c.discountCode}</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <p className="text-slate-500 text-xs">{new Date(c.createdAt).toLocaleDateString("en-IN")}</p>
                    {c.scheduledAt && <p className="text-teal-400 text-xs font-bold">📅 {new Date(c.scheduledAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>}
                    <p className="text-slate-400 text-xs">{c.sentCount}/{c.totalRecipients} sent</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[10px] font-extrabold px-2 py-1 rounded-full border ${
                    c.status === "COMPLETED" ? "bg-green-500/10 border-green-500/20 text-green-400" :
                    c.status === "SENDING"   ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
                    c.status === "SCHEDULED" ? "bg-teal-500/10 border-teal-500/20 text-teal-400" :
                    c.status === "CANCELLED" ? "bg-red-500/10 border-red-500/20 text-red-400" :
                                               "bg-slate-700 border-white/10 text-slate-400"
                  }`}>
                    {c.status === "SCHEDULED" ? "📅 " : ""}{c.status}
                  </span>
                  {c.status === "SCHEDULED" && (
                    <button onClick={() => handleCancelCampaign(c.id)}
                      className="text-[10px] px-2 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg font-bold transition">
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
