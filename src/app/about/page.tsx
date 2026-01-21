"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface AboutSettings {
  siteName: string;
  aboutPronunciation: string;
  aboutSection1Title: string;
  aboutSection1Content: string;
  aboutSection2Title: string;
  aboutSection2Content: string;
  aboutSection3Title: string;
  aboutSection3Content: string;
  aboutSection4Title: string;
  aboutSection4Content: string;
  aboutQuote: string;
  aboutPrivacyNote: string;
  aboutEstYear: string;
  twitterUrl: string | null;
  githubUrl: string | null;
  instagramUrl: string | null;
  emailContact: string | null;
}

function parseHighlights(text: string) {
  // Convert **text** to highlighted spans
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) => 
    i % 2 === 1 
      ? <span key={i} className="text-purple-300">{part}</span>
      : part
  );
}

export default function AboutPage() {
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [settings, setSettings] = useState<AboutSettings | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    // Fetch settings
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => setSettings(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const section = Math.floor(scrollY / 300);
      setActiveSection(Math.min(section, 3));
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Loading state
  if (!settings) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border border-zinc-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const sections = [
    { num: "01", title: settings.aboutSection1Title, content: settings.aboutSection1Content },
    { num: "02", title: settings.aboutSection2Title, content: settings.aboutSection2Content },
    { num: "03", title: settings.aboutSection3Title, content: settings.aboutSection3Content },
    { num: "04", title: settings.aboutSection4Title, content: settings.aboutSection4Content },
  ];

  const socialLinks = [
    settings.twitterUrl && { name: "Twitter", url: settings.twitterUrl },
    settings.instagramUrl && { name: "Instagram", url: settings.instagramUrl },
    settings.githubUrl && { name: "GitHub", url: settings.githubUrl },
    settings.emailContact && { name: "Email", url: `mailto:${settings.emailContact}` },
  ].filter(Boolean) as { name: string; url: string }[];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0d0d14] to-[#0a0a0f] text-foreground relative">
      {/* Subtle ambient background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-violet-400/5 rounded-full blur-[100px]" />
      </div>
      
      {/* Ambient cursor glow */}
      <div
        className="cursor-glow"
        style={{
          left: mousePos.x,
          top: mousePos.y,
        }}
      />

      {/* Floating decorative elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className={`absolute w-1 h-1 rounded-full bg-purple-400/30 transition-all duration-1000 ${
            activeSection >= 1 ? "opacity-100" : "opacity-0"
          }`}
          style={{ left: "15%", top: "30%" }}
        />
        <div
          className={`absolute w-0.5 h-0.5 rounded-full bg-amber-300/20 transition-all duration-1000 ${
            activeSection >= 2 ? "opacity-100" : "opacity-0"
          }`}
          style={{ right: "20%", top: "45%" }}
        />
        <div
          className={`absolute w-1.5 h-1.5 rounded-full bg-blue-400/20 transition-all duration-1000 ${
            activeSection >= 3 ? "opacity-100" : "opacity-0"
          }`}
          style={{ left: "25%", bottom: "30%" }}
        />
      </div>

      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 px-8 py-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className={`text-[11px] tracking-[0.3em] uppercase text-muted/60 hover:text-foreground transition-colors duration-500 ${
              isLoaded ? "animate-slide" : "opacity-0"
            }`}
          >
            ← Back
          </Link>
          <div
            className={`text-[11px] tracking-[0.3em] uppercase text-muted/40 ${
              isLoaded ? "animate-slide" : "opacity-0"
            }`}
          >
            About
          </div>
        </div>
      </header>

      <main className="pt-40 pb-40 px-8">
        <div className="max-w-2xl mx-auto">
          {/* Title with decorative element */}
          <div className="relative mb-20">
            <div
              className={`absolute -left-8 top-1/2 w-4 h-px bg-foreground/20 ${
                isLoaded ? "animate-reveal" : "opacity-0"
              }`}
            />
            <h1
              className={`text-[clamp(2.2rem,6vw,4rem)] leading-[0.95] tracking-[-0.03em] ${
                isLoaded ? "animate-reveal" : "opacity-0"
              }`}
            >
              {settings.siteName}
            </h1>
            <p
              className={`text-muted/40 text-[13px] mt-4 tracking-wide ${
                isLoaded ? "animate-reveal delay-1" : "opacity-0"
              }`}
            >
              {settings.aboutPronunciation}
            </p>
          </div>

          {/* Main content sections */}
          <div className="space-y-14">
            {sections.map((section, index) => (
              <section
                key={section.num}
                className={`${isLoaded ? `animate-reveal delay-${index + 1}` : "opacity-0"}`}
              >
                <div className="flex items-center gap-4 mb-5">
                  <span className="text-[10px] text-purple-400/60 tracking-[0.3em] uppercase">
                    {section.num}
                  </span>
                  <span className="h-px flex-1 bg-purple-500/20" />
                </div>
                <h2 className="text-[18px] text-foreground mb-4 font-light">
                  {section.title}
                </h2>
                <p className="text-[16px] leading-[2] text-zinc-400">
                  {parseHighlights(section.content)}
                </p>
              </section>
            ))}
          </div>

          {/* Divider with symbol */}
          <div
            className={`my-20 flex items-center justify-center gap-6 ${
              isLoaded ? "animate-reveal delay-4" : "opacity-0"
            }`}
          >
            <span className="h-px w-16 bg-purple-500/30" />
            <span className="text-purple-400/60 text-lg">✦</span>
            <span className="h-px w-16 bg-purple-500/30" />
          </div>

          {/* Philosophy quote */}
          <blockquote
            className={`text-center ${
              isLoaded ? "animate-reveal delay-4" : "opacity-0"
            }`}
          >
            <p
              className="text-[20px] leading-[1.9] text-zinc-300/80 italic"
              style={{ fontFamily: "var(--font-cormorant), serif" }}
            >
              &ldquo;{settings.aboutQuote}&rdquo;
            </p>
          </blockquote>

          {/* Footer info */}
          <div
            className={`mt-24 pt-12 border-t border-purple-500/20 ${
              isLoaded ? "animate-reveal delay-5" : "opacity-0"
            }`}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Privacy note */}
              <div>
                <h3 className="text-[11px] tracking-[0.2em] uppercase text-purple-400/60 mb-3">
                  Privacy
                </h3>
                <p className="text-[13px] text-zinc-400 leading-[1.8]">
                  {settings.aboutPrivacyNote.split(". ").map((sentence, i, arr) => (
                    <span key={i}>
                      {sentence}{i < arr.length - 1 ? "." : ""}{i < arr.length - 1 && <br />}
                    </span>
                  ))}
                </p>
              </div>

              {/* Connect */}
              {socialLinks.length > 0 && (
                <div>
                  <h3 className="text-[11px] tracking-[0.2em] uppercase text-purple-400/60 mb-3">
                    Connect
                  </h3>
                  <div className="flex gap-6">
                    {socialLinks.map((link) => (
                      <a
                        key={link.name}
                        href={link.url}
                        target={link.url.startsWith("mailto:") ? undefined : "_blank"}
                        rel={link.url.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                        className="text-[13px] text-zinc-400 hover:text-purple-300 transition-colors"
                      >
                        {link.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Year mark */}
            <div className="mt-12 text-center">
              <span className="text-[11px] tracking-[0.3em] text-zinc-500 uppercase">
                Est. {settings.aboutEstYear}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
