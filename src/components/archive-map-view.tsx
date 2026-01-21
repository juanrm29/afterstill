"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import Link from "next/link";

// Writing type
type Writing = {
  id: string;
  title: string;
  date: string;
  tags: string[];
  excerpt: string;
  content: string;
};

interface StarNode {
  writing: Writing;
  x: number;
  y: number;
  size: number;
  brightness: number;
  discovered: boolean;
  color: string;
  pulseSpeed: number;
  pulseOffset: number;
}

// Seeded random
function seededRandom(seed: string) {
  let h = 2166136261;
  for (const ch of seed) {
    h ^= ch.codePointAt(0) ?? 0;
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h >>> 17;
    h = Math.imul(h, 0xed5ad4bb);
    h ^= h >>> 11;
    h = Math.imul(h, 0xac4c1b51);
    h ^= h >>> 15;
    return (h >>> 0) / 4294967296;
  };
}

// Get star color from tags
function getStarColor(tags: string[]): string {
  const tagSet = new Set(tags.map(t => t.toLowerCase()));
  if (tagSet.has("memory") || tagSet.has("nostalgia")) return "#7dd3fc";
  if (tagSet.has("hope") || tagSet.has("dawn") || tagSet.has("light")) return "#fde68a";
  if (tagSet.has("silence") || tagSet.has("solitude")) return "#c4b5fd";
  if (tagSet.has("growth") || tagSet.has("breath")) return "#86efac";
  if (tagSet.has("language") || tagSet.has("orbit")) return "#fda4af";
  return "#e4e4e7";
}

const READ_HISTORY_KEY = "afterstill-read-history";

export function ArchiveMapView() {
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);
  const [writings, setWritings] = useState<Writing[]>([]);
  const [time, setTime] = useState(0);
  const [cameraOffset, setCameraOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch writings
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

  // Load read history
  useEffect(() => {
    try {
      const raw = localStorage.getItem(READ_HISTORY_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      if (Array.isArray(arr)) setReadIds(new Set(arr));
    } catch { /* ignore */ }
    
    const timer = setTimeout(() => setIsLoaded(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Animation loop
  useEffect(() => {
    let animationId: number;
    const animate = () => {
      setTime(t => t + 1);
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Generate star nodes - FIXED: includes writings in dependencies
  const nodes = useMemo<StarNode[]>(() => {
    if (writings.length === 0) return [];
    
    const sorted = [...writings].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    return sorted.map((writing, index) => {
      const rand = seededRandom(writing.id);
      const color = getStarColor(writing.tags);
      
      // Golden spiral distribution for beautiful layout
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));
      const angle = index * goldenAngle;
      const radius = 8 + Math.sqrt(index + 1) * 8;
      
      return {
        writing,
        x: 50 + Math.cos(angle) * radius,
        y: 50 + Math.sin(angle) * radius,
        size: 0.8 + rand() * 0.5,
        brightness: 0.6 + rand() * 0.4,
        discovered: readIds.has(writing.id),
        color,
        pulseSpeed: 0.02 + rand() * 0.02,
        pulseOffset: rand() * Math.PI * 2,
      };
    });
  }, [writings, readIds]);

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('a, button')) return;
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: cameraOffset.x,
      offsetY: cameraOffset.y,
    };
  }, [cameraOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setCameraOffset({
        x: e.clientX - dragStart.current.x + dragStart.current.offsetX,
        y: e.clientY - dragStart.current.y + dragStart.current.offsetY,
      });
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const discoveredCount = nodes.filter(n => n.discovered).length;
  const selected = selectedNode ? nodes.find(n => n.writing.id === selectedNode) : null;

  if (viewMode === "list") {
    return <ArchiveListView writings={writings} onSwitchView={() => setViewMode("map")} />;
  }

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-[#020204] text-zinc-100 relative overflow-hidden select-none cursor-grab active:cursor-grabbing"
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Deep space background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Nebula gradients */}
        <div 
          className="absolute w-[800px] h-[800px] rounded-full blur-[120px] opacity-[0.08]"
          style={{
            background: 'radial-gradient(circle, #6366f1, transparent 70%)',
            left: '10%',
            top: '20%',
            transform: `translate(${Math.sin(time * 0.003) * 20}px, ${Math.cos(time * 0.002) * 15}px)`,
          }}
        />
        <div 
          className="absolute w-[600px] h-[600px] rounded-full blur-[100px] opacity-[0.06]"
          style={{
            background: 'radial-gradient(circle, #06b6d4, transparent 70%)',
            right: '15%',
            bottom: '20%',
            transform: `translate(${Math.cos(time * 0.004) * 15}px, ${Math.sin(time * 0.003) * 20}px)`,
          }}
        />
        <div 
          className="absolute w-[500px] h-[500px] rounded-full blur-[80px] opacity-[0.05]"
          style={{
            background: 'radial-gradient(circle, #a855f7, transparent 70%)',
            left: '50%',
            top: '60%',
            transform: `translate(-50%, -50%) translate(${Math.sin(time * 0.002) * 10}px, ${Math.cos(time * 0.004) * 10}px)`,
          }}
        />
        
        {/* Distant stars */}
        <svg className="absolute inset-0 w-full h-full">
          {Array.from({ length: 150 }).map((_, i) => {
            const rand = seededRandom(`bg-star-${i}`);
            const twinkle = Math.sin(time * (0.02 + rand() * 0.02) + i) * 0.4 + 0.6;
            return (
              <circle
                key={`bg-${i}`}
                cx={`${rand() * 100}%`}
                cy={`${rand() * 100}%`}
                r={rand() * 1.2 + 0.3}
                fill="white"
                opacity={rand() * 0.3 * twinkle}
              />
            );
          })}
        </svg>
      </div>

      {/* Constellation connection lines */}
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          transform: `translate(${cameraOffset.x}px, ${cameraOffset.y}px)`,
          transition: isDragging ? 'none' : 'transform 0.15s ease-out',
        }}
      >
        {nodes.map((node, i) => {
          const nearestNodes = nodes
            .map((n, j) => ({ n, dist: Math.hypot(n.x - node.x, n.y - node.y), j }))
            .filter(({ j, dist }) => j !== i && dist < 20)
            .sort((a, b) => a.dist - b.dist)
            .slice(0, 2);
          
          return nearestNodes.map(({ n: targetNode }) => {
            const isActive = hoveredNode === node.writing.id || hoveredNode === targetNode.writing.id;
            return (
              <line
                key={`line-${node.writing.id}-${targetNode.writing.id}`}
                x1={`${node.x}%`}
                y1={`${node.y}%`}
                x2={`${targetNode.x}%`}
                y2={`${targetNode.y}%`}
                stroke={isActive ? node.color : "#27272a"}
                strokeWidth={isActive ? 1.5 : 0.5}
                strokeOpacity={isActive ? 0.8 : 0.15}
                style={{ transition: 'all 0.4s ease' }}
              />
            );
          });
        })}
      </svg>

      {/* Star nodes */}
      <div 
        className="absolute inset-0"
        style={{
          transform: `translate(${cameraOffset.x}px, ${cameraOffset.y}px)`,
          transition: isDragging ? 'none' : 'transform 0.15s ease-out',
        }}
      >
        {nodes.map((node, index) => {
          const isHovered = hoveredNode === node.writing.id;
          const pulse = Math.sin(time * node.pulseSpeed + node.pulseOffset) * 0.3 + 0.7;
          
          return (
            <Link
              key={node.writing.id}
              href={`/reading/${node.writing.id}`}
              className={`
                absolute transform -translate-x-1/2 -translate-y-1/2 
                transition-all duration-500 z-10 group
                ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}
              `}
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                transitionDelay: `${index * 80}ms`,
              }}
              onMouseEnter={() => setHoveredNode(node.writing.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={(e) => {
                if (window.innerWidth < 768) {
                  e.preventDefault();
                  setSelectedNode(node.writing.id);
                }
              }}
            >
              {/* Outer glow */}
              <div 
                className="absolute rounded-full transition-all duration-500"
                style={{
                  width: `${(isHovered ? 80 : 50) * node.size}px`,
                  height: `${(isHovered ? 80 : 50) * node.size}px`,
                  transform: 'translate(-50%, -50%)',
                  left: '50%',
                  top: '50%',
                  background: `radial-gradient(circle, ${node.color}${isHovered ? '40' : '15'}, transparent 70%)`,
                  filter: 'blur(8px)',
                  opacity: pulse,
                }}
              />
              
              {/* Orbit ring */}
              <div 
                className="absolute rounded-full border transition-all duration-500"
                style={{
                  width: `${(isHovered ? 40 : 28) * node.size}px`,
                  height: `${(isHovered ? 40 : 28) * node.size}px`,
                  transform: 'translate(-50%, -50%)',
                  left: '50%',
                  top: '50%',
                  borderColor: isHovered ? `${node.color}60` : node.discovered ? `${node.color}30` : '#3f3f4620',
                  opacity: pulse,
                }}
              />
              
              {/* Star core */}
              <div 
                className="relative rounded-full transition-all duration-300"
                style={{
                  width: `${(isHovered ? 14 : 10) * node.size}px`,
                  height: `${(isHovered ? 14 : 10) * node.size}px`,
                  background: node.discovered 
                    ? `radial-gradient(circle at 30% 30%, white, ${node.color})` 
                    : `radial-gradient(circle at 30% 30%, #71717a, #3f3f46)`,
                  boxShadow: isHovered 
                    ? `0 0 30px ${node.color}, 0 0 60px ${node.color}50, inset 0 0 10px rgba(255,255,255,0.5)` 
                    : node.discovered 
                      ? `0 0 15px ${node.color}60` 
                      : 'none',
                }}
              />

              {/* Sparkle particles for discovered */}
              {node.discovered && (
                <>
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="absolute rounded-full pointer-events-none"
                      style={{
                        width: '3px',
                        height: '3px',
                        background: node.color,
                        left: '50%',
                        top: '50%',
                        transform: `translate(-50%, -50%) rotate(${time * 0.5 + i * 120}deg) translateX(${16 + Math.sin(time * 0.05 + i) * 4}px)`,
                        opacity: 0.6 * pulse,
                        boxShadow: `0 0 6px ${node.color}`,
                      }}
                    />
                  ))}
                </>
              )}

              {/* Hover tooltip */}
              <div 
                className={`
                  absolute left-1/2 -translate-x-1/2 bottom-full mb-4
                  bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 
                  px-4 py-3 rounded-xl whitespace-nowrap z-50
                  transition-all duration-300 pointer-events-none
                  ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
                `}
                style={{
                  boxShadow: `0 0 40px ${node.color}20`,
                }}
              >
                <p className="text-sm font-light mb-1" style={{ color: node.color }}>
                  {node.writing.title}
                </p>
                <p className="text-[10px] text-zinc-500">
                  {new Date(node.writing.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                  })}
                  {" · "}
                  <span className={node.discovered ? "text-emerald-400" : "text-zinc-600"}>
                    {node.discovered ? "discovered" : "undiscovered"}
                  </span>
                </p>
                <div className="flex gap-1.5 mt-2">
                  {node.writing.tags.slice(0, 3).map(tag => (
                    <span 
                      key={tag}
                      className="text-[8px] px-1.5 py-0.5 rounded-full"
                      style={{ 
                        background: `${node.color}20`,
                        color: node.color,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Selected panel (mobile) */}
      {selected && (
        <div className="fixed inset-x-0 bottom-0 z-50 bg-gradient-to-t from-zinc-900 via-zinc-900/98 to-transparent pt-16 pb-8 px-6">
          <div className="max-w-md mx-auto text-center">
            <div className="w-10 h-0.5 rounded-full mx-auto mb-4" style={{ background: selected.color }} />
            <h2 className="text-xl font-light mb-2" style={{ fontFamily: "var(--font-cormorant), serif" }}>
              {selected.writing.title}
            </h2>
            <p className="text-sm text-zinc-400 mb-4 line-clamp-2">{selected.writing.excerpt}</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setSelectedNode(null)} className="px-4 py-2 text-xs text-zinc-500">Close</button>
              <Link href={`/reading/${selected.writing.id}`} className="px-5 py-2 text-xs rounded-lg" style={{ background: `${selected.color}20`, color: selected.color }}>
                Read →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 px-8 py-6 bg-gradient-to-b from-[#020204] via-[#020204]/50 to-transparent">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className={`text-[10px] tracking-[0.3em] uppercase text-zinc-500 hover:text-zinc-300 transition-all duration-500 ${
              isLoaded ? "opacity-100" : "opacity-0"
            }`}
          >
            ← back
          </Link>
          
          <div className={`flex items-center gap-6 transition-all duration-500 ${isLoaded ? "opacity-100" : "opacity-0"}`}>
            <span className="text-[10px] font-mono text-zinc-600">
              <span className="text-zinc-400">{discoveredCount}</span>/{writings.length} discovered
            </span>
            <button
              onClick={() => setViewMode("list")}
              className="text-[9px] tracking-[0.2em] uppercase text-zinc-500 hover:text-zinc-300 px-4 py-2 border border-zinc-800 hover:border-zinc-600 rounded-lg transition-all"
            >
              list view
            </button>
          </div>
        </div>
      </header>

      {/* Legend */}
      <div className={`fixed bottom-8 left-8 z-30 space-y-2 transition-all duration-700 ${isLoaded ? "opacity-100" : "opacity-0"}`}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
          <span className="text-[9px] text-zinc-500">discovered</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-zinc-600" />
          <span className="text-[9px] text-zinc-600">undiscovered</span>
        </div>
      </div>

      {/* Title */}
      <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-30 transition-all duration-700 ${isLoaded ? "opacity-100" : "opacity-0"}`}>
        <h1 className="text-[11px] tracking-[0.5em] uppercase text-zinc-500">the archive</h1>
      </div>

      {/* Instructions */}
      <div className={`fixed bottom-8 right-8 z-30 text-[9px] text-zinc-600 transition-all duration-700 ${isLoaded ? "opacity-100" : "opacity-0"}`}>
        drag to explore · click to read
      </div>
    </div>
  );
}

// List view
function ArchiveListView({ writings, onSwitchView }: { writings: Writing[]; onSwitchView: () => void }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    writings.forEach(w => w.tags.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [writings]);

  const filteredWritings = useMemo(() => {
    return writings.filter(w => {
      const matchesSearch = !searchQuery || 
        w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = !selectedTag || w.tags.includes(selectedTag);
      return matchesSearch && matchesTag;
    });
  }, [writings, searchQuery, selectedTag]);

  const grouped = useMemo(() => {
    const sorted = [...filteredWritings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return sorted.reduce((acc, w) => {
      const year = new Date(w.date).getFullYear();
      if (!acc[year]) acc[year] = [];
      acc[year].push(w);
      return acc;
    }, {} as Record<number, Writing[]>);
  }, [filteredWritings]);

  const years = Object.keys(grouped).map(Number).sort((a, b) => b - a);

  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100);
  }, []);

  return (
    <div className="min-h-screen bg-[#020204] text-zinc-100 safe-area-inset">
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-indigo-950/5 via-transparent to-cyan-950/5" />

      {/* Header - Mobile optimized */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 py-4 sm:py-6 glass">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-[10px] tracking-[0.3em] uppercase text-zinc-500 hover:text-zinc-300 transition-colors touch-target flex items-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span className="hidden sm:inline">back</span>
          </Link>
          <h1 className="text-[11px] tracking-[0.3em] uppercase text-zinc-500">Archive</h1>
          <button onClick={onSwitchView} className="text-[9px] tracking-[0.2em] uppercase text-zinc-500 hover:text-zinc-300 px-3 py-2 border border-zinc-800 hover:border-zinc-600 rounded-lg transition-all touch-target flex items-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
            </svg>
            <span className="hidden sm:inline">map</span>
          </button>
        </div>
      </header>

      <main className="pt-24 sm:pt-32 pb-20 px-4 sm:px-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          
          {/* Search and filter - Mobile friendly */}
          <div className={`mb-8 sm:mb-12 space-y-4 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {/* Search input */}
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" />
                <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search writings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-zinc-900/50 border border-zinc-800/50 rounded-xl text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700/50 transition-all"
              />
            </div>
            
            {/* Tags filter - Horizontal scroll on mobile */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar smooth-scroll -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
              <button
                onClick={() => setSelectedTag(null)}
                className={`shrink-0 text-[10px] tracking-wider uppercase px-3 py-1.5 rounded-full border transition-all touch-target ${
                  !selectedTag 
                    ? 'bg-zinc-700 border-zinc-600 text-zinc-200' 
                    : 'bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-700'
                }`}
              >
                All ({writings.length})
              </button>
              {allTags.slice(0, 8).map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`shrink-0 text-[10px] tracking-wider uppercase px-3 py-1.5 rounded-full border transition-all touch-target ${
                    selectedTag === tag 
                      ? 'bg-zinc-700 border-zinc-600 text-zinc-200' 
                      : 'bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-700'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Results count */}
          <div className={`mb-6 text-[10px] text-zinc-600 tracking-wider transition-all duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
            {filteredWritings.length} {filteredWritings.length === 1 ? 'writing' : 'writings'} found
          </div>

          {/* Writings list */}
          <div className="space-y-12 sm:space-y-16">
            {years.map((year, yi) => (
              <section key={year} className={`transition-all duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: `${yi * 100}ms` }}>
                <div className="flex items-center gap-4 sm:gap-8 mb-4 sm:mb-6 sticky top-20 sm:top-24 bg-[#020204]/90 backdrop-blur-sm py-2 -mx-4 px-4 sm:mx-0 sm:px-0 z-10">
                  <h2 className="text-2xl sm:text-3xl font-extralight text-zinc-600" style={{ fontFamily: "var(--font-cormorant), serif" }}>{year}</h2>
                  <div className="h-px bg-gradient-to-r from-zinc-800 to-transparent flex-1" />
                  <span className="text-[9px] text-zinc-700 tracking-wider">{grouped[year].length}</span>
                </div>
                <div className="space-y-1">
                  {grouped[year].map((w, wi) => {
                    const color = getStarColor(w.tags);
                    const isHovered = hoveredId === w.id;
                    return (
                      <Link
                        key={w.id}
                        href={`/reading/${w.id}`}
                        className={`group flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 py-4 px-4 -mx-4 rounded-xl transition-all duration-300 press-effect stagger-item`}
                        style={{ 
                          background: isHovered ? `${color}08` : 'transparent',
                          animationDelay: `${wi * 50}ms`
                        }}
                        onMouseEnter={() => setHoveredId(w.id)}
                        onMouseLeave={() => setHoveredId(null)}
                      >
                        {/* Mobile: Title and date on top row */}
                        <div className="flex items-start gap-3 flex-1">
                          <div 
                            className="w-2 h-2 rounded-full mt-2 shrink-0 transition-all duration-300"
                            style={{ background: isHovered ? color : '#3f3f46', boxShadow: isHovered ? `0 0 12px ${color}` : 'none' }}
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-base sm:text-lg font-light transition-colors duration-300 line-clamp-2" style={{ color: isHovered ? color : '#a1a1aa', fontFamily: "var(--font-cormorant), serif" }}>
                              {w.title}
                            </span>
                            {/* Excerpt on mobile */}
                            <p className="sm:hidden text-xs text-zinc-600 mt-1 line-clamp-2">{w.excerpt}</p>
                          </div>
                        </div>
                        
                        {/* Tags and date */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 pl-5 sm:pl-0">
                          <div className="flex items-center gap-2">
                            {w.tags.slice(0, 2).map(tag => (
                              <span key={tag} className="text-[8px] sm:text-[9px] px-2 py-0.5 rounded-full" style={{ background: `${color}15`, color }}>
                                {tag}
                              </span>
                            ))}
                          </div>
                          <span className="text-[10px] font-mono text-zinc-600 shrink-0">
                            {new Date(w.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          {/* Empty state */}
          {filteredWritings.length === 0 && isLoaded && (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full border border-zinc-800/50 flex items-center justify-center">
                <svg className="w-6 h-6 text-zinc-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8" />
                  <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
                </svg>
              </div>
              <p className="text-zinc-500 text-sm">No writings match your search</p>
              <button 
                onClick={() => { setSearchQuery(""); setSelectedTag(null); }}
                className="mt-4 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default ArchiveMapView;
