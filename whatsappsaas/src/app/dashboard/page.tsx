"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  FaChartLine,
  FaWhatsapp,
  FaShoppingCart,
  FaBullhorn,
  FaCog,
  FaSignOutAlt,
  FaCheckCircle,
  FaHourglassHalf,
  FaSpinner,
  FaEye,
  FaMousePointer,
  FaMoneyBillWave,
} from "react-icons/fa";

// 🌟 REUSABLE STAT CARD COMPONENT
const StatCard = ({ title, value, icon, subtext, colorClass }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
        <div className={`text-3xl font-bold ${colorClass}`}>{value}</div>
      </div>
      <div
        className={`p-3 rounded-lg bg-gray-50 ${colorClass.replace("text-", "text-opacity-20 ")}`}
      >
        {icon}
      </div>
    </div>
    <p className="text-gray-400 text-xs mt-2">{subtext}</p>
  </div>
);

export default function DashboardPage() {
  const router = useRouter();
  const [accountStatus, setAccountStatus] = useState<string>("PENDING_ADMIN");
  const [merchantData, setMerchantData] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    const initDashboard = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        // Parallel fetching (15 LPA Skill: Fast loading)
        const [profileRes, statsRes] = await Promise.all([
          axios.get(`${API_URL}/api/merchant/me`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_URL}/api/merchant/stats`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const merchant = profileRes.data.merchant;
        if (!merchant.whatsappConnected) {
          router.push("/onboarding");
          return;
        }

        setMerchantData(merchant);
        setAccountStatus(merchant.status);
        setStats(statsRes.data);
      } catch (error) {
        console.error("Dashboard Load Error", error);
        localStorage.removeItem("token");
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    initDashboard();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const getDaysLeft = (expiryDate: any) => {
    if (!expiryDate) return 0;
    const diff = new Date(expiryDate).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <FaSpinner className="text-4xl text-teal-700 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden relative">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <FaWhatsapp className="text-3xl text-teal-700 mr-2" />
          <span className="text-xl font-bold text-gray-800">WA-Auto</span>
        </div>

        <div className="p-4">
          <div
            className={`p-3 rounded-lg text-xs font-bold flex items-center justify-between ${getDaysLeft(merchantData?.subscriptionExpiry) < 5 ? "bg-red-50 text-red-700" : "bg-orange-50 text-orange-700"}`}
          >
            <span>⏳ Subscription</span>
            <span>
              {getDaysLeft(merchantData?.subscriptionExpiry)} Days Left
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          <ul className="space-y-1">
            <li className="px-6 py-3 text-teal-700 bg-teal-50 border-r-4 border-teal-700 font-medium flex items-center">
              <FaChartLine className="mr-3" /> Overview
            </li>
            <li className="px-6 py-3 text-gray-600 hover:bg-gray-50 flex items-center cursor-pointer">
              <FaShoppingCart className="mr-3" /> Abandoned Carts
            </li>
            <li className="px-6 py-3 text-gray-600 hover:bg-gray-50 flex items-center cursor-pointer">
              <FaBullhorn className="mr-3" /> Campaigns
            </li>
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center text-gray-600 hover:text-red-600 text-sm font-medium w-full"
          >
            <FaSignOutAlt className="mr-3 text-lg" /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome, {merchantData?.brandName}
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500 font-medium">Wallet:</span>
            <span className="px-4 py-1 bg-green-100 text-green-800 font-bold rounded-full">
              ₹{stats?.walletBalance?.toFixed(2)}
            </span>
          </div>
        </header>

        {/* Dashboard Content */}
        <div
          className={`flex-1 overflow-y-auto p-8 transition-all duration-500 ${accountStatus !== "ACTIVE" ? "blur-md pointer-events-none" : ""}`}
        >
          {/* REAL STATS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Recovered Revenue"
              value={`₹${stats?.recoveredRevenue || "0"}`}
              icon={<FaMoneyBillWave />}
              subtext="Sales saved from WhatsApp"
              colorClass="text-green-600"
            />
            <StatCard
              title="Messages Sent"
              value={stats?.totalSent || "0"}
              icon={<FaBullhorn />}
              subtext={`Cost: ₹${(stats?.totalSent * 0.8).toFixed(2)}`}
              colorClass="text-blue-600"
            />
            <StatCard
              title="Open Rate"
              value={`${stats?.openRate || "0.0"}%`}
              icon={<FaEye />}
              subtext="Messages read by customers"
              colorClass="text-purple-600"
            />
            <StatCard
              title="Link Clicks"
              value={stats?.totalClicked || "0"}
              icon={<FaMousePointer />}
              subtext={`${stats?.clickRate || "0.0"}% Click-through rate`}
              colorClass="text-orange-600"
            />
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96 flex flex-col items-center justify-center text-gray-400">
            [ Revenue Trend Chart Rendering Area ]
          </div>
        </div>

        {/* MODAL (Waiting for Admin) */}
        {accountStatus !== "ACTIVE" && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-30 backdrop-blur-sm">
            <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl p-8 text-center">
              <FaCheckCircle className="mx-auto h-16 w-16 text-green-500 mb-6" />
              <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
                WhatsApp Linked!
              </h2>
              <p className="text-gray-600 mb-8">
                Hey <b>{merchantData?.brandName}</b>, we are securely
                integrating your Shopify store and training your AI bot. You'll
                be live in 1-2 hours!
              </p>
              <div className="bg-blue-50 p-4 rounded-lg text-left text-sm text-blue-700 space-y-2">
                <p>✅ WhatsApp Verification Successful</p>
                <p className="flex items-center">
                  <FaSpinner className="animate-spin mr-2" /> Connecting Shopify
                  Webhooks...
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
