"use client";
import {
  FaKey,
  FaStore,
  FaWhatsapp,
  FaLink,
  FaSpinner,
  FaCheckCircle,
} from "react-icons/fa";

interface CredentialsTabProps {
  loading: string | null;
  credStoreUrl: string;
  setCredStoreUrl: (v: string) => void;
  credShopifyToken: string;
  setCredShopifyToken: (v: string) => void;
  credShopifySecret: string;
  setCredShopifySecret: (v: string) => void;
  credClientId: string;
  setCredClientId: (v: string) => void;
  credClientSecret: string;
  setCredClientSecret: (v: string) => void;
  credMetaPhoneId: string;
  setCredMetaPhoneId: (v: string) => void;
  credMetaWabaId: string;
  setCredMetaWabaId: (v: string) => void;
  credMetaToken: string;
  setCredMetaToken: (v: string) => void;
  webhookResults: any[];
  handleUpdateCredentials: (e: React.FormEvent) => void;
  handleRegisterWebhooks: () => void;
  wabaSubResult: any;
  credMetaAppId: string;
  setCredMetaAppId: (v: string) => void;
  credMetaAppSecret: string;
  setCredMetaAppSecret: (v: string) => void;
}

export default function CredentialsTab({
  loading,
  credStoreUrl,
  setCredStoreUrl,
  credShopifyToken,
  setCredShopifyToken,
  credShopifySecret,
  setCredShopifySecret,
  credClientId,
  setCredClientId,
  credClientSecret,
  setCredClientSecret,
  credMetaPhoneId,
  setCredMetaPhoneId,
  credMetaWabaId,
  setCredMetaWabaId,
  credMetaToken,
  setCredMetaToken,
  webhookResults,
  handleUpdateCredentials,
  handleRegisterWebhooks,
  wabaSubResult,
  credMetaAppId,
  setCredMetaAppId,
  credMetaAppSecret,
  setCredMetaAppSecret,
}: CredentialsTabProps) {
  return (
    <div className="max-w-2xl space-y-6">
      {/* Credentials form */}
      <div className="bg-slate-800 border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2">
          <FaKey className="text-teal-400" />
          <div>
            <p className="text-white font-extrabold">Merchant Credentials</p>
            <p className="text-slate-400 text-xs">
              Edit any field and click Save — changes update the database
              directly
            </p>
          </div>
        </div>
        <form onSubmit={handleUpdateCredentials} className="p-6 space-y-5">
          {/* Shopify */}
          <div>
            <p className="text-teal-400 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
              <FaStore /> Shopify
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-400 mb-1 block">
                  Store URL
                </label>
                <input
                  type="text"
                  value={credStoreUrl}
                  onChange={(e) => setCredStoreUrl(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">
                  Admin Token
                </label>
                <input
                  type="text"
                  value={credShopifyToken}
                  onChange={(e) => setCredShopifyToken(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-sm font-mono"
                />
                <p className="text-slate-600 text-xs mt-1">
                  Auto-filled after client installs the app via install link
                </p>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">
                  Webhook Secret
                </label>
                <input
                  type="text"
                  value={credShopifySecret}
                  onChange={(e) => setCredShopifySecret(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-sm font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">
                  App Client ID
                </label>
                <input
                  type="text"
                  value={credClientId}
                  onChange={(e) => setCredClientId(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-sm font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">
                  App Client Secret
                </label>
                <input
                  type="text"
                  value={credClientSecret}
                  onChange={(e) => setCredClientSecret(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-teal-500 text-sm font-mono"
                />
              </div>
            </div>
          </div>

          {/* Meta */}
          <div className="border-t border-white/5 pt-5">
            <p className="text-purple-400 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
              <FaWhatsapp /> Meta WhatsApp Cloud API
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">
                  Phone Number ID
                </label>
                <input
                  type="text"
                  value={credMetaPhoneId}
                  onChange={(e) => setCredMetaPhoneId(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">
                  WABA ID
                </label>
                <input
                  type="text"
                  value={credMetaWabaId}
                  onChange={(e) => setCredMetaWabaId(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm font-mono"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-400 mb-1 block">
                  Permanent Access Token
                </label>
                <input
                  type="text"
                  value={credMetaToken}
                  onChange={(e) => setCredMetaToken(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm font-mono"
                />
                <p className="text-slate-600 text-xs mt-1">
                  System User token — never expires
                </p>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">
                  App ID
                </label>
                <input
                  type="text"
                  value={credMetaAppId}
                  onChange={(e) => setCredMetaAppId(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">
                  App Secret
                </label>
                <input
                  type="password"
                  value={credMetaAppSecret}
                  onChange={(e) => setCredMetaAppSecret(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm font-mono"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading === "creds"}
            className="w-full bg-teal-500 hover:bg-teal-400 text-white font-bold py-3.5 rounded-xl disabled:opacity-40 flex items-center justify-center gap-2 transition"
          >
            {loading === "creds" ? (
              <>
                <FaSpinner className="animate-spin" /> Saving...
              </>
            ) : (
              <>
                <FaCheckCircle /> Save All Changes
              </>
            )}
          </button>
        </form>
      </div>

      {/* Register Webhooks */}
      <div className="bg-slate-800 border border-green-500/20 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-green-500/10 flex items-center gap-2">
          <FaLink className="text-green-400" />
          <div>
            <p className="text-white font-extrabold">
              Register Shopify Webhooks
            </p>
            <p className="text-slate-400 text-xs">
              Registers abandoned cart + order webhooks in Shopify automatically
            </p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-slate-900 border border-white/5 rounded-xl p-4 text-xs text-slate-400 space-y-1.5">
            <p className="text-slate-300 font-bold mb-2">
              Will register these webhooks:
            </p>
            <p>
              📦 <code className="text-teal-300">checkouts/create</code> —
              abandoned cart detect
            </p>
            <p>
              🔄 <code className="text-teal-300">checkouts/update</code> — cart
              update
            </p>
            <p>
              ✅ <code className="text-teal-300">orders/create</code> — revenue
              tracking
            </p>
          </div>
          {webhookResults.length > 0 && (
            <div className="space-y-1">
              {webhookResults.map((r: any, i: number) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${r.status === "registered" ? "bg-green-500/10 text-green-400" : r.status === "already_registered" ? "bg-blue-500/10 text-blue-400" : "bg-red-500/10 text-red-400"}`}
                >
                  <span>
                    {r.status === "registered"
                      ? "✅"
                      : r.status === "already_registered"
                        ? "ℹ️"
                        : "❌"}
                  </span>
                  <span className="font-mono">{r.topic}</span>
                  <span className="ml-auto font-bold">{r.status}</span>
                </div>
              ))}
            </div>
          )}

          {wabaSubResult && (
            <div
              className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg mt-1 ${
                wabaSubResult.status === "success"
                  ? "bg-green-500/10 text-green-400"
                  : wabaSubResult.status === "skipped"
                    ? "bg-slate-700 text-slate-400"
                    : "bg-red-500/10 text-red-400"
              }`}
            >
              <span>
                {wabaSubResult.status === "success"
                  ? "✅"
                  : wabaSubResult.status === "skipped"
                    ? "ℹ️"
                    : "❌"}
              </span>
              <span className="font-bold">Meta WABA Subscription:</span>
              <span>{wabaSubResult.reason}</span>
            </div>
          )}

          <button
            onClick={handleRegisterWebhooks}
            disabled={loading === "webhooks"}
            className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-3.5 rounded-xl disabled:opacity-40 flex items-center justify-center gap-2 transition"
          >
            {loading === "webhooks" ? (
              <>
                <FaSpinner className="animate-spin" /> Registering...
              </>
            ) : (
              <>
                <FaLink /> Register Webhooks in Shopify/Meta
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
