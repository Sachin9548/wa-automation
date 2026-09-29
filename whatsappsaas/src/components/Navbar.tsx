"use client";
import Link from "next/link";
import { useState } from "react";
import {
  FaArrowRight,
  FaBars,
  FaBolt,
  FaCalendarAlt,
  FaChevronRight,
  FaTimes,
  FaWhatsapp,
} from "react-icons/fa";
import { usePathname, useRouter } from "next/navigation";

const SIGNUP_URL = "https://www.wautomation.shop/signup";
const WHATSAPP_URL = "https://wa.me/919421095835";
const navigationItems = [
  { label: "4 Revenue Leaks", href: "#leaks" },
  { label: "Live Demo", href: "#simulator" },
  { label: "All Features", href: "#deep-features" },
  { label: "Omnichannel Inbox", href: "#inbox" },
  { label: "ROI Calculator", href: "#calculator" },
  { label: "Pricing", href: "#pricing" },
];

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

  const handleSectionClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = e.currentTarget.getAttribute("href");
    if (!target) return;

    if (pathname !== "/") {
      router.push(`/${target}`);
    } else {
      document.querySelector(target)?.scrollIntoView({ behavior: "smooth" });
    }
    setIsMenuOpen(false);
  };

  const sectionLinks = (mobile = false) =>
    navigationItems.map((item) => (
      <a
        key={item.href}
        href={item.href}
        onClick={handleSectionClick}
        className={
          mobile
            ? "flex items-center justify-between rounded-lg px-3 py-3 text-sm font-semibold text-gray-300 transition hover:bg-white/5 hover:text-brand-wa"
            : "whitespace-nowrap text-[11px] font-bold uppercase text-gray-300 transition hover:text-brand-wa"
        }
      >
        {item.label}
        {mobile && <FaChevronRight aria-hidden="true" className="h-3 w-3 text-gray-500" />}
      </a>
    ));

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-app-950/90 text-white backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:h-20 sm:px-6 lg:px-8">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5" onClick={() => setIsMenuOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-brand-wa/30 bg-brand-wa/10 text-brand-wa transition group-hover:bg-brand-wa group-hover:text-black sm:h-10 sm:w-10">
            <FaBolt aria-hidden="true" className="h-4 w-4" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="flex items-center gap-1.5 text-lg font-black sm:text-xl">
              WA<span className="text-brand-wa">Auto</span>
              <span className="rounded-full border border-brand-wa/25 bg-brand-wa/10 px-1.5 py-0.5 text-[8px] font-bold text-brand-wa">SHOPIFY</span>
            </span>
            <span className="text-[9px] font-medium text-gray-500">Revenue Engine</span>
          </span>
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-5 xl:flex">
          {sectionLinks()}
        </nav>

        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          <a
            href="#pricing"
            onClick={handleSectionClick}
            className="hidden items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-gray-300 transition hover:border-brand-wa/30 hover:text-white xl:inline-flex"
          >
            <FaCalendarAlt aria-hidden="true" className="h-3.5 w-3.5 text-brand-wa" />
            Schedule Setup
          </a>
          <Link
            href={SIGNUP_URL}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-wa px-4 py-2.5 text-xs font-black uppercase text-black shadow-lg shadow-brand-wa/15 transition hover:bg-emerald-400 sm:px-5"
          >
            Start Free <FaArrowRight aria-hidden="true" className="h-3 w-3" />
          </Link>
        </div>

        <button
          type="button"
          className="rounded-lg border border-white/10 p-2 text-gray-200 transition hover:border-brand-wa/40 hover:text-brand-wa lg:hidden"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
        >
          {isMenuOpen ? <FaTimes aria-hidden="true" className="h-5 w-5" /> : <FaBars aria-hidden="true" className="h-5 w-5" />}
        </button>
      </div>

      {isMenuOpen && (
        <div id="mobile-navigation" className="border-t border-white/10 bg-app-950 px-4 py-4 shadow-xl lg:hidden">
          <nav aria-label="Mobile navigation" className="flex flex-col">
            {sectionLinks(true)}
          </nav>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-4">
            <Link
              href="/login"
              onClick={() => setIsMenuOpen(false)}
              className="rounded-xl border border-white/15 px-4 py-3 text-center text-sm font-bold text-gray-100 transition hover:bg-white/5"
            >
              Login
            </Link>
            <Link
              href={SIGNUP_URL}
              onClick={() => setIsMenuOpen(false)}
              className="rounded-xl bg-brand-wa px-4 py-3 text-center text-sm font-black text-black transition hover:bg-emerald-400"
            >
              Sign Up
            </Link>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-gray-300 transition hover:border-brand-wa/30 hover:text-brand-wa"
            >
              <FaWhatsapp aria-hidden="true" className="h-4 w-4" /> Chat on WhatsApp
            </a>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
