"use client";

import { useState, useEffect, useCallback, useMemo, useRef, ReactNode } from "react";
import Link from "next/link";

type Writing = {
  id: string;
  title: string;
  content: string;
  excerpt: string;
};

type Props = {
  readonly currentWriting: Writing;
  readonly allWritings: Writing[];
  readonly onWordHover?: (word: string | null) => void;
  readonly children: ReactNode;
};

type Resonance = {
  word: string;
  writings: { id: string; title: string; context: string }[];
};

// Words to ignore for resonance
const STOP_WORDS = new Set([
  "yang", "dari", "untuk", "dengan", "dalam", "adalah", "atau", "pada", "ini", "itu",
  "akan", "bisa", "juga", "tidak", "ada", "mereka", "kita", "kami", "saya", "kamu",
  "dia", "sudah", "belum", "sedang", "telah", "hanya", "sangat", "lebih", "paling",
  "seperti", "karena", "ketika", "saat", "jika", "maka", "namun", "tetapi", "bahwa",
  "the", "and", "but", "for", "with", "this", "that", "from", "have", "been", "were",
  "are", "was", "had", "has", "its", "his", "her", "they", "them", "their", "would",
  "could", "should", "will", "can", "may", "might", "must", "shall", "about", "into",
  "through", "during", "before", "after", "above", "below", "between", "under", "again",
  "further", "then", "once", "here", "there", "when", "where", "why", "how", "all",
  "each", "few", "more", "most", "other", "some", "such", "only", "own", "same", "than",
  "too", "very", "just", "also", "now", "even", "still", "already", "always", "never"
]);

// Extract meaningful words from text
function extractWords(text: string): string[] {
  return text
    .toLowerCase()
    .replaceAll(/[^\p{L}\s]/gu, " ")
    .split(/\s+/)
    .filter(w => w.length >= 4 && !STOP_WORDS.has(w));
}

// Find context around a word
function findContext(text: string, word: string): string {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(word.toLowerCase());
  if (idx === -1) return "";
  
  const start = Math.max(0, idx - 40);
  const end = Math.min(text.length, idx + word.length + 40);
  let context = text.slice(start, end).trim();
  
  if (start > 0) context = "…" + context;
  if (end < text.length) context = context + "…";
  
  return context;
}

export function ResonanceThread({ currentWriting, allWritings, onWordHover, children }: Props) {
  const [activeResonance, setActiveResonance] = useState<Resonance | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build resonance map
  const resonanceMap = useMemo(() => {
    const map = new Map<string, { id: string; title: string; content: string }[]>();
    
    // Get words from current writing
    const currentWords = new Set(extractWords(currentWriting.content + " " + currentWriting.title));
    
    // Find resonances in other writings
    allWritings.forEach(w => {
      if (w.id === currentWriting.id) return;
      
      const otherWords = extractWords(w.content + " " + w.title);
      otherWords.forEach(word => {
        if (currentWords.has(word)) {
          if (!map.has(word)) map.set(word, []);
          const existing = map.get(word)!;
          if (!existing.some(e => e.id === w.id)) {
            existing.push({ id: w.id, title: w.title, content: w.content });
          }
        }
      });
    });
    
    // Filter to words with at least 1 resonance
    return new Map([...map].filter(([, writings]) => writings.length >= 1));
  }, [currentWriting, allWritings]);

  // Handle word hover
  const handleWordHover = useCallback((word: string, rect: DOMRect) => {
    const normalizedWord = word.toLowerCase().replaceAll(/[^\p{L}]/gu, "");
    const resonances = resonanceMap.get(normalizedWord);
    
    if (resonances && resonances.length > 0) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      
      const writings = resonances.slice(0, 3).map(w => ({
        id: w.id,
        title: w.title,
        context: findContext(w.content, normalizedWord)
      }));
      
      setActiveResonance({ word: normalizedWord, writings });
      setPosition({ x: rect.left + rect.width / 2, y: rect.bottom + 8 });
      setIsVisible(true);
      onWordHover?.(normalizedWord);
    }
  }, [resonanceMap, onWordHover]);

  const handleWordLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      setActiveResonance(null);
      onWordHover?.(null);
    }, 300);
  }, [onWordHover]);

  // Setup event listeners on prose content
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("resonant-word")) {
        const word = target.dataset.word || target.textContent || "";
        handleWordHover(word, target.getBoundingClientRect());
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("resonant-word")) {
        handleWordLeave();
      }
    };

    container.addEventListener("mouseover", handleMouseOver);
    container.addEventListener("mouseout", handleMouseOut);

    return () => {
      container.removeEventListener("mouseover", handleMouseOver);
      container.removeEventListener("mouseout", handleMouseOut);
    };
  }, [handleWordHover, handleWordLeave]);

  // Keep popup visible when hovering over it
  const handlePopupEnter = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const handlePopupLeave = useCallback(() => {
    handleWordLeave();
  }, [handleWordLeave]);

  return (
    <>
      {/* Container reference for event delegation - wraps children */}
      <div ref={containerRef}>
        {children}
      </div>

      {/* Resonance popup */}
      {isVisible && activeResonance && (
        <div
          className="fixed z-50 pointer-events-auto"
          style={{
            left: position.x,
            top: position.y,
            transform: "translateX(-50%)"
          }}
          onMouseEnter={handlePopupEnter}
          onMouseLeave={handlePopupLeave}
        >
          <div className="relative bg-zinc-950/95 backdrop-blur-xl border border-zinc-800/50 rounded-lg shadow-2xl overflow-hidden max-w-xs animate-resonance-appear">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 to-transparent pointer-events-none" />
            
            {/* Header */}
            <div className="px-4 pt-3 pb-2 border-b border-zinc-800/30">
              <p className="text-[9px] text-zinc-600 uppercase tracking-[0.2em] mb-1">
                resonates with
              </p>
              <p className="text-sm text-violet-400/80 font-light">
                &ldquo;{activeResonance.word}&rdquo;
              </p>
            </div>
            
            {/* Writings list */}
            <div className="p-2 space-y-1 max-h-48 overflow-y-auto">
              {activeResonance.writings.map((w) => (
                <Link
                  key={w.id}
                  href={`/reading/${w.id}`}
                  className="group block p-2 rounded-md hover:bg-zinc-800/30 transition-colors"
                >
                  <h4 className="text-[11px] text-zinc-400 group-hover:text-zinc-200 font-medium mb-1 line-clamp-1">
                    {w.title}
                  </h4>
                  <p className="text-[10px] text-zinc-600 line-clamp-2 leading-relaxed">
                    {w.context}
                  </p>
                </Link>
              ))}
            </div>
            
            {/* Thread hint */}
            <div className="px-4 py-2 border-t border-zinc-800/30 bg-zinc-900/30">
              <p className="text-[8px] text-zinc-700 text-center">
                follow the thread →
              </p>
            </div>
          </div>
          
          {/* Connection line */}
          <div className="absolute left-1/2 -top-2 w-px h-2 bg-gradient-to-b from-transparent to-violet-500/30" />
        </div>
      )}
    </>
  );
}

// Helper to process HTML content with resonant words
export function processResonantContent(
  content: string,
  resonanceMap: Map<string, unknown>
): string {
  let processed = content;
  const words = [...resonanceMap.keys()].sort((a, b) => b.length - a.length);
  
  words.forEach(word => {
    const regex = new RegExp(String.raw`\b(${word})\b`, "gi");
    let replaced = false;
    processed = processed.replaceAll(regex, (match) => {
      if (replaced) return match;
      replaced = true;
      return `<span class="resonant-word" data-word="${word.toLowerCase()}">${match}</span>`;
    });
  });
  
  return processed;
}
