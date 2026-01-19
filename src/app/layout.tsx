import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import ConduitProvider from "@/components/conduit-provider";
import PortalTransitionProvider from "@/components/portal-transition";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Afterstill — Living Atlas of Literacy",
  description:
    "A mindblowing, aesthetic literacy showcase with an intelligent discovery and reading experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${cormorant.variable} antialiased`}>
        <ConduitProvider />
        <PortalTransitionProvider>
          {children}
        </PortalTransitionProvider>
      </body>
    </html>
  );
}
