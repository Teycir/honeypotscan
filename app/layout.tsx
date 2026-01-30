import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://honeypotscan.pages.dev'),
  title: {
    default: "HoneypotScan - Free Crypto Scam Detection Tool",
    template: "%s | HoneypotScan"
  },
  description: "Free honeypot detection for Ethereum, Polygon, and Arbitrum smart contracts. Scan tokens for scams before you buy. Instant results, 100% free, no API keys needed.",
  keywords: ["honeypot scanner", "crypto scam detection", "token scanner", "smart contract analysis", "ethereum scanner", "polygon scanner", "arbitrum scanner", "rug pull detection", "crypto security", "token safety", "scam token", "honeypot detection"],
  authors: [{ name: "Teycir Ben Soltane", url: "https://teycirbensoltane.tn" }],
  creator: "Teycir Ben Soltane",
  publisher: "HoneypotScan",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png" }
    ],
    apple: "/apple-touch-icon.png"
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://honeypotscan.pages.dev",
    title: "HoneypotScan - Free Crypto Scam Detection Tool",
    description: "Free honeypot detection for Ethereum, Polygon, and Arbitrum. Scan tokens for scams before you buy. Instant results, 100% free.",
    siteName: "HoneypotScan",
  },
  twitter: {
    card: "summary_large_image",
    title: "HoneypotScan - Free Crypto Scam Detection",
    description: "Free honeypot detection for Ethereum, Polygon, and Arbitrum. Scan tokens before you buy.",
    creator: "@HoneypotScan"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: "https://honeypotscan.pages.dev"
  },
  category: "Security",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="HoneypotScan" />
        <meta name="application-name" content="HoneypotScan" />
        <meta name="theme-color" content="#3b82f6" />
        <link rel="manifest" href="/manifest.json" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "HoneypotScan",
              "applicationCategory": "SecurityApplication",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "description": "Free honeypot detection tool for Ethereum, Polygon, and Arbitrum smart contracts. Scans for malicious patterns before you invest.",
              "url": "https://honeypotscan.pages.dev",
              "author": {
                "@type": "Person",
                "name": "Teycir Ben Soltane",
                "url": "https://teycirbensoltane.tn"
              },
              "featureList": [
                "tx.origin Detection",
                "Hidden Fee Scanner",
                "Transfer Restrictions",
                "Multi-chain Support",
                "Instant Results",
                "100% Free"
              ]
            })
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
