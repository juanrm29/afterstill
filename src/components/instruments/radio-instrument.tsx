"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { triggerPortal } from "@/components/portal-transition";
import { SignalBars } from "@/components/ui/star-field";

type RadioPhase = "idle" | "scanning" | "locking" | "acquired" | "transmitting";

interface RadioInstrumentProps {
  enabled: boolean;
  isAnyActive: boolean;
  writings: Array<{ id: string; title: string; date: string }>;
  isLoaded: boolean;
  onPhaseChange?: (phase: RadioPhase) => void;
}

function pickWeightedRandomId(ids: string[]): string {
  if (ids.length === 0) return "";
  const weights = ids.map((_, i) => 1 + Math.max(0, ids.length - i) * 0.06);
  const total = weights.reduce((sum, w) => sum + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < ids.length; i++) {
    r -= weights[i];
    if (r <= 0) return ids[i];
  }
  return ids.at(-1) ?? "";
}

export function RadioInstrument({
  enabled,
  isAnyActive,
  writings,
  isLoaded,
  onPhaseChange,
}: RadioInstrumentProps) {
  const [phase, setPhase] = useState<RadioPhase>("idle");
  const [hover, setHover] = useState(false);
  const [frequency, setFrequency] = useState(88);
  const [signalNoise, setSignalNoise] = useState<number[]>([]);
  const [dialRotation, setDialRotation] = useState(0);
  
  const tiltRef = useRef({ x: 0, y: 0 });
  const [, forceUpdate] = useState(0);

  // Get IDs sorted by recency
  const idsByRecency = [...writings]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((w) => w.id);

  // Signal noise animation
  useEffect(() => {
    const interval = setInterval(() => {
      setSignalNoise(Array.from({ length: 24 }, () => Math.random()));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Hover animation
  useEffect(() => {
    if (!hover || phase !== "idle") return;
    const interval = setInterval(() => {
      setFrequency(prev => {
        const next = prev + (Math.random() - 0.5) * 2;
        return Math.max(88, Math.min(108, next));
      });
      setDialRotation(prev => prev + (Math.random() - 0.5) * 10);
    }, 100);
    return () => clearInterval(interval);
  }, [hover, phase]);

  const handleTilt = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    tiltRef.current = {
      x: ((y - centerY) / centerY) * -8,
      y: ((x - centerX) / centerX) * 8,
    };
    forceUpdate(n => n + 1);
  }, []);

  const resetTilt = useCallback(() => {
    tiltRef.current = { x: 0, y: 0 };
    forceUpdate(n => n + 1);
  }, []);

  const updatePhase = useCallback((newPhase: RadioPhase) => {
    setPhase(newPhase);
    onPhaseChange?.(newPhase);
  }, [onPhaseChange]);

  const runJourney = useCallback(async () => {
    if (phase !== "idle" || writings.length === 0) return;
    const id = pickWeightedRandomId(idsByRecency);
    if (!id) return;

    updatePhase("scanning");
    for (let i = 0; i < 15; i++) {
      setFrequency(88 + Math.random() * 20);
      setDialRotation(prev => prev + 15);
      await new Promise(r => setTimeout(r, 80));
    }
    updatePhase("locking");
    for (let i = 0; i < 6; i++) {
      setFrequency(prev => prev + (103.7 - prev) * 0.3);
      setDialRotation(prev => prev + 5);
      await new Promise(r => setTimeout(r, 120));
    }
    setFrequency(103.7);
    updatePhase("acquired");
    await new Promise(r => setTimeout(r, 800));
    updatePhase("transmitting");
    await new Promise(r => setTimeout(r, 400));
    
    const writing = writings.find(w => w.id === id);
    triggerPortal(`/reading/${id}`, { x: window.innerWidth / 2, y: window.innerHeight / 2 }, writing?.title);
  }, [phase, writings, idsByRecency, updatePhase]);

  const getLabel = () => {
    switch (phase) {
      case "scanning": return "Scanning...";
      case "locking": return "Locking...";
      case "acquired": return "Signal Found";
      case "transmitting": return "Transmitting...";
      default: return "Radio";
    }
  };

  const isActive = phase !== "idle";
  const showEffects = hover || isActive;

  if (!enabled) return null;

  return (
    <button
      type="button"
      onClick={runJourney}
      disabled={isAnyActive}
      className={`group relative text-left h-full ${isLoaded ? "animate-reveal delay-2" : "opacity-0"}`}
      style={{
        transform: `perspective(1200px) rotateX(${tiltRef.current.x}deg) rotateY(${tiltRef.current.y}deg)`,
        transformStyle: "preserve-3d",
        transition: hover ? "transform 0.1s ease-out" : "transform 0.5s ease-out",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); resetTilt(); }}
      onMouseMove={(e) => hover && handleTilt(e)}
    >
      {/* Card glow effect */}
      <div className={`absolute -inset-0.5 rounded-3xl transition-all duration-700 ${
        isActive 
          ? "bg-gradient-to-br from-cyan-500/20 via-teal-500/10 to-transparent opacity-100 blur-xl" 
          : hover 
            ? "bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent opacity-100 blur-lg"
            : "opacity-0"
      }`} />
      
      <div className={`relative rounded-3xl border transition-all duration-500 p-6 sm:p-8 h-full flex flex-col overflow-hidden ${
        showEffects
          ? "border-cyan-500/20 bg-gradient-to-b from-zinc-900/90 via-zinc-900/80 to-zinc-950/90 shadow-2xl shadow-cyan-500/5" 
          : "border-zinc-800/40 bg-gradient-to-b from-zinc-900/60 to-zinc-950/60"
      }`}>
        {/* Inner glow */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full transition-all duration-700 ${
          isActive ? "bg-cyan-500/10 blur-3xl" : hover ? "bg-cyan-500/5 blur-2xl" : "bg-transparent"
        }`} />
        
        <div className="h-36 sm:h-40 relative flex items-center justify-center mb-4">
          {/* Radio unit */}
          <div className={`relative w-28 h-24 rounded-lg border transition-all duration-500 ${
            isActive ? "border-cyan-500/30 bg-gradient-to-b from-zinc-800/80 to-zinc-900/80" : hover ? "border-zinc-700/40 bg-zinc-800/50" : "border-zinc-800/30 bg-zinc-900/50"
          }`}>
            {/* Frequency display */}
            <div className={`absolute top-2 left-1/2 -translate-x-1/2 w-20 h-7 rounded border flex items-center justify-center transition-all duration-300 ${
              phase === "acquired" ? "border-cyan-400/50 bg-cyan-500/10 shadow-inner shadow-cyan-500/10" : isActive ? "border-cyan-500/20 bg-zinc-800/50" : "border-zinc-700/30 bg-zinc-800/30"
            }`}>
              <span className={`text-xs font-mono tabular-nums transition-all duration-300 ${
                phase === "acquired" ? "text-cyan-300" : isActive ? "text-zinc-300" : "text-zinc-500"
              }`}>
                {frequency.toFixed(1)}
              </span>
              <span className={`ml-1 text-[9px] font-mono ${isActive ? "text-cyan-400/60" : "text-zinc-600"}`}>MHz</span>
            </div>
            
            {/* Signal bars */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2">
              <SignalBars 
                levels={signalNoise.slice(0, 12)} 
                phase={phase} 
                isHover={hover} 
              />
            </div>
            
            {/* Dial */}
            <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full border-2 transition-all duration-300 ${
              isActive ? "border-cyan-500/40 shadow-lg shadow-cyan-500/10" : "border-zinc-700/30"
            }`}
              style={{ 
                transform: `rotate(${dialRotation}deg)`,
                transition: phase === "scanning" ? "none" : "transform 0.3s ease-out"
              }}
            >
              <div className={`absolute top-1 left-1/2 -translate-x-1/2 w-0.5 h-2 rounded-full ${
                isActive ? "bg-cyan-400" : hover ? "bg-zinc-500" : "bg-zinc-600"
              }`} />
            </div>
          </div>
        </div>
        
        {/* Roman numeral */}
        <div className={`absolute top-4 left-4 text-[10px] font-light tracking-widest transition-all duration-500 ${
          showEffects ? "text-cyan-400/50" : "text-zinc-700/50"
        }`}>II</div>
        
        <div className="text-center mt-auto relative z-10">
          <h3 className={`text-xl font-extralight tracking-wide mb-1.5 transition-all duration-500 ${
            showEffects ? "text-zinc-200" : "text-zinc-400"
          }`} style={{ fontFamily: "var(--font-cormorant), serif" }}>
            {getLabel()}
          </h3>
          <p className={`text-[9px] tracking-[0.25em] uppercase font-light ${
            showEffects ? "text-cyan-400/70" : "text-zinc-600"
          }`}>
            {phase === "idle" ? "Find a Signal" : "Tuning..."}
          </p>
        </div>
        
        {/* Bottom accent line */}
        <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-px transition-all duration-500 ${
          showEffects ? "w-16 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" : "w-8 bg-gradient-to-r from-transparent via-zinc-700/30 to-transparent"
        }`} />
      </div>
    </button>
  );
}

export type { RadioPhase };
