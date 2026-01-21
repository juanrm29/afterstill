"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { marked } from "marked";
import type { Writing } from "@/types/writing";
import { MountainPathProgress } from "@/components/mountain-path-progress";
import { ReadingCompanion } from "@/components/reading-companion";
import { ReflectionBox } from "@/components/reflection-box";

// Configure marked
marked.setOptions({
  gfm: true,
  breaks: true,
});

// Preprocess content - convert literal <br> tags to newlines for markdown
function preprocessContent(content: string): string {
  return content
    .replace(/<br\s*\/?>/gi, '\n\n')  // Convert <br> tags to double newlines (paragraphs)
    .replace(/&nbsp;/gi, ' ')          // Convert &nbsp; to spaces
    .replace(/&lt;/g, '<')             // Decode HTML entities if needed
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

// Simple HTML sanitizer
function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script").forEach(el => el.remove());
  doc.querySelectorAll("*").forEach(el => {
    Array.from(el.attributes).forEach(attr => {
      if (attr.name.startsWith("on")) el.removeAttribute(attr.name);
    });
  });
  return doc.body.innerHTML;
}

type Props = { writing: Writing };

const READ_HISTORY_KEY = "afterstill-read-history";
const READ_HISTORY_EVENT = "afterstill-read-history";

// Find connected writings
function findConnected(current: Writing, all: Writing[]): Writing[] {
  return all.filter(w => 
    w.id !== current.id && 
    w.tags.some(t => current.tags.includes(t))
  ).slice(0, 3);
}

// Get typing increment based on character
function getTypingIncrement(char: string): number {
  if (char === '.' || char === ',' || char === '?') return 1;
  if (char === ' ') return 3;
  return 2;
}

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 2166136261;
  for (const ch of s) {
    h ^= ch.codePointAt(0) ?? 0;
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function firstLine(text: string): string {
  const trimmed = (text || "").trim();
  if (!trimmed) return "";
  const stopAt = Math.min(
    ...[
      trimmed.indexOf("."),
      trimmed.indexOf("?"),
      trimmed.indexOf("!"),
      trimmed.indexOf("\n"),
    ].filter((n) => n >= 0)
  );

  if (Number.isFinite(stopAt) && stopAt >= 24) {
    return `${trimmed.slice(0, stopAt + 1).trim()} `;
  }
  return trimmed.length <= 120 ? trimmed : `${trimmed.slice(0, 120).trimEnd()}…`;
}

function obfuscateText(input: string, seedKey: string, revealRatio: number): string {
  if (!input) return "";
  const ratio = Math.min(1, Math.max(0, revealRatio));
  const rand = mulberry32(hashString(seedKey));

  let out = "";
  for (const ch of input) {
    const isLetterOrDigit = /[\p{L}\p{N}]/u.test(ch);
    if (!isLetterOrDigit) {
      out += ch;
      continue;
    }
    out += rand() < ratio ? ch : "•";
  }
  return out;
}

function sharedTagCount(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b);
  let shared = 0;
  for (const t of a) if (setB.has(t)) shared++;
  return shared;
}

function jaccardScore(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  let shared = 0;
  for (const t of setA) if (setB.has(t)) shared++;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : shared / union;
}

function pickEcho(current: Writing, all: Writing[]): Writing {
  const pool = all.filter((w) => w.id !== current.id);
  if (pool.length === 0) return current;

  // Deterministic “fate”: mostly connected, sometimes an anomaly.
  const roll = mulberry32(hashString(`${current.id}::echo::roll`));
  const anomaly = roll() < 0.12;

  const connected = pool.filter((w) => sharedTagCount(w.tags, current.tags) > 0);
  const candidates = !anomaly && connected.length > 0 ? connected : pool;

  // Score candidates: prefer stronger tag resonance, with slight deterministic jitter.
  let best = candidates[0];
  let bestScore = -Infinity;
  for (const w of candidates) {
    const overlap = sharedTagCount(w.tags, current.tags);
    const jac = jaccardScore(w.tags, current.tags);
    const jitter = mulberry32(hashString(`${current.id}::echo::${w.id}`))() * 0.15;
    const score = overlap * 0.35 + jac * 1.6 + jitter;
    if (score > bestScore) {
      bestScore = score;
      best = w;
    }
  }

  return best;
}

export default function ReadingClient({ writing }: Props) {
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [revealedChars, setRevealedChars] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());
  const [writings, setWritings] = useState<Writing[]>([]);
  
  // Reading companion state
  const [isActivelyReading, setIsActivelyReading] = useState(true);
  const lastScrollRef = useRef(Date.now());
  const [companionMood, setCompanionMood] = useState<"melancholic" | "hopeful" | "introspective" | "peaceful" | "neutral">("neutral");

  // Fetch writings from database
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

  // Persist discovery: mark this writing as read
  useEffect(() => {
    if (globalThis.window === undefined) return;
    try {
      const raw = localStorage.getItem(READ_HISTORY_KEY);
      const current = raw ? (JSON.parse(raw) as string[]) : [];
      if (!Array.isArray(current)) return;

      const alreadyRead = current.includes(writing.id);
      if (alreadyRead) return;

      const nextHistory = [...current, writing.id];
      localStorage.setItem(READ_HISTORY_KEY, JSON.stringify(nextHistory));
      // Same-tab sync: `storage` doesn't fire in the same document.
      globalThis.dispatchEvent(new Event(READ_HISTORY_EVENT));
    } catch {
      // ignore storage errors
    }
  }, [writing.id]);

  useEffect(() => {
    if (globalThis.window === undefined) return;
    const load = () => {
      try {
        const raw = localStorage.getItem(READ_HISTORY_KEY);
        const arr = raw ? (JSON.parse(raw) as string[]) : [];
        if (!Array.isArray(arr)) return;
        setReadIds(new Set(arr));
      } catch {
        // ignore
      }
    };

    load();
    globalThis.addEventListener("storage", load);
    globalThis.addEventListener(READ_HISTORY_EVENT, load);
    return () => {
      globalThis.removeEventListener("storage", load);
      globalThis.removeEventListener(READ_HISTORY_EVENT, load);
    };
  }, []);

  // Preprocess content for display (convert <br> to newlines)
  const content = useMemo(() => preprocessContent(writing.content), [writing.content]);
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const readTime = Math.ceil(wordCount / 200);
  const currentIndex = writings.findIndex((w) => w.id === writing.id);
  const next = writings[currentIndex + 1];
  const prev = writings[currentIndex - 1];
  const connected = useMemo(() => findConnected(writing, writings), [writing]);

  const echoTarget = useMemo(() => pickEcho(writing, writings), [writing]);
  const echoIsDiscovered = readIds.has(echoTarget.id);
  const echoLine = useMemo(() => {
    const line = firstLine(echoTarget.content) || echoTarget.excerpt || echoTarget.title;
    return echoIsDiscovered ? line : obfuscateText(line, `${echoTarget.id}::echoLine`, 0.22);
  }, [echoIsDiscovered, echoTarget.content, echoTarget.excerpt, echoTarget.id, echoTarget.title]);

  // Typewriter effect
  useEffect(() => {
    if (!isTyping) return;
    
    const interval = setInterval(() => {
      setRevealedChars(prev => {
        if (prev >= content.length) {
          setIsTyping(false);
          return prev;
        }
        const char = content[prev];
        const increment = getTypingIncrement(char);
        return Math.min(prev + increment, content.length);
      });
    }, 15);

    return () => clearInterval(interval);
  }, [content, isTyping]);

  // Skip typewriter on click
  const skipTypewriter = useCallback(() => {
    setRevealedChars(content.length);
    setIsTyping(false);
  }, [content.length]);

  // Scroll progress
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - globalThis.innerHeight;
      const currentProgress = h > 0 ? (globalThis.scrollY / h) * 100 : 0;
      setProgress(currentProgress);
      
      // Track reading activity
      lastScrollRef.current = Date.now();
      setIsActivelyReading(true);
    };
    globalThis.addEventListener("scroll", onScroll, { passive: true });
    return () => globalThis.removeEventListener("scroll", onScroll);
  }, []);
  
  // Detect mood from writing tags
  useEffect(() => {
    const tags = writing.tags.map(t => t.toLowerCase());
    if (tags.some(t => ["melancholy", "sadness", "loss", "grief", "rain"].includes(t))) {
      setCompanionMood("melancholic");
    } else if (tags.some(t => ["hope", "light", "growth", "future", "dawn"].includes(t))) {
      setCompanionMood("hopeful");
    } else if (tags.some(t => ["introspection", "thought", "mind", "reflection", "solitude"].includes(t))) {
      setCompanionMood("introspective");
    } else if (tags.some(t => ["peace", "calm", "quiet", "rest", "stillness"].includes(t))) {
      setCompanionMood("peaceful");
    } else {
      setCompanionMood("neutral");
    }
  }, [writing.tags]);
  
  // Check if user stopped reading
  useEffect(() => {
    const checkIdle = setInterval(() => {
      const idle = Date.now() - lastScrollRef.current > 10000;
      setIsActivelyReading(!idle);
    }, 2000);
    return () => clearInterval(checkIdle);
  }, []);

  // Load
  useEffect(() => {
    const t = setTimeout(() => setIsLoaded(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Keyboard navigation handler
  const handleNavigation = useCallback((key: string) => {
    if (key === "ArrowRight" && next) {
      globalThis.location.href = `/reading/${next.id}`;
    }
    if (key === "ArrowLeft" && prev) {
      globalThis.location.href = `/reading/${prev.id}`;
    }
    if (key === "Escape") {
      globalThis.location.href = "/archive";
    }
  }, [next, prev]);

  // Keyboard
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      handleNavigation(e.key);
      if (e.key === " " && isTyping) {
        e.preventDefault();
        skipTypewriter();
      }
    },
    [handleNavigation, isTyping, skipTypewriter]
  );

  useEffect(() => {
    globalThis.addEventListener("keydown", handleKey);
    return () => globalThis.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  // Split content into visible and hidden
  const visibleContent = content.slice(0, revealedChars);
  const hiddenContent = content.slice(revealedChars);

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Reading Companion */}
      <ReadingCompanion 
        scrollProgress={progress}
        isReading={isActivelyReading}
        mood={companionMood}
      />
      
      {/* Mountain Path Progress */}
      <MountainPathProgress 
        progress={progress}
        title={writing.title}
      />

      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-40 px-8 py-6 bg-linear-to-b from-background via-background/90 to-transparent">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <Link
            href="/archive"
            className={`text-[11px] tracking-[0.3em] text-zinc-400 hover:text-zinc-200 uppercase transition-colors duration-500 ${
              isLoaded ? "opacity-100" : "opacity-0"
            }`}
          >
            ← Archive
          </Link>
          <span
            className={`text-[10px] text-zinc-500 font-mono tabular-nums transition-opacity duration-500 delay-100 ${
              isLoaded ? "opacity-100" : "opacity-0"
            }`}
          >
            {Math.round(progress)}%
          </span>
        </div>
      </nav>

      {/* Article */}
      <article className="pt-32 pb-40 px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <header className="mb-20">
            <div
              className={`flex items-center gap-4 mb-8 text-[10px] text-zinc-500 font-mono tracking-wide transition-opacity duration-500 ${
                isLoaded ? "opacity-100" : "opacity-0"
              }`}
            >
              <span className="tabular-nums">
                {String(currentIndex + 1).padStart(2, "0")}/{String(writings.length).padStart(2, "0")}
              </span>
              <span className="text-zinc-600">·</span>
              <span>{writing.date}</span>
              <span className="text-zinc-600">·</span>
              <span>{readTime} min</span>
            </div>

            <h1
              className={`text-[clamp(2rem,5vw,3rem)] font-extralight tracking-[-0.02em] leading-[1.15] mb-8 transition-all duration-700 delay-100 ${
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
              style={{ fontFamily: "var(--font-cormorant), serif" }}
            >
              {writing.title}
            </h1>

            <div
              className={`flex flex-wrap gap-2.5 transition-opacity duration-500 delay-200 ${
              isLoaded ? "opacity-100" : "opacity-0"
            }`}
            >
              {writing.tags.map(tag => (
                <span 
                  key={tag} 
                  className="text-[9px] text-zinc-400 px-2.5 py-1.5 bg-zinc-800/30 rounded border border-zinc-700/30 tracking-wide"
                >
                  {tag}
                </span>
              ))}
            </div>
          </header>

          {/* Content with typewriter effect or rendered markdown */}
          <div 
            className={`relative transition-opacity duration-500 delay-300 ${
              isLoaded ? "opacity-100" : "opacity-0"
            }`}
            onClick={isTyping ? skipTypewriter : undefined}
          >
            {isTyping ? (
              // Typewriter mode - plain text reveal
              <p className="text-[18px] md:text-[20px] leading-[2.1] text-zinc-300 font-light tracking-[0.01em]">
                <span>{visibleContent}</span>
                <span className="text-zinc-700">{hiddenContent}</span>
                <span className="inline-block w-[2px] h-[1.1em] bg-foreground/20 ml-0.5 animate-pulse align-middle rounded-full" />
              </p>
            ) : (
              // Full content - rendered markdown
              <div 
                className="prose prose-lg prose-invert prose-zinc max-w-none
                  prose-headings:font-light prose-headings:tracking-tight prose-headings:text-zinc-200
                  prose-h1:text-3xl prose-h1:mt-12 prose-h1:mb-6
                  prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
                  prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                  prose-p:text-[18px] prose-p:md:text-[20px] prose-p:leading-[2.1] prose-p:text-zinc-300 prose-p:font-light prose-p:tracking-[0.01em] prose-p:mb-8
                  prose-a:text-violet-400 prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-zinc-200 prose-strong:font-medium
                  prose-em:text-zinc-400 prose-em:italic
                  prose-code:text-violet-400 prose-code:bg-zinc-800/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
                  prose-pre:bg-zinc-900/60 prose-pre:border prose-pre:border-zinc-800/50 prose-pre:rounded-lg prose-pre:p-4
                  prose-blockquote:border-l-2 prose-blockquote:border-violet-500/40 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-zinc-400 prose-blockquote:not-italic prose-blockquote:font-light
                  prose-ul:text-zinc-300 prose-ol:text-zinc-300
                  prose-li:marker:text-zinc-600
                  prose-hr:border-zinc-800/50 prose-hr:my-12
                  prose-img:rounded-lg prose-img:my-8"
                dangerouslySetInnerHTML={{ 
                  __html: sanitizeHtml(marked(content) as string) 
                }}
              />
            )}
            
            {isTyping && (
              <p className="mt-10 text-[10px] text-zinc-500 italic animate-pulse tracking-wide">
                click or press space to reveal all
              </p>
            )}
          </div>

          {/* End marker */}
          {!isTyping && (
            <div
              className="mt-24 flex items-center gap-6 animate-fade-in"
            >
              <div className="flex-1 h-px bg-linear-to-r from-transparent to-zinc-700/30" />
              <span className="text-zinc-600 text-xs">∎</span>
              <div className="flex-1 h-px bg-linear-to-l from-transparent to-zinc-700/30" />
            </div>
          )}

          {/* Connected writings */}
          {!isTyping && connected.length > 0 && (
            <div className="mt-20 animate-fade-in">
              <p className="text-[10px] text-zinc-500 uppercase tracking-[0.35em] mb-8">
                Echoes nearby
              </p>
              <div className="grid gap-4">
                {connected.map(w => (
                  <Link
                    key={w.id}
                    href={`/reading/${w.id}`}
                    className="group flex items-center justify-between py-4 border-b border-zinc-800 hover:border-zinc-600 transition-colors duration-500"
                  >
                    <span 
                      className="text-zinc-400 group-hover:text-zinc-200 transition-colors duration-500"
                      style={{ fontFamily: "var(--font-cormorant), serif" }}
                    >
                      {w.title}
                    </span>
                    <div className="flex gap-1.5">
                      {w.tags.filter(t => writing.tags.includes(t)).map(tag => (
                        <span key={tag} className="text-[8px] text-zinc-500 px-2 py-1 bg-zinc-800/30 rounded border border-zinc-700/30">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Echo line */}
          {!isTyping && echoTarget ? (
            <div className="mt-16 animate-fade-in">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-6">
                Echo line
              </p>
              <Link
                href={`/reading/${echoTarget.id}`}
                className="group block rounded-sm border border-zinc-700/40 bg-zinc-800/20 px-4 py-4 hover:border-zinc-600 transition-colors"
              >
                <p className="text-sm leading-[1.9] text-zinc-400 group-hover:text-zinc-200 transition-colors">
                  “{echoLine}”
                </p>
                <div className="mt-3 flex items-center justify-between gap-4">
                  <span
                    className="text-[10px] text-zinc-500 uppercase tracking-widest"
                    style={{ fontFamily: "var(--font-cormorant), serif" }}
                  >
                    {echoIsDiscovered ? echoTarget.title : "Encrypted"}
                  </span>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest">
                    {echoIsDiscovered ? "open" : "decode"} →
                  </span>
                </div>
              </Link>
            </div>
          ) : null}

          {/* Reader Reflections */}
          {!isTyping && (
            <ReflectionBox
              writingId={writing.id}
              writingTitle={writing.title}
              show={progress >= 50}
            />
          )}

          {/* Navigation */}
          {!isTyping && (
            <nav className="mt-20 grid grid-cols-2 gap-12 animate-fade-in">
              {prev ? (
                <Link
                  href={`/reading/${prev.id}`}
                  className="group text-left"
                >
                  <span className="text-[10px] text-zinc-500 uppercase tracking-[0.35em]">← Previous</span>
                  <span 
                    className="block mt-3 text-zinc-400 group-hover:text-zinc-200 transition-colors duration-500"
                    style={{ fontFamily: "var(--font-cormorant), serif" }}
                  >
                    {prev.title}
                  </span>
                </Link>
              ) : <div />}

              {next && (
                <Link
                  href={`/reading/${next.id}`}
                  className="group text-right"
                >
                  <span className="text-[10px] text-zinc-500 uppercase tracking-[0.35em]">Next →</span>
                  <span 
                    className="block mt-3 text-zinc-400 group-hover:text-zinc-200 transition-colors duration-500"
                    style={{ fontFamily: "var(--font-cormorant), serif" }}
                  >
                    {next.title}
                  </span>
                </Link>
              )}
            </nav>
          )}
        </div>
      </article>

      {/* Footer */}
      <footer className="fixed bottom-0 inset-x-0 px-8 py-5 bg-linear-to-t from-background via-background/80 to-transparent">
        <div className="max-w-2xl mx-auto flex justify-between text-[9px] text-zinc-600 font-mono uppercase tracking-[0.2em]">
          <span>←→ navigate</span>
          <span>esc return</span>
        </div>
      </footer>
      
      {/* Skip button for typewriter */}
      {isTyping && (
        <button
          onClick={skipTypewriter}
          className="fixed bottom-20 right-8 text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors duration-500 px-4 py-2.5 border border-zinc-700/40 rounded-lg bg-zinc-900/60 backdrop-blur-xl tracking-wide"
          aria-label="Skip typewriter animation"
        >
          skip →
        </button>
      )}
    </main>
  );
}
