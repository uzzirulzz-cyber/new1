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

export const metadata: Metadata = {
  title: "BLOCKEXCHANGE — Institutional Crypto Trading Platform",
  description:
    "BLOCKEXCHANGE is a premium institutional-grade cryptocurrency exchange: spot, futures, options, copy trading, staking and launchpad with real-time analytics and enterprise security.",
  keywords: ["crypto exchange", "spot trading", "futures", "options", "copy trading", "staking", "launchpad", "BLOCKEXCHANGE"],
  icons: { icon: "/blockexchange-logo.png" },
  openGraph: {
    title: "BLOCKEXCHANGE — Trade. Invest. Grow.",
    description: "Institutional-grade cryptocurrency trading platform",
    type: "website",
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
