import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WA-Automations | WhatsApp Marketing",
  description: "Recover abandoned carts with WhatsApp instantly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        
        {/* 1. Navbar hamesha top par rahega */}
        <Navbar />

        {/* 2. flex-grow lagane se ye beech ka hissa poori bachi hui screen cover kar lega */}
        <main className="flex-grow">
          {children}
        </main>

        {/* 3. Footer hamesha bottom par rahega */}
        <Footer />

      </body>
    </html>
  );
}
