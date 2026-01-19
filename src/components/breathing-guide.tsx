"use client";

import { useState, useEffect, useCallback } from "react";

interface BreathingGuideProps {
  isActive: boolean;
  onComplete?: () => void;
}

type BreathPhase = "inhale" | "hold" | "exhale" | "rest";

export function BreathingGuide({ isActive, onComplete }: BreathingGuideProps) {
  const [phase, setPhase] = useState<BreathPhase>("rest");
  const [progress, setProgress] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  
  // Breathing pattern: 4-7-8 technique (calming)
  const phaseDurations = {
    inhale: 4000,   // 4 seconds
    hold: 7000,     // 7 seconds
    exhale: 8000,   // 8 seconds
    rest: 1000,     // 1 second pause
  };
  
  const phaseInstructions = {
    inhale: "Breathe in...",
    hold: "Hold...",
    exhale: "Release...",
    rest: "",
  };
  
  const phaseColors = {
    inhale: "from-slate-600/20 to-slate-700/20",
    hold: "from-slate-500/25 to-slate-600/25",
    exhale: "from-slate-700/15 to-slate-800/15",
    rest: "from-transparent to-transparent",
  };
  
  // Show/hide animation
  useEffect(() => {
    if (isActive) {
      setIsVisible(true);
      setPhase("rest");
      setCycleCount(0);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isActive]);
  
  // Breathing cycle
  useEffect(() => {
    if (!isActive || !isVisible) return;
    
    const cyclePhases = async () => {
      // Start with rest
      await new Promise(r => setTimeout(r, 500));
      
      while (true) {
        // Inhale
        setPhase("inhale");
        setProgress(0);
        await animateProgress(phaseDurations.inhale);
        
        // Hold
        setPhase("hold");
        setProgress(0);
        await animateProgress(phaseDurations.hold);
        
        // Exhale
        setPhase("exhale");
        setProgress(0);
        await animateProgress(phaseDurations.exhale);
        
        // Rest
        setPhase("rest");
        setCycleCount(c => c + 1);
        await new Promise(r => setTimeout(r, phaseDurations.rest));
      }
    };
    
    const controller = new AbortController();
    cyclePhases();
    
    return () => controller.abort();
  }, [isActive, isVisible]);
  
  const animateProgress = (duration: number): Promise<void> => {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        setProgress(progress);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(animate);
    });
  };
  
  // Calculate circle scale based on phase and progress
  const getCircleScale = useCallback(() => {
    switch (phase) {
      case "inhale":
        return 0.6 + progress * 0.4; // 0.6 → 1.0
      case "hold":
        return 1.0;
      case "exhale":
        return 1.0 - progress * 0.4; // 1.0 → 0.6
      case "rest":
        return 0.6;
    }
  }, [phase, progress]);
  
  if (!isVisible) return null;
  
  const scale = getCircleScale();
  
  return (
    <div 
      className={`
        fixed inset-0 z-[60] flex items-center justify-center
        pointer-events-none
        transition-opacity duration-500
        ${isActive ? "opacity-100" : "opacity-0"}
      `}
    >
      {/* Backdrop blur */}
      <div 
        className={`
          absolute inset-0 backdrop-blur-sm
          bg-gradient-to-b ${phaseColors[phase]}
          transition-all duration-1000
        `}
      />
      
      {/* Breathing circle container */}
      <div className="relative flex flex-col items-center">
        {/* Outer glow ring */}
        <div 
          className="absolute w-64 h-64 rounded-full transition-all duration-500"
          style={{
            transform: `scale(${scale * 1.2})`,
            background: "radial-gradient(circle, transparent 60%, rgba(100, 116, 139, 0.05) 100%)",
          }}
        />
        
        {/* Main breathing circle */}
        <div 
          className="relative w-48 h-48 rounded-full border border-zinc-600/30 transition-all"
          style={{
            transform: `scale(${scale})`,
            transitionDuration: phase === "hold" ? "0ms" : "100ms",
            boxShadow: `
              0 0 60px rgba(100, 116, 139, ${0.1 * scale}),
              inset 0 0 40px rgba(100, 116, 139, 0.05)
            `,
            background: `radial-gradient(circle at 30% 30%, 
              rgba(148, 163, 184, 0.08), 
              rgba(100, 116, 139, 0.02) 50%,
              transparent 70%
            )`,
          }}
        >
          {/* Inner pulse */}
          <div 
            className="absolute inset-4 rounded-full border border-zinc-500/20"
            style={{
              opacity: phase === "hold" ? 0.8 : 0.4,
              transition: "opacity 500ms",
            }}
          />
          
          {/* Center dot */}
          <div 
            className="absolute top-1/2 left-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-400/40"
            style={{
              transform: `translate(-50%, -50%) scale(${1 + (1 - scale) * 2})`,
            }}
          />
        </div>
        
        {/* Instruction text */}
        <div className="mt-8 text-center">
          <p 
            className={`
              text-lg font-light text-zinc-400 tracking-widest
              transition-opacity duration-500
              ${phase === "rest" ? "opacity-0" : "opacity-100"}
            `}
          >
            {phaseInstructions[phase]}
          </p>
          
          {/* Phase timer */}
          <div className="mt-4 flex items-center justify-center gap-2">
            {phase !== "rest" && (
              <>
                <div className="w-32 h-0.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-zinc-600 transition-all duration-100"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
                <span className="text-xs text-zinc-600 tabular-nums w-8">
                  {Math.ceil((1 - progress) * (phaseDurations[phase] / 1000))}s
                </span>
              </>
            )}
          </div>
        </div>
        
        {/* Cycle counter */}
        {cycleCount > 0 && (
          <p className="mt-6 text-xs text-zinc-600">
            Cycle {cycleCount}
          </p>
        )}
        
        {/* Helper text */}
        <p className="mt-8 text-[10px] text-zinc-700 tracking-wide">
          4-7-8 BREATHING • FIND YOUR CALM
        </p>
      </div>
    </div>
  );
}

export default BreathingGuide;
