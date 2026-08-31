"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

// ── Sync Status Bar Component ─────────────────────────────────────────────────
function SyncStatusBar({ merchantId, isActive, onFullSync, onQuickSync, loading }: any) {
  const [status, setStatus] = useState<any>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const ah = () => ({ "x-admin-api-key": sessionStorage.getItem("adminKey") || "" });

  useEffect(() => {
    axios.get(`${API_URL}/admin/sync-status/${merchantId}`, { headers: ah() })
      .then(r => setStatus(r.data)).catch(() => {});
  }, [merchantId]);

  const isRunning = status?.syncLog?.status === 'running';

  return (
    <div className="bg-slate-800 border border-white/5 rounded-2xl p-5">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1">
          <p className="text-white font-bold text-sm mb-1">Shopify Data Sync</p>
          <div className="flex flex-wrap gap-4 text-xs text-slate-400">
            <span>👥 <strong className="text-white">{status?.customerCount ?? '—'}</strong> customers</span>
            <span>🛒 <strong className="text-white">{status?.orderCount ?? '—'}</strong> orders</span>
            {status?.syncLog && (
              <>
                <span>🕐 Last sync: <strong className="text-slate-300">
                  {new Date(status.syncLog.lastSyncAt).toLocaleString('en-IN')}
                </strong></span>
                <span className={`font-bold ${
                  status.syncLog.status === 'completed' ? 'text-green-400' :
                  status.syncLog.status === 'running' ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {isRunning ? '⏳ Running...' : status.syncLog.note}
                </span>
              </>
            )}
            {!status?.syncLog && <span className="text-amber-400">⚠️ Never synced</span>}
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onQuickSync}
            disabled={loading === "sync" || !isActive || isRunning}
            className="bg-blue-500/20 hover:bg-blue-500 border border-blue-500/30 text-blue-300 hover:text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 disabled:opacity-40 transition"
          >
            {loading === "sync" ? <FaSpinner className="animate-spin" /> : <FaSync />} Quick Sync
          </button>
          <button
            onClick={onFullSync}
            disabled={loading === "fullsync" || !isActive || isRunning}
            className="bg-teal-500/20 hover:bg-teal-500 border border-teal-500/30 text-teal-300 hover:text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 disabled:opacity-40 transition"
          >
            {loading === "fullsync" ? <FaSpinner className="animate-spin" /> : <FaStore />} Full Sync
          </button>
        </div>
      </div>
      {isRunning && (
        <div className="mt-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300 flex items-center gap-2">
          <FaSpinner className="animate-spin" />
          Sync running in background — fetching all Shopify data. This may take several minutes for large stores. Page refreshes automatically.
        </div>
      )}
    </div>
  );
}

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
  const [activeTab, setActiveTab] = useState<"overview" | "flows" | "campaign" | "customers" | "analytics" | "credentials" | "templates" | "inbox" | "activitylog">("overview");

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

  // Payment
  const [payAmount, setPayAmount] = useState("");
  const [payDays, setPayDays] = useState("30");
  const [payNote, setPayNote] = useState("");
  const [payments, setPayments] = useState<any[]>([]);

  // Customers
  const [customerFilter, setCustomerFilter] = useState("all");
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [customerStats, setCustomerStats] = useState<{ noPhoneCount: number; waInvalidCount: number; abandonedCount: number; orderedCount: number } | null>(null);

  // Add single customer
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [addCustName, setAddCustName] = useState("");
  const [addCustPhone, setAddCustPhone] = useState("");
  const [addCustEmail, setAddCustEmail] = useState("");

  // Flow drafts — local state before save
  const [flowDrafts, setFlowDrafts] = useState<Record<string, { template: string; delay: number; active: boolean; lang: string; discount: string }>>({});

  // Analytics
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsDays, setAnalyticsDays] = useState(30);

  // WABA Info
  const [wabaInfo, setWabaInfo]       = useState<any>(null);
  const [wabaLoading, setWabaLoading] = useState(false);

  const fetchWabaInfo = async () => {
    setWabaLoading(true);
    try {
      const r = await axios.get(`${API_URL}/admin/waba-info/${merchantId}`, { headers: ah() });
      setWabaInfo(r.data);
    } catch (e: any) {
      setWabaInfo({ error: e.response?.data?.message || 'Failed to load WABA info' });
    } finally { setWabaLoading(false); }
  };

  // Activity Log state
  const [activityLogs, setActivityLogs]         = useState<any[]>([]);
  const [activityLoading, setActivityLoading]   = useState(false);
  const [activityTotal, setActivityTotal]       = useState(0);
  const [activityPage, setActivityPage]         = useState(1);
  const [activityFilter, setActivityFilter]     = useState('');

  // Red Flags state
  const [redFlags, setRedFlags]               = useState<any>(null);
  const [redFlagsLoading, setRedFlagsLoading] = useState(false);

  const fetchRedFlags = async () => {
    setRedFlagsLoading(true);
    try {
      const r = await axios.get(`${API_URL}/admin/red-flags/${merchantId}`, { headers: ah() });
      setRedFlags(r.data);
    } catch { /* silent */ }
    finally { setRedFlagsLoading(false); }
  };

  // ROI Report state
  const [roiReport, setRoiReport]         = useState<any>(null);
  const [roiLoading, setRoiLoading]       = useState(false);
  const [roiDays, setRoiDays]             = useState(30);
  const [roiFee, setRoiFee]               = useState('5000');
  const [roiCopied, setRoiCopied]         = useState(false);

  const generateRoiReport = async (days = roiDays, fee = roiFee) => {
    setRoiLoading(true);
    setRoiReport(null);
    try {
      const r = await axios.get(
        `${API_URL}/admin/roi-report/${merchantId}?days=${days}&fee=${fee}`,
        { headers: ah() }
      );
      setRoiReport(r.data);
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to generate report');
    } finally { setRoiLoading(false); }
  };

  const copyRoiMessage = async () => {
    if (!roiReport?.whatsappMessage) return;
    try {
      await navigator.clipboard.writeText(roiReport.whatsappMessage);
      setRoiCopied(true);
      setTimeout(() => setRoiCopied(false), 2500);
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = roiReport.whatsappMessage;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setRoiCopied(true);
      setTimeout(() => setRoiCopied(false), 2500);
    }
  };

  const loadActivityLog = async (page = 1, filter = '') => {
    setActivityLoading(true);
    try {
      const r = await axios.get(
        `${API_URL}/admin/activity-log/${merchantId}?page=${page}&limit=30${filter ? `&action=${filter}` : ''}`,
        { headers: ah() }
      );
      setActivityLogs(r.data.logs || []);
      setActivityTotal(r.data.total || 0);
      setActivityPage(page);
    } catch { /* silent */ }
    finally { setActivityLoading(false); }
  };

  // Campaign
  const [campaignName, setCampaignName]               = useState("");
  const [campaignTemplate, setCampaignTemplate]       = useState("");
  const [campMetaTemplate, setCampMetaTemplate]       = useState("");
  const [campMetaLang, setCampMetaLang]               = useState("en_US");
  const [campDiscountCode, setCampDiscountCode]       = useState("");
  const [campScheduleMode, setCampScheduleMode]       = useState<"now" | "later">("now");
  const [campScheduledAt, setCampScheduledAt]         = useState("");   // datetime-local string
  const [campCustomerFilter, setCampCustomerFilter]   = useState("all");
  const [campCancelId, setCampCancelId]               = useState<string | null>(null);

  // ── Inbox state ────────────────────────────────────────────────────────────
  const [inboxConversations, setInboxConversations]     = useState<any[]>([]);
  const [inboxLoading, setInboxLoading]                 = useState(false);
  const [selectedConvo, setSelectedConvo]               = useState<any>(null);
  const [inboxMessages, setInboxMessages]               = useState<any[]>([]);
  const [inboxMessagesLoading, setInboxMessagesLoading] = useState(false);
  const [replyText, setReplyText]                       = useState("");
  const [replySending, setReplySending]                 = useState(false);
  const [inboxSearch, setInboxSearch]                   = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 24hr countdown
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  const loadInboxConversations = async (search = "") => {
    setInboxLoading(true);
    try {
      const r = await axios.get(
        `${API_URL}/inbox/conversations/${merchantId}?search=${encodeURIComponent(search)}&limit=40`,
        { headers: ah() }
      );
      setInboxConversations(r.data.conversations || []);
    } catch { /* silent */ }
    finally { setInboxLoading(false); }
  };

  const loadInboxMessages = async (convo: any) => {
    setSelectedConvo(convo);
    setInboxMessagesLoading(true);
    setInboxMessages([]);
    try {
      const r = await axios.get(
        `${API_URL}/inbox/messages/${merchantId}/${convo.customerPhone}?limit=100`,
        { headers: ah() }
      );
      setInboxMessages(r.data.messages || []);
      // Update 24hr window from fresh response
      const w = r.data.window;
      if (w?.windowExpiresAt && w?.canSendFreeText) {
        const ms = new Date(w.windowExpiresAt).getTime() - Date.now();
        const hrs  = Math.floor(ms / 3600000);
        const mins = Math.floor((ms % 3600000) / 60000);
        setTimeLeft(`${hrs}h ${mins}m`);
      } else {
        setTimeLeft(null);
      }
      // mark read
      await axios.post(`${API_URL}/inbox/mark-read/${merchantId}`, { customerPhone: convo.customerPhone }, { headers: ah() });
      // refresh unread count
      setInboxConversations(prev => prev.map(c =>
        c.customerPhone === convo.customerPhone ? { ...c, unreadCount: 0 } : c
      ));
    } catch { /* silent */ }
    finally { setInboxMessagesLoading(false); }
  };

  const sendInboxReply = async () => {
    if (!replyText.trim() || !selectedConvo) return;
    setReplySending(true);
    try {
      const r = await axios.post(
        `${API_URL}/inbox/send/${merchantId}`,
        { customerPhone: selectedConvo.customerPhone, message: replyText },
        { headers: ah() }
      );
      setInboxMessages(prev => [...prev, r.data.message]);
      setReplyText("");
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (e: any) {
      const code = e.response?.data?.code;
      if (code === 'WINDOW_EXPIRED' || code === 'NO_24HR_WINDOW') {
        alert('⏰ 24hr window closed — please send a template instead.');
      } else {
        alert(e.response?.data?.message || "Failed to send");
      }
    }
    finally { setReplySending(false); }
  };

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
  const [webhookResults, setWebhookResults] = useState<any[]>([]);
  const [tmplName, setTmplName] = useState("");
  const [tmplBody, setTmplBody] = useState("");
  const [tmplHeader, setTmplHeader] = useState("");
  const [tmplFooter, setTmplFooter] = useState("");
  const [tmplCategory, setTmplCategory] = useState("MARKETING");
  const [tmplLanguage, setTmplLanguage] = useState("en_US");

  const fetchAll = useCallback(async () => {
    try {
      const [mRes, cRes, fRes, custRes, payRes] = await Promise.all([
        axios.get(`${API_URL}/admin/merchants/${merchantId}`, { headers: ah() }).catch(() =>
          axios.get(`${API_URL}/admin/merchants`, { headers: ah() }).then(r => ({
            data: { merchant: r.data.merchants.find((m: any) => m.id === merchantId) }
          }))
        ),
        axios.get(`${API_URL}/admin/campaigns/${merchantId}`, { headers: ah() }).catch(() => ({ data: { campaigns: [] } })),
        axios.get(`${API_URL}/admin/flows/${merchantId}`, { headers: ah() }).catch(() => ({ data: { flows: [] } })),
        axios.get(`${API_URL}/admin/customers/${merchantId}?limit=10`, { headers: ah() }).catch(() => ({ data: { customers: [], total: 0 } })),
        axios.get(`${API_URL}/admin/payments/${merchantId}`, { headers: ah() }).catch(() => ({ data: { payments: [] } })),
      ]);
      setMerchant(mRes.data.merchant);
      setCampaigns(cRes.data.campaigns || []);
      setFlows(fRes.data.flows || []);
      setCustomers(custRes.data.customers || []);
      setCustomerTotal(custRes.data.total || 0);
      setPayments(payRes.data.payments || []);

      // Load sync status
      axios.get(`${API_URL}/admin/sync-status/${merchantId}`, { headers: ah() })
        .then(r => setSyncStatus(r.data)).catch(() => {});
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
      // Load red flags on initial page load
      fetchRedFlags();
    } finally {
      setFetching(false);
    }
  }, [merchantId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Auto-load Meta templates when flows or campaign tab opens
  useEffect(() => {
    if ((activeTab === 'flows' || activeTab === 'campaign') && metaTemplates.length === 0) {
      fetchMetaTemplates();
    }
    if (activeTab === 'customers') {
      loadFilteredCustomers(customerFilter);
    }
    if (activeTab === 'inbox') {
      loadInboxConversations();
    }
    if (activeTab === 'activitylog') {
      loadActivityLog(1, activityFilter);
    }
    if (activeTab === 'overview') {
      fetchRedFlags();
    }
  }, [activeTab]);

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

  const handleFullSync = async () => {
    if (!confirm('Full sync will fetch ALL Shopify data (customers + orders). This runs in background and may take several minutes for large stores. Continue?')) return;
    setLoading("fullsync");
    try {
      const r = await axios.post(`${API_URL}/admin/full-sync`, { merchantId }, { headers: ah() });
      alert(r.data.message);
      setTimeout(async () => {
        const s = await axios.get(`${API_URL}/admin/sync-status/${merchantId}`, { headers: ah() });
        setSyncStatus(s.data);
        await fetchAll();
      }, 5000);
    } catch (e: any) { alert(e.response?.data?.message || "Sync failed"); }
    finally { setLoading(null); }
  };

  const loadFilteredCustomers = async (filter: string) => {
    try {
      const r = await axios.get(
        `${API_URL}/admin/customers-filtered/${merchantId}?filter=${filter}&limit=50`,
        { headers: ah() }
      );
      setCustomers(r.data.customers || []);
      setCustomerTotal(r.data.total || 0);
      if (r.data.stats) setCustomerStats(r.data.stats);
    } catch { /* silently fail */ }
  };

  const handleAddSingleCustomer = async () => {
    if (!addCustPhone) return;
    setLoading('addcust');
    try {
      await axios.post(`${API_URL}/admin/customers/add`, {
        merchantId, name: addCustName, phone: addCustPhone, email: addCustEmail
      }, { headers: ah() });
      alert('✅ Customer added!');
      setAddCustName(''); setAddCustPhone(''); setAddCustEmail('');
      setShowAddCustomer(false);
      await loadFilteredCustomers(customerFilter);
      await fetchAll();
    } catch (e: any) { alert(e.response?.data?.message || 'Failed'); }
    finally { setLoading(null); }
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading('import');
    try {
      const text = await file.text();
      const lines = text.trim().split('\n');
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
      const nameIdx  = headers.indexOf('name');
      const phoneIdx = headers.indexOf('phone');
      const emailIdx = headers.indexOf('email');

      if (phoneIdx === -1) {
        alert('CSV must have a "phone" column');
        return;
      }

      const customers = lines.slice(1).map(line => {
        // Handle quoted CSV values
        const cols = line.match(/(".*?"|[^,]+)(?=,|$)/g)?.map(v => v.replace(/^"|"$/g, '').trim()) || line.split(',').map(v => v.trim());
        return {
          name: nameIdx >= 0 ? cols[nameIdx] || '' : '',
          phone: cols[phoneIdx] || '',
          email: emailIdx >= 0 ? cols[emailIdx] || '' : '',
        };
      }).filter(c => c.phone);

      if (customers.length === 0) {
        alert('No valid customers found in CSV');
        return;
      }

      const r = await axios.post(`${API_URL}/admin/customers/import`, {
        merchantId, customers
      }, { headers: ah() });

      alert(r.data.message);
      await loadFilteredCustomers(customerFilter);
      await fetchAll();
    } catch (e: any) { alert(e.response?.data?.message || 'Import failed'); }
    finally {
      setLoading(null);
      e.target.value = ''; // reset file input
    }
  };

  const handleLaunchCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campMetaTemplate) { alert('Please select a Meta template first'); return; }
    if (campScheduleMode === 'later' && !campScheduledAt) { alert('Please pick a date/time to schedule'); return; }

    setLoading("campaign");
    try {
      const payload: any = {
        merchantId,
        campaignName,
        metaTemplateName: campMetaTemplate,
        metaTemplateLang: campMetaLang,
        discountCode:     campDiscountCode || undefined,
        customerFilter:   campCustomerFilter,
        scheduledAt:      campScheduleMode === 'later' ? new Date(campScheduledAt).toISOString() : undefined,
      };
      const r = await axios.post(`${API_URL}/admin/launch-campaign`, payload, { headers: ah() });
      alert(`${r.data.message}\nQueued: ${r.data.totalQueued} customers\nETA: ~${r.data.etaMinutes} min`);
      // Reset form
      setCampaignName(""); setCampMetaTemplate(""); setCampDiscountCode("");
      setCampScheduledAt(""); setCampScheduleMode("now"); setCampCustomerFilter("all");
      await fetchAll();
    } catch (e: any) { alert(e.response?.data?.message || "Failed"); }
    finally { setLoading(null); }
  };

  const handleCancelCampaign = async (campaignId: string) => {
    if (!confirm('Cancel this scheduled campaign? This cannot be undone.')) return;
    try {
      await axios.post(`${API_URL}/admin/campaigns/cancel`, { campaignId }, { headers: ah() });
      alert('✅ Campaign cancelled');
      await fetchAll();
    } catch (e: any) { alert(e.response?.data?.message || 'Failed to cancel'); }
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

  const handleRegisterWebhooks = async () => {
    setLoading("webhooks");
    try {
      const r = await axios.post(`${API_URL}/admin/register-webhooks`, { merchantId }, { headers: ah() });
      setWebhookResults(r.data.results || []);
      alert(r.data.message);
    } catch (e: any) { alert(e.response?.data?.message || "Failed"); }
    finally { setLoading(null); }
  };

  const handleToggleService = async (active: boolean) => {
    setLoading("service");
    try {
      const r = await axios.post(`${API_URL}/admin/toggle-service`, { merchantId, serviceActive: active }, { headers: ah() });
      alert(r.data.message);
      await fetchAll();
    } catch (e: any) { alert(e.response?.data?.message || "Failed"); }
    finally { setLoading(null); }
  };

  const handleSetFree = async (isFree: boolean) => {
    setLoading("free");
    try {
      const r = await axios.post(`${API_URL}/admin/set-free`, { merchantId, isFree }, { headers: ah() });
      alert(r.data.message);
      await fetchAll();
    } catch (e: any) { alert(e.response?.data?.message || "Failed"); }
    finally { setLoading(null); }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading("payment");
    try {
      const r = await axios.post(`${API_URL}/admin/add-payment`, {
        merchantId,
        amount: payAmount,
        planDays: payDays,
        note: payNote || undefined,
      }, { headers: ah() });
      alert(r.data.message);
      setPayAmount(""); setPayNote("");
      await fetchAll();
    } catch (e: any) { alert(e.response?.data?.message || "Failed"); }
    finally { setLoading(null); }
  };

  const handleDeleteTemplate = async (templateName: string) => {    try {
      await axios.delete(`${API_URL}/admin/meta-templates/${merchantId}/${templateName}`, { headers: ah() });
      setMetaTemplates(prev => prev.filter(t => t.name !== templateName));
      alert(`✅ Template "${templateName}" deleted!`);
    } catch (e: any) {
      alert(e.response?.data?.message || "Delete failed");
    }
  };

  const fetchAnalytics = async (days: number = 30) => {
    setAnalyticsLoading(true);
    try {
      const r = await axios.get(`${API_URL}/admin/analytics/${merchantId}?days=${days}`, { headers: ah() });
      setAnalytics(r.data);
    } catch (e: any) { alert(e.response?.data?.message || 'Failed to load analytics'); }
    finally { setAnalyticsLoading(false); }
  };

  // Auto-load analytics when tab opens
  useEffect(() => {
    if (activeTab === 'analytics' && !analytics) fetchAnalytics(analyticsDays);
  }, [activeTab]);

  const handleCreateTemplate = async (e: React.FormEvent) => {    e.preventDefault();
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
    { key: "overview",     label: "Overview" },
    { key: "inbox",        label: "💬 Inbox" },
    { key: "flows",        label: "Flows" },
    { key: "campaign",     label: "Campaign" },
    { key: "customers",    label: `Customers (${customerTotal})` },
    { key: "analytics",    label: "📊 Analytics" },
    { key: "activitylog",  label: "🕐 Activity Log" },
    { key: "credentials",  label: "⚙️ Credentials" },
    { key: "templates",    label: "📋 Templates" },
  ];
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="h-14 md:h-16 bg-slate-900/80 backdrop-blur border-b border-white/5 flex items-center px-3 md:px-8 gap-2 md:gap-4 sticky top-0 z-10">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-slate-400 hover:text-teal-400 font-bold text-sm transition shrink-0">
          <FaArrowLeft /> <span className="hidden sm:inline">Back</span>
        </button>
        <div className="w-px h-6 bg-white/10 hidden sm:block" />
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <FaStore className="text-teal-400 text-sm shrink-0" />
          <span className="text-white font-extrabold truncate text-sm md:text-base">{merchant?.brandName || "Loading..."}</span>
          <span className="text-slate-500 text-xs hidden md:inline">· {merchantId.slice(0, 8)}...</span>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          <div className={`hidden sm:flex items-center gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-xl border text-xs font-bold ${waConnected ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-slate-700 border-white/5 text-slate-400"}`}>
            <FaWhatsapp />{waConnected ? "WA Live" : "WA Off"}
          </div>
          <div className={`px-2 md:px-3 py-1 md:py-1.5 rounded-xl text-[10px] md:text-xs font-extrabold border ${isActive ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"}`}>
            {isActive ? "● ACTIVE" : "● PENDING"}
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-br from-teal-700 to-teal-900 px-4 md:px-8 py-4 md:py-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
          <div className="flex-1">
            <p className="text-teal-200 text-xs font-bold uppercase tracking-wider mb-1">Merchant Hub</p>
            <h1 className="text-xl md:text-2xl font-extrabold text-white">{merchant?.brandName}</h1>
            <p className="text-teal-300 text-sm mt-0.5">{merchant?.storeUrl || "—"}</p>
          </div>
          <div className="flex gap-4 md:gap-8">
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
      <div className="border-b border-white/5 bg-slate-900 px-0 md:px-8">
        <div className="max-w-6xl mx-auto overflow-x-auto scrollbar-hide">
          <div className="flex whitespace-nowrap min-w-max">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key as any)}
                className={`px-3 md:px-5 py-3 md:py-4 text-xs md:text-sm font-bold border-b-2 transition shrink-0 ${activeTab === t.key ? "border-teal-400 text-teal-400" : "border-transparent text-slate-400 hover:text-slate-200"}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">

        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <div className="space-y-6">

            {/* ── Red Flags Alert Banner ── */}
            {(redFlags?.flagCount > 0 || redFlagsLoading) && (
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      redFlags?.overall === 'error'   ? 'bg-red-400 animate-pulse' :
                      redFlags?.overall === 'warning' ? 'bg-yellow-400 animate-pulse' :
                                                        'bg-green-400'
                    }`} />
                    <p className="text-white font-bold text-sm">
                      {redFlagsLoading ? 'Checking alerts...' :
                       redFlags?.overall === 'ok' ? '✅ All clear — no issues found' :
                       `🚨 ${redFlags?.flagCount} alert${redFlags?.flagCount > 1 ? 's' : ''} found`}
                    </p>
                  </div>
                  <button
                    onClick={fetchRedFlags}
                    disabled={redFlagsLoading}
                    className="text-xs text-slate-500 hover:text-slate-300 font-bold transition"
                  >
                    Refresh
                  </button>
                </div>

                {/* Flag cards */}
                {redFlags?.flags?.map((flag: any) => (
                  <div key={flag.code} className={`rounded-xl p-4 border flex items-start gap-3 ${
                    flag.level === 'error'   ? 'bg-red-500/10 border-red-500/20'     :
                    flag.level === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20' :
                                              'bg-blue-500/10 border-blue-500/20'
                  }`}>
                    <span className="text-xl mt-0.5 flex-shrink-0">
                      {flag.level === 'error' ? '🔴' : flag.level === 'warning' ? '🟡' : 'ℹ️'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`font-bold text-sm ${
                          flag.level === 'error'   ? 'text-red-400'    :
                          flag.level === 'warning' ? 'text-yellow-400' : 'text-blue-400'
                        }`}>{flag.message}</p>
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                          flag.level === 'error'   ? 'bg-red-500/20 text-red-400'      :
                          flag.level === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                                                     'bg-blue-500/20 text-blue-400'
                        }`}>{flag.level}</span>
                      </div>
                      <p className="text-slate-400 text-xs mt-1">💡 {flag.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Show "all clear" if loaded and no flags */}
            {redFlags && redFlags.flagCount === 0 && !redFlagsLoading && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex items-center gap-3">
                <span className="text-green-400 text-lg">✅</span>
                <div>
                  <p className="text-green-400 font-bold text-sm">All systems healthy</p>
                  <p className="text-slate-500 text-xs">No issues detected for this merchant</p>
                </div>
                <button onClick={fetchRedFlags} className="ml-auto text-xs text-slate-500 hover:text-slate-300 font-bold transition">
                  Refresh
                </button>
              </div>
            )}

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
              <div className="space-y-5">

                {/* ── Service Toggle + Free Badge ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Service ON/OFF */}
                  <div className="bg-slate-800 border border-white/5 rounded-2xl p-5">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Service Status</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-lg font-extrabold ${merchant?.serviceActive ? 'text-green-400' : 'text-red-400'}`}>
                          {merchant?.serviceActive ? '● Active — Messages Sending' : '● Paused — Messages Stopped'}
                        </p>
                        <p className="text-slate-500 text-xs mt-1">Toggle to pause/resume all WhatsApp messages</p>
                      </div>
                      <button
                        onClick={() => handleToggleService(!merchant?.serviceActive)}
                        disabled={loading === "service"}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm border transition ${
                          merchant?.serviceActive
                            ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                            : 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'
                        }`}
                      >
                        {loading === "service" ? <FaSpinner className="animate-spin" /> :
                          merchant?.serviceActive ? <FaToggleOn className="text-xl" /> : <FaToggleOff className="text-xl" />
                        }
                        {merchant?.serviceActive ? 'Turn OFF' : 'Turn ON'}
                      </button>
                    </div>
                  </div>

                  {/* Free/Paid toggle */}
                  <div className="bg-slate-800 border border-white/5 rounded-2xl p-5">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Merchant Type</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-lg font-extrabold ${merchant?.isFree ? 'text-blue-400' : 'text-teal-400'}`}>
                          {merchant?.isFree ? '🎁 Free Client' : '💰 Paid Client'}
                        </p>
                        <p className="text-slate-500 text-xs mt-1">
                          Total collected: ₹{merchant?.totalPaidAmount?.toFixed(0) || '0'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleSetFree(!merchant?.isFree)}
                        disabled={loading === "free"}
                        className="bg-slate-700 hover:bg-slate-600 border border-white/10 text-slate-300 px-4 py-2.5 rounded-xl font-bold text-sm transition"
                      >
                        {loading === "free" ? <FaSpinner className="animate-spin" /> :
                          merchant?.isFree ? 'Mark as Paid' : 'Mark as Free'
                        }
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── Subscription info ── */}
                <div className="bg-slate-800 border border-white/5 rounded-2xl p-5">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Subscription Info</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    {[
                      { label: 'Onboarded', value: merchant?.createdAt ? new Date(merchant.createdAt).toLocaleDateString('en-IN') : '—' },
                      { label: 'Plan Expiry', value: merchant?.subscriptionExpiry ? new Date(merchant.subscriptionExpiry).toLocaleDateString('en-IN') : 'No expiry set' },
                      { label: 'Last Payment', value: payments.length > 0 ? new Date(payments[0].paidAt).toLocaleDateString('en-IN') : 'No payments' },
                      { label: 'Total Payments', value: payments.length },
                    ].map((s, i) => (
                      <div key={i} className="bg-slate-900 rounded-xl p-3">
                        <p className="text-white font-bold text-sm">{s.value}</p>
                        <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Add Payment ── */}
                <div className="bg-slate-800 border border-teal-500/20 rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-teal-500/10 flex items-center gap-2">
                    <FaRupeeSign className="text-teal-400" />
                    <div>
                      <p className="text-white font-extrabold">Record Payment</p>
                      <p className="text-slate-400 text-xs">Add when merchant pays — extends subscription + updates total</p>
                    </div>
                  </div>
                  <form onSubmit={handleAddPayment} className="p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-400 mb-1 block">Amount (₹)</label>
                        <input
                          type="number"
                          required
                          placeholder="e.g. 3999"
                          value={payAmount}
                          onChange={e => setPayAmount(e.target.value)}
                          className="w-full p-3 bg-slate-900 border border-white/10 text-white placeholder-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 mb-1 block">Plan Days</label>
                        <div className="flex gap-2">
                          <select
                            value={payDays}
                            onChange={e => setPayDays(e.target.value)}
                            className="flex-1 p-3 bg-slate-900 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                          >
                            <option value="30">30 Days</option>
                            <option value="60">60 Days</option>
                            <option value="90">90 Days</option>
                            <option value="180">180 Days</option>
                            <option value="365">365 Days</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 mb-1 block">Note (optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. Diwali offer, First payment"
                          value={payNote}
                          onChange={e => setPayNote(e.target.value)}
                          className="w-full p-3 bg-slate-900 border border-white/10 text-white placeholder-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading === "payment" || !payAmount}
                      className="w-full bg-teal-500 hover:bg-teal-400 text-white font-bold py-3 rounded-xl disabled:opacity-40 flex items-center justify-center gap-2 transition"
                    >
                      {loading === "payment" ? <><FaSpinner className="animate-spin" /> Saving...</> : <><FaRupeeSign /> Record Payment & Extend Subscription</>}
                    </button>
                  </form>
                </div>

                {/* ── Payment History ── */}
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
                            <p className="text-white font-bold text-sm">
                              {p.amount === 0 ? '🎁 Free' : `₹${p.amount.toFixed(0)}`}
                              <span className="text-slate-500 font-normal ml-2">— {p.planDays} days</span>
                            </p>
                            {p.note && <p className="text-slate-500 text-xs">{p.note}</p>}
                          </div>
                          <p className="text-slate-400 text-xs">{new Date(p.paidAt).toLocaleDateString('en-IN')}</p>
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

            {/* ── WhatsApp Business Account Info ── */}
            <div className="bg-slate-800 border border-white/5 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FaWhatsapp className="text-green-400" />
                  <span className="text-white font-bold">WhatsApp Business Account</span>
                </div>
                <button
                  onClick={fetchWabaInfo}
                  disabled={wabaLoading}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white text-xs font-bold rounded-xl transition disabled:opacity-40"
                >
                  <FaSync className={wabaLoading ? 'animate-spin' : ''} /> {wabaInfo ? 'Refresh' : 'Load Info'}
                </button>
              </div>

              {!wabaInfo && !wabaLoading && (
                <div className="px-6 py-8 text-center">
                  <p className="text-slate-500 text-sm">Click "Load Info" to fetch live data from Meta</p>
                </div>
              )}

              {wabaLoading && (
                <div className="px-6 py-8 flex items-center justify-center gap-3">
                  <FaSpinner className="animate-spin text-teal-400" />
                  <span className="text-slate-400 text-sm">Fetching from Meta API...</span>
                </div>
              )}

              {wabaInfo?.error && (
                <div className="px-6 py-4">
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-xs">
                    ❌ {wabaInfo.error}
                  </div>
                </div>
              )}

              {wabaInfo && !wabaInfo.error && (
                <div className="p-6 space-y-5">
                  {/* Quality Rating Alert */}
                  {wabaInfo.qualityColor === 'red' && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                      <span className="text-2xl">🚨</span>
                      <div>
                        <p className="text-red-400 font-bold text-sm">Quality Rating is RED — Action Required!</p>
                        <p className="text-red-300 text-xs mt-1">Meta may restrict or block your number. Pause campaigns immediately and review message quality.</p>
                      </div>
                    </div>
                  )}
                  {wabaInfo.qualityColor === 'yellow' && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
                      <span className="text-xl">⚠️</span>
                      <div>
                        <p className="text-yellow-400 font-bold text-sm">Quality Rating is YELLOW — Monitor Closely</p>
                        <p className="text-yellow-300 text-xs mt-1">Reduce campaign frequency and avoid spammy messages to recover rating.</p>
                      </div>
                    </div>
                  )}

                  {/* Main info grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { label: 'Phone Number',    value: wabaInfo.phoneNumber,   icon: '📞' },
                      { label: 'Display Name',    value: wabaInfo.displayName,   icon: '🏷️' },
                      { label: 'WABA Name',        value: wabaInfo.wabaName,      icon: '🏢' },
                      { label: 'Account Mode',    value: wabaInfo.accountMode,   icon: wabaInfo.accountMode === 'LIVE' ? '🟢' : '🔵' },
                      { label: 'Verification',    value: wabaInfo.verificationStatus, icon: '✅' },
                      { label: 'Review Status',   value: wabaInfo.reviewStatus,  icon: '📋' },
                    ].map(item => (
                      <div key={item.label} className="bg-slate-900/50 rounded-xl p-3">
                        <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">{item.icon} {item.label}</p>
                        <p className="text-white text-sm font-bold truncate">{item.value || '—'}</p>
                      </div>
                    ))}
                  </div>

                  {/* Quality Rating + Messaging Tier — prominent display */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Quality Rating */}
                    <div className={`rounded-xl p-4 border ${
                      wabaInfo.qualityColor === 'green'  ? 'bg-green-500/10 border-green-500/20' :
                      wabaInfo.qualityColor === 'yellow' ? 'bg-yellow-500/10 border-yellow-500/20' :
                      wabaInfo.qualityColor === 'red'    ? 'bg-red-500/10 border-red-500/20' :
                                                           'bg-slate-700 border-white/10'
                    }`}>
                      <p className="text-slate-400 text-[10px] font-bold uppercase mb-2">Quality Rating</p>
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${
                          wabaInfo.qualityColor === 'green'  ? 'bg-green-400' :
                          wabaInfo.qualityColor === 'yellow' ? 'bg-yellow-400' :
                          wabaInfo.qualityColor === 'red'    ? 'bg-red-400 animate-pulse' :
                                                               'bg-slate-500'
                        }`} />
                        <span className={`text-xl font-extrabold ${
                          wabaInfo.qualityColor === 'green'  ? 'text-green-400' :
                          wabaInfo.qualityColor === 'yellow' ? 'text-yellow-400' :
                          wabaInfo.qualityColor === 'red'    ? 'text-red-400' :
                                                               'text-slate-400'
                        }`}>{wabaInfo.qualityRating}</span>
                      </div>
                    </div>

                    {/* Messaging Tier */}
                    <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-4">
                      <p className="text-slate-400 text-[10px] font-bold uppercase mb-2">Messaging Limit</p>
                      <p className="text-teal-400 text-xl font-extrabold">{wabaInfo.messagingTier}</p>
                      <div className="mt-2 flex gap-1 flex-wrap">
                        {['TIER_50','TIER_250','TIER_1K','TIER_10K','TIER_100K','UNLIMITED'].map((t, i) => {
                          const tiers  = ['TIER_50','TIER_250','TIER_1K','TIER_10K','TIER_100K','UNLIMITED'];
                          const curIdx = tiers.indexOf(wabaInfo.tierRaw);
                          const active = i === curIdx;
                          const passed = i < curIdx;
                          return (
                            <span key={t} className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                              active ? 'bg-teal-500 text-white' :
                              passed ? 'bg-teal-500/20 text-teal-400' :
                                       'bg-white/5 text-slate-600'
                            }`}>
                              {t.replace('TIER_','').replace('K','k')}
                            </span>
                          );
                        })}
                      </div>
                      <p className="text-slate-500 text-[10px] mt-2">Upgrade by maintaining high quality + volume</p>
                    </div>
                  </div>

                  {/* IDs for reference */}
                  <div className="bg-slate-900/50 rounded-xl p-3 space-y-1.5">
                    <p className="text-slate-500 text-[10px] font-bold uppercase mb-2">Reference IDs</p>
                    {[
                      { label: 'Phone Number ID', value: wabaInfo.phoneNumberId },
                      { label: 'WABA ID',          value: wabaInfo.wabaId },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between gap-4">
                        <span className="text-slate-500 text-xs">{item.label}</span>
                        <span className="text-slate-300 text-xs font-mono truncate">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── ROI Report / Invoice Generator ── */}
            <div className="bg-slate-800 border border-white/5 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-white font-extrabold flex items-center gap-2">
                    📊 ROI Report
                  </p>
                  <p className="text-slate-400 text-xs mt-0.5">Generate renewal message for merchant — shows revenue recovered vs subscription fee</p>
                </div>
              </div>

              {/* Controls */}
              <div className="px-6 py-4 border-b border-white/5">
                <div className="flex flex-wrap gap-3 items-end">
                  {/* Period selector */}
                  <div>
                    <label className="text-slate-500 text-[10px] font-bold uppercase block mb-1.5">Period</label>
                    <div className="flex gap-1.5">
                      {[7, 30, 60, 90].map(d => (
                        <button
                          key={d}
                          onClick={() => setRoiDays(d)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                            roiDays === d
                              ? 'bg-teal-500/20 border-teal-500/30 text-teal-300'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                          }`}
                        >
                          {d}d
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Monthly fee input */}
                  <div>
                    <label className="text-slate-500 text-[10px] font-bold uppercase block mb-1.5">Monthly Fee (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
                      <input
                        type="number"
                        value={roiFee}
                        onChange={e => setRoiFee(e.target.value)}
                        placeholder="5000"
                        className="pl-7 pr-3 py-2 bg-slate-900 border border-white/10 text-white rounded-xl text-xs font-mono w-28 outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  {/* Generate button */}
                  <button
                    onClick={() => generateRoiReport(roiDays, roiFee)}
                    disabled={roiLoading}
                    className="flex items-center gap-2 px-5 py-2 bg-teal-500 hover:bg-teal-400 text-white text-xs font-bold rounded-xl transition disabled:opacity-50"
                  >
                    {roiLoading
                      ? <><FaSpinner className="animate-spin" /> Generating...</>
                      : <>📊 Generate Report</>
                    }
                  </button>
                </div>
              </div>

              {/* Report Output */}
              {roiReport && (
                <div className="p-6 space-y-5">

                  {/* ── KPI Cards ── */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { icon: '💬', label: 'Messages Sent',    value: roiReport.messages.sent.toLocaleString('en-IN'),         color: 'text-blue-400',   bg: 'bg-blue-500/10' },
                      { icon: '👁️', label: 'Read Rate',        value: `${roiReport.messages.openRate}%`,                       color: 'text-teal-400',   bg: 'bg-teal-500/10' },
                      { icon: '🛒', label: 'Carts Recovered',  value: roiReport.engagement.cartsRecovered.toLocaleString('en-IN'), color: 'text-orange-400', bg: 'bg-orange-500/10' },
                      { icon: '💰', label: 'Revenue Recovered', value: `₹${roiReport.revenue.recovered.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, color: 'text-green-400',  bg: 'bg-green-500/10' },
                    ].map(s => (
                      <div key={s.label} className={`${s.bg} rounded-xl p-3 md:p-4`}>
                        <p className="text-xl mb-1">{s.icon}</p>
                        <p className={`text-lg md:text-xl font-extrabold ${s.color}`}>{s.value}</p>
                        <p className="text-slate-500 text-[10px] font-bold mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* ── ROI Highlight ── */}
                  <div className={`rounded-xl p-4 border flex items-center gap-4 ${
                    parseFloat(roiReport.revenue.roi) >= 100
                      ? 'bg-green-500/10 border-green-500/20'
                      : 'bg-yellow-500/10 border-yellow-500/20'
                  }`}>
                    <div className="text-3xl shrink-0">
                      {parseFloat(roiReport.revenue.roi) >= 100 ? '🚀' : '📈'}
                    </div>
                    <div className="flex-1">
                      <p className={`font-extrabold text-lg ${parseFloat(roiReport.revenue.roi) >= 100 ? 'text-green-400' : 'text-yellow-400'}`}>
                        {roiReport.revenue.roi}% ROI
                      </p>
                      <p className="text-slate-300 text-sm mt-0.5">
                        Every ₹1 spent on subscription returned <strong className="text-white">₹{roiReport.revenue.revenuePerRupee}</strong> in recovered revenue
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-slate-400 text-xs">Fee paid</p>
                      <p className="text-white font-extrabold">₹{parseFloat(roiFee).toLocaleString('en-IN')}</p>
                    </div>
                  </div>

                  {/* ── More stats ── */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { label: 'Delivery Rate',    value: `${roiReport.messages.deliveryRate}%`,     icon: '✅' },
                      { label: 'Click Rate',        value: `${roiReport.engagement.clickRate}%`,      icon: '🔗' },
                      { label: 'Cart Recovery Rate', value: `${roiReport.engagement.cartRecoveryRate}%`, icon: '🛒' },
                      { label: 'Link Clicks',       value: roiReport.engagement.clicks.toLocaleString('en-IN'), icon: '👆' },
                      { label: 'Carts Targeted',    value: roiReport.engagement.cartsSent.toLocaleString('en-IN'), icon: '🎯' },
                      { label: 'Campaigns Sent',    value: roiReport.campaigns.length,               icon: '📢' },
                    ].map(s => (
                      <div key={s.label} className="bg-slate-900/50 rounded-xl p-3 flex items-center gap-3">
                        <span className="text-lg shrink-0">{s.icon}</span>
                        <div>
                          <p className="text-white font-extrabold text-sm">{s.value}</p>
                          <p className="text-slate-500 text-[10px] font-bold">{s.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ── WhatsApp Message Preview ── */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-slate-400 text-xs font-bold uppercase">📱 WhatsApp Message (copy & send to merchant)</p>
                      <button
                        onClick={copyRoiMessage}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition ${
                          roiCopied
                            ? 'bg-green-500/20 border-green-500/30 text-green-400'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {roiCopied ? '✅ Copied!' : '📋 Copy Message'}
                      </button>
                    </div>
                    <div className="bg-slate-900 border border-white/5 rounded-xl p-4">
                      <pre className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap font-sans">
                        {roiReport.whatsappMessage}
                      </pre>
                    </div>
                    <p className="text-slate-600 text-[10px] mt-2">
                      Generated at: {new Date(roiReport.generatedAt).toLocaleString('en-IN')}
                    </p>
                  </div>

                </div>
              )}
            </div>

          </div>
        )}

        {/* ── FLOWS TAB ── */}
        {activeTab === "flows" && (
          <div className="space-y-6">
            {/* Info */}
            <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-xl p-4 text-sm text-slate-300 flex items-start gap-3">
              <FaRobot className="text-indigo-400 mt-0.5 shrink-0 text-lg" />
              <div>
                <p className="text-indigo-300 font-bold mb-1">How to set up a flow</p>
                <p>1. Select approved WhatsApp template &nbsp;·&nbsp; 2. Set delay &nbsp;·&nbsp; 3. Toggle ON &nbsp;·&nbsp; 4. Click <strong>Save &amp; Publish</strong></p>
              </div>
            </div>

            {FLOW_TYPES.map(ft => {
              const db = flows.find((f: any) => f.type === ft.type);
              const draft = flowDrafts[ft.type];
              const currentTemplate = draft?.template ?? db?.metaTemplateName ?? '';
              const currentDelay = draft?.delay ?? db?.delayMinutes ?? ft.defaultDelay;
              const currentActive = draft?.active ?? db?.isActive ?? false;
              const currentLang = draft?.lang ?? (db as any)?.metaTemplateLang ?? 'en_US';
              const currentDiscount = draft?.discount ?? (db as any)?.discountCode ?? '';
              const isDirty = draft !== undefined;
              const approvedTemplates = metaTemplates.filter((t: any) => t.status === 'APPROVED');

              const updateDraft = (patch: Partial<{ template: string; delay: number; active: boolean; lang: string; discount: string }>) => {
                setFlowDrafts(prev => ({
                  ...prev,
                  [ft.type]: {
                    template: patch.template !== undefined ? patch.template : currentTemplate,
                    delay: patch.delay !== undefined ? patch.delay : currentDelay,
                    active: patch.active !== undefined ? patch.active : currentActive,
                    lang: patch.lang !== undefined ? patch.lang : currentLang,
                    discount: patch.discount !== undefined ? patch.discount : currentDiscount,
                  }
                }));
              };

              const handleSaveFlow = async () => {
                if (!currentTemplate) { alert('Please select a WhatsApp template first.'); return; }
                setLoading(`flow-${ft.type}`);
                try {
                  await axios.post(`${API_URL}/admin/flows/save`, {
                    merchantId, type: ft.type,
                    delayMinutes: currentDelay,
                    template: ft.defaultTemplate,
                    metaTemplateName: currentTemplate,
                    metaTemplateLang: currentLang,
                    discountCode: currentDiscount || null,
                    isActive: currentActive,
                  }, { headers: ah() });
                  setFlowDrafts(prev => { const n = { ...prev }; delete n[ft.type]; return n; });
                  await fetchAll();
                  alert(`✅ Flow "${ft.label}" saved!`);
                } catch (e: any) { alert(e.response?.data?.message || 'Save failed'); }
                finally { setLoading(null); }
              };

              return (
                <div key={ft.type} className={`bg-slate-800 rounded-2xl overflow-hidden border-2 transition ${
                  currentActive && !isDirty ? 'border-green-500/40' : isDirty ? 'border-amber-500/40' : 'border-white/5'
                }`}>
                  {/* Header */}
                  <div className={`px-6 py-4 flex items-center justify-between ${currentActive && !isDirty ? 'bg-green-500/5' : isDirty ? 'bg-amber-500/5' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${ft.bg} rounded-xl flex items-center justify-center`}>
                        <span className={`text-lg ${ft.color}`}>{ft.icon}</span>
                      </div>
                      <div>
                        <p className="text-white font-extrabold text-sm">{ft.label}</p>
                        <p className="text-slate-500 text-xs">
                          {currentActive && !isDirty ? `🟢 LIVE · ${currentTemplate} (${currentLang}) · ${currentDelay} min delay`
                            : isDirty ? '🟡 Unsaved changes'
                            : 'Not configured'}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
                      currentActive && !isDirty ? 'bg-green-500/10 border-green-500/20 text-green-400'
                      : isDirty ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                      : 'bg-slate-700 border-white/10 text-slate-400'
                    }`}>
                      {currentActive && !isDirty ? '● LIVE' : isDirty ? 'UNSAVED' : 'OFF'}
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
                            ⚠️ No approved templates.{' '}
                            <button onClick={() => setActiveTab('templates')} className="underline font-bold">Create one →</button>
                          </div>
                        ) : (
                          <select
                            value={currentTemplate}
                            onChange={e => {
                            const selected = e.target.value;
                            const tmpl = metaTemplates.find((t: any) => t.name === selected);
                            const lang = tmpl?.language || 'en_US';
                            updateDraft({ template: selected, lang });
                          }}
                            className="w-full p-3 bg-slate-900 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                          >
                            <option value="">-- Select Template --</option>
                            {approvedTemplates.map((t: any) => (
                              <option key={t.name} value={t.name}>{t.name} ({t.language})</option>
                            ))}
                          </select>
                        )}
                        {currentTemplate && (() => {
                          const tmpl = metaTemplates.find((t: any) => t.name === currentTemplate);
                          const body = tmpl?.components?.find((c: any) => c.type === 'BODY');
                          return body ? (
                            <div className="mt-2 bg-slate-900 border border-white/5 rounded-lg p-3 text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                              {body.text.substring(0, 150)}{body.text.length > 150 ? '...' : ''}
                            </div>
                          ) : null;
                        })()}
                      </div>

                      {/* Delay */}
                      <div>
                        <label className="text-xs font-bold text-slate-400 mb-2 block">Send After (minutes)</label>
                        <input
                          type="number"
                          min="1"
                          value={currentDelay}
                          onChange={e => updateDraft({ delay: parseInt(e.target.value) || 1 })}
                          className="w-full p-3 bg-slate-900 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                        <div className="mt-2 grid grid-cols-4 gap-1">
                          {[{ label: '1 min', val: 1 }, { label: '30 min', val: 30 }, { label: '1 hr', val: 60 }, { label: '24 hrs', val: 1440 }].map(p => (
                            <button key={p.val} type="button" onClick={() => updateDraft({ delay: p.val })}
                              className={`text-xs py-1.5 rounded-lg border font-bold transition ${currentDelay === p.val ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}>
                              {p.label}
                            </button>
                          ))}
                        </div>
                        <p className="text-slate-600 text-xs mt-1.5">Use 1 min for testing · 30 min for production</p>
                      </div>
                    </div>

                    {/* Discount code */}
                    <div>
                      <label className="text-xs font-bold text-slate-400 mb-2 block">
                        Discount Code <span className="text-slate-600">(optional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. VIP10, SAVE5, WELCOME20"
                        value={currentDiscount}
                        onChange={e => updateDraft({ discount: e.target.value.toUpperCase() })}
                        className="w-full p-3 bg-slate-900 border border-white/10 text-white placeholder-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                      />
                      <p className="text-slate-600 text-xs mt-1.5">
                        Auto-appended to cart URL + tracked separately in Analytics
                      </p>
                    </div>

                    {/* Toggle + Save button */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <div
                          onClick={() => updateDraft({ active: !currentActive })}
                          className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 cursor-pointer ${currentActive ? 'bg-green-500' : 'bg-slate-600'}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${currentActive ? 'translate-x-6' : 'translate-x-0'}`} />
                        </div>
                        <span className={`text-sm font-bold ${currentActive ? 'text-green-400' : 'text-slate-400'}`}>
                          {currentActive ? 'Enabled' : 'Disabled'}
                        </span>
                      </label>

                      <div className="flex items-center gap-3">
                        {/* Quick Pause/Resume — saves immediately without other changes */}
                        {db && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await axios.post(`${API_URL}/admin/flows/toggle`, {
                                  merchantId, type: ft.type, isActive: !db.isActive
                                }, { headers: ah() });
                                await fetchAll();
                              } catch { alert('Toggle failed'); }
                            }}
                            className={`px-4 py-2.5 rounded-xl font-bold text-sm border transition flex items-center gap-2 ${
                              db.isActive
                                ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                                : 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'
                            }`}
                          >
                            {db.isActive ? '⏸ Pause' : '▶ Resume'}
                          </button>
                        )}

                        <button
                          onClick={handleSaveFlow}
                          disabled={loading === `flow-${ft.type}`}
                          className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-bold px-6 py-2.5 rounded-xl disabled:opacity-40 flex items-center gap-2 transition text-sm shadow-lg shadow-teal-900/30"
                        >
                          {loading === `flow-${ft.type}` ? <><FaSpinner className="animate-spin" /> Saving...</> : <><FaCheckCircle /> Save &amp; Publish</>}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="flex gap-4">
              <button onClick={() => { fetchMetaTemplates(); setActiveTab('templates'); }}
                className="bg-indigo-500/20 hover:bg-indigo-500 border border-indigo-500/30 text-indigo-300 hover:text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition">
                <FaTag /> Manage Templates
              </button>
            </div>
          </div>
        )}

        {/* ── CAMPAIGN TAB ── */}
        {activeTab === "campaign" && (
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
                  <input
                    type="text" required
                    placeholder="e.g. Diwali Sale 2025, Akshaya Tritiya Offer"
                    value={campaignName}
                    onChange={e => setCampaignName(e.target.value)}
                    className="w-full p-3 bg-slate-900 border border-white/10 text-white placeholder-slate-500 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>

                {/* Meta Template Selector */}
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-2 block">WhatsApp Template <span className="text-red-400">*</span></label>
                  {metaTemplates.filter((t: any) => t.status === 'APPROVED').length === 0 ? (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                      ⚠️ No approved templates found.
                      <button type="button" onClick={() => setActiveTab('templates')} className="underline font-bold">Create one →</button>
                    </div>
                  ) : (
                    <select
                      required
                      value={campMetaTemplate}
                      onChange={e => {
                        const name = e.target.value;
                        setCampMetaTemplate(name);
                        const tmpl = metaTemplates.find((t: any) => t.name === name);
                        if (tmpl?.language) setCampMetaLang(tmpl.language);
                      }}
                      className="w-full p-3 bg-slate-900 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    >
                      <option value="">— Select an approved template —</option>
                      {metaTemplates.filter((t: any) => t.status === 'APPROVED').map((t: any) => (
                        <option key={t.name} value={t.name}>{t.name} ({t.language})</option>
                      ))}
                    </select>
                  )}

                  {/* Template preview */}
                  {campMetaTemplate && (() => {
                    const tmpl = metaTemplates.find((t: any) => t.name === campMetaTemplate);
                    const body = tmpl?.components?.find((c: any) => c.type === 'BODY');
                    return body ? (
                      <div className="mt-2 bg-slate-900 border border-white/5 rounded-xl p-3 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                        <span className="text-slate-500 text-[10px] font-bold uppercase block mb-1">Preview</span>
                        {body.text.substring(0, 200)}{body.text.length > 200 ? '...' : ''}
                      </div>
                    ) : null;
                  })()}
                </div>

                {/* Discount Code + Customer Filter */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-2 block">Discount Code <span className="text-slate-600">(optional)</span></label>
                    <input
                      type="text"
                      placeholder="e.g. DIWALI20"
                      value={campDiscountCode}
                      onChange={e => setCampDiscountCode(e.target.value.toUpperCase())}
                      className="w-full p-3 bg-slate-900 border border-white/10 text-white placeholder-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-2 block">Send To</label>
                    <select
                      value={campCustomerFilter}
                      onChange={e => setCampCustomerFilter(e.target.value)}
                      className="w-full p-3 bg-slate-900 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    >
                      <option value="all">All Customers ({customerTotal})</option>
                      <option value="abandoned">Abandoned Cart only</option>
                      <option value="ordered">Placed Order only</option>
                    </select>
                  </div>
                </div>

                {/* Schedule Toggle */}
                <div className="border border-white/10 rounded-xl overflow-hidden">
                  <div className="flex">
                    <button
                      type="button"
                      onClick={() => setCampScheduleMode('now')}
                      className={`flex-1 py-3 text-sm font-bold transition flex items-center justify-center gap-2 ${
                        campScheduleMode === 'now'
                          ? 'bg-indigo-500/20 text-indigo-300 border-b-2 border-indigo-400'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      <FaPlay className="text-xs" /> Send Now
                    </button>
                    <button
                      type="button"
                      onClick={() => setCampScheduleMode('later')}
                      className={`flex-1 py-3 text-sm font-bold transition flex items-center justify-center gap-2 ${
                        campScheduleMode === 'later'
                          ? 'bg-teal-500/20 text-teal-300 border-b-2 border-teal-400'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      <FaClock className="text-xs" /> Schedule
                    </button>
                  </div>

                  {campScheduleMode === 'later' && (
                    <div className="p-4 bg-slate-900/50">
                      <label className="text-xs font-bold text-slate-400 mb-2 block">Pick Date & Time</label>
                      <input
                        type="datetime-local"
                        required={campScheduleMode === 'later'}
                        value={campScheduledAt}
                        min={new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16)}
                        onChange={e => setCampScheduledAt(e.target.value)}
                        className="w-full p-3 bg-slate-800 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                      />
                      {campScheduledAt && (
                        <p className="text-teal-400 text-xs mt-2 font-bold">
                          📅 Will send on: {new Date(campScheduledAt).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* ETA Info */}
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300 flex items-start gap-2">
                  <FaClock className="mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold">{customerTotal} customers × 15s = ~{Math.ceil((customerTotal * 15) / 60)} min total</span>
                    <span className="text-amber-400/70 ml-2">· Customers without phone & opted-out are auto-skipped</span>
                  </div>
                </div>

                {!isActive && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-400 flex items-center gap-2">
                    ❌ Merchant must be ACTIVE to launch campaigns
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading === "campaign" || !isActive || !campMetaTemplate || customerTotal === 0}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-bold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2 text-sm transition"
                >
                  {loading === "campaign"
                    ? <><FaSpinner className="animate-spin" /> {campScheduleMode === 'later' ? 'Scheduling...' : 'Launching...'}</>
                    : campScheduleMode === 'later'
                      ? <><FaClock /> Schedule Campaign</>
                      : <><FaPlay /> Launch Now</>
                  }
                </button>
              </form>
            </div>

            {/* ── Campaign History ── */}
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
                          {c.metaTemplateName && (
                            <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-mono">{c.metaTemplateName}</span>
                          )}
                          {c.discountCode && (
                            <span className="text-[10px] bg-green-500/10 border border-green-500/20 text-green-300 px-1.5 py-0.5 rounded font-mono">{c.discountCode}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <p className="text-slate-500 text-xs">{new Date(c.createdAt).toLocaleDateString('en-IN')}</p>
                          {c.scheduledAt && (
                            <p className="text-teal-400 text-xs font-bold">
                              📅 {new Date(c.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                            </p>
                          )}
                          <p className="text-slate-400 text-xs">{c.sentCount}/{c.totalRecipients} sent</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[10px] font-extrabold px-2 py-1 rounded-full border ${
                          c.status === 'COMPLETED'  ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                          c.status === 'SENDING'    ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                          c.status === 'SCHEDULED'  ? 'bg-teal-500/10 border-teal-500/20 text-teal-400' :
                          c.status === 'CANCELLED'  ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                                      'bg-slate-700 border-white/10 text-slate-400'
                        }`}>
                          {c.status === 'SCHEDULED' ? '📅 ' : ''}{c.status}
                        </span>
                        {c.status === 'SCHEDULED' && (
                          <button
                            onClick={() => handleCancelCampaign(c.id)}
                            className="text-[10px] px-2 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg font-bold transition"
                          >
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
        )}

        {/* ── CUSTOMERS TAB ── */}
        {activeTab === "customers" && (
          <div className="space-y-5">

            {/* Sync Status Bar */}
            <SyncStatusBar
              merchantId={merchantId}
              isActive={isActive}
              onFullSync={handleFullSync}
              onQuickSync={handleSync}
              loading={loading}
            />

            {/* ── Customer Stats Cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: 'Total', value: customerTotal, color: 'text-white', bg: 'bg-slate-700', border: 'border-white/10', filter: 'all' },
                { label: '🛒 Abandoned', value: customerStats?.abandonedCount ?? '—', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', filter: 'abandoned' },
                { label: '✅ Ordered', value: customerStats?.orderedCount ?? '—', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', filter: 'ordered' },
                { label: '📵 No Phone', value: customerStats?.noPhoneCount ?? '—', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', filter: 'no_phone' },
                { label: '🚫 WA Invalid', value: customerStats?.waInvalidCount ?? '—', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', filter: 'wa_invalid' },
              ].map(s => (
                <button
                  key={s.filter}
                  onClick={() => { setCustomerFilter(s.filter); loadFilteredCustomers(s.filter); }}
                  className={`${s.bg} border ${s.border} rounded-xl p-3 text-left transition hover:opacity-80 ${customerFilter === s.filter ? 'ring-2 ring-teal-400' : ''}`}
                >
                  <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
                  <p className="text-slate-400 text-xs mt-0.5 font-bold">{s.label}</p>
                </button>
              ))}
            </div>

            {/* ── Alert if no_phone / wa_invalid selected ── */}
            {customerFilter === 'no_phone' && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-xs text-red-300 flex items-start gap-3">
                <span className="text-lg">📵</span>
                <div>
                  <p className="font-bold text-red-400 mb-1">Customers without WhatsApp phone number</p>
                  <p>These customers have no phone or only an email. WhatsApp messages <strong>cannot be sent</strong> to them. You can manually add their phone number using the Edit option.</p>
                </div>
              </div>
            )}
            {customerFilter === 'wa_invalid' && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-xs text-yellow-300 flex items-start gap-3">
                <span className="text-lg">🚫</span>
                <div>
                  <p className="font-bold text-yellow-400 mb-1">Numbers not registered on WhatsApp</p>
                  <p>These numbers were tried but Meta returned an error — the number is not on WhatsApp. Future messages to these numbers will be <strong>automatically skipped</strong> to save API quota.</p>
                </div>
              </div>
            )}

            {/* Actions row */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="ml-auto flex gap-2 flex-wrap">
                {/* Export CSV */}
                <a
                  href={`${API_URL}/admin/customers/export/${merchantId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-700 hover:bg-slate-600 border border-white/10 text-slate-300 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition"
                  onClick={e => {
                    e.preventDefault();
                    fetch(`${API_URL}/admin/customers/export/${merchantId}`, { headers: ah() })
                      .then(r => r.blob())
                      .then(blob => {
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `customers-${merchantId}.csv`;
                        a.click();
                      });
                  }}
                >
                  ⬇️ Export CSV
                </a>

                {/* Import CSV */}
                <label className="bg-teal-500/20 hover:bg-teal-500 border border-teal-500/30 text-teal-300 hover:text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer">
                  ⬆️ Import CSV
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleImportCSV}
                  />
                </label>

                {/* Add single */}
                <button
                  onClick={() => setShowAddCustomer(!showAddCustomer)}
                  className="bg-indigo-500/20 hover:bg-indigo-500 border border-indigo-500/30 text-indigo-300 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition"
                >
                  + Add Customer
                </button>
              </div>
            </div>

            {/* Add single customer form */}
            {showAddCustomer && (
              <div className="bg-slate-800 border border-indigo-500/20 rounded-2xl p-5">
                <p className="text-white font-bold mb-3 text-sm">Add Customer Manually</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Name"
                    value={addCustName}
                    onChange={e => setAddCustName(e.target.value)}
                    className="p-3 bg-slate-900 border border-white/10 text-white placeholder-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                  <input
                    type="tel"
                    placeholder="Phone (e.g. 9876543210)"
                    value={addCustPhone}
                    onChange={e => setAddCustPhone(e.target.value)}
                    className="p-3 bg-slate-900 border border-white/10 text-white placeholder-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                  <input
                    type="email"
                    placeholder="Email (optional)"
                    value={addCustEmail}
                    onChange={e => setAddCustEmail(e.target.value)}
                    className="p-3 bg-slate-900 border border-white/10 text-white placeholder-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
                <div className="flex gap-3 mt-3">
                  <button
                    onClick={handleAddSingleCustomer}
                    disabled={loading === 'addcust' || !addCustPhone}
                    className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold px-5 py-2.5 rounded-xl text-sm disabled:opacity-40 flex items-center gap-2 transition"
                  >
                    {loading === 'addcust' ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />} Save Customer
                  </button>
                  <button onClick={() => setShowAddCustomer(false)} className="text-slate-400 hover:text-white text-sm transition">Cancel</button>
                </div>
              </div>
            )}

            {/* CSV format hint */}
            <div className="bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-xs text-slate-500">
              📋 CSV format: <code className="text-teal-400">name,phone,email</code> — one customer per row. Phone required.
            </div>

            {/* Customers table */}
            <div className="bg-slate-800 border border-white/5 rounded-2xl overflow-hidden">
              {/* table-like grid — scroll horizontally on mobile */}
              <div className="overflow-x-auto">
                <div className="min-w-[540px]">
                  <div className="px-4 md:px-6 py-3 border-b border-white/5 grid grid-cols-12 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <span className="col-span-3">Customer</span>
                    <span className="col-span-3">Phone</span>
                    <span className="col-span-2">Orders</span>
                    <span className="col-span-2">Total Spent</span>
                    <span className="col-span-2">Type</span>
                  </div>
                  {customers.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                      <FaUsers className="text-slate-600 text-3xl mx-auto mb-2" />
                      <p className="text-slate-500 text-sm">No customers found. Sync from Shopify or import CSV.</p>
                    </div>
                  ) : customers.map((c: any) => (
                    <div key={c.id} className="px-4 md:px-6 py-3 grid grid-cols-12 border-b border-white/5 hover:bg-white/3 transition items-center">
                      <div className="col-span-3">
                        <p className="text-white text-sm font-medium">{c.name || '—'}</p>
                        {c.city && <p className="text-slate-500 text-xs">{c.city}</p>}
                      </div>
                      <span className="col-span-3 text-slate-400 text-xs font-mono truncate">{c.phone}</span>
                      <span className="col-span-2 text-slate-300 text-sm">{c.totalOrders || 0}</span>
                      <span className="col-span-2 text-teal-400 text-sm font-bold">₹{(c.totalSpent || 0).toFixed(0)}</span>
                      <div className="col-span-2 flex gap-1 flex-wrap">
                        {c.hasAbandonedCart && <span className="bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[9px] font-bold px-1.5 py-0.5 rounded">Cart</span>}
                        {c.hasPlacedOrder && <span className="bg-green-500/10 border border-green-500/20 text-green-400 text-[9px] font-bold px-1.5 py-0.5 rounded">Order</span>}
                        {(c.phone === 'NO_PHONE' || c.phone === '' || c.phone?.startsWith('email:')) && <span className="bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-bold px-1.5 py-0.5 rounded">No Phone</span>}
                        {c.tags?.includes('wa_invalid') && <span className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[9px] font-bold px-1.5 py-0.5 rounded">WA ✗</span>}
                        {!c.hasAbandonedCart && !c.hasPlacedOrder && c.phone !== 'NO_PHONE' && !c.phone?.startsWith('email:') && !c.tags?.includes('wa_invalid') && <span className="text-slate-600 text-[9px]">—</span>}
                      </div>
                    </div>
                  ))}
                  {customerTotal > customers.length && (
                    <div className="px-6 py-3 text-center text-slate-500 text-xs">
                      Showing {customers.length} of {customerTotal} customers
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ANALYTICS TAB ── */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            {/* Period selector */}
            <div className="flex items-center justify-between">
              <h2 className="text-white font-extrabold text-lg">Message Analytics</h2>
              <div className="flex gap-2">
                {[7, 30, 90].map(d => (
                  <button key={d} onClick={() => { setAnalyticsDays(d); fetchAnalytics(d); }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${analyticsDays === d ? 'bg-teal-500/20 border-teal-500/30 text-teal-300' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}>
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
                    { label: 'Sent', value: analytics.messages.sent, color: 'text-teal-400', bg: 'bg-teal-500/10' },
                    { label: 'Delivered', value: analytics.messages.delivered, sub: `${analytics.messages.deliveryRate}% rate`, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                    { label: 'Read (Opened)', value: analytics.messages.read, sub: `${analytics.messages.openRate}% open rate`, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                    { label: 'Failed', value: analytics.messages.failed, color: 'text-red-400', bg: 'bg-red-500/10' },
                  ].map((s, i) => (
                    <div key={i} className={`${s.bg} border border-white/5 rounded-2xl p-5`}>
                      <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
                      <p className="text-slate-400 text-xs mt-1 font-bold uppercase tracking-wider">{s.label}</p>
                      {s.sub && <p className="text-slate-500 text-xs mt-0.5">{s.sub}</p>}
                    </div>
                  ))}
                </div>

                {/* Click & Conversion metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Link Clicks', value: analytics.clicks.total, sub: `${analytics.clicks.clickRate}% click rate`, color: 'text-orange-400', bg: 'bg-orange-500/10' },
                    { label: 'Conversions', value: analytics.clicks.converted, sub: `${analytics.clicks.conversionRate}% conv. rate`, color: 'text-green-400', bg: 'bg-green-500/10' },
                    { label: 'Revenue from Clicks', value: `₹${analytics.clicks.revenueFromClicks?.toFixed(0) || 0}`, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
                    { label: 'Total Revenue', value: `₹${analytics.revenue.total?.toFixed(0) || 0}`, color: 'text-teal-400', bg: 'bg-teal-500/10' },
                  ].map((s, i) => (
                    <div key={i} className={`${s.bg} border border-white/5 rounded-2xl p-5`}>
                      <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
                      <p className="text-slate-400 text-xs mt-1 font-bold uppercase tracking-wider">{s.label}</p>
                      {s.sub && <p className="text-slate-500 text-xs mt-0.5">{s.sub}</p>}
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
                          <div className="flex items-center gap-3">
                            <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-mono font-bold px-3 py-1 rounded-lg text-sm">
                              {d.discountCode}
                            </span>
                          </div>
                          <div className="flex gap-6 text-right">
                            <div>
                              <p className="text-white font-bold">{d._count.id}</p>
                              <p className="text-slate-500 text-xs">Conversions</p>
                            </div>
                            <div>
                              <p className="text-green-400 font-bold">₹{(d._sum.convertedRevenue || 0).toFixed(0)}</p>
                              <p className="text-slate-500 text-xs">Revenue</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Failed messages */}
                {analytics.failedMessages.total > 0 && (
                  <div className="bg-slate-800 border border-red-500/10 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                      <p className="text-white font-extrabold">Failed Messages ({analytics.failedMessages.total})</p>
                    </div>
                    {/* Failure reason summary */}
                    <div className="px-6 py-4 flex gap-3 flex-wrap border-b border-white/5">
                      {Object.entries(analytics.failedMessages.reasons || {}).map(([reason, count]: any) => (
                        <span key={reason} className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold px-3 py-1.5 rounded-lg">
                          {reason}: {count}
                        </span>
                      ))}
                    </div>
                    {/* Recent failures */}
                    <div className="divide-y divide-white/5 max-h-64 overflow-y-auto">
                      {analytics.failedMessages.recent?.slice(0, 20).map((m: any) => (
                        <div key={m.id} className="px-6 py-3 flex items-center justify-between">
                          <div>
                            <p className="text-white text-sm font-mono">{m.customerPhone}</p>
                            <p className="text-red-400 text-xs mt-0.5">{m.failReason || 'Unknown error'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-slate-400 text-xs">{m.templateName}</p>
                            <p className="text-slate-500 text-xs">{new Date(m.timestamp).toLocaleDateString('en-IN')}</p>
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
                        { label: 'Total Sent', value: analytics.allTime.totalSent },
                        { label: 'Total Read', value: analytics.allTime.totalRead },
                        { label: 'Total Clicked', value: analytics.allTime.totalClicked },
                        { label: 'Total Converted', value: analytics.allTime.totalConverted },
                        { label: 'Total Revenue', value: `₹${(analytics.allTime.recoveredRevenue || 0).toFixed(0)}` },
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

            {/* Register Shopify Webhooks */}
            <div className="bg-slate-800 border border-green-500/20 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-green-500/10 flex items-center gap-2">
                <FaLink className="text-green-400" />
                <div>
                  <p className="text-white font-extrabold">Register Shopify Webhooks</p>
                  <p className="text-slate-400 text-xs">Registers abandoned cart + order webhooks in Shopify automatically</p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-slate-900 border border-white/5 rounded-xl p-4 text-xs text-slate-400 space-y-1.5">
                  <p className="text-slate-300 font-bold mb-2">Will register these webhooks:</p>
                  <p>📦 <code className="text-teal-300">checkouts/create</code> — abandoned cart detect</p>
                  <p>🔄 <code className="text-teal-300">checkouts/update</code> — cart update (phone added)</p>
                  <p>✅ <code className="text-teal-300">orders/create</code> — revenue tracking</p>
                </div>
                {webhookResults.length > 0 && (
                  <div className="space-y-1">
                    {webhookResults.map((r: any, i: number) => (
                      <div key={i} className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${r.status === 'registered' ? 'bg-green-500/10 text-green-400' : r.status === 'already_registered' ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'}`}>
                        <span>{r.status === 'registered' ? '✅' : r.status === 'already_registered' ? 'ℹ️' : '❌'}</span>
                        <span className="font-mono">{r.topic}</span>
                        <span className="ml-auto font-bold">{r.status}</span>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={handleRegisterWebhooks}
                  disabled={loading === "webhooks"}
                  className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-3.5 rounded-xl disabled:opacity-40 flex items-center justify-center gap-2 transition"
                >
                  {loading === "webhooks"
                    ? <><FaSpinner className="animate-spin" /> Registering...</>
                    : <><FaLink /> Register Webhooks in Shopify</>}
                </button>
              </div>
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

        {/* ── INBOX TAB ── */}
        {activeTab === "inbox" && (
          <div className="flex flex-col md:flex-row gap-4 h-auto md:h-[75vh]">

            {/* ── Left: Conversation List ── */}
            {/* On mobile: hidden when a convo is selected, shown otherwise */}
            <div className={`${selectedConvo ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 md:flex-shrink-0 bg-slate-800 border border-white/5 rounded-2xl overflow-hidden h-[60vh] md:h-full`}>
              {/* Header */}
              <div className="px-4 py-3 border-b border-white/5">
                <p className="text-white font-extrabold text-sm mb-2">💬 Conversations</p>
                <input
                  type="text"
                  placeholder="Search by phone..."
                  value={inboxSearch}
                  onChange={e => { setInboxSearch(e.target.value); loadInboxConversations(e.target.value); }}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto">
                {inboxLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <FaSpinner className="animate-spin text-teal-400 text-xl" />
                  </div>
                ) : inboxConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-6">
                    <p className="text-4xl mb-3">💬</p>
                    <p className="text-slate-400 text-xs">No conversations yet.</p>
                    <p className="text-slate-600 text-[10px] mt-1">When customers reply to your messages, they'll appear here.</p>
                  </div>
                ) : (
                  inboxConversations.map(convo => (
                    <button
                      key={convo.customerPhone}
                      onClick={() => loadInboxMessages(convo)}
                      className={`w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition ${selectedConvo?.customerPhone === convo.customerPhone ? 'bg-teal-500/10 border-l-2 border-l-teal-400' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-white text-xs font-bold truncate">
                              {convo.customerName || convo.customerPhone}
                            </p>
                            {convo.isOptedOut && <span className="text-[8px] bg-red-500/20 text-red-400 px-1 rounded font-bold">OPT-OUT</span>}
                            {!convo.canSendFreeText && !convo.isOptedOut && <span className="text-[8px] bg-yellow-500/20 text-yellow-400 px-1 rounded font-bold">TMPL</span>}
                          </div>
                          <p className="text-slate-500 text-[10px] truncate mt-0.5">
                            {convo.lastDirection === 'INCOMING' ? '← ' : '→ '}
                            {convo.lastMessage || '...'}
                          </p>
                          <p className="text-slate-600 text-[9px] mt-0.5">{convo.customerPhone}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <p className="text-slate-600 text-[9px]">
                            {convo.lastTimestamp ? new Date(convo.lastTimestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </p>
                          {convo.unreadCount > 0 && (
                            <span className="bg-teal-500 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
                              {convo.unreadCount > 9 ? '9+' : convo.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Refresh button */}
              <div className="px-4 py-2 border-t border-white/5">
                <button
                  onClick={() => loadInboxConversations(inboxSearch)}
                  className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
                >
                  <FaSync className={inboxLoading ? 'animate-spin' : ''} /> Refresh
                </button>
              </div>
            </div>

            {/* ── Right: Chat Window ── */}
            {/* On mobile: shown only when a convo is selected */}
            <div className={`${selectedConvo ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-slate-800 border border-white/5 rounded-2xl overflow-hidden h-[75vh] md:h-full`}>
              {!selectedConvo ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                  <p className="text-5xl mb-4">👈</p>
                  <p className="text-slate-300 font-bold">Select a conversation</p>
                  <p className="text-slate-500 text-sm mt-1">Click a contact on the left to view their messages</p>
                </div>
              ) : (
                <>
                  {/* Chat header */}
                  <div className="px-4 md:px-5 py-3 border-b border-white/5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Mobile back button */}
                      <button
                        onClick={() => setSelectedConvo(null)}
                        className="md:hidden text-slate-400 hover:text-white p-1 shrink-0"
                      >
                        <FaArrowLeft className="text-sm" />
                      </button>
                      <div className="min-w-0">
                        <p className="text-white font-extrabold text-sm truncate">
                          {selectedConvo.customerName || selectedConvo.customerPhone}
                        </p>
                        <p className="text-slate-500 text-[10px] truncate">{selectedConvo.customerPhone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end shrink-0 max-w-[180px] md:max-w-none">
                      {/* 24hr window indicator */}
                      {selectedConvo.canSendFreeText && timeLeft && (
                        <div className="flex items-center gap-1 bg-green-500/10 border border-green-500/20 rounded-xl px-2 py-1">
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shrink-0" />
                          <span className="text-green-400 text-[9px] font-bold whitespace-nowrap">{timeLeft} left</span>
                        </div>
                      )}
                      {!selectedConvo.canSendFreeText && (
                        <div className="flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-2 py-1">
                          <span className="text-yellow-400 text-[9px] font-bold">⏰ Template only</span>
                        </div>
                      )}
                      {selectedConvo.isOptedOut && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-2 py-1">
                          <span className="text-red-400 text-[9px] font-bold">🚫 Opted Out</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                    {inboxMessagesLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <FaSpinner className="animate-spin text-teal-400 text-xl" />
                      </div>
                    ) : inboxMessages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-slate-500 text-sm">No messages yet</p>
                      </div>
                    ) : (
                      inboxMessages.map((msg: any) => (
                        <div key={msg.id} className={`flex ${msg.direction === 'OUTGOING' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs lg:max-w-sm rounded-2xl px-4 py-2.5 ${
                            msg.direction === 'OUTGOING'
                              ? 'bg-teal-600 text-white rounded-br-sm'
                              : 'bg-slate-700 text-slate-100 rounded-bl-sm'
                          }`}>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            <div className={`flex items-center gap-1.5 mt-1 ${msg.direction === 'OUTGOING' ? 'justify-end' : 'justify-start'}`}>
                              <span className="text-[9px] opacity-60">
                                {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {msg.direction === 'OUTGOING' && (
                                <span className={`text-[9px] font-bold ${
                                  msg.status === 'READ'      ? 'text-blue-300' :
                                  msg.status === 'DELIVERED' ? 'text-teal-200' :
                                  msg.status === 'FAILED'    ? 'text-red-300'  : 'opacity-50'
                                }`}>
                                  {msg.status === 'READ' ? '✓✓' : msg.status === 'DELIVERED' ? '✓✓' : msg.status === 'FAILED' ? '✗' : '✓'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Reply box */}
                  <div className="px-5 py-4 border-t border-white/5">
                    {selectedConvo.isOptedOut ? (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
                        <p className="text-red-400 text-xs font-bold">🚫 Customer has opted out — no messages can be sent</p>
                      </div>
                    ) : !selectedConvo.canSendFreeText ? (
                      <div className="space-y-2">
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-center">
                          <p className="text-yellow-400 text-xs font-bold">⏰ 24hr window closed</p>
                          <p className="text-yellow-300 text-[10px] mt-0.5">Customer must message first, or send a pre-approved template</p>
                        </div>
                        <button
                          onClick={() => setActiveTab('templates')}
                          className="w-full py-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 text-xs font-bold rounded-xl transition"
                        >
                          📋 Go to Templates
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <textarea
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendInboxReply(); } }}
                          placeholder="Type a reply... (Enter to send, Shift+Enter for new line)"
                          rows={2}
                          className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                        />
                        <button
                          onClick={sendInboxReply}
                          disabled={replySending || !replyText.trim()}
                          className="px-5 bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-white font-bold rounded-xl transition flex items-center gap-2 text-sm"
                        >
                          {replySending ? <FaSpinner className="animate-spin" /> : '➤'}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── ACTIVITY LOG TAB ── */}
        {activeTab === "activitylog" && (
          <div className="space-y-5">

            {/* Header + filter row */}
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <h3 className="text-white font-extrabold text-sm">🕐 Activity Log</h3>
                <p className="text-slate-500 text-xs mt-0.5">{activityTotal} total events</p>
              </div>

              <div className="ml-auto flex items-center gap-2 flex-wrap">
                {/* Action filter */}
                <select
                  value={activityFilter}
                  onChange={e => { setActivityFilter(e.target.value); loadActivityLog(1, e.target.value); }}
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
                  <FaSync className={activityLoading ? 'animate-spin' : ''} /> Refresh
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
                  <p className="text-slate-600 text-xs mt-1">Actions like activating merchants, launching campaigns, saving flows will appear here.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {activityLogs.map((log: any) => {
                    // Icon + color per action type
                    const actionMeta: Record<string, { icon: string; color: string; bg: string }> = {
                      MERCHANT_ACTIVATED:    { icon: '🚀', color: 'text-green-400',  bg: 'bg-green-500/10' },
                      SUBSCRIPTION_EXTENDED: { icon: '📅', color: 'text-blue-400',   bg: 'bg-blue-500/10' },
                      PAYMENT_ADDED:         { icon: '💰', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                      PAYMENT_RECORDED:      { icon: '💰', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                      CAMPAIGN_LAUNCHED:     { icon: '📢', color: 'text-indigo-400',  bg: 'bg-indigo-500/10' },
                      CAMPAIGN_SCHEDULED:    { icon: '⏰', color: 'text-teal-400',    bg: 'bg-teal-500/10' },
                      CAMPAIGN_CANCELLED:    { icon: '⛔', color: 'text-red-400',     bg: 'bg-red-500/10' },
                      FLOW_SAVED:            { icon: '⚙️', color: 'text-purple-400',  bg: 'bg-purple-500/10' },
                      FLOW_TOGGLED:          { icon: '🔄', color: 'text-purple-400',  bg: 'bg-purple-500/10' },
                      SERVICE_TOGGLED:       { icon: '🔌', color: 'text-orange-400',  bg: 'bg-orange-500/10' },
                      MERCHANT_FREE_SET:     { icon: '🎁', color: 'text-pink-400',    bg: 'bg-pink-500/10' },
                      CUSTOMER_SYNCED:       { icon: '👥', color: 'text-cyan-400',    bg: 'bg-cyan-500/10' },
                      FULL_SYNC:             { icon: '🔁', color: 'text-cyan-400',    bg: 'bg-cyan-500/10' },
                      CREDENTIALS_UPDATED:   { icon: '🔑', color: 'text-yellow-400',  bg: 'bg-yellow-500/10' },
                      TEMPLATE_CREATED:      { icon: '📝', color: 'text-slate-300',   bg: 'bg-slate-700' },
                      TEMPLATE_DELETED:      { icon: '🗑️', color: 'text-red-400',     bg: 'bg-red-500/10' },
                      WEBHOOKS_REGISTERED:   { icon: '🔗', color: 'text-blue-400',    bg: 'bg-blue-500/10' },
                    };
                    const meta = actionMeta[log.action] || { icon: '📋', color: 'text-slate-400', bg: 'bg-slate-700' };

                    const ts = new Date(log.createdAt);
                    const timeStr = ts.toLocaleString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit', hour12: true
                    });

                    return (
                      <div key={log.id} className="px-5 py-4 flex items-start gap-4 hover:bg-white/2 transition">
                        {/* Icon */}
                        <div className={`w-9 h-9 ${meta.bg} rounded-xl flex items-center justify-center flex-shrink-0 text-base`}>
                          {meta.icon}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>
                              {log.action.replace(/_/g, ' ')}
                            </span>
                            <span className="text-slate-600 text-[10px]">by {log.actor}</span>
                          </div>
                          <p className="text-slate-200 text-sm mt-1 leading-relaxed">{log.description}</p>
                          {/* Metadata expandable */}
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

                        {/* Timestamp */}
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
                  Showing {((activityPage - 1) * 30) + 1}–{Math.min(activityPage * 30, activityTotal)} of {activityTotal}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => loadActivityLog(activityPage - 1, activityFilter)}
                    disabled={activityPage <= 1 || activityLoading}
                    className="px-3 py-1.5 bg-slate-800 border border-white/10 text-slate-400 hover:text-white text-xs font-bold rounded-xl disabled:opacity-40 transition"
                  >
                    ← Prev
                  </button>
                  <span className="px-3 py-1.5 text-slate-400 text-xs font-bold">
                    Page {activityPage} / {Math.ceil(activityTotal / 30)}
                  </span>
                  <button
                    onClick={() => loadActivityLog(activityPage + 1, activityFilter)}
                    disabled={activityPage >= Math.ceil(activityTotal / 30) || activityLoading}
                    className="px-3 py-1.5 bg-slate-800 border border-white/10 text-slate-400 hover:text-white text-xs font-bold rounded-xl disabled:opacity-40 transition"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}

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
