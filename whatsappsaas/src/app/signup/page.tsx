"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FaCheckCircle, FaArrowRight, FaShieldAlt } from "react-icons/fa";
import axios from 'axios';
import { signupSchema, SignupFormData } from "../../lib/validations";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function SignupPage() {
  const router = useRouter();
  
  // Zod se generate hua type use kar rahe hain (SignupFormData)
  const [formData, setFormData] = useState<SignupFormData>({
    brandName: "",
    email: "",
    phone: "",
    password: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState("");
  
  // Naya state: Errors ko screen par dikhane ke liye
  const [errors, setErrors] = useState<Partial<Record<keyof SignupFormData, string>>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData,[e.target.name]: e.target.value });
    // Jaise hi user type kare, error hata do
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  // Inside frontend handleSignup function

const handleSignup = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
  setSubmitError("");

    // 1. ZOD VALIDATION: formData ko check karo
    const result = signupSchema.safeParse(formData);

    if (!result.success) {
      setErrors(Object.fromEntries(result.error.issues.map((issue) => [issue.path[0] as keyof SignupFormData, issue.message])));
      setLoading(false);
      return;
    }

    // 2. BACKEND API CALL (If Validation is successful)
    try {
      // result.data mein Zod ka verified clean data hota hai
      const response = await axios.post(`${API_URL}/auth/signup`, result.data);
      
      // 3. Token aur merchant data localStorage me save karo
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("merchant", JSON.stringify(response.data.merchant));
      
      setLoading(false);
      
      // 4. Success ke baad onboarding pe bhejo (Jaisa humara masterplan tha)
      router.push("/onboarding"); 
      
    } catch (error: unknown) {
      setLoading(false);
      const apiMessage = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message
        : undefined;
      setSubmitError(apiMessage || "Signup failed. Please try again.");
    }
  };

  return (
    <section className="relative isolate flex flex-1 items-center overflow-hidden px-4 py-8 sm:px-6 sm:py-12">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-grid-mesh" />
      <div className="pointer-events-none absolute left-1/3 top-0 -z-10 h-80 w-80 rounded-full bg-brand-wa/10 blur-[130px]" />
      <div className="mx-auto grid w-full max-w-6xl items-start gap-5 lg:grid-cols-2 lg:items-stretch lg:gap-8">
      
      {/* Left Side - Benefits */}
      <div className="order-2 relative flex flex-col justify-center overflow-hidden rounded-2xl border border-brand-wa/20 bg-gradient-to-br from-brand-wa/15 via-app-900 to-app-950 p-6 text-white shadow-xl sm:p-10 lg:order-1">
        <div className="mb-6">
          <span className="brand-logo-flow relative inline-flex">
            <Image src="/wa-logo.png" alt="WA-Auto" width={260} height={86} className="relative z-10 h-14 w-auto object-contain sm:h-16" />
          </span>
        </div>
        
        <h1 className="text-4xl font-bold mb-6 leading-tight">
          Start recovering abandoned carts today.
        </h1>
        <p className="text-base leading-7 text-gray-300 mb-7 sm:text-lg">
          Join 500+ e-commerce stores generating ₹2.5Cr+ in recovered revenue.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:space-y-4">
          <div className="flex items-center">
            <FaCheckCircle className="text-brand-wa text-xl mr-4" />
            <span className="text-sm sm:text-base">Abandoned cart recovery on autopilot</span>
          </div>
          <div className="flex items-center">
            <FaCheckCircle className="text-brand-wa text-xl mr-4" />
            <span className="text-sm sm:text-base">Setup takes less than 2 minutes</span>
          </div>
          <div className="flex items-center">
            <FaCheckCircle className="text-brand-wa text-xl mr-4" />
            <span className="text-sm sm:text-base">Festival campaigns to re-engage customers</span>
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="order-1 rounded-2xl border border-white/10 bg-app-900/90 p-5 text-white shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8 lg:order-2">
        <Link href="/" className="brand-logo-flow relative mb-5 inline-flex lg:hidden" aria-label="WA-Auto home">
          <Image src="/wa-logo.png" alt="WA-Auto" width={260} height={86} className="relative z-10 h-12 w-auto object-contain" />
        </Link>
        <h2 className="text-3xl font-bold text-white mb-2">Create your account</h2>
        <p className="text-gray-400 mb-8">Start your free trial. No credit card required.</p>

        <form onSubmit={handleSignup} className="space-y-5">
          {submitError && <p role="alert" className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">{submitError}</p>}
          <div>
            <label htmlFor="signup-brand" className="block text-sm font-medium text-gray-200 mb-1">Brand Name</label>
            <input 
              id="signup-brand"
              type="text" 
              name="brandName" 
              autoComplete="organization"
              value={formData.brandName}
              onChange={handleChange}
              placeholder="e.g. SneakerHub"
              className={`w-full rounded-lg border bg-app-950 p-3 text-white placeholder:text-gray-600 outline-none transition focus:ring-2 focus:ring-brand-wa/60 ${errors.brandName ? 'border-red-500' : 'border-white/10 focus:border-brand-wa/60'}`}
            />
            {/* Error Message Dikhane ka tarika */}
            {errors.brandName && <p role="alert" className="text-rose-300 text-xs mt-1">{errors.brandName}</p>}
          </div>
          
          <div>
            <label htmlFor="signup-email" className="block text-sm font-medium text-gray-200 mb-1">Email Address</label>
            <input 
              id="signup-email"
              type="email" 
              name="email" 
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@company.com"
              className={`w-full rounded-lg border bg-app-950 p-3 text-white placeholder:text-gray-600 outline-none transition focus:ring-2 focus:ring-brand-wa/60 ${errors.email ? 'border-red-500' : 'border-white/10 focus:border-brand-wa/60'}`}
            />
            {errors.email && <p role="alert" className="text-rose-300 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="signup-phone" className="block text-sm font-medium text-gray-200 mb-1">WhatsApp Number</label>
            <input 
              id="signup-phone"
              type="tel" 
              name="phone" 
              autoComplete="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+91 98765 43210"
              className={`w-full rounded-lg border bg-app-950 p-3 text-white placeholder:text-gray-600 outline-none transition focus:ring-2 focus:ring-brand-wa/60 ${errors.phone ? 'border-red-500' : 'border-white/10 focus:border-brand-wa/60'}`}
            />
            {errors.phone && <p role="alert" className="text-rose-300 text-xs mt-1">{errors.phone}</p>}
          </div>

          <div>
  <label htmlFor="signup-password" className="block text-sm font-medium text-gray-200 mb-1">Password</label>

  <div className="relative">
    <input 
      id="signup-password"
      type={showPassword ? "text" : "password"}
      name="password" 
      autoComplete="new-password"
      value={formData.password}
      onChange={handleChange}
      placeholder="••••••••"
      className={`w-full rounded-lg border bg-app-950 p-3 text-white placeholder:text-gray-600 outline-none transition pr-12 focus:ring-2 focus:ring-brand-wa/60 ${
        errors.password 
          ? 'border-red-500' 
          : 'border-white/10 focus:border-brand-wa/60'
      }`}
    /> 

    {/* Toggle Button */}
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-400 hover:text-white"
    >
      {showPassword ? "Hide" : "Show"}
    </button>
  </div>

  {errors.password && (
    <p role="alert" className="text-rose-300 text-xs mt-1">
      {errors.password}
    </p>
  )}
</div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-brand-wa text-black font-bold py-3 px-4 rounded-lg hover:bg-emerald-400 focus:ring-4 focus:ring-brand-wa/30 transition duration-300 flex justify-center items-center disabled:opacity-70 mt-4"
          >
            {loading ? <span className="animate-pulse">Creating Account...</span> : <>Create Account <FaArrowRight className="ml-2" /></>}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-brand-wa hover:text-emerald-300 transition">
            Log in instead
          </Link>
        </p>

        <div className="mt-6 flex items-center justify-center text-xs text-gray-500">
          <FaShieldAlt className="mr-1" />
          <span>256-bit secure encryption</span>
        </div>
      </div>
      </div>
    </section>
  );
}