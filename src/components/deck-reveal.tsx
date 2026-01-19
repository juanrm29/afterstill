"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface DeckRevealProps {
  children: React.ReactNode;
  isLoaded: boolean;
}

// Check sessionStorage only once at module level (client-side only)
function getInitialRevealState(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem("deck-revealed") === "true";
}

export function DeckReveal({ children, isLoaded }: Readonly<DeckRevealProps>) {
  const [isRevealed, setIsRevealed] = useState(getInitialRevealState);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [deckHover, setDeckHover] = useState(false);
  const [mounted, setMounted] = useState(false);
  const deckRef = useRef<HTMLButtonElement>(null);
  
  // For portal
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // The reveal animation
  const revealDeck = useCallback(() => {
    if (isRevealed || isAnimating) return;
    
    setIsAnimating(true);
    
    // Reveal after animation
    setTimeout(() => {
      setIsRevealed(true);
      setIsAnimating(false);
      sessionStorage.setItem("deck-revealed", "true");
    }, 600);
  }, [isRevealed, isAnimating]);
  
  // Reset back to deck with animation
  const resetToDeck = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsRevealed(false);
      setIsClosing(false);
      sessionStorage.removeItem("deck-revealed");
    }, 400);
  }, []);
  
  return (
    <div className="relative">
      {/* The Deck - Always visible as anchor */}
      <button 
        ref={deckRef}
        type="button"
        className={`relative cursor-pointer transition-all duration-500 w-full bg-transparent border-none ${isLoaded ? "animate-reveal" : "opacity-0"} ${isRevealed ? "pointer-events-none" : ""}`}
        onClick={revealDeck}
        onMouseEnter={() => !isRevealed && setDeckHover(true)}
        onMouseLeave={() => setDeckHover(false)}
      >
        {/* Instruction text */}
        <div className={`text-center mb-4 transition-all duration-500 ${isRevealed ? "opacity-0" : deckHover ? "opacity-100" : "opacity-50"}`}>
          <p className="text-zinc-500 text-xs tracking-wider font-extralight" style={{ fontFamily: "var(--font-cormorant), serif" }}>
            {isAnimating ? "Unveiling..." : "Click the deck to reveal"}
          </p>
        </div>
        
        {/* Premium Deck Container */}
        <div className="relative h-72 sm:h-80 flex items-center justify-center" style={{ perspective: "1500px" }}>
          
          {/* Ambient glow under deck */}
          <div 
            className={`absolute bottom-2 left-1/2 -translate-x-1/2 w-48 h-24 rounded-full blur-3xl transition-all duration-700 ${
              deckHover && !isRevealed ? "opacity-30" : "opacity-15"
            }`}
            style={{ background: "radial-gradient(ellipse, rgba(120, 120, 140, 0.4), transparent)" }}
          />
          
          {/* Stacked cards - 4 cards for 4 instruments */}
          {[0, 1, 2, 3].map((index) => {
            const isTop = index === 3;
            const baseOffset = (3 - index) * 6;
            const hoverOffset = deckHover && !isRevealed ? (3 - index) * 12 : baseOffset;
            const baseRotation = (index - 1.5) * 1.5;
            const hoverRotation = deckHover && !isRevealed ? (index - 1.5) * 4 : baseRotation;
            const scale = deckHover && !isRevealed ? 1.02 : 1;
            
            // Animation spread on click
            const spreadX = isAnimating ? (index - 1.5) * 180 : 0;
            const spreadRotate = isAnimating ? (index - 1.5) * 15 : 0;
            const spreadOpacity = isAnimating || isRevealed ? 0 : 1;
            
            return (
              <div
                key={index}
                className="absolute transition-all"
                style={{
                  width: "180px",
                  height: "250px",
                  transform: `
                    translateY(${-hoverOffset}px) 
                    translateX(${spreadX}px)
                    rotateZ(${hoverRotation + spreadRotate}deg) 
                    rotateX(${deckHover && !isRevealed ? -3 : 0}deg)
                    scale(${scale})
                  `,
                  zIndex: 10 + index,
                  transitionDuration: isAnimating ? "600ms" : "400ms",
                  transitionTimingFunction: isAnimating ? "cubic-bezier(0.4, 0, 0.2, 1)" : "ease-out",
                  opacity: spreadOpacity,
                }}
              >
                {/* Card outer glow */}
                <div className={`absolute -inset-0.5 rounded-2xl transition-all duration-500 ${
                  deckHover && isTop && !isRevealed ? "bg-gradient-to-br from-zinc-600/20 via-zinc-700/10 to-transparent opacity-100 blur-md" : "opacity-0"
                }`} />
                
                {/* Card body */}
                <div className={`absolute inset-0 rounded-2xl border-2 transition-all duration-400 overflow-hidden ${
                  isTop 
                    ? deckHover && !isRevealed
                      ? "border-zinc-600/50 bg-gradient-to-br from-zinc-800/95 via-zinc-850/98 to-zinc-900/95 shadow-2xl shadow-black/50" 
                      : "border-zinc-700/40 bg-gradient-to-br from-zinc-800/90 via-zinc-900/95 to-zinc-950/90 shadow-xl shadow-black/30"
                    : "border-zinc-800/30 bg-gradient-to-br from-zinc-850/80 via-zinc-900/90 to-zinc-950/80"
                }`}>
                  
                  {/* Inner border */}
                  <div className={`absolute inset-2 rounded-xl border transition-all duration-300 ${
                    isTop && deckHover && !isRevealed ? "border-zinc-700/25" : "border-zinc-800/20"
                  }`} />
                  
                  {/* Center circle with number */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`relative w-14 h-14 rounded-full border transition-all duration-500 ${
                      isTop 
                        ? deckHover && !isRevealed
                          ? "border-zinc-600/50" 
                          : "border-zinc-700/35" 
                        : "border-zinc-800/25"
                    }`}>
                      {/* Inner ring */}
                      <div className={`absolute inset-1.5 rounded-full border transition-all duration-300 ${
                        isTop && deckHover && !isRevealed ? "border-zinc-700/30" : "border-zinc-800/15"
                      }`} />
                      
                      {/* Number */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-2xl font-extralight transition-all duration-400 ${
                          isTop 
                            ? deckHover && !isRevealed
                              ? "text-zinc-300" 
                              : "text-zinc-500" 
                            : "text-zinc-700"
                        }`} style={{ fontFamily: "var(--font-cormorant), serif" }}>
                          {index + 1}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Card number - top left */}
                  <div className={`absolute top-3 left-3 font-mono text-[10px] tracking-wider transition-all duration-300 ${
                    isTop ? deckHover && !isRevealed ? "text-zinc-500" : "text-zinc-600" : "text-zinc-800"
                  }`}>
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  
                  {/* Card number - bottom right (inverted) */}
                  <div className={`absolute bottom-3 right-3 font-mono text-[10px] tracking-wider rotate-180 transition-all duration-300 ${
                    isTop ? deckHover && !isRevealed ? "text-zinc-500" : "text-zinc-600" : "text-zinc-800"
                  }`}>
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  
                  {/* Subtle corner accents - only on top card */}
                  {isTop && (
                    <>
                      <div className={`absolute top-3 left-3 w-3 h-3 border-l border-t transition-all duration-300 ${
                        deckHover && !isRevealed ? "border-zinc-600/40" : "border-zinc-700/20"
                      }`} />
                      <div className={`absolute top-3 right-3 w-3 h-3 border-r border-t transition-all duration-300 ${
                        deckHover && !isRevealed ? "border-zinc-600/40" : "border-zinc-700/20"
                      }`} />
                      <div className={`absolute bottom-3 left-3 w-3 h-3 border-l border-b transition-all duration-300 ${
                        deckHover && !isRevealed ? "border-zinc-600/40" : "border-zinc-700/20"
                      }`} />
                      <div className={`absolute bottom-3 right-3 w-3 h-3 border-r border-b transition-all duration-300 ${
                        deckHover && !isRevealed ? "border-zinc-600/40" : "border-zinc-700/20"
                      }`} />
                    </>
                  )}
                </div>
              </div>
            );
          })}
          
          {/* Brand text below deck */}
          <div 
            className={`absolute text-center transition-all duration-500 pointer-events-none ${
              isRevealed ? "opacity-0" : deckHover ? "opacity-80" : "opacity-30"
            }`}
            style={{ bottom: "30px" }}
          >
            <span className="text-[9px] tracking-[0.5em] text-zinc-500 font-extralight uppercase">
              Afterstill
            </span>
          </div>
        </div>
        
        {/* Bottom hint */}
        <div className={`text-center mt-2 transition-all duration-500 ${!isRevealed && deckHover ? "opacity-100" : "opacity-0"}`}>
          <div className="flex items-center justify-center gap-2 text-zinc-600">
            <span className="w-1 h-1 rounded-full bg-zinc-600 animate-pulse" />
            <span className="text-[10px] tracking-widest" style={{ fontFamily: "var(--font-cormorant), serif" }}>
              4 instruments await
            </span>
            <span className="w-1 h-1 rounded-full bg-zinc-600 animate-pulse" />
          </div>
        </div>
      </button>
      
      {/* Portal Overlay - Rendered to body for true fullscreen */}
      {mounted && isRevealed && createPortal(
        <div 
          className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-500 ${
            isClosing ? "opacity-0" : "opacity-100"
          }`}
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-zinc-950/95 backdrop-blur-xl"
            onClick={resetToDeck}
          />
          
          {/* Sacred geometry background */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            {/* Outer ring */}
            <div className={`absolute w-[600px] h-[600px] rounded-full border border-zinc-800/30 transition-all duration-1000 ${isClosing ? "scale-50 opacity-0" : "scale-100 opacity-100"}`} />
            {/* Middle ring */}
            <div className={`absolute w-[500px] h-[500px] rounded-full border border-zinc-800/20 transition-all duration-1000 delay-100 ${isClosing ? "scale-50 opacity-0" : "scale-100 opacity-100"}`} style={{ animation: "spin 60s linear infinite" }} />
            {/* Inner ring */}
            <div className={`absolute w-[400px] h-[400px] rounded-full border border-zinc-800/15 transition-all duration-1000 delay-200 ${isClosing ? "scale-50 opacity-0" : "scale-100 opacity-100"}`} style={{ animation: "spin 45s linear infinite reverse" }} />
            
            {/* Cross lines */}
            <div className="absolute w-px h-full bg-gradient-to-b from-transparent via-zinc-800/20 to-transparent" />
            <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-zinc-800/20 to-transparent" />
            
            {/* Ambient glow */}
            <div className="absolute w-96 h-96 bg-zinc-700/10 rounded-full blur-3xl" />
          </div>
          
          {/* Close button */}
          <button
            type="button"
            onClick={resetToDeck}
            className={`absolute top-6 right-6 group flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-700/50 bg-zinc-900/60 backdrop-blur-sm hover:border-zinc-600/60 hover:bg-zinc-800/60 transition-all duration-300 z-20 ${
              isClosing ? "opacity-0 scale-90" : "opacity-100 scale-100"
            }`}
          >
            <svg className="w-4 h-4 text-zinc-500 group-hover:text-zinc-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            <span className="text-xs tracking-wider text-zinc-500 group-hover:text-zinc-400 transition-colors uppercase">Back to Deck</span>
          </button>
          
          {/* Cards Content */}
          <div 
            className={`relative z-10 w-full max-w-6xl px-8 py-12 transition-all duration-500 ${
              isClosing ? "opacity-0 scale-95 translate-y-4" : "opacity-100 scale-100 translate-y-0"
            }`}
          >
            {/* Header */}
            <div className="text-center mb-10">
              <p className="text-[10px] tracking-[0.5em] uppercase text-zinc-600 mb-3">The Four Instruments</p>
              <h2 className="text-3xl font-extralight text-zinc-300" style={{ fontFamily: "var(--font-cormorant), serif" }}>
                Choose your path
              </h2>
            </div>
            
            {/* The 4 cards - force proper grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {children}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
