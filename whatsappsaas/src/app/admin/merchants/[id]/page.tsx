"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import {
  FaArrowLeft, FaWallet, FaCalendarPlus, FaSync, FaBullhorn,
  FaCheckCircle, FaShieldAlt, FaStore, FaKey, FaLink, FaTag,
  FaSpinner, FaWhatsapp, FaUsers, FaChartBar, FaEnvelope,
  FaMousePointer, FaRupeeSign, FaTimes, FaPlay, FaClock,
  FaCheckDouble, FaShoppingCart, FaBoxOpen, FaToggleOn,
  FaToggleOff, FaEdit, FaRobot,
} from "react-icons/fa";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const ah = () => ({ "x-admin-api-key": sessionStorage.getItem("adminKey") || "" });

// ── Preset templates ─────────────────────────────────────────────────────────
const FLOW_TYPES = [
  {
    type: "ABANDONED_CART_1",
    label: "Abandoned Cart — Reminder 1",
    icon: <FaShoppingCart />,
    color: "text-orange-400",
    bg: "bg-orange-500/20",
    border: "border-orange-500/30",
    defaultDelay: 30,
    defaultTemplate: `🛒 *Hey {{name}}!*\n\nYou left something behind...\n\nYour cart is waiting for you! Don't miss out on the items you loved. 😍\n\n👇 *Complete your order here:*\n{{link}}\n\n_This link expires soon — grab it before it's gone!_ ⏳`,
  },
  {
    type: "ABANDONED_CART_2",
    label: "Abandoned Cart — Reminder 2 (Discount)",
    icon: <FaBullhorn />,
    color: "text-red-400",
    bg: "bg-red-500/20",
    border: "border-red-500/30",
    defaultDelay: 1440,
    defaultTemplate: `🎁 *Special offer for you, {{name}}!*\n\nWe noticed you didn't complete your order. Here's a gift:\n\n*Use code: {{discount_code}}* for *10% OFF* your cart! 🏷️\n\n👇 *Claim your discount:*\n{{link}}\n\n_Hurry — offer expires in 24 hours!_ 🔥`,
  },
  {
    type: "ORDER_CONFIRM",
    label: "Order Confirmation",
    icon: <FaBoxOpen />,
    color: "text-green-400",
    bg: "bg-green-500/20",
    border: "border-green-500/30",
    defaultDelay: 0,
    defaultTemplate: `✅ *Order Confirmed, {{name}}!*\n\nThank you for shopping with us! 🎉\n\nYour order is being processed. We'll notify you once it's shipped.\n\n_Need help? Just reply to this message._ 💬`,
  },
];

// ── Template Card Component ───────────────────────────────────────────────────
function TemplateCard({ t, bodyComp, headerComp, footerComp, onDelete }: any) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isRejected = t.status === 'REJECTED';
  const isApproved = t.status === 'APPROVED';
  const isPending  = t.status === 'PENDING';

  const handleDelete = async () => {
    if (!confirm(`Delete template "${t.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await onDelete(t.name);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={`bg-slate-900 border rounded-xl overflow-hidden transition ${
      isRejected ? 'border-red-500/30' : isApproved ? 'border-green-500/20' : 'border-white/5'
    }`}>
      {/* Header row */}
      <div className="flex items-center gap-2 p-4">
        <button onClick={() => setExpanded(!expanded)} className="flex-1 text-left flex items-start gap-3 hover:opacity-80 transition">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-white font-bold text-sm font-mono">{t.name}</span>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                isApproved ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                isPending  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                             'bg-red-500/10 border-red-500/20 text-red-400'
              }`}>{t.status}</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded">{t.language}</span>
              <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded">{t.category}</span>
            </div>
          </div>
          <span className="text-slate-500 text-xs mt-1 shrink-0">{expanded ? '▲' : '▼'}</span>
        </button>

        {/* Delete button */}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="shrink-0 w-8 h-8 flex items-center justify-center bg-red-500/10 hover:bg-red-500/30 border border-red-500/20 text-red-400 rounded-lg transition disabled:opacity-40"
          title="Delete template"
        >
          {deleting ? <FaSpinner className="animate-spin text-xs" /> : <FaTimes className="text-xs" />}
        </button>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
          {/* Rejection reason */}
          {isRejected && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <p className="text-red-400 text-xs font-bold mb-1">❌ Rejection Reason</p>
              <p className="text-red-300 text-xs">
                {t.rejected_reason || "No specific reason provided by Meta"}
              </p>
              <div className="mt-2 bg-slate-900 rounded-lg p-2 text-[11px] text-slate-400">
                <p className="font-bold text-slate-300 mb-1">Common reasons:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Variables must be {`{{1}}`}, {`{{2}}`} not {`{{name}}`}</li>
                  <li>Template name: lowercase + underscores only</li>
                  <li>UTILITY category cannot have promotional/urgency language</li>
                  <li>Content violates Meta commerce/messaging policy</li>
                </ul>
              </div>
            </div>
          )}

          {/* Header */}
          {headerComp && (
            <div>
              <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Header</p>
              <p className="text-slate-300 text-sm bg-slate-800 rounded-lg p-2">{headerComp.text || headerComp.format}</p>
            </div>
          )}

          {/* Body */}
          {bodyComp && (
            <div>
              <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Body</p>
              <pre className="text-slate-300 text-sm bg-slate-800 rounded-lg p-3 whitespace-pre-wrap font-sans leading-relaxed">{bodyComp.text}</pre>
            </div>
          )}

          {/* Footer */}
          {footerComp && (
            <div>
              <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Footer</p>
              <p className="text-slate-400 text-xs bg-slate-800 rounded-lg p-2">{footerComp.text}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MerchantControlHub() {
  const { id } = useParams();
  const router = useRouter();
  const merchantId = id as string;

  const [merchant, setMerchant] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [flows, setFlows] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerTotal, setCustomerTotal] = useState(0);
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "flows" | "campaign" | "customers" | "credentials" | "templates">("overview");

  // Activation
  const [category, setCategory] = useState("ECOMMERCE");
  const [shopifyToken, setShopifyToken] = useState("");
  const [shopifySecret, setShopifySecret] = useState("");
  const [storeUrl, setStoreUrl] = useState("");
  // Meta Cloud API credentials
  const [metaPhoneNumberId, setMetaPhoneNumberId] = useState("");
  const [metaAccessToken, setMetaAccessToken] = useState("");
  const [metaWabaId, setMetaWabaId] = useState("");

  // Wallet / Sub
  const [amount, setAmount] = useState("");
  const [days, setDays] = useState("30");

  // Campaign
  const [campaignName, setCampaignName] = useState("");
  const [campaignTemplate, setCampaignTemplate] = useState(
    `🎉 *Hey {{name}}!*\n\nWe have something special for you. ✨\n\nShop our latest collection:\n{{link}}\n\n_Reply STOP to unsubscribe_ 🙏`
  );

  // Flow editing
  const [editingFlow, setEditingFlow] = useState<any>(null);
  const [editTemplate, setEditTemplate] = useState("");
  const [editDelay, setEditDelay] = useState(0);

  // Credentials update
  const [credShopifyToken, setCredShopifyToken] = useState("");
  const [credShopifySecret, setCredShopifySecret] = useState("");
  const [credStoreUrl, setCredStoreUrl] = useState("");
  const [credMetaPhoneId, setCredMetaPhoneId] = useState("");
  const [credMetaToken, setCredMetaToken] = useState("");
  const [credMetaWabaId, setCredMetaWabaId] = useState("");
  const [credClientId, setCredClientId] = useState("");
  const [credClientSecret, setCredClientSecret] = useState("");
  // Templates
  const [metaTemplates, setMetaTemplates] = useState<any[]>([]);
  const [tmplName, setTmplName] = useState("");
  const [tmplBody, setTmplBody] = useState("");
  const [tmplHeader, setTmplHeader] = useState("");
  const [tmplFooter, setTmplFooter] = useState("");
  const [tmplCategory, setTmplCategory] = useState("MARKETING");
  const [tmplLanguage, setTmplLanguage] = useState("en_US");

  const fetchAll = useCallback(async () => {
    try {
      const [mRes, cRes, fRes, custRes] = await Promise.all([
        axios.get(`${API_URL}/admin/merchants/${merchantId}`, { headers: ah() }).catch(() =>
          axios.get(`${API_URL}/admin/merchants`, { headers: ah() }).then(r => ({
            data: { merchant: r.data.merchants.find((m: any) => m.id === merchantId) }
          }))
        ),
        axios.get(`${API_URL}/admin/campaigns/${merchantId}`, { headers: ah() }).catch(() => ({ data: { campaigns: [] } })),
        axios.get(`${API_URL}/admin/flows/${merchantId}`, { headers: ah() }).catch(() => ({ data: { flows: [] } })),
        axios.get(`${API_URL}/admin/customers/${merchantId}?limit=10`, { headers: ah() }).catch(() => ({ data: { customers: [], total: 0 } })),
      ]);
      setMerchant(mRes.data.merchant);
      setCampaigns(cRes.data.campaigns || []);
      setFlows(fRes.data.flows || []);
      setCustomers(custRes.data.customers || []);
      setCustomerTotal(custRes.data.total || 0);
      // Pre-fill credentials form from DB
      const m = mRes.data.merchant;
      if (m) {
        setCredStoreUrl(m.storeUrl || "");
        setCredShopifyToken(m.shopifyToken || "");
        setCredShopifySecret(m.shopifySecret || "");
        setCredMetaPhoneId(m.metaPhoneNumberId || "");
        setCredMetaToken(m.metaAccessToken || "");
        setCredMetaWabaId(m.metaWabaId || "");
        setCredClientId(m.shopifyClientId || "");
        setCredClientSecret(m.shopifyClientSecret || "");
      }
      if (mRes.data.merchant?.storeUrl) setStoreUrl(mRes.data.merchant.storeUrl);
    } finally {
      setFetching(false);
    }
  }, [merchantId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const action = async (endpoint: string, data: any, label: string) => {
    setLoading(label);
    try {
      await axios.post(`${API_URL}/admin/${endpoint}`, { merchantId, ...data }, { headers: ah() });
      alert("✅ Done!");
      await fetchAll();
    } catch (e: any) {
      alert(e.response?.data?.message || "Error");
    } finally { setLoading(null); }
  };

  const handleSync = async () => {
    setLoading("sync");
    try {
      const r = await axios.post(`${API_URL}/admin/sync-customers`, { merchantId }, { headers: ah() });
      alert(r.data.message);
      await fetchAll();
    } catch (e: any) { alert(e.response?.data?.message || "Sync failed"); }
    finally { setLoading(null); }
  };

  const handleLaunchCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading("campaign");
    try {
      const r = await axios.post(`${API_URL}/admin/launch-campaign`,
        { merchantId, campaignName, template: campaignTemplate }, { headers: ah() });
      alert(`🚀 ${r.data.message} — Queued: ${r.data.totalQueued}`);
      setCampaignName("");
      setActiveTab("overview");
      await fetchAll();
    } catch (e: any) { alert(e.response?.data?.message || "Failed"); }
    finally { setLoading(null); }
  };

  const toggleFlow = async (flowType: string, currentState: boolean) => {
    try {
      await axios.post(`${API_URL}/admin/flows/toggle`,
        { merchantId, type: flowType, isActive: !currentState }, { headers: ah() });
      await fetchAll();
    } catch { alert("Toggle failed"); }
  };

  const saveFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading("flow");
    try {
      await axios.post(`${API_URL}/admin/flows/save`, {
        merchantId,
        type: editingFlow.type,
        delayMinutes: editDelay,
        template: editTemplate,
        isActive: true,
      }, { headers: ah() });
      setEditingFlow(null);
      await fetchAll();
    } catch { alert("Save failed"); }
    finally { setLoading(null); }
  };

  const openEdit = (ft: any) => {
    const db = flows.find(f => f.type === ft.type);
    setEditingFlow(ft);
    setEditTemplate(db?.template || ft.defaultTemplate);
    setEditDelay(db?.delayMinutes ?? ft.defaultDelay);
  };

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading("creds");
    try {
      await axios.post(`${API_URL}/admin/update-credentials`, {
        merchantId,
        shopifyToken: credShopifyToken,
        shopifySecret: credShopifySecret,
        storeUrl: credStoreUrl,
        metaPhoneNumberId: credMetaPhoneId,
        metaAccessToken: credMetaToken,
        metaWabaId: credMetaWabaId,
        shopifyClientId: credClientId,
        shopifyClientSecret: credClientSecret,
      }, { headers: ah() });
      alert("✅ Credentials saved!");
      await fetchAll();
    } catch (e: any) { alert(e.response?.data?.message || "Error"); }
    finally { setLoading(null); }
  };

  const handleRefreshShopifyToken = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading("refresh");
    try {
      const r = await axios.post(`${API_URL}/admin/refresh-shopify-token`, {
        merchantId, clientId: credClientId, clientSecret: credClientSecret,
      }, { headers: ah() });
      alert(r.data.message);
      setCredClientId(""); setCredClientSecret("");
      await fetchAll(); // re-fetch so new token shows in form
    } catch (e: any) { alert(e.response?.data?.message || "Refresh failed"); }
    finally { setLoading(null); }
  };

  const fetchMetaTemplates = async () => {
    setLoading("tmpl-fetch");
    try {
      const r = await axios.get(`${API_URL}/admin/meta-templates/${merchantId}`, { headers: ah() });
      setMetaTemplates(r.data.templates || []);
    } catch (e: any) { alert(e.response?.data?.message || "Failed to fetch templates"); }
    finally { setLoading(null); }
  };

  const handleDeleteTemplate = async (templateName: string) => {
    try {
      await axios.delete(`${API_URL}/admin/meta-templates/${merchantId}/${templateName}`, { headers: ah() });
      setMetaTemplates(prev => prev.filter(t => t.name !== templateName));
      alert(`✅ Template "${templateName}" deleted!`);
    } catch (e: any) {
      alert(e.response?.data?.message || "Delete failed");
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading("tmpl-create");
    try {
      const r = await axios.post(`${API_URL}/admin/meta-templates`, {
        merchantId, name: tmplName, bodyText: tmplBody,
        headerText: tmplHeader || undefined, footerText: tmplFooter || undefined,
        category: tmplCategory, language: tmplLanguage,
      }, { headers: ah() });
      alert(r.data.message);
      setTmplName(""); setTmplBody(""); setTmplHeader(""); setTmplFooter("");
      await fetchMetaTemplates();
    } catch (e: any) { alert(e.response?.data?.message || "Failed"); }
    finally { setLoading(null); }
  };

  if (fetching) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <FaSpinner className="animate-spin text-4xl text-teal-400" />
    </div>
  );

  const isActive = merchant?.status === "ACTIVE";
  const waConnected = merchant?.whatsappConnected;
  const TABS = [
    { key: "overview", label: "Overview" },
    { key: "flows", label: "Flows" },
    { key: "campaign", label: "Campaign" },
    { key: "customers", label: `Customers (${customerTotal})` },
    { key: "credentials", label: "⚙️ Credentials" },
    { key: "templates", label: "📋 Templates" },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="h-16 bg-slate-900/80 backdrop-blur border-b border-white/5 flex items-center px-8 gap-4 sticky top-0 z-10">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-teal-400 font-bold text-sm transition">
          <FaArrowLeft /> Back
        </button>
        <div className="w-px h-6 bg-white/10" />
        <div className="flex items-center gap-2">
          <FaStore className="text-teal-400 text-sm" />
          <span className="text-white font-extrabold">{merchant?.brandName || "Loading..."}</span>
          <span className="text-slate-500 text-sm">· {merchantId.slice(0, 8)}...</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${waConnected ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-slate-700 border-white/5 text-slate-400"}`}>
            <FaWhatsapp />{waConnected ? "WA Live" : "WA Offline"}
          </div>
          <div className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border ${isActive ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"}`}>
            {isActive ? "● ACTIVE" : "● PENDING"}
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-br from-teal-700 to-teal-900 px-8 py-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex-1">
            <p className="text-teal-200 text-xs font-bold uppercase tracking-wider mb-1">Merchant Hub</p>
            <h1 className="text-2xl font-extrabold text-white">{merchant?.brandName}</h1>
            <p className="text-teal-300 text-sm mt-0.5">{merchant?.storeUrl || "—"}</p>
          </div>
          <div className="flex gap-8">
            {[
              { label: "Customers", value: merchant?._count?.customers ?? customerTotal },
              { label: "Sent", value: merchant?.totalSent ?? 0 },
              { label: "Revenue", value: `₹${(merchant?.recoveredRevenue || 0).toFixed(0)}` },
              { label: "Paid", value: `₹${(merchant?.totalPaidAmount || 0).toFixed(0)}` },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-xl font-extrabold text-white">{s.value}</p>
                <p className="text-teal-300 text-[10px] font-bold uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/5 bg-slate-900 px-8">
        <div className="max-w-6xl mx-auto flex">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key as any)}
              className={`px-5 py-4 text-sm font-bold border-b-2 transition ${activeTab === t.key ? "border-teal-400 text-teal-400" : "border-transparent text-slate-400 hover:text-slate-200"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8 space-y-6">

        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Analytics */}
            {isActive && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: <FaEnvelope />, label: "Sent", value: merchant?.totalSent ?? 0, bg: "bg-teal-500/10", c: "text-teal-400" },
                  { icon: <FaCheckDouble />, label: "Read", value: merchant?.totalRead ?? 0, bg: "bg-blue-500/10", c: "text-blue-400" },
                  { icon: <FaMousePointer />, label: "Clicks", value: merchant?.totalClicked ?? 0, bg: "bg-orange-500/10", c: "text-orange-400" },
                  { icon: <FaRupeeSign />, label: "Revenue", value: `₹${(merchant?.recoveredRevenue || 0).toFixed(2)}`, bg: "bg-green-500/10", c: "text-green-400" },
                ].map(s => (
                  <div key={s.label} className="bg-slate-800 border border-white/5 rounded-2xl p-5">
                    <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
                      <span className={s.c}>{s.icon}</span>
                    </div>
                    <p className="text-2xl font-extrabold text-white">{s.value}</p>
                    <p className="text-slate-400 text-xs mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Activate OR Wallet+Sub */}
            {!isActive ? (
              <div className="bg-slate-800 border border-red-500/20 rounded-2xl overflow-hidden">
                <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-4 flex items-center gap-3">
                  <FaShieldAlt className="text-red-400" />
                  <div><p className="text-white font-extrabold">Activate Merchant</p><p className="text-slate-400 text-xs">Enter Shopify credentials</p></div>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-1 block">Category</label>
                    <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-3 bg-slate-900 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-teal-500">
                      <option value="ECOMMERCE">E-Commerce</option>
                      <option value="RESTAURANT">Restaurant</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-1 block">Store URL</label>
                    <input type="text" placeholder="https://yourstore.myshopify.com" value={storeUrl} onChange={e => setStoreUrl(e.target.value)} className="w-full p-3 bg-slate-900 border border-white/10 text-white placeholder-slate-500 rounded-xl outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-1 block">Shopify Admin Token</label>
                    <input type="text" placeholder="shpat_..." value={shopifyToken} onChange={e => setShopifyToken(e.target.value)} className="w-full p-3 bg-slate-900 border border-white/10 text-white placeholder-slate-500 rounded-xl outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-1 block">Webhook Secret</label>
                    <input type="text" placeholder="From Shopify → Settings → Notifications" value={shopifySecret} onChange={e => setShopifySecret(e.target.value)} className="w-full p-3 bg-slate-900 border border-white/10 text-white placeholder-slate-500 rounded-xl outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                  {/* Meta Cloud API Credentials */}
                  <div className="md:col-span-2 border-t border-white/5 pt-4">
                    <p className="text-teal-400 text-xs font-bold uppercase tracking-wider mb-3">Meta WhatsApp Cloud API</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-1 block">Phone Number ID</label>
                    <input type="text" placeholder="120364xxxxxxxxxx" value={metaPhoneNumberId} onChange={e => setMetaPhoneNumberId(e.target.value)} className="w-full p-3 bg-slate-900 border border-white/10 text-white placeholder-slate-500 rounded-xl outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-1 block">WABA ID</label>
                    <input type="text" placeholder="WhatsApp Business Account ID" value={metaWabaId} onChange={e => setMetaWabaId(e.target.value)} className="w-full p-3 bg-slate-900 border border-white/10 text-white placeholder-slate-500 rounded-xl outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-400 mb-1 block">Permanent Access Token</label>
                    <input type="password" placeholder="EAAxxxxxxxxxxxxxxxxx (system user token)" value={metaAccessToken} onChange={e => setMetaAccessToken(e.target.value)} className="w-full p-3 bg-slate-900 border border-white/10 text-white placeholder-slate-500 rounded-xl outline-none focus:ring-2 focus:ring-teal-500" />
                    <p className="text-slate-500 text-xs mt-1">Generate from Business Settings → System Users → Generate Token (never expires)</p>
                  </div>
                  <div className="md:col-span-2">
                    <button onClick={() => action("activate", { shopifyToken, shopifySecret, category, storeUrl, metaPhoneNumberId, metaAccessToken, metaWabaId }, "activate")}
                      disabled={!shopifyToken || !shopifySecret || loading === "activate"}
                      className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white p-3.5 rounded-xl font-bold disabled:opacity-40 flex justify-center items-center gap-2">
                      {loading === "activate" ? <><FaSpinner className="animate-spin" /> Verifying...</> : <><FaCheckCircle /> Verify & Activate</>}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-slate-800 border border-white/5 rounded-2xl overflow-hidden">
                  <div className="bg-teal-500/10 border-b border-teal-500/10 px-5 py-3 flex items-center gap-2">
                    <FaWallet className="text-teal-400" /><span className="text-white font-bold text-sm">Recharge Wallet</span>
                    <span className="ml-auto text-teal-300 text-xs font-bold">₹{merchant?.walletBalance?.toFixed(2)}</span>
                  </div>
                  <div className="p-5 flex gap-3">
                    <input type="number" placeholder="Amount (₹)" className="flex-1 p-3 bg-slate-900 border border-white/10 text-white placeholder-slate-500 rounded-xl outline-none focus:ring-2 focus:ring-teal-500" value={amount} onChange={e => setAmount(e.target.value)} />
                    <button onClick={() => action("add-credits", { amount }, "wallet")} disabled={loading === "wallet" || !amount} className="bg-teal-500 hover:bg-teal-400 text-white px-5 py-3 rounded-xl font-bold disabled:opacity-40 flex items-center gap-2">
                      {loading === "wallet" ? <FaSpinner className="animate-spin" /> : "+"}Add
                    </button>
                  </div>
                </div>
                <div className="bg-slate-800 border border-white/5 rounded-2xl overflow-hidden">
                  <div className="bg-emerald-500/10 border-b border-emerald-500/10 px-5 py-3 flex items-center gap-2">
                    <FaCalendarPlus className="text-emerald-400" /><span className="text-white font-bold text-sm">Extend Subscription</span>
                    <span className="ml-auto text-slate-400 text-xs">{merchant?.subscriptionExpiry ? new Date(merchant.subscriptionExpiry).toLocaleDateString("en-IN") : "N/A"}</span>
                  </div>
                  <div className="p-5 flex gap-3">
                    <select className="flex-1 p-3 bg-slate-900 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" value={days} onChange={e => setDays(e.target.value)}>
                      <option value="30">30 Days</option>
                      <option value="90">90 Days</option>
                      <option value="365">365 Days</option>
                    </select>
                    <button onClick={() => action("extend-subscription", { days }, "sub")} disabled={loading === "sub"} className="bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-3 rounded-xl font-bold disabled:opacity-40">
                      {loading === "sub" ? <FaSpinner className="animate-spin" /> : "Extend"}
                    </button>
                  </div>
                </div>
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
                  {campaigns.map(c => (
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
          </div>
        )}

        {/* ── FLOWS TAB ── */}
        {activeTab === "flows" && (
          <div className="space-y-4">
            <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-xl p-4 text-sm text-slate-400 flex items-start gap-2">
              <FaRobot className="text-indigo-400 mt-0.5 shrink-0" />
              <span>Enable or customise automation flows for this merchant. Use <code className="bg-slate-800 text-teal-300 px-1 rounded">{"{{name}}"}</code>, <code className="bg-slate-800 text-teal-300 px-1 rounded">{"{{link}}"}</code>, <code className="bg-slate-800 text-teal-300 px-1 rounded">{"{{discount_code}}"}</code> in templates. WhatsApp formatting: <code className="bg-slate-800 text-white px-1 rounded">*bold*</code> <code className="bg-slate-800 text-white px-1 rounded">_italic_</code></span>
            </div>
            {FLOW_TYPES.map(ft => {
              const db = flows.find(f => f.type === ft.type);
              const on = db?.isActive ?? false;
              return (
                <div key={ft.type} className={`bg-slate-800 border rounded-2xl overflow-hidden ${on ? ft.border : "border-white/5"}`}>
                  <div className="p-5 flex items-start gap-4">
                    <div className={`w-11 h-11 ${ft.bg} rounded-xl flex items-center justify-center shrink-0`}>
                      <span className={`text-lg ${ft.color}`}>{ft.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-extrabold text-sm">{ft.label}</span>
                        {on && <span className="bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />LIVE</span>}
                      </div>
                      <div className="mt-2 bg-slate-900/60 rounded-xl p-3 text-xs text-slate-400">
                        <span className="font-bold text-slate-300">Delay:</span> {db?.delayMinutes ?? ft.defaultDelay === 0 ? "Instant" : `${db?.delayMinutes ?? ft.defaultDelay} min`}
                        <br />
                        <span className="font-bold text-slate-300">Preview:</span>
                        <pre className="mt-1 text-slate-400 whitespace-pre-wrap font-sans text-[11px] line-clamp-3">{(db?.template || ft.defaultTemplate).substring(0, 100)}...</pre>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <button onClick={() => toggleFlow(ft.type, on)} className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border transition ${on ? "bg-green-500/10 border-green-500/20 text-green-400 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400" : "bg-slate-700 border-white/10 text-slate-400 hover:bg-green-500/10 hover:text-green-400"}`}>
                        {on ? <FaToggleOn className="text-base" /> : <FaToggleOff className="text-base" />}
                        {on ? "ON" : "OFF"}
                      </button>
                      <button onClick={() => openEdit(ft)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border bg-white/5 border-white/10 text-slate-400 hover:text-teal-400 hover:border-teal-500/30 transition">
                        <FaEdit /> Edit
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="flex gap-4 pt-2">
              <button onClick={() => setActiveTab("campaign")} className="bg-indigo-500/20 hover:bg-indigo-500 border border-indigo-500/30 text-indigo-300 hover:text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition">
                <FaBullhorn /> Go to Campaign
              </button>
              <button onClick={handleSync} disabled={loading === "sync" || !isActive} className="bg-blue-500/20 hover:bg-blue-500 border border-blue-500/30 text-blue-300 hover:text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-40 transition">
                {loading === "sync" ? <FaSpinner className="animate-spin" /> : <FaSync />} Sync Customers ({customerTotal})
              </button>
            </div>
          </div>
        )}

        {/* ── CAMPAIGN TAB ── */}
        {activeTab === "campaign" && (
          <div className="max-w-2xl">
            <div className="bg-slate-800 border border-white/5 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5">
                <h3 className="text-white font-extrabold">Launch Bulk Campaign</h3>
                <p className="text-slate-400 text-xs mt-0.5">Send to all {customerTotal} synced customers · 15s delay per message</p>
              </div>
              <form onSubmit={handleLaunchCampaign} className="p-6 space-y-5">
                <div>
                  <label className="text-sm font-bold text-slate-300 mb-2 block">Campaign Name</label>
                  <input type="text" required placeholder="e.g. Diwali Sale 2025" value={campaignName} onChange={e => setCampaignName(e.target.value)}
                    className="w-full p-3.5 bg-slate-900 border border-white/10 text-white placeholder-slate-500 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-300 mb-2 block">Message Template</label>
                  <textarea rows={10} required value={campaignTemplate} onChange={e => setCampaignTemplate(e.target.value)}
                    className="w-full p-3.5 bg-slate-900 border border-white/10 text-white placeholder-slate-500 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono text-sm leading-relaxed" />
                  <div className="mt-2 bg-indigo-900/30 border border-indigo-500/20 rounded-xl p-3 text-xs text-slate-400">
                    <span className="text-indigo-300 font-bold">Variables: </span>
                    <code className="bg-slate-800 text-teal-300 px-1 rounded mx-1">{"{{name}}"}</code> Customer name ·
                    <code className="bg-slate-800 text-teal-300 px-1 rounded mx-1">{"{{link}}"}</code> Store link ·
                    <code className="bg-slate-800 text-teal-300 px-1 rounded mx-1">{"{{discount_code}}"}</code> Discount code
                    <br /><span className="text-indigo-300 font-bold mt-1 block">WhatsApp: </span>
                    <code className="bg-slate-800 text-white px-1 rounded">*bold*</code> ·
                    <code className="bg-slate-800 text-white px-1 rounded mx-1">_italic_</code>
                  </div>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300 flex items-start gap-2">
                  <FaClock className="mt-0.5 shrink-0" />
                  {customerTotal} customers × 15s = ~{Math.ceil((customerTotal * 15) / 60)} minutes total. WhatsApp session must stay connected.
                </div>
                {(!isActive || !waConnected) && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-400 flex items-center gap-2">
                    <FaWhatsapp /> {!isActive ? "Merchant must be ACTIVE" : "WhatsApp must be connected"} before launching
                  </div>
                )}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setCampaignTemplate(`🎉 *Hey {{name}}!*\n\nWe have something special for you. ✨\n\nShop our latest collection:\n{{link}}\n\n_Reply STOP to unsubscribe_ 🙏`)}
                    className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 text-xs font-bold rounded-xl transition">Reset Template</button>
                  <button type="submit" disabled={loading === "campaign" || !isActive || !waConnected || customerTotal === 0}
                    className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-bold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2">
                    {loading === "campaign" ? <><FaSpinner className="animate-spin" /> Launching...</> : <><FaPlay /> Launch Now ({customerTotal} msgs)</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── CUSTOMERS TAB ── */}
        {activeTab === "customers" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-slate-400 text-sm">{customerTotal} customers synced from Shopify</p>
              <button onClick={handleSync} disabled={loading === "sync" || !isActive}
                className="bg-blue-500/20 hover:bg-blue-500 border border-blue-500/30 text-blue-300 hover:text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-40 transition">
                {loading === "sync" ? <><FaSpinner className="animate-spin" /> Syncing...</> : <><FaSync /> Sync from Shopify</>}
              </button>
            </div>
            <div className="bg-slate-800 border border-white/5 rounded-2xl overflow-hidden">
              <div className="px-6 py-3 border-b border-white/5 grid grid-cols-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <span>Customer</span><span>Phone</span><span>Total Spent</span>
              </div>
              {customers.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <FaUsers className="text-slate-600 text-3xl mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No customers yet. Click Sync to import from Shopify.</p>
                </div>
              ) : customers.map(c => (
                <div key={c.id} className="px-6 py-3 grid grid-cols-3 border-b border-white/5 hover:bg-white/3 transition">
                  <span className="text-white text-sm font-medium">{c.name || "—"}</span>
                  <span className="text-slate-400 text-sm font-mono">{c.phone}</span>
                  <span className="text-teal-400 text-sm font-bold">₹{(c.totalSpent || 0).toFixed(2)}</span>
                </div>
              ))}
              {customerTotal > 10 && (
                <div className="px-6 py-3 text-center text-slate-500 text-xs">
                  Showing 10 of {customerTotal} customers
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── CREDENTIALS TAB ── */}
        {activeTab === "credentials" && (
          <div className="max-w-2xl space-y-6">

            {/* Single unified form — pre-filled from DB, save on button click */}
            <div className="bg-slate-800 border border-white/5 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2">
                <FaKey className="text-teal-400" />
                <div>
                  <p className="text-white font-extrabold">Merchant Credentials</p>
                  <p className="text-slate-400 text-xs">Edit any field and click Save — changes update the database directly</p>
                </div>
              </div>
              <form onSubmit={handleUpdateCredentials} className="p-6 space-y-5">

                {/* ── Shopify Section ── */}
                <div>
                  <p className="text-teal-400 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                    <FaStore /> Shopify
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-slate-400 mb-1 block">Store URL</label>
                      <input
                        type="text"
                        value={credStoreUrl}
                        onChange={e => setCredStoreUrl(e.target.value)}
                        className="w-full p-3 bg-slate-900 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 mb-1 block">Admin Token</label>
                      <input
                        type="text"
                        value={credShopifyToken}
                        onChange={e => setCredShopifyToken(e.target.value)}
                        className="w-full p-3 bg-slate-900 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-sm font-mono"
                      />
                      <p className="text-slate-600 text-xs mt-1">Use "Generate" section below to refresh</p>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 mb-1 block">Webhook Secret</label>
                      <input
                        type="text"
                        value={credShopifySecret}
                        onChange={e => setCredShopifySecret(e.target.value)}
                        className="w-full p-3 bg-slate-900 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 mb-1 block">App Client ID</label>
                      <input
                        type="text"
                        value={credClientId}
                        onChange={e => setCredClientId(e.target.value)}
                        className="w-full p-3 bg-slate-900 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 mb-1 block">App Client Secret</label>
                      <input
                        type="text"
                        value={credClientSecret}
                        onChange={e => setCredClientSecret(e.target.value)}
                        className="w-full p-3 bg-slate-900 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-sm font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* ── Meta Section ── */}
                <div className="border-t border-white/5 pt-5">
                  <p className="text-purple-400 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                    <FaWhatsapp /> Meta WhatsApp Cloud API
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 mb-1 block">Phone Number ID</label>
                      <input
                        type="text"
                        value={credMetaPhoneId}
                        onChange={e => setCredMetaPhoneId(e.target.value)}
                        className="w-full p-3 bg-slate-900 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 mb-1 block">WABA ID</label>
                      <input
                        type="text"
                        value={credMetaWabaId}
                        onChange={e => setCredMetaWabaId(e.target.value)}
                        className="w-full p-3 bg-slate-900 border border-white/10 text-white placeholder-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm font-mono"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-slate-400 mb-1 block">Permanent Access Token</label>
                      <input
                        type="text"
                        value={credMetaToken}
                        onChange={e => setCredMetaToken(e.target.value)}
                        className="w-full p-3 bg-slate-900 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm font-mono"
                      />
                      <p className="text-slate-600 text-xs mt-1">System User token — never expires</p>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading === "creds"}
                  className="w-full bg-teal-500 hover:bg-teal-400 text-white font-bold py-3.5 rounded-xl disabled:opacity-40 flex items-center justify-center gap-2 transition"
                >
                  {loading === "creds"
                    ? <><FaSpinner className="animate-spin" /> Saving...</>
                    : <><FaCheckCircle /> Save All Changes</>
                  }
                </button>
              </form>
            </div>

            {/* Shopify OAuth token refresh — separate utility */}
            <div className="bg-slate-800 border border-amber-500/20 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-amber-500/10 flex items-center gap-2">
                <FaSync className="text-amber-400" />
                <div>
                  <p className="text-white font-extrabold">Generate New Shopify Token</p>
                  <p className="text-slate-400 text-xs">
                    Uses saved Client ID + Secret to generate a fresh access token
                  </p>
                </div>
              </div>
              <div className="p-6">
                <div className="bg-slate-900 border border-white/5 rounded-xl p-4 mb-4 text-sm text-slate-400 space-y-1">
                  <p><span className="text-slate-300 font-bold">Client ID:</span> {credClientId ? `${credClientId.slice(0, 8)}...` : <span className="text-red-400">Not saved</span>}</p>
                  <p><span className="text-slate-300 font-bold">Client Secret:</span> {credClientSecret ? `••••••••${credClientSecret.slice(-4)}` : <span className="text-red-400">Not saved</span>}</p>
                  <p className="text-slate-600 text-xs">Save credentials above first if not set.</p>
                </div>
                <button
                  onClick={handleRefreshShopifyToken as any}
                  disabled={loading === "refresh" || !credClientId || !credClientSecret}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3.5 rounded-xl disabled:opacity-40 flex items-center justify-center gap-2 transition"
                >
                  {loading === "refresh"
                    ? <><FaSpinner className="animate-spin" /> Generating...</>
                    : <><FaSync /> Generate &amp; Save Token</>
                  }
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TEMPLATES TAB ── */}
        {activeTab === "templates" && (
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
                <form onSubmit={handleCreateTemplate} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 mb-1 block">Template Name</label>
                      <input type="text" required placeholder="abandoned_cart_1" value={tmplName} onChange={e => setTmplName(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                        className="w-full p-3 bg-slate-900 border border-white/10 text-white placeholder-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                      <p className="text-slate-600 text-xs mt-1">lowercase, underscores only</p>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 mb-1 block">Category</label>
                      <select value={tmplCategory} onChange={e => setTmplCategory(e.target.value)}
                        className="w-full p-3 bg-slate-900 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                        <option value="MARKETING">MARKETING</option>
                        <option value="UTILITY">UTILITY</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-1 block">Language</label>
                    <select value={tmplLanguage} onChange={e => setTmplLanguage(e.target.value)}
                      className="w-full p-3 bg-slate-900 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                      <option value="en_US">English (US)</option>
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-1 block">Header (optional)</label>
                    <input type="text" placeholder="Your cart is waiting! 🛒" value={tmplHeader} onChange={e => setTmplHeader(e.target.value)}
                      className="w-full p-3 bg-slate-900 border border-white/10 text-white placeholder-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-1 block">Body Text *</label>
                    <textarea rows={5} required placeholder={"Hi {{1}}, you left items in your cart.\n\nComplete your order: {{2}}"} value={tmplBody} onChange={e => setTmplBody(e.target.value)}
                      className="w-full p-3 bg-slate-900 border border-white/10 text-white placeholder-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none font-mono" />
                    <p className="text-slate-600 text-xs mt-1">Variables: {`{{1}}`} {`{{2}}`} etc.</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-1 block">Footer (optional)</label>
                    <input type="text" placeholder="Reply STOP to unsubscribe" value={tmplFooter} onChange={e => setTmplFooter(e.target.value)}
                      className="w-full p-3 bg-slate-900 border border-white/10 text-white placeholder-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                  </div>
                  <button type="submit" disabled={loading === "tmpl-create"}
                    className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-3.5 rounded-xl disabled:opacity-40 flex items-center justify-center gap-2 transition">
                    {loading === "tmpl-create" ? <><FaSpinner className="animate-spin" /> Submitting...</> : <><FaCheckCircle /> Submit for Approval</>}
                  </button>
                </form>
              </div>

              {/* List templates */}
              <div className="bg-slate-800 border border-white/5 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FaChartBar className="text-teal-400" />
                    <p className="text-white font-extrabold">Meta Templates</p>
                  </div>
                  <button onClick={fetchMetaTemplates} disabled={loading === "tmpl-fetch"}
                    className="bg-teal-500/20 hover:bg-teal-500 border border-teal-500/30 text-teal-300 hover:text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition disabled:opacity-40">
                    {loading === "tmpl-fetch" ? <FaSpinner className="animate-spin" /> : <FaSync />} Refresh
                  </button>
                </div>
              <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                  {metaTemplates.length === 0 ? (
                    <div className="text-center py-12">
                      <FaTag className="text-slate-600 text-3xl mx-auto mb-2" />
                      <p className="text-slate-500 text-sm">Click Refresh to load from Meta</p>
                    </div>
                  ) : metaTemplates.map((t: any, i: number) => (
                    <TemplateCard
                      key={t.id || i}
                      t={t}
                      bodyComp={t.components?.find((c: any) => c.type === 'BODY')}
                      headerComp={t.components?.find((c: any) => c.type === 'HEADER')}
                      footerComp={t.components?.find((c: any) => c.type === 'FOOTER')}
                      onDelete={handleDeleteTemplate}
                    />
                  ))}                </div>
              </div>
            </div>

            <div className="bg-blue-900/20 border border-blue-500/20 rounded-xl p-4 text-sm text-slate-400 flex items-start gap-3">
              <FaRobot className="text-blue-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-blue-300 font-bold mb-1">After Approval</p>
                <p>Once template status shows APPROVED, go to Flows tab and set the <code className="bg-slate-800 text-teal-300 px-1 rounded">metaTemplateName</code> field to use it for abandoned cart automation.</p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── FLOW EDIT MODAL ── */}
      {editingFlow && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <div>
                <p className="text-white font-extrabold">Edit Flow</p>
                <p className="text-slate-400 text-xs">{editingFlow.label}</p>
              </div>
              <button onClick={() => setEditingFlow(null)} className="w-8 h-8 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white">
                <FaTimes className="text-xs" />
              </button>
            </div>
            <form onSubmit={saveFlow} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-300 mb-2 block">Delay (minutes)</label>
                <input type="number" min="0" required value={editDelay} onChange={e => setEditDelay(parseInt(e.target.value))}
                  className="w-full p-3.5 bg-slate-900 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-teal-500" />
                <p className="text-slate-500 text-xs mt-1">0 = instant · 30 = 30min · 1440 = 24h</p>
              </div>
              <div>
                <label className="text-sm font-bold text-slate-300 mb-2 block">Message Template</label>
                <textarea rows={11} required value={editTemplate} onChange={e => setEditTemplate(e.target.value)}
                  className="w-full p-3.5 bg-slate-900 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-teal-500 resize-none font-mono text-sm leading-relaxed" />
                <div className="mt-2 bg-indigo-900/30 border border-indigo-500/20 rounded-xl p-3 text-xs text-slate-400">
                  <code className="text-teal-300">{"{{name}}"}</code> · <code className="text-teal-300">{"{{link}}"}</code> · <code className="text-teal-300">{"{{discount_code}}"}</code> — replace with actual code in template text
                  <br /><code className="text-white">*bold*</code> · <code className="text-white">_italic_</code>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setEditingFlow(null)} className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 font-bold rounded-xl text-slate-300">Cancel</button>
                <button type="submit" disabled={loading === "flow"} className="flex-1 py-3.5 bg-gradient-to-r from-teal-500 to-teal-600 font-bold rounded-xl text-white disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading === "flow" ? <><FaSpinner className="animate-spin" /> Saving...</> : <><FaCheckCircle /> Save & Enable</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
