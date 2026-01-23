"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { triggerPortal } from "@/components/portal-transition";

type CandlePhase = "idle" | "striking" | "lighting" | "glowing" | "illuminating";

interface CandleInstrumentProps {
  enabled: boolean;
  isAnyActive: boolean;
  isLoaded: boolean;
  isNightTime: boolean;
  onPhaseChange?: (phase: CandlePhase) => void;
}

export function CandleInstrument({
  enabled,
  isAnyActive,
  isLoaded,
  isNightTime,
  onPhaseChange,
}: CandleInstrumentProps) {
  const [phase, setPhase] = useState<CandlePhase>("idle");
  const [hover, setHover] = useState(false);
  const [flameIntensity, setFlameIntensity] = useState(0);
  const [flickerOffset, setFlickerOffset] = useState({ x: 0, y: 0 });
  
  const tiltRef = useRef({ x: 0, y: 0 });
  const [, forceUpdate] = useState(0);

  // Candle flicker effect
  useEffect(() => {
    if (phase === "idle" && !hover) {
      setFlameIntensity(0);
      return;
    }
    const flickerInterval = setInterval(() => {
      setFlickerOffset({
        x: (Math.random() - 0.5) * 4,
        y: (Math.random() - 0.5) * 2 - 1,
      });
      if (phase === "glowing" || phase === "illuminating") {
        setFlameIntensity(0.7 + Math.random() * 0.3);
      } else if (phase === "lighting") {
        setFlameIntensity(0.4 + Math.random() * 0.3);
      } else if (hover) {
        setFlameIntensity(0.2 + Math.random() * 0.2);
      }
    }, 100);
    return () => clearInterval(flickerInterval);
  }, [phase, hover]);

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

  const updatePhase = useCallback((newPhase: CandlePhase) => {
    setPhase(newPhase);
    onPhaseChange?.(newPhase);
  }, [onPhaseChange]);

  const runJourney = useCallback(async () => {
    if (phase !== "idle" || !isNightTime) return;

    updatePhase("striking");
    for (let i = 0; i < 8; i++) {
      setFlickerOffset({ x: (Math.random() - 0.5) * 15, y: (Math.random() - 0.5) * 10 });
      setFlameIntensity(Math.random() * 0.3);
      await new Promise(r => setTimeout(r, 60));
    }
    await new Promise(r => setTimeout(r, 200));

    updatePhase("lighting");
    for (let i = 0; i < 12; i++) {
      setFlameIntensity(prev => Math.min(0.6, prev + 0.05));
      setFlickerOffset({ x: (Math.random() - 0.5) * 6, y: (Math.random() - 0.5) * 3 - i * 0.3 });
      await new Promise(r => setTimeout(r, 80));
    }
    await new Promise(r => setTimeout(r, 300));

    updatePhase("glowing");
    for (let i = 0; i < 15; i++) {
      setFlameIntensity(0.7 + Math.sin(i * 0.5) * 0.15);
      await new Promise(r => setTimeout(r, 60));
    }
    await new Promise(r => setTimeout(r, 400));

    updatePhase("illuminating");
    for (let i = 0; i < 8; i++) {
      setFlameIntensity(0.85 + i * 0.02);
      await new Promise(r => setTimeout(r, 50));
    }
    await new Promise(r => setTimeout(r, 300));
    
    triggerPortal("/about", { x: window.innerWidth / 2, y: window.innerHeight / 2 }, "About");
  }, [phase, isNightTime, updatePhase]);

  const getLabel = () => {
    if (!isNightTime) return "Only at Night";
    switch (phase) {
      case "striking": return "Striking...";
      case "lighting": return "Igniting...";
      case "glowing": return "Burning...";
      case "illuminating": return "Illuminating...";
      default: return "Candle";
    }
  };

  const isActive = phase !== "idle";
  const showEffects = isNightTime && (hover || isActive);

  if (!enabled) return null;

  return (
    <button
      type="button"
      onClick={runJourney}
      disabled={isAnyActive || !isNightTime}
      className={`group relative text-left h-full ${isLoaded ? "animate-reveal delay-4" : "opacity-0"}`}
      style={{
        transform: `perspective(1200px) rotateX(${tiltRef.current.x}deg) rotateY(${tiltRef.current.y}deg)`,
        transformStyle: "preserve-3d",
        transition: hover ? "transform 0.1s ease-out" : "transform 0.5s ease-out",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); resetTilt(); }}
      onMouseMove={(e) => hover && handleTilt(e)}
    >
      {/* Card glow - only at night */}
      {isNightTime && (
        <div className={`absolute -inset-0.5 rounded-3xl transition-all duration-700 ${
          isActive 
            ? "bg-gradient-to-br from-rose-500/20 via-orange-500/15 to-transparent opacity-100 blur-xl" 
            : hover 
              ? "bg-gradient-to-br from-rose-500/10 via-transparent to-transparent opacity-100 blur-lg"
              : "opacity-0"
        }`} />
      )}
      
      <div className={`relative rounded-3xl border transition-all duration-500 p-6 sm:p-8 h-full flex flex-col overflow-hidden ${
        !isNightTime 
          ? "border-zinc-800/20 bg-gradient-to-b from-zinc-900/40 to-zinc-950/40 opacity-40" 
          : showEffects 
            ? "border-rose-500/20 bg-gradient-to-b from-zinc-900/90 via-zinc-900/80 to-zinc-950/90 shadow-2xl shadow-rose-500/5" 
            : "border-zinc-800/40 bg-gradient-to-b from-zinc-900/60 to-zinc-950/60"
      }`}>
        {/* Warm glow at night */}
        {showEffects && (
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full bg-gradient-to-t from-rose-500/10 via-orange-500/5 to-transparent blur-2xl" 
            style={{ opacity: flameIntensity * 0.8 }} 
          />
        )}
        
        <div className="h-36 sm:h-40 relative flex items-center justify-center mb-4 overflow-hidden">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Base shadow */}
              <ellipse cx="50" cy="88" rx="18" ry="5" className={`${showEffects ? "fill-zinc-800/80" : "fill-zinc-900/40"}`} />
              
              {/* Candle body */}
              <rect x="42" y="48" width="16" height="38" rx="2" 
                className={`transition-all duration-300`} 
                fill={showEffects ? "url(#candleBody)" : "#3f3f46"} 
                fillOpacity={showEffects ? 1 : 0.2}
              />
              
              {/* Wick */}
              <line x1="50" y1="48" x2="50" y2="42" 
                className={`${showEffects ? "stroke-zinc-700" : "stroke-zinc-600/30"}`} 
                strokeWidth="1.5" strokeLinecap="round" 
              />
              
              {/* Flame - only when active */}
              {showEffects && (
                <>
                  {/* Outer glow */}
                  <ellipse 
                    cx={50 + flickerOffset.x * 0.3} 
                    cy={26 + flickerOffset.y} 
                    rx={14 + flameIntensity * 8} 
                    ry={20 + flameIntensity * 10} 
                    fill="url(#flameGlow)" 
                    style={{ opacity: flameIntensity * 0.6, filter: "blur(8px)" }} 
                  />
                  
                  {/* Main flame */}
                  <path
                    d={`M50 42 Q${45 + flickerOffset.x} ${32 + flickerOffset.y} ${47 + flickerOffset.x * 0.5} ${22 + flickerOffset.y} Q${49 + flickerOffset.x * 0.3} ${16 + flickerOffset.y * 0.5} ${50} ${12 + flameIntensity * -4} Q${51 - flickerOffset.x * 0.3} ${16 + flickerOffset.y * 0.5} ${53 - flickerOffset.x * 0.5} ${22 + flickerOffset.y} Q${55 - flickerOffset.x} ${32 + flickerOffset.y} 50 42`}
                    fill="url(#flameGradient)"
                    style={{ opacity: 0.7 + flameIntensity * 0.3, filter: "blur(0.3px)" }}
                  />
                  
                  {/* Inner bright core */}
                  {flameIntensity > 0.3 && (
                    <ellipse 
                      cx={50 + flickerOffset.x * 0.15} 
                      cy={34 + flickerOffset.y * 0.3} 
                      rx={3 + flameIntensity * 2} 
                      ry={7 + flameIntensity * 4} 
                      fill="#fff5eb" 
                      style={{ opacity: flameIntensity * 0.95 }} 
                    />
                  )}
                </>
              )}
              
              <defs>
                <linearGradient id="candleBody" x1="50%" y1="0%" x2="50%" y2="100%">
                  <stop offset="0%" stopColor="#fef2f2" />
                  <stop offset="100%" stopColor="#fecaca" />
                </linearGradient>
                <radialGradient id="flameGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fb923c" stopOpacity="0.6" />
                  <stop offset="50%" stopColor="#f97316" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="flameGradient" x1="50%" y1="100%" x2="50%" y2="0%">
                  <stop offset="0%" stopColor="#ea580c" />
                  <stop offset="30%" stopColor="#f97316" />
                  <stop offset="60%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#fef3c7" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
        
        {/* Night indicator */}
        {!isNightTime && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5">
            <svg viewBox="0 0 20 20" className="w-4 h-4 text-zinc-700">
              <path fill="currentColor" d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          </div>
        )}
        
        {/* Roman numeral */}
        <div className={`absolute top-4 left-4 text-[10px] font-light tracking-widest transition-all duration-500 ${
          showEffects ? "text-rose-400/50" : "text-zinc-700/50"
        }`}>IV</div>
        
        <div className="text-center mt-auto relative z-10">
          <h3 className={`text-xl font-extralight tracking-wide mb-1.5 transition-all duration-500 ${
            !isNightTime ? "text-zinc-600" : showEffects ? "text-zinc-200" : "text-zinc-400"
          }`} style={{ fontFamily: "var(--font-cormorant), serif" }}>
            {getLabel()}
          </h3>
          <p className={`text-[9px] tracking-[0.25em] uppercase font-light ${
            !isNightTime ? "text-zinc-700" : showEffects ? "text-rose-400/70" : "text-zinc-600"
          }`}>
            {!isNightTime ? "Available after dusk" : phase === "idle" ? "Intimate Reflections" : "Lighting..."}
          </p>
        </div>
        
        {/* Bottom accent line */}
        <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-px transition-all duration-500 ${
          showEffects ? "w-16 bg-gradient-to-r from-transparent via-rose-500/50 to-transparent" : "w-8 bg-gradient-to-r from-transparent via-zinc-700/30 to-transparent"
        }`} />
      </div>
    </button>
  );
}

export type { CandlePhase };
