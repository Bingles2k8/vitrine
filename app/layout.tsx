import type { Metadata } from "next";
import { Geist, DM_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import CookieBanner from "@/components/CookieBanner";
import Providers from "@/components/Providers";
import { rootMetadata } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = rootMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB">
      <head>
        <Script id="theme-detect" strategy="beforeInteractive">{`try{var t=localStorage.getItem('theme');if(t==='dark'||((!t||t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`}</Script>
      </head>
      <body
        className={`${geistSans.variable} ${dmSans.variable} antialiased`}
      >
        <Providers>
          {children}
          <CookieBanner />
        </Providers>
      </body>
    </html>
  );
}
