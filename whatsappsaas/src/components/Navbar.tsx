"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import { usePathname, useRouter } from "next/navigation";

const SIGNUP_URL = "https://www.wautomation.shop/signup";
const WHATSAPP_URL = "https://wa.me/919421095835";

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (
    pathname.includes("/dashboard") ||
    pathname.includes("/admin") ||
    pathname.includes("/onboarding")
  ) {
    return null;
  }

  // Handler to scroll smoothly to the target section based on the anchor's href
  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const targetId = e.currentTarget.getAttribute("href");
    if (targetId === "#") {
      if (pathname !== "/") {
        router.push("/");
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else if (targetId) {
      if (pathname !== "/") {
        router.push(`/${targetId}`);
      } else {
        const element = document.querySelector(targetId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
    setIsMenuOpen(false); // Close mobile menu after clicking
  };

  return (
    // Sticky aur Glassmorphism (blur) effect lagaya hai taaki scroll karne par achha dikhe
    <nav className="sticky top-0 z-50 bg-app-950/90 backdrop-blur-xl border-b border-white/10 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Left Side: Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
              <Image
                src="/wa-logo.png"
                alt="WA-Automations"
                width={240}
                height={72}
                className="h-12 w-auto"
              />
            </Link>
          </div>

          {/* Center: Desktop Menu */}
          <div className="hidden md:flex space-x-8">
            <a
              href="#"
              onClick={handleSmoothScroll}
              className="text-gray-300 hover:text-brand-wa font-medium transition"
            >
              Home
            </a>
            <a
              href="#deep-features"
              onClick={handleSmoothScroll}
              className="text-gray-300 hover:text-brand-wa font-medium transition"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={handleSmoothScroll}
              className="text-gray-300 hover:text-brand-wa font-medium transition"
            >
              How it Works
            </a>
            <a
              href="#faq"
              onClick={handleSmoothScroll}
              className="text-gray-300 hover:text-brand-wa font-medium transition"
            >
              Pricing
            </a>
            <a
              href="#pricing"
              onClick={handleSmoothScroll}
              className="text-gray-300 hover:text-brand-wa font-medium transition"
            >
              FAQ
            </a>
          </div>

          {/* Right Side: Desktop Login/Signup Buttons (Wrapped in a div) */}
          <div className="hidden md:flex items-center space-x-4">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="text-gray-300 font-semibold hover:text-brand-wa transition px-2"
            >
              WhatsApp
            </a>
            <Link
              href="/login"
              className="text-gray-200 font-bold hover:text-brand-wa transition px-2"
            >
              Login
            </Link>
            <Link
              href={SIGNUP_URL}
              className="bg-brand-wa text-black font-bold rounded-xl px-6 py-2.5 hover:bg-emerald-400 shadow-md transition duration-300"
            >
              Sign Up
            </Link>
          </div>

          {/* Mobile Menu Button (Hamburger) */}
          <div className="md:hidden flex items-center">
            <button
              className="text-gray-200 hover:text-brand-wa focus:outline-none transition"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <FaTimes size={28} /> : <FaBars size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden bg-app-950 border-t border-white/10 shadow-xl absolute w-full left-0">
          <div className="px-4 pt-2 pb-6 space-y-1 flex flex-col">
            <a
              href="#"
              onClick={handleSmoothScroll}
              className="block px-4 py-3 text-base font-medium text-gray-200 hover:text-brand-wa hover:bg-white/5 rounded-lg"
            >
              Home
            </a>
            <a
              href="#deep-features"
              onClick={handleSmoothScroll}
              className="block px-4 py-3 text-base font-medium text-gray-200 hover:text-brand-wa hover:bg-white/5 rounded-lg"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={handleSmoothScroll}
              className="block px-4 py-3 text-base font-medium text-gray-200 hover:text-brand-wa hover:bg-white/5 rounded-lg"
            >
              How it Works
            </a>
            <a
              href="#faq"
              onClick={handleSmoothScroll}
              className="block px-4 py-3 text-base font-medium text-gray-200 hover:text-brand-wa hover:bg-white/5 rounded-lg"
            >
              Pricing
            </a>
            <a
              href="#pricing"
              onClick={handleSmoothScroll}
              className="block px-4 py-3 text-base font-medium text-gray-200 hover:text-brand-wa hover:bg-white/5 rounded-lg"
            >
              FAQ
            </a>

            {/* Mobile Login & Signup Buttons */}
            <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-3 px-2">
              <Link
                href="/login"
                onClick={() => setIsMenuOpen(false)}
                className="w-full border border-white/15 text-gray-100 font-bold rounded-xl px-5 py-3 text-center hover:bg-white/5 transition"
              >
                Login
              </Link>
              <Link
                href={SIGNUP_URL}
                onClick={() => setIsMenuOpen(false)}
                className="w-full bg-brand-wa text-black font-bold rounded-xl px-5 py-3 text-center hover:bg-emerald-400 shadow-md transition"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
