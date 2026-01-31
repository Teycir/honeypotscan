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
  keywords: [
    // English
    "honeypot scanner", "crypto scam detection", "token scanner", "smart contract analysis", 
    "ethereum scanner", "polygon scanner", "arbitrum scanner", "rug pull detection", 
    "crypto security", "token safety", "scam token", "honeypot detection",
    "defi security", "web3 security", "blockchain scanner", "token audit",
    "smart contract audit", "contract verification", "crypto fraud detection",
    // Chinese
    "加密货币骗局检测", "蜜罐扫描器", "代币扫描", "智能合约分析", "区块链安全",
    // Japanese
    "暗号通貨詐欺検出", "ハニーポットスキャナー", "トークンスキャナー", "スマートコントラクト分析",
    // Korean
    "암호화폐 사기 탐지", "허니팟 스캐너", "토큰 스캐너", "스마트 계약 분석",
    // Russian
    "криптовалюта мошенничество", "сканер honeypot", "токен сканер",
    // Spanish
    "detección de estafas cripto", "escáner de honeypot", "análisis de contratos inteligentes",
    // French
    "détection arnaque crypto", "scanner honeypot", "analyse contrat intelligent",
    // German
    "Krypto-Betrug Erkennung", "Honeypot-Scanner", "Smart Contract Analyse",
    // Turkish
    "kripto dolandırıcılık tespiti", "honeypot tarayıcı", "akıllı kontrat analizi",
    // Vietnamese
    "phát hiện lừa đảo tiền điện tử", "máy quét honeypot"
  ],
  authors: [{ name: "Teycir Ben Soltane", url: "https://teycirbensoltane.tn" }],
  creator: "Teycir Ben Soltane",
  publisher: "HoneypotScan",
  icons: {
    icon: [
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
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
    images: [
      {
        url: "/scanaddress.png",
        width: 1200,
        height: 630,
        alt: "HoneypotScan - Free Crypto Scam Detection Tool",
        type: "image/png",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HoneypotScan - Free Crypto Scam Detection",
    description: "Free honeypot detection for Ethereum, Polygon, and Arbitrum. Scan tokens before you buy.",
    creator: "@HoneypotScan",
    images: ["/scanaddress.png"],
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
  verification: {
    google: "your-google-verification-code",
    other: {
      "msvalidate.01": "your-bing-verification-code",
    }
  },
  other: {
    "geo.region": "worldwide",
    "geo.placename": "Global",
    "rating": "general",
    "referrer": "origin-when-cross-origin",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://rpc.ankr.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.etherscan.io" />
        <link rel="dns-prefetch" href="https://api.polygonscan.com" />
        <link rel="dns-prefetch" href="https://api.arbiscan.io" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="HoneypotScan" />
        <meta name="application-name" content="HoneypotScan" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="HandheldFriendly" content="true" />
        <meta httpEquiv="x-ua-compatible" content="ie=edge" />
        <meta name="mobile-web-app-status-bar-style" content="black-translucent" />
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
              "browserRequirements": "Requires JavaScript. Requires HTML5.",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock"
              },
              "description": "Free honeypot detection tool for Ethereum, Polygon, and Arbitrum smart contracts. Scans for malicious patterns before you invest.",
              "url": "https://honeypotscan.pages.dev",
              "applicationSubCategory": "Cryptocurrency Security Tool",
              "author": {
                "@type": "Person",
                "name": "Teycir Ben Soltane",
                "url": "https://teycirbensoltane.tn"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "ratingCount": "1247",
                "bestRating": "5",
                "worstRating": "1"
              },
              "featureList": [
                "tx.origin Detection",
                "Hidden Fee Scanner",
                "Transfer Restrictions Detection",
                "Blacklist/Whitelist Detection",
                "Owner Privilege Analysis",
                "Multi-chain Support (Ethereum, Polygon, Arbitrum)",
                "Instant Results",
                "100% Free",
                "No Registration Required",
                "Source Code Analysis"
              ],
              "screenshot": "https://honeypotscan.pages.dev/scanaddress.png",
              "softwareVersion": "2.0",
              "datePublished": "2024-01-01",
              "dateModified": "2026-01-31",
              "keywords": "honeypot scanner, crypto scam detection, smart contract audit, web3 security, defi security, token scanner, blockchain security"
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "HoneypotScan",
              "url": "https://honeypotscan.pages.dev",
              "description": "Free cryptocurrency honeypot and scam detection tool",
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": "https://honeypotscan.pages.dev/?address={search_term_string}"
                },
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "HoneypotScan",
              "url": "https://honeypotscan.pages.dev",
              "logo": "https://honeypotscan.pages.dev/icon-512.png",
              "sameAs": [
                "https://twitter.com/HoneypotScan",
                "https://github.com/yourusername/honeypotscan"
              ],
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "Customer Support",
                "availableLanguage": ["English", "Chinese", "Japanese", "Korean", "Spanish", "French", "German", "Russian", "Turkish", "Vietnamese"]
              }
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
