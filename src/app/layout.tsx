import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import ConduitProvider from "@/components/conduit-provider";
import PortalTransitionProvider from "@/components/portal-transition";
import { ReadingModeProvider } from "@/components/reading-mode";
import { PWAProvider } from "@/components/pwa-provider";
import { PWAUI } from "@/components/pwa-ui";
import { ConsciousnessProvider } from "@/components/consciousness-provider";
import { TemporalGlow, TemporalWelcome } from "@/components/temporal-ui";
import { PresenceGlow } from "@/components/presence-indicator";
import { KeyboardRitualsProvider } from "@/components/keyboard-rituals-provider";
import { ThemeSoftener } from "@/components/theme-softener";
import { FloatingOrbs } from "@/components/visual-effects";
import { ToastProvider } from "@/components/toast";
import {
  generateSEOMetadata,
  generateOrganizationSchema,
  generateWebsiteSchema,
} from "@/lib/seo";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f5" },
    { media: "(prefers-color-scheme: dark)", color: "#030304" },
  ],
  colorScheme: "dark light",
};

export const metadata: Metadata = {
  ...generateSEOMetadata({}),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Afterstill",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  other: {
    "google-site-verification": process.env.GOOGLE_SITE_VERIFICATION || "",
  },
};

// JSON-LD Structured Data
const jsonLd = {
  organization: generateOrganizationSchema(),
  website: generateWebsiteSchema(),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd.organization),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd.website),
          }}
        />
      </head>
      <body className={`${inter.variable} ${cormorant.variable} antialiased no-bounce`}>
        {/* Skip to main content link for keyboard accessibility */}
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        
        <PWAProvider>
          <ThemeSoftener />
          <FloatingOrbs count={4} />
          <PWAUI />
          <ConsciousnessProvider>
            <ToastProvider>
            <TemporalGlow />
            <PresenceGlow />
            <KeyboardRitualsProvider>
              <ReadingModeProvider>
                <ConduitProvider />
                <PortalTransitionProvider>
                  <main id="main-content" tabIndex={-1}>
                    {children}
                  </main>
                </PortalTransitionProvider>
              </ReadingModeProvider>
            </KeyboardRitualsProvider>
            </ToastProvider>
          </ConsciousnessProvider>
        </PWAProvider>
      </body>
    </html>
  );
}
