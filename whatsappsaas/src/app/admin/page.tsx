"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  FaCheckCircle,
  FaLock,
  FaUserSecret,
  FaWhatsapp,
  FaStore,
  FaSpinner,
  FaWallet,
  FaChartBar,
  FaPlusCircle,
  FaUsers,
  FaCalendarAlt,
} from "react-icons/fa";

const API_BASE_URL = "http://localhost:5000/api";

export default function AdminPanel() {
  const [adminKeyInput, setAdminKeyInput] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [merchants, setMerchants] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Modal States
  const [selectedMerchant, setSelectedMerchant] = useState<any>(null);
  const [modalType, setModalType] = useState<"ACTIVATE" | "WALLET" | null>(
    null,
  );

  // Form States
  const [amount, setAmount] = useState("");
  const [shopifyToken, setShopifyToken] = useState("");
  const [category, setCategory] = useState("ECOMMERCE");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const savedKey = sessionStorage.getItem("adminKey");
    if (savedKey) {
      verifyAndFetch(savedKey);
    }
  }, []);

  const verifyAndFetch = async (key: string) => {
    setLoading(true);
    try {
      const headers = { "x-admin-api-key": key };
      const [mRes, sRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/admin/merchants`, { headers }),
        axios.get(`${API_BASE_URL}/admin/stats`, { headers }),
      ]);
      setMerchants(mRes.data.merchants);
      setStats(sRes.data);
      setIsAuthenticated(true);
      sessionStorage.setItem("adminKey", key);
    } catch (err) {
      alert("Invalid Admin Key!");
      sessionStorage.removeItem("adminKey");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    const key = sessionStorage.getItem("adminKey");
    const headers = { "x-admin-api-key": key };

    try {
      if (modalType === "ACTIVATE") {
        await axios.post(
          `${API_BASE_URL}/admin/activate`,
          {
            merchantId: selectedMerchant.id,
            category,
            shopifyToken,
            storeUrl: selectedMerchant.storeUrl,
          },
          { headers },
        );
      } else {
        await axios.post(
          `${API_BASE_URL}/admin/add-credits`,
          {
            merchantId: selectedMerchant.id,
            amount,
          },
          { headers },
        );
      }

      alert("Success!");
      closeModal();
      verifyAndFetch(key || "");
    } catch (err) {
      alert("Action failed!");
    } finally {
      setProcessing(false);
    }
  };

  const closeModal = () => {
    setSelectedMerchant(null);
    setModalType(null);
    setAmount("");
    setShopifyToken("");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            verifyAndFetch(adminKeyInput);
          }}
          className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center"
        >
          <FaUserSecret className="text-5xl text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-6">Admin Login</h1>
          <input
            type="password"
            value={adminKeyInput}
            onChange={(e) => setAdminKeyInput(e.target.value)}
            className="w-full p-3 border rounded-lg mb-4"
            placeholder="Enter Admin Secret Key"
          />
          <button className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700">
            Access Dashboard
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* REVENUE STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
            <div className="flex items-center text-gray-500 text-sm mb-2">
              <FaChartBar className="mr-2" /> Total Earnings
            </div>
            <div className="text-3xl font-bold text-gray-800">
              ₹{stats?.totalEarnings?.toLocaleString()}
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
            <div className="flex items-center text-gray-500 text-sm mb-2">
              <FaUsers className="mr-2" /> Active Clients
            </div>
            <div className="text-3xl font-bold text-gray-800">
              {stats?.totalActiveClients}
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500">
            <div className="flex items-center text-gray-500 text-sm mb-2">
              <FaStore className="mr-2" /> Total Registered
            </div>
            <div className="text-3xl font-bold text-gray-800">
              {stats?.totalRegistered}
            </div>
          </div>
        </div>

        {/* MERCHANT TABLE */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-bold text-gray-600">Merchant</th>
                <th className="p-4 font-bold text-gray-600">Wallet</th>
                <th className="p-4 font-bold text-gray-600">Category</th>
                <th className="p-4 font-bold text-gray-600">Status</th>
                <th className="p-4 font-bold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {merchants.map((m) => (
                <tr key={m.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <div className="font-bold">{m.brandName}</div>
                    <div className="text-xs text-gray-400">{m.email}</div>
                  </td>
                  <td className="p-4">
                    <div
                      className={`font-bold ${m.walletBalance < 50 ? "text-red-500" : "text-green-600"}`}
                    >
                      ₹{m.walletBalance.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      Total Paid: ₹{m.totalPaidAmount}
                    </div>
                  </td>
                  <td className="p-4 text-sm uppercase">{m.category}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded text-[10px] font-bold ${m.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="p-4 flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedMerchant(m);
                        setModalType("WALLET");
                      }}
                      className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                      title="Add Credits"
                    >
                      <FaWallet />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedMerchant(m);
                        setModalType("SUBSCRIPTION");
                      }}
                      className="p-2 bg-orange-100 text-orange-600 rounded"
                    >
                      <FaCalendarAlt />
                    </button>
                    {m.status !== "ACTIVE" && (
                      <button
                        onClick={() => {
                          setSelectedMerchant(m);
                          setModalType("ACTIVATE");
                        }}
                        className="p-2 bg-green-50 text-green-600 rounded hover:bg-green-100"
                        title="Activate"
                      >
                        <FaCheckCircle />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL SYSTEM */}
      {selectedMerchant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-bold mb-2">
              {modalType === "ACTIVATE" ? "Activate Merchant" : "Add Credits"}
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Managing:{" "}
              <span className="font-bold">{selectedMerchant.brandName}</span>
            </p>

            <form onSubmit={handleAction} className="space-y-4">
              {modalType === "ACTIVATE" ? (
                <>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-3 border rounded-lg"
                  >
                    <option value="ECOMMERCE">E-Commerce</option>
                    <option value="RESTAURANT">Restaurant</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Shopify Admin Token (shpat_...)"
                    value={shopifyToken}
                    onChange={(e) => setShopifyToken(e.target.value)}
                    className="w-full p-3 border rounded-lg"
                    required
                  />
                </>
              ) : (
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400 font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    placeholder="Enter Amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-3 pl-8 border rounded-lg"
                    required
                  />
                </div>
              )}

              <div className="flex space-x-3 mt-8">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-3 border rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  disabled={processing}
                  className="flex-1 py-3 bg-teal-700 text-white rounded-lg font-bold disabled:opacity-50"
                >
                  {processing ? "Processing..." : "Confirm Action"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
