"use client";

import { useState } from "react";
import axios from "axios";
import { FaSearch, FaCopy, FaCheckCircle, FaTimesCircle, FaArrowLeft, FaSpinner } from "react-icons/fa";
import Link from "next/link";

export default function DomainChecker() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setResult(null);
    setCopied(false);

    try {
      // Note: Agar aapne Admin routes par adminKey ka middleware lagaya hai, toh headers me pass karna padega. 
      // Example: { headers: { "x-admin-api-key": sessionStorage.getItem("adminKey") } }
      const key = sessionStorage.getItem("adminKey") || "";

      const res = await axios.post(`https://api.wautomation.shop/api/check-domain`, 
        { url },
        { headers: { "x-admin-api-key": key } }
      );
      setResult(res.data);
    } catch (error) {
      alert("Error checking domain!");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result?.shopifyDomain) {
      navigator.clipboard.writeText(result.shopifyDomain);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-10">
      <div className="max-w-2xl mx-auto">
        <Link href="/admin" className="text-indigo-600 font-bold flex items-center mb-8 hover:underline">
          <FaArrowLeft className="mr-2" /> Back to Admin Console
        </Link>

        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
          <h1 className="text-3xl font-black text-slate-800 mb-2">Shopify URL Finder</h1>
          <p className="text-slate-500 mb-8">Enter a client's custom domain to find their hidden .myshopify.com URL.</p>

          <form onSubmit={handleCheck} className="flex space-x-4 mb-8">
            <input
              type="text"
              required
              placeholder="e.g. www.sneakerhub.in"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center"
            >
              {loading ? <FaSpinner className="animate-spin mr-2" /> : <FaSearch className="mr-2" />}
              Check
            </button>
          </form>

          {/* Result Area */}
          {result && (
            <div className={`p-6 rounded-2xl border-2 ${result.isShopify ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              {result.isShopify ? (
                <div>
                  <div className="flex items-center text-green-700 font-bold mb-4">
                    <FaCheckCircle className="mr-2 text-xl" /> Shopify Store Detected!
                  </div>
                  <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-green-100">
                    <span className="font-mono text-slate-800 font-bold text-lg">
                      {result.shopifyDomain}
                    </span>
                    <button 
                      onClick={handleCopy}
                      className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-bold hover:bg-green-200 transition flex items-center"
                    >
                      {copied ? "Copied!" : <><FaCopy className="mr-2" /> Copy</>}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center text-red-700 font-bold">
                  <FaTimesCircle className="mr-2 text-xl" /> {result.message}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}