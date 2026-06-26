"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { 
  FaChartLine, FaWhatsapp, FaShoppingCart, FaSignOutAlt, 
  FaSpinner, FaEye, FaMousePointer, FaMoneyBillWave, FaClock 
} from "react-icons/fa";

const API_URL = "http://localhost:5000/api";

const StatCard = ({ title, value, icon, subtext, colorClass }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
        <div className={`text-3xl font-bold ${colorClass}`}>{value}</div>
      </div>
      <div className={`p-3 rounded-lg bg-gray-50 ${colorClass}`}>{icon}</div>
    </div>
    <p className="text-gray-400 text-xs mt-2">{subtext}</p>
  </div>
);

export default function MerchantDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return router.push("/login");

        const [profile, stats] = await Promise.all([
          axios.get(`${API_URL}/merchant/me`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/merchant/stats`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        setData({ ...profile.data.merchant, ...stats.data });
      } catch (err) {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center"><FaSpinner className="animate-spin text-4xl text-teal-700" /></div>;

  const daysLeft = data?.subscriptionExpiry ? Math.ceil((new Date(data.subscriptionExpiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar (Read Only) */}
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="p-6 border-b text-2xl font-bold text-teal-700 flex items-center"><FaWhatsapp className="mr-2"/> WA-Auto</div>
        <nav className="flex-1 p-4 space-y-2">
          <div className="flex items-center p-3 bg-teal-50 text-teal-700 rounded-lg font-bold"><FaChartLine className="mr-3"/> Overview</div>
          <div className="p-3 text-gray-400 flex items-center cursor-not-allowed opacity-50"><FaShoppingCart className="mr-3"/> Automations (Admin Managed)</div>
        </nav>
        <div className="p-4 border-t">
            <div className={`p-3 rounded-lg text-xs font-bold mb-4 ${daysLeft < 5 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                ⏳ {daysLeft > 0 ? `${daysLeft} Days Subscription Left` : 'Subscription Expired'}
            </div>
            <button onClick={() => { localStorage.clear(); router.push("/login"); }} className="flex items-center text-red-600 font-bold w-full p-2"><FaSignOutAlt className="mr-2"/> Logout</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center justify-between px-8">
          <h1 className="text-xl font-bold">Welcome, {data?.brandName}</h1>
          <div className="flex items-center bg-green-50 px-4 py-2 rounded-full border border-green-200">
            <span className="text-sm text-green-700 font-bold">Wallet: ₹{data?.walletBalance?.toFixed(2)}</span>
          </div>
        </header>

        <div className={`p-8 overflow-y-auto ${data?.status !== 'ACTIVE' ? 'blur-md pointer-events-none' : ''}`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard title="Recovered Revenue" value={`₹${data?.recoveredRevenue || 0}`} icon={<FaMoneyBillWave />} subtext="Direct sales from WhatsApp" colorClass="text-green-600" />
            <StatCard title="Total Sent" value={data?.totalSent || 0} icon={<FaWhatsapp />} subtext={`Cost: ₹${((data?.totalSent || 0) * 0.8).toFixed(2)}`} colorClass="text-blue-600" />
            <StatCard title="Open Rate" value={`${data?.openRate || 0}%`} icon={<FaEye />} subtext="Customers who read" colorClass="text-purple-600" />
            <StatCard title="Link Clicks" value={data?.totalClicked || 0} icon={<FaMousePointer />} subtext={`${data?.clickRate || 0}% CTR`} colorClass="text-orange-600" />
          </div>
          
          <div className="bg-white p-8 rounded-xl border border-dashed border-gray-300 h-64 flex items-center justify-center text-gray-400 font-medium italic">
            "Your marketing campaigns are being optimized by our team. Live charts will appear here as data grows."
          </div>
        </div>

        {data?.status !== 'ACTIVE' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-50 backdrop-blur-sm">
            <div className="bg-white p-10 rounded-2xl shadow-2xl text-center max-w-md">
              <FaClock className="text-5xl text-orange-500 mx-auto mb-4 animate-pulse" />
              <h2 className="text-2xl font-bold mb-2">Setting Up Your Store</h2>
              <p className="text-gray-500">Our engineers are connecting your Shopify store and training your AI. You'll be live within 2 hours!</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}