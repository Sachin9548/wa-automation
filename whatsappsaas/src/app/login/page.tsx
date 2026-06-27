"use client";
import { API_URL } from "@/lib/api";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaWhatsapp, FaArrowRight } from "react-icons/fa";
import axios from "axios";

import { loginSchema, LoginFormData } from "../../lib/validations";

export default function LoginPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const handleLogin = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    // FIX 2: Zod Validation pehle karo (Axios se pehle)
    const result = loginSchema.safeParse(formData);

    if (!result.success) {
      setErrors(result.error.format());
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/auth/login`, result.data);

      localStorage.setItem("token", response.data.token);

      setLoading(false);
      router.push("/dashboard");
    } catch (error: any) {
      setLoading(false);
      alert(error.response?.data?.message || "Login failed!");
    }
  };

  return (
    // CORRECTION 1: Parent Wrapper for Login
    <div className="max-w-md mx-auto mt-20 mb-20 p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
      <div className="flex flex-col items-center justify-center text-center">
        <Link
          href="/"
          className="flex items-center justify-center space-x-2 mb-6"
        >
          <div className="w-12 h-12 bg-teal-700 rounded-full flex items-center justify-center shadow-lg">
            <FaWhatsapp className="text-3xl text-white" />
          </div>
        </Link>
        <h2 className="text-3xl font-extrabold text-gray-900">Welcome back</h2>
        <p className="mt-2 text-sm text-gray-600">
          Sign in to manage your WhatsApp campaigns
        </p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleLogin}>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full p-3 border rounded-lg outline-none transition ${errors.email ? "border-red-500" : "border-gray-300 focus:ring-2 focus:ring-teal-500"}`}
              placeholder="admin@yourstore.com"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">
                {errors.email._errors[0]}
              </p>
            )}
          </div>

          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <Link
                href="#"
                className="text-sm font-medium text-teal-700 hover:text-teal-800"
              >
                Forgot password?
              </Link>
            </div>
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              className={`w-full p-3 border rounded-lg outline-none transition pr-12 ${
                errors.password
                  ? "border-red-500"
                  : "border-gray-300 focus:ring-2 focus:ring-teal-500"
              }`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 pt-6 transform -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">
                {errors.password._errors[0]}
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-teal-700 text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-800 focus:ring-4 focus:ring-teal-300 transition duration-300 flex justify-center items-center disabled:opacity-70 mt-2"
        >
          {loading ? (
            <span className="animate-pulse">Signing in...</span>
          ) : (
            <>
              Sign In <FaArrowRight className="ml-2" />
            </>
          )}
        </button>
      </form>

      <div className="text-center mt-6">
        <p className="text-sm text-gray-600">
          {/* CORRECTION 3: Escaped Quote */}
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-bold text-teal-700 hover:text-teal-800 transition"
          >
            Start your free trial
          </Link>
        </p>
      </div>
    </div>
  );
}
