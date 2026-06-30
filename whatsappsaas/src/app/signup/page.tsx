"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaCheckCircle, FaWhatsapp, FaArrowRight, FaShieldAlt } from "react-icons/fa";
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
  
  // Naya state: Errors ko screen par dikhane ke liye
  const [errors, setErrors] = useState<any>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData,[e.target.name]: e.target.value });
    // Jaise hi user type kare, error hata do
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  // Inside frontend handleSignup function

const handleSignup = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    // 1. ZOD VALIDATION: formData ko check karo
    const result = signupSchema.safeParse(formData);

    if (!result.success) {
      setErrors(result.error.format());
      setLoading(false);
      return;
    }

    // 2. BACKEND API CALL (If Validation is successful)
    try {
      // result.data mein Zod ka verified clean data hota hai
      const response = await axios.post(`${API_URL}/auth/signup`, result.data);
      
      // 3. Token aur merchant data localStorage me save karo
      localStorage.setItem("token", response.data.token);
      
      console.log("Signup Success:", response.data);
      setLoading(false);
      
      // 4. Success ke baad onboarding pe bhejo (Jaisa humara masterplan tha)
      router.push("/onboarding"); 
      
    } catch (error: any) {
      setLoading(false);
      // Agar backend se koi error aaye (jaise Email already exists) toh alert dikhao
      alert(error.response?.data?.message || "Signup failed. Please try again.");
    }
  };

  return (
    // CORRECTION 1: Parent Wrapper (Grid Layout)
    <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center p-6 mt-10">
      
      {/* Left Side - Benefits */}
      <div className="relative z-10 bg-teal-800 text-white p-10 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-2 mb-8">
          <FaWhatsapp className="text-4xl text-yellow-300" />
          <span className="text-2xl font-bold">WA-Automations</span>
        </div>
        
        <h1 className="text-4xl font-bold mb-6 leading-tight">
          Start recovering abandoned carts today.
        </h1>
        <p className="text-lg text-teal-100 mb-8">
          Join 500+ e-commerce stores generating ₹2.5Cr+ in recovered revenue.
        </p>

        <div className="space-y-4">
          <div className="flex items-center">
            <FaCheckCircle className="text-yellow-300 text-xl mr-4" />
            <span className="text-lg">Get ₹200 Free Credits instantly</span>
          </div>
          <div className="flex items-center">
            <FaCheckCircle className="text-yellow-300 text-xl mr-4" />
            <span className="text-lg">Setup takes less than 2 minutes</span>
          </div>
          <div className="flex items-center">
            <FaCheckCircle className="text-yellow-300 text-xl mr-4" />
            <span className="text-lg">No Meta API approval required</span>
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Create your account</h2>
        <p className="text-gray-500 mb-8">Start your free trial. No credit card required.</p>

        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
            <input 
              type="text" 
              name="brandName" 
              value={formData.brandName}
              onChange={handleChange}
              placeholder="e.g. SneakerHub"
              className={`w-full p-3 border rounded-lg outline-none transition ${errors.brandName ? 'border-red-500' : 'border-gray-300 focus:ring-2 focus:ring-teal-500'}`}
            />
            {/* Error Message Dikhane ka tarika */}
            {errors.brandName && <p className="text-red-500 text-xs mt-1">{errors.brandName._errors[0]}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input 
              type="email" 
              name="email" 
              value={formData.email}
              onChange={handleChange}
              placeholder="you@company.com"
              className={`w-full p-3 border rounded-lg outline-none transition ${errors.email ? 'border-red-500' : 'border-gray-300 focus:ring-2 focus:ring-teal-500'}`}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email._errors[0]}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Support Number</label>
            <input 
              type="tel" 
              name="phone" 
              value={formData.phone}
              onChange={handleChange}
              placeholder="+91 98765XXXXX"
              className={`w-full p-3 border rounded-lg outline-none transition ${errors.phone ? 'border-red-500' : 'border-gray-300 focus:ring-2 focus:ring-teal-500'}`}
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone._errors[0]}</p>}
          </div>

          <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>

  <div className="relative">
    <input 
      type={showPassword ? "text" : "password"}
      name="password" 
      value={formData.password}
      onChange={handleChange}
      placeholder="••••••••"
      className={`w-full p-3 border rounded-lg outline-none transition pr-12 ${
        errors.password 
          ? 'border-red-500' 
          : 'border-gray-300 focus:ring-2 focus:ring-teal-500'
      }`}
    /> 

    {/* Toggle Button */}
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700"
    >
      {showPassword ? "Hide" : "Show"}
    </button>
  </div>

  {errors.password && (
    <p className="text-red-500 text-xs mt-1">
      {errors.password._errors[0]}
    </p>
  )}
</div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-teal-700 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-800 focus:ring-4 focus:ring-teal-300 transition duration-300 flex justify-center items-center disabled:opacity-70 mt-4"
          >
            {loading ? <span className="animate-pulse">Creating Account...</span> : <>Create Account <FaArrowRight className="ml-2" /></>}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-teal-700 hover:text-teal-800 transition">
            Log in instead
          </Link>
        </p>

        <div className="mt-6 flex items-center justify-center text-xs text-gray-400">
          <FaShieldAlt className="mr-1" />
          <span>256-bit secure encryption</span>
        </div>
      </div>
    </div>
  );
}