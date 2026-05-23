"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { FaEdit, FaCheckCircle, FaTimesCircle, FaSpinner, FaBullhorn, FaShoppingCart, FaBoxOpen } from "react-icons/fa";

// Pre-defined flow types for the UI
const FLOW_TYPES = [
  {
    type: "ABANDONED_CART_1",
    title: "Abandoned Cart (Reminder 1)",
    description: "First reminder when a customer leaves items in their cart.",
    icon: <FaShoppingCart className="text-orange-500" />,
    defaultDelay: 30, // 30 mins
    defaultTemplate: "Hi {{name}}, you left some amazing items in your cart! Complete your purchase here: {{link}}"
  },
  {
    type: "ABANDONED_CART_2",
    title: "Abandoned Cart (Reminder 2 - Discount)",
    description: "Second reminder sent with a discount code to close the sale.",
    icon: <FaBullhorn className="text-red-500" />,
    defaultDelay: 1440, // 24 hours (1440 mins)
    defaultTemplate: "Hey {{name}}, we saved your cart! Use code COMEBACK10 for 10% off today only: {{link}}"
  },
  {
    type: "ORDER_CONFIRM",
    title: "Order Confirmation",
    description: "Sent instantly when a customer successfully places an order.",
    icon: <FaBoxOpen className="text-green-500" />,
    defaultDelay: 0, // Instant
    defaultTemplate: "Hi {{name}}, your order is confirmed! Thank you for shopping with us."
  }
];

export default function FlowsManager() {
  const [flows, setFlows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [editingFlow, setEditingFlow] = useState<any>(null);
  const [templateStr, setTemplateStr] = useState("");
  const [delayMins, setDelayMins] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchFlows();
  }, []);

  const fetchFlows = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/flows", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFlows(res.data.flows);
    } catch (error) {
      console.error("Error fetching flows", error);
    } finally {
      setLoading(false);
    }
  };

  // Find DB flow data for a specific type
  const getFlowData = (type: string) => {
    return flows.find(f => f.type === type) || null;
  };

  // Handle ON/OFF Toggle
  const handleToggle = async (flowData: any, predefinedFlow: any) => {
    try {
      const token = localStorage.getItem("token");
      const newStatus = !flowData?.isActive;

      if (!flowData) {
        // Agar DB me exist nahi karta toh pehle Create karo (with default values)
        await axios.post("http://localhost:5000/api/flows", {
          type: predefinedFlow.type,
          template: predefinedFlow.defaultTemplate,
          delayMinutes: predefinedFlow.defaultDelay,
          isActive: true
        }, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        // Agar exist karta hai toh bas Toggle karo
        await axios.put(`http://localhost:5000/api/flows/${flowData.id}/toggle`, {
          isActive: newStatus
        }, { headers: { Authorization: `Bearer ${token}` } });
      }
      
      fetchFlows(); // Refresh UI
    } catch (error) {
      alert("Error toggling flow");
    }
  };

  // Open Edit Modal
  const openEditModal = (predefinedFlow: any, existingData: any) => {
    setEditingFlow(predefinedFlow);
    setTemplateStr(existingData?.template || predefinedFlow.defaultTemplate);
    setDelayMins(existingData?.delayMinutes || predefinedFlow.defaultDelay);
  };

  // Save Flow Changes
  const handleSaveFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5000/api/flows", {
        type: editingFlow.type,
        template: templateStr,
        delayMinutes: delayMins,
        isActive: true // Save karte hi default ON kar do
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setEditingFlow(null);
      fetchFlows();
    } catch (error) {
      alert("Error saving flow");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8"><FaSpinner className="animate-spin text-3xl text-teal-700" /></div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Automated Flows</h2>
        <p className="text-gray-500">Enable and customize your automated WhatsApp messages.</p>
      </div>

      <div className="space-y-6">
        {FLOW_TYPES.map((ft) => {
          const dbFlow = getFlowData(ft.type);
          const isActive = dbFlow?.isActive || false;

          return (
            <div key={ft.type} className={`bg-white p-6 rounded-xl shadow-sm border-l-4 flex items-center justify-between ${isActive ? 'border-teal-500' : 'border-gray-300'}`}>
              
              <div className="flex items-start space-x-4">
                <div className="text-3xl mt-1">{ft.icon}</div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 flex items-center">
                    {ft.title}
                    {isActive && <span className="ml-3 text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full uppercase">Active</span>}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{ft.description}</p>
                  
                  {/* Current Settings Preview */}
                  <div className="mt-3 bg-gray-50 p-3 rounded text-sm text-gray-600 border border-gray-100">
                    <span className="font-bold text-gray-700">Delay:</span> {dbFlow?.delayMinutes ?? ft.defaultDelay} minutes
                    <br/>
                    <span className="font-bold text-gray-700">Message:</span> <span className="italic">"{dbFlow?.template ?? ft.defaultTemplate}"</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end space-y-3">
                {/* Custom Toggle Switch */}
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" className="sr-only" checked={isActive} onChange={() => handleToggle(dbFlow, ft)} />
                    <div className={`block w-14 h-8 rounded-full transition-colors ${isActive ? 'bg-teal-500' : 'bg-gray-300'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${isActive ? 'transform translate-x-6' : ''}`}></div>
                  </div>
                </label>

                <button 
                  onClick={() => openEditModal(ft, dbFlow)}
                  className="flex items-center text-sm font-bold text-teal-700 hover:text-teal-900 bg-teal-50 px-3 py-2 rounded"
                >
                  <FaEdit className="mr-2" /> Edit Flow
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* EDIT MODAL */}
      {editingFlow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-2">Edit {editingFlow.title}</h3>
            <p className="text-sm text-gray-500 mb-6">Customize the delay and message template.</p>

            <form onSubmit={handleSaveFlow} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Delay (in minutes)</label>
                <input 
                  type="number" 
                  min="0"
                  required
                  value={delayMins}
                  onChange={(e) => setDelayMins(parseInt(e.target.value))}
                  className="w-full p-3 border rounded-lg focus:ring-teal-500"
                />
                <p className="text-xs text-gray-400 mt-1">Example: 30 for half an hour, 1440 for 1 day.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Message Template</label>
                <textarea 
                  rows={4}
                  required
                  value={templateStr}
                  onChange={(e) => setTemplateStr(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-teal-500"
                />
                <div className="mt-2 text-xs text-gray-600 bg-blue-50 p-2 rounded border border-blue-100">
                  <span className="font-bold text-blue-800">Supported Variables:</span><br/>
                  <code className="bg-white px-1">{'{{name}}'}</code> = Customer Name<br/>
                  <code className="bg-white px-1">{'{{link}}'}</code> = Checkout URL
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t">
                <button type="button" onClick={() => setEditingFlow(null)} className="flex-1 py-3 bg-gray-100 font-bold rounded-lg text-gray-600 hover:bg-gray-200">
                  Cancel
                </button>
                <button disabled={saving} type="submit" className="flex-1 py-3 bg-teal-700 font-bold rounded-lg text-white hover:bg-teal-800 disabled:opacity-50">
                  {saving ? "Saving..." : "Save & Enable"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}