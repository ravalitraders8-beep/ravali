import type { Metadata, Viewport } from "next";
import { Noto_Sans_Telugu, Inter } from "next/font/google";
import { LangProvider } from "@/context/LangContext";
import { PWARegister } from "@/components/PWARegister";
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
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "RAVALI TRADERS",
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
    <html lang="te" className={`${notoTelugu.variable} ${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-white font-sans text-gray-900 antialiased">
        <LangProvider>
          {children}
        </LangProvider>
        <PWARegister />
      </body>
    </html>
  );
}
