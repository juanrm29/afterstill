"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";

interface ReadingCompanionProps {
  readonly scrollProgress: number;
  readonly isReading: boolean;
  readonly mood?: "melancholic" | "hopeful" | "introspective" | "peaceful" | "neutral";
  readonly readingDuration?: number; // minutes since start
}

type CompanionState = "awakening" | "following" | "curious" | "resting" | "excited" | "sleeping" | "candle";

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
      @keyframes flame-flicker {
        0%, 100% { transform: scaleY(1) scaleX(1); }
        25% { transform: scaleY(1.1) scaleX(0.95); }
        50% { transform: scaleY(0.95) scaleX(1.05); }
        75% { transform: scaleY(1.05) scaleX(0.98); }
      }
      .companion-glow { filter: blur(8px); }
    `;
    document.head.appendChild(style);
  }
};

// Helper to get animation based on state
const getCompanionAnimation = (companionState: CompanionState): string => {
  if (companionState === "candle") return 'none';
  if (companionState === "sleeping") return 'companion-sleep-breathe 4s ease-in-out infinite';
  if (companionState === "resting") return 'companion-float 6s ease-in-out infinite';
  return 'companion-float 3s ease-in-out infinite';
};

// Helper to get size based on state
const getCompanionSize = (companionState: CompanionState): number => {
  if (companionState === "candle") return 16;
  if (companionState === "excited") return 14;
  if (companionState === "sleeping") return 10;
  return 12;
};

export function ReadingCompanion({ scrollProgress, isReading, mood = "neutral", readingDuration = 0 }: ReadingCompanionProps) {
  const [position, setPosition] = useState({ x: 85, y: 30 });
  const [state, setState] = useState<CompanionState>("awakening");
  const [isVisible, setIsVisible] = useState(false);
  const [glowIntensity, setGlowIntensity] = useState(0.5);
  const [candleMode, setCandleMode] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [smoothMousePos, setSmoothMousePos] = useState({ x: 0, y: 0 });
  const [flameSkew, setFlameSkew] = useState(0);
  const [showDimReminder, setShowDimReminder] = useState(false);
  
  const lastScrollRef = useRef(scrollProgress);
  const idleCountRef = useRef(0);
  const animationRef = useRef<number>(0);
  const previousState = useRef<CompanionState>("following");
  
  // Mood colors
  const moodColors = useMemo(() => ({
    melancholic: { primary: "#6b7280", glow: "rgba(107, 114, 128, 0.4)" },
    hopeful: { primary: "#fbbf24", glow: "rgba(251, 191, 36, 0.4)" },
    introspective: { primary: "#8b5cf6", glow: "rgba(139, 92, 246, 0.4)" },
    peaceful: { primary: "#34d399", glow: "rgba(52, 211, 153, 0.4)" },
    neutral: { primary: "#e4e4e7", glow: "rgba(228, 228, 231, 0.3)" },
  }), []);
  
  const colors = moodColors[mood];
  
  // Mouse tracking for candle mode
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (candleMode) {
      setMousePos({ x: e.clientX, y: e.clientY });
    }
  }, [candleMode]);
  
  // Smooth mouse position interpolation
  useEffect(() => {
    if (!candleMode) return;
    
    let frameId: number;
    const smoothFollow = () => {
      setSmoothMousePos(prev => ({
        x: prev.x + (mousePos.x - prev.x) * 0.15,
        y: prev.y + (mousePos.y - prev.y) * 0.15,
      }));
      
      // Calculate flame skew based on movement
      const dx = mousePos.x - smoothMousePos.x;
      setFlameSkew(Math.max(-15, Math.min(15, dx * 0.8)));
      
      frameId = requestAnimationFrame(smoothFollow);
    };
    
    frameId = requestAnimationFrame(smoothFollow);
    return () => cancelAnimationFrame(frameId);
  }, [candleMode, mousePos, smoothMousePos]);
  
  // Add mouse listener
  useEffect(() => {
    if (candleMode) {
      globalThis.addEventListener('mousemove', handleMouseMove);
      return () => globalThis.removeEventListener('mousemove', handleMouseMove);
    }
  }, [candleMode, handleMouseMove]);
  
  // 30-minute reading reminder
  useEffect(() => {
    if (candleMode && readingDuration >= 30 && !showDimReminder) {
      // Use timeout to avoid direct setState in effect
      const showTimer = setTimeout(() => setShowDimReminder(true), 0);
      // Auto-hide after 10 seconds
      const hideTimer = setTimeout(() => setShowDimReminder(false), 10000);
      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [candleMode, readingDuration, showDimReminder]);
  
  // Toggle candle mode
  const toggleCandleMode = useCallback(() => {
    if (candleMode) {
      // Exiting candle mode - restore previous state
      setState(previousState.current);
      setCandleMode(false);
      setShowDimReminder(false);
    } else {
      // Entering candle mode - store current state
      previousState.current = state;
      setState("candle");
      setCandleMode(true);
      // Initialize smooth position to center of screen
      const centerX = globalThis.innerWidth / 2;
      const centerY = globalThis.innerHeight / 2;
      setMousePos({ x: centerX, y: centerY });
      setSmoothMousePos({ x: centerX, y: centerY });
    }
  }, [candleMode, state]);
  
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
    <>
      {/* Darkness overlay for candle mode */}
      {candleMode && (
        <div
          className="fixed inset-0 z-40 pointer-events-none transition-opacity duration-1000"
          style={{
            background: `radial-gradient(
              circle at ${smoothMousePos.x}px ${smoothMousePos.y}px,
              transparent 0%,
              transparent 80px,
              rgba(0, 0, 0, 0.3) 120px,
              rgba(0, 0, 0, 0.7) 200px,
              rgba(0, 0, 0, 0.92) 350px
            )`,
          }}
        />
      )}
      
      {/* 30-minute dim reminder */}
      {showDimReminder && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="bg-amber-950/80 backdrop-blur-sm border border-amber-600/30 rounded-lg px-6 py-3">
            <p className="text-amber-200/90 text-sm font-serif text-center">
              You&apos;ve been reading by candlelight for 30 minutes...<br />
              <span className="text-amber-400/70 text-xs">Perhaps rest your eyes a moment</span>
            </p>
          </div>
        </div>
      )}
      
      <div className="fixed inset-0 pointer-events-none z-100 overflow-hidden">
        {/* Candle toggle button - positioned above music button */}
        <button
          onClick={toggleCandleMode}
          className="absolute bottom-20 sm:bottom-[72px] right-4 sm:right-6 pointer-events-auto group z-[201]"
          title={candleMode ? "Extinguish candle" : "Light candle for focused reading"}
        >
          <div className={`
            relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center
            transition-all duration-500
            ${candleMode 
              ? 'bg-amber-900/60 border border-amber-500/50' 
              : 'bg-zinc-900/40 border border-zinc-700/30 hover:border-amber-500/30'
            }
          `}>
            {/* Candle icon */}
            <svg 
              viewBox="0 0 24 24" 
              className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-300 ${candleMode ? 'text-amber-400' : 'text-zinc-500 group-hover:text-amber-300'}`}
              fill="currentColor"
            >
              <path d="M12 2c-1 0-2 1.5-2 3s1 2.5 2 2.5 2-1 2-2.5-1-3-2-3zm-1 7v13h2V9h-2z" />
            </svg>
            
            {/* Glow when active */}
            {candleMode && (
              <div 
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(251, 191, 36, 0.3) 0%, transparent 70%)',
                  animation: 'flame-flicker 0.5s ease-in-out infinite',
                }}
              />
            )}
          </div>
        </button>
        
        {/* Candle flame at cursor when in candle mode */}
        {candleMode && (
          <div
            className="fixed pointer-events-none z-50"
            style={{
              left: smoothMousePos.x,
              top: smoothMousePos.y,
              transform: `translate(-50%, -100%) skewX(${flameSkew}deg)`,
            }}
          >
            {/* Outer flame glow */}
            <div 
              className="absolute -inset-8 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(251, 191, 36, 0.15) 0%, transparent 70%)',
              }}
            />
            
            {/* Main flame */}
            <div
              className="relative"
              style={{
                width: 16,
                height: 32,
                background: 'linear-gradient(to top, #f59e0b 0%, #fbbf24 30%, #fef3c7 70%, transparent 100%)',
                borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                animation: 'flame-flicker 0.5s ease-in-out infinite',
                filter: 'blur(0.5px)',
              }}
            />
            
            {/* Inner bright core */}
            <div
              className="absolute top-1/3 left-1/2 -translate-x-1/2"
              style={{
                width: 6,
                height: 14,
                background: 'linear-gradient(to top, #fbbf24 0%, #fef9c3 50%, white 100%)',
                borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                opacity: 0.9,
                animation: 'flame-flicker 0.3s ease-in-out infinite reverse',
              }}
            />
          </div>
        )}
        
        {/* Main companion body - hidden during candle mode */}
        {!candleMode && (
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
        )}
        
        {/* State indicator - hidden during candle mode */}
        {!candleMode && (
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
        )}
      </div>
    </>
  );
}

export default ReadingCompanion;
