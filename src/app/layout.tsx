import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import ConduitProvider from "@/components/conduit-provider";
import PortalTransitionProvider from "@/components/portal-transition";
import { ReadingModeProvider } from "@/components/reading-mode";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#030304",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  title: "Afterstill — Living Atlas of Literacy",
  description:
    "A mindblowing, aesthetic literacy showcase with an intelligent discovery and reading experience.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Afterstill",
  },
  openGraph: {
    title: "Afterstill — Living Atlas of Literacy",
    description: "A mindblowing, aesthetic literacy showcase with an intelligent discovery and reading experience.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${inter.variable} ${cormorant.variable} antialiased no-bounce`}>
        <ReadingModeProvider>
          <ConduitProvider />
          <PortalTransitionProvider>
            {children}
          </PortalTransitionProvider>
        </ReadingModeProvider>
      </body>
    </html>
  );
}
