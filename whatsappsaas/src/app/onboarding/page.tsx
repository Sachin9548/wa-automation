"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  FaStore,
  FaQrcode,
  FaCheckCircle,
  FaArrowRight,
  FaWhatsapp,
  FaSpinner,
} from "react-icons/fa";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // States for Form Data
  const [storeUrl, setStoreUrl] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState(""); 
  
  // 🌟 FIX 1: Bring back the QR Code State
  const [qrCode, setQrCode] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return router.push("/login");

        if (step === 1) {
          const profileRes = await axios.get(
            "http://localhost:5000/api/merchant/me",
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          const merchant = profileRes.data.merchant;
          if (merchant.whatsappConnected === true) {
            router.push("/dashboard");
            return;
          }
          setPageLoading(false);
        }

        if (step === 2) {
          const res = await axios.get(
            "http://localhost:5000/api/whatsapp/status",
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );

          if (res.data.status === "QR_READY") {
            // 🌟 FIX 2: Set the QR Code Image URL into state
            setQrCode(res.data.qrCodeUrl);
          } else if (res.data.status === "CONNECTED") {
            clearInterval(interval);
            router.push("/dashboard");
          }
        }
      } catch (error) {
        console.error(error);
      }
    };

    checkStatus();
    if (step === 2) {
      interval = setInterval(checkStatus, 3000);
    }

    return () => clearInterval(interval);
  }, [step, router]);

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        "http://localhost:5000/api/merchant/onboarding",
        { storeUrl, whatsappNumber },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setStep(2);
    } catch (error) {
      alert("Failed to save details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading && step === 1) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <FaSpinner className="animate-spin text-4xl text-teal-700" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 flex flex-col items-center justify-center">
      <div className="max-w-xl w-full px-4">
        {/* Progress Header */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            {step === 1 ? "Connect your Shopify Store" : "Link your WhatsApp"}
          </h2>
        </div>

        {/* Step 1: Form */}
        {step === 1 && (
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
            <form onSubmit={handleNextStep} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shopify Store Domain *
                </label>
                <input
                  type="text"
                  required
                  value={storeUrl}
                  onChange={(e) => setStoreUrl(e.target.value)}
                  placeholder="e.g. yourstore.myshopify.com"
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business WhatsApp Number *
                </label>
                <input
                  type="tel"
                  required
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="e.g. +91 98765XXXXX"
                  minLength={10} 
                  maxLength={15} 
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Enter the number you will use to scan the QR code.
                </p>
              </div>

              <button
                disabled={loading}
                type="submit"
                className="w-full mt-4 bg-teal-700 text-white font-bold py-4 rounded-xl flex justify-center items-center hover:bg-teal-800 shadow-md transition duration-300"
              >
                {loading ? (
                  <FaSpinner className="animate-spin text-xl" />
                ) : (
                  <>
                    Next: Scan QR Code <FaArrowRight className="ml-2" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: QR Scanner */}
        {step === 2 && (
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 text-center">
            <div className="mb-6 inline-block bg-teal-50 p-4 rounded-full">
              <FaWhatsapp className="text-5xl text-teal-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Link Your Business WhatsApp
            </h3>
            <p className="text-gray-600 mb-8">
              Open WhatsApp on your phone, go to Linked Devices, and point your
              camera to the screen.
            </p>

            <div className="p-4 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 flex flex-col items-center justify-center w-64 h-64 mx-auto relative overflow-hidden">
              {/* 🌟 FIX 3: Actually display the QR Code if it exists! */}
              {qrCode ? (
                <img src={qrCode} alt="WhatsApp QR Code" className="w-full h-full object-contain relative z-10" />
              ) : (
                <>
                  <FaQrcode className="text-8xl text-gray-800 opacity-20" />
                  <p className="mt-4 text-sm font-bold text-teal-700 animate-pulse">
                    Waiting for QR...
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}