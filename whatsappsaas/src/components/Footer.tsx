"use client";

import Link from "next/link";
import { FaBolt, FaWhatsapp } from "react-icons/fa";
import { usePathname } from "next/navigation";

const WHATSAPP_URL = "https://wa.me/919421095835";

const Footer = () => {
  const pathname = usePathname();

  if (
    pathname.includes("/dashboard") ||
    pathname.includes("/admin") ||
    pathname.includes("/onboarding")
  ) {
    return null;
  }


  return (
    <footer className="border-t border-white/[0.08] bg-app-950 py-7 text-gray-400 sm:py-9">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-5 text-center sm:flex-row sm:text-left">
          <Link href="/" className="flex items-center gap-2.5 text-white">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-wa text-black">
              <FaBolt aria-hidden="true" className="h-3.5 w-3.5" />
            </span>
            <span className="text-sm font-bold">WA-Auto Suite</span>
            <span className="hidden text-xs text-gray-500 sm:inline">Built for Indian Shopify Stores</span>
          </Link>

          <nav aria-label="Footer navigation" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs sm:gap-6">
            <Link href="/#pricing" className="transition hover:text-brand-wa">Pricing</Link>
            <Link href="/privacy-policy" className="transition hover:text-brand-wa">Privacy Policy</Link>
            <Link href="/login" className="transition hover:text-brand-wa">Login</Link>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-brand-wa transition hover:text-emerald-300"
            >
              <FaWhatsapp aria-hidden="true" className="h-3.5 w-3.5" /> Contact
            </a>
          </nav>
        </div>

        <div className="mt-6 border-t border-white/[0.08] pt-5 text-center text-[11px] text-gray-500 sm:text-left">
          &copy; {new Date().getFullYear()} WA-Auto. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
