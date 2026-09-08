"use client";
import { FaEnvelope, FaCheckDouble, FaMousePointer, FaRupeeSign, FaShieldAlt, FaSpinner, FaCheckCircle, FaSync, FaToggleOn, FaToggleOff, FaWhatsapp } from "react-icons/fa";

interface OverviewTabProps {
  merchant: any;
  isActive: boolean;
  loading: string | null;
  payments: any[];
  campaigns: any[];
  // red flags
  redFlags: any; redFlagsLoading: boolean; fetchRedFlags: () => void;
  // waba info
  wabaInfo: any; wabaLoading: boolean; fetchWabaInfo: () => void;
  // roi
  roiReport: any; roiLoading: boolean; roiDays: number; roiFee: string; roiCopied: boolean;
  setRoiDays: (v: number) => void; setRoiFee: (v: string) => void;
  generateRoiReport: (days: number, fee: string) => void; copyRoiMessage: () => void;
  // ai
  aiAutoReply: boolean; setAiAutoReply: (v: boolean) => void;
  aiKnowledgeBase: string; setAiKnowledgeBase: (v: string) => void;
  aiFallbackMessage: string; setAiFallbackMessage: (v: string) => void;
  aiSaving: boolean; saveAISettings: () => void;
  // service / activate
  category: string; setCategory: (v: string) => void;
  shopifyToken: string; setShopifyToken: (v: string) => void;
  shopifySecret: string; setShopifySecret: (v: string) => void;
  storeUrl: string; setStoreUrl: (v: string) => void;
  metaPhoneNumberId: string; setMetaPhoneNumberId: (v: string) => void;
  metaAccessToken: string; setMetaAccessToken: (v: string) => void;
  metaWabaId: string; setMetaWabaId: (v: string) => void;
  payAmount: string; setPayAmount: (v: string) => void;
  payDays: string; setPayDays: (v: string) => void;
  payNote: string; setPayNote: (v: string) => void;
  action: (endpoint: string, data: any, label: string) => void;
  handleToggleService: (active: boolean) => void;
  handleSetFree: (isFree: boolean) => void;
  handleAddPayment: (e: React.FormEvent) => void;
}

export default function OverviewTab({
  merchant, isActive, loading, payments, campaigns,
  redFlags, redFlagsLoading, fetchRedFlags,
  wabaInfo, wabaLoading, fetchWabaInfo,
  roiReport, roiLoading, roiDays, roiFee, roiCopied, setRoiDays, setRoiFee, generateRoiReport, copyRoiMessage,
  aiAutoReply, setAiAutoReply, aiKnowledgeBase, setAiKnowledgeBase, aiFallbackMessage, setAiFallbackMessage, aiSaving, saveAISettings,
  category, setCategory, shopifyToken, setShopifyToken, shopifySecret, setShopifySecret,
  storeUrl, setStoreUrl, metaPhoneNumberId, setMetaPhoneNumberId, metaAccessToken, setMetaAccessToken, metaWabaId, setMetaWabaId,
  payAmount, setPayAmount, payDays, setPayDays, payNote, setPayNote,
  action, handleToggleService, handleSetFree, handleAddPayment,
}: OverviewTabProps) {
  return (
    <div className="space-y-6">

      {/* Red Flags */}
      {(redFlags?.flagCount > 0 || redFlagsLoading) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${redFlags?.overall === "error" ? "bg-red-400 animate-pulse" : redFlags?.overall === "warning" ? "bg-yellow-400 animate-pulse" : "bg-green-400"}`} />
              <p className="text-white font-bold text-sm">
                {redFlagsLoading ? "Checking alerts..." : redFlags?.overall === "ok" ? "✅ All clear — no issues found" : `🚨 ${redFlags?.flagCount} alert${redFlags?.flagCount > 1 ? "s" : ""} found`}
              </p>
            </div>
            <button onClick={fetchRedFlags} disabled={redFlagsLoading} className="text-xs text-slate-500 hover:text-slate-300 font-bold transition">Refresh</button>
          </div>
          {redFlags?.flags?.map((flag: any) => (
            <div key={flag.code} className={`rounded-xl p-4 border flex items-start gap-3 ${flag.level === "error" ? "bg-red-500/10 border-red-500/20" : flag.level === "warning" ? "bg-yellow-500/10 border-yellow-500/20" : "bg-blue-500/10 border-blue-500/20"}`}>
              <span className="text-xl mt-0.5 flex-shrink-0">{flag.level === "error" ? "🔴" : flag.level === "warning" ? "🟡" : "ℹ️"}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`font-bold text-sm ${flag.level === "error" ? "text-red-400" : flag.level === "warning" ? "text-yellow-400" : "text-blue-400"}`}>{flag.message}</p>
                  <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${flag.level === "error" ? "bg-red-500/20 text-red-400" : flag.level === "warning" ? "bg-yellow-500/20 text-yellow-400" : "bg-blue-500/20 text-blue-400"}`}>{flag.level}</span>
                </div>
                <p className="text-slate-400 text-xs mt-1">💡 {flag.action}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {redFlags && redFlags.flagCount === 0 && !redFlagsLoading && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex items-center gap-3">
          <span className="text-green-400 text-lg">✅</span>
          <div>
            <p className="text-green-400 font-bold text-sm">All systems healthy</p>
            <p className="text-slate-500 text-xs">No issues detected for this merchant</p>
          </div>
          <button onClick={fetchRedFlags} className="ml-auto text-xs text-slate-500 hover:text-slate-300 font-bold transition">Refresh</button>
        </div>
      )}

      {/* Analytics cards */}
      {isActive && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <FaEnvelope />, label: "Sent",    value: merchant?.totalSent ?? 0,                              bg: "bg-teal-500/10",   c: "text-teal-400" },
            { icon: <FaCheckDouble />, label: "Read", value: merchant?.totalRead ?? 0,                              bg: "bg-blue-500/10",   c: "text-blue-400" },
            { icon: <FaMousePointer />, label: "Clicks", value: merchant?.totalClicked ?? 0,                        bg: "bg-orange-500/10", c: "text-orange-400" },
            { icon: <FaRupeeSign />, label: "Revenue", value: `₹${(merchant?.recoveredRevenue || 0).toFixed(2)}`,  bg: "bg-green-500/10",  c: "text-green-400" },
          ].map((s) => (
            <div key={s.label} className="bg-slate-800 border border-white/5 rounded-2xl p-5">
              <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mb-3`}><span className={s.c}>{s.icon}</span></div>
              <p className="text-2xl font-extrabold text-white">{s.value}</p>
              <p className="text-slate-400 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Activate OR Active section */}
      {!isActive ? (
        <div className="bg-slate-800 border border-red-500/20 rounded-2xl overflow-hidden">
          <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-4 flex items-center gap-3">
            <FaShieldAlt className="text-red-400" />
            <div><p className="text-white font-extrabold">Activate Merchant</p><p className="text-slate-400 text-xs">Enter Shopify credentials</p></div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 mb-1 block">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-3 bg-slate-900 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-teal-500">
                <option value="ECOMMERCE">E-Commerce</option>
                <option value="RESTAURANT">Restaurant</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 mb-1 block">Store URL</label>
              <input type="text" placeholder="https://yourstore.myshopify.com" value={storeUrl} onChange={(e) => setStoreUrl(e.target.value)}
                className="w-full p-3 bg-slate-900 border border-white/10 text-white placeholder-slate-500 rounded-xl outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 mb-1 block">Shopify Admin Token</label>
              <input type="text" placeholder="shpat_..." value={shopifyToken} onChange={(e) => setShopifyToken(e.target.value)}
                className="w-full p-3 bg-slate-900 border border-white/10 text-white placeholder-slate-500 rounded-xl outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 mb-1 block">Webhook Secret</label>
              <input type="text" placeholder="From Shopify → Settings → Notifications" value={shopifySecret} onChange={(e) => setShopifySecret(e.target.value)}
                className="w-full p-3 bg-slate-900 border border-white/10 text-white placeholder-slate-500 rounded-xl outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div className="md:col-span-2 border-t border-white/5 pt-4">
              <p className="text-teal-400 text-xs font-bold uppercase tracking-wider mb-3">Meta WhatsApp Cloud API</p>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 mb-1 block">Phone Number ID</label>
              <input type="text" placeholder="120364xxxxxxxxxx" value={metaPhoneNumberId} onChange={(e) => setMetaPhoneNumberId(e.target.value)}
                className="w-full p-3 bg-slate-900 border border-white/10 text-white placeholder-slate-500 rounded-xl outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 mb-1 block">WABA ID</label>
              <input type="text" placeholder="WhatsApp Business Account ID" value={metaWabaId} onChange={(e) => setMetaWabaId(e.target.value)}
                className="w-full p-3 bg-slate-900 border border-white/10 text-white placeholder-slate-500 rounded-xl outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-400 mb-1 block">Permanent Access Token</label>
              <input type="password" placeholder="EAAxxxxxxxxxxxxxxxxx" value={metaAccessToken} onChange={(e) => setMetaAccessToken(e.target.value)}
                className="w-full p-3 bg-slate-900 border border-white/10 text-white placeholder-slate-500 rounded-xl outline-none focus:ring-2 focus:ring-teal-500" />
              <p className="text-slate-500 text-xs mt-1">Generate from Business Settings → System Users → Generate Token (never expires)</p>
            </div>
            <div className="md:col-span-2">
              <button onClick={() => action("activate", { shopifyToken, shopifySecret, category, storeUrl, metaPhoneNumberId, metaAccessToken, metaWabaId }, "activate")}
                disabled={!shopifyToken || !shopifySecret || loading === "activate"}
                className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white p-3.5 rounded-xl font-bold disabled:opacity-40 flex justify-center items-center gap-2">
                {loading === "activate" ? <><FaSpinner className="animate-spin" /> Verifying...</> : <><FaCheckCircle /> Verify &amp; Activate</>}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Service + Free toggles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-slate-800 border border-white/5 rounded-2xl p-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Service Status</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-lg font-extrabold ${merchant?.serviceActive ? "text-green-400" : "text-red-400"}`}>
                    {merchant?.serviceActive ? "● Active — Messages Sending" : "● Paused — Messages Stopped"}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">Toggle to pause/resume all WhatsApp messages</p>
                </div>
                <button onClick={() => handleToggleService(!merchant?.serviceActive)} disabled={loading === "service"}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm border transition ${merchant?.serviceActive ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20" : "bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20"}`}>
                  {loading === "service" ? <FaSpinner className="animate-spin" /> : merchant?.serviceActive ? <FaToggleOn className="text-xl" /> : <FaToggleOff className="text-xl" />}
                  {loading === "service" ? "Checking..." : merchant?.serviceActive ? "Turn OFF" : "Turn ON"}
                </button>
              </div>
            </div>
            <div className="bg-slate-800 border border-white/5 rounded-2xl p-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Merchant Type</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-lg font-extrabold ${merchant?.isFree ? "text-blue-400" : "text-teal-400"}`}>{merchant?.isFree ? "🎁 Free Client" : "💰 Paid Client"}</p>
                  <p className="text-slate-500 text-xs mt-1">Total collected: ₹{merchant?.totalPaidAmount?.toFixed(0) || "0"}</p>
                </div>
                <button onClick={() => handleSetFree(!merchant?.isFree)} disabled={loading === "free"}
                  className="bg-slate-700 hover:bg-slate-600 border border-white/10 text-slate-300 px-4 py-2.5 rounded-xl font-bold text-sm transition">
                  {loading === "free" ? <FaSpinner className="animate-spin" /> : merchant?.isFree ? "Mark as Paid" : "Mark as Free"}
                </button>
              </div>
            </div>
          </div>

          {/* Subscription info */}
          <div className="bg-slate-800 border border-white/5 rounded-2xl p-5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Subscription Info</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {[
                { label: "Onboarded",      value: merchant?.createdAt ? new Date(merchant.createdAt).toLocaleDateString("en-IN") : "—" },
                { label: "Plan Expiry",    value: merchant?.subscriptionExpiry ? new Date(merchant.subscriptionExpiry).toLocaleDateString("en-IN") : "No expiry set" },
                { label: "Last Payment",   value: payments.length > 0 ? new Date(payments[0].paidAt).toLocaleDateString("en-IN") : "No payments" },
                { label: "Total Payments", value: payments.length },
              ].map((s, i) => (
                <div key={i} className="bg-slate-900 rounded-xl p-3">
                  <p className="text-white font-bold text-sm">{s.value}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Add Payment */}
          <div className="bg-slate-800 border border-teal-500/20 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-teal-500/10 flex items-center gap-2">
              <FaRupeeSign className="text-teal-400" />
              <div><p className="text-white font-extrabold">Record Payment</p><p className="text-slate-400 text-xs">Add when merchant pays — extends subscription</p></div>
            </div>
            <form onSubmit={handleAddPayment} className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">Amount (₹)</label>
                  <input type="number" required placeholder="e.g. 3999" value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full p-3 bg-slate-900 border border-white/10 text-white placeholder-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">Plan Days</label>
                  <select value={payDays} onChange={(e) => setPayDays(e.target.value)}
                    className="w-full p-3 bg-slate-900 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-sm">
                    <option value="30">30 Days</option>
                    <option value="60">60 Days</option>
                    <option value="90">90 Days</option>
                    <option value="180">180 Days</option>
                    <option value="365">365 Days</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">Note (optional)</label>
                  <input type="text" placeholder="e.g. Diwali offer" value={payNote} onChange={(e) => setPayNote(e.target.value)}
                    className="w-full p-3 bg-slate-900 border border-white/10 text-white placeholder-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
                </div>
              </div>
              <button type="submit" disabled={loading === "payment" || !payAmount}
                className="w-full bg-teal-500 hover:bg-teal-400 text-white font-bold py-3 rounded-xl disabled:opacity-40 flex items-center justify-center gap-2 transition">
                {loading === "payment" ? <><FaSpinner className="animate-spin" /> Saving...</> : <><FaRupeeSign /> Record Payment &amp; Extend Subscription</>}
              </button>
            </form>
          </div>

          {/* Payment History */}
          {payments.length > 0 && (
            <div className="bg-slate-800 border border-white/5 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <p className="text-white font-bold">Payment History</p>
                <span className="text-teal-400 font-bold text-sm">Total: ₹{payments.reduce((s: number, p: any) => s + p.amount, 0).toFixed(0)}</span>
              </div>
              <div className="divide-y divide-white/5">
                {payments.map((p: any) => (
                  <div key={p.id} className="px-6 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-white font-bold text-sm">{p.amount === 0 ? "🎁 Free" : `₹${p.amount.toFixed(0)}`}<span className="text-slate-500 font-normal ml-2">— {p.planDays} days</span></p>
                      {p.note && <p className="text-slate-500 text-xs">{p.note}</p>}
                    </div>
                    <p className="text-slate-400 text-xs">{new Date(p.paidAt).toLocaleDateString("en-IN")}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Campaign History */}
      {campaigns.length > 0 && (
        <div className="bg-slate-800 border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <span className="text-white font-bold">Campaign History</span>
            <span className="text-slate-400 text-xs">{campaigns.length} campaigns</span>
          </div>
          <div className="divide-y divide-white/5">
            {campaigns.map((c: any) => (
              <div key={c.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="text-white font-bold text-sm">{c.name}</p>
                  <p className="text-slate-500 text-xs">{new Date(c.createdAt).toLocaleDateString("en-IN")}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-300 text-sm font-bold">{c.sentCount}/{c.totalRecipients}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full border ${c.status === "COMPLETED" ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"}`}>{c.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WABA Info */}
      <div className="bg-slate-800 border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaWhatsapp className="text-green-400" />
            <span className="text-white font-bold">WhatsApp Business Account</span>
            {wabaInfo && !wabaInfo.error && (
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ml-1 ${wabaInfo.qualityColor === "green" ? "bg-green-500/20 border-green-500/30 text-green-400" : wabaInfo.qualityColor === "yellow" ? "bg-yellow-500/20 border-yellow-500/30 text-yellow-400" : wabaInfo.qualityColor === "red" ? "bg-red-500/20 border-red-500/30 text-red-400 animate-pulse" : "bg-slate-700 border-white/10 text-slate-400"}`}>
                ● {wabaInfo.qualityRating}
              </span>
            )}
          </div>
          <button onClick={fetchWabaInfo} disabled={wabaLoading}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white text-xs font-bold rounded-xl transition disabled:opacity-40">
            <FaSync className={wabaLoading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
        {(!wabaInfo && !wabaLoading) && <div className="px-6 py-6 flex items-center justify-center gap-3"><FaSpinner className="animate-spin text-teal-400" /><span className="text-slate-400 text-sm">Loading WABA info...</span></div>}
        {wabaLoading && <div className="px-6 py-8 flex items-center justify-center gap-3"><FaSpinner className="animate-spin text-teal-400" /><span className="text-slate-400 text-sm">Fetching from Meta API...</span></div>}
        {wabaInfo?.error && <div className="px-6 py-4"><div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-xs">❌ {wabaInfo.error}</div></div>}
        {wabaInfo && !wabaInfo.error && (
          <div className="p-6 space-y-5">
            {wabaInfo.qualityColor === "red" && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3"><span className="text-2xl">🚨</span><div><p className="text-red-400 font-bold text-sm">Quality Rating is RED — Action Required!</p><p className="text-red-300 text-xs mt-1">Meta may restrict or block your number. Pause campaigns immediately.</p></div></div>}
            {wabaInfo.qualityColor === "yellow" && <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3"><span className="text-xl">⚠️</span><div><p className="text-yellow-400 font-bold text-sm">Quality Rating is YELLOW — Monitor Closely</p><p className="text-yellow-300 text-xs mt-1">Reduce campaign frequency to recover rating.</p></div></div>}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: "Phone Number", value: wabaInfo.phoneNumber, icon: "📞" },
                { label: "Display Name", value: wabaInfo.displayName, icon: "🏷️" },
                { label: "WABA Name",    value: wabaInfo.wabaName,    icon: "🏢" },
                { label: "Account Mode", value: wabaInfo.accountMode, icon: wabaInfo.accountMode === "LIVE" ? "🟢" : "🔵" },
                { label: "Verification", value: wabaInfo.verificationStatus, icon: "✅" },
                { label: "Review Status", value: wabaInfo.reviewStatus, icon: "📋" },
              ].map((item) => (
                <div key={item.label} className="bg-slate-900/50 rounded-xl p-3">
                  <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">{item.icon} {item.label}</p>
                  <p className="text-white text-sm font-bold truncate">{item.value || "—"}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className={`rounded-xl p-4 border ${wabaInfo.qualityColor === "green" ? "bg-green-500/10 border-green-500/20" : wabaInfo.qualityColor === "yellow" ? "bg-yellow-500/10 border-yellow-500/20" : wabaInfo.qualityColor === "red" ? "bg-red-500/10 border-red-500/20" : "bg-slate-700 border-white/10"}`}>
                <p className="text-slate-400 text-[10px] font-bold uppercase mb-2">Quality Rating</p>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${wabaInfo.qualityColor === "green" ? "bg-green-400" : wabaInfo.qualityColor === "yellow" ? "bg-yellow-400" : wabaInfo.qualityColor === "red" ? "bg-red-400 animate-pulse" : "bg-slate-500"}`} />
                  <span className={`text-xl font-extrabold ${wabaInfo.qualityColor === "green" ? "text-green-400" : wabaInfo.qualityColor === "yellow" ? "text-yellow-400" : wabaInfo.qualityColor === "red" ? "text-red-400" : "text-slate-400"}`}>{wabaInfo.qualityRating}</span>
                </div>
              </div>
              <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-4">
                <p className="text-slate-400 text-[10px] font-bold uppercase mb-2">Messaging Limit</p>
                <p className="text-teal-400 text-xl font-extrabold">{wabaInfo.messagingTier}</p>
                <div className="mt-2 flex gap-1 flex-wrap">
                  {["TIER_50","TIER_250","TIER_1K","TIER_10K","TIER_100K","UNLIMITED"].map((t, i) => {
                    const tiers = ["TIER_50","TIER_250","TIER_1K","TIER_10K","TIER_100K","UNLIMITED"];
                    const curIdx = tiers.indexOf(wabaInfo.tierRaw);
                    return <span key={t} className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${i === curIdx ? "bg-teal-500 text-white" : i < curIdx ? "bg-teal-500/20 text-teal-400" : "bg-white/5 text-slate-600"}`}>{t.replace("TIER_","").replace("K","k")}</span>;
                  })}
                </div>
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-3 space-y-1.5">
              <p className="text-slate-500 text-[10px] font-bold uppercase mb-2">Reference IDs</p>
              {[{ label: "Phone Number ID", value: wabaInfo.phoneNumberId }, { label: "WABA ID", value: wabaInfo.wabaId }].map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-4">
                  <span className="text-slate-500 text-xs">{item.label}</span>
                  <span className="text-slate-300 text-xs font-mono truncate">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ROI Report */}
      <div className="bg-slate-800 border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5"><p className="text-white font-extrabold">📊 ROI Report</p><p className="text-slate-400 text-xs mt-0.5">Generate renewal message for merchant</p></div>
        <div className="px-6 py-4 border-b border-white/5">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-slate-500 text-[10px] font-bold uppercase block mb-1.5">Period</label>
              <div className="flex gap-1.5">
                {[7, 30, 60, 90].map((d) => (
                  <button key={d} onClick={() => setRoiDays(d)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${roiDays === d ? "bg-teal-500/20 border-teal-500/30 text-teal-300" : "bg-white/5 border-white/10 text-slate-400 hover:text-white"}`}>{d}d</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-slate-500 text-[10px] font-bold uppercase block mb-1.5">Monthly Fee (₹)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
                <input type="number" value={roiFee} onChange={(e) => setRoiFee(e.target.value)} placeholder="5000"
                  className="pl-7 pr-3 py-2 bg-slate-900 border border-white/10 text-white rounded-xl text-xs font-mono w-28 outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
            </div>
            <button onClick={() => generateRoiReport(roiDays, roiFee)} disabled={roiLoading}
              className="flex items-center gap-2 px-5 py-2 bg-teal-500 hover:bg-teal-400 text-white text-xs font-bold rounded-xl transition disabled:opacity-50">
              {roiLoading ? <><FaSpinner className="animate-spin" /> Generating...</> : <>📊 Generate Report</>}
            </button>
          </div>
        </div>
        {roiReport && (
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: "💬", label: "Messages Sent",     value: roiReport.messages.sent.toLocaleString("en-IN"),                                           color: "text-blue-400",   bg: "bg-blue-500/10" },
                { icon: "👁️", label: "Read Rate",          value: `${roiReport.messages.openRate}%`,                                                         color: "text-teal-400",   bg: "bg-teal-500/10" },
                { icon: "🛒", label: "Carts Recovered",    value: roiReport.engagement.cartsRecovered.toLocaleString("en-IN"),                               color: "text-orange-400", bg: "bg-orange-500/10" },
                { icon: "💰", label: "Revenue Recovered",  value: `₹${roiReport.revenue.recovered.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,   color: "text-green-400",  bg: "bg-green-500/10" },
              ].map((s) => (
                <div key={s.label} className={`${s.bg} rounded-xl p-3 md:p-4`}>
                  <p className="text-xl mb-1">{s.icon}</p>
                  <p className={`text-lg md:text-xl font-extrabold ${s.color}`}>{s.value}</p>
                  <p className="text-slate-500 text-[10px] font-bold mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
            <div className={`rounded-xl p-4 border flex items-center gap-4 ${parseFloat(roiReport.revenue.roi) >= 100 ? "bg-green-500/10 border-green-500/20" : "bg-yellow-500/10 border-yellow-500/20"}`}>
              <div className="text-3xl shrink-0">{parseFloat(roiReport.revenue.roi) >= 100 ? "🚀" : "📈"}</div>
              <div className="flex-1">
                <p className={`font-extrabold text-lg ${parseFloat(roiReport.revenue.roi) >= 100 ? "text-green-400" : "text-yellow-400"}`}>{roiReport.revenue.roi}% ROI</p>
                <p className="text-slate-300 text-sm mt-0.5">Every ₹1 spent returned <strong className="text-white">₹{roiReport.revenue.revenuePerRupee}</strong> in recovered revenue</p>
              </div>
              <div className="text-right shrink-0"><p className="text-slate-400 text-xs">Fee paid</p><p className="text-white font-extrabold">₹{parseFloat(roiFee).toLocaleString("en-IN")}</p></div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-400 text-xs font-bold uppercase">📱 WhatsApp Message (copy &amp; send to merchant)</p>
                <button onClick={copyRoiMessage} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition ${roiCopied ? "bg-green-500/20 border-green-500/30 text-green-400" : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"}`}>
                  {roiCopied ? "✅ Copied!" : "📋 Copy Message"}
                </button>
              </div>
              <div className="bg-slate-900 border border-white/5 rounded-xl p-4">
                <pre className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap font-sans">{roiReport.whatsappMessage}</pre>
              </div>
              <p className="text-slate-600 text-[10px] mt-2">Generated at: {new Date(roiReport.generatedAt).toLocaleString("en-IN")}</p>
            </div>
          </div>
        )}
      </div>

      {/* AI Auto-Reply */}
      <div className="bg-slate-800 border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${aiAutoReply ? "bg-purple-500/20" : "bg-slate-700"}`}>🤖</div>
            <div>
              <p className="text-white font-extrabold">AI Auto-Reply</p>
              <p className="text-slate-400 text-xs mt-0.5">{aiAutoReply ? "🟢 Active — Groq AI is replying to customer messages" : "⏸️ Paused — AI replies are disabled"}</p>
            </div>
          </div>
          <div onClick={() => setAiAutoReply(!aiAutoReply)} className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 cursor-pointer shrink-0 ${aiAutoReply ? "bg-purple-500" : "bg-slate-600"}`}>
            <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${aiAutoReply ? "translate-x-6" : "translate-x-0"}`} />
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 text-xs text-purple-300 space-y-1">
            <p className="font-bold text-purple-200">How AI Auto-Reply works:</p>
            <ol className="list-decimal list-inside space-y-0.5 text-slate-300">
              <li>Customer sends a WhatsApp message</li>
              <li>Groq AI reads your Business Knowledge Base below</li>
              <li>If question matches → sends professional reply instantly</li>
              <li>If AI can&apos;t answer → sends fallback message automatically</li>
            </ol>
            <p className="text-slate-500 text-[10px] mt-2">Powered by Groq (llama-3.1-8b-instant) — free tier, ~2s response time</p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-400 uppercase">📋 Business Knowledge Base</label>
              <span className="text-[10px] text-slate-600">{aiKnowledgeBase.length} chars</span>
            </div>
            <textarea rows={10} value={aiKnowledgeBase} onChange={(e) => setAiKnowledgeBase(e.target.value)}
              placeholder={"Write everything about your business here. The AI will use this to answer customer questions.\n\nExample:\n\nBusiness Name: Priya Jewellery\nProducts: Gold jewellery, Kundan sets\nPricing: Gold rings ₹5,000-₹25,000\nDelivery: Free above ₹2,000. 3-5 days.\nReturn Policy: 7-day returns.\n\nFAQs:\nQ: Custom orders? A: Yes, 15-20 days.\nQ: Gold hallmarked? A: Yes, BIS hallmarked."}
              className="w-full p-3 bg-slate-900 border border-white/10 text-white placeholder-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm resize-none font-sans leading-relaxed" />
            <p className="text-slate-600 text-[10px] mt-1">Add products, pricing, policies, FAQs — more detail = better AI replies</p>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">💬 Fallback Message <span className="text-slate-600 font-normal">(sent when AI can&apos;t answer)</span></label>
            <input type="text" value={aiFallbackMessage} onChange={(e) => setAiFallbackMessage(e.target.value)}
              placeholder="Thank you for reaching out! 😊 Our team will connect with you shortly to help you."
              className="w-full p-3 bg-slate-900 border border-white/10 text-white placeholder-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm" />
            <p className="text-slate-600 text-[10px] mt-1">Leave blank to use the default message</p>
          </div>
          <button onClick={saveAISettings} disabled={aiSaving}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white font-bold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2 text-sm transition">
            {aiSaving ? <><FaSpinner className="animate-spin" /> Saving...</> : <>🤖 Save AI Settings</>}
          </button>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300 flex items-start gap-2">
            <span className="shrink-0">⚠️</span>
            <div>
              <p className="font-bold">Setup Required: Add GROQ_API_KEY to backend .env</p>
              <p className="text-amber-400/70 mt-0.5">Get free API key at <strong>console.groq.com</strong> → Add <code className="bg-slate-800 px-1 rounded">GROQ_API_KEY=gsk_...</code> in .env</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
