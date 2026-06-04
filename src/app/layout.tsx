import type { Metadata, Viewport } from "next";
import { Noto_Sans_Telugu, Inter } from "next/font/google";
import { LangProvider } from "@/context/LangContext";
import { LangDocumentSync } from "@/components/LangDocumentSync";
import { PWARegister } from "@/components/PWARegister";
import { PWA_CAPTURE_SCRIPT } from "@/lib/pwa-install-store";
import Script from "next/script";
import "./globals.css";

const notoTelugu = Noto_Sans_Telugu({
  subsets: ["telugu", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-noto-telugu",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RAVALI TRADERS — Contractor Recognition",
  description: "Amount-based contractor rewards dashboard powered by Supabase",
  metadataBase: process.env.NEXT_PUBLIC_APP_URL
    ? new URL(
        process.env.NEXT_PUBLIC_APP_URL.startsWith("http")
          ? process.env.NEXT_PUBLIC_APP_URL
          : `https://${process.env.NEXT_PUBLIC_APP_URL}`
      )
    : undefined,
  applicationName: "RAVALI TRADERS",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.ico",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "RAVALI TRADERS",
  },
  other: {
    google: "notranslate",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a2744",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="te"
      translate="no"
      className={`notranslate ${notoTelugu.variable} ${inter.variable} h-full bg-white`}
    >
      <head>
        <meta name="google" content="notranslate" />
        <Script id="ravali-pwa-capture" strategy="beforeInteractive">
          {PWA_CAPTURE_SCRIPT}
        </Script>
      </head>
      <body className="notranslate min-h-full flex flex-col bg-white font-sans text-gray-900 antialiased">
        <LangProvider>
          <LangDocumentSync />
          {children}
        </LangProvider>
        <PWARegister />
      </body>
    </html>
  );
}
