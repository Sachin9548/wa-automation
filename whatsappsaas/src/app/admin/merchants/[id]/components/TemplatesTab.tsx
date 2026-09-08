"use client";
import { useState } from "react";
import { FaTag, FaChartBar, FaSync, FaSpinner, FaCheckCircle, FaTimes, FaRobot } from "react-icons/fa";

// ── TemplateCard (inline — used only in this tab) ────────────────────────────
function TemplateCard({ t, bodyComp, headerComp, footerComp, onDelete }: any) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const isRejected = t.status === "REJECTED";
  const isApproved = t.status === "APPROVED";
  const isPending  = t.status === "PENDING";
  const buttonsComp = t.components?.find((c: any) => c.type === "BUTTONS");

  const handleDelete = async () => {
    if (!confirm(`Delete template "${t.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try { await onDelete(t.name); } finally { setDeleting(false); }
  };

  const copyName = () => {
    navigator.clipboard.writeText(t.name).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className={`bg-slate-900 border rounded-xl overflow-hidden transition ${isRejected ? "border-red-500/30" : isApproved ? "border-green-500/20" : "border-white/5"}`}>
      <div className="flex items-center gap-2 p-3 md:p-4">
        <button onClick={() => setExpanded(!expanded)} className="flex-1 text-left flex items-start gap-3 hover:opacity-80 transition min-w-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-white font-bold text-sm font-mono truncate max-w-[160px]">{t.name}</span>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border shrink-0 ${isApproved ? "bg-green-500/10 border-green-500/20 text-green-400" : isPending ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
                {t.status}
              </span>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <span className="bg-slate-800 text-slate-400 text-[10px] px-1.5 py-0.5 rounded">{t.language}</span>
              <span className="bg-slate-800 text-slate-400 text-[10px] px-1.5 py-0.5 rounded">{t.category}</span>
              {buttonsComp && <span className="bg-blue-500/10 text-blue-400 text-[10px] px-1.5 py-0.5 rounded border border-blue-500/20">{buttonsComp.buttons?.length}btn</span>}
            </div>
          </div>
          <span className="text-slate-500 text-xs mt-1 shrink-0">{expanded ? "▲" : "▼"}</span>
        </button>
        <button onClick={copyName} title="Copy template name"
          className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border transition text-xs ${copied ? "bg-green-500/20 border-green-500/30 text-green-400" : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-400"}`}>
          {copied ? "✓" : <FaTag className="text-[10px]" />}
        </button>
        <button onClick={handleDelete} disabled={deleting} title="Delete template"
          className="shrink-0 w-8 h-8 flex items-center justify-center bg-red-500/10 hover:bg-red-500/30 border border-red-500/20 text-red-400 rounded-lg transition disabled:opacity-40">
          {deleting ? <FaSpinner className="animate-spin text-xs" /> : <FaTimes className="text-xs" />}
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
          {isRejected && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <p className="text-red-400 text-xs font-bold mb-1">❌ Rejection Reason</p>
              <p className="text-red-300 text-xs">{t.rejected_reason || "No specific reason provided by Meta"}</p>
              <div className="mt-2 bg-slate-900 rounded-lg p-2 text-[11px] text-slate-400">
                <p className="font-bold text-slate-300 mb-1">Common reasons:</p>
                <ul className="space-y-0.5 list-disc list-inside">
                  <li>Variables must be {`{{1}}`}, {`{{2}}`} not {`{{name}}`}</li>
                  <li>Template name: lowercase + underscores only</li>
                  <li>UTILITY category cannot have promotional language</li>
                  <li>Content violates Meta commerce/messaging policy</li>
                </ul>
              </div>
            </div>
          )}
          <div className="bg-[#0b141a] rounded-xl p-4 space-y-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">📱 WhatsApp Preview</p>
            <div className="bg-[#202c33] rounded-xl p-3 space-y-2 max-w-xs">
              {headerComp && <p className="text-white font-bold text-sm">{headerComp.text || `[${headerComp.format} Header]`}</p>}
              {bodyComp && <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{bodyComp.text}</p>}
              {footerComp && <p className="text-slate-500 text-xs">{footerComp.text}</p>}
            </div>
            {buttonsComp && buttonsComp.buttons?.length > 0 && (
              <div className="space-y-1 mt-1">
                {buttonsComp.buttons.map((btn: any, i: number) => (
                  <div key={i} className="bg-[#202c33] rounded-xl px-3 py-2 text-center">
                    <span className="text-blue-400 text-xs font-bold">
                      {btn.type === "URL" ? "🔗" : btn.type === "PHONE_NUMBER" ? "📞" : "↩"} {btn.text}
                    </span>
                    {btn.url && <span className="text-slate-500 text-[10px] block truncate">{btn.url}</span>}
                    {btn.phone_number && <span className="text-slate-500 text-[10px] block">{btn.phone_number}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main TemplatesTab ─────────────────────────────────────────────────────────
interface TemplatesTabProps {
  loading: string | null;
  metaTemplates: any[];
  tmplName: string; setTmplName: (v: string) => void;
  tmplBody: string; setTmplBody: (v: string) => void;
  tmplHeader: string; setTmplHeader: (v: string) => void;
  tmplFooter: string; setTmplFooter: (v: string) => void;
  tmplCategory: string; setTmplCategory: (v: string) => void;
  tmplLanguage: string; setTmplLanguage: (v: string) => void;
  tmplButtons: Array<{ type: string; text: string; url?: string; phone_number?: string }>;
  setTmplButtons: React.Dispatch<React.SetStateAction<Array<{ type: string; text: string; url?: string; phone_number?: string }>>>;
  tmplFilter: "ALL" | "APPROVED" | "PENDING" | "REJECTED";
  setTmplFilter: (v: "ALL" | "APPROVED" | "PENDING" | "REJECTED") => void;
  handleCreateTemplate: (e: React.FormEvent) => void;
  handleDeleteTemplate: (name: string) => void;
  fetchMetaTemplates: () => void;
}

export default function TemplatesTab({
  loading, metaTemplates,
  tmplName, setTmplName, tmplBody, setTmplBody, tmplHeader, setTmplHeader,
  tmplFooter, setTmplFooter, tmplCategory, setTmplCategory, tmplLanguage, setTmplLanguage,
  tmplButtons, setTmplButtons, tmplFilter, setTmplFilter,
  handleCreateTemplate, handleDeleteTemplate, fetchMetaTemplates,
}: TemplatesTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create template */}
        <div className="bg-slate-800 border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2">
            <FaTag className="text-indigo-400" />
            <div>
              <p className="text-white font-extrabold">Create New Template</p>
              <p className="text-slate-400 text-xs">Submit to Meta for approval (~24hrs)</p>
            </div>
          </div>
          <form onSubmit={handleCreateTemplate} className="p-5 space-y-4">
            {/* Name + Category */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Template Name <span className="text-red-400">*</span></label>
                <input type="text" required placeholder="abandoned_cart_v1" value={tmplName}
                  onChange={(e) => setTmplName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"))}
                  className="w-full p-2.5 bg-slate-900 border border-white/10 text-white placeholder-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                <p className="text-slate-600 text-[10px] mt-1">lowercase + underscores only</p>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Category</label>
                <select value={tmplCategory} onChange={(e) => setTmplCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                  <option value="MARKETING">MARKETING</option>
                  <option value="UTILITY">UTILITY</option>
                  <option value="AUTHENTICATION">AUTHENTICATION</option>
                </select>
              </div>
            </div>

            {/* Language */}
            <div>
              <label className="text-xs font-bold text-slate-400 mb-1 block">Language</label>
              <select value={tmplLanguage} onChange={(e) => setTmplLanguage(e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                <option value="en_US">English (US)</option>
                <option value="en">English (UK)</option>
                <option value="hi">Hindi — हिंदी</option>
                <option value="mr">Marathi — मराठी</option>
                <option value="gu">Gujarati — ગુજરાતી</option>
                <option value="ta">Tamil — தமிழ்</option>
                <option value="te">Telugu — తెలుగు</option>
                <option value="kn">Kannada — ಕನ್ನಡ</option>
              </select>
            </div>

            {/* Header */}
            <div>
              <label className="text-xs font-bold text-slate-400 mb-1 block">Header <span className="text-slate-600">(optional)</span></label>
              <input type="text" placeholder="Your order is confirmed! ✅" value={tmplHeader} onChange={(e) => setTmplHeader(e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-white/10 text-white placeholder-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
            </div>

            {/* Body */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-400">Body Text <span className="text-red-400">*</span></label>
                <span className="text-[10px] text-slate-600">{tmplBody.length} chars</span>
              </div>
              <textarea rows={5} required placeholder={"Hi {{1}}, your order for {{2}} has been confirmed!\n\nTrack it here: {{3}}"}
                value={tmplBody} onChange={(e) => setTmplBody(e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-white/10 text-white placeholder-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none font-mono leading-relaxed" />
              <p className="text-slate-600 text-[10px] mt-1">Use {`{{1}}`} {`{{2}}`} {`{{3}}`} for variables</p>
            </div>

            {/* Footer */}
            <div>
              <label className="text-xs font-bold text-slate-400 mb-1 block">Footer <span className="text-slate-600">(optional)</span></label>
              <input type="text" placeholder="Reply STOP to unsubscribe" value={tmplFooter} onChange={(e) => setTmplFooter(e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-white/10 text-white placeholder-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
            </div>

            {/* Buttons */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-400">Buttons <span className="text-slate-600">(optional, max 3)</span></label>
                {tmplButtons.length < 3 && (
                  <div className="flex gap-1.5">
                    {[
                      { type: "URL", label: "🔗 URL", defaultText: "Shop Now" },
                      { type: "PHONE_NUMBER", label: "📞 Call", defaultText: "Call Us" },
                      { type: "QUICK_REPLY", label: "↩ Reply", defaultText: "STOP" },
                    ].map((b) => (
                      <button key={b.type} type="button"
                        onClick={() => setTmplButtons((prev) => [...prev, { type: b.type, text: b.defaultText, url: b.type === "URL" ? "" : undefined, phone_number: b.type === "PHONE_NUMBER" ? "" : undefined }])}
                        className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white text-[10px] font-bold rounded-lg transition">
                        + {b.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {tmplButtons.length > 0 && (
                <div className="space-y-2">
                  {tmplButtons.map((btn, i) => (
                    <div key={i} className="bg-slate-900 border border-white/10 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          {btn.type === "URL" ? "🔗 URL Button" : btn.type === "PHONE_NUMBER" ? "📞 Phone Button" : "↩ Quick Reply"}
                        </span>
                        <button type="button" onClick={() => setTmplButtons((prev) => prev.filter((_, idx) => idx !== i))}
                          className="text-red-400 hover:text-red-300 text-xs">✕ Remove</button>
                      </div>
                      <input type="text" placeholder="Button label" value={btn.text}
                        onChange={(e) => setTmplButtons((prev) => prev.map((b, idx) => idx === i ? { ...b, text: e.target.value } : b))}
                        className="w-full p-2 bg-slate-800 border border-white/10 text-white placeholder-slate-600 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500" />
                      {btn.type === "URL" && (
                        <input type="url" placeholder="https://yourstore.com" value={btn.url || ""}
                          onChange={(e) => setTmplButtons((prev) => prev.map((b, idx) => idx === i ? { ...b, url: e.target.value } : b))}
                          className="w-full p-2 bg-slate-800 border border-white/10 text-white placeholder-slate-600 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500" />
                      )}
                      {btn.type === "PHONE_NUMBER" && (
                        <input type="tel" placeholder="+919876543210" value={btn.phone_number || ""}
                          onChange={(e) => setTmplButtons((prev) => prev.map((b, idx) => idx === i ? { ...b, phone_number: e.target.value } : b))}
                          className="w-full p-2 bg-slate-800 border border-white/10 text-white placeholder-slate-600 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Preview */}
            {(tmplHeader || tmplBody || tmplFooter || tmplButtons.length > 0) && (
              <div className="bg-[#0b141a] rounded-xl p-4">
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">📱 Preview</p>
                <div className="bg-[#202c33] rounded-xl p-3 space-y-1.5 max-w-xs">
                  {tmplHeader && <p className="text-white font-bold text-sm">{tmplHeader}</p>}
                  {tmplBody && <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{tmplBody}</p>}
                  {tmplFooter && <p className="text-slate-500 text-xs">{tmplFooter}</p>}
                </div>
                {tmplButtons.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {tmplButtons.map((btn, i) => (
                      <div key={i} className="bg-[#202c33] rounded-xl px-3 py-2 text-center">
                        <span className="text-blue-400 text-xs font-bold">
                          {btn.type === "URL" ? "🔗" : btn.type === "PHONE_NUMBER" ? "📞" : "↩"} {btn.text || "..."}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button type="submit" disabled={loading === "tmpl-create"}
              className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-3 rounded-xl disabled:opacity-40 flex items-center justify-center gap-2 transition text-sm">
              {loading === "tmpl-create" ? <><FaSpinner className="animate-spin" /> Submitting...</> : <><FaCheckCircle /> Submit for Approval</>}
            </button>
          </form>
        </div>

        {/* Template Library */}
        <div className="bg-slate-800 border border-white/5 rounded-2xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-white/5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FaChartBar className="text-teal-400" />
                <p className="text-white font-extrabold">Template Library</p>
                <span className="text-slate-500 text-xs">({metaTemplates.length})</span>
              </div>
              <button onClick={fetchMetaTemplates} disabled={loading === "tmpl-fetch"}
                className="bg-teal-500/20 hover:bg-teal-500 border border-teal-500/30 text-teal-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-40">
                {loading === "tmpl-fetch" ? <FaSpinner className="animate-spin" /> : <FaSync />} Refresh
              </button>
            </div>
            {metaTemplates.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {(["ALL", "APPROVED", "PENDING", "REJECTED"] as const).map((f) => {
                  const count = f === "ALL" ? metaTemplates.length : metaTemplates.filter((t) => t.status === f).length;
                  return (
                    <button key={f} onClick={() => setTmplFilter(f)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                        tmplFilter === f
                          ? f === "APPROVED" ? "bg-green-500/20 border-green-500/30 text-green-400"
                            : f === "PENDING" ? "bg-amber-500/20 border-amber-500/30 text-amber-400"
                            : f === "REJECTED" ? "bg-red-500/20 border-red-500/30 text-red-400"
                            : "bg-teal-500/20 border-teal-500/30 text-teal-300"
                          : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                      }`}>
                      {f} {count > 0 && `(${count})`}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex-1 p-4 space-y-3 overflow-y-auto" style={{ maxHeight: "520px" }}>
            {loading === "tmpl-fetch" ? (
              <div className="flex items-center justify-center py-12 gap-3">
                <FaSpinner className="animate-spin text-teal-400" />
                <span className="text-slate-400 text-sm">Loading from Meta...</span>
              </div>
            ) : metaTemplates.length === 0 ? (
              <div className="text-center py-12">
                <FaTag className="text-slate-600 text-3xl mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No templates yet</p>
                <p className="text-slate-600 text-xs mt-1">Create one using the form on the left</p>
              </div>
            ) : (() => {
              const filtered = tmplFilter === "ALL" ? metaTemplates : metaTemplates.filter((t) => t.status === tmplFilter);
              return filtered.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500 text-sm">No {tmplFilter.toLowerCase()} templates</p>
                </div>
              ) : filtered.map((t: any, i: number) => (
                <TemplateCard key={t.id || i} t={t}
                  bodyComp={t.components?.find((c: any) => c.type === "BODY")}
                  headerComp={t.components?.find((c: any) => c.type === "HEADER")}
                  footerComp={t.components?.find((c: any) => c.type === "FOOTER")}
                  onDelete={handleDeleteTemplate} />
              ));
            })()}
          </div>
        </div>
      </div>

      <div className="bg-blue-900/20 border border-blue-500/20 rounded-xl p-4 text-sm text-slate-400 flex items-start gap-3">
        <FaRobot className="text-blue-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-blue-300 font-bold mb-1">After Approval</p>
          <p>Once template status shows <span className="text-green-400 font-bold">APPROVED</span>, go to <strong>Flows tab</strong> and set the{" "}
            <code className="bg-slate-800 text-teal-300 px-1 rounded">metaTemplateName</code> field.
            Use the <span className="text-white font-bold">copy button (🏷️)</span> on each template card to quickly copy the name.</p>
        </div>
      </div>
    </div>
  );
}
