"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { triggerPortal } from "@/components/portal-transition";

type CatalogPhase = "idle" | "shuffling" | "sorting" | "found" | "opening";

interface CatalogInstrumentProps {
  enabled: boolean;
  isAnyActive: boolean;
  isLoaded: boolean;
  onPhaseChange?: (phase: CatalogPhase) => void;
}

export function CatalogInstrument({
  enabled,
  isAnyActive,
  isLoaded,
  onPhaseChange,
}: CatalogInstrumentProps) {
  const [phase, setPhase] = useState<CatalogPhase>("idle");
  const [hover, setHover] = useState(false);
  const [cardRotations, setCardRotations] = useState([0, 0, 0, 0, 0]);
  const [activeCardIndex, setActiveCardIndex] = useState(2);
  const [cardElevation, setCardElevation] = useState(0);
  
  const tiltRef = useRef({ x: 0, y: 0 });
  const [, forceUpdate] = useState(0);

  // Hover animation
  useEffect(() => {
    if (!hover || phase !== "idle") return;
    const interval = setInterval(() => {
      setCardRotations(prev => prev.map((r, i) => {
        const base = (i - 2) * 2;
        return base + Math.sin(Date.now() / 300 + i) * 1.5;
      }));
    }, 50);
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

  const updatePhase = useCallback((newPhase: CatalogPhase) => {
    setPhase(newPhase);
    onPhaseChange?.(newPhase);
  }, [onPhaseChange]);

  const runJourney = useCallback(async () => {
    if (phase !== "idle") return;

    updatePhase("shuffling");
    for (let i = 0; i < 6; i++) {
      setCardRotations([-35 - i*2, -18 - i, 0, 18 + i, 35 + i*2]);
      setCardElevation(i * 3);
      await new Promise(r => setTimeout(r, 60));
    }
    await new Promise(r => setTimeout(r, 200));

    updatePhase("sorting");
    const searchSequence = [0, 1, 4, 3, 1, 2, 4, 0, 3, 2];
    for (const idx of searchSequence) {
      setActiveCardIndex(idx);
      await new Promise(r => setTimeout(r, 100));
    }

    for (let i = 0; i < 8; i++) {
      setCardRotations(prev => prev.map((r, idx) => {
        const target = (idx - 2) * 4;
        return r + (target - r) * 0.35;
      }));
      setCardElevation(prev => Math.max(0, prev - 2));
      await new Promise(r => setTimeout(r, 50));
    }
    setCardRotations([-8, -4, 0, 4, 8]);
    setActiveCardIndex(2);
    setCardElevation(0);

    updatePhase("found");
    await new Promise(r => setTimeout(r, 300));
    for (let i = 0; i < 10; i++) {
      setCardElevation(i * 4);
      await new Promise(r => setTimeout(r, 40));
    }
    await new Promise(r => setTimeout(r, 400));

    updatePhase("opening");
    for (let i = 0; i < 8; i++) {
      setCardElevation(prev => prev + 8);
      await new Promise(r => setTimeout(r, 40));
    }
    await new Promise(r => setTimeout(r, 200));
    
    triggerPortal("/archive", { x: window.innerWidth / 2, y: window.innerHeight / 2 }, "The Archive");
  }, [phase, updatePhase]);

  const getLabel = () => {
    switch (phase) {
      case "shuffling": return "Fanning Out...";
      case "sorting": return "Searching...";
      case "found": return "Entry Located";
      case "opening": return "Opening...";
      default: return "Catalog";
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
      className={`group relative text-left h-full ${isLoaded ? "animate-reveal delay-3" : "opacity-0"}`}
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
          ? "bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent opacity-100 blur-xl" 
          : hover 
            ? "bg-gradient-to-br from-amber-500/10 via-transparent to-transparent opacity-100 blur-lg"
            : "opacity-0"
      }`} />
      
      <div className={`relative rounded-3xl border transition-all duration-500 p-6 sm:p-8 h-full flex flex-col overflow-hidden ${
        showEffects
          ? "border-amber-500/20 bg-gradient-to-b from-zinc-900/90 via-zinc-900/80 to-zinc-950/90 shadow-2xl shadow-amber-500/5" 
          : "border-zinc-800/40 bg-gradient-to-b from-zinc-900/60 to-zinc-950/60"
      }`}>
        {/* Inner glow */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full transition-all duration-700 ${
          isActive ? "bg-amber-500/10 blur-3xl" : hover ? "bg-amber-500/5 blur-2xl" : "bg-transparent"
        }`} />
        
        <div className="h-36 sm:h-40 relative flex items-center justify-center mb-4">
          {/* Card stack */}
          <div className="relative w-28 h-20">
            {[0, 1, 2, 3, 4].map((i) => {
              const isActiveCard = i === activeCardIndex;
              const isFound = phase === "found" || phase === "opening";
              const yOffset = isFound && i === 2 ? -cardElevation : (isActiveCard && phase === "sorting" ? -20 : 0);
              
              return (
                <div
                  key={`card-${i}`}
                  className={`absolute top-1/2 left-1/2 w-14 h-20 rounded-sm border transition-all ${
                    isFound && i === 2
                      ? "bg-amber-800/40 border-amber-400/50 shadow-lg shadow-amber-500/20"
                      : isActiveCard && phase === "sorting"
                        ? "bg-amber-900/30 border-amber-500/30"
                        : showEffects
                          ? "bg-zinc-800/80 border-zinc-700/40"
                          : "bg-zinc-900/50 border-zinc-800/20"
                  }`}
                  style={{
                    transform: `translate(-50%, -50%) rotate(${cardRotations[i]}deg) translateY(${yOffset}px)`,
                    transformOrigin: "center 120%",
                    transition: phase === "shuffling" ? "transform 0.06s ease-out" : "all 0.15s ease-out",
                    zIndex: isActiveCard ? 10 : 5 - Math.abs(i - 2),
                  }}
                >
                  {/* Card lines */}
                  <div className={`absolute top-3 left-2 right-2 h-px ${
                    isActiveCard || (isFound && i === 2) ? "bg-amber-500/30" : "bg-zinc-700/30"
                  }`} />
                  <div className={`absolute top-5 left-2 right-2 h-px ${
                    isActiveCard || (isFound && i === 2) ? "bg-amber-500/20" : "bg-zinc-700/20"
                  }`} />
                  <div className={`absolute top-7 left-2 right-4 h-px ${
                    isActiveCard || (isFound && i === 2) ? "bg-amber-500/15" : "bg-zinc-700/15"
                  }`} />
                </div>
              );
            })}
            
            {/* Shadow */}
            <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-4 rounded-full blur-md transition-all duration-300 ${
              isActive ? "bg-amber-500/15" : hover ? "bg-zinc-600/10" : "bg-zinc-800/5"
            }`} />
          </div>
        </div>
        
        {/* Roman numeral */}
        <div className={`absolute top-4 left-4 text-[10px] font-light tracking-widest transition-all duration-500 ${
          showEffects ? "text-amber-400/50" : "text-zinc-700/50"
        }`}>III</div>
        
        <div className="text-center mt-auto relative z-10">
          <h3 className={`text-xl font-extralight tracking-wide mb-1.5 transition-all duration-500 ${
            showEffects ? "text-zinc-200" : "text-zinc-400"
          }`} style={{ fontFamily: "var(--font-cormorant), serif" }}>
            {getLabel()}
          </h3>
          <p className={`text-[9px] tracking-[0.25em] uppercase font-light ${
            showEffects ? "text-amber-400/70" : "text-zinc-600"
          }`}>
            {phase === "idle" ? "Browse Archive" : phase === "found" || phase === "opening" ? `Entry #${activeCardIndex + 1}` : "Indexing..."}
          </p>
        </div>
        
        {/* Bottom accent line */}
        <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-px transition-all duration-500 ${
          showEffects ? "w-16 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" : "w-8 bg-gradient-to-r from-transparent via-zinc-700/30 to-transparent"
        }`} />
      </div>
    </button>
  );
}

export type { CatalogPhase };
