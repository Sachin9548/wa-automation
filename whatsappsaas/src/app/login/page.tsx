"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FaArrowRight } from "react-icons/fa";
import axios from "axios";
import { loginSchema, LoginFormData } from "../../lib/validations";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const SIGNUP_URL = "https://www.wautomation.shop/signup";
const WHATSAPP_URL = "https://wa.me/919421095835";

export default function LoginPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const handleLogin = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSubmitError("");

    // FIX 2: Zod Validation pehle karo (Axios se pehle)
    const result = loginSchema.safeParse(formData);

    if (!result.success) {
      setErrors(Object.fromEntries(result.error.issues.map((issue) => [issue.path[0] as keyof LoginFormData, issue.message])));
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/auth/login`, result.data);

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("merchant", JSON.stringify(response.data.merchant));

      setLoading(false);
      router.push("/dashboard");
    } catch (error: unknown) {
      const apiMessage = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message
        : undefined;
      setSubmitError(apiMessage || "Login failed. Check your details and try again.");
      setLoading(false);
    }
  };

  return (
    <section className="relative isolate flex flex-1 items-center overflow-hidden px-4 py-8 sm:px-6 sm:py-14">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-grid-mesh" />
      <div className="pointer-events-none absolute left-1/2 top-10 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-brand-wa/10 blur-[120px]" />
      <div className="mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-white/10 bg-app-900/90 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-9">
      <div className="flex flex-col items-center justify-center text-center">
        <Link
          href="/"
          className="brand-logo-flow relative mb-5 inline-flex"
          aria-label="WA-Auto home"
        >
          <Image src="/wa-logo.png" alt="WA-Auto" width={260} height={86} className="relative z-10 h-12 w-auto object-contain sm:h-14" />
        </Link>
        <h1 className="text-3xl font-extrabold text-white">Welcome back</h1>
        <p className="mt-2 text-sm text-gray-400">
          Sign in to manage your WhatsApp campaigns
        </p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleLogin}>
        {submitError && <p role="alert" className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">{submitError}</p>}
        <div className="space-y-5">
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-gray-200 mb-1">
              Email Address
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full rounded-lg border bg-app-950 p-3 text-white placeholder:text-gray-600 outline-none transition focus:ring-2 focus:ring-brand-wa/60 ${errors.email ? "border-red-500" : "border-white/10 focus:border-brand-wa/60"}`}
              placeholder="admin@yourstore.com"
            />
            {errors.email && (
              <p role="alert" className="text-rose-300 text-xs mt-1">
                {errors.email}
              </p>
            )}
          </div>

          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="login-password" className="block text-sm font-medium text-gray-200">
                Password
              </label>
              <Link
                href={`${WHATSAPP_URL}?text=I%20need%20help%20resetting%20my%20WA-Auto%20password`}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-brand-wa hover:text-emerald-300"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full rounded-lg border bg-app-950 p-3 text-white placeholder:text-gray-600 outline-none transition pr-12 focus:ring-2 focus:ring-brand-wa/60 ${errors.password ? "border-red-500" : "border-white/10 focus:border-brand-wa/60"}`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 pt-6 transform -translate-y-1/2 text-sm text-gray-400 hover:text-white"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
            {errors.password && (
              <p role="alert" className="text-rose-300 text-xs mt-1">
                {errors.password}
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-wa text-black font-bold py-3 px-4 rounded-lg hover:bg-emerald-400 focus:ring-4 focus:ring-brand-wa/30 transition duration-300 flex justify-center items-center disabled:opacity-70 mt-2"
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
        <p className="text-sm text-gray-400">
          {/* CORRECTION 3: Escaped Quote */}
          Don&apos;t have an account?{" "}
          <Link
            href={SIGNUP_URL}
            className="font-bold text-brand-wa hover:text-emerald-300 transition"
          >
            Start your free trial
          </Link>
        </p>
      </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 text-center">
        <div className="rounded-xl border border-white/10 bg-app-900/70 px-3 py-4">
          <p className="text-sm font-semibold text-white">Campaigns</p>
          <p className="mt-1 text-xs leading-5 text-gray-400">Manage WhatsApp outreach and follow-ups.</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-app-900/70 px-3 py-4">
          <p className="text-sm font-semibold text-white">Store insights</p>
          <p className="mt-1 text-xs leading-5 text-gray-400">Track messages, customers, and recovered sales.</p>
        </div>
      </div>
      </div>
    </section>
  );
}
