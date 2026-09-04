import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://blockexchange.io";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "BLOCKEXCHANGE — Institutional AI-Powered Crypto Trading Platform",
    template: "%s | BLOCKEXCHANGE",
  },
  description:
    "BLOCKEXCHANGE is a premium institutional-grade cryptocurrency exchange: spot, futures, options, copy trading, staking and launchpad with real-time analytics and enterprise security.",
  keywords: ["crypto exchange", "spot trading", "futures", "options", "copy trading", "staking", "launchpad", "institutional crypto", "BLOCKEXCHANGE"],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  icons: { icon: "/blockexchange-logo.png" },
  openGraph: {
    title: "BLOCKEXCHANGE — Trade. Invest. Grow.",
    description: "Institutional-grade AI-powered cryptocurrency trading platform",
    url: SITE_URL,
    siteName: "BLOCKEXCHANGE",
    type: "website",
    images: [{ url: "/blockexchange-logo.png", width: 512, height: 512, alt: "BLOCKEXCHANGE" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "BLOCKEXCHANGE — Institutional AI-Powered Crypto Trading",
    description: "Spot · Futures · Options · Copy Trading · Staking — enterprise security, real-time analytics.",
    images: ["/blockexchange-logo.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#050B18",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${display.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        {children}
        <Toaster />
        <SonnerToaster position="top-right" theme="dark" toastOptions={{
          style: {
            background: 'rgba(8,18,33,0.95)',
            border: '1px solid rgba(0,163,255,0.25)',
            color: '#EAF2FF',
            backdropFilter: 'blur(12px)',
          },
        }} />
      </body>
    </html>
  );
}
