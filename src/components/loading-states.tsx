"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LoadingPhase {
  text: string;
  duration: number;
}

const LOADING_PHASES: LoadingPhase[] = [
  { text: "Awakening...", duration: 600 },
  { text: "Gathering fragments...", duration: 800 },
  { text: "Weaving atmosphere...", duration: 700 },
  { text: "Ready", duration: 400 },
];

/**
 * ElegantLoader - Minimal, poetic loading screen
 */
export function ElegantLoader({ onComplete }: { readonly onComplete?: () => void }) {
  const [phase, setPhase] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const advancePhase = () => {
      if (phase < LOADING_PHASES.length - 1) {
        timeout = setTimeout(() => {
          setPhase(p => p + 1);
        }, LOADING_PHASES[phase].duration);
      } else {
        timeout = setTimeout(() => {
          setIsVisible(false);
          setTimeout(() => onComplete?.(), 300);
        }, LOADING_PHASES[phase].duration);
      }
    };
    
    advancePhase();
    return () => clearTimeout(timeout);
  }, [phase, onComplete]);
  
  const progress = ((phase + 1) / LOADING_PHASES.length) * 100;
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-9999 bg-[#030304] flex flex-col items-center justify-center"
        >
          {/* Breathing circle */}
          <motion.div
            className="w-16 h-16 rounded-full border border-white/10 mb-8"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          
          {/* Phase text */}
          <AnimatePresence mode="wait">
            <motion.p
              key={phase}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-white/50 text-sm tracking-wider"
              style={{ fontFamily: "var(--font-cormorant), serif" }}
            >
              {LOADING_PHASES[phase].text}
            </motion.p>
          </AnimatePresence>
          
          {/* Progress bar */}
          <div className="mt-8 w-32 h-px bg-white/10 overflow-hidden rounded-full">
            <motion.div
              className="h-full bg-white/30"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * SkeletonText - Animated placeholder for text content
 */
export function SkeletonText({ 
  lines = 1, 
  className = "",
  widths = [100],
}: { 
  readonly lines?: number;
  readonly className?: string;
  readonly widths?: readonly number[];
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 rounded bg-foreground/5 animate-pulse"
          style={{ width: `${widths[i % widths.length]}%` }}
        />
      ))}
    </div>
  );
}

/**
 * SkeletonCard - Animated placeholder for card content
 */
export function SkeletonCard({ className = "" }: { readonly className?: string }) {
  return (
    <div className={`rounded-xl border border-foreground/5 bg-foreground/2 p-6 ${className}`}>
      <div className="h-5 w-2/3 rounded bg-foreground/5 animate-pulse mb-4" />
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-foreground/5 animate-pulse" />
        <div className="h-3 w-4/5 rounded bg-foreground/5 animate-pulse" />
        <div className="h-3 w-3/5 rounded bg-foreground/5 animate-pulse" />
      </div>
      <div className="flex gap-2 mt-4">
        <div className="h-5 w-16 rounded-full bg-foreground/5 animate-pulse" />
        <div className="h-5 w-12 rounded-full bg-foreground/5 animate-pulse" />
      </div>
    </div>
  );
}

/**
 * Shimmer - Shimmer effect overlay
 */
export function Shimmer({ className = "" }: { readonly className?: string }) {
  return (
    <div className={`absolute inset-0 -translate-x-full animate-shimmer bg-linear-to-r from-transparent via-white/5 to-transparent ${className}`} />
  );
}

/**
 * PulseRing - Expanding ring animation
 */
export function PulseRing({ 
  size = 100,
  color = "white",
  delay = 0,
}: { 
  readonly size?: number;
  readonly color?: string;
  readonly delay?: number;
}) {
  return (
    <motion.div
      className="absolute rounded-full border pointer-events-none"
      style={{
        width: size,
        height: size,
        borderColor: color,
      }}
      initial={{ scale: 0, opacity: 0.6 }}
      animate={{ scale: 2, opacity: 0 }}
      transition={{
        duration: 2,
        delay,
        repeat: Infinity,
        ease: "easeOut",
      }}
    />
  );
}

/**
 * TypewriterText - Types text character by character
 */
export function TypewriterText({
  text,
  speed = 50,
  className = "",
  onComplete,
}: {
  readonly text: string;
  readonly speed?: number;
  readonly className?: string;
  readonly onComplete?: () => void;
}) {
  const [displayed, setDisplayed] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  
  useEffect(() => {
    setDisplayed("");
    setIsComplete(false);
    let i = 0;
    
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        setIsComplete(true);
        onComplete?.();
      }
    }, speed);
    
    return () => clearInterval(interval);
  }, [text, speed, onComplete]);
  
  return (
    <span className={className}>
      {displayed}
      {!isComplete && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="inline-block w-0.5 h-[1em] bg-current ml-0.5 align-middle"
        />
      )}
    </span>
  );
}

/**
 * CountUp - Animated counter
 */
export function CountUp({
  end,
  duration = 2000,
  className = "",
}: {
  readonly end: number;
  readonly duration?: number;
  readonly className?: string;
}) {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const startTimeRef = useRef(0);
  
  useEffect(() => {
    startTimeRef.current = Date.now();
    countRef.current = 0;
    
    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
      
      countRef.current = Math.floor(eased * end);
      setCount(countRef.current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [end, duration]);
  
  return <span className={className}>{count}</span>;
}
