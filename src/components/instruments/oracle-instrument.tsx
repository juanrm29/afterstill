"use client";

import { useState, useRef, useCallback } from "react";
import { PhaseParticles } from "@/components/ui/star-field";

type OraclePhase = "idle" | "gazing" | "revealing" | "shown";

interface OracleInstrumentProps {
  enabled: boolean;
  isAnyActive: boolean;
  writings: Array<{ id: string; title: string; content: string }>;
  isLoaded: boolean;
}

export function OracleInstrument({
  enabled,
  isAnyActive,
  writings,
  isLoaded,
}: OracleInstrumentProps) {
  const [phase, setPhase] = useState<OraclePhase>("idle");
  const [text, setText] = useState("");
  const [source, setSource] = useState("");
  const [hover, setHover] = useState(false);
  
  const tiltRef = useRef({ x: 0, y: 0 });
  const [, forceUpdate] = useState(0);

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

  const runJourney = useCallback(async () => {
    if (phase !== "idle" || writings.length === 0) return;
    
    const randomWriting = writings[Math.floor(Math.random() * writings.length)];
    const content = randomWriting?.content || "";
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 30 && s.trim().length < 150);
    const excerpt = sentences.length > 0 
      ? sentences[Math.floor(Math.random() * sentences.length)].trim() + "."
      : "Words drift like dust in sunlight...";

    setPhase("gazing");
    await new Promise(r => setTimeout(r, 1200));
    setPhase("revealing");
    setText(excerpt);
    setSource(randomWriting.title);
    await new Promise(r => setTimeout(r, 800));
    setPhase("shown");
    await new Promise(r => setTimeout(r, 5000));
    setPhase("idle");
    setText("");
    setSource("");
  }, [phase, writings]);

  const getLabel = () => {
    switch (phase) {
      case "gazing": return "Gazing...";
      case "revealing": return "Revealing...";
      case "shown": return "Oracle";
      default: return "Oracle";
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
      className={`group relative text-left h-full ${isLoaded ? "animate-reveal delay-1" : "opacity-0"}`}
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
          ? "bg-gradient-to-br from-violet-500/20 via-purple-500/10 to-transparent opacity-100 blur-xl" 
          : hover 
            ? "bg-gradient-to-br from-violet-500/10 via-transparent to-transparent opacity-100 blur-lg"
            : "opacity-0"
      }`} />
      
      <div className={`relative rounded-3xl border transition-all duration-500 p-6 sm:p-8 h-full flex flex-col overflow-hidden ${
        showEffects
          ? "border-violet-500/20 bg-gradient-to-b from-zinc-900/90 via-zinc-900/80 to-zinc-950/90 shadow-2xl shadow-violet-500/5" 
          : "border-zinc-800/40 bg-gradient-to-b from-zinc-900/60 to-zinc-950/60"
      }`}>
        {/* Ambient particles */}
        <PhaseParticles count={8} color="violet" active={showEffects} />
        
        {/* Inner glow */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full transition-all duration-700 ${
          isActive ? "bg-violet-500/10 blur-3xl" : hover ? "bg-violet-500/5 blur-2xl" : "bg-transparent"
        }`} />
        
        <div className="h-36 sm:h-40 relative flex items-center justify-center mb-4">
          {/* Concentric rings */}
          <div className={`absolute w-28 h-28 rounded-full border transition-all duration-1000 ${
            isActive ? "border-violet-400/20 scale-110" : hover ? "border-violet-500/10 scale-105" : "border-zinc-800/20 scale-100"
          }`} style={{ animation: isActive ? "pulse 2s ease-in-out infinite" : "none" }} />
          <div className={`absolute w-20 h-20 rounded-full border transition-all duration-700 ${
            isActive ? "border-violet-400/30" : hover ? "border-violet-500/15" : "border-zinc-800/15"
          }`} />
          
          {/* Eye icon */}
          <div className="relative w-20 h-20 flex items-center justify-center">
            <svg 
              className={`w-14 h-14 transition-all duration-500 ${
                isActive ? "text-violet-300" : hover ? "text-zinc-300" : "text-zinc-500"
              }`} 
              viewBox="0 0 48 48" fill="none"
            >
              <path 
                d="M4 24C4 24 12 10 24 10C36 10 44 24 44 24C44 24 36 38 24 38C12 38 4 24 4 24Z" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                fill="none"
                className={`transition-all duration-500 ${phase === "gazing" ? "animate-pulse" : ""}`}
              />
              <circle 
                cx="24" cy="24" r="9" 
                className={`transition-all duration-500 ${
                  isActive ? "fill-violet-500/20 stroke-violet-400/60" : "fill-transparent stroke-current"
                }`}
                strokeWidth="1"
              />
              <circle 
                cx="24" cy="24" r="4" 
                className={`transition-all duration-300 ${isActive ? "fill-violet-300" : "fill-current"}`}
              />
              <circle cx="21" cy="21" r="1.5" fill="currentColor" opacity="0.5" />
            </svg>
            
            {phase === "gazing" && (
              <>
                <div className="absolute inset-0 rounded-full border border-violet-400/30 animate-ping" style={{ animationDuration: "1.5s" }} />
                <div className="absolute inset-2 rounded-full border border-violet-400/20 animate-ping" style={{ animationDuration: "2s", animationDelay: "0.5s" }} />
              </>
            )}
          </div>
        </div>
        
        {/* Oracle text reveal */}
        {phase === "shown" && text && (
          <div className="absolute inset-4 flex flex-col items-center justify-center text-center bg-gradient-to-b from-zinc-950/95 to-zinc-900/95 backdrop-blur-md rounded-2xl p-4 border border-violet-500/10">
            <p className="text-sm text-zinc-200 italic leading-relaxed line-clamp-4" style={{ fontFamily: "var(--font-cormorant), serif" }}>
              &ldquo;{text}&rdquo;
            </p>
            <p className="text-[10px] text-violet-400/70 mt-3 tracking-widest uppercase">— {source}</p>
          </div>
        )}
        
        {/* Status indicator */}
        {isActive && (
          <div className="absolute top-4 right-4">
            <div className={`w-2 h-2 rounded-full ${phase === "shown" ? "bg-violet-400 shadow-lg shadow-violet-400/50" : "bg-violet-500/60 animate-pulse"}`} />
          </div>
        )}
        
        {/* Roman numeral */}
        <div className={`absolute top-4 left-4 text-[10px] font-light tracking-widest transition-all duration-500 ${
          showEffects ? "text-violet-400/50" : "text-zinc-700/50"
        }`}>I</div>
        
        <div className="text-center mt-auto relative z-10">
          <h3 className={`text-xl font-extralight tracking-wide mb-1.5 transition-all duration-500 ${
            showEffects ? "text-zinc-200" : "text-zinc-400"
          }`} style={{ fontFamily: "var(--font-cormorant), serif" }}>
            {getLabel()}
          </h3>
          <p className={`text-[9px] tracking-[0.25em] uppercase font-light ${
            showEffects ? "text-violet-400/70" : "text-zinc-600"
          }`}>
            {phase === "idle" ? "Glimpse a Fragment" : "Reading..."}
          </p>
        </div>
        
        {/* Bottom accent line */}
        <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-px transition-all duration-500 ${
          showEffects ? "w-16 bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" : "w-8 bg-gradient-to-r from-transparent via-zinc-700/30 to-transparent"
        }`} />
      </div>
    </button>
  );
}

// Export phase type for parent component
export type { OraclePhase };
