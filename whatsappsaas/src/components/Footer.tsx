"use client";

import Link from "next/link";
import Image from "next/image";
import { FaArrowRight, FaWhatsapp } from "react-icons/fa";
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
    <>
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat with WA-Auto support on WhatsApp"
        className="fixed bottom-4 right-4 z-[60] inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 text-sm font-bold text-black shadow-lg shadow-black/30 transition hover:scale-[1.03] hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-wa sm:bottom-6 sm:right-6"
      >
        <FaWhatsapp aria-hidden="true" className="h-5 w-5" />
        <span className="hidden sm:inline">WhatsApp support</span>
      </a>

    <footer className="border-t border-white/[0.08] bg-app-950 text-gray-400">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:gap-x-8 lg:grid-cols-12 lg:gap-8">
          <div className="col-span-2 lg:col-span-5">
            <Link href="/" className="brand-logo-flow relative inline-flex" aria-label="WA-Auto home">
              <Image
                src="/wa-logo.png"
                alt="WA-Auto"
                width={260}
                height={86}
                className="relative z-10 h-12 w-auto object-contain sm:h-14"
              />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-gray-400">
              Recover Shopify revenue with WhatsApp automation, customer messaging, and campaign tools built for growing stores.
            </p>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-lg border border-brand-wa/25 bg-brand-wa/5 px-3.5 py-2.5 text-sm font-semibold text-brand-wa transition hover:border-brand-wa/50 hover:bg-brand-wa/10"
            >
              <FaWhatsapp aria-hidden="true" className="h-4 w-4" /> Chat with our team
            </a>
          </div>

          <div className="lg:col-span-2">
            <h2 className="mb-4 text-xs font-bold uppercase text-white">Platform</h2>
            <nav aria-label="Platform links" className="flex flex-col items-start gap-3 text-sm">
              <Link href="/#deep-features" className="transition hover:text-brand-wa">Features</Link>
              <Link href="/#simulator" className="transition hover:text-brand-wa">Live simulator</Link>
              <Link href="/#inbox" className="transition hover:text-brand-wa">Omnichannel inbox</Link>
              <Link href="/#calculator" className="transition hover:text-brand-wa">ROI calculator</Link>
            </nav>
          </div>

          <div className="lg:col-span-2">
            <h2 className="mb-4 text-xs font-bold uppercase text-white">Explore</h2>
            <nav aria-label="Explore links" className="flex flex-col items-start gap-3 text-sm">
              <Link href="/#leaks" className="transition hover:text-brand-wa">Revenue leaks</Link>
              <Link href="/#how-it-works" className="transition hover:text-brand-wa">How it works</Link>
              <Link href="/#pricing" className="transition hover:text-brand-wa">Pricing</Link>
              <Link href="/#faq" className="transition hover:text-brand-wa">FAQs</Link>
            </nav>
          </div>

          <div className="col-span-2 lg:col-span-3">
            <h2 className="mb-4 text-xs font-bold uppercase text-white">Get Started</h2>
            <nav aria-label="Account and policy links" className="grid grid-cols-2 items-start gap-x-4 gap-y-3 text-sm">
              <Link href="https://www.wautomation.shop/signup" className="inline-flex items-center gap-2 text-brand-wa transition hover:text-emerald-300">
                Create an account <FaArrowRight aria-hidden="true" className="h-3 w-3" />
              </Link>
              <Link href="/login" className="transition hover:text-brand-wa">Log in</Link>
              <Link href="/privacy-policy" className="transition hover:text-brand-wa">Privacy policy</Link>
              <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="transition hover:text-brand-wa">Contact support</a>
            </nav>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/[0.08] pt-5 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} WA-Auto. All rights reserved.</p>
          <p>Built for Indian Shopify stores.</p>
        </div>
      </div>
    </footer>
    </>
  );
};

export default Footer;
