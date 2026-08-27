"use client";
import Link from "next/link";
import { useState } from "react";
import {
  FaShoppingCart,
  FaWhatsapp,
  FaChartLine,
  FaUsers,
  FaCheckCircle,
  FaStar,
  FaArrowRight,
  FaShieldAlt,
  FaBolt,
  FaGift,
  FaRegEnvelope,
  FaTimes,
  FaSync,
  FaRobot,
  FaCheck,
  FaPlay,
  FaArrowUp,
  FaStore,
} from "react-icons/fa";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

export default function Homepage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeTab, setActiveTab] = useState<"cart" | "retarget" | "festival">("cart");

  const faqs = [
    {
      q: "How does setup work?",
      a: "You sign up, enter your Shopify store URL, and our team connects your WhatsApp number and activates your account within a few hours via Google Meet. Zero technical knowledge required.",
    },
    {
      q: "Do I need Meta Business API approval?",
      a: "No! We handle all backend integrations and API setup on our end. You don't need to go through any tedious Meta verification process.",
    },
    {
      q: "What's the difference between Growth and Pro plans?",
      a: "Growth plan is tailored for stores sending up to 5,000 messages/month. Pro unlocks unlimited campaigns, AI Sales Agent, custom flow rules, and priority 1-on-1 support.",
    },
    {
      q: "Can I negotiate pricing for custom volumes?",
      a: "Yes! Reach out to us directly. We are flexible for early-stage and high-volume Shopify brands and can build a custom package tailored to your order volume.",
    },
    {
      q: "Is there any long-term contract or lock-in?",
      a: "No lock-in contracts. All plans are month-to-month. You can upgrade, downgrade, or cancel anytime with one click.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-900 font-sans selection:bg-emerald-500 selection:text-white relative overflow-x-hidden">
      
      {/* Soft Top Glow Gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gradient-to-b from-emerald-100/70 via-teal-50/40 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* ─── HERO SECTION ────────────────────────────────────────────── */}
      <section className="pt-12 pb-16 md:pt-20 md:pb-28 px-4 sm:px-6 max-w-7xl mx-auto relative">
        
        {/* Top Floating Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 text-emerald-800 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold shadow-xs hover:bg-emerald-100/60 transition cursor-default">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-emerald-600">#1 Revenue Engine</span>
            <span className="text-slate-400">•</span>
            <span>Shopify WhatsApp Marketing</span>
          </div>
        </div>

        {/* Headline & Subtitle */}
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.12] mb-6">
            Recover Lost Sales <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 bg-clip-text text-transparent">
              on WhatsApp Autopilot.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            78% of shoppers abandon carts. Turn lost checkout visitors into paid orders with <strong className="text-slate-900 font-semibold underline decoration-emerald-400 decoration-2">98% WhatsApp open rates</strong>.
          </p>

          {/* Call to Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/signup"
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-4 rounded-2xl text-base sm:text-lg transition-all duration-300 shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/40 hover:-translate-y-0.5 flex items-center justify-center gap-2 group"
            >
              Start Free — Get a Demo <FaArrowRight className="group-hover:translate-x-1 transition-transform text-sm" />
            </Link>
            <a
              href="#pricing"
              className="w-full sm:w-auto border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-8 py-4 rounded-2xl text-base sm:text-lg transition-all duration-300 shadow-xs flex items-center justify-center gap-2"
            >
              View Pricing
            </a>
          </div>

          {/* Micro Trust Pills */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-slate-500 font-medium">
            <div className="flex items-center gap-1.5"><FaCheck className="text-emerald-500" /> No Meta API Approval Needed</div>
            <div className="flex items-center gap-1.5"><FaCheck className="text-emerald-500" /> Managed Google Meet Setup</div>
            <div className="flex items-center gap-1.5"><FaCheck className="text-emerald-500" /> Cancel Anytime</div>
          </div>
        </div>

        {/* ─── LIVE INTERACTIVE PRODUCT MOCKUP ────────────────────────── */}
        <div className="mt-14 sm:mt-20 max-w-5xl mx-auto relative">
          
          {/* Animated Floating Recovered Toast (Top Right) */}
          <div className="hidden sm:flex absolute -top-6 -right-6 z-20 bg-white border border-emerald-100 p-3.5 rounded-2xl shadow-xl shadow-slate-200/60 items-center gap-3 animate-bounce">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 text-lg font-bold">
              ₹
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Cart Recovered Just Now</p>
              <p className="text-sm font-bold text-slate-900">+₹3,499 via WhatsApp</p>
            </div>
          </div>

          {/* Main Card */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-8 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
            
            {/* Window Controls */}
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
                <span className="text-xs font-mono text-slate-400 ml-2 hidden sm:inline">wa-auto-dashboard.shopify</span>
              </div>
              
              {/* Simulator Tabs */}
              <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
                {(["cart", "retarget", "festival"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition ${
                      activeTab === tab
                        ? "bg-white text-emerald-700 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {tab === "cart" ? "Cart Recovery" : tab === "retarget" ? "Retargeting" : "Festival Sale"}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated WhatsApp Interface */}
            <div className="grid md:grid-cols-12 gap-6 items-center">
              
              {/* Phone Chat UI */}
              <div className="md:col-span-7 bg-[#E5DDD5] rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-inner relative overflow-hidden">
                {/* Chat Header */}
                <div className="flex items-center justify-between pb-3 mb-4 bg-emerald-700 text-white p-3 -mx-4 -mt-4 rounded-t-2xl shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-emerald-600 font-bold text-sm shadow-xs">
                      <FaStore />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold flex items-center gap-1">
                        Your Shopify Store <span className="bg-emerald-500 text-[10px] px-1.5 py-0.5 rounded-md">Official</span>
                      </h4>
                      <p className="text-[10px] text-emerald-100">Online • Auto Response</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">15m ago</span>
                </div>

                {/* WhatsApp Chat Bubble */}
                <div className="bg-white rounded-2xl rounded-tl-xs p-4 text-xs sm:text-sm text-slate-800 shadow-md border border-slate-100 max-w-sm">
                  {activeTab === "cart" && (
                    <>
                      <p className="font-semibold text-slate-900 mb-1.5">Hey Rahul! 🛒 We held your cart items!</p>
                      <p className="text-slate-600 mb-3 text-xs">Your Urban Sneakers (Navy) are almost sold out. We saved them for you + added a special discount.</p>
                      
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-xl shadow-xs">👟</div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">Urban Sneakers (Navy)</p>
                          <p className="text-[11px] text-emerald-600 font-bold">₹2,499 <span className="line-through text-slate-400 text-[10px]">₹3,499</span></p>
                        </div>
                      </div>

                      <div className="text-center bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl cursor-pointer text-xs shadow-xs transition">
                        ⚡ Complete Purchase (10% OFF)
                      </div>
                    </>
                  )}
                  {activeTab === "retarget" && (
                    <>
                      <p className="font-semibold text-slate-900 mb-1.5">Hey Priya! ✨ Special VIP Offer</p>
                      <p className="text-slate-600 mb-3 text-xs">It’s been 30 days since your last order. Here’s an exclusive 20% discount code for your next purchase!</p>
                      <div className="text-center bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl cursor-pointer text-xs shadow-xs">
                        🎁 Claim VIP Offer
                      </div>
                    </>
                  )}
                  {activeTab === "festival" && (
                    <>
                      <p className="font-semibold text-slate-900 mb-1.5">🪔 Mega Diwali Sale is LIVE!</p>
                      <p className="text-slate-600 mb-3 text-xs">Flat 40% OFF site-wide for our WhatsApp subscribers. Early access ends tonight!</p>
                      <div className="text-center bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl cursor-pointer text-xs shadow-xs">
                        🛍️ Shop Flash Sale
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Sidebar Stats Widget */}
              <div className="md:col-span-5 space-y-4">
                <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Recovered Revenue (This Month)</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-black text-slate-900 tracking-tight">₹1,42,850</p>
                    <span className="text-emerald-600 text-xs font-bold flex items-center gap-0.5">
                      <FaArrowUp className="text-[10px]" /> 34.2%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">Recovered automatically via WhatsApp flows.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-emerald-50/60 border border-emerald-100 p-4 rounded-2xl">
                    <p className="text-[11px] font-semibold text-emerald-800">Open Rate</p>
                    <p className="text-2xl font-black text-emerald-600">98.4%</p>
                  </div>
                  <div className="bg-teal-50/60 border border-teal-100 p-4 rounded-2xl">
                    <p className="text-[11px] font-semibold text-teal-800">Recovery Rate</p>
                    <p className="text-2xl font-black text-teal-600">31.8%</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Floating Numbers Bar */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {[
            { val: "98%", label: "WhatsApp Open Rate", icon: <FaWhatsapp className="text-emerald-600" /> },
            { val: "30%+", label: "Avg Recovery Rate", icon: <FaShoppingCart className="text-emerald-600" /> },
            { val: "< 24 Hours", label: "Full Onboarding", icon: <FaBolt className="text-emerald-600" /> },
            { val: "₹0", label: "Setup Cost", icon: <FaShieldAlt className="text-emerald-600" /> },
          ].map((s, i) => (
            <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-5 text-center shadow-xs">
              <div className="flex justify-center text-lg mb-1">{s.icon}</div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">{s.val}</p>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── BEFORE VS AFTER COMPARISON ──────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 bg-white border-y border-slate-200/80">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-widest text-emerald-600 font-bold mb-2 block">The High-Converting Solution</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Stop Losing Money to Spam Emails</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Red Box: Current Problem */}
            <div className="bg-red-50/50 border border-red-200/80 rounded-3xl p-8 relative">
              <div className="w-10 h-10 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center text-red-600 font-bold mb-6">
                <FaTimes />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Traditional Email & SMS</h3>
              <p className="text-slate-500 text-sm mb-6">Channels that customers ignore or filter into spam.</p>

              <ul className="space-y-4 text-sm text-slate-700">
                <li className="flex items-start gap-3">
                  <span className="text-red-500 font-bold mt-0.5">✗</span>
                  <span>Emails get lost in Spam & Promotions tab (15-20% open rate)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 font-bold mt-0.5">✗</span>
                  <span>SMS links look like spam and get blocked</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 font-bold mt-0.5">✗</span>
                  <span>No two-way chat to clear customer doubts before buying</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 font-bold mt-0.5">✗</span>
                  <span>75%+ of abandoned carts are permanently lost</span>
                </li>
              </ul>
            </div>

            {/* Green Box: WA-Auto Solution */}
            <div className="bg-emerald-50/40 border border-emerald-200/90 rounded-3xl p-8 relative shadow-lg shadow-emerald-100/50">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold mb-6 shadow-xs">
                <FaCheck />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Automated WhatsApp Engine</h3>
              <p className="text-slate-600 text-sm mb-6">Instant messaging directly on the app your customers check 30+ times a day.</p>

              <ul className="space-y-4 text-sm text-slate-800 font-medium">
                <li className="flex items-start gap-3">
                  <FaCheckCircle className="text-emerald-600 mt-0.5 shrink-0" />
                  <span>98% open rates within 3 minutes of sending</span>
                </li>
                <li className="flex items-start gap-3">
                  <FaCheckCircle className="text-emerald-600 mt-0.5 shrink-0" />
                  <span>Direct 1-click checkout buttons inside WhatsApp chat</span>
                </li>
                <li className="flex items-start gap-3">
                  <FaCheckCircle className="text-emerald-600 mt-0.5 shrink-0" />
                  <span>Instant two-way conversation & automated support</span>
                </li>
                <li className="flex items-start gap-3">
                  <FaCheckCircle className="text-emerald-600 mt-0.5 shrink-0" />
                  <span>Recover 25%–35% of lost revenue on total autopilot</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS SECTION ───────────────────────────────────── */}
      <section id="howitworks" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-emerald-600 text-xs font-bold uppercase tracking-widest">Simple 3-Step Process</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 mt-2 mb-4">Live in Under 24 Hours</h2>
          <p className="text-slate-500 text-base sm:text-lg">You sign up, our team configures everything. No code or complex setup required.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              title: "Sign Up in 60s",
              desc: "Create your account with your store details and Shopify website link.",
              icon: <FaStar className="text-emerald-600 text-xl" />,
            },
            {
              step: "02",
              title: "1-on-1 Setup Call",
              desc: "We join a quick Google Meet, link your WhatsApp Business number, and configure your cart flows.",
              icon: <FaSync className="text-emerald-600 text-xl" />,
            },
            {
              step: "03",
              title: "Recover Revenue",
              desc: "Abandoned carts are recovered automatically. Send broadcast campaigns anytime from your dashboard.",
              icon: <FaChartLine className="text-emerald-600 text-xl" />,
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white border border-slate-200/80 p-8 rounded-3xl relative shadow-xs hover:shadow-xl hover:border-emerald-300 transition-all duration-300 group"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-center group-hover:scale-110 transition duration-300">
                  {item.icon}
                </div>
                <span className="text-4xl font-black text-slate-200 group-hover:text-emerald-600/30 transition duration-300">{item.step}</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── BENTO GRID FEATURES SECTION ────────────────────────────── */}
      <section id="features" className="py-24 px-4 sm:px-6 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-emerald-600 text-xs font-bold uppercase tracking-widest">Built For Growth</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 mt-2">Everything You Need To Maximize Store Sales</h2>
          </div>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Feature 1 (Large 2-col) */}
            <div className="md:col-span-2 bg-gradient-to-br from-slate-50 to-emerald-50/30 border border-slate-200 rounded-3xl p-8 hover:border-emerald-300 transition duration-300 relative overflow-hidden group shadow-xs">
              <div className="max-w-md mb-8">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 text-xl mb-4 shadow-xs">
                  <FaShoppingCart />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Abandoned Cart Recovery Engine</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Trigger multi-step WhatsApp sequences (15 mins, 2 hours, 24 hours). Recover 25%–35% of lost carts on complete autopilot.
                </p>
              </div>

              {/* Decorative Mock Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 max-w-sm ml-auto shadow-sm group-hover:shadow-md transition">
                <div className="flex items-center gap-2 mb-1.5 text-xs text-emerald-700 font-bold">
                  <FaBolt /> Sequence Triggered (15m post drop-off)
                </div>
                <p className="text-xs text-slate-600">"Hey Rahul! Your cart is reserved for 30 minutes. Order now & save 10%!"</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-50/60 border border-slate-200 rounded-3xl p-8 hover:border-emerald-300 transition duration-300 shadow-xs">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 text-xl mb-4 shadow-xs">
                <FaGift />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Festival & Flash Sale Blasts</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Send targeted WhatsApp campaigns to your customer list in one click for Diwali, Black Friday, and weekend sales.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-50/60 border border-slate-200 rounded-3xl p-8 hover:border-emerald-300 transition duration-300 shadow-xs">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 text-xl mb-4 shadow-xs">
                <FaSync />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Instant Shopify Sync</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Seamlessly pair your Shopify store. Automatic customer and order status syncing without manual CSV exports.
              </p>
            </div>

            {/* Feature 4 (Large 2-col) */}
            <div className="md:col-span-2 bg-gradient-to-br from-slate-50 to-teal-50/30 border border-slate-200 rounded-3xl p-8 hover:border-emerald-300 transition duration-300 relative overflow-hidden shadow-xs">
              <div className="grid md:grid-cols-2 gap-6 items-center">
                <div>
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 text-xl mb-4 shadow-xs">
                    <FaRobot />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">AI Sales & Support Agent</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Answer customer queries regarding sizing, delivery time, COD, and tracking automatically inside WhatsApp.
                  </p>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-2 text-xs shadow-xs">
                  <div className="bg-slate-100 p-2.5 rounded-xl text-slate-800">
                    <strong>Customer:</strong> Where is my order #4092?
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-emerald-900 ml-4 font-medium">
                    <strong>AI Bot:</strong> Hi! Your order is out for delivery today via BlueDart! Tracking: #BD9823
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── PRICING SECTION ─────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-emerald-600 text-xs font-bold uppercase tracking-widest">Transparent Subscription</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 mt-2 mb-4">Simple Plans, Zero Per-Message Fees</h2>
          <p className="text-slate-500 text-base sm:text-lg">Flat monthly rate. You keep 100% of the revenue you recover.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          
          {/* Growth Plan */}
          <div className="bg-white border border-slate-200 hover:border-slate-300 rounded-3xl p-8 flex flex-col justify-between shadow-xs transition">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wide">Growth</h3>
                <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-3 py-1 rounded-full">Up to 5k Msgs/mo</span>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl sm:text-5xl font-black text-slate-900">₹4,999</span>
                <span className="text-slate-500 text-sm">/ month</span>
              </div>
              <p className="text-slate-500 text-xs mb-8">Best for stores doing ₹1L–₹5L monthly revenue.</p>

              <ul className="space-y-3.5 mb-8">
                {[
                  "Abandoned Cart Recovery (Auto Flow)",
                  "Customer Retargeting Campaigns",
                  "Shopify Live Customer Sync",
                  "Analytics & ROI Dashboard",
                  "Up to 5,000 WhatsApp messages/mo",
                  "Full Setup by our team on Google Meet",
                  "Email & Chat Support",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-700 text-sm">
                    <FaCheckCircle className="text-emerald-600 text-xs shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href="/signup"
              className="w-full text-center bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition duration-300 block text-sm shadow-xs"
            >
              Get Started with Growth
            </Link>
          </div>

          {/* Pro Plan (Popular Highlight) */}
          <div className="bg-white border-2 border-emerald-500 rounded-3xl p-8 flex flex-col justify-between relative shadow-xl shadow-emerald-100">
            
            {/* Top Popular Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[11px] font-black uppercase tracking-wider px-4 py-1 rounded-full shadow-md">
              Most Popular
            </div>

            <div>
              <div className="flex justify-between items-center mb-4 mt-2">
                <h3 className="text-lg font-bold text-emerald-700 uppercase tracking-wide">Pro</h3>
                <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold px-3 py-1 rounded-full">Unlimited</span>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl sm:text-5xl font-black text-slate-900">₹6,999</span>
                <span className="text-slate-500 text-sm">/ month</span>
              </div>
              <p className="text-slate-500 text-xs mb-8">Best for stores doing ₹5L+ monthly revenue.</p>

              <ul className="space-y-3.5 mb-8">
                {[
                  "Everything in Growth Plan",
                  "Custom AI Sales & Support Agent",
                  "Unlimited WhatsApp Messages",
                  "Multi-Flow Control (15m, 2h, 24h)",
                  "Festival Campaign Templates",
                  "Priority 1-on-1 WhatsApp Support",
                  "Dedicated Account Manager",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-800 text-sm font-medium">
                    <FaCheckCircle className="text-emerald-600 text-xs shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href="/signup"
              className="w-full text-center bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-4 rounded-2xl transition duration-300 block text-sm shadow-md shadow-emerald-200"
            >
              Get Started with Pro
            </Link>
          </div>

        </div>

        {/* Custom Pricing Callout */}
        <div className="mt-12 bg-white border border-slate-200 rounded-2xl p-6 text-center max-w-2xl mx-auto shadow-xs">
          <p className="text-slate-600 text-sm">
            💬 <strong className="text-slate-900">Have specific store requirements or higher volume?</strong> We negotiate directly with early clients to fit your budget. Reach out to get a custom quote.
          </p>
        </div>
      </section>

      {/* ─── TESTIMONIALS SECTION ───────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 bg-white border-t border-slate-200/80">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-emerald-600 text-xs font-bold uppercase tracking-widest">Merchant Reviews</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">Loved By Active Shopify Stores</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Priya S.",
                store: "FashionHub",
                quote: "Recovered ₹80,000 in the first month alone. The WhatsApp cart reminder timing works like magic.",
                stars: 5,
                metric: "₹80k Recovered",
              },
              {
                name: "Rahul M.",
                store: "UrbanKicks",
                quote: "Setup was finished in one Google Meet. Our festival Diwali campaign got a 42% reply rate!",
                stars: 5,
                metric: "42% Reply Rate",
              },
              {
                name: "Sneha K.",
                store: "OrganicNest",
                quote: "We were bleeding sales on abandoned carts every single day. Now it just recovers revenue on autopilot.",
                stars: 5,
                metric: "30% Recovery Rate",
              },
            ].map((t, i) => (
              <div key={i} className="bg-slate-50 border border-slate-200/80 rounded-3xl p-8 flex flex-col justify-between shadow-xs">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-1">
                      {Array(t.stars).fill(0).map((_, j) => (
                        <FaStar key={j} className="text-amber-400 text-xs" />
                      ))}
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/60 px-2.5 py-1 rounded-full border border-emerald-200">
                      {t.metric}
                    </span>
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed mb-6">"{t.quote}"</p>
                </div>
                <div className="pt-4 border-t border-slate-200">
                  <p className="font-bold text-slate-900 text-sm">{t.name}</p>
                  <p className="text-slate-500 text-xs">{t.store}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ SECTION ────────────────────────────────────────────── */}
      <section id="faq" className="py-24 px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-emerald-600 text-xs font-bold uppercase tracking-widest">Got Questions?</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs transition"
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full px-6 py-5 text-left flex justify-between items-center hover:bg-slate-50 transition text-sm sm:text-base font-semibold text-slate-900"
              >
                <span>{faq.q}</span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition ${
                  openFaq === i ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                }`}>
                  {openFaq === i ? <FiChevronUp /> : <FiChevronDown />}
                </div>
              </button>
              {openFaq === i && (
                <div className="px-6 pb-5 text-slate-600 text-xs sm:text-sm leading-relaxed border-t border-slate-100 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ─── FINAL CTA SECTION ──────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-8 sm:p-16 text-center shadow-2xl shadow-emerald-200 text-white relative overflow-hidden">
          <h2 className="text-3xl sm:text-5xl font-black mb-4 tracking-tight leading-tight">
            Start Recovering Lost Revenue Today.
          </h2>
          <p className="text-emerald-100 text-base sm:text-lg max-w-2xl mx-auto mb-8 font-medium">
            Join growing Shopify stores recovering revenue on WhatsApp. Sign up in 60 seconds and let our team handle setup.
          </p>

          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-100 text-emerald-950 font-extrabold px-10 py-5 rounded-2xl text-lg transition-all duration-300 shadow-xl hover:scale-[1.02]"
          >
            Get Started Free <FaArrowRight />
          </Link>

          <div className="mt-8 flex flex-wrap justify-center gap-6 text-xs sm:text-sm font-semibold text-emerald-100">
            <div className="flex items-center gap-1.5"><FaShieldAlt /> No Lock-in Contracts</div>
            <div className="flex items-center gap-1.5"><FaCheckCircle /> Google Meet Setup Included</div>
            <div className="flex items-center gap-1.5"><FaWhatsapp /> WhatsApp Support</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-slate-200/80 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} WA-Auto. Built for high-converting Shopify stores.
      </footer>

    </div>
  );
}