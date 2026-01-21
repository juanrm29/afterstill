"use client";

import { useEffect, useState, useRef } from "react";

interface ScrollProgressProps {
  showPercentage?: boolean;
  position?: "top" | "bottom" | "left" | "right";
  color?: string;
}

export function ScrollProgress({ 
  showPercentage = false,
  position = "top",
  color = "rgba(139, 92, 246, 0.6)"
}: ScrollProgressProps) {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const rafRef = useRef<number | undefined>(undefined);
  
  useEffect(() => {
    const updateProgress = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = (window.scrollY / scrollHeight) * 100;
      setProgress(Math.min(100, Math.max(0, scrolled)));
      setIsVisible(window.scrollY > 100);
    };
    
    const handleScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateProgress);
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    updateProgress();
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);
  
  const isHorizontal = position === "top" || position === "bottom";
  
  const positionStyles = {
    top: "top-0 left-0 right-0 h-[2px]",
    bottom: "bottom-0 left-0 right-0 h-[2px]",
    left: "top-0 bottom-0 left-0 w-[2px]",
    right: "top-0 bottom-0 right-0 w-[2px]",
  };
  
  return (
    <>
      {/* Progress bar */}
      <div 
        className={`fixed z-[100] pointer-events-none ${positionStyles[position]}`}
        style={{ 
          background: "rgba(255, 255, 255, 0.03)",
        }}
      >
        <div
          className="h-full transition-transform duration-100 ease-out"
          style={{
            width: isHorizontal ? `${progress}%` : "100%",
            height: isHorizontal ? "100%" : `${progress}%`,
            background: `linear-gradient(${isHorizontal ? "90deg" : "180deg"}, ${color}, transparent)`,
            transformOrigin: isHorizontal ? "left" : "top",
          }}
        />
      </div>
      
      {/* Percentage indicator */}
      {showPercentage && (
        <div 
          className={`fixed z-[100] transition-all duration-300 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
          style={{
            bottom: "1.5rem",
            right: "1.5rem",
          }}
        >
          <div className="glass rounded-full px-3 py-1.5 flex items-center gap-2">
            <div className="relative w-8 h-8">
              <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth="2"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray={`${progress * 0.94} 94`}
                  className="transition-all duration-100"
                />
              </svg>
            </div>
            <span className="text-xs font-mono text-zinc-400 tabular-nums">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      )}
    </>
  );
}

// Scroll to top button
export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 500);
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  
  return (
    <button
      type="button"
      onClick={scrollToTop}
      className={`fixed bottom-6 left-6 z-[100] w-10 h-10 rounded-full glass flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
      aria-label="Scroll to top"
    >
      <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
    </button>
  );
}
