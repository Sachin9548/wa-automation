"use client";

import Link from "next/link";
import { FaWhatsapp, FaTwitter, FaLinkedin, FaInstagram } from "react-icons/fa";
import { usePathname } from "next/navigation";

const Footer = () => {
  const pathname = usePathname();
  
  // Agar user in pages par hai, toh Navbar return mat karo (Hide kardo)
  if (pathname.includes("/dashboard") || pathname.includes("/admin") || pathname.includes("/onboarding")) {
    return null; 
  }
  return (
    <footer className="bg-teal-900 text-teal-100 py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Section: Grid Layout for better responsiveness */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8">
          
          {/* Column 1: Branding & Tagline (Takes wider space) */}
          <div className="md:col-span-12 lg:col-span-6">
            <Link href="/" className="flex items-center space-x-2 mb-6">
              <FaWhatsapp className="text-3xl text-green-400" />
              <span className="text-3xl font-extrabold text-white tracking-tight">WA-Automations</span>
            </Link>
            <p className="text-teal-200 text-lg max-w-md leading-relaxed mb-8">
              Send bulk WhatsApp marketing messages and transactional notifications to your customers using WhatsApp Cloud API. Recover carts effortlessly.
            </p>
            
            {/* Social Media Icons */}
            <div className="flex space-x-5">
              <a href="#" className="text-teal-300 hover:text-white transition transform hover:scale-110">
                <span className="sr-only">Twitter</span>
                <FaTwitter size={24} />
              </a>
              <a href="#" className="text-teal-300 hover:text-white transition transform hover:scale-110">
                <span className="sr-only">LinkedIn</span>
                <FaLinkedin size={24} />
              </a>
              <a href="#" className="text-teal-300 hover:text-white transition transform hover:scale-110">
                <span className="sr-only">Instagram</span>
                <FaInstagram size={24} />
              </a>
            </div>
          </div>

          {/* Column 2: Main Menu */}
          <div className="md:col-span-6 lg:col-span-3">
            <h4 className="text-xl font-bold text-white mb-6">Main Menu</h4>
            <ul className="space-y-4">
              {['Home', 'About', 'Services', 'HowItWorks', 'Pricing', 'FAQ'].map((item) => (
                <li key={item}>
                  <Link 
                    href={item === 'Home' ? '#' : `#${item}`} 
                    className="hover:text-white hover:translate-x-1 inline-block transition-all duration-300"
                  >
                    {item === 'HowItWorks' ? 'How it Works?' : item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Policies */}
          <div className="md:col-span-6 lg:col-span-3">
            <h4 className="text-xl font-bold text-white mb-6">Our Policies</h4>
            <ul className="space-y-4">
              <li>
                <Link href="/terms" className="hover:text-white hover:translate-x-1 inline-block transition-all duration-300">
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white hover:translate-x-1 inline-block transition-all duration-300">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white hover:translate-x-1 inline-block transition-all duration-300">
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Section: Copyright */}
        <div className="mt-16 pt-8 border-t border-teal-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-teal-400 text-sm mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} WA-Automations. All rights reserved.
          </p>
          <div className="text-teal-400 text-sm">
            Designed for E-commerce Growth 🚀
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;