"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

import {
  FaShoppingCart,
  FaWhatsapp,
  FaRocket,
  FaChartLine,
  FaRobot,
  FaUsers,
  FaRupeeSign,
  FaTimes,
  FaCheckCircle,
  FaStar,
  FaArrowRight,
  FaCloud,
  FaPlay,
  FaShieldAlt,
  FaClock,
  FaTrophy,
} from "react-icons/fa";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

const Homepage = () => {
  // State for FAQ
  const [openItem, setOpenItem] = useState<number | null>(null);

  // State for countdown timer
  const[timeLeft, setTimeLeft] = useState({
    days: 7,
    hours: 23,
    minutes: 45,
    seconds: 30
  });

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  },[]);

  const pricing = {
    starter: {
      subscription: 999,
      messageRate: 0.80,
      messageLimit: 3000,
      freeCredit: 200,
      freeMessages: 250
    },
    enterprise: {
      subscription: 1999,
      messageRate: 0.80,
      messageLimit: "unlimited",
      freeCredit: 240,
      freeMessages: 300
    }
  };

  // State for pricing calculator
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'enterprise'>('starter');
  const [estimatedMessages, setEstimatedMessages] = useState(1000);

  // Toggle function for FAQ
  const toggleItem = (item: number) => {
    setOpenItem(openItem === item ? null : item);
  };

  // Modern Professional SaaS Images
  const heroImage = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80"; // Sleek Data/Dashboard
  const cartRecoveryImage = "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=800&q=80"; // E-commerce Shopping Bag
  const whatsappImage = "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?auto=format&fit=crop&w=800&q=80"; // Modern Smartphone App interface
  const shopifyLogo = "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Shopify_logo_2018.svg/1280px-Shopify_logo_2018.svg.png";
  const woocommerceLogo = "https://asklayer.io/wp-content/uploads/2024/03/woocommerce-logo.png";

  // Calculate pricing
  const calculateCost = () => {
    const plan = pricing[selectedPlan];
    const messageCost = estimatedMessages * plan.messageRate;
    const totalCost = plan.subscription + messageCost - plan.freeCredit;
    return {
      subscription: plan.subscription,
      messageCost: messageCost,
      freeCredit: plan.freeCredit,
      totalCost: Math.max(totalCost, plan.subscription)
    };
  };

  // Enhanced ROI Calculator
  const calculateROI = () => {
    const avgOrderValue = 1500; 
    const cartAbandonmentRate = 0.78;
    const emailRecoveryRate = 0.02;
    const whatsappRecoveryRate = 0.35;
    
    const monthlyOrders = estimatedMessages / 3; 
    const abandonedCarts = monthlyOrders * cartAbandonmentRate;
    const emailRevenue = abandonedCarts * emailRecoveryRate * avgOrderValue;
    const whatsappRevenue = abandonedCarts * whatsappRecoveryRate * avgOrderValue;
    const additionalRevenue = whatsappRevenue - emailRevenue;
    
    return {
      additionalRevenue: Math.round(additionalRevenue),
      roi: Math.round(((additionalRevenue - costBreakdown.totalCost) / costBreakdown.totalCost) * 100),
      recoveredCarts: Math.round(abandonedCarts * whatsappRecoveryRate)
    };
  };

  const costBreakdown = calculateCost();
  const roiData = calculateROI();

  // E-commerce focused features
  const features =[
    {
      icon: <FaShoppingCart className="text-3xl" />,
      title: "Abandoned Cart Recovery",
      description: "Automatically send WhatsApp messages to customers who left items in their cart. Recover 30% more sales with 98% open rates."
    },
    {
      icon: <FaCheckCircle className="text-3xl" />,
      title: "Order Confirmations",
      description: "Send instant order confirmations via WhatsApp. Keep customers informed and reduce support queries."
    },
    {
      icon: <FaRocket className="text-3xl" />,
      title: "Delivery Updates",
      description: "Automated delivery notifications and tracking updates. Improve customer experience with real-time updates."
    },
    {
      icon: <FaRobot className="text-3xl" />,
      title: "AI Customer Support Bot",
      description: "24/7 AI-powered customer support bot that handles queries, provides product info, and converts leads to sales."
    },
    {
      icon: <FaUsers className="text-3xl" />,
      title: "Customer Retargeting",
      description: "Retarget all your customers from day one. Convert old leads into revenue with one-click campaign setup."
    },
    {
      icon: <FaChartLine className="text-3xl" />,
      title: "Analytics Dashboard",
      description: "Track message delivery, conversion rates, and ROI. See exactly how much revenue WhatsApp is generating."
    }
  ];

  const steps =[
    {
      number: "01",
      title: "Connect Your Store",
      description: "Connect your Shopify or WooCommerce store in under 2 minutes. No technical knowledge required.",
      icon: <FaCloud className="text-3xl" />
    },
    {
      number: "02", 
      title: "Scan QR Code",
      description: "Scan QR code with your business WhatsApp account. Your store is now connected to WhatsApp.",
      icon: <FaWhatsapp className="text-3xl" />
    },
    {
      number: "03",
      title: "Start Recovering Sales",
      description: "Automated messages start working immediately. Watch your abandoned cart recovery rates soar.",
      icon: <FaRocket className="text-3xl" />
    }
  ];

  return (
    <div className="overflow-hidden">
      {/* Premium Urgency Banner */}
      <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white text-center py-3 text-sm font-medium shadow-md relative z-20">
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4">
          <span className="flex items-center"><FaRocket className="mr-2" /> Limited Time: Get 50% more free credits!</span>
          <div className="flex items-center space-x-2 bg-black/20 px-4 py-1 rounded-full backdrop-blur-sm border border-white/10">
            <span>Ends in:</span>
            <span className="font-bold tracking-wider">
              {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
            </span>
          </div>
          <span className="hidden sm:inline bg-white text-red-600 px-2 py-0.5 rounded-md text-xs font-bold">Only 23 spots left</span>
        </div>
      </div>

      {/* Hero Section (Modern Gradient & Premium Shadow) */}
      <section className="relative bg-gradient-to-br from-teal-900 via-teal-800 to-teal-900 min-h-[90vh] text-white px-6 md:px-20 py-20 flex items-center">
        {/* Abstract Background pattern */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        
        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-16">
            <div className="lg:w-1/2 text-center lg:text-left">
              <div className="inline-block bg-teal-800 border border-teal-600 text-teal-200 px-4 py-1.5 rounded-full text-sm font-semibold mb-6 shadow-lg">
                🚀 The #1 WhatsApp API for E-commerce
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight tracking-tight mb-6">
                Recover <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500">30% More</span> Abandoned Carts.
              </h1>
              <p className="text-xl text-teal-100 font-light mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                78% of customers abandon carts. Emails only have a 2% recovery rate. 
                Switch to WhatsApp with <strong className="text-white font-semibold">98% open rates</strong> and watch your revenue soar. No setup fees.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
                <Link
                  href="/signup"
                  className="bg-white text-teal-900 rounded-full px-8 py-4 text-lg font-bold hover:bg-yellow-300 transition duration-300 flex items-center shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(253,224,71,0.5)] transform hover:-translate-y-1"
                >
                  Start Free Trial <FaArrowRight className="ml-2" />
                </Link>
                <div className="text-center sm:text-left mt-4 sm:mt-0 px-4">
                  <p className="text-xs text-teal-200 uppercase tracking-wide">Meta Ads Cost</p>
                  <p className="text-sm line-through text-teal-400">₹99 per purchase</p>
                  <p className="text-lg font-bold text-yellow-400">Our cost: ₹0.90 / msg</p>
                </div>
              </div>

              {/* Social Proof Elements */}
              <div className="mt-12 pt-8 border-t border-teal-700/50 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-8">
                <div className="flex items-center">
                  <div className="flex -space-x-3">
                    {[1,2,3,4].map((i) => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-teal-800 bg-teal-100 flex items-center justify-center overflow-hidden">
                        <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="user" />
                      </div>
                    ))}
                  </div>
                  <div className="ml-4 text-left">
                    <div className="flex text-yellow-400 text-sm"><FaStar/><FaStar/><FaStar/><FaStar/><FaStar/></div>
                    <p className="text-sm font-medium text-teal-100 mt-1">500+ Active Stores</p>
                  </div>
                </div>
                <div className="hidden sm:block w-px h-10 bg-teal-700/50"></div>
                <div className="text-left">
                  <p className="text-2xl font-bold text-white">₹2.5Cr+</p>
                  <p className="text-sm text-teal-200">Revenue Recovered</p>
                </div>
              </div>
            </div>
            
            {/* Hero Image Section with Premium Styling */}
            <div className="lg:w-1/2 w-full relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-teal-500 to-yellow-400 blur-3xl opacity-20 rounded-full animate-pulse"></div>
              <img
                src={heroImage}
                alt="E-commerce WhatsApp Marketing Dashboard"
                className="relative z-10 rounded-3xl shadow-[0_20px_50px_rgba(0,_0,_0,_0.5)] border border-white/10 object-cover w-full h-[500px]"
              />
              
              {/* Floating Badge */}
              <div className="absolute -bottom-6 -left-6 z-20 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-4 animate-bounce" style={{animationDuration: '3s'}}>
                <div className="bg-green-100 p-3 rounded-full text-green-600">
                  <FaWhatsapp className="text-2xl" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">Cart Recovered</p>
                  <p className="text-lg font-extrabold text-gray-900">+ ₹4,500</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Problem */}
            <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xl mr-4">
                  <FaTimes />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">The Problem</h2>
              </div>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                <strong className="text-gray-900">78% of customers</strong> abandon their carts. You send them an email, but the open rate is a miserable 2%. You are losing money every single day.
              </p>
              <img src={cartRecoveryImage} alt="Abandoned Cart Problem" className="rounded-2xl shadow-md w-full h-64 object-cover transition transform group-hover:scale-105 duration-500" />
            </div>
            
            {/* Solution */}
            <div className="bg-teal-50 p-8 rounded-3xl border border-teal-100 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-teal-500"></div>
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-teal-600 text-white rounded-full flex items-center justify-center text-xl mr-4 shadow-md">
                  <FaCheckCircle />
                </div>
                <h2 className="text-3xl font-bold text-teal-900">Our Solution</h2>
              </div>
              <p className="text-lg text-teal-800 mb-8 leading-relaxed">
                Reach them where they actually read messages. WhatsApp has <strong className="text-teal-900 font-extrabold">98% open rates</strong>. Recover up to 30% more sales within minutes.
              </p>
              <img src={whatsappImage} alt="WhatsApp Solution" className="rounded-2xl shadow-md w-full h-64 object-cover transition transform group-hover:scale-105 duration-500" />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="HowItWorks" className="py-24 px-6 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto text-center">
          <span className="text-teal-600 font-bold tracking-wider uppercase text-sm mb-2 block">Simple Setup</span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">Live in under 2 minutes</h2>
          <p className="text-xl text-gray-500 mb-16 max-w-2xl mx-auto">No coding. No complex API approvals. Just scan and start recovering revenue instantly.</p>
          
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-0.5 bg-teal-200 border-t border-dashed border-teal-300 z-0"></div>

            {steps.map((step, index) => (
              <div key={index} className="relative z-10 bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/50 hover:-translate-y-2 transition duration-300 border border-gray-100">
                <div className="bg-gradient-to-br from-teal-500 to-teal-700 text-white rounded-2xl w-24 h-24 flex items-center justify-center mx-auto mb-8 shadow-lg shadow-teal-500/30">
                  {step.icon}
                </div>
                <div className="absolute -top-4 -right-4 bg-yellow-400 text-yellow-900 rounded-full w-12 h-12 flex items-center justify-center text-lg font-extrabold shadow-md border-4 border-white">
                  {step.number}
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-20 flex flex-col items-center">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Seamlessly Integrates With</p>
            <div className="flex flex-wrap justify-center items-center gap-12 opacity-70 grayscale hover:grayscale-0 transition duration-500">
              <img src={shopifyLogo} alt="Shopify" className="h-12 object-contain" />
              <img src={woocommerceLogo} alt="WooCommerce" className="h-10 object-contain" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="Services" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-teal-600 font-bold tracking-wider uppercase text-sm mb-2 block">Powerful Features</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">Everything you need to scale</h2>
            <p className="text-xl text-gray-500">Turn your WhatsApp into an automated sales and support machine.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition duration-300 group">
                <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 mb-6 group-hover:bg-teal-600 group-hover:text-white transition duration-300 shadow-sm">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section (Premium Look) */}
      <section id="Pricing" className="py-24 px-6 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <span className="text-teal-400 font-bold tracking-wider uppercase text-sm mb-2 block">Transparent Pricing</span>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6">Pay for what you use</h2>
          <p className="text-xl text-gray-400 mb-16 max-w-2xl mx-auto">No hidden fees. No complex contracts. Start recovering revenue today.</p>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto text-left">
            {/* Starter Plan */}
            <div className="bg-gray-800 border border-gray-700 rounded-3xl p-10 hover:border-teal-500 transition duration-300">
              <h3 className="text-2xl font-bold mb-2 text-gray-100">Starter Plan</h3>
              <p className="text-gray-400 mb-6">Perfect for small and growing stores.</p>
              <div className="text-5xl font-extrabold text-white mb-8">
                ₹999<span className="text-xl text-gray-500 font-medium">/mo</span>
              </div>
              
              <ul className="mb-10 space-y-4">
                <li className="flex items-center text-gray-300"><FaCheckCircle className="text-teal-400 mr-3 text-xl" /> Abandoned Cart Recovery</li>
                <li className="flex items-center text-gray-300"><FaCheckCircle className="text-teal-400 mr-3 text-xl" /> Order Confirmations</li>
                <li className="flex items-center text-gray-300"><FaCheckCircle className="text-teal-400 mr-3 text-xl" /> ₹0.80 per message</li>
                <li className="flex items-center text-gray-300"><FaCheckCircle className="text-teal-400 mr-3 text-xl" /> 3,000 Messages Limit</li>
                <li className="flex items-center text-teal-300 font-semibold bg-teal-900/50 p-2 rounded-lg mt-2"><FaStar className="mr-2" /> Includes ₹200 Free Credits</li>
              </ul>

              <Link href="/signup" className="w-full bg-gray-700 text-white py-4 rounded-xl font-bold hover:bg-gray-600 transition duration-300 block text-center">
                Start 7-Day Free Trial
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-gradient-to-b from-teal-900 to-teal-800 border border-teal-500 rounded-3xl p-10 relative shadow-2xl shadow-teal-900/50 transform md:-translate-y-4">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-6 py-1.5 rounded-full text-sm font-bold shadow-lg">
                MOST POPULAR
              </div>
              <h3 className="text-2xl font-bold mb-2 text-white">Enterprise Plan</h3>
              <p className="text-teal-200 mb-6">For high-volume stores needing AI support.</p>
              <div className="text-5xl font-extrabold text-white mb-8">
                ₹1,999<span className="text-xl text-teal-300 font-medium">/mo</span>
              </div>

              <ul className="mb-10 space-y-4">
                <li className="flex items-center text-gray-100"><FaCheckCircle className="text-yellow-400 mr-3 text-xl" /> Everything in Starter</li>
                <li className="flex items-center text-gray-100"><FaCheckCircle className="text-yellow-400 mr-3 text-xl" /> AI Customer Support Bot</li>
                <li className="flex items-center text-gray-100"><FaCheckCircle className="text-yellow-400 mr-3 text-xl" /> Unlimited Messages Limit</li>
                <li className="flex items-center text-gray-100"><FaCheckCircle className="text-yellow-400 mr-3 text-xl" /> Priority Support</li>
                <li className="flex items-center text-yellow-300 font-semibold bg-black/20 p-2 rounded-lg mt-2"><FaStar className="mr-2" /> Includes ₹240 Free Credits</li>
              </ul>

              <Link href="/signup" className="w-full bg-white text-teal-900 py-4 rounded-xl font-extrabold hover:bg-gray-100 transition duration-300 block text-center shadow-lg hover:shadow-xl">
                Get Started Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Case Study Section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gray-50 rounded-[3rem] p-8 md:p-16 border border-gray-100 shadow-xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-block bg-teal-100 text-teal-800 px-4 py-1.5 rounded-full text-sm font-bold mb-6">
                  SUCCESS STORY
                </div>
                <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
                  How FashionHub recovered <span className="text-teal-600">₹2.5 Lakhs</span> in 30 days.
                </h2>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                  "We were losing ₹8 lakhs monthly to cart abandonment. Email recovery was completely dead. Setting up WA-Automations took exactly 2 minutes and it paid for itself on day one."
                </p>
                <div className="flex items-center gap-4">
                  <img src="https://i.pravatar.cc/150?img=47" alt="Founder" className="w-16 h-16 rounded-full border-2 border-white shadow-md" />
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">Priya Sharma</h4>
                    <p className="text-gray-500">Founder, FashionHub</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center transform transition hover:-translate-y-1">
                  <div className="text-4xl font-extrabold text-teal-600 mb-2">38%</div>
                  <div className="text-sm font-semibold text-gray-500 uppercase">Recovery Rate</div>
                </div>
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center transform transition hover:-translate-y-1">
                  <div className="text-4xl font-extrabold text-teal-600 mb-2">167</div>
                  <div className="text-sm font-semibold text-gray-500 uppercase">Carts Recovered</div>
                </div>
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center transform transition hover:-translate-y-1 col-span-2 bg-gradient-to-br from-teal-50 to-white">
                  <div className="text-5xl font-extrabold text-gray-900 mb-2">2100%</div>
                  <div className="text-sm font-semibold text-teal-600 uppercase tracking-widest">Return on Investment</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6 bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Got Questions?</h2>
            <p className="text-xl text-gray-500">Everything you need to know about the product and billing.</p>
          </div>
          
          <div className="space-y-4">
            {[
              {
                question: "How quickly can I set up WhatsApp automation?",
                answer: "Setup takes less than 2 minutes. Just connect your Shopify store, scan a QR code with your business WhatsApp, and you are ready to go!"
              },
              {
                question: "Do I need WhatsApp Business API approval from Meta?",
                answer: "No! We use your existing WhatsApp Business number. There is no tedious approval process, no API fees, and no waiting time."
              },
              {
                question: "What is the difference between your pricing and Meta Ads?",
                answer: "Retargeting via Meta Ads costs a minimum of ₹99 per purchase. Our automated WhatsApp messages cost just ₹0.90 each and boast a 98% open rate."
              },
              {
                question: "Is there a setup fee or hidden charge?",
                answer: "Absolutely not. You only pay your monthly subscription and the cost per message. Plus, we give you free credits every month to start."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200">
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full p-6 text-left flex justify-between items-center hover:bg-gray-50 focus:outline-none"
                >
                  <span className="font-bold text-gray-900 text-lg pr-8">{faq.question}</span>
                  <div className={`w-8 h-8 flex items-center justify-center rounded-full ${openItem === index ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500'}`}>
                    {openItem === index ? <FiChevronUp /> : <FiChevronDown />}
                  </div>
                </button>
                <div className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${openItem === index ? 'max-h-40 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <p className="text-gray-600 leading-relaxed border-t border-gray-50 pt-4">{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-teal-900 text-white relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-800 rounded-full mix-blend-multiply filter blur-3xl opacity-50 translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-700 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl font-extrabold mb-6 leading-tight">Ready to boost your revenue?</h2>
          <p className="text-2xl text-teal-200 mb-10 font-light">
            Join 500+ businesses already using WhatsApp to automate sales.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link
              href="/signup"
              className="bg-yellow-400 text-yellow-900 px-10 py-5 rounded-full font-extrabold text-xl hover:bg-yellow-300 transition duration-300 flex items-center shadow-2xl hover:shadow-[0_0_30px_rgba(250,204,21,0.5)] transform hover:-translate-y-1"
            >
              Start Free Trial <FaArrowRight className="ml-3" />
            </Link>
          </div>

          {/* Trust Signals */}
          <div className="flex flex-wrap justify-center items-center gap-8 mt-12 pt-12 border-t border-teal-800/50">
            <div className="flex items-center text-sm font-medium text-teal-200">
              <FaShieldAlt className="mr-2 text-xl text-teal-400" />
              SSL Secured
            </div>
            <div className="flex items-center text-sm font-medium text-teal-200">
              <FaCheckCircle className="mr-2 text-xl text-teal-400" />
              GDPR Compliant
            </div>
            <div className="flex items-center text-sm font-medium text-teal-200">
              <FaWhatsapp className="mr-2 text-xl text-teal-400" />
              Official API Partner
            </div>
            <div className="flex items-center text-sm font-medium text-teal-200">
              <FaTrophy className="mr-2 text-xl text-yellow-400" />
              30-Day Money Back
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Homepage;