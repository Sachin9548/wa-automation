"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaWhatsapp, FaShoppingCart, FaSpinner, FaSearch, FaBoxOpen, FaCheck } from "react-icons/fa";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const ah = () => ({ "x-admin-api-key": sessionStorage.getItem("adminKey") || "" });

interface CODBlastTabProps {
  merchantId: string;
  metaTemplates: any[];  // approved templates from parent
}

export default function CODBlastTab({ merchantId, metaTemplates }: CODBlastTabProps) {
  const [type, setType]           = useState<"abandoned" | "ordered">("abandoned");
  const [days, setDays]           = useState(30);
  const [search, setSearch]       = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(false);
  const [selected, setSelected]   = useState<Set<string>>(new Set());
  const [template, setTemplate]   = useState("");
  const [templateLang, setTemplateLang] = useState("en_US");
  const [discount, setDiscount]   = useState("");
  const [blastName, setBlastName] = useState("");
  const [sending, setSending]     = useState(false);
  const [placing, setPlacing]     = useState<string | null>(null); // phone of order being placed
  const [blasts, setBlasts]       = useState<any[]>([]);
  const [lastBlastId, setLastBlastId] = useState<string | null>(null);

  // Approved templates only
  const approvedTemplates = metaTemplates.filter((t: any) => t.status === "APPROVED");

  const fetchCustomers = async () => {
    setLoading(true);
    setSelected(new Set());
    try {
      const r = await axios.get(
        `${API_URL}/admin/blast-customers/${merchantId}?type=${type}&days=${days}&search=${search}&limit=100`,
        { headers: ah() }
      );
      setCustomers(r.data.customers || []);
      setTotal(r.data.total || 0);
    } catch { setCustomers([]); }
    finally { setLoading(false); }
  };

  const fetchBlastHistory = async () => {
    try {
      const r = await axios.get(`${API_URL}/admin/blast-history/${merchantId}`, { headers: ah() });
      setBlasts(r.data.blasts || []);
    } catch {}
  };

  useEffect(() => { fetchCustomers(); fetchBlastHistory(); }, [type, days]);

  const toggleSelect = (phone: string) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(phone) ? n.delete(phone) : n.add(phone);
      return n;
    });
  };

  const toggleAll = () => {
    if (selected.size === customers.length) setSelected(new Set());
    else setSelected(new Set(customers.map((c: any) => c.phone)));
  };

  const selectedCustomers = customers.filter((c: any) => selected.has(c.phone));

  const handleSendBlast = async () => {
    if (!template) return alert("Template select karo");
    if (selectedCustomers.length === 0) return alert("Kam se kam 1 customer select karo");
    setSending(true);
    try {
      const r = await axios.post(`${API_URL}/admin/cod-blast`, {
        merchantId,
        templateName: template,
        templateLang,
        customers: selectedCustomers,
        blastName: blastName || `COD Blast ${new Date().toLocaleDateString("en-IN")}`,
        discountCode: discount || undefined,
      }, { headers: ah() });
      setLastBlastId(r.data.blastId);
      alert(r.data.message);
      fetchBlastHistory();
    } catch (e: any) {
      alert(e.response?.data?.message || "Blast failed");
    } finally { setSending(false); }
  };

  const handlePlaceOrder = async (c: any) => {
    if (!confirm(`Place COD order for ${c.name} (${c.phone})?`)) return;
    setPlacing(c.phone);
    try {
      const r = await axios.post(`${API_URL}/admin/place-cod-order`, {
        merchantId,
        phone:        c.phone,
        name:         c.name,
        lineItemsJson: c.lineItems || "[]",
        cartId:       c.cartId,
        blastId:      lastBlastId,
      }, { headers: ah() });
      alert(`✅ ${r.data.message}`);
      fetchCustomers();
    } catch (e: any) {
      alert(e.response?.data?.message || "Order placement failed");
    } finally { setPlacing(null); }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
          <FaWhatsapp className="text-green-400 text-lg" />
        </div>
        <div>
          <h2 className="text-white font-bold text-lg">COD Blast</h2>
          <p className="text-slate-500 text-xs">Select customers → send WA message with COD offer → place order</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-slate-800 border border-white/5 rounded-2xl p-5 space-y-4">

        {/* Type toggle */}
        <div className="flex gap-2">
          {(["abandoned", "ordered"] as const).map(t => (
            <button key={t} onClick={() => setType(t)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${type === t ? "bg-teal-500 text-white" : "bg-slate-700 text-slate-400 hover:text-white"}`}>
              {t === "abandoned" ? "🛒 Abandoned Carts" : "✅ Past Orders"}
            </button>
          ))}
        </div>

        {/* Filters row */}
        <div className="flex gap-3 flex-wrap">
          <select value={days} onChange={e => setDays(Number(e.target.value))}
            className="bg-slate-900 border border-white/10 text-white text-xs rounded-xl px-3 py-2 outline-none">
            <option value={2}>Last 2 days</option>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <div className="flex items-center gap-2 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 flex-1 min-w-[180px]">
            <FaSearch className="text-slate-500 text-xs" />
            <input placeholder="Search name or phone..." value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && fetchCustomers()}
              className="bg-transparent text-white text-xs outline-none flex-1 placeholder-slate-600" />
          </div>
          <button onClick={fetchCustomers} disabled={loading}
            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl transition disabled:opacity-40">
            {loading ? <FaSpinner className="animate-spin" /> : "🔍 Search"}
          </button>
        </div>

        {/* Template selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-1">
            <label className="text-xs font-bold text-slate-400 mb-1 block">Template (Approved only)</label>
            <select value={template} onChange={e => setTemplate(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 text-white text-xs rounded-xl px-3 py-2.5 outline-none">
              <option value="">-- Select template --</option>
              {approvedTemplates.map((t: any) => (
                <option key={t.name} value={t.name}>{t.name} ({t.language})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 mb-1 block">Language</label>
            <input value={templateLang} onChange={e => setTemplateLang(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 text-white text-xs rounded-xl px-3 py-2.5 outline-none"
              placeholder="en_US" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 mb-1 block">Discount Code (optional)</label>
            <input value={discount} onChange={e => setDiscount(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 text-white text-xs rounded-xl px-3 py-2.5 outline-none font-mono"
              placeholder="DIWALI10" />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 mb-1 block">Blast Name (optional)</label>
          <input value={blastName} onChange={e => setBlastName(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 text-white text-xs rounded-xl px-3 py-2.5 outline-none"
            placeholder="e.g. Diwali Sale Blast" />
        </div>
      </div>

      {/* Customer table */}
      <div className="bg-slate-800 border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
          <p className="text-white font-bold text-sm">
            {loading ? "Loading..." : `${total} customers found — ${selected.size} selected`}
          </p>
          <div className="flex gap-2">
            <button onClick={toggleAll}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-xs font-bold text-white rounded-xl transition">
              {selected.size === customers.length && customers.length > 0 ? "Deselect All" : "Select All"}
            </button>
            <button onClick={handleSendBlast} disabled={sending || selected.size === 0 || !template}
              className="px-4 py-1.5 bg-green-500 hover:bg-green-400 disabled:opacity-40 text-black text-xs font-bold rounded-xl transition flex items-center gap-1.5">
              {sending ? <FaSpinner className="animate-spin" /> : <FaWhatsapp />}
              Send WA ({selected.size})
            </button>
          </div>
        </div>

        {customers.length === 0 && !loading ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No customers found. Try changing filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-xs text-slate-400 uppercase">
                  <th className="px-4 py-3 w-8"><input type="checkbox" checked={selected.size === customers.length && customers.length > 0} onChange={toggleAll} className="accent-teal-500" /></th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Products</th>
                  <th className="px-4 py-3 text-left">Value</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  {type === "abandoned" && <th className="px-4 py-3 text-left">COD Order</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {customers.map((c: any) => (
                  <tr key={c.phone} className={`hover:bg-white/5 transition ${selected.has(c.phone) ? "bg-teal-500/5" : ""}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(c.phone)} onChange={() => toggleSelect(c.phone)} className="accent-teal-500" />
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white font-bold text-xs">{c.name}</p>
                      <p className="text-slate-500 text-xs font-mono">{c.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-300 text-xs max-w-[200px] truncate">{c.products || "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-teal-400 text-xs font-bold">₹{c.totalPrice?.toLocaleString("en-IN") || "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        c.status === "RECOVERED" ? "bg-green-500/20 text-green-400" :
                        c.status === "SENT" ? "bg-blue-500/20 text-blue-400" :
                        c.status === "ordered" ? "bg-purple-500/20 text-purple-400" :
                        "bg-yellow-500/20 text-yellow-400"
                      }`}>{c.status}</span>
                    </td>
                    {type === "abandoned" && (
                      <td className="px-4 py-3">
                        <button onClick={() => handlePlaceOrder(c)}
                          disabled={placing === c.phone || c.status === "RECOVERED"}
                          className="px-3 py-1 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-300 text-xs font-bold rounded-lg transition disabled:opacity-40 flex items-center gap-1">
                          {placing === c.phone ? <FaSpinner className="animate-spin" /> : <FaShoppingCart />}
                          {c.status === "RECOVERED" ? "Done" : "Place COD"}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Blast history */}
      {blasts.length > 0 && (
        <div className="bg-slate-800 border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/5">
            <p className="text-white font-bold text-sm">📊 Blast History</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5 text-slate-400 uppercase">
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Template</th>
                  <th className="px-4 py-3 text-left">Sent</th>
                  <th className="px-4 py-3 text-left">Orders</th>
                  <th className="px-4 py-3 text-left">Revenue</th>
                  <th className="px-4 py-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {blasts.map((b: any) => (
                  <tr key={b.id} className="hover:bg-white/5">
                    <td className="px-4 py-3 text-white font-bold">{b.name}</td>
                    <td className="px-4 py-3 text-slate-400 font-mono">{b.templateName}</td>
                    <td className="px-4 py-3 text-slate-300">{b.totalSent}</td>
                    <td className="px-4 py-3 text-teal-400 font-bold">{b.totalOrders}</td>
                    <td className="px-4 py-3 text-green-400 font-bold">₹{b.revenue?.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-slate-500">{new Date(b.createdAt).toLocaleDateString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
