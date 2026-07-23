"use client";
import Link from "next/link";
import { useState } from "react";
import {
  FaShoppingCart, FaWhatsapp, FaChartLine,
  FaUsers, FaCheckCircle, FaStar, FaArrowRight,
  FaShieldAlt, FaBolt, FaGift, FaRegEnvelope,
} from "react-icons/fa";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

export default function Homepage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const features = [
    {
      icon: <FaShoppingCart />,
      title: "Abandoned Cart Recovery",
      desc: "Auto-send WhatsApp messages when a customer leaves without buying. Recover 25–35% of lost carts with 98% open rates.",
    },
    {
      icon: <FaUsers />,
      title: "Customer Retargeting",
      desc: "Re-engage all your past Shopify customers with festival offers, discount campaigns, and personalized messages.",
    },
    {
      icon: <FaGift />,
      title: "Festival & Sale Campaigns",
      desc: "Send bulk WhatsApp campaigns to your entire customer base in one click — Diwali, EOSS, flash sales.",
    },
    {
      icon: <FaChartLine />,
      title: "Analytics Dashboard",
      desc: "See message delivery, open rates, clicks and recovered revenue — all in one clean dashboard.",
    },
    {
      icon: <FaBolt />,
      title: "Instant Shopify Sync",
      desc: "Connect your Shopify store and sync all customers automatically. No manual exports, no CSV uploads.",
    },
    {
      icon: <FaRegEnvelope />,
      title: "Smart Flow Automation",
      desc: "Set timing rules — send cart reminder after 30 mins, follow-up after 24 hrs. Set once, runs forever.",
    },
  ];

  const faqs = [
    {
      q: "How does setup work?",
      a: "You sign up, enter your Shopify store URL, and our team connects your WhatsApp number and activates your account within a few hours via Google Meet. No technical knowledge needed.",
    },
    {
      q: "Do I need Meta Business API approval?",
      a: "No. We handle everything on our end. You don't need to go through any Meta approval process.",
    },
    {
      q: "What's the difference between Growth and Pro plans?",
      a: "Growth plan is perfect for stores sending up to 5,000 messages/month. Pro gives you unlimited campaigns, priority support, and advanced flow controls.",
    },
    {
      q: "Can I negotiate the price?",
      a: "Yes — reach out to us directly. We are flexible for early clients and can customize a plan that fits your budget.",
    },
    {
      q: "Is there a contract or lock-in?",
      a: "No lock-in. Plans are monthly. You can stop anytime.",
    },
  ];

  return (
    <div className="overflow-hidden font-sans">

      {/* ─── HERO ────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-slate-950 via-teal-950 to-slate-950 text-white px-6 pt-24 pb-32">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 text-teal-300 px-4 py-1.5 rounded-full text-sm font-semibold mb-8">
            <FaBolt className="text-teal-400" /> WhatsApp Marketing for Shopify Stores
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight mb-6">
            Recover Lost Sales <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
              on WhatsApp.
            </span>
          </h1>

          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            78% of customers abandon carts. WhatsApp has <strong className="text-white">98% open rates</strong>.
            We connect the two — so your Shopify store recovers revenue on autopilot.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-teal-500 hover:bg-teal-400 text-white font-bold px-8 py-4 rounded-2xl text-lg transition shadow-lg shadow-teal-900/40 flex items-center justify-center gap-2"
            >
              Start Free — Get a Demo <FaArrowRight />
            </Link>
            <a
              href="#pricing"
              className="border border-white/10 hover:border-white/30 bg-white/5 text-white font-semibold px-8 py-4 rounded-2xl text-lg transition flex items-center justify-center gap-2"
            >
              View Pricing
            </a>
          </div>

          {/* Stats Row */}
          <div className="mt-16 grid grid-cols-3 gap-6 max-w-2xl mx-auto border-t border-white/10 pt-12">
            {[
              { val: "98%", label: "WhatsApp Open Rate" },
              { val: "30%+", label: "Cart Recovery Rate" },
              { val: "₹0", label: "Setup Cost" },
            ].map((s, i) => (
              <div key={i}>
                <p className="text-3xl font-extrabold text-white">{s.val}</p>
                <p className="text-sm text-slate-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PROBLEM → SOLUTION ──────────────────────────────── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="bg-red-50 border border-red-100 rounded-3xl p-10">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-500 text-xl mb-6">✗</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">What's happening right now</h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start gap-3"><span className="text-red-400 mt-1">✗</span> Customers add to cart and disappear</li>
              <li className="flex items-start gap-3"><span className="text-red-400 mt-1">✗</span> Your emails go to spam — 2% open rate</li>
              <li className="flex items-start gap-3"><span className="text-red-400 mt-1">✗</span> No way to re-engage past buyers</li>
              <li className="flex items-start gap-3"><span className="text-red-400 mt-1">✗</span> Festival season revenue left on table</li>
            </ul>
          </div>
          <div className="bg-teal-50 border border-teal-100 rounded-3xl p-10">
            <div className="w-12 h-12 bg-teal-600 rounded-2xl flex items-center justify-center text-white text-xl mb-6">✓</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">With WA-Auto</h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3"><FaCheckCircle className="text-teal-500 mt-1 shrink-0" /> Automatic cart recovery messages on WhatsApp</li>
              <li className="flex items-start gap-3"><FaCheckCircle className="text-teal-500 mt-1 shrink-0" /> 98% open rate — customers actually read it</li>
              <li className="flex items-start gap-3"><FaCheckCircle className="text-teal-500 mt-1 shrink-0" /> Re-target all Shopify customers in one click</li>
              <li className="flex items-start gap-3"><FaCheckCircle className="text-teal-500 mt-1 shrink-0" /> Festival sale campaigns sent in minutes</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ────────────────────────────────────── */}
      <section id="howitworks" className="py-24 px-6 bg-slate-50 border-y border-gray-100">
        <div className="max-w-5xl mx-auto text-center">
          <span className="text-teal-600 font-bold uppercase text-sm tracking-widest">Simple Process</span>
          <h2 className="text-4xl font-extrabold text-gray-900 mt-2 mb-4">Live in under 24 hours</h2>
          <p className="text-gray-500 text-lg mb-16 max-w-xl mx-auto">You signup, we do the rest. No tech knowledge needed.</p>

          <div className="grid md:grid-cols-3 gap-8 text-left">
            {[
              { n: "01", title: "Sign Up", desc: "Create your account with your brand name and email. Takes 60 seconds." },
              { n: "02", title: "Google Meet Setup", desc: "We hop on a quick call, connect your Shopify store and WhatsApp number — all done by our team." },
              { n: "03", title: "Revenue on Autopilot", desc: "Abandoned carts are recovered automatically. Run campaigns anytime from your dashboard." },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:-translate-y-1 transition duration-300">
                <div className="text-5xl font-extrabold text-teal-100 mb-4">{s.n}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-teal-600 font-bold uppercase text-sm tracking-widest">What You Get</span>
            <h2 className="text-4xl font-extrabold text-gray-900 mt-2">Everything to grow revenue</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="group p-8 rounded-3xl border border-gray-100 hover:border-teal-200 hover:shadow-lg transition duration-300 bg-white">
                <div className="w-14 h-14 bg-teal-50 group-hover:bg-teal-600 rounded-2xl flex items-center justify-center text-teal-600 group-hover:text-white text-xl transition duration-300 mb-5">
                  {f.icon}
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6 bg-slate-950 text-white">
        <div className="max-w-5xl mx-auto text-center">
          <span className="text-teal-400 font-bold uppercase text-sm tracking-widest">Pricing</span>
          <h2 className="text-4xl font-extrabold mt-2 mb-4">Simple, transparent plans</h2>
          <p className="text-slate-400 text-lg mb-16 max-w-xl mx-auto">
            No hidden fees. No per-message charges. Flat monthly subscription — you keep all the revenue you recover.
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">

            {/* Growth Plan */}
            <div className="bg-slate-900 border border-slate-700 hover:border-teal-500/50 rounded-3xl p-10 transition duration-300">
              <p className="text-sm font-bold text-teal-400 uppercase tracking-widest mb-3">Growth</p>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-5xl font-extrabold text-white">₹3,999</span>
                <span className="text-slate-400 mb-2">/ month</span>
              </div>
              <p className="text-slate-400 text-sm mb-8">Best for stores doing ₹1L–₹5L/month revenue</p>

              <ul className="space-y-3 mb-10">
                {[
                  "Abandoned Cart Recovery (auto)",
                  "Customer Retargeting Campaigns",
                  "Shopify Customer Sync",
                  "Analytics Dashboard",
                  "Up to 5,000 messages/month",
                  "WhatsApp setup by our team",
                  "Email support",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300 text-sm">
                    <FaCheckCircle className="text-teal-400 shrink-0" /> {item}
                  </li>
                ))}
              </ul>

              <Link href="/signup" className="block w-full text-center bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 rounded-2xl transition duration-300">
                Get Started
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-gradient-to-b from-teal-900 to-teal-950 border border-teal-500 rounded-3xl p-10 relative shadow-2xl shadow-teal-950">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-amber-500 text-black text-xs font-extrabold px-5 py-1.5 rounded-full shadow-lg">
                MOST POPULAR
              </div>
              <p className="text-sm font-bold text-yellow-400 uppercase tracking-widest mb-3">Pro</p>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-5xl font-extrabold text-white">₹5,999</span>
                <span className="text-teal-300 mb-2">/ month</span>
              </div>
              <p className="text-teal-300 text-sm mb-8">Best for stores doing ₹5L+ revenue per month</p>

              <ul className="space-y-3 mb-10">
                {[
                  "Everything in Growth",
                  "Unlimited messages",
                  "Multi-flow automation (2hr, 24hr, 48hr)",
                  "Festival campaign templates",
                  "Priority WhatsApp support",
                  "Advanced analytics & ROI tracking",
                  "Dedicated account manager",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-white text-sm">
                    <FaCheckCircle className="text-yellow-400 shrink-0" /> {item}
                  </li>
                ))}
              </ul>

              <Link href="/signup" className="block w-full text-center bg-white hover:bg-gray-100 text-teal-900 font-extrabold py-4 rounded-2xl transition duration-300 shadow-lg">
                Get Started — Best Value
              </Link>
            </div>
          </div>

          {/* Negotiation note */}
          <div className="mt-10 bg-white/5 border border-white/10 rounded-2xl px-8 py-5 max-w-2xl mx-auto">
            <p className="text-slate-300 text-sm">
              💬 <strong className="text-white">Price feel too high?</strong> Reach out directly — we work with early clients flexibly.
              These are standard rates; we negotiate based on your store size and needs.
            </p>
          </div>
        </div>
      </section>

      {/* ─── SOCIAL PROOF ────────────────────────────────────── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900">Stores already winning</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Priya S.", store: "FashionHub", quote: "Recovered ₹80,000 in the first month alone. The cart reminder messages actually work.", stars: 5 },
              { name: "Rahul M.", store: "UrbanKicks", quote: "Setup was done in one Google Meet. Our festival Diwali campaign got 42% reply rate.", stars: 5 },
              { name: "Sneha K.", store: "OrganicNest", quote: "We were losing money on abandoned carts every day. Now it just recovers on its own.", stars: 5 },
            ].map((t, i) => (
              <div key={i} className="bg-slate-50 border border-gray-100 rounded-3xl p-8">
                <div className="flex gap-1 mb-4">
                  {Array(t.stars).fill(0).map((_, j) => <FaStar key={j} className="text-yellow-400 text-sm" />)}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-6">"{t.quote}"</p>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-gray-400 text-xs">{t.store}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─────────────────────────────────────────────── */}
      <section id="faq" className="py-24 px-6 bg-slate-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-extrabold text-gray-900">Frequently Asked</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-7 py-5 text-left flex justify-between items-center hover:bg-gray-50 transition"
                >
                  <span className="font-semibold text-gray-900">{faq.q}</span>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm transition ${openFaq === i ? "bg-teal-100 text-teal-700" : "bg-gray-100 text-gray-400"}`}>
                    {openFaq === i ? <FiChevronUp /> : <FiChevronDown />}
                  </div>
                </button>
                {openFaq === i && (
                  <div className="px-7 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-50 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ───────────────────────────────────────── */}
      <section className="py-24 px-6 bg-teal-700 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
            Start recovering revenue today.
          </h2>
          <p className="text-teal-100 text-xl mb-10">
            Sign up in 60 seconds. Our team handles the rest.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-white text-teal-800 font-extrabold px-10 py-5 rounded-2xl text-xl hover:bg-yellow-300 transition shadow-xl hover:shadow-2xl"
          >
            Get Started Free <FaArrowRight />
          </Link>
          <div className="mt-10 flex flex-wrap justify-center gap-8 text-sm text-teal-200">
            <div className="flex items-center gap-2"><FaShieldAlt /> No lock-in contract</div>
            <div className="flex items-center gap-2"><FaCheckCircle /> Setup by our team</div>
            <div className="flex items-center gap-2"><FaWhatsapp /> WhatsApp support included</div>
          </div>
        </div>
      </section>

    </div>
  );
}
