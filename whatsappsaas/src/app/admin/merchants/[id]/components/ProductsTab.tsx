"use client";
import { FaSpinner, FaSync } from "react-icons/fa";

interface ProductsTabProps {
  isActive: boolean;
  customerTotal: number;
  mpmMode: "catalog" | "mpm"; setMpmMode: (v: "catalog" | "mpm") => void;
  mpmTemplate: string; setMpmTemplate: (v: string) => void;
  mpmLang: string; setMpmLang: (v: string) => void;
  mpmBodyVars: string; setMpmBodyVars: (v: string) => void;
  mpmThumbnailId: string; setMpmThumbnailId: (v: string) => void;
  mpmSections: Array<{ title: string; products: string }>;
  setMpmSections: React.Dispatch<React.SetStateAction<Array<{ title: string; products: string }>>>;
  mpmCustomerFilter: string; setMpmCustomerFilter: (v: string) => void;
  mpmToPhone: string; setMpmToPhone: (v: string) => void;
  mpmSending: boolean;
  mpmBodyText: string; setMpmBodyText: (v: string) => void;
  mpmFooterText: string; setMpmFooterText: (v: string) => void;
  // catalog status
  catalogStatus: any;
  catalogChecking: boolean;
  fetchCatalogStatus: () => void;
  handleSendMPM: () => void;
}

export default function ProductsTab({
  isActive, customerTotal,
  mpmMode, setMpmMode, mpmTemplate, setMpmTemplate, mpmLang, setMpmLang,
  mpmBodyVars, setMpmBodyVars, mpmThumbnailId, setMpmThumbnailId,
  mpmSections, setMpmSections, mpmCustomerFilter, setMpmCustomerFilter,
  mpmToPhone, setMpmToPhone, mpmSending,
  mpmBodyText, setMpmBodyText, mpmFooterText, setMpmFooterText,
  catalogStatus, catalogChecking, fetchCatalogStatus, handleSendMPM,
}: ProductsTabProps) {
  return (
    <div className="max-w-2xl space-y-6">
      {/* Info */}
      <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-xl p-4 flex items-start gap-3">
        <span className="text-2xl shrink-0">📦</span>
        <div>
          <p className="text-indigo-300 font-bold text-sm">WhatsApp Native Product Messages</p>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed">
            Send product cards <strong className="text-white">directly inside WhatsApp</strong> — requires a <strong className="text-white">Facebook Catalog</strong> connected to your WABA.
          </p>
          <div className="flex gap-2 mt-2 flex-wrap">
            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/20 font-bold">📚 Catalog — open full catalog (24hr window)</span>
            <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/20 font-bold">📦 MPM Template — specific products (anytime)</span>
          </div>
        </div>
      </div>

      {/* Catalog Status */}
      <div className="bg-slate-800 border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <p className="text-white font-bold text-sm">Facebook Catalog Status</p>
            <p className="text-slate-500 text-xs mt-0.5">Required for product messages to work</p>
          </div>
          <button onClick={fetchCatalogStatus} disabled={catalogChecking}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white text-xs font-bold rounded-xl transition disabled:opacity-40">
            <FaSync className={catalogChecking ? "animate-spin" : ""} />
            {catalogStatus ? "Refresh" : "Check Status"}
          </button>
        </div>
        {catalogChecking && (
          <div className="px-5 py-4 flex items-center gap-3">
            <FaSpinner className="animate-spin text-teal-400" />
            <span className="text-slate-400 text-sm">Checking catalog connection...</span>
          </div>
        )}
        {!catalogStatus && !catalogChecking && (
          <div className="px-5 py-4 text-center text-slate-500 text-sm">Click "Check Status" to verify your Facebook Catalog connection</div>
        )}
        {catalogStatus && !catalogChecking && (
          <div className="p-5 space-y-4">
            <div className={`rounded-xl p-4 border flex items-start gap-3 ${catalogStatus.connected ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"}`}>
              <span className="text-xl shrink-0">{catalogStatus.connected ? "✅" : "❌"}</span>
              <div className="flex-1">
                <p className={`font-bold text-sm ${catalogStatus.connected ? "text-green-400" : "text-red-400"}`}>
                  {catalogStatus.connected ? "Catalog Connected!" : "Catalog Not Connected"}
                </p>
                <p className="text-slate-400 text-xs mt-1">{catalogStatus.connected ? catalogStatus.message : catalogStatus.reason}</p>
                {!catalogStatus.connected && catalogStatus.howToFix && (
                  <p className="text-yellow-400 text-xs mt-2 font-bold">💡 Fix: {catalogStatus.howToFix}</p>
                )}
              </div>
            </div>
            {catalogStatus.connected && catalogStatus.catalogs?.length > 0 && (
              <div className="space-y-2">
                <p className="text-slate-400 text-xs font-bold uppercase">Connected Catalogs</p>
                {catalogStatus.catalogs.map((cat: any) => (
                  <div key={cat.id} className="bg-slate-900 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-bold">{cat.name}</p>
                      <p className="text-slate-500 text-xs font-mono">ID: {cat.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-teal-400 text-sm font-bold">{cat.productCount}</p>
                      <p className="text-slate-600 text-[10px]">products</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {catalogStatus.connected && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-xs text-blue-300 space-y-2">
                <p className="font-bold text-blue-200">📱 How customers shop via WhatsApp:</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-300">
                  <li>Customer receives product cards in WhatsApp</li>
                  <li>Taps &quot;View Item&quot; or &quot;View Catalog&quot;</li>
                  <li>Browses products inside WhatsApp</li>
                  <li>Taps product → redirected to your Shopify store</li>
                  <li>Completes checkout on website</li>
                </ol>
                <p className="text-slate-500 text-[10px] mt-1">Note: Full in-app checkout requires additional Meta approval.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mode toggle */}
      <div className="border border-white/10 rounded-xl overflow-hidden">
        <div className="flex">
          <button type="button" onClick={() => setMpmMode("catalog")}
            className={`flex-1 py-3 text-sm font-bold transition flex items-center justify-center gap-2 ${mpmMode === "catalog" ? "bg-blue-500/20 text-blue-300 border-b-2 border-blue-400" : "bg-slate-900 text-slate-400 hover:text-white"}`}>
            📚 Catalog Message
          </button>
          <button type="button" onClick={() => setMpmMode("mpm")}
            className={`flex-1 py-3 text-sm font-bold transition flex items-center justify-center gap-2 ${mpmMode === "mpm" ? "bg-purple-500/20 text-purple-300 border-b-2 border-purple-400" : "bg-slate-900 text-slate-400 hover:text-white"}`}>
            📦 MPM Template
          </button>
        </div>

        <div className="p-5 space-y-4">
          {mpmMode === "catalog" && (
            <>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-300">
                Sends a <strong>&quot;View Catalog&quot;</strong> button message. Only works within <strong>24hr window</strong>.
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Customer Phone <span className="text-red-400">*</span></label>
                <input type="tel" placeholder="918805155743" value={mpmToPhone} onChange={(e) => setMpmToPhone(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-white/10 text-white placeholder-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Message Body <span className="text-red-400">*</span></label>
                <textarea rows={3} value={mpmBodyText} onChange={(e) => setMpmBodyText(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Footer <span className="text-slate-600">(optional)</span></label>
                <input type="text" placeholder="Tap 'View Catalog' to browse" value={mpmFooterText} onChange={(e) => setMpmFooterText(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-white/10 text-white placeholder-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Thumbnail Product Retailer ID <span className="text-slate-600">(optional)</span></label>
                <input type="text" placeholder="e.g. SKU-1234" value={mpmThumbnailId} onChange={(e) => setMpmThumbnailId(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-white/10 text-white placeholder-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono" />
              </div>
            </>
          )}

          {mpmMode === "mpm" && (
            <>
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 text-xs text-purple-300">
                Uses an approved <strong>MPM template</strong> — works anytime, can send to single contact or bulk.
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">MPM Template Name <span className="text-red-400">*</span></label>
                  <input type="text" placeholder="abandoned_cart_mpm" value={mpmTemplate}
                    onChange={(e) => setMpmTemplate(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                    className="w-full p-3 bg-slate-900 border border-white/10 text-white placeholder-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm font-mono" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">Language</label>
                  <select value={mpmLang} onChange={(e) => setMpmLang(e.target.value)}
                    className="w-full p-3 bg-slate-900 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm">
                    <option value="en_US">English (US)</option>
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Body Variables <span className="text-slate-600">(comma-separated)</span></label>
                <input type="text" placeholder="Sachin, 20OFF" value={mpmBodyVars} onChange={(e) => setMpmBodyVars(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-white/10 text-white placeholder-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm font-mono" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Thumbnail Product Retailer ID <span className="text-red-400">*</span></label>
                <input type="text" placeholder="e.g. SKU-1234" value={mpmThumbnailId} onChange={(e) => setMpmThumbnailId(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-white/10 text-white placeholder-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm font-mono" />
              </div>
              {/* Sections */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-400">Product Sections <span className="text-slate-600">(max 10, 30 products total)</span></label>
                  {mpmSections.length < 10 && (
                    <button type="button" onClick={() => setMpmSections((prev) => [...prev, { title: `Section ${prev.length + 1}`, products: "" }])}
                      className="text-[10px] px-2 py-1 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 rounded-lg font-bold transition">
                      + Add Section
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {mpmSections.map((section, i) => (
                    <div key={i} className="bg-slate-900 border border-white/10 rounded-xl p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <input type="text" placeholder="Section title" value={section.title}
                          onChange={(e) => setMpmSections((prev) => prev.map((s, idx) => idx === i ? { ...s, title: e.target.value } : s))}
                          className="flex-1 bg-slate-800 border border-white/10 text-white placeholder-slate-600 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-purple-500" />
                        {mpmSections.length > 1 && (
                          <button type="button" onClick={() => setMpmSections((prev) => prev.filter((_, idx) => idx !== i))}
                            className="text-red-400 hover:text-red-300 text-xs shrink-0">✕</button>
                        )}
                      </div>
                      <textarea rows={2} placeholder="product_id_1, product_id_2 (comma-separated retailer IDs)" value={section.products}
                        onChange={(e) => setMpmSections((prev) => prev.map((s, idx) => idx === i ? { ...s, products: e.target.value } : s))}
                        className="w-full bg-slate-800 border border-white/10 text-white placeholder-slate-600 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-purple-500 resize-none font-mono" />
                      <p className="text-slate-600 text-[10px]">
                        {section.products ? `${section.products.split(",").filter((s) => s.trim()).length} products` : "Enter retailer IDs from your Facebook Catalog"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Send target */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">Single Phone <span className="text-slate-600">(or blank for bulk)</span></label>
                  <input type="tel" placeholder="918805155743" value={mpmToPhone} onChange={(e) => setMpmToPhone(e.target.value)}
                    className="w-full p-3 bg-slate-900 border border-white/10 text-white placeholder-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm font-mono" />
                </div>
                {!mpmToPhone && (
                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-1 block">Bulk Send To</label>
                    <select value={mpmCustomerFilter} onChange={(e) => setMpmCustomerFilter(e.target.value)}
                      className="w-full p-3 bg-slate-900 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm">
                      <option value="all">All Customers ({customerTotal})</option>
                      <option value="ordered">Placed Order only</option>
                      <option value="abandoned">Abandoned Cart only</option>
                    </select>
                  </div>
                )}
              </div>
            </>
          )}

          {!isActive && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-400">❌ Merchant must be ACTIVE to send product messages</div>}

          <button onClick={handleSendMPM} disabled={mpmSending || !isActive}
            className={`w-full py-3.5 font-bold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2 text-sm transition ${mpmMode === "catalog" ? "bg-blue-500 hover:bg-blue-400 text-white" : "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white"}`}>
            {mpmSending ? <><FaSpinner className="animate-spin" /> Sending...</> : mpmMode === "catalog" ? "📚 Send Catalog Message" : `📦 Send Product Cards${!mpmToPhone ? ` (${mpmCustomerFilter === "all" ? customerTotal : "?"} customers)` : ""}`}
          </button>
        </div>
      </div>

      {/* Checklist */}
      <div className="bg-slate-800 border border-white/5 rounded-2xl p-5 space-y-3">
        <p className="text-white font-bold text-sm">✅ Setup Checklist</p>
        <div className="space-y-2 text-xs">
          {[
            { label: "Facebook Business Account verified", done: true },
            { label: "Facebook Catalog created in Commerce Manager", done: false },
            { label: "Catalog connected to your WABA", done: false },
            { label: "Products synced to catalog (retailer IDs = Shopify SKUs)", done: false },
            { label: "MPM template approved in Meta (for template mode)", done: false },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className={item.done ? "text-green-400" : "text-slate-600"}>{item.done ? "✅" : "⬜"}</span>
              <span className={item.done ? "text-slate-300" : "text-slate-500"}>{item.label}</span>
            </div>
          ))}
        </div>
        <p className="text-slate-600 text-[10px]">Setup: Commerce Manager → Catalog → Connect to WhatsApp Business Account</p>
      </div>
    </div>
  );
}
