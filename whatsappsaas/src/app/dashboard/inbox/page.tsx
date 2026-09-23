"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { FaArrowLeft, FaSync, FaSpinner, FaWhatsapp } from "react-icons/fa";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function MerchantInbox() {
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState("");
  const [selectedConvo, setSelectedConvo] = useState<any>(null);
  const [messages, setMessages]           = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [replyText, setReplyText]         = useState("");
  const [replySending, setReplySending]   = useState(false);
  const [timeLeft, setTimeLeft]           = useState<string | null>(null);
  const [accessDenied, setAccessDenied]   = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const token = () => localStorage.getItem("token") || "";
  const headers = () => ({ Authorization: `Bearer ${token()}` });

  const fetchConversations = async (q = "") => {
    setLoading(true);
    try {
      const r = await axios.get(`${API_URL}/merchant/inbox/conversations?search=${q}&limit=50`, { headers: headers() });
      setConversations(r.data.conversations || []);
    } catch (e: any) {
      if (e.response?.status === 403) setAccessDenied(true);
      if (e.response?.status === 401) router.push("/login");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchConversations(); }, []);

  useEffect(() => {
    if (!messagesEndRef.current) return;
    messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Timer for 24hr window
  useEffect(() => {
    if (!selectedConvo?.windowExpiresAt) return;
    const update = () => {
      const ms = new Date(selectedConvo.windowExpiresAt).getTime() - Date.now();
      if (ms <= 0) { setTimeLeft(null); return; }
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      setTimeLeft(`${h}h ${m}m`);
    };
    update();
    const t = setInterval(update, 60000);
    return () => clearInterval(t);
  }, [selectedConvo]);

  const loadMessages = async (convo: any) => {
    setSelectedConvo(convo);
    setMessagesLoading(true);
    try {
      const phone = encodeURIComponent(convo.customerPhone);
      const r = await axios.get(`${API_URL}/merchant/inbox/messages/${phone}`, { headers: headers() });
      setMessages(r.data.messages || []);
    } catch {} finally { setMessagesLoading(false); }
  };

  const sendReply = async () => {
    if (!replyText.trim() || !selectedConvo) return;
    setReplySending(true);
    try {
      await axios.post(`${API_URL}/merchant/inbox/send`, {
        customerPhone: selectedConvo.customerPhone,
        message: replyText.trim(),
      }, { headers: headers() });
      setReplyText("");
      await loadMessages(selectedConvo);
    } catch (e: any) {
      alert(e.response?.data?.message || "Send failed");
    } finally { setReplySending(false); }
  };

  if (accessDenied) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center max-w-sm">
        <p className="text-5xl mb-4">🔒</p>
        <h2 className="text-white font-extrabold text-xl mb-2">Inbox Not Available</h2>
        <p className="text-slate-400 text-sm">Contact your account manager to enable inbox access.</p>
        <button onClick={() => router.push("/dashboard")} className="mt-6 px-6 py-3 bg-teal-500 text-white font-bold rounded-xl text-sm">
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="h-14 bg-slate-900/80 backdrop-blur border-b border-white/5 flex items-center px-4 gap-3 sticky top-0 z-10">
        <button onClick={() => router.push("/dashboard")} className="text-slate-400 hover:text-white transition">
          <FaArrowLeft />
        </button>
        <FaWhatsapp className="text-teal-400" />
        <h1 className="text-white font-extrabold text-sm">Customer Inbox</h1>
        <button onClick={() => fetchConversations(search)} className="ml-auto text-slate-400 hover:text-teal-400 transition">
          <FaSync className={loading ? "animate-spin" : ""} />
        </button>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 56px)" }}>

        {/* Conversation list */}
        <div className={`${selectedConvo ? "hidden md:flex" : "flex"} flex-col w-full md:w-72 bg-slate-900 border-r border-white/5`}>
          <div className="p-3 border-b border-white/5">
            <input type="text" placeholder="Search by phone..." value={search}
              onChange={(e) => { setSearch(e.target.value); fetchConversations(e.target.value); }}
              className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none" />
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-40"><FaSpinner className="animate-spin text-teal-400 text-xl" /></div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-sm">No conversations yet</div>
            ) : conversations.map((c) => (
              <button key={c.customerPhone} onClick={() => loadMessages(c)}
                className={`w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition ${selectedConvo?.customerPhone === c.customerPhone ? "bg-teal-500/10 border-l-2 border-l-teal-400" : ""}`}>
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-xs font-bold truncate">{c.customerName || c.customerPhone}</p>
                    <p className="text-slate-500 text-[10px] truncate mt-0.5">{c.lastDirection === "INCOMING" ? "← " : "→ "}{c.lastMessage}</p>
                  </div>
                  {c.unreadCount > 0 && (
                    <span className="bg-teal-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center ml-2 shrink-0">
                      {c.unreadCount > 9 ? "9+" : c.unreadCount}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat window */}
        <div className={`${selectedConvo ? "flex" : "hidden md:flex"} flex-1 flex-col bg-slate-950`}>
          {!selectedConvo ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
              <p className="text-4xl mb-3">💬</p>
              <p className="text-sm">Select a conversation</p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="px-4 py-3 bg-slate-900 border-b border-white/5 flex items-center gap-3">
                <button onClick={() => setSelectedConvo(null)} className="md:hidden text-slate-400">
                  <FaArrowLeft />
                </button>
                <div>
                  <p className="text-white font-bold text-sm">{selectedConvo.customerName || selectedConvo.customerPhone}</p>
                  <p className="text-slate-500 text-xs">{selectedConvo.customerPhone}</p>
                </div>
                {selectedConvo.canSendFreeText && timeLeft && (
                  <div className="ml-auto flex items-center gap-1 bg-green-500/10 border border-green-500/20 rounded-xl px-2 py-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-green-400 text-[9px] font-bold">{timeLeft} left</span>
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-full"><FaSpinner className="animate-spin text-teal-400 text-xl" /></div>
                ) : messages.map((msg: any) => (
                  <div key={msg.id} className={`flex ${msg.direction === "OUTGOING" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-xs rounded-2xl px-4 py-2.5 text-sm ${msg.direction === "OUTGOING" ? "bg-teal-600 text-white" : "bg-slate-800 text-slate-100"}`}>
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-[9px] mt-1 ${msg.direction === "OUTGOING" ? "text-teal-200 text-right" : "text-slate-500"}`}>
                        {new Date(msg.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply box */}
              <div className="px-4 py-3 bg-slate-900 border-t border-white/5">
                {selectedConvo.isOptedOut ? (
                  <div className="text-center text-red-400 text-xs font-bold py-2">🚫 Customer opted out — cannot send messages</div>
                ) : !selectedConvo.canSendFreeText ? (
                  <div className="text-center text-yellow-400 text-xs font-bold py-2">⏰ 24hr window closed — customer must message first</div>
                ) : (
                  <div className="flex gap-2">
                    <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                      placeholder="Type a reply... (Enter to send)" rows={2}
                      className="flex-1 bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
                    <button onClick={sendReply} disabled={replySending || !replyText.trim()}
                      className="px-4 bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-white font-bold rounded-xl transition">
                      {replySending ? <FaSpinner className="animate-spin" /> : "➤"}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
