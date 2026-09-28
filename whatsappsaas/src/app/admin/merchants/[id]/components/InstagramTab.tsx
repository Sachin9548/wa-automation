"use client";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FaSpinner, FaSync, FaArrowLeft, FaInstagram } from "react-icons/fa";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const ah = () => ({
  "x-admin-api-key":
    typeof window !== "undefined"
      ? sessionStorage.getItem("adminKey") || ""
      : "",
});

interface InstagramTabProps {
  merchantId: string;
  merchant: any;
}

export default function InstagramTab({
  merchantId,
  merchant,
}: InstagramTabProps) {
  const [subTab, setSubTab] = useState<"dms" | "comments">("dms");
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const channel = subTab === "dms" ? "INSTAGRAM_DM" : "INSTAGRAM_COMMENT";

  const loadConversations = async () => {
    setLoading(true);
    setSelected(null);
    setMessages([]);
    try {
      const r = await axios.get(
        `${API_URL}/inbox/conversations/${merchantId}?channel=${channel}&limit=50`,
        { headers: ah() },
      );
      setConversations(r.data.conversations || []);
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (convo: any) => {
    setSelected(convo);
    setMsgLoading(true);
    try {
      const r = await axios.get(
        `${API_URL}/inbox/messages/${merchantId}/${encodeURIComponent(convo.customerPhone)}?channel=${channel}&limit=100`,
        { headers: ah() },
      );
      setMessages(r.data.messages || []);
      setTimeout(
        () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
        100,
      );
    } catch {
      setMessages([]);
    } finally {
      setMsgLoading(false);
    }
  };

  const sendReply = async () => {
    if (!replyText.trim() || !selected) return;
    setReplying(true);
    try {
      await axios.post(
        `${API_URL}/inbox/send/${merchantId}`,
        {
          customerPhone: selected.customerPhone,
          message: replyText.trim(),
          channel,
        },
        { headers: ah() },
      );
      setReplyText("");
      await loadMessages(selected);
    } catch (e: any) {
      alert(e.response?.data?.message || "Send failed");
    } finally {
      setReplying(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [subTab]);

  if (!merchant?.igAccountId) {
    return (
      <div className="bg-slate-800 border border-pink-500/20 rounded-2xl p-10 text-center">
        <p className="text-4xl mb-3">📸</p>
        <p className="text-white font-bold text-lg mb-2">
          Instagram Not Connected
        </p>
        <p className="text-slate-400 text-sm">
          Go to Credentials tab → add Instagram Account ID + Access Token → Save
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
          <FaInstagram className="text-pink-400 text-lg" />
        </div>
        <div>
          <h2 className="text-white font-bold">Instagram Inbox</h2>
          <p className="text-slate-500 text-xs">
            @{merchant.igUsername || merchant.igAccountId}
          </p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2">
        {(["dms", "comments"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${subTab === t ? "bg-pink-500 text-white" : "bg-slate-700 text-slate-400 hover:text-white"}`}
          >
            {t === "dms" ? "💬 DMs" : "💭 Comments"}
          </button>
        ))}
        <button
          onClick={loadConversations}
          className="ml-auto px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-400 rounded-xl text-xs"
        >
          <FaSync className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Main layout */}
      <div className="flex gap-4 h-[65vh]">
        {/* Conversation list */}
        <div
          className={`${selected ? "hidden md:flex" : "flex"} flex-col w-full md:w-72 bg-slate-800 border border-white/5 rounded-2xl overflow-hidden`}
        >
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <FaSpinner className="animate-spin text-pink-400 text-xl" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-sm">
                <p className="text-3xl mb-2">📭</p>
                <p>No {subTab === "dms" ? "DMs" : "comments"} yet</p>
              </div>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.customerPhone}
                  onClick={() => loadMessages(c)}
                  className={`w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition ${selected?.customerPhone === c.customerPhone ? "bg-pink-500/10 border-l-2 border-l-pink-400" : ""}`}
                >
                  <p className="text-white text-xs font-bold truncate">
                    {c.customerName || c.customerPhone}
                  </p>
                  <p className="text-slate-500 text-[10px] truncate mt-0.5">
                    {c.lastMessage}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat window */}
        <div
          className={`${selected ? "flex" : "hidden md:flex"} flex-1 flex-col bg-slate-800 border border-white/5 rounded-2xl overflow-hidden`}
        >
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
              <p className="text-4xl mb-2">👈</p>
              <p className="text-sm">Select a conversation</p>
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-white/5 flex items-center gap-3">
                <button
                  onClick={() => setSelected(null)}
                  className="md:hidden text-slate-400"
                >
                  <FaArrowLeft />
                </button>
                <p className="text-white font-bold text-sm">
                  {selected.customerName || selected.customerPhone}
                </p>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {msgLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <FaSpinner className="animate-spin text-pink-400" />
                  </div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex ${m.direction === "OUTGOING" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs rounded-2xl px-4 py-2.5 text-sm ${m.direction === "OUTGOING" ? "bg-pink-600 text-white" : "bg-slate-700 text-slate-100"}`}
                      >
                        <p className="leading-relaxed whitespace-pre-wrap">
                          {m.content}
                        </p>
                        <p
                          className={`text-[9px] mt-1 ${m.direction === "OUTGOING" ? "text-pink-200 text-right" : "text-slate-500"}`}
                        >
                          {new Date(m.timestamp).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {m.channel === "INSTAGRAM_COMMENT" && (
                            <span className="ml-1">💭</span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="px-4 py-3 border-t border-white/5">
                <div className="flex gap-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendReply();
                      }
                    }}
                    placeholder={
                      subTab === "dms"
                        ? "Type a DM reply..."
                        : "Type a comment reply..."
                    }
                    rows={2}
                    className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                  />
                  <button
                    onClick={sendReply}
                    disabled={replying || !replyText.trim()}
                    className="px-4 bg-pink-500 hover:bg-pink-400 disabled:opacity-40 text-white font-bold rounded-xl transition"
                  >
                    {replying ? <FaSpinner className="animate-spin" /> : "➤"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
