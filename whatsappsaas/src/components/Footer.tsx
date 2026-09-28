"use client";

import Link from "next/link";
import Image from "next/image";
import { FaWhatsapp } from "react-icons/fa";
import { usePathname } from "next/navigation";

const WHATSAPP_URL = "https://wa.me/919421095835";

const Footer = () => {
  const pathname = usePathname();

  // Agar user in pages par hai, toh Navbar return mat karo (Hide kardo)
  if (
    pathname.includes("/dashboard") ||
    pathname.includes("/admin") ||
    pathname.includes("/onboarding")
  ) {
    return null;
  }


  return (
    <footer className="bg-app-950 text-gray-300 py-12 lg:py-16 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Section: Grid Layout for better responsiveness */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8">
          {/* Column 1: Branding & Tagline (Takes wider space) */}
          <div className="md:col-span-12 lg:col-span-6">
            <Link href="/" className="flex items-center space-x-2 mb-6">
              <Image
                src="/wa-logo.png"
                alt="WA-Automations"
                width={280}
                height={84}
                className="h-14 w-auto"
              />
            </Link>

            <p className="text-gray-400 text-base max-w-md leading-relaxed mb-8">
              Send bulk WhatsApp marketing messages and transactional
              notifications to your customers using WhatsApp Cloud API. Recover
              carts effortlessly.
            </p>

            <div>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-brand-wa hover:text-emerald-300 transition"
              >
                <FaWhatsapp size={20} />
                <span>Chat with our team</span>
              </a>
            </div>
          </div>

          {/* Column 2: Main Menu */}
          <div className="md:col-span-6 lg:col-span-3">
            <h4 className="text-xl font-bold text-white mb-6">Main Menu</h4>
            <ul className="space-y-4">
              {[
                { label: "Home", href: "/" },
                { label: "Features", href: "/#deep-features" },
                { label: "How it Works", href: "/#how-it-works" },
                { label: "Pricing", href: "/#pricing" },
                { label: "FAQ", href: "/#faq" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="hover:text-white hover:translate-x-1 inline-block transition-all duration-300"
                  >
                    {item.label}
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
                <Link
                  href="/privacy-policy"
                  className="hover:text-white hover:translate-x-1 inline-block transition-all duration-300"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white hover:translate-x-1 inline-block transition-all duration-300"
                >
                  Contact Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section: Copyright */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} WA-Automations. All rights
            reserved.
          </p>
          <div className="text-gray-500 text-sm">
            Designed for E-commerce Growth 🚀
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
