"use client";
import { useRef } from "react";
import { FaArrowLeft, FaSync, FaSpinner } from "react-icons/fa";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface InboxTabProps {
  merchantId: string;
  metaTemplates: any[];
  setActiveTab: (tab: any) => void;
  inboxConversations: any[];
  inboxLoading: boolean;
  inboxSearch: string; setInboxSearch: (v: string) => void;
  selectedConvo: any; setSelectedConvo: (v: any) => void;
  inboxMessages: any[];
  inboxMessagesLoading: boolean;
  timeLeft: string | null;
  replyText: string; setReplyText: (v: string) => void;
  replySending: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  loadInboxConversations: (search?: string) => void;
  loadInboxMessages: (convo: any) => void;
  sendInboxReply: () => void;
}

export default function InboxTab({
  metaTemplates, setActiveTab,
  inboxConversations, inboxLoading, inboxSearch, setInboxSearch,
  selectedConvo, setSelectedConvo, inboxMessages, inboxMessagesLoading,
  timeLeft, replyText, setReplyText, replySending, messagesEndRef,
  loadInboxConversations, loadInboxMessages, sendInboxReply,
}: InboxTabProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 h-auto md:h-[75vh]">
      {/* Conversation List */}
      <div className={`${selectedConvo ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 md:flex-shrink-0 bg-slate-800 border border-white/5 rounded-2xl overflow-hidden h-[60vh] md:h-full`}>
        <div className="px-4 py-3 border-b border-white/5">
          <p className="text-white font-extrabold text-sm mb-2">💬 Conversations</p>
          <input type="text" placeholder="Search by phone..." value={inboxSearch}
            onChange={(e) => { setInboxSearch(e.target.value); loadInboxConversations(e.target.value); }}
            className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-teal-500" />
        </div>

        <div className="flex-1 overflow-y-auto">
          {inboxLoading ? (
            <div className="flex items-center justify-center h-full">
              <FaSpinner className="animate-spin text-teal-400 text-xl" />
            </div>
          ) : inboxConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <p className="text-4xl mb-3">💬</p>
              <p className="text-slate-400 text-xs">No conversations yet.</p>
              <p className="text-slate-600 text-[10px] mt-1">When customers reply to your messages, they&apos;ll appear here.</p>
            </div>
          ) : inboxConversations.map((convo) => (
            <button key={convo.customerPhone} onClick={() => loadInboxMessages(convo)}
              className={`w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition ${selectedConvo?.customerPhone === convo.customerPhone ? "bg-teal-500/10 border-l-2 border-l-teal-400" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white text-xs font-bold truncate">{convo.customerName || convo.customerPhone}</p>
                    {convo.isOptedOut && <span className="text-[8px] bg-red-500/20 text-red-400 px-1 rounded font-bold">OPT-OUT</span>}
                    {!convo.canSendFreeText && !convo.isOptedOut && <span className="text-[8px] bg-yellow-500/20 text-yellow-400 px-1 rounded font-bold">TMPL</span>}
                  </div>
                  <p className="text-slate-500 text-[10px] truncate mt-0.5">
                    {convo.lastDirection === "INCOMING" ? "← " : "→ "}{convo.lastMessage || "..."}
                  </p>
                  <p className="text-slate-600 text-[9px] mt-0.5">{convo.customerPhone}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <p className="text-slate-600 text-[9px]">
                    {convo.lastTimestamp ? new Date(convo.lastTimestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""}
                  </p>
                  {convo.unreadCount > 0 && (
                    <span className="bg-teal-500 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
                      {convo.unreadCount > 9 ? "9+" : convo.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="px-4 py-2 border-t border-white/5">
          <button onClick={() => loadInboxConversations(inboxSearch)}
            className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2">
            <FaSync className={inboxLoading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Chat Window */}
      <div className={`${selectedConvo ? "flex" : "hidden md:flex"} flex-1 flex-col bg-slate-800 border border-white/5 rounded-2xl overflow-hidden h-[75vh] md:h-full`}>
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
                <button onClick={() => setSelectedConvo(null)} className="md:hidden text-slate-400 hover:text-white p-1 shrink-0">
                  <FaArrowLeft className="text-sm" />
                </button>
                <div className="min-w-0">
                  <p className="text-white font-extrabold text-sm truncate">{selectedConvo.customerName || selectedConvo.customerPhone}</p>
                  <p className="text-slate-500 text-[10px] truncate">{selectedConvo.customerPhone}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap justify-end shrink-0 max-w-[180px] md:max-w-none">
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
              ) : inboxMessages.map((msg: any) => (
                <div key={msg.id} className={`flex ${msg.direction === "OUTGOING" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-xs lg:max-w-sm rounded-2xl overflow-hidden ${msg.direction === "OUTGOING" ? "bg-teal-600 text-white rounded-br-sm" : "bg-slate-700 text-slate-100 rounded-bl-sm"}`}>

                    {/* Media */}
                    {msg.mediaType === "image" && msg.mediaId && (
                      <a href={`${API_URL}/inbox/media/${msg.id}`} target="_blank" rel="noopener noreferrer" className="block">
                        <img src={`${API_URL}/inbox/media/${msg.id}`} alt={msg.mediaCaption || "Image"}
                          className="w-full max-w-[240px] rounded-t-2xl object-cover" style={{ maxHeight: "200px" }}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      </a>
                    )}
                    {msg.mediaType === "video" && msg.mediaId && (
                      <div className="px-4 pt-3">
                        <div className="bg-black/30 rounded-xl flex items-center justify-center gap-2 px-3 py-2">
                          <span className="text-xl">🎥</span>
                          <a href={`${API_URL}/inbox/media/${msg.id}`} target="_blank" rel="noopener noreferrer" className="text-xs font-bold underline opacity-90">View Video</a>
                        </div>
                      </div>
                    )}
                    {msg.mediaType === "audio" && msg.mediaId && (
                      <div className="px-4 pt-3">
                        <audio controls className="w-full max-w-[220px] h-8" style={{ filter: "invert(1) brightness(0.8)" }}>
                          <source src={`${API_URL}/inbox/media/${msg.id}`} type={msg.mediaMimeType || "audio/ogg"} />
                          <a href={`${API_URL}/inbox/media/${msg.id}`} target="_blank" rel="noopener noreferrer" className="text-xs underline">🎤 Voice Message</a>
                        </audio>
                      </div>
                    )}
                    {msg.mediaType === "document" && msg.mediaId && (
                      <div className="px-4 pt-3">
                        <a href={`${API_URL}/inbox/media/${msg.id}`} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-black/20 rounded-xl px-3 py-2 hover:bg-black/30 transition">
                          <span className="text-xl shrink-0">📄</span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate">{msg.mediaFilename || "Document"}</p>
                            <p className="text-[10px] opacity-60 truncate">{msg.mediaMimeType || "file"}</p>
                          </div>
                        </a>
                      </div>
                    )}
                    {msg.mediaType === "sticker" && msg.mediaId && (
                      <div className="px-4 pt-3">
                        <img src={`${API_URL}/inbox/media/${msg.id}`} alt="Sticker" className="w-20 h-20 object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      </div>
                    )}
                    {msg.mediaType === "location" && (
                      <div className="px-4 pt-3">
                        <a href={`https://maps.google.com/?q=${msg.mediaLat},${msg.mediaLng}`} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-black/20 rounded-xl px-3 py-2 hover:bg-black/30 transition">
                          <span className="text-xl shrink-0">📍</span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate">{msg.mediaAddress || "Location"}</p>
                            {msg.mediaLat && msg.mediaLng && <p className="text-[10px] opacity-60">{msg.mediaLat.toFixed(4)}, {msg.mediaLng.toFixed(4)}</p>}
                            <p className="text-[10px] opacity-70 underline">Open in Maps</p>
                          </div>
                        </a>
                      </div>
                    )}

                    {/* Text content */}
                    <div className="px-4 py-2.5">
                      {msg.mediaType && ["image", "video", "document"].includes(msg.mediaType) && msg.mediaCaption ? (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.mediaCaption}</p>
                      ) : msg.mediaType && msg.mediaId ? null : (
                        <>
                          {msg.templateName && msg.templateName !== "ai_reply" && msg.templateName !== "ai_fallback" ? (() => {
                            const tmpl = metaTemplates.find((t) => t.name === msg.templateName);
                            const body = tmpl?.components?.find((c: any) => c.type === "BODY")?.text;
                            if (body) {
                              const vars = msg.content.includes("\n") ? msg.content.split("\n")[1]?.split(" · ") || [] : [];
                              let rendered = body;
                              vars.forEach((v: string, i: number) => { rendered = rendered.replace(new RegExp(`\\{\\{${i + 1}\\}\\}`, "g"), v); });
                              return (
                                <>
                                  <div className="mb-1"><span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/10 opacity-70">📋 {msg.templateName}</span></div>
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{rendered}</p>
                                </>
                              );
                            }
                            return <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>;
                          })() : <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
                        </>
                      )}
                      <div className={`flex items-center gap-1.5 mt-1 ${msg.direction === "OUTGOING" ? "justify-end" : "justify-start"}`}>
                        <span className="text-[9px] opacity-60">{new Date(msg.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                        {msg.direction === "OUTGOING" && (
                          <span className={`text-[9px] font-bold ${msg.status === "READ" ? "text-blue-300" : msg.status === "DELIVERED" ? "text-teal-200" : msg.status === "FAILED" ? "text-red-300" : "opacity-50"}`}>
                            {msg.status === "READ" ? "✓✓" : msg.status === "DELIVERED" ? "✓✓" : msg.status === "FAILED" ? "✗" : "✓"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
                  <button onClick={() => setActiveTab("templates")}
                    className="w-full py-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 text-xs font-bold rounded-xl transition">
                    📋 Go to Templates
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendInboxReply(); } }}
                    placeholder="Type a reply... (Enter to send, Shift+Enter for new line)" rows={2}
                    className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
                  <button onClick={sendInboxReply} disabled={replySending || !replyText.trim()}
                    className="px-5 bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-white font-bold rounded-xl transition flex items-center gap-2 text-sm">
                    {replySending ? <FaSpinner className="animate-spin" /> : "➤"}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
