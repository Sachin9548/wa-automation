"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import {
  FaArrowLeft,
  FaWallet,
  FaCalendarPlus,
  FaSync,
  FaBullhorn,
  FaCheckCircle,
  FaRocket,
  FaShieldAlt,
} from "react-icons/fa";

const API_URL = "http://localhost:5000/api";

export default function MerchantControlHub() {
  const { id } = useParams();
  const router = useRouter();
  const [merchant, setMerchant] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [days, setDays] = useState("30");
  const [category, setCategory] = useState("ECOMMERCE");
  const [shopifyToken, setShopifyToken] = useState("");
  const [shopifySecret, setShopifySecret] = useState("");
  const [loading, setLoading] = useState(false);
    const [storeUrl, setStoreUrl] = useState("");


  useEffect(() => {
    const key = sessionStorage.getItem("adminKey");
    axios
      .get(`${API_URL}/admin/merchants`, {
        headers: { "x-admin-api-key": key },
      })
      .then((res) =>
        setMerchant(res.data.merchants.find((m: any) => m.id === id)),
      );
  }, [id]);

  useEffect(() => {
    if (merchant) {
      setStoreUrl(merchant.storeUrl || "");
    }
  }, [merchant]);

  const handleAction = async (endpoint: string, data: any) => {
    setLoading(true);
    try {
      const key = sessionStorage.getItem("adminKey");
      await axios.post(
        `${API_URL}/admin/${endpoint}`,
        { merchantId: id, ...data },
        { headers: { "x-admin-api-key": key } },
      );
      alert("Action Completed Successfully!");
      location.reload();
    } catch (e) {
      alert("Error processing request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-10">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => router.back()}
          className="text-slate-400 hover:text-indigo-600 font-bold flex items-center mb-8 transition"
        >
          <FaArrowLeft className="mr-2" /> Back to Console
        </button>

        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl font-black text-slate-800 mb-2">
              {merchant?.brandName}
            </h1>
            <p className="text-slate-500 font-medium">
              Management Hub • ID: {id?.toString().slice(0, 8)}...
            </p>
          </div>
          <div className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-100">
            Current Balance: ₹{merchant?.walletBalance?.toFixed(2)}
          </div>
        </div>

        {merchant?.status !== "ACTIVE" ? (
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border-2 border-red-100 mb-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-red-500"></div>

            <h3 className="text-xl font-black text-slate-800 mb-2">
              Action Required: Activate Merchant
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              Enter the Shopify credentials to verify the store, unlock the
              dashboard, and start the 30-day billing cycle.
            </p>

            <div className="space-y-5">
              {/* 1. Category Dropdown */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Business Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="ECOMMERCE">E-Commerce</option>
                  <option value="RESTAURANT">Restaurant / Cloud Kitchen</option>
                </select>
              </div>
               {/* 2. Store URL Input */}
               <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                     Shopify Store URL
                  </label>
                  <input
                     type="text"
                     placeholder="https://yourstore.myshopify.com"
                     value={storeUrl}
                     onChange={(e) => setStoreUrl(e.target.value)}
                     className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-500"
                  />
                  </div>

              {/* 2. Shopify Token Input */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Shopify Admin Token
                </label>
                <input
                  type="text"
                  placeholder="shpat_..."
                  value={shopifyToken}
                  onChange={(e) => setShopifyToken(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* 3. Shopify Secret Input (For HMAC) */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Shopify Webhook Secret (HMAC)
                </label>
                <input
                  type="text"
                  placeholder="Enter Webhook Secret key..."
                  value={shopifySecret}
                  onChange={(e) => setShopifySecret(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* 4. Submit Button */}
              <button
                onClick={() =>
                  handleAction("activate", {
                    shopifyToken,
                    shopifySecret,
                    category,
                    storeUrl: merchant.storeUrl, // 👈 Store URL direct DB se ja raha hai
                  })
                }
                disabled={!shopifyToken || !shopifySecret || loading}
                className="w-full mt-4 bg-red-600 text-white p-4 rounded-2xl font-bold hover:bg-red-700 transition duration-300 disabled:opacity-50 flex justify-center items-center"
              >
                {loading ? "Verifying..." : "Verify & Activate Merchant"}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 1. Wallet Card */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
              <div className="flex items-center text-indigo-600 mb-6">
                <FaWallet className="text-2xl mr-3" />
                <h3 className="text-xl font-black text-slate-800">
                  Recharge Wallet
                </h3>
              </div>
              <input
                type="number"
                placeholder="Enter Amount (₹)"
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl mb-4 outline-none focus:ring-2 focus:ring-indigo-500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <button
                onClick={() => handleAction("add-credits", { amount })}
                className="w-full bg-slate-900 text-white p-4 rounded-2xl font-bold hover:bg-indigo-600 transition duration-300"
              >
                Add Balance Instantly
              </button>
            </div>

            {/* 2. Subscription Card */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
              <div className="flex items-center text-emerald-600 mb-6">
                <FaCalendarPlus className="text-2xl mr-3" />
                <h3 className="text-xl font-black text-slate-800">
                  Extend Access
                </h3>
              </div>
              <select
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl mb-4 outline-none focus:ring-2 focus:ring-emerald-500"
                value={days}
                onChange={(e) => setDays(e.target.value)}
              >
                <option value="30">30 Days (Standard)</option>
                <option value="90">90 Days (Quarterly)</option>
                <option value="365">365 Days (Yearly)</option>
              </select>
              <button
                onClick={() => handleAction("extend-subscription", { days })}
                className="w-full bg-slate-900 text-white p-4 rounded-2xl font-bold hover:bg-emerald-600 transition duration-300"
              >
                Extend Subscription
              </button>
            </div>
          </div>
        )}

        {/* 3. Operational Logic Section */}
        <div className="mt-8 bg-indigo-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
          <FaRocket className="absolute right-[-20px] bottom-[-20px] text-[15rem] text-white/5 rotate-[-15deg]" />
          <div className="relative z-10">
            <h3 className="text-2xl font-black mb-6 flex items-center">
              <FaShieldAlt className="mr-3 text-indigo-400" /> Operational
              Command
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-md">
                <h4 className="font-bold mb-2">Shopify Synchronization</h4>
                <p className="text-indigo-200 text-sm mb-6">
                  Fetch all previous customers, order history and phone numbers.
                </p>
                <button className="bg-white text-indigo-900 px-6 py-3 rounded-xl font-black text-xs hover:bg-indigo-50 transition">
                  RUN SYNC NOW
                </button>
              </div>
              <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-md">
                <h4 className="font-bold mb-2">Bulk Retargeting</h4>
                <p className="text-indigo-200 text-sm mb-6">
                  Launch a marketing campaign to all synced contacts with 15s
                  delay.
                </p>
                <button className="bg-indigo-500 text-white px-6 py-3 rounded-xl font-black text-xs hover:bg-indigo-400 transition">
                  OPEN CAMPAIGNER
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
