"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { FaWhatsapp, FaCheckCircle, FaArrowRight, FaSpinner, FaClock } from "react-icons/fa";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [storeUrl, setStoreUrl] = useState("");

  useEffect(() => {
    const check = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return router.push("/login");
        const res = await axios.get(`${API_URL}/merchant/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // If already activated by admin → go to dashboard
        if (res.data.merchant?.status === "ACTIVE") {
          router.push("/dashboard");
          return;
        }
      } catch {
        router.push("/login");
      } finally {
        setPageLoading(false);
      }
    };
    check();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API_URL}/merchant/onboarding`,
        { storeUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSubmitted(true);
    } catch {
      alert("Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <FaSpinner className="animate-spin text-4xl text-teal-400" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl flex items-center justify-center shadow-lg">
            <FaWhatsapp className="text-white text-2xl" />
          </div>
          <div>
            <p className="text-white font-extrabold text-lg leading-tight">WA-Auto</p>
            <p className="text-teal-400 text-xs">WhatsApp Marketing</p>
          </div>
        </div>

        {!submitted ? (
          <div className="bg-slate-900 border border-white/5 rounded-3xl p-8 shadow-2xl">
            <h1 className="text-2xl font-extrabold text-white mb-2">Connect your store</h1>
            <p className="text-slate-400 text-sm mb-8">
              Enter your details. Our team will connect your WhatsApp and activate your account within a few hours.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">
                  Shopify Store Domain
                </label>
                <input
                  type="text"
                  required
                  value={storeUrl}
                  onChange={e => setStoreUrl(e.target.value)}
                  placeholder="yourstore.myshopify.com"
                  className="w-full p-4 bg-slate-800 border border-white/10 text-white placeholder-slate-500 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 transition"
                />
                <p className="text-slate-500 text-xs mt-1.5">
                  We will connect your Shopify store to start syncing customers automatically.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white font-bold py-4 rounded-xl hover:from-teal-400 hover:to-teal-500 transition flex items-center justify-center gap-2 shadow-lg shadow-teal-900/30 disabled:opacity-50"
              >
                {loading
                  ? <><FaSpinner className="animate-spin" /> Submitting...</>
                  : <>Submit Details <FaArrowRight /></>
                }
              </button>
            </form>
          </div>
        ) : (
          /* Success state */
          <div className="bg-slate-900 border border-white/5 rounded-3xl p-8 shadow-2xl text-center">
            <div className="w-20 h-20 bg-teal-500/10 border border-teal-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FaCheckCircle className="text-4xl text-teal-400" />
            </div>
            <h2 className="text-2xl font-extrabold text-white mb-3">Details Submitted!</h2>
            <p className="text-slate-400 mb-6 leading-relaxed">
              Our team is setting up your WhatsApp connection and activating your Shopify integration.
              <br /><br />
              You will receive a WhatsApp message once your account is live. This typically takes a few hours.
            </p>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-3 mb-6">
              <FaClock className="text-amber-400 shrink-0" />
              <p className="text-amber-300 text-sm font-medium text-left">
                Account activation in progress. Check back or wait for our team to contact you.
              </p>
            </div>

            <button
              onClick={() => router.push("/dashboard")}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold py-3 rounded-xl transition"
            >
              View Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
