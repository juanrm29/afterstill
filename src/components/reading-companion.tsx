"use client";

import { useState, useEffect, useRef, useMemo } from "react";

interface ReadingCompanionProps {
  readonly scrollProgress: number;
  readonly isReading: boolean;
  readonly mood?: "melancholic" | "hopeful" | "introspective" | "peaceful" | "neutral";
}

type CompanionState = "awakening" | "following" | "curious" | "resting" | "excited" | "sleeping";

// Inject styles once
const injectStyles = () => {
  if (typeof document !== 'undefined' && !document.getElementById('companion-styles')) {
    const style = document.createElement('style');
    style.id = 'companion-styles';
    style.textContent = `
      @keyframes companion-float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-8px); }
      }
      @keyframes companion-pulse {
        0%, 100% { opacity: 0.6; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.2); }
      }
      @keyframes companion-sleep-breathe {
        0%, 100% { transform: scale(1); opacity: 0.3; }
        50% { transform: scale(0.95); opacity: 0.2; }
      }
      .companion-glow { filter: blur(8px); }
    `;
    document.head.appendChild(style);
  }
};

// Helper to get animation based on state
const getCompanionAnimation = (companionState: CompanionState): string => {
  if (companionState === "sleeping") return 'companion-sleep-breathe 4s ease-in-out infinite';
  if (companionState === "resting") return 'companion-float 6s ease-in-out infinite';
  return 'companion-float 3s ease-in-out infinite';
};

// Helper to get size based on state
const getCompanionSize = (companionState: CompanionState): number => {
  if (companionState === "excited") return 14;
  if (companionState === "sleeping") return 10;
  return 12;
};

export function ReadingCompanion({ scrollProgress, isReading, mood = "neutral" }: ReadingCompanionProps) {
  const [position, setPosition] = useState({ x: 85, y: 30 });
  const [state, setState] = useState<CompanionState>("awakening");
  const [isVisible, setIsVisible] = useState(false);
  const [glowIntensity, setGlowIntensity] = useState(0.5);
  
  const lastScrollRef = useRef(scrollProgress);
  const idleCountRef = useRef(0);
  const animationRef = useRef<number | undefined>(undefined);
  
  // Mood colors
  const moodColors = useMemo(() => ({
    melancholic: { primary: "#6b7280", glow: "rgba(107, 114, 128, 0.4)" },
    hopeful: { primary: "#fbbf24", glow: "rgba(251, 191, 36, 0.4)" },
    introspective: { primary: "#8b5cf6", glow: "rgba(139, 92, 246, 0.4)" },
    peaceful: { primary: "#34d399", glow: "rgba(52, 211, 153, 0.4)" },
    neutral: { primary: "#e4e4e7", glow: "rgba(228, 228, 231, 0.3)" },
  }), []);
  
  const colors = moodColors[mood];
  
  // Initialize
  useEffect(() => {
    injectStyles();
    const timer = setTimeout(() => {
      setIsVisible(true);
      setState("awakening");
      setTimeout(() => setState("following"), 1500);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);
  
  // Main animation loop
  useEffect(() => {
    const animate = () => {
      const scrollDelta = Math.abs(scrollProgress - lastScrollRef.current);
      lastScrollRef.current = scrollProgress;
      
      // Update state based on activity
      if (scrollDelta > 0.5) {
        idleCountRef.current = 0;
        if (scrollDelta > 3) {
          setState("excited");
        } else if (state === "sleeping" || state === "resting") {
          setState("following");
        } else if (state !== "excited") {
          setState("following");
        }
      } else if (isReading) {
        idleCountRef.current++;
        if (idleCountRef.current > 300) setState("sleeping");
        else if (idleCountRef.current > 150) setState("resting");
        else if (idleCountRef.current > 50) setState("curious");
      }
      
      // Calm down from excited
      if (state === "excited" && scrollDelta < 1) {
        setTimeout(() => setState("following"), 500);
      }
      
      // Calculate target position
      const baseX = 88 + Math.sin(scrollProgress * 0.1) * 3;
      const baseY = 25 + (scrollProgress * 0.5);
      
      let offsetX = 0;
      let offsetY = 0;
      const now = Date.now();
      
      if (state === "curious") {
        offsetX = Math.sin(now * 0.002) * 8;
        offsetY = Math.cos(now * 0.003) * 5;
      } else if (state === "excited") {
        offsetX = Math.sin(now * 0.01) * 12;
        offsetY = Math.cos(now * 0.012) * 8;
      } else if (state !== "resting" && state !== "sleeping") {
        offsetX = Math.sin(now * 0.001) * 2;
        offsetY = Math.cos(now * 0.0015) * 2;
      }
      
      const targetX = Math.max(75, Math.min(95, baseX + offsetX));
      const targetY = Math.max(15, Math.min(75, baseY + offsetY));
      
      // Smooth movement
      setPosition(prev => ({
        x: prev.x + (targetX - prev.x) * 0.05,
        y: prev.y + (targetY - prev.y) * 0.05,
      }));
      
      // Update glow
      if (state === "excited") {
        setGlowIntensity(0.9 + Math.random() * 0.1);
      } else if (state === "sleeping") {
        setGlowIntensity(0.2 + Math.sin(now * 0.002) * 0.1);
      } else {
        setGlowIntensity(0.5 + Math.sin(now * 0.003) * 0.15);
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [scrollProgress, isReading, state]);
  
  // Get companion size based on state
  const size = getCompanionSize(state);
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed inset-0 pointer-events-none z-100 overflow-hidden">
      {/* Main companion body */}
      <div
        className="absolute"
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`,
          transform: 'translate(-50%, -50%)',
          transition: state === "awakening" ? 'opacity 1s ease-out' : 'none',
          animation: getCompanionAnimation(state),
        }}
      >
        {/* Outer glow */}
        <div
          className="absolute rounded-full companion-glow"
          style={{
            width: size * 3,
            height: size * 3,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: colors.glow,
            opacity: glowIntensity * 0.6,
          }}
        />
        
        {/* Inner glow */}
        <div
          className="absolute rounded-full"
          style={{
            width: size * 1.8,
            height: size * 1.8,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: colors.glow,
            filter: 'blur(4px)',
            opacity: glowIntensity * 0.8,
          }}
        />
        
        {/* Core body */}
        <div
          className="relative rounded-full"
          style={{
            width: size,
            height: size,
            backgroundColor: colors.primary,
            boxShadow: `0 0 ${size}px ${colors.glow}`,
            animation: state === "excited" ? 'companion-pulse 0.3s ease-in-out infinite' : 'none',
          }}
        >
          {/* Eyes (only when not sleeping) */}
          {state !== "sleeping" && (
            <div className="absolute inset-0 flex items-center justify-center gap-1">
              <div
                className="rounded-full bg-zinc-900"
                style={{
                  width: size * 0.2,
                  height: state === "resting" ? size * 0.1 : size * 0.25,
                }}
              />
              <div
                className="rounded-full bg-zinc-900"
                style={{
                  width: size * 0.2,
                  height: state === "resting" ? size * 0.1 : size * 0.25,
                }}
              />
            </div>
          )}
          
          {/* Zzz when sleeping */}
          {state === "sleeping" && (
            <div 
              className="absolute -top-4 -right-2 text-[8px] text-zinc-600 font-mono"
              style={{ animation: 'companion-float 2s ease-in-out infinite' }}
            >
              z
            </div>
          )}
        </div>
      </div>
      
      {/* State indicator */}
      <div
        className="absolute text-[8px] font-mono tracking-widest uppercase"
        style={{
          left: `${position.x}%`,
          top: `${position.y + 4}%`,
          transform: 'translate(-50%, 0)',
          color: colors.primary,
          opacity: 0.4,
        }}
      >
        {state === "curious" && "?"}
        {state === "excited" && "!"}
      </div>
    </div>
  );
}

export default ReadingCompanion;
