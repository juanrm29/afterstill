"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { AmbientParticles } from "@/components/ambient-particles";
import { ScrollProgress, ScrollToTop } from "@/components/scroll-progress";

interface Writing {
  id: string;
  title: string;
  content: string;
  date: string;
  excerpt: string;
}

interface Fragment {
  id: string;
  text: string;
  source: string;
  sourceId: string;
  date: string;
}

// Extract meaningful fragments from writings (sorted by newest first)
function extractFragments(writings: Writing[]): Fragment[] {
  const fragments: Fragment[] = [];

  // Sort by newest first
  const sortedWritings = [...writings].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  sortedWritings.forEach((writing) => {
    const sentences = writing.content
      .replace(/\n+/g, " ")
      .replace(/[#*_`>]/g, "") // Remove markdown
      .split(/(?<=[.!?])\s+/)
      .filter((s) => s.trim().length > 30 && s.trim().length < 200);

    // Get the best sentences - prioritize poetic ones, but include others too
    const poeticSentences = sentences.filter((s) => {
      const hasDepth =
        /\b(silence|time|memory|light|shadow|dream|heart|soul|breath|moment|echo|whisper|dawn|dusk|night|sky|rain|wind|sea|moon|star|sun|quiet|still|fade|lost|find|seek|wonder|between|beneath|beyond|words|thought|feel|remember|forget)\b/i.test(
          s
        );
      const hasReflection =
        /\b(perhaps|maybe|sometimes|often|always|never|once|still|yet|only|merely|within|we|I|you)\b/i.test(
          s
        );
      return hasDepth || hasReflection;
    });

    // Use poetic sentences first, then fallback to any sentence
    const selectedSentences = poeticSentences.length > 0 
      ? poeticSentences.slice(0, 2)
      : sentences.slice(0, 2);

    selectedSentences.forEach((text, i) => {
      fragments.push({
        id: `${writing.id}-frag-${i}`,
        text: text.trim(),
        source: writing.title,
        sourceId: writing.id,
        date: writing.date,
      });
    });

    // If no sentences found, use excerpt
    if (selectedSentences.length === 0 && writing.excerpt) {
      fragments.push({
        id: `${writing.id}-frag-excerpt`,
        text: writing.excerpt.trim(),
        source: writing.title,
        sourceId: writing.id,
        date: writing.date,
      });
    }
  });

  return fragments.slice(0, 16); // Show more fragments
}

export default function FragmentPage() {
  const [writings, setWritings] = useState<Writing[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/writings")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setWritings(data);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const fragments = useMemo(() => extractFragments(writings), [writings]);

  return (
    <div className="min-h-screen bg-[#030304] text-white safe-area-inset">
      {/* Ambient Particles */}
      <AmbientParticles count={25} color="violet" intensity="subtle" />
      
      {/* Scroll Progress */}
      <ScrollProgress color="rgba(167, 139, 250, 0.4)" />
      <ScrollToTop />
      
      {/* Subtle ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-[600px] h-[600px] rounded-full blur-[180px] opacity-[0.025] animate-morph"
          style={{
            background: "radial-gradient(circle, #a78bfa, transparent 70%)",
            left: "50%",
            top: "40%",
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>

      {/* Header - Mobile optimized */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 py-4 sm:py-6 glass">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className={`text-[11px] tracking-[0.3em] uppercase text-zinc-600 hover:text-zinc-400 transition-colors duration-500 touch-target flex items-center gap-2 ${
              isLoaded ? "animate-fade-in" : "opacity-0"
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span className="hidden sm:inline">Back</span>
          </Link>
          <h1
            className={`text-[11px] tracking-[0.4em] uppercase text-zinc-500 ${
              isLoaded ? "animate-fade-in" : "opacity-0"
            }`}
          >
            Fragments
          </h1>
        </div>
      </header>

      {/* Main content */}
      <main className="pt-32 pb-24 px-8">
        <div className="max-w-4xl mx-auto">
          {/* Intro */}
          <div className="text-center mb-16">
            <p
              className={`text-zinc-500 text-[15px] leading-relaxed max-w-md mx-auto ${
                isLoaded ? "animate-fade-in" : "opacity-0"
              }`}
              style={{ fontFamily: "var(--font-cormorant), serif" }}
            >
              Scattered echoes and extracted thoughts,
              <br />
              <span className="text-zinc-600">pieces that wanted to be remembered.</span>
            </p>
          </div>

          {/* Fragments Grid */}
          {fragments.length === 0 && isLoaded ? (
            <div className="text-center py-24">
              <div className="w-14 h-14 mx-auto mb-6 rounded-full border border-zinc-800/50 flex items-center justify-center">
                <span className="text-xl opacity-30">✦</span>
              </div>
              <p className="text-zinc-600 text-sm">No fragments yet.</p>
              <p className="text-zinc-700 text-xs mt-2">
                Fragments appear as writings are published.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {fragments.map((fragment, index) => {
                const isHovered = hoveredId === fragment.id;

                return (
                  <div
                    key={fragment.id}
                    className={`group transition-all duration-500 ${
                      isLoaded
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-4"
                    }`}
                    style={{ transitionDelay: `${index * 60}ms` }}
                    onMouseEnter={() => setHoveredId(fragment.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <div
                      className={`relative p-6 rounded-xl border transition-all duration-400 h-full ${
                        isHovered
                          ? "bg-zinc-900/70 border-zinc-700/50 -translate-y-0.5"
                          : "bg-zinc-900/20 border-zinc-800/30"
                      }`}
                    >
                      {/* Quote decoration */}
                      <span
                        className={`absolute -top-2 left-5 text-4xl leading-none transition-colors duration-400 ${
                          isHovered ? "text-purple-500/20" : "text-zinc-800/40"
                        }`}
                      >
                        "
                      </span>

                      {/* Fragment text */}
                      <p
                        className={`text-[15px] leading-[1.9] pt-3 transition-colors duration-400 ${
                          isHovered ? "text-zinc-300" : "text-zinc-500"
                        }`}
                        style={{ fontFamily: "var(--font-cormorant), serif" }}
                      >
                        {fragment.text}
                      </p>

                      {/* Source link with date */}
                      <div className="mt-5 flex items-center justify-between">
                        <Link
                          href={`/reading/${fragment.sourceId}`}
                          className={`inline-flex items-center gap-2 text-[10px] transition-all duration-400 ${
                            isHovered
                              ? "text-zinc-500 opacity-100"
                              : "text-zinc-700 opacity-0 group-hover:opacity-100"
                          }`}
                        >
                          <span className="w-5 h-px bg-zinc-700" />
                          <span className="uppercase tracking-[0.15em]">
                            {fragment.source}
                          </span>
                        </Link>
                        <span
                          className={`text-[9px] tracking-wider transition-all duration-400 ${
                            isHovered ? "text-zinc-600" : "text-zinc-800"
                          }`}
                        >
                          {new Date(fragment.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Footer decoration */}
      <div className="fixed bottom-8 left-0 right-0 flex justify-center pointer-events-none">
        <div
          className={`flex items-center gap-3 text-zinc-800 text-[10px] tracking-[0.3em] uppercase ${
            isLoaded ? "opacity-100" : "opacity-0"
          } transition-opacity duration-1000 delay-500`}
        >
          <span className="w-8 h-px bg-zinc-800/50" />
          <span>{fragments.length} fragments</span>
          <span className="w-8 h-px bg-zinc-800/50" />
        </div>
      </div>
    </div>
  );
}
