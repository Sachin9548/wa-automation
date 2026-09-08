"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import {
  FaArrowLeft, FaSync, FaBullhorn, FaWhatsapp,
  FaStore, FaSpinner, FaShoppingCart, FaBoxOpen,
  FaGift,
} from "react-icons/fa";

// ── Tab components ─────────────────────────────────────────────────────────────
import OverviewTab    from "./components/OverviewTab";
import InboxTab       from "./components/InboxTab";
import FlowsTab       from "./components/FlowsTab";
import CampaignTab    from "./components/CampaignTab";
import CustomersTab   from "./components/CustomersTab";
import AnalyticsTab   from "./components/AnalyticsTab";
import ActivityLogTab from "./components/ActivityLogTab";
import CredentialsTab from "./components/CredentialsTab";
import TemplatesTab   from "./components/TemplatesTab";
import ProductsTab    from "./components/ProductsTab";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const ah = () => ({ "x-admin-api-key": sessionStorage.getItem("adminKey") || "" });

export default function MerchantControlHub() {
  const { id }     = useParams();
  const router     = useRouter();
  const merchantId = id as string;

  // ── Core state ────────────────────────────────────────────────────────────
  const [merchant,      setMerchant]      = useState<any>(null);
  const [campaigns,     setCampaigns]     = useState<any[]>([]);
  const [flows,         setFlows]         = useState<any[]>([]);
  const [customers,     setCustomers]     = useState<any[]>([]);
  const [customerTotal, setCustomerTotal] = useState(0);
  const [fetching,      setFetching]      = useState(true);
  const [loading,       setLoading]       = useState<string | null>(null);
  const [payments,      setPayments]      = useState<any[]>([]);
  const [syncStatus,    setSyncStatus]    = useState<any>(null);
  const [webhookResults, setWebhookResults] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<
    "overview"|"flows"|"campaign"|"customers"|"analytics"|
    "credentials"|"templates"|"inbox"|"activitylog"|"mpm"
  >("overview");

  // ── Activation ────────────────────────────────────────────────────────────
  const [category,          setCategory]          = useState("ECOMMERCE");
  const [shopifyToken,      setShopifyToken]      = useState("");
  const [shopifySecret,     setShopifySecret]     = useState("");
  const [storeUrl,          setStoreUrl]          = useState("");
  const [metaPhoneNumberId, setMetaPhoneNumberId] = useState("");
  const [metaAccessToken,   setMetaAccessToken]   = useState("");
  const [metaWabaId,        setMetaWabaId]        = useState("");

  // ── Payment ───────────────────────────────────────────────────────────────
  const [payAmount, setPayAmount] = useState("");
  const [payDays,   setPayDays]   = useState("30");
  const [payNote,   setPayNote]   = useState("");

  // ── Customers ─────────────────────────────────────────────────────────────
  const [customerFilter, setCustomerFilter] = useState("all");
  const [customerStats,  setCustomerStats]  = useState<{ noPhoneCount: number; waInvalidCount: number; abandonedCount: number; orderedCount: number } | null>(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [addCustName,  setAddCustName]  = useState("");
  const [addCustPhone, setAddCustPhone] = useState("");
  const [addCustEmail, setAddCustEmail] = useState("");

  // ── Flow drafts ───────────────────────────────────────────────────────────
  const [flowDrafts, setFlowDrafts] = useState<Record<string, { template: string; delay: number; active: boolean; lang: string; discount: string }>>({});

  // ── Analytics ─────────────────────────────────────────────────────────────
  const [analytics,        setAnalytics]        = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsDays,    setAnalyticsDays]    = useState(30);

  // ── WABA Info ─────────────────────────────────────────────────────────────
  const [wabaInfo,    setWabaInfo]    = useState<any>(null);
  const [wabaLoading, setWabaLoading] = useState(false);

  const fetchWabaInfo = async () => {
    setWabaLoading(true);
    try {
      const r = await axios.get(`${API_URL}/admin/waba-info/${merchantId}`, { headers: ah() });
      setWabaInfo(r.data);
    } catch (e: any) { setWabaInfo({ error: e.response?.data?.message || "Failed to load WABA info" }); }
    finally { setWabaLoading(false); }
  };

  // ── Activity Log ──────────────────────────────────────────────────────────
  const [activityLogs,   setActivityLogs]   = useState<any[]>([]);
  const [activityLoading,setActivityLoading]= useState(false);
  const [activityTotal,  setActivityTotal]  = useState(0);
  const [activityPage,   setActivityPage]   = useState(1);
  const [activityFilter, setActivityFilter] = useState("");

  const loadActivityLog = async (page = 1, filter = "") => {
    setActivityLoading(true);
    try {
      const r = await axios.get(`${API_URL}/admin/activity-log/${merchantId}?page=${page}&limit=30${filter ? `&action=${filter}` : ""}`, { headers: ah() });
      setActivityLogs(r.data.logs || []);
      setActivityTotal(r.data.total || 0);
      setActivityPage(page);
    } catch { /* silent */ }
    finally { setActivityLoading(false); }
  };

  // ── Red Flags ─────────────────────────────────────────────────────────────
  const [redFlags,       setRedFlags]       = useState<any>(null);
  const [redFlagsLoading,setRedFlagsLoading]= useState(false);

  const fetchRedFlags = async () => {
    setRedFlagsLoading(true);
    try {
      const r = await axios.get(`${API_URL}/admin/red-flags/${merchantId}`, { headers: ah() });
      setRedFlags(r.data);
    } catch { /* silent */ }
    finally { setRedFlagsLoading(false); }
  };

  // ── ROI Report ────────────────────────────────────────────────────────────
  const [roiReport, setRoiReport] = useState<any>(null);
  const [roiLoading,setRoiLoading]= useState(false);
  const [roiDays,   setRoiDays]   = useState(30);
  const [roiFee,    setRoiFee]    = useState("5000");
  const [roiCopied, setRoiCopied] = useState(false);

  const generateRoiReport = async (days = roiDays, fee = roiFee) => {
    setRoiLoading(true); setRoiReport(null);
    try {
      const r = await axios.get(`${API_URL}/admin/roi-report/${merchantId}?days=${days}&fee=${fee}`, { headers: ah() });
      setRoiReport(r.data);
    } catch (e: any) { alert(e.response?.data?.message || "Failed"); }
    finally { setRoiLoading(false); }
  };

  const copyRoiMessage = async () => {
    if (!roiReport?.whatsappMessage) return;
    try { await navigator.clipboard.writeText(roiReport.whatsappMessage); }
    catch { const el = document.createElement("textarea"); el.value = roiReport.whatsappMessage; document.body.appendChild(el); el.select(); document.execCommand("copy"); document.body.removeChild(el); }
    setRoiCopied(true);
    setTimeout(() => setRoiCopied(false), 2500);
  };

  // ── AI Auto-Reply ─────────────────────────────────────────────────────────
  const [aiAutoReply,       setAiAutoReply]       = useState(false);
  const [aiKnowledgeBase,   setAiKnowledgeBase]   = useState("");
  const [aiFallbackMessage, setAiFallbackMessage] = useState("");
  const [aiSaving,          setAiSaving]          = useState(false);

  const loadAISettings = async () => {
    try {
      const r = await axios.get(`${API_URL}/admin/ai-settings/${merchantId}`, { headers: ah() });
      setAiAutoReply(r.data.aiAutoReply ?? false);
      setAiKnowledgeBase(r.data.aiKnowledgeBase ?? "");
      setAiFallbackMessage(r.data.aiFallbackMessage ?? "");
    } catch { /* silent */ }
  };

  const saveAISettings = async () => {
    setAiSaving(true);
    try {
      const r = await axios.post(`${API_URL}/admin/ai-settings/${merchantId}`, { aiAutoReply, aiKnowledgeBase, aiFallbackMessage: aiFallbackMessage || undefined }, { headers: ah() });
      alert(r.data.message);
    } catch (e: any) { alert(e.response?.data?.message || "Failed"); }
    finally { setAiSaving(false); }
  };

  // ── Catalog Status ────────────────────────────────────────────────────────
  const [catalogStatus,   setCatalogStatus]   = useState<any>(null);
  const [catalogChecking, setCatalogChecking] = useState(false);

  const fetchCatalogStatus = async () => {
    setCatalogChecking(true);
    try {
      const r = await axios.get(`${API_URL}/admin/catalog-status/${merchantId}`, { headers: ah() });
      setCatalogStatus(r.data);
    } catch { /* silent */ }
    finally { setCatalogChecking(false); }
  };

  // ── Campaign ──────────────────────────────────────────────────────────────
  const [campaignName,       setCampaignName]       = useState("");
  const [campMetaTemplate,   setCampMetaTemplate]   = useState("");
  const [campMetaLang,       setCampMetaLang]       = useState("en_US");
  const [campDiscountCode,   setCampDiscountCode]   = useState("");
  const [campScheduleMode,   setCampScheduleMode]   = useState<"now"|"later">("now");
  const [campScheduledAt,    setCampScheduledAt]    = useState("");
  const [campCustomerFilter, setCampCustomerFilter] = useState("all");

  // ── MPM ───────────────────────────────────────────────────────────────────
  const [mpmTemplate,        setMpmTemplate]        = useState("");
  const [mpmLang,            setMpmLang]            = useState("en_US");
  const [mpmBodyVars,        setMpmBodyVars]        = useState("");
  const [mpmThumbnailId,     setMpmThumbnailId]     = useState("");
  const [mpmSections,        setMpmSections]        = useState<Array<{ title: string; products: string }>>([{ title: "Featured Products", products: "" }]);
  const [mpmCustomerFilter,  setMpmCustomerFilter]  = useState("all");
  const [mpmToPhone,         setMpmToPhone]         = useState("");
  const [mpmSending,         setMpmSending]         = useState(false);
  const [mpmMode,            setMpmMode]            = useState<"catalog"|"mpm">("catalog");
  const [mpmBodyText,        setMpmBodyText]        = useState("👋 Hi! Check out our latest collection right here in WhatsApp 👇");
  const [mpmFooterText,      setMpmFooterText]      = useState("Tap 'View Catalog' to browse & shop");

  // ── Templates ─────────────────────────────────────────────────────────────
  const [metaTemplates, setMetaTemplates] = useState<any[]>([]);
  const [tmplName,      setTmplName]      = useState("");
  const [tmplBody,      setTmplBody]      = useState("");
  const [tmplHeader,    setTmplHeader]    = useState("");
  const [tmplFooter,    setTmplFooter]    = useState("");
  const [tmplCategory,  setTmplCategory]  = useState("MARKETING");
  const [tmplLanguage,  setTmplLanguage]  = useState("en_US");
  const [tmplButtons,   setTmplButtons]   = useState<Array<{ type: string; text: string; url?: string; phone_number?: string }>>([]);
  const [tmplFilter,    setTmplFilter]    = useState<"ALL"|"APPROVED"|"PENDING"|"REJECTED">("ALL");

  // ── Credentials ───────────────────────────────────────────────────────────
  const [credShopifyToken,  setCredShopifyToken]  = useState("");
  const [credShopifySecret, setCredShopifySecret] = useState("");
  const [credStoreUrl,      setCredStoreUrl]      = useState("");
  const [credMetaPhoneId,   setCredMetaPhoneId]   = useState("");
  const [credMetaToken,     setCredMetaToken]     = useState("");
  const [credMetaWabaId,    setCredMetaWabaId]    = useState("");
  const [credClientId,      setCredClientId]      = useState("");
  const [credClientSecret,  setCredClientSecret]  = useState("");

  // ── Inbox ─────────────────────────────────────────────────────────────────
  const [inboxConversations,    setInboxConversations]    = useState<any[]>([]);
  const [inboxLoading,          setInboxLoading]          = useState(false);
  const [selectedConvo,         setSelectedConvo]         = useState<any>(null);
  const [inboxMessages,         setInboxMessages]         = useState<any[]>([]);
  const [inboxMessagesLoading,  setInboxMessagesLoading]  = useState(false);
  const [replyText,             setReplyText]             = useState("");
  const [replySending,          setReplySending]          = useState(false);
  const [inboxSearch,           setInboxSearch]           = useState("");
  const [timeLeft,              setTimeLeft]              = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;

  const loadInboxConversations = async (search = "") => {
    setInboxLoading(true);
    try {
      const r = await axios.get(`${API_URL}/inbox/conversations/${merchantId}?search=${encodeURIComponent(search)}&limit=40`, { headers: ah() });
      setInboxConversations(r.data.conversations || []);
    } catch { /* silent */ }
    finally { setInboxLoading(false); }
  };

  const loadInboxMessages = async (convo: any) => {
    setSelectedConvo(convo);
    setInboxMessagesLoading(true);
    setInboxMessages([]);
    try {
      const r = await axios.get(`${API_URL}/inbox/messages/${merchantId}/${convo.customerPhone}?limit=100`, { headers: ah() });
      setInboxMessages(r.data.messages || []);
      const w = r.data.window;
      if (w?.windowExpiresAt && w?.canSendFreeText) {
        const ms = new Date(w.windowExpiresAt).getTime() - Date.now();
        setTimeLeft(`${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`);
      } else { setTimeLeft(null); }
      await axios.post(`${API_URL}/inbox/mark-read/${merchantId}`, { customerPhone: convo.customerPhone }, { headers: ah() });
      setInboxConversations(prev => prev.map(c => c.customerPhone === convo.customerPhone ? { ...c, unreadCount: 0 } : c));
    } catch { /* silent */ }
    finally { setInboxMessagesLoading(false); }
  };

  const sendInboxReply = async () => {
    if (!replyText.trim() || !selectedConvo) return;
    setReplySending(true);
    try {
      const r = await axios.post(`${API_URL}/inbox/send/${merchantId}`, { customerPhone: selectedConvo.customerPhone, message: replyText }, { headers: ah() });
      setInboxMessages(prev => [...prev, r.data.message]);
      setReplyText("");
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e: any) {
      const code = e.response?.data?.code;
      if (code === "WINDOW_EXPIRED" || code === "NO_24HR_WINDOW") alert("⏰ 24hr window closed — please send a template instead.");
      else alert(e.response?.data?.message || "Failed to send");
    }
    finally { setReplySending(false); }
  };

  // ── fetchAll ──────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      const [mRes, cRes, fRes, custRes, payRes] = await Promise.all([
        axios.get(`${API_URL}/admin/merchants/${merchantId}`, { headers: ah() }).catch(() =>
          axios.get(`${API_URL}/admin/merchants`, { headers: ah() }).then(r => ({ data: { merchant: r.data.merchants.find((m: any) => m.id === merchantId) } }))
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
      axios.get(`${API_URL}/admin/sync-status/${merchantId}`, { headers: ah() }).then(r => setSyncStatus(r.data)).catch(() => {});
      const m = mRes.data.merchant;
      if (m) {
        setCredStoreUrl(m.storeUrl || ""); setCredShopifyToken(m.shopifyToken || "");
        setCredShopifySecret(m.shopifySecret || ""); setCredMetaPhoneId(m.metaPhoneNumberId || "");
        setCredMetaToken(m.metaAccessToken || ""); setCredMetaWabaId(m.metaWabaId || "");
        setCredClientId(m.shopifyClientId || ""); setCredClientSecret(m.shopifyClientSecret || "");
        if (m.storeUrl) setStoreUrl(m.storeUrl);
      }
      fetchRedFlags();
      fetchWabaInfo();
      loadAISettings();
    } finally { setFetching(false); }
  }, [merchantId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if ((activeTab === "flows" || activeTab === "campaign" || activeTab === "templates" || activeTab === "inbox") && metaTemplates.length === 0) fetchMetaTemplates();
    if (activeTab === "customers") loadFilteredCustomers(customerFilter);
    if (activeTab === "inbox")     loadInboxConversations();
    if (activeTab === "activitylog") loadActivityLog(1, activityFilter);
    if (activeTab === "overview")  { fetchRedFlags(); if (!wabaInfo) fetchWabaInfo(); }
    if (activeTab === "mpm" && !catalogStatus) fetchCatalogStatus();
  }, [activeTab]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const action = async (endpoint: string, data: any, label: string) => {
    setLoading(label);
    try { await axios.post(`${API_URL}/admin/${endpoint}`, { merchantId, ...data }, { headers: ah() }); alert("✅ Done!"); await fetchAll(); }
    catch (e: any) { alert(e.response?.data?.message || "Error"); }
    finally { setLoading(null); }
  };

  const fetchMetaTemplates = async () => {
    setLoading("tmpl-fetch");
    try { const r = await axios.get(`${API_URL}/admin/meta-templates/${merchantId}`, { headers: ah() }); setMetaTemplates(r.data.templates || []); }
    catch (e: any) { alert(e.response?.data?.message || "Failed to fetch templates"); }
    finally { setLoading(null); }
  };

  const loadFilteredCustomers = async (filter: string) => {
    try {
      const r = await axios.get(`${API_URL}/admin/customers-filtered/${merchantId}?filter=${filter}&limit=50`, { headers: ah() });
      setCustomers(r.data.customers || []); setCustomerTotal(r.data.total || 0);
      if (r.data.stats) setCustomerStats(r.data.stats);
    } catch { /* silent */ }
  };

  const handleSync = async () => {
    setLoading("sync");
    try { const r = await axios.post(`${API_URL}/admin/sync-customers`, { merchantId }, { headers: ah() }); alert(r.data.message); await fetchAll(); }
    catch (e: any) { alert(e.response?.data?.message || "Sync failed"); }
    finally { setLoading(null); }
  };

  const handleFullSync = async () => {
    if (!confirm("Full sync fetches ALL Shopify data. This runs in background. Continue?")) return;
    setLoading("fullsync");
    try { const r = await axios.post(`${API_URL}/admin/full-sync`, { merchantId }, { headers: ah() }); alert(r.data.message); setTimeout(async () => { const s = await axios.get(`${API_URL}/admin/sync-status/${merchantId}`, { headers: ah() }); setSyncStatus(s.data); await fetchAll(); }, 5000); }
    catch (e: any) { alert(e.response?.data?.message || "Sync failed"); }
    finally { setLoading(null); }
  };

  const handleToggleService = async (active: boolean) => {
    if (active) {
      setLoading("service");
      try {
        const checkResp = await axios.post(`${API_URL}/admin/check-feature/${merchantId}`, { feature: "ABANDONED_CART" }, { headers: ah() });
        const check = checkResp.data;
        if (!check.canEnable) { alert(["❌ Cannot enable service — requirements not met:", "", ...check.errors].join("\n")); setLoading(null); return; }
        if (check.warnings.length > 0) { const proceed = confirm(["⚠️ Warnings found:", "", ...check.warnings, "", "Enable service anyway?"].join("\n")); if (!proceed) { setLoading(null); return; } }
      } catch { /* non-blocking */ }
    } else { setLoading("service"); }
    try { const r = await axios.post(`${API_URL}/admin/toggle-service`, { merchantId, serviceActive: active }, { headers: ah() }); alert(r.data.message); await fetchAll(); }
    catch (e: any) { alert(e.response?.data?.message || "Failed"); }
    finally { setLoading(null); }
  };

  const handleSetFree = async (isFree: boolean) => {
    setLoading("free");
    try { const r = await axios.post(`${API_URL}/admin/set-free`, { merchantId, isFree }, { headers: ah() }); alert(r.data.message); await fetchAll(); }
    catch (e: any) { alert(e.response?.data?.message || "Failed"); }
    finally { setLoading(null); }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading("payment");
    try { const r = await axios.post(`${API_URL}/admin/add-payment`, { merchantId, amount: payAmount, planDays: payDays, note: payNote || undefined }, { headers: ah() }); alert(r.data.message); setPayAmount(""); setPayNote(""); await fetchAll(); }
    catch (e: any) { alert(e.response?.data?.message || "Failed"); }
    finally { setLoading(null); }
  };

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading("creds");
    try { await axios.post(`${API_URL}/admin/update-credentials`, { merchantId, shopifyToken: credShopifyToken, shopifySecret: credShopifySecret, storeUrl: credStoreUrl, metaPhoneNumberId: credMetaPhoneId, metaAccessToken: credMetaToken, metaWabaId: credMetaWabaId, shopifyClientId: credClientId, shopifyClientSecret: credClientSecret }, { headers: ah() }); alert("✅ Credentials saved!"); await fetchAll(); }
    catch (e: any) { alert(e.response?.data?.message || "Error"); }
    finally { setLoading(null); }
  };

  const handleRefreshShopifyToken = async (e?: React.FormEvent) => {
    e?.preventDefault(); setLoading("refresh");
    try { const r = await axios.post(`${API_URL}/admin/refresh-shopify-token`, { merchantId, clientId: credClientId, clientSecret: credClientSecret }, { headers: ah() }); alert(r.data.message); setCredClientId(""); setCredClientSecret(""); await fetchAll(); }
    catch (e: any) { alert(e.response?.data?.message || "Refresh failed"); }
    finally { setLoading(null); }
  };

  const handleRegisterWebhooks = async () => {
    setLoading("webhooks");
    try { const r = await axios.post(`${API_URL}/admin/register-webhooks`, { merchantId }, { headers: ah() }); setWebhookResults(r.data.results || []); alert(r.data.message); }
    catch (e: any) { alert(e.response?.data?.message || "Failed"); }
    finally { setLoading(null); }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const btn of tmplButtons) { if (!btn.text.trim()) { alert("Button text cannot be empty"); return; } if (btn.type === "URL" && !btn.url?.trim()) { alert("URL button requires a URL"); return; } if (btn.type === "PHONE_NUMBER" && !btn.phone_number?.trim()) { alert("Phone button requires a phone number"); return; } }
    setLoading("tmpl-create");
    try {
      const r = await axios.post(`${API_URL}/admin/meta-templates`, { merchantId, name: tmplName, bodyText: tmplBody, headerText: tmplHeader || undefined, footerText: tmplFooter || undefined, category: tmplCategory, language: tmplLanguage, buttons: tmplButtons.length > 0 ? tmplButtons : undefined }, { headers: ah() });
      alert(r.data.message); setTmplName(""); setTmplBody(""); setTmplHeader(""); setTmplFooter(""); setTmplButtons([]);
      await fetchMetaTemplates();
    } catch (e: any) { alert(e.response?.data?.message || "Failed"); }
    finally { setLoading(null); }
  };

  const handleDeleteTemplate = async (templateName: string) => {
    try { await axios.delete(`${API_URL}/admin/meta-templates/${merchantId}/${templateName}`, { headers: ah() }); setMetaTemplates(prev => prev.filter(t => t.name !== templateName)); alert(`✅ Template "${templateName}" deleted!`); }
    catch (e: any) { alert(e.response?.data?.message || "Delete failed"); }
  };

  const fetchAnalytics = async (days = 30) => {
    setAnalyticsLoading(true);
    try { const r = await axios.get(`${API_URL}/admin/analytics/${merchantId}?days=${days}`, { headers: ah() }); setAnalytics(r.data); }
    catch (e: any) { alert(e.response?.data?.message || "Failed to load analytics"); }
    finally { setAnalyticsLoading(false); }
  };

  useEffect(() => { if (activeTab === "analytics" && !analytics) fetchAnalytics(analyticsDays); }, [activeTab]);

  const handleLaunchCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campMetaTemplate) { alert("Please select a Meta template first"); return; }
    if (campScheduleMode === "later" && !campScheduledAt) { alert("Please pick a date/time to schedule"); return; }
    setLoading("campaign");
    try {
      const r = await axios.post(`${API_URL}/admin/launch-campaign`, { merchantId, campaignName, metaTemplateName: campMetaTemplate, metaTemplateLang: campMetaLang, discountCode: campDiscountCode || undefined, customerFilter: campCustomerFilter, scheduledAt: campScheduleMode === "later" ? new Date(campScheduledAt).toISOString() : undefined }, { headers: ah() });
      alert(`${r.data.message}\nQueued: ${r.data.totalQueued} customers\nETA: ~${r.data.etaMinutes} min`);
      setCampaignName(""); setCampMetaTemplate(""); setCampDiscountCode(""); setCampScheduledAt(""); setCampScheduleMode("now"); setCampCustomerFilter("all");
      await fetchAll();
    } catch (e: any) { alert(e.response?.data?.message || "Failed"); }
    finally { setLoading(null); }
  };

  const handleCancelCampaign = async (campaignId: string) => {
    if (!confirm("Cancel this scheduled campaign?")) return;
    try { await axios.post(`${API_URL}/admin/campaigns/cancel`, { campaignId }, { headers: ah() }); alert("✅ Campaign cancelled"); await fetchAll(); }
    catch (e: any) { alert(e.response?.data?.message || "Failed to cancel"); }
  };

  const handleAddSingleCustomer = async () => {
    if (!addCustPhone) return; setLoading("addcust");
    try { await axios.post(`${API_URL}/admin/customers/add`, { merchantId, name: addCustName, phone: addCustPhone, email: addCustEmail }, { headers: ah() }); alert("✅ Customer added!"); setAddCustName(""); setAddCustPhone(""); setAddCustEmail(""); setShowAddCustomer(false); await loadFilteredCustomers(customerFilter); await fetchAll(); }
    catch (e: any) { alert(e.response?.data?.message || "Failed"); }
    finally { setLoading(null); }
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; setLoading("import");
    try {
      const text = await file.text(); const lines = text.trim().split("\n"); const headers = lines[0].toLowerCase().split(",").map(h => h.trim().replace(/"/g, ""));
      const nameIdx = headers.indexOf("name"); const phoneIdx = headers.indexOf("phone"); const emailIdx = headers.indexOf("email");
      if (phoneIdx === -1) { alert('CSV must have a "phone" column'); return; }
      const customers = lines.slice(1).map(line => { const cols = line.match(/(".*?"|[^,]+)(?=,|$)/g)?.map(v => v.replace(/^"|"$/g, "").trim()) || line.split(",").map(v => v.trim()); return { name: nameIdx >= 0 ? cols[nameIdx] || "" : "", phone: cols[phoneIdx] || "", email: emailIdx >= 0 ? cols[emailIdx] || "" : "" }; }).filter(c => c.phone);
      if (customers.length === 0) { alert("No valid customers found in CSV"); return; }
      const r = await axios.post(`${API_URL}/admin/customers/import`, { merchantId, customers }, { headers: ah() }); alert(r.data.message);
      await loadFilteredCustomers(customerFilter); await fetchAll();
    } catch (e: any) { alert(e.response?.data?.message || "Import failed"); }
    finally { setLoading(null); e.target.value = ""; }
  };

  const handleSendMPM = async () => {
    if (mpmMode === "mpm" && !mpmTemplate) { alert("Please enter an MPM template name"); return; }
    if (mpmMode === "mpm" && !mpmThumbnailId) { alert("Thumbnail Product Retailer ID is required"); return; }
    if (mpmMode === "catalog" && !mpmToPhone) { alert("Phone number required for catalog message"); return; }
    setMpmSending(true);
    try {
      if (mpmMode === "catalog") {
        const r = await axios.post(`${API_URL}/admin/send-catalog`, { merchantId, toPhone: mpmToPhone, bodyText: mpmBodyText, footerText: mpmFooterText || undefined, thumbnailProductRetailerId: mpmThumbnailId || undefined }, { headers: ah() });
        alert(r.data.message); setMpmToPhone("");
      } else {
        const sections = mpmSections.filter((s: any) => s.products.trim()).map((s: any) => ({ title: s.title || "Products", product_items: s.products.split(",").map((id: string) => ({ product_retailer_id: id.trim() })).filter((p: any) => p.product_retailer_id) }));
        const r = await axios.post(`${API_URL}/admin/send-mpm`, { merchantId, toPhone: mpmToPhone || undefined, templateName: mpmTemplate, languageCode: mpmLang, bodyVariables: mpmBodyVars ? mpmBodyVars.split(",").map((v: string) => v.trim()) : [], thumbnailProductRetailerId: mpmThumbnailId, sections, customerFilter: mpmToPhone ? undefined : mpmCustomerFilter }, { headers: ah() });
        alert(r.data.message + (r.data.etaMinutes ? `\nETA: ~${r.data.etaMinutes} min` : "")); setMpmToPhone("");
      }
    } catch (e: any) { alert(e.response?.data?.message || "Failed to send"); }
    finally { setMpmSending(false); }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (fetching) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <FaSpinner className="animate-spin text-4xl text-teal-400" />
    </div>
  );

  const isActive    = merchant?.status === "ACTIVE";
  const waConnected = merchant?.whatsappConnected;

  const TABS = [
    { key: "overview",    label: "Overview" },
    { key: "inbox",       label: "💬 Inbox" },
    { key: "flows",       label: "Flows" },
    { key: "campaign",    label: "Campaign" },
    { key: "mpm",         label: "📦 Products" },
    { key: "customers",   label: `Customers (${customerTotal})` },
    { key: "analytics",   label: "📊 Analytics" },
    { key: "activitylog", label: "🕐 Activity Log" },
    { key: "credentials", label: "⚙️ Credentials" },
    { key: "templates",   label: "📋 Templates" },
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
          {redFlags?.qualityRating && redFlags.qualityRating !== "UNKNOWN" && (
            <div className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-xl border text-[10px] font-extrabold ${redFlags.qualityRating === "GREEN" ? "bg-green-500/10 border-green-500/20 text-green-400" : redFlags.qualityRating === "YELLOW" ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400 animate-pulse" : "bg-red-500/10 border-red-500/20 text-red-400 animate-pulse"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${redFlags.qualityRating === "GREEN" ? "bg-green-400" : redFlags.qualityRating === "YELLOW" ? "bg-yellow-400" : "bg-red-400"}`} />
              {redFlags.qualityRating}
            </div>
          )}
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
              { label: "Sent",      value: merchant?.totalSent ?? 0 },
              { label: "Revenue",   value: `₹${(merchant?.recoveredRevenue || 0).toFixed(0)}` },
              { label: "Paid",      value: `₹${(merchant?.totalPaidAmount || 0).toFixed(0)}` },
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

      {/* Tab content */}
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">

        {activeTab === "overview" && (
          <OverviewTab
            merchant={merchant} isActive={isActive} loading={loading} payments={payments} campaigns={campaigns}
            redFlags={redFlags} redFlagsLoading={redFlagsLoading} fetchRedFlags={fetchRedFlags}
            wabaInfo={wabaInfo} wabaLoading={wabaLoading} fetchWabaInfo={fetchWabaInfo}
            roiReport={roiReport} roiLoading={roiLoading} roiDays={roiDays} roiFee={roiFee} roiCopied={roiCopied}
            setRoiDays={setRoiDays} setRoiFee={setRoiFee} generateRoiReport={generateRoiReport} copyRoiMessage={copyRoiMessage}
            aiAutoReply={aiAutoReply} setAiAutoReply={setAiAutoReply}
            aiKnowledgeBase={aiKnowledgeBase} setAiKnowledgeBase={setAiKnowledgeBase}
            aiFallbackMessage={aiFallbackMessage} setAiFallbackMessage={setAiFallbackMessage}
            aiSaving={aiSaving} saveAISettings={saveAISettings}
            category={category} setCategory={setCategory}
            shopifyToken={shopifyToken} setShopifyToken={setShopifyToken}
            shopifySecret={shopifySecret} setShopifySecret={setShopifySecret}
            storeUrl={storeUrl} setStoreUrl={setStoreUrl}
            metaPhoneNumberId={metaPhoneNumberId} setMetaPhoneNumberId={setMetaPhoneNumberId}
            metaAccessToken={metaAccessToken} setMetaAccessToken={setMetaAccessToken}
            metaWabaId={metaWabaId} setMetaWabaId={setMetaWabaId}
            payAmount={payAmount} setPayAmount={setPayAmount}
            payDays={payDays} setPayDays={setPayDays}
            payNote={payNote} setPayNote={setPayNote}
            action={action} handleToggleService={handleToggleService}
            handleSetFree={handleSetFree} handleAddPayment={handleAddPayment}
          />
        )}

        {activeTab === "inbox" && (
          <InboxTab
            merchantId={merchantId} metaTemplates={metaTemplates} setActiveTab={setActiveTab}
            inboxConversations={inboxConversations} inboxLoading={inboxLoading}
            inboxSearch={inboxSearch} setInboxSearch={setInboxSearch}
            selectedConvo={selectedConvo} setSelectedConvo={setSelectedConvo}
            inboxMessages={inboxMessages} inboxMessagesLoading={inboxMessagesLoading}
            timeLeft={timeLeft} replyText={replyText} setReplyText={setReplyText}
            replySending={replySending} messagesEndRef={messagesEndRef}
            loadInboxConversations={loadInboxConversations}
            loadInboxMessages={loadInboxMessages} sendInboxReply={sendInboxReply}
          />
        )}

        {activeTab === "flows" && (
          <FlowsTab
            merchantId={merchantId} flows={flows} metaTemplates={metaTemplates}
            loading={loading} setLoading={setLoading}
            flowDrafts={flowDrafts} setFlowDrafts={setFlowDrafts}
            fetchAll={fetchAll} fetchMetaTemplates={fetchMetaTemplates} setActiveTab={setActiveTab}
          />
        )}

        {activeTab === "campaign" && (
          <CampaignTab
            merchantId={merchantId} isActive={isActive} loading={loading}
            campaigns={campaigns} customerTotal={customerTotal}
            metaTemplates={metaTemplates} setActiveTab={setActiveTab}
            campaignName={campaignName} setCampaignName={setCampaignName}
            campMetaTemplate={campMetaTemplate} setCampMetaTemplate={setCampMetaTemplate}
            campMetaLang={campMetaLang} setCampMetaLang={setCampMetaLang}
            campDiscountCode={campDiscountCode} setCampDiscountCode={setCampDiscountCode}
            campScheduleMode={campScheduleMode} setCampScheduleMode={setCampScheduleMode}
            campScheduledAt={campScheduledAt} setCampScheduledAt={setCampScheduledAt}
            campCustomerFilter={campCustomerFilter} setCampCustomerFilter={setCampCustomerFilter}
            handleLaunchCampaign={handleLaunchCampaign} handleCancelCampaign={handleCancelCampaign}
          />
        )}

        {activeTab === "mpm" && (
          <ProductsTab
            isActive={isActive} customerTotal={customerTotal}
            mpmMode={mpmMode} setMpmMode={setMpmMode}
            mpmTemplate={mpmTemplate} setMpmTemplate={setMpmTemplate}
            mpmLang={mpmLang} setMpmLang={setMpmLang}
            mpmBodyVars={mpmBodyVars} setMpmBodyVars={setMpmBodyVars}
            mpmThumbnailId={mpmThumbnailId} setMpmThumbnailId={setMpmThumbnailId}
            mpmSections={mpmSections} setMpmSections={setMpmSections}
            mpmCustomerFilter={mpmCustomerFilter} setMpmCustomerFilter={setMpmCustomerFilter}
            mpmToPhone={mpmToPhone} setMpmToPhone={setMpmToPhone}
            mpmSending={mpmSending}
            mpmBodyText={mpmBodyText} setMpmBodyText={setMpmBodyText}
            mpmFooterText={mpmFooterText} setMpmFooterText={setMpmFooterText}
            catalogStatus={catalogStatus} catalogChecking={catalogChecking}
            fetchCatalogStatus={fetchCatalogStatus} handleSendMPM={handleSendMPM}
          />
        )}

        {activeTab === "customers" && (
          <CustomersTab
            merchantId={merchantId} isActive={isActive} loading={loading}
            customers={customers} customerTotal={customerTotal}
            customerFilter={customerFilter} customerStats={customerStats}
            showAddCustomer={showAddCustomer}
            addCustName={addCustName} setAddCustName={setAddCustName}
            addCustPhone={addCustPhone} setAddCustPhone={setAddCustPhone}
            addCustEmail={addCustEmail} setAddCustEmail={setAddCustEmail}
            setCustomerFilter={setCustomerFilter} setShowAddCustomer={setShowAddCustomer}
            loadFilteredCustomers={loadFilteredCustomers}
            handleAddSingleCustomer={handleAddSingleCustomer}
            handleImportCSV={handleImportCSV}
            handleFullSync={handleFullSync} handleSync={handleSync}
          />
        )}

        {activeTab === "analytics" && (
          <AnalyticsTab
            analytics={analytics} analyticsLoading={analyticsLoading}
            analyticsDays={analyticsDays} setAnalyticsDays={setAnalyticsDays}
            fetchAnalytics={fetchAnalytics}
          />
        )}

        {activeTab === "activitylog" && (
          <ActivityLogTab
            merchantId={merchantId}
            activityLogs={activityLogs} activityLoading={activityLoading}
            activityTotal={activityTotal} activityPage={activityPage}
            activityFilter={activityFilter} setActivityFilter={setActivityFilter}
            loadActivityLog={loadActivityLog}
          />
        )}

        {activeTab === "credentials" && (
          <CredentialsTab
            loading={loading}
            credStoreUrl={credStoreUrl}         setCredStoreUrl={setCredStoreUrl}
            credShopifyToken={credShopifyToken} setCredShopifyToken={setCredShopifyToken}
            credShopifySecret={credShopifySecret} setCredShopifySecret={setCredShopifySecret}
            credClientId={credClientId}         setCredClientId={setCredClientId}
            credClientSecret={credClientSecret} setCredClientSecret={setCredClientSecret}
            credMetaPhoneId={credMetaPhoneId}   setCredMetaPhoneId={setCredMetaPhoneId}
            credMetaWabaId={credMetaWabaId}     setCredMetaWabaId={setCredMetaWabaId}
            credMetaToken={credMetaToken}       setCredMetaToken={setCredMetaToken}
            webhookResults={webhookResults}
            handleUpdateCredentials={handleUpdateCredentials}
            handleRegisterWebhooks={handleRegisterWebhooks}
            handleRefreshShopifyToken={handleRefreshShopifyToken}
          />
        )}

        {activeTab === "templates" && (
          <TemplatesTab
            loading={loading} metaTemplates={metaTemplates}
            tmplName={tmplName} setTmplName={setTmplName}
            tmplBody={tmplBody} setTmplBody={setTmplBody}
            tmplHeader={tmplHeader} setTmplHeader={setTmplHeader}
            tmplFooter={tmplFooter} setTmplFooter={setTmplFooter}
            tmplCategory={tmplCategory} setTmplCategory={setTmplCategory}
            tmplLanguage={tmplLanguage} setTmplLanguage={setTmplLanguage}
            tmplButtons={tmplButtons} setTmplButtons={setTmplButtons}
            tmplFilter={tmplFilter} setTmplFilter={setTmplFilter}
            handleCreateTemplate={handleCreateTemplate}
            handleDeleteTemplate={handleDeleteTemplate}
            fetchMetaTemplates={fetchMetaTemplates}
          />
        )}

      </div>
    </div>
  );
}
