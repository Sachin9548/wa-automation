"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  FaRobot, 
  FaSpinner, 
  FaCheckCircle, 
  FaTag, 
  FaGift, 
  FaShoppingCart, 
  FaBullhorn, 
  FaBoxOpen, 
  FaArrowUp, 
  FaWallet, 
  FaCalendarAlt 
} from "react-icons/fa";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const ah = () => ({
  "x-admin-api-key": typeof window !== "undefined" ? sessionStorage.getItem("adminKey") || "" : "",
});

const FLOW_TYPES = [
  { type: "ABANDONED_CART_1", label: "Abandoned Cart — Reminder 1", icon: "🛒", color: "text-orange-400", bg: "bg-orange-500/20", border: "border-orange-500/30", defaultDelay: 30 },
  { type: "ABANDONED_CART_2", label: "Abandoned Cart — Reminder 2 (Discount)", icon: "🎁", color: "text-red-400", bg: "bg-red-500/20", border: "border-red-500/30", defaultDelay: 1440 },
  { type: "ORDER_CONFIRM", label: "Order Confirmation", icon: "✅", color: "text-green-400", bg: "bg-green-500/20", border: "border-green-500/30", defaultDelay: 0 },
  { type: "POST_PURCHASE_UPSELL", label: "Post-Purchase Upsell", icon: "⬆️", color: "text-purple-400", bg: "bg-purple-500/20", border: "border-purple-500/30", defaultDelay: 120 },
  { type: "COD_CONVERT", label: "COD → Prepaid Converter", icon: "💳", color: "text-yellow-400", bg: "bg-yellow-500/20", border: "border-yellow-500/30", defaultDelay: 2 },
  { type: "STORE_ANNIVERSARY", label: "Store Anniversary", icon: "🎂", color: "text-pink-400", bg: "bg-pink-500/20", border: "border-pink-500/30", defaultDelay: 0 },
];

const VARIABLE_OPTIONS = [
  { value: "customer_name", label: "👤 Customer Name" },
  { value: "product_name", label: "📦 First Product Name" },
  { value: "products_list", label: "🛒 All Products (List)" },
  { value: "cart_url", label: "🔗 Cart / Tracking URL" },
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
  setFlowDrafts: React.Dispatch<React.SetStateAction<Record<string, FlowDraftItem>>>;
  fetchAll: () => Promise<void>;
  fetchMetaTemplates: () => void;
  setActiveTab: (tab: any) => void;
}

export default function FlowsTab({
  merchantId, flows, metaTemplates, loading, setLoading, flowDrafts, setFlowDrafts, fetchAll, fetchMetaTemplates, setActiveTab,
}: FlowsTabProps) {

  const updateDraft = (ftType: string, patch: Partial<FlowDraftItem>) => {
    setFlowDrafts((prev) => {
      const existing = prev[ftType] || { template: '', delay: 0, active: false, lang: 'en_US', discount: '', variableMapping: [] };
      return { ...prev, [ftType]: { ...existing, ...patch } };
    });
  };

  return (
    <div className="space-y-6">
      {FLOW_TYPES.map((ft) => {
        const db = flows.find((f: any) => f.type === ft.type);
        const draft = flowDrafts[ft.type];
        
        const currentTemplate = draft?.template ?? db?.metaTemplateName ?? "";
        const currentDelay = draft?.delay ?? db?.delayMinutes ?? ft.defaultDelay;
        const currentActive = draft?.active ?? db?.isActive ?? false;
        const currentMapping = draft?.variableMapping ?? (db?.variableMapping ? JSON.parse(db.variableMapping) : []);

        const approvedTemplates = metaTemplates.filter((t: any) => t.status === "APPROVED");

        const handleSaveFlow = async () => {
          if (!currentTemplate) return alert("Select template");
          setLoading(`flow-${ft.type}`);
          try {
            await axios.post(`${API_URL}/admin/flows/save`, {
              merchantId,
              type: ft.type,
              delayMinutes: currentDelay,
              template: "",
              metaTemplateName: currentTemplate,
              metaTemplateLang: "en_US",
              discountCode: draft?.discount || db?.discountCode || null,
              variableMapping: JSON.stringify(currentMapping),
              isActive: currentActive,
            }, { headers: ah() });
            
            setFlowDrafts(prev => { const n = { ...prev }; delete n[ft.type]; return n; });
            await fetchAll();
            alert(`✅ ${ft.label} saved!`);
          } catch (e: any) { alert("Save failed"); } 
          finally { setLoading(null); }
        };

        return (
          <div key={ft.type} className={`bg-slate-800 rounded-2xl border-2 p-6 ${currentActive ? 'border-green-500/40' : 'border-white/5'}`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${ft.bg} rounded-xl flex items-center justify-center text-lg`}>{ft.icon}</div>
                <div>
                  <p className="text-white font-bold text-sm">{ft.label}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div onClick={() => updateDraft(ft.type, { active: !currentActive })} className={`w-12 h-6 rounded-full flex items-center px-1 transition ${currentActive ? "bg-green-500" : "bg-slate-600"}`}>
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${currentActive ? "translate-x-6" : ""}`} />
                  </div>
                </label>
                <button onClick={handleSaveFlow} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-teal-700">Save</button>
              </div>
            </div>

            {/* Template Select */}
            <select 
              value={currentTemplate}
              onChange={(e) => {
                const selected = e.target.value;
                const tmpl = metaTemplates.find((t: any) => t.name === selected);
                const bodyText = tmpl?.components?.find((c: any) => c.type === "BODY")?.text || "";
                const matches = bodyText.match(/\{\{\d+\}\}/g) || [];
                updateDraft(ft.type, { template: selected, variableMapping: matches.map(() => "customer_name") });
              }}
              className="w-full p-3 bg-slate-900 border border-white/10 text-white rounded-xl text-sm mb-4"
            >
              <option value="">-- Select Template --</option>
              {approvedTemplates.map((t: any) => <option key={t.name} value={t.name}>{t.name}</option>)}
            </select>

            {/* Variable Mapping UI */}
            {currentMapping.length > 0 && (
              <div className="bg-slate-900/60 p-4 rounded-xl space-y-2 mb-4">
                <p className="text-xs font-bold text-teal-400 mb-2">Map Template Variables</p>
                {currentMapping.map((val: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-400 w-10">{`{{${idx + 1}}}`}</span>
                    <select 
                      value={val}
                      onChange={(e) => {
                        const newMap = [...currentMapping];
                        newMap[idx] = e.target.value;
                        updateDraft(ft.type, { variableMapping: newMap });
                      }}
                      className="flex-1 p-2 bg-slate-800 border rounded-lg text-xs text-white"
                    >
                      {VARIABLE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}