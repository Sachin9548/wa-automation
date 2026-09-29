"use client";
import { useState } from "react";

const SIGNUP_URL = "https://www.wautomation.shop/signup";
const WHATSAPP_URL = "https://wa.me/919421095835";

export default function Homepage() {
  const [activeScenario, setActiveScenario] = useState<
    "cart" | "ig" | "cod" | "ai"
  >("cart");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [gmv, setGmv] = useState(1_000_000);
  const [aov, setAov] = useState(2_500);
  const [recoveredTotal, setRecoveredTotal] = useState(482_640);
  const [saleNotice, setSaleNotice] = useState("");
  const recovered = Math.round(gmv * 0.196);
  const recoveredOrders = Math.round(recovered / aov);

  const scenarios = {
    cart: {
      store: "Urban Kicks (Shopify Store)",
      status: "1-Tap Recovery Bot Active",
      avatar: "👟",
      deckTitle: "Cart Recovery (1-Tap Checkout)",
      customer:
        "Hey Rahul! You left Air Zoom Boost (UK 9) in your bag. Extra 10% applied!",
      action: "Confirm 1-Click Order (COD)",
      amount: 3499,
      notice: "1-Tap COD order placed! #WA-Recovered",
    },
    ig: {
      store: "Urban Kicks (Instagram)",
      status: "Comment-to-DM Engine",
      avatar: "📸",
      deckTitle: "Instagram Comment to Sale",
      customer:
        "Hey Priya! The sneakers are ₹3,499. Your exclusive REEL15 code is applied!",
      action: "Buy Now with ₹2,974 Discount",
      amount: 2974,
      notice: "Instagram DM lead converted!",
    },
    cod: {
      store: "Urban Kicks (RTO Killer)",
      status: "COD to Prepaid Converter",
      avatar: "🛡️",
      deckTitle: "RTO Killer (Prepaid Converted)",
      customer:
        "Pay online via UPI now for ₹150 instant cashback and express dispatch!",
      action: "Pay ₹3,349 via UPI (Save ₹150)",
      amount: 3349,
      notice: "COD converted to prepaid UPI!",
    },
    ai: {
      store: "Urban Kicks (AI Concierge)",
      status: "24/7 AI Sales Rep",
      avatar: "🤖",
      deckTitle: "AI Size Recommendation Closed",
      customer:
        "Runs true to size! UK 9 will fit perfectly. Includes a free 7-day doorstep size exchange.",
      action: "Place UK 9 Order Now",
      amount: 3499,
      notice: "AI resolved the question and placed the order!",
    },
  };
  const scenario = scenarios[activeScenario];

  return (
    <div className="bg-app-950 bg-grid-mesh antialiased selection:bg-brand-wa selection:text-black">
      {/* ================= AMBIENT BACKGROUND GLOWS ================= */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[350px] sm:w-[650px] lg:w-[1000px] h-[350px] sm:h-[550px] bg-brand-wa/15 rounded-full blur-[120px] sm:blur-[180px] animate-pulse-glow"></div>
        <div className="absolute top-[30%] -right-[20%] sm:-right-[15%] w-[300px] sm:w-[650px] h-[300px] sm:h-[650px] bg-brand-purple/10 rounded-full blur-[140px] sm:blur-[190px]"></div>
        <div className="absolute top-[65%] -left-[20%] sm:-left-[15%] w-[300px] sm:w-[650px] h-[300px] sm:h-[650px] bg-brand-pink/10 rounded-full blur-[140px] sm:blur-[190px]"></div>
      </div>

      <div className="relative z-10">
        {/* ================= HERO SECTION ================= */}
        <section className="pt-28 sm:pt-36 lg:pt-48 pb-12 sm:pb-20 lg:pb-28 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Trust Pill */}
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-app-900/90 border border-brand-wa/30 shadow-xl backdrop-blur-md text-[11px] sm:text-xs">
                <span className="w-2 h-2 rounded-full bg-brand-wa animate-ping"></span>
                <span className="font-bold text-gray-200">
                  Zero Tech Work &bull; Done-For-You Onboarding
                </span>
              </div>
            </div>

            {/* Main Headline */}
            <div className="text-center max-w-5xl mx-auto">
              <h1 className="text-3xl xs:text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.12]">
                Turn Abandoned Carts Into <br className="hidden sm:inline" />
                <span className="text-gradient-emerald">
                  Instant WhatsApp Sales.
                </span>
              </h1>
              <p className="mt-4 sm:mt-6 text-sm sm:text-lg lg:text-xl text-gray-300 max-w-3xl mx-auto font-normal leading-relaxed">
                Stop losing 78% of your shoppers to email spam. We automate
                WhatsApp recovery messages, convert Instagram comments into
                orders, and eliminate risky COD losses — on complete autopilot.
              </p>
            </div>

            {/* Hero Actions */}
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
              <a
                href={SIGNUP_URL}
                className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider bg-brand-wa text-black shadow-2xl shadow-brand-wa/30 hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 text-center"
              >
                <span>Start Now</span>
                <i data-lucide="zap" className="w-4 h-4 fill-black"></i>
              </a>
              <a
                href="#simulator"
                className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-bold text-xs sm:text-sm bg-app-900 hover:bg-app-850 text-white border border-white/10 hover:border-brand-wa/40 transition-all flex items-center justify-center gap-2 text-center"
              >
                <i
                  data-lucide="play"
                  className="w-4 h-4 text-brand-wa fill-brand-wa"
                ></i>
                <span className="font-bold bg-brand-wa text-black px-2 py-1 rounded">Try Live Simulator</span>
              </a>
            </div>

            {/* Trust Features Ribbon */}
            <div className="mt-10 sm:mt-12 pt-6 sm:pt-8 border-t border-white/[0.08] grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-center text-[11px] sm:text-xs font-bold text-gray-300 max-w-4xl mx-auto">
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                <i
                  data-lucide="shield-check"
                  className="w-4 h-4 text-brand-wa shrink-0"
                ></i>
                <span>Meta Cloud API</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                <i
                  data-lucide="shopping-bag"
                  className="w-4 h-4 text-brand-wa shrink-0"
                ></i>
                <span>1-Tap COD Checkout</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                <i
                  data-lucide="clock"
                  className="w-4 h-4 text-brand-wa shrink-0"
                ></i>
                <span>Safe Sending (Zero Bans)</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                <i
                  data-lucide="tag"
                  className="w-4 h-4 text-brand-wa shrink-0"
                ></i>
                <span>#WA-Recovered Tag</span>
              </div>
            </div>

            {/* ================= HERO VISUAL SIMULATOR ================= */}
            <div
              id="simulator"
              className="mt-12 sm:mt-16 lg:mt-24 max-w-6xl mx-auto"
            >
              <div className="pro-card p-3.5 sm:p-6 lg:p-8 border border-white/15 shadow-2xl shadow-black">
                {/* Tabs Topbar (Horizontal swipeable on mobile) */}
                <div className="pb-4 sm:pb-6 mb-4 sm:mb-8 border-b border-white/[0.08]">
                  <div className="mb-3 sm:mb-4">
                    <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-brand-wa">
                      Interactive Live Simulation
                    </p>
                    <h3 className="text-sm sm:text-lg font-bold text-white">
                      Tap a scenario to see how money gets recovered in
                      real-time
                    </h3>
                  </div>

                  {/* 4 Revenue Streams Selector (Mobile Scrollable) */}
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-2 px-2 sm:mx-0 sm:px-0 text-xs font-bold">
                    <button
                      onClick={() => setActiveScenario("cart")}
                      id="h-btn-cart"
                      className={`hero-tab whitespace-nowrap px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${activeScenario === "cart" ? "bg-brand-wa text-black shadow" : "text-gray-400 hover:text-white bg-app-950 sm:bg-transparent"}`}
                    >
                      <i
                        data-lucide="shopping-cart"
                        className="w-3.5 h-3.5"
                      ></i>
                      <span>1. Cart Recovery</span>
                    </button>
                    <button
                      onClick={() => setActiveScenario("ig")}
                      id="h-btn-ig"
                      className={`hero-tab whitespace-nowrap px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${activeScenario === "ig" ? "bg-brand-wa text-black shadow" : "text-gray-400 hover:text-white bg-app-950 sm:bg-transparent"}`}
                    >
                      <i data-lucide="instagram" className="w-3.5 h-3.5"></i>
                      <span>2. IG Comment ➔ DM</span>
                    </button>
                    <button
                      onClick={() => setActiveScenario("cod")}
                      id="h-btn-cod"
                      className={`hero-tab whitespace-nowrap px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${activeScenario === "cod" ? "bg-brand-wa text-black shadow" : "text-gray-400 hover:text-white bg-app-950 sm:bg-transparent"}`}
                    >
                      <i data-lucide="shield-alert" className="w-3.5 h-3.5"></i>
                      <span>3. COD ➔ Prepaid</span>
                    </button>
                    <button
                      onClick={() => setActiveScenario("ai")}
                      id="h-btn-ai"
                      className={`hero-tab whitespace-nowrap px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${activeScenario === "ai" ? "bg-brand-wa text-black shadow" : "text-gray-400 hover:text-white bg-app-950 sm:bg-transparent"}`}
                    >
                      <i data-lucide="sparkles" className="w-3.5 h-3.5"></i>
                      <span>4. 24/7 AI Rep</span>
                    </button>
                  </div>
                </div>

                {/* Simulator Main Area */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
                  {/* Left Phone UI */}
                  <div className="lg:col-span-6 flex justify-center">
                    <div className="w-full max-w-[340px] sm:max-w-[350px] bg-[#090E13] rounded-[32px] sm:rounded-[40px] p-3 sm:p-3.5 border-2 sm:border-4 border-app-800 shadow-2xl relative font-sans">
                      {/* Top Speaker */}
                      <div className="w-20 sm:w-24 h-3 sm:h-3.5 bg-app-950 rounded-full mx-auto mb-2.5 sm:mb-3"></div>

                      {/* WhatsApp Header */}
                      <div className="bg-[#1F2C34] -mx-3 -mt-1 sm:-mx-3.5 px-3 py-2.5 sm:px-3.5 sm:py-3 flex items-center gap-2.5 sm:gap-3 border-b border-white/5">
                        <div
                          id="sim-avatar-hero"
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-brand-wa/20 border border-brand-wa/30 flex items-center justify-center text-sm sm:text-base shrink-0"
                        >
                          {scenario.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            id="sim-store-hero"
                            className="text-xs font-bold text-white truncate"
                          >
                            {scenario.store}
                          </p>
                          <p
                            id="sim-status-hero"
                            className="text-[9px] sm:text-[10px] text-brand-wa flex items-center gap-1 font-semibold truncate"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-wa animate-pulse shrink-0"></span>{" "}
                            {scenario.status}
                          </p>
                        </div>
                        <i
                          data-lucide="more-vertical"
                          className="w-4 h-4 text-gray-400 shrink-0"
                        ></i>
                      </div>

                      {/* <!-- WhatsApp Chat Message Feed --> */}
                      <div
                        id="sim-chat-hero"
                        className="py-3 sm:py-4 space-y-2.5 sm:space-y-3 min-h-[340px] sm:min-h-[380px] flex flex-col justify-end text-xs"
                      >
                        <div className="bg-[#005C4B] text-white p-3 rounded-xl rounded-tr-none shadow-md max-w-[95%] ml-auto border border-emerald-500/20 space-y-2">
                          <div className="flex items-center justify-between text-[10px] text-emerald-200 font-mono">
                            <span className="font-bold">
                              WhatsApp automation
                            </span>
                            <span>Just now</span>
                          </div>
                          <p className="text-[11px] leading-relaxed">
                            {scenario.customer}
                          </p>
                          <button
                            onClick={() => {
                              setRecoveredTotal(
                                (total) => total + scenario.amount,
                              );
                              setSaleNotice(scenario.notice);
                            }}
                            className="w-full py-2 bg-brand-wa text-black font-black text-[11px] rounded-lg shadow cursor-pointer"
                          >
                            {scenario.action}
                          </button>
                          {saleNotice && (
                            <p
                              role="status"
                              className="text-center text-[10px] text-emerald-200"
                            >
                              {saleNotice}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* <!-- WhatsApp Footer Bar --> */}
                      <div className="bg-[#1F2C34] -mx-3 -mb-3 sm:-mx-3.5 sm:-mb-3.5 p-2 sm:p-2.5 flex items-center gap-2 border-t border-white/5">
                        <div className="flex-1 bg-[#2A3942] rounded-full px-3 py-1.5 text-[10px] sm:text-[11px] text-gray-400 truncate">
                          Tap button above to test...
                        </div>
                        <div className="w-7 h-7 rounded-full bg-brand-wa flex items-center justify-center text-black shrink-0">
                          <i
                            data-lucide="send"
                            className="w-3.5 h-3.5 fill-black"
                          ></i>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* <!-- Right: Performance & Attributed Revenue Deck --> */}
                  <div className="lg:col-span-6 space-y-3.5 sm:space-y-5">
                    <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-app-900 border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-brand-wa animate-pulse shrink-0"></span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">
                            Live Pipeline:
                            <span
                              id="sim-deck-title"
                              className="text-brand-wa font-mono"
                            >
                              {scenario.deckTitle}
                            </span>
                          </p>
                          <p className="text-[10px] sm:text-[11px] text-gray-400 truncate">
                            Orders tagged in Shopify Admin on tap
                          </p>
                        </div>
                      </div>
                      <span className="text-[9px] sm:text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-brand-wa/10 text-brand-wa border border-brand-wa/20 shrink-0">
                        Auto-Tagged
                      </span>
                    </div>

                    {/* <!-- Recovery Amount Card --> */}
                    <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-app-900 via-app-850 to-app-900 border border-brand-wa/30 relative">
                      <p className="text-[10px] sm:text-xs uppercase font-bold tracking-widest text-gray-400">
                        Total Money Recovered This Month
                      </p>
                      <div className="flex flex-wrap items-baseline gap-2 sm:gap-3 mt-1">
                        <h3
                          id="hero-live-counter"
                          className="text-3xl sm:text-4xl lg:text-5xl font-black text-white"
                        >
                          ₹{recoveredTotal.toLocaleString("en-IN")}
                        </h3>
                        <span className="text-[11px] sm:text-xs font-bold text-brand-wa px-2 py-0.5 rounded bg-brand-wa/10">
                          +32.4% GMV
                        </span>
                      </div>

                      {/* <!-- Funnel Grid --> */}
                      <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-white/10 grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 sm:p-2.5 bg-app-950 rounded-xl border border-white/5">
                          <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase font-medium truncate">
                            Open Rate
                          </p>
                          <p className="text-sm sm:text-base font-bold text-brand-wa mt-0.5">
                            98.2%
                          </p>
                        </div>
                        <div className="p-2 sm:p-2.5 bg-app-950 rounded-xl border border-white/5">
                          <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase font-medium truncate">
                            Orders
                          </p>
                          <p className="text-sm sm:text-base font-bold text-white mt-0.5">
                            1,348
                          </p>
                        </div>
                        <div className="p-2 sm:p-2.5 bg-app-950 rounded-xl border border-white/5">
                          <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase font-medium truncate">
                            RTO Cut
                          </p>
                          <p className="text-sm sm:text-base font-bold text-emerald-400 mt-0.5">
                            -42%
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* <!-- Merchant Assurance Checkmarks --> */}
                    <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-app-900/60 border border-white/5 space-y-2 text-xs text-gray-300">
                      <div className="flex items-start gap-2">
                        <i
                          data-lucide="check"
                          className="w-4 h-4 text-brand-wa shrink-0 mt-0.5"
                        ></i>
                        <span>
                          Orders appear automatically in Shopify marked{" "}
                          <strong className="text-white">#WA-Recovered</strong>.
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <i
                          data-lucide="check"
                          className="w-4 h-4 text-brand-wa shrink-0 mt-0.5"
                        ></i>
                        <span>
                          Zero manual effort: Reminders, discounts, and queries
                          handled 24/7.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* <!-- ================= STATS TICKER ================= --> */}
        <section className="border-y border-white/[0.08] bg-app-900/50 py-8 sm:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 text-center">
              <div>
                <p className="text-2xl sm:text-4xl lg:text-5xl font-black text-white">
                  98%
                </p>
                <p className="text-[11px] sm:text-xs text-gray-400 mt-1 font-semibold">
                  WhatsApp Open Rate
                </p>
              </div>
              <div>
                <p className="text-2xl sm:text-4xl lg:text-5xl font-black text-brand-wa">
                  30%–35%
                </p>
                <p className="text-[11px] sm:text-xs text-gray-400 mt-1 font-semibold">
                  Average Cart Recovery
                </p>
              </div>
              <div>
                <p className="text-2xl sm:text-4xl lg:text-5xl font-black text-white">
                  ₹2.4+ Cr
                </p>
                <p className="text-[11px] sm:text-xs text-gray-400 mt-1 font-semibold">
                  Revenue Recovered
                </p>
              </div>
              <div>
                <p className="text-2xl sm:text-4xl lg:text-5xl font-black text-purple-400">
                  24/7
                </p>
                <p className="text-[11px] sm:text-xs text-gray-400 mt-1 font-semibold">
                  AI Automated Sales Rep
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* <!-- ================= SECTION: 4 REVENUE LEAKS WE FIX ================= --> */}
        <section
          id="leaks"
          className="py-14 sm:py-20 lg:py-24 border-b border-white/[0.08] relative"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
              <span className="text-xs uppercase font-bold tracking-widest text-brand-wa">
                Where You Are Losing Money
              </span>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white mt-2.5 sm:mt-3">
                The 4 Costly Revenue Leaks In Your Shopify Store
              </h2>
              <p className="mt-3 text-gray-400 text-xs sm:text-sm sm:text-base">
                You spend heavy ad budgets on Meta and Google. Here is how
                WA-Auto prevents those visitors from leaving without paying.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              {/* <!-- Leak 1: Abandoned Carts --> */}
              <div className="pro-card p-5 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-black text-lg sm:text-xl">
                      🛒
                    </div>
                    <span className="px-2.5 sm:px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-[10px] sm:text-xs font-bold border border-rose-500/20">
                      78% Shoppers Leave
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-2xl font-bold text-white mb-2">
                    1-Tap WhatsApp Cart Recovery
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                    When a customer adds to cart and disappears, standard email
                    recovery gets lost in spam. WA-Auto automatically fires a
                    personalized WhatsApp message with a
                    <strong>1-Tap Zero-Click Checkout button</strong> within
                    15–30 minutes.
                  </p>
                </div>
                <div className="mt-6 pt-4 sm:pt-6 border-t border-white/10 flex items-center justify-between text-xs font-bold">
                  <span className="text-gray-400 text-[11px] sm:text-xs">
                    Result for your store:
                  </span>
                  <strong className="text-brand-wa text-[11px] sm:text-xs">
                    +25% to 35% Carts Saved
                  </strong>
                </div>
              </div>

              {/* <!-- Leak 2: Instagram Comments --> */}
              <div className="pro-card p-5 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-pink-500/10 text-pink-400 flex items-center justify-center font-black text-lg sm:text-xl">
                      📸
                    </div>
                    <span className="px-2.5 sm:px-3 py-1 rounded-full bg-pink-500/10 text-pink-400 text-[10px] sm:text-xs font-bold border border-pink-500/20">
                      Organic Traffic Goldmine
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-2xl font-bold text-white mb-2">
                    Instagram Comments ➔ Instant Orders
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                    Shoppers comment &quot;Price?&quot;, &quot;Details?&quot;,
                    or &quot;Link?&quot; on your Reels. Manual replies take
                    hours. WA-Auto replies publicly in 3 seconds (boosting
                    algorithm reach) and drops the direct buying link in their
                    DM.
                  </p>
                </div>
                <div className="mt-6 pt-4 sm:pt-6 border-t border-white/10 flex items-center justify-between text-xs font-bold">
                  <span className="text-gray-400 text-[11px] sm:text-xs">
                    Result for your store:
                  </span>
                  <strong className="text-brand-wa text-[11px] sm:text-xs">
                    Turns Comments Into Paid Sales
                  </strong>
                </div>
              </div>

              {/* <!-- Leak 3: COD RTO Loss --> */}
              <div className="pro-card p-5 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-500/10 text-brand-wa flex items-center justify-center font-black text-lg sm:text-xl">
                      🛡️
                    </div>
                    <span className="px-2.5 sm:px-3 py-1 rounded-full bg-brand-wa/10 text-brand-wa text-[10px] sm:text-xs font-bold border border-brand-wa/20">
                      RTO Killer
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-2xl font-bold text-white mb-2">
                    COD ➔ 100% Prepaid UPI Converter
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                    Cash on Delivery orders suffer 25-40% RTO losses in courier
                    return fees. WA-Auto sends an automated offer:{" "}
                    <em>
                      &quot;Pay online now via UPI to get ₹150 OFF &amp;
                      Priority Shipping.&quot;
                    </em>
                  </p>
                </div>
                <div className="mt-6 pt-4 sm:pt-6 border-t border-white/10 flex items-center justify-between text-xs font-bold">
                  <span className="text-gray-400 text-[11px] sm:text-xs">
                    Result for your store:
                  </span>
                  <strong className="text-brand-wa text-[11px] sm:text-xs">
                    40% COD Converted to Prepaid
                  </strong>
                </div>
              </div>

              {/* <!-- Leak 4: Dormant Customers --> */}
              <div className="pro-card p-5 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-black text-lg sm:text-xl">
                      🎁
                    </div>
                    <span className="px-2.5 sm:px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-[10px] sm:text-xs font-bold border border-amber-500/20">
                      Zero Ad-Cost
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-2xl font-bold text-white mb-2">
                    1-Click VIP Festival & Sale Blasts
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                    Diwali or Flash Sale? Blast your entire Shopify past buyer
                    list with personalized Multi-Product WhatsApp catalogues and
                    1-click buy buttons without spending ₹1 on Meta Ads.
                  </p>
                </div>
                <div className="mt-6 pt-4 sm:pt-6 border-t border-white/10 flex items-center justify-between text-xs font-bold">
                  <span className="text-gray-400 text-[11px] sm:text-xs">
                    Result for your store:
                  </span>
                  <strong className="text-brand-wa text-[11px] sm:text-xs">
                    Surge in Repeat Orders
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* <!-- ================= DEEP FEATURE SHOWCASE 1: ZERO-CLICK CHECKOUT ================= --> */}
        <section
          id="deep-features"
          className="py-14 sm:py-20 lg:py-24 border-b border-white/[0.08] relative"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <div className="lg:col-span-6 space-y-4 sm:space-y-6">
                <span className="text-xs uppercase font-bold tracking-widest text-brand-wa">
                  Zero Friction Buying
                </span>
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
                  1-Tap Zero-Click WhatsApp Checkout Direct To Shopify
                </h2>
                <p className="text-gray-300 text-xs sm:text-base leading-relaxed">
                  Customers hate slow loading links and re-entering addresses.
                  With WA-Auto, the customer confirms their order with{" "}
                  <strong className="text-white">
                    a single tap inside WhatsApp
                  </strong>
                  .
                </p>

                <div className="space-y-2.5 sm:space-y-3 pt-2">
                  <div className="flex items-start gap-3 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-app-900 border border-white/5">
                    <i
                      data-lucide="check-circle"
                      className="w-4 h-4 sm:w-5 sm:h-5 text-brand-wa shrink-0 mt-0.5"
                    ></i>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white">
                        Direct Shopify Order Creation
                      </h4>
                      <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">
                        The order is placed immediately in your Shopify Orders
                        list without opening a browser.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-app-900 border border-white/5">
                    <i
                      data-lucide="tag"
                      className="w-4 h-4 sm:w-5 sm:h-5 text-brand-wa shrink-0 mt-0.5"
                    ></i>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white">
                        Auto-Tagged #WA-Recovered
                      </h4>
                      <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">
                        Easily filter and calculate exact ROI inside your
                        Shopify Admin dashboard.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* <!-- Visual Demonstration Card --> */}
              <div className="lg:col-span-6">
                <div className="pro-card p-4 sm:p-8 bg-gradient-to-br from-app-900 via-app-850 to-app-950 border-brand-wa/30">
                  <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-white/10 text-[11px] sm:text-xs font-mono">
                    <span className="text-brand-wa flex items-center gap-1.5 font-bold">
                      <span className="w-2 h-2 rounded-full bg-brand-wa"></span>{" "}
                      Live Shopify Flow
                    </span>
                    <span className="text-gray-400">Order #10941 Created</span>
                  </div>

                  <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
                    <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#005C4B] text-white space-y-2 sm:space-y-3">
                      <p className="text-[11px] sm:text-xs font-bold text-emerald-200">
                        🛒 Cart Reserved for Rahul Sharma
                      </p>
                      <p className="text-[11px] sm:text-xs">
                        Hey Rahul! 👋 You left
                        <strong className="text-amber-300">
                          Oxford Shoes (UK 9)
                        </strong>{" "}
                        in your cart. Stock reserved for 15 mins!
                      </p>
                      <div className="p-2 sm:p-3 bg-black/30 rounded-xl flex items-center justify-between text-[11px] sm:text-xs">
                        <span>Total: ₹4,299.00</span>
                        <span className="text-brand-wa font-bold">
                          COD Available
                        </span>
                      </div>
                      <div className="py-2 sm:py-2.5 bg-brand-wa text-black font-black text-[11px] sm:text-xs text-center rounded-xl shadow">
                        ✓ Confirm 1-Click COD Order
                      </div>
                    </div>

                    <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-app-950 border border-white/10 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] sm:text-[10px] text-gray-400 uppercase font-bold block">
                          Shopify Admin Status
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-white">
                          Order Confirmed &bull; ₹4,299
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-brand-wa/10 text-brand-wa border border-brand-wa/30 text-[10px] sm:text-xs font-mono font-bold">
                        #WA-Recovered
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* <!-- ================= DEEP FEATURE SHOWCASE 2: 24/7 AI SALES REP ================= --> */}
        <section className="py-14 sm:py-20 lg:py-24 border-b border-white/[0.08] bg-app-900/40 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <div className="lg:col-span-6 order-2 lg:order-1">
                <div className="pro-card p-4 sm:p-8 bg-gradient-to-br from-purple-950/20 via-app-900 to-app-950 border-purple-500/30">
                  <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-white/10 text-[11px] sm:text-xs font-mono">
                    <span className="text-purple-300 flex items-center gap-1.5 font-bold">
                      <i data-lucide="bot" className="w-4 h-4"></i> 24/7 AI
                      Sales Concierge
                    </span>
                    <span className="text-gray-400">&lt;1 sec reply</span>
                  </div>

                  <div className="mt-4 sm:mt-6 space-y-3 text-xs">
                    <div className="p-3 rounded-xl sm:rounded-2xl bg-[#202C33] text-gray-200 max-w-[85%] text-[11px] sm:text-xs">
                      &quot;I wear Large in Zara shirts. Should I order L or XL
                      for this oversized fit?&quot;
                    </div>

                    <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#005C4B] text-white ml-auto max-w-[92%] space-y-2 border border-purple-500/30 text-[11px] sm:text-xs">
                      <div className="text-[10px] text-purple-200 font-bold">
                        ⚡ AI Size Recommendation
                      </div>
                      <p>
                        Our shirts have an intentional relaxed drop-shoulder
                        cut! If you wear Large in Zara, our
                        <strong>Size L</strong> will give you the exact look.
                        Free 7-day doorstep size exchanges!
                      </p>
                      <button className="w-full py-1.5 sm:py-2 bg-brand-wa text-black font-extrabold text-[11px] sm:text-xs rounded-lg shadow">
                        Add Size L to Order (Flat 10% OFF)
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 space-y-4 sm:space-y-6 order-1 lg:order-2">
                <span className="text-xs uppercase font-bold tracking-widest text-purple-400">
                  Autonomous Customer Conversion
                </span>
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
                  A 24/7 AI Sales Rep That Closes Deals While You Sleep
                </h2>
                <p className="text-gray-300 text-xs sm:text-base leading-relaxed">
                  When shoppers receive a recovery message, they ask questions
                  about size, fabric quality, returns, or shipping. Our AI
                  answers contextually in under a second.
                </p>

                <div className="space-y-2.5 sm:space-y-3 pt-2">
                  <div className="flex items-start gap-3 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-app-900 border border-white/5">
                    <i
                      data-lucide="book-open"
                      className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 shrink-0 mt-0.5"
                    ></i>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white">
                        Trained on Store Knowledge Base
                      </h4>
                      <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">
                        Understands your sizing charts, delivery timelines, and
                        return policies.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-app-900 border border-white/5">
                    <i
                      data-lucide="history"
                      className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 shrink-0 mt-0.5"
                    ></i>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white">
                        5-Message Context Memory
                      </h4>
                      <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">
                        Remembers previous context so the customer never repeats
                        themselves.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* <!-- ================= UNIFIED OMNICHANNEL INBOX SHOWCASE ================= --> */}
        <section
          id="inbox"
          className="py-14 sm:py-20 lg:py-24 border-b border-white/[0.08] bg-app-900/30 relative"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
              <span className="text-xs uppercase font-bold tracking-widest text-brand-wa">
                Single Control Center
              </span>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white mt-2.5 sm:mt-3">
                Unified 2-Way Omnichannel Inbox
              </h2>
              <p className="mt-3 text-gray-400 text-xs sm:text-base">
                Manage all your WhatsApp chats, Instagram DMs, and comments from
                one unified screen.
              </p>
            </div>

            <div className="pro-card p-4 sm:p-8 lg:p-10 border border-white/10 bg-app-900">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
                {/* Left Channel Selector */}
                <div className="lg:col-span-4 space-y-2.5 sm:space-y-3 lg:border-r border-white/5 lg:pr-6">
                  <p className="text-[11px] sm:text-xs uppercase font-mono font-bold text-gray-400 mb-1">
                    Live Channels
                  </p>

                  <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-brand-wa/10 border border-brand-wa/30 flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-wa text-black font-bold flex items-center justify-center text-xs">
                        WA
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-white">
                          WhatsApp Inbox
                        </h5>
                        <p className="text-[10px] text-brand-wa">
                          12 Active Chats
                        </p>
                      </div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-brand-wa animate-pulse"></span>
                  </div>

                  <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-app-950 border border-white/5 flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-pink-500/20 text-pink-400 font-bold flex items-center justify-center text-xs">
                        IG
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-white">
                          Instagram DMs
                        </h5>
                        <p className="text-[10px] text-gray-400">
                          8 Unread Leads
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5 space-y-1.5 text-[10px] sm:text-[11px] font-mono text-gray-400">
                    <div className="flex items-center gap-2">
                      <i
                        data-lucide="clock"
                        className="w-3.5 h-3.5 text-brand-wa shrink-0"
                      ></i>
                      <span>24-Hour Meta Window Guard</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <i
                        data-lucide="slash"
                        className="w-3.5 h-3.5 text-brand-wa shrink-0"
                      ></i>
                      <span>STOP Keyword Opt-Out Protection</span>
                    </div>
                  </div>
                </div>

                {/* <!-- Middle Conversation Window --> */}
                <div className="lg:col-span-5 space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between pb-2.5 border-b border-white/5 text-xs">
                    <div>
                      <h4 className="font-bold text-white text-xs sm:text-sm">
                        Amit Verma
                      </h4>
                      <p className="text-[10px] text-gray-400">
                        +91 98765 43210 &bull; WhatsApp
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-brand-wa/10 text-brand-wa text-[10px] font-bold">
                      Cart: ₹5,499
                    </span>
                  </div>

                  <div className="space-y-2.5 min-h-[180px] sm:min-h-[220px] text-[11px] sm:text-xs">
                    <div className="p-3 bg-app-950 rounded-xl max-w-[85%] text-gray-300">
                      &quot;Hi, do you deliver in Mumbai by Thursday for a
                      wedding?&quot;
                    </div>
                    <div className="p-3 bg-[#005C4B] rounded-xl max-w-[90%] ml-auto text-white">
                      &quot;Yes Amit! Mumbai metro delivery takes 48 hours.
                      Orders placed today deliver by Wednesday evening! 🚀&quot;
                    </div>
                  </div>

                  <div className="p-1.5 sm:p-2 bg-app-950 rounded-xl border border-white/5 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Type quick reply..."
                      className="flex-1 bg-transparent px-2.5 py-1 outline-none text-white text-xs min-w-0"
                    />
                    <button className="px-3.5 py-1.5 bg-brand-wa text-black font-bold rounded-lg text-xs shrink-0">
                      Send
                    </button>
                  </div>
                </div>

                {/* Right Customer Profile & Orders */}
                <div className="lg:col-span-3 space-y-3 lg:border-l border-white/5 lg:pl-6 text-xs">
                  <p className="text-[11px] sm:text-xs uppercase font-mono font-bold text-gray-400">
                    Shopify Profile
                  </p>

                  <div className="p-3 bg-app-950 rounded-xl space-y-1">
                    <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase">
                      Lifetime Spend
                    </p>
                    <p className="text-sm sm:text-base font-black text-white">
                      ₹14,890
                    </p>
                    <p className="text-[10px] text-brand-wa font-bold">
                      3 Completed Orders
                    </p>
                  </div>

                  <div className="space-y-1 text-gray-300 text-[10px] sm:text-[11px]">
                    <p>
                      <strong>Tags:</strong>{" "}
                      <span className="text-brand-wa font-mono">
                        VIP, WA-Recovered
                      </span>
                    </p>
                    <p>
                      <strong>City:</strong> Mumbai, MH
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* <!-- ================= SAFE SENDING & NUMBER REPUTATION ================= --> */}
        <section className="py-14 sm:py-20 lg:py-24 border-b border-white/[0.08] relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
              <span className="text-xs uppercase font-bold tracking-widest text-brand-wa">
                Enterprise Sender Protection
              </span>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white mt-2.5 sm:mt-3">
                Built To Send Safely. Zero Number Ban Risk.
              </h2>
              <p className="mt-3 text-gray-400 text-xs sm:text-base">
                We use strict humanized delays and sending windows so Meta views
                your store as a 100% verified, trusted business sender.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="pro-card p-4 sm:p-6 flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-brand-wa/10 text-brand-wa flex items-center justify-center mb-3 sm:mb-4">
                    <i
                      data-lucide="timer"
                      className="w-4 h-4 sm:w-5 sm:h-5"
                    ></i>
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-white mb-1">
                    15–30s Human Delay
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Random natural delays mimic real human staff rather than
                    spammy bursts.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-brand-wa mt-3 block">
                  Humanized Sending
                </span>
              </div>

              <div className="pro-card p-4 sm:p-6 flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3 sm:mb-4">
                    <i data-lucide="sun" className="w-4 h-4 sm:w-5 sm:h-5"></i>
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-white mb-1">
                    7 AM – 12 AM IST Window
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    No customer is disturbed at 2 AM. Late checkouts are safely
                    queued for morning.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-blue-400 mt-3 block">
                  Polite Timing
                </span>
              </div>

              <div className="pro-card p-4 sm:p-6 flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-3 sm:mb-4">
                    <i
                      data-lucide="user-x"
                      className="w-4 h-4 sm:w-5 sm:h-5"
                    ></i>
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-white mb-1">
                    Invalid Number Cleaner
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Auto-filters fake numbers so you never waste messages on
                    dead contacts.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-rose-400 mt-3 block">
                  Auto-Cleaner
                </span>
              </div>

              <div className="pro-card p-4 sm:p-6 flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3 sm:mb-4">
                    <i
                      data-lucide="shield-alert"
                      className="w-4 h-4 sm:w-5 sm:h-5"
                    ></i>
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-white mb-1">
                    Instant STOP Cache
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Replies with &quot;STOP&quot; are instantly blacklisted to
                    safeguard sender reputation.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-purple-400 mt-3 block">
                  100% Meta Compliant
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* <!-- ================= INTERACTIVE D2C REVENUE CALCULATOR ================= --> */}
        <section
          id="calculator"
          className="py-14 sm:py-20 lg:py-24 border-b border-white/[0.08] bg-app-900/40 relative"
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
              <span className="text-xs uppercase font-bold tracking-widest text-brand-wa">
                Revenue Estimator
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white mt-2">
                How Much Revenue Are You Leaving Behind?
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 mt-2">
                Drag the sliders to see what WA-Auto can realistically add to
                your monthly bank balance.
              </p>
            </div>

            <div className="pro-card p-4 sm:p-8 lg:p-12 border border-brand-wa/40">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-center">
                {/* Controls */}
                <div className="lg:col-span-7 space-y-5 sm:space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs sm:text-sm font-bold text-gray-300">
                        Monthly Shopify Sales
                      </label>
                      <span
                        id="calc-gmv-label"
                        className="font-mono text-base sm:text-xl font-extrabold text-brand-wa"
                      >
                        ₹{gmv.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <input
                      type="range"
                      id="calc-gmv-slider"
                      min="100000"
                      max="5000000"
                      step="50000"
                      value={gmv}
                      onChange={(event) => setGmv(Number(event.target.value))}
                      className="w-full h-2.5 bg-app-700 rounded-lg appearance-none cursor-pointer accent-brand-wa"
                    />
                    <div className="flex justify-between text-[10px] sm:text-[11px] text-gray-400 font-mono mt-1">
                      <span>₹1 Lakh</span>
                      <span>₹25 Lakhs</span>
                      <span>₹50 Lakhs</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs sm:text-sm font-bold text-gray-300">
                        Average Order Value (AOV)
                      </label>
                      <span
                        id="calc-aov-label"
                        className="font-mono text-sm sm:text-lg font-bold text-white"
                      >
                        ₹{aov.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <input
                      type="range"
                      id="calc-aov-slider"
                      min="500"
                      max="10000"
                      step="250"
                      value={aov}
                      onChange={(event) => setAov(Number(event.target.value))}
                      className="w-full h-2.5 bg-app-700 rounded-lg appearance-none cursor-pointer accent-brand-wa"
                    />
                  </div>

                  <div className="p-3 sm:p-4 bg-app-950 rounded-xl sm:rounded-2xl border border-white/5 text-[11px] sm:text-xs text-gray-400 space-y-1">
                    <p>✓ Calculated based on standard 70% cart abandonment.</p>
                    <p>
                      ✓ Realistic benchmark: 28% to 32% recovery through
                      WhatsApp 1-tap checkout.
                    </p>
                  </div>
                </div>

                {/* <!-- Results Card --> */}
                <div className="lg:col-span-5 p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-brand-wa/20 via-app-900 to-black border-2 border-brand-wa text-center shadow-2xl">
                  <span className="text-[10px] sm:text-xs uppercase tracking-widest text-brand-wa font-bold">
                    Net Monthly Recovery
                  </span>
                  <div
                    id="calc-recovered-val"
                    className="text-3xl sm:text-4xl lg:text-5xl font-black text-white my-3 sm:my-4 tracking-tight"
                  >
                    ₹{recovered.toLocaleString("en-IN")}
                  </div>
                  <p className="text-xs text-gray-300 mb-4 sm:mb-6 leading-relaxed">
                    Adds approx{" "}
                    <strong
                      id="calc-orders-val"
                      className="text-brand-wa font-bold"
                    >
                      {recoveredOrders}
                    </strong>{" "}
                    recovered orders every month directly to your Shopify store.
                  </p>
                  <a
                    href="#pricing"
                    className="block w-full py-3.5 sm:py-4 rounded-xl bg-brand-wa hover:bg-emerald-400 text-black font-extrabold text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-brand-wa/20 transition-all"
                  >
                    Recover This Cash Now
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* <!-- ================= 100% DONE FOR YOU PROCESS ================= --> */}
        <section id="how-it-works" className="py-14 sm:py-20 lg:py-24 border-b border-white/[0.08] relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
              <span className="text-xs uppercase font-bold tracking-widest text-brand-wa">
                Zero Technical Burden
              </span>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white mt-2.5 sm:mt-3">
                100% Done-For-You Setup. You Don&apos;t Lift A Finger.
              </h2>
              <p className="mt-3 text-gray-400 text-xs sm:text-base">
                No code to write, no complicated dashboard to configure. Our
                team builds and activates everything over one quick Google Meet.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              <div className="pro-card p-5 sm:p-8 rounded-2xl sm:rounded-3xl relative">
                <span className="text-4xl sm:text-6xl font-black text-white/5 absolute top-3 sm:top-4 right-5 sm:right-6">
                  01
                </span>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-brand-wa text-black font-extrabold text-base sm:text-lg flex items-center justify-center mb-4 sm:mb-6">
                  1
                </div>
                <h4 className="text-base sm:text-xl font-bold text-white mb-1.5 sm:mb-2">
                  20-Minute Google Meet
                </h4>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                  You jump on a call with our growth engineer. We connect your
                  Shopify store and link your official WhatsApp Business number.
                </p>
              </div>

              <div className="pro-card p-5 sm:p-8 rounded-2xl sm:rounded-3xl relative border-brand-wa/40 bg-app-900">
                <span className="text-4xl sm:text-6xl font-black text-brand-wa/10 absolute top-3 sm:top-4 right-5 sm:right-6">
                  02
                </span>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-brand-wa text-black font-extrabold text-base sm:text-lg flex items-center justify-center mb-4 sm:mb-6">
                  2
                </div>
                <h4 className="text-base sm:text-xl font-bold text-white mb-1.5 sm:mb-2">
                  We Train AI & Activate Flows
                </h4>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                  Our team sets up your cart reminder rules, trains the 24/7 AI
                  Sales Rep on your catalog, and configures Instagram comment
                  replies.
                </p>
              </div>

              <div className="pro-card p-5 sm:p-8 rounded-2xl sm:rounded-3xl relative">
                <span className="text-4xl sm:text-6xl font-black text-white/5 absolute top-3 sm:top-4 right-5 sm:right-6">
                  03
                </span>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-brand-wa text-black font-extrabold text-base sm:text-lg flex items-center justify-center mb-4 sm:mb-6">
                  3
                </div>
                <h4 className="text-base sm:text-xl font-bold text-white mb-1.5 sm:mb-2">
                  Revenue Runs on Autopilot
                </h4>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                  Recovered sales start rolling into your Shopify orders list
                  marked with
                  <code className="text-brand-wa font-mono">#WA-Recovered</code>
                  .
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* <!-- ================= PRICING SECTION ================= --> */}
        <section
          id="pricing"
          className="py-14 sm:py-20 lg:py-24 border-b border-white/[0.08] relative"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
              <span className="text-xs uppercase font-bold tracking-widest text-brand-wa">
                Flat Subscriptions
              </span>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white mt-2.5 sm:mt-3">
                Simple Flat Pricing. Keep 100% GMV.
              </h2>
              <p className="mt-3 text-gray-400 text-xs sm:text-base">
                We do not charge percentage commissions on your sales. Flat
                monthly pricing with done-for-you onboarding.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
              {/* <!-- Plan 1: Growth --> */}
              <div className="pro-card p-5 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg sm:text-2xl font-bold text-white">
                        Growth Plan
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        For stores doing ₹1L to ₹5L monthly sales
                      </p>
                    </div>
                  </div>

                  <div className="my-6 sm:my-8">
                    <span className="text-3xl sm:text-5xl font-black text-white">
                      ₹4,999
                    </span>
                    <span className="text-gray-400 text-xs sm:text-sm font-medium font-mono">
                      / month
                    </span>
                  </div>

                  <ul className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-gray-300">
                    <li className="flex items-center gap-2.5 sm:gap-3">
                      <i
                        data-lucide="check"
                        className="w-4 h-4 text-brand-wa shrink-0"
                      ></i>
                      <span>Automated WhatsApp Cart Recovery (1-Tap Buy)</span>
                    </li>
                    <li className="flex items-center gap-2.5 sm:gap-3">
                      <i
                        data-lucide="check"
                        className="w-4 h-4 text-brand-wa shrink-0"
                      ></i>
                      <span>
                        Shopify Sync &{" "}
                        <code className="text-white font-mono text-xs">
                          #WA-Recovered
                        </code>{" "}
                        Tagging
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5 sm:gap-3">
                      <i
                        data-lucide="check"
                        className="w-4 h-4 text-brand-wa shrink-0"
                      ></i>
                      <span>Up to 5,000 WhatsApp Messages / month</span>
                    </li>
                    <li className="flex items-center gap-2.5 sm:gap-3">
                      <i
                        data-lucide="check"
                        className="w-4 h-4 text-brand-wa shrink-0"
                      ></i>
                      <span>Live Conversion Funnel Dashboard</span>
                    </li>
                    <li className="flex items-center gap-2.5 sm:gap-3">
                      <i
                        data-lucide="check"
                        className="w-4 h-4 text-brand-wa shrink-0"
                      ></i>
                      <span>Setup Done by Engineers on Google Meet</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-white/10">
                  <a
                    href={SIGNUP_URL}
                    className="block w-full text-center py-3.5 sm:py-4 rounded-xl bg-app-800 hover:bg-app-700 text-white font-bold text-xs sm:text-sm transition-all border border-white/10"
                  >
                    Get Started with Growth
                  </a>
                </div>
              </div>

              {/* <!-- Plan 2: Pro AI Suite (HIGHLIGHTED) --> */}
              <div className="pro-card p-5 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl border-2 border-brand-wa bg-gradient-to-b from-brand-wa/15 via-app-900 to-app-950 shadow-2xl shadow-brand-wa/10 flex flex-col justify-between relative">
                <div className="absolute -top-3.5 right-6 sm:right-8 px-3 sm:px-4 py-1 rounded-full bg-brand-wa text-black font-black text-[10px] sm:text-[11px] uppercase tracking-wider shadow-lg">
                  MOST POPULAR &bull; BEST ROI
                </div>

                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg sm:text-2xl font-bold text-white">
                        Pro AI Revenue Suite
                      </h3>
                      <p className="text-xs text-brand-wa mt-0.5">
                        For stores doing ₹5L+ monthly sales
                      </p>
                    </div>
                  </div>

                  <div className="my-6 sm:my-8">
                    <span className="text-3xl sm:text-5xl font-black text-white">
                      ₹6,999
                    </span>
                    <span className="text-gray-400 text-xs sm:text-sm font-medium font-mono">
                      / month
                    </span>
                  </div>

                  <ul className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-gray-200">
                    <li className="flex items-center gap-2.5 sm:gap-3 font-semibold text-white">
                      <i
                        data-lucide="sparkles"
                        className="w-4 h-4 text-brand-wa shrink-0"
                      ></i>
                      <span>Everything in Growth + AI Automation</span>
                    </li>
                    <li className="flex items-center gap-2.5 sm:gap-3">
                      <i
                        data-lucide="check"
                        className="w-4 h-4 text-brand-wa shrink-0"
                      ></i>
                      <span>
                        <strong>24/7 AI Sales Concierge:</strong> Answers size &
                        delivery
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5 sm:gap-3">
                      <i
                        data-lucide="check"
                        className="w-4 h-4 text-brand-wa shrink-0"
                      ></i>
                      <span>
                        <strong>Instagram Comments ➔ DMs:</strong> Auto-send
                        checkout link
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5 sm:gap-3">
                      <i
                        data-lucide="check"
                        className="w-4 h-4 text-brand-wa shrink-0"
                      ></i>
                      <span>
                        <strong>RTO Killer Flow:</strong> Converts risky COD to
                        Prepaid UPI
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5 sm:gap-3">
                      <i
                        data-lucide="check"
                        className="w-4 h-4 text-brand-wa shrink-0"
                      ></i>
                      <span>1-Click VIP Festival & Sale Campaign Blasts</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-brand-wa/30">
                  <a
                    href={SIGNUP_URL}
                    className="block w-full text-center py-3.5 sm:py-4 rounded-xl bg-brand-wa hover:bg-emerald-400 text-black font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-xl shadow-brand-wa/30"
                  >
                    Claim Pro Access & Setup Call
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* <!-- ================= TESTIMONIALS / FOUNDER REVIEWS ================= --> */}
        <section className="py-14 sm:py-20 lg:py-24 border-b border-white/[0.08] relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
              <span className="text-xs uppercase font-bold tracking-widest text-brand-wa">
                Verified Results
              </span>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white mt-2.5 sm:mt-3">
                Trusted by High-Growth Shopify Founders
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <div className="pro-card p-5 sm:p-6 flex flex-col justify-between">
                <p className="text-xs sm:text-sm text-gray-300 italic leading-relaxed">
                  &quot;Recovered{" "}
                  <strong className="text-brand-wa">₹82,400</strong> in our
                  first month. The 1-tap COD reminder actually works. Setup was
                  done in 15 minutes.&quot;
                </p>
                <div className="flex items-center gap-3 mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-white/5">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-brand-wa/20 text-brand-wa font-bold flex items-center justify-center text-xs shrink-0">
                    PS
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Priya Sharma</p>
                    <p className="text-[10px] text-gray-400">
                      Founder, FashionHub Apparel
                    </p>
                  </div>
                </div>
              </div>

              <div className="pro-card p-5 sm:p-6 flex flex-col justify-between border-brand-wa/30">
                <p className="text-xs sm:text-sm text-gray-300 italic leading-relaxed">
                  &quot;The Instagram comment-to-DM flow added ₹1.4L during our
                  Diwali sale. Customer asks price on Reel, bot DMs checkout
                  link instantly.&quot;
                </p>
                <div className="flex items-center gap-3 mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-white/5">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center text-xs shrink-0">
                    RM
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Rahul Mehta</p>
                    <p className="text-[10px] text-gray-400">
                      Co-founder, UrbanKicks D2C
                    </p>
                  </div>
                </div>
              </div>

              <div className="pro-card p-5 sm:p-6 flex flex-col justify-between">
                <p className="text-xs sm:text-sm text-gray-300 italic leading-relaxed">
                  &quot;We were losing money on abandoned carts every single
                  day. Now it recovers on its own. COD to Prepaid dropped RTO by
                  38%.&quot;
                </p>
                <div className="flex items-center gap-3 mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-white/5">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0">
                    SK
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Sneha Kapoor</p>
                    <p className="text-[10px] text-gray-400">
                      Growth Lead, OrganicNest
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* <!-- ================= EXTENDED FAQ ACCORDION ================= --> */}
        <section id="faq" className="py-14 sm:py-20 lg:py-24 border-b border-white/[0.08] relative">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 sm:mb-16">
              <span className="text-xs uppercase font-bold tracking-widest text-brand-wa">
                Everything You Need To Know
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white mt-2">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="pro-card rounded-xl sm:rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === 0 ? null : 0)}
                  aria-expanded={openFaq === 0}
                  className="faq-btn w-full p-4 sm:p-6 text-left flex justify-between items-center text-xs sm:text-base font-bold text-white hover:text-brand-wa transition-colors"
                >
                  <span>How does the 20-minute Google Meet setup work?</span>
                  <i
                    data-lucide="chevron-down"
                    className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 shrink-0 ml-2 ${openFaq === 0 ? "rotate-180" : ""}`}
                  ></i>
                </button>
                <div
                  className={`${openFaq === 0 ? "block" : "hidden"} faq-content px-4 pb-4 sm:px-6 sm:pb-6 text-xs sm:text-sm text-gray-400 leading-relaxed`}
                >
                  Once you sign up, you book a call with our engineer. We
                  connect your Shopify store via custom app, link your WhatsApp
                  Business number, test the abandoned cart trigger, and verify
                  that orders are correctly tagged with #WA-Recovered. You
                  don&apos;t need any coding or technical knowledge.
                </div>
              </div>

              <div className="pro-card rounded-xl sm:rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === 1 ? null : 1)}
                  aria-expanded={openFaq === 1}
                  className="faq-btn w-full p-4 sm:p-6 text-left flex justify-between items-center text-xs sm:text-base font-bold text-white hover:text-brand-wa transition-colors"
                >
                  <span>
                    Will my WhatsApp number be safe from getting blocked?
                  </span>
                  <i
                    data-lucide="chevron-down"
                    className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 shrink-0 ml-2 ${openFaq === 1 ? "rotate-180" : ""}`}
                  ></i>
                </button>
                <div
                  className={`${openFaq === 1 ? "block" : "hidden"} faq-content px-4 pb-4 sm:px-6 sm:pb-6 text-xs sm:text-sm text-gray-400 leading-relaxed`}
                >
                  Yes, 100%. We use official Meta Cloud Business APIs combined
                  with humanized random delays (15–30s) and strict sending hours
                  (7 AM – 12 AM IST only). We also automatically filter out
                  invalid phone numbers and honor STOP opt-outs instantly.
                </div>
              </div>

              <div className="pro-card rounded-xl sm:rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === 2 ? null : 2)}
                  aria-expanded={openFaq === 2}
                  className="faq-btn w-full p-4 sm:p-6 text-left flex justify-between items-center text-xs sm:text-base font-bold text-white hover:text-brand-wa transition-colors"
                >
                  <span>How does 1-Tap Zero-Click WhatsApp Checkout work?</span>
                  <i
                    data-lucide="chevron-down"
                    className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 shrink-0 ml-2 ${openFaq === 2 ? "rotate-180" : ""}`}
                  ></i>
                </button>
                <div
                  className={`${openFaq === 2 ? "block" : "hidden"} faq-content px-4 pb-4 sm:px-6 sm:pb-6 text-xs sm:text-sm text-gray-400 leading-relaxed`}
                >
                  When a customer taps &quot;Confirm Order&quot; inside
                  WhatsApp, our system directly creates the verified order in
                  your Shopify backend and tags it with #WA-Recovered. The
                  customer does not have to re-enter their address or wait for
                  slow websites to load.
                </div>
              </div>

              <div className="pro-card rounded-xl sm:rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === 3 ? null : 3)}
                  aria-expanded={openFaq === 3}
                  className="faq-btn w-full p-4 sm:p-6 text-left flex justify-between items-center text-xs sm:text-base font-bold text-white hover:text-brand-wa transition-colors"
                >
                  <span>Is there any contract or lock-in?</span>
                  <i
                    data-lucide="chevron-down"
                    className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 shrink-0 ml-2 ${openFaq === 3 ? "rotate-180" : ""}`}
                  ></i>
                </button>
                <div
                  className={`${openFaq === 3 ? "block" : "hidden"} faq-content px-4 pb-4 sm:px-6 sm:pb-6 text-xs sm:text-sm text-gray-400 leading-relaxed`}
                >
                  Zero lock-in. You can pause, upgrade, or cancel your monthly
                  subscription at any time with a single click from your
                  dashboard.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* <!-- ================= FINAL GRAND CTA ================= */}
        <section className="py-14 sm:py-20 lg:py-24 relative overflow-hidden">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <div className="pro-card p-6 sm:p-12 lg:p-20 rounded-2xl sm:rounded-3xl border-2 border-brand-wa/40 bg-gradient-to-b from-brand-wa/15 via-app-900 to-app-950">
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                Stop Leaving 78% Of Your <br className="hidden sm:inline" />
                <span className="text-gradient-emerald">
                  Checkout Revenue On The Table
                </span>
              </h2>
              <p className="mt-3 sm:mt-4 text-gray-300 text-xs sm:text-base max-w-xl mx-auto">
                Book your 20-minute setup call. Let our engineers do the heavy
                lifting while you watch recovered revenue roll into your Shopify
                store.
              </p>

              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
                <a
                  href={SIGNUP_URL}
                  className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider bg-brand-wa text-black hover:bg-emerald-400 shadow-2xl shadow-brand-wa/40 transition-all text-center"
                >
                  Start 14-Day Free Trial
                </a>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-bold text-xs sm:text-sm bg-app-950 text-white border border-white/10 hover:border-white/20 transition-all text-center"
                >
                  Talk to Founders on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>

     
    </div>
  );
}
