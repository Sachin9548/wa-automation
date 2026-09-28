import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WA-Auto | WhatsApp & Instagram Revenue Recovery Suite for Shopify",

  description: "Recover abandoned carts with WhatsApp instantly.",
  icons: {
    icon: [{ url: "/wa-logo.png", type: "image/png" }],
    shortcut: ["/wa-logo.png"],
    apple: [{ url: "/wa-logo.png", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jakartaSans.variable} ${jetbrainsMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col">
        
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
