"use client";
import Link from "next/link";
import { useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import { usePathname } from "next/navigation";

const Navbar = () => {
  const pathname = usePathname();
  
  if (pathname.includes("/dashboard") || pathname.includes("/admin") || pathname.includes("/onboarding")) {
    return null; 
  }
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Handler to scroll smoothly to the target section based on the anchor's href
  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const targetId = e.currentTarget.getAttribute("href");
    if (targetId && targetId !== "#") {
      const element = document.querySelector(targetId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setIsMenuOpen(false); // Close mobile menu after clicking
  };

  return (
    // Sticky aur Glassmorphism (blur) effect lagaya hai taaki scroll karne par achha dikhe
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Left Side: Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-2xl font-extrabold text-teal-700 tracking-tight">
              WA-Automations
            </Link>
          </div>
          
          {/* Center: Desktop Menu */}
          <div className="hidden md:flex space-x-8">
            <a href="#" onClick={handleSmoothScroll} className="text-gray-600 hover:text-teal-700 font-medium transition">Home</a>
            <a href="#features" onClick={handleSmoothScroll} className="text-gray-600 hover:text-teal-700 font-medium transition">Features</a>
            <a href="#howitworks" onClick={handleSmoothScroll} className="text-gray-600 hover:text-teal-700 font-medium transition">How it Works</a>
            <a href="#pricing" onClick={handleSmoothScroll} className="text-gray-600 hover:text-teal-700 font-medium transition">Pricing</a>
            <a href="#faq" onClick={handleSmoothScroll} className="text-gray-600 hover:text-teal-700 font-medium transition">FAQ</a>
          </div>

          {/* Right Side: Desktop Login/Signup Buttons (Wrapped in a div) */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/login" className="text-teal-700 font-bold hover:text-teal-800 transition px-2">
              Login
            </Link>
            <Link href="/signup" className="bg-teal-700 text-white font-bold rounded-full px-6 py-2.5 hover:bg-teal-800 shadow-md hover:shadow-lg transition duration-300">
              Sign Up
            </Link>
          </div>

          {/* Mobile Menu Button (Hamburger) */}
          <div className="md:hidden flex items-center">
            <button 
              className="text-gray-800 hover:text-teal-700 focus:outline-none transition"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <FaTimes size={28} /> : <FaBars size={28} />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-xl absolute w-full left-0">
          <div className="px-4 pt-2 pb-6 space-y-1 flex flex-col">
            <a href="#" onClick={handleSmoothScroll} className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-teal-700 hover:bg-teal-50 rounded-lg">Home</a>
            <a href="#features" onClick={handleSmoothScroll} className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-teal-700 hover:bg-teal-50 rounded-lg">Features</a>
            <a href="#howitworks" onClick={handleSmoothScroll} className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-teal-700 hover:bg-teal-50 rounded-lg">How it Works</a>
            <a href="#pricing" onClick={handleSmoothScroll} className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-teal-700 hover:bg-teal-50 rounded-lg">Pricing</a>
            <a href="#faq" onClick={handleSmoothScroll} className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-teal-700 hover:bg-teal-50 rounded-lg">FAQ</a>
            
            {/* Mobile Login & Signup Buttons */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-3 px-2">
              <Link href="/login" onClick={() => setIsMenuOpen(false)} className="w-full border-2 border-teal-700 text-teal-700 font-bold rounded-full px-5 py-3 text-center hover:bg-teal-50 transition">
                Login
              </Link>
              <Link href="/signup" onClick={() => setIsMenuOpen(false)} className="w-full bg-teal-700 text-white font-bold rounded-full px-5 py-3 text-center hover:bg-teal-800 shadow-md transition">
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