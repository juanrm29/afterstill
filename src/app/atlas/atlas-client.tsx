"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Writing } from "@/types/writing";

type Node = {
  writing: Writing;
  x: number; // 0..1
  y: number; // 0..1
  r: number;
};

type Edge = {
  a: number;
  b: number;
  strength: number; // 0..1
  shared: string[];
};

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

    const keep = rand() < ratio;
    out += keep ? ch : "•";
  }
  return out;
}

function hintExcerpt(excerpt: string): string {
  const trimmed = (excerpt || "").trim();
  if (!trimmed) return "";
  // Keep it short and mysterious.
  if (trimmed.length <= 92) return trimmed;
  return `${trimmed.slice(0, 92).trimEnd()}…`;
}

function jaccard(a: string[], b: string[]): { score: number; shared: string[] } {
  const setA = new Set(a);
  const setB = new Set(b);
  const shared = [...setA].filter((t) => setB.has(t))
  const union = new Set([...a, ...b]).size
  const score = union === 0 ? 0 : shared.length / union
  return { score, shared }
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
  for (let i = 0; i < s.length; i++) {
    h ^= s.codePointAt(i) ?? 0;
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function computeNodes(items: Writing[]): Node[] {
  // Deterministic pseudo layout: spiral-ish distribution.
  const rand = mulberry32(hashString(items.map((w) => w.id).join("|")));

  const nodes: Node[] = [];
  const n = Math.max(1, items.length);

  for (let i = 0; i < n; i++) {
    const t = i / n;
    const angle = t * Math.PI * 8 + rand() * 0.6;
    const radius = 0.18 + t * 0.34 + rand() * 0.04;

    const x = 0.5 + Math.cos(angle) * radius;
    const y = 0.5 + Math.sin(angle) * radius;

    nodes.push({
      writing: items[i],
      x: Math.min(0.92, Math.max(0.08, x)),
      y: Math.min(0.88, Math.max(0.14, y)),
      r: 6 + rand() * 10,
    });
  }

  return nodes;
}

function computeEdges(nodes: Node[]): Edge[] {
  const edges: Edge[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const { score, shared } = jaccard(nodes[i].writing.tags, nodes[j].writing.tags);
      if (score >= 0.25) {
        edges.push({ a: i, b: j, strength: Math.min(1, score), shared });
      }
    }
  }

  // Limit: keep strongest edges first.
  edges.sort((e1, e2) => e2.strength - e1.strength);
  return edges.slice(0, 42);
}

export default function AtlasClient() {
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());
  const [writings, setWritings] = useState<Writing[]>([]);

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

  const nodes = useMemo(() => computeNodes(writings), [writings]);
  const edges = useMemo(() => computeEdges(nodes), [nodes]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    globalThis.addEventListener("mousemove", handleMouseMove);
    return () => globalThis.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setIsLoaded(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (globalThis.window === undefined) return;

    const key = "afterstill-read-history";
    const load = () => {
      try {
        const raw = localStorage.getItem(key);
        const arr = raw ? (JSON.parse(raw) as string[]) : [];
        if (!Array.isArray(arr)) return;
        setReadIds(new Set(arr));
      } catch {
        // ignore
      }
    };

    load();
    globalThis.addEventListener("storage", load);
    return () => globalThis.removeEventListener("storage", load);
  }, []);

  const active = activeIndex === null ? null : nodes[activeIndex];
  const discoveredCount = readIds.size;
  const activeDiscovered = active ? readIds.has(active.writing.id) : false;

  const hoverModel = useMemo(() => {
    if (!active) {
      return {
        kind: "idle" as const,
        label: "Listening...",
        title: "",
        excerpt: "Setiap titik adalah sebuah suara yang menunggu. Gerakkan cursor-mu perlahan—biarkan mereka berbisik.",
        tags: "",
        hint: "",
      };
    }

    if (activeDiscovered) {
      return {
        kind: "discovered" as const,
        label: "Signal acquired",
        title: active.writing.title,
        excerpt: active.writing.excerpt,
        tags: active.writing.tags.slice(0, 3).join(" · "),
        hint: "enter →",
      };
    }

    return {
      kind: "encrypted" as const,
      label: "Encrypted transmission",
      title: obfuscateText(active.writing.title, `${active.writing.id}::title`, 0.22),
      excerpt: obfuscateText(
        hintExcerpt(active.writing.excerpt),
        `${active.writing.id}::excerpt`,
        0.15
      ),
      tags: "◌ ◌ ◌",
      hint: "click to decode",
    };
  }, [active, activeDiscovered]);

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Pure void - grain texture only */}
      <div 
        className="pointer-events-none fixed inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Cursor glow */}
      <div className="cursor-glow" style={{ left: mousePos.x, top: mousePos.y }} />

      <header className="fixed top-0 left-0 right-0 z-50 px-8 py-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className={`text-[10px] tracking-[0.4em] uppercase text-muted/40 hover:text-foreground/80 transition-all duration-700 ${
              isLoaded ? "animate-slide" : "opacity-0"
            }`}
          >
            ← return
          </Link>
          <div
            className={`flex items-center gap-8 ${
              isLoaded ? "animate-slide delay-1" : "opacity-0"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-foreground/20 animate-stellar" />
              <span className="text-[9px] font-mono tracking-[0.2em] text-muted/30">
                {writings.length} signals
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400/30 animate-node-breathe" />
              <span className="text-[9px] font-mono tracking-[0.2em] text-muted/30">
                {discoveredCount} decoded
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-36 pb-28 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-4xl mb-4">
            <p
              className={`text-[9px] font-mono tracking-[0.5em] uppercase text-muted/30 ${
                isLoaded ? "animate-reveal" : "opacity-0"
              }`}
            >
              constellation map
            </p>
            <h1
              className={`mt-6 text-[clamp(3.5rem,10vw,7rem)] leading-[0.85] tracking-[-0.04em] ${
                isLoaded ? "animate-emerge delay-1" : "opacity-0"
              }`}
            >
              Atlas
            </h1>
            <p
              className={`mt-10 text-[15px] leading-[2.2] text-muted/50 max-w-xl ${
                isLoaded ? "animate-reveal delay-2" : "opacity-0"
              }`}
            >
              Setiap titik cahaya adalah fragmen yang menunggu.
              <span className="block mt-1 text-muted/30">Hover untuk mendengar. Klik untuk masuk.</span>
            </p>
          </div>

          <section
            className={`relative mt-10 rounded-[2rem] border border-foreground/[0.04] overflow-hidden ${
              isLoaded ? "animate-reveal delay-3" : "opacity-0"
            }`}
            style={{ 
              height: "min(75vh, 780px)",
              background: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(147, 197, 253, 0.03), transparent 60%), radial-gradient(ellipse 60% 40% at 80% 70%, rgba(196, 167, 231, 0.02), transparent 50%), linear-gradient(to bottom, rgba(0,0,0,0.3), transparent 30%, transparent 70%, rgba(0,0,0,0.4))"
            }}
          >
            {/* Ambient noise texture */}
            <div 
              className="absolute inset-0 opacity-[0.015]" 
              style={{ 
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'repeat'
              }} 
            />
            {/* Edges - neural pathways */}
            <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
              <defs>
                <linearGradient id="edge-glow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(147, 197, 253, 0.3)" />
                  <stop offset="50%" stopColor="rgba(255, 255, 255, 0.4)" />
                  <stop offset="100%" stopColor="rgba(196, 167, 231, 0.3)" />
                </linearGradient>
                <filter id="edge-blur">
                  <feGaussianBlur stdDeviation="1" />
                </filter>
              </defs>
              {edges.map((e) => {
                const a = nodes[e.a];
                const b = nodes[e.b];
                const isActive = activeIndex != null && (e.a === activeIndex || e.b === activeIndex);

                const aRead = readIds.has(a.writing.id);
                const bRead = readIds.has(b.writing.id);
                const bothRead = aRead && bRead;
                const eitherRead = aRead || bRead;

                let alpha = 0.04;
                if (eitherRead) alpha = 0.12;
                if (bothRead) alpha = 0.2;

                return (
                  <g key={`${nodes[e.a].writing.id}--${nodes[e.b].writing.id}`}>
                    {/* Base edge */}
                    <line
                      x1={`${a.x * 100}%`}
                      y1={`${a.y * 100}%`}
                      x2={`${b.x * 100}%`}
                      y2={`${b.y * 100}%`}
                      stroke={`rgba(255,255,255,${alpha})`}
                      strokeWidth={isActive ? 1.5 : 0.5}
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    />
                    {/* Active glow edge */}
                    {isActive && (
                      <line
                        x1={`${a.x * 100}%`}
                        y1={`${a.y * 100}%`}
                        x2={`${b.x * 100}%`}
                        y2={`${b.y * 100}%`}
                        stroke="url(#edge-glow)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        filter="url(#edge-blur)"
                        className="animate-pulse"
                      />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Nodes - stellar signals */}
            <div className="absolute inset-0">
              {nodes.map((node, index) => {
                const isActive = activeIndex === index;
                const isRead = readIds.has(node.writing.id);
                const pulseDelay = (index * 0.3) % 4;

                const style: React.CSSProperties = {
                  left: `${node.x * 100}%`,
                  top: `${node.y * 100}%`,
                  width: node.r * 2.5,
                  height: node.r * 2.5,
                  transform: "translate(-50%, -50%)",
                  animationDelay: `${pulseDelay}s`,
                };

                return (
                  <Link
                    key={node.writing.id}
                    href={`/reading/${node.writing.id}`}
                    className={`absolute group ${
                      isRead ? 'animate-node-breathe' : 'animate-stellar'
                    }`}
                    style={style}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                    aria-label={`Open ${node.writing.title}`}
                  >
                    {/* Outer glow ring */}
                    <span
                      className={`absolute inset-[-8px] rounded-full transition-all duration-700 ${
                        isActive 
                          ? 'opacity-100 scale-150' 
                          : isRead 
                            ? 'opacity-30 scale-100' 
                            : 'opacity-0 scale-75'
                      }`}
                      style={{
                        background: isRead 
                          ? 'radial-gradient(circle, rgba(147, 197, 253, 0.25), transparent 70%)'
                          : 'radial-gradient(circle, rgba(255, 255, 255, 0.2), transparent 70%)',
                        filter: 'blur(8px)',
                      }}
                    />
                    
                    {/* Core dot */}
                    <span
                      className={`block w-full h-full rounded-full border transition-all duration-500 ${
                        isActive 
                          ? 'bg-white/40 border-white/60 scale-125' 
                          : isRead 
                            ? 'bg-blue-300/20 border-blue-300/40' 
                            : 'bg-white/5 border-white/15 group-hover:bg-white/15 group-hover:border-white/30'
                      }`}
                    />
                    
                    {/* Inner light */}
                    <span
                      className={`absolute inset-[25%] rounded-full transition-all duration-500 ${
                        isActive 
                          ? 'opacity-100 bg-white/60' 
                          : isRead 
                            ? 'opacity-60 bg-blue-200/40' 
                            : 'opacity-20 bg-white/30 group-hover:opacity-50'
                      }`}
                      style={{ filter: 'blur(1px)' }}
                    />
                  </Link>
                );
              })}
            </div>

            {/* Hover panel - transmission receiver */}
            <div className={`absolute bottom-0 left-0 right-0 p-10 transition-all duration-700 ${
              activeIndex !== null ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-80'
            }`}>
              <div className="max-w-2xl">
                <div 
                  className={`relative rounded-2xl border overflow-hidden transition-all duration-500 ${
                    hoverModel.kind === 'discovered' 
                      ? 'border-blue-400/20 bg-blue-950/20' 
                      : hoverModel.kind === 'encrypted'
                        ? 'border-purple-400/10 bg-purple-950/10'
                        : 'border-foreground/[0.04] bg-background/40'
                  } backdrop-blur-2xl`}
                >
                  {/* Scanning line effect for encrypted */}
                  {hoverModel.kind === 'encrypted' && (
                    <div 
                      className="absolute inset-0 overflow-hidden pointer-events-none"
                      style={{
                        background: 'linear-gradient(180deg, transparent 0%, rgba(196, 167, 231, 0.03) 50%, transparent 100%)',
                        animation: 'scan 2s ease-in-out infinite',
                      }}
                    />
                  )}
                  
                  <div className="relative px-8 py-7">
                    <div className="flex items-center gap-3 mb-5">
                      <span className={`w-2 h-2 rounded-full ${
                        hoverModel.kind === 'discovered' 
                          ? 'bg-blue-400/60 animate-pulse' 
                          : hoverModel.kind === 'encrypted'
                            ? 'bg-purple-400/40 animate-pulse'
                            : 'bg-white/20'
                      }`} />
                      <p className="text-[9px] font-mono tracking-[0.4em] uppercase text-muted/50">
                        {hoverModel.label}
                      </p>
                    </div>

                    {hoverModel.title ? (
                      <p 
                        className={`text-[1.6rem] leading-[1.2] tracking-[-0.02em] transition-all duration-500 ${
                          hoverModel.kind === 'encrypted' ? 'text-foreground/60' : 'text-foreground/90'
                        }`} 
                        style={{ fontFamily: "var(--font-cormorant), serif" }}
                      >
                        {hoverModel.title}
                      </p>
                    ) : null}

                    <p className={`mt-5 text-[13px] leading-[2] transition-all duration-500 ${
                      hoverModel.kind === 'idle' ? 'text-muted/40' : 'text-muted/60'
                    }`}>
                      {hoverModel.excerpt}
                    </p>

                    <div className="mt-6 flex items-center justify-between">
                      {hoverModel.tags ? (
                        <p className="text-[10px] font-mono tracking-[0.15em] text-muted/30">
                          {hoverModel.tags}
                        </p>
                      ) : <span />}

                      {hoverModel.hint ? (
                        <p className="text-[10px] font-mono tracking-[0.2em] uppercase text-muted/40">
                          {hoverModel.hint}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
