"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getPresenceTracker, getPresenceMessage, type Presence } from "@/lib/presence";

/**
 * PresenceIndicator - Shows how many others are reading
 * 
 * Creates a sense of collective presence without being intrusive.
 * Visitors feel less alone in the digital sanctuary.
 */
export function PresenceIndicator({ className = "" }: { className?: string }) {
  const [presences, setPresences] = useState<Presence[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  
  useEffect(() => {
    const tracker = getPresenceTracker();
    
    // Start tracking with callback for updates
    tracker.start((updated) => {
      setPresences(updated);
    });
    
    // Initial load
    setPresences(tracker.getPresences());
    
    return () => {
      tracker.stop();
    };
  }, []);
  
  // Get count of OTHER presences (excluding self)
  const otherCount = presences.length > 0 ? presences.length - 1 : 0;
  
  if (otherCount === 0) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, delay: 2 }}
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Floating orbs representing presences */}
      <div className="flex items-center gap-1">
        {/* Show up to 5 orbs */}
        {Array.from({ length: Math.min(otherCount, 5) }).map((_, i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[var(--fg-muted)]"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0.3, 0.6, 0.3],
              scale: 1,
            }}
            transition={{
              opacity: {
                duration: 3,
                repeat: Infinity,
                delay: i * 0.5,
              },
              scale: {
                duration: 0.3,
                delay: i * 0.1,
              },
            }}
          />
        ))}
        
        {/* Show +N if more than 5 */}
        {otherCount > 5 && (
          <span className="text-xs text-[var(--fg-muted)] opacity-50 ml-1">
            +{otherCount - 5}
          </span>
        )}
      </div>
      
      {/* Tooltip on hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] backdrop-blur-xl whitespace-nowrap"
          >
            <span className="text-xs text-[var(--fg-muted)]">
              {getPresenceMessage(otherCount)}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * PresenceGlow - Subtle ambient glow that pulses with collective presence
 */
export function PresenceGlow() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const tracker = getPresenceTracker();
    
    const updateCount = () => {
      setCount(tracker.getOtherCount());
    };
    
    tracker.start(updateCount);
    updateCount();
    
    return () => tracker.stop();
  }, []);
  
  if (count === 0) return null;
  
  // Intensity based on presence count
  const intensity = Math.min(0.15, 0.03 * count);
  
  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: intensity }}
      transition={{ duration: 3 }}
    >
      <div 
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, rgba(139, 92, 246, 0.1) 0%, transparent 60%)`,
        }}
      />
    </motion.div>
  );
}

/**
 * PresenceOrbs - Floating orbs that represent other visitors
 * 
 * More visual, decorative version for prominent display.
 */
export function PresenceOrbs({ maxOrbs = 7 }: { maxOrbs?: number }) {
  const [presences, setPresences] = useState<Presence[]>([]);
  
  useEffect(() => {
    const tracker = getPresenceTracker();
    
    tracker.start((updated) => {
      // Filter out self and limit to maxOrbs
      const others = updated.slice(0, maxOrbs + 1).filter((_, i) => i > 0);
      setPresences(others);
    });
    
    return () => tracker.stop();
  }, [maxOrbs]);
  
  if (presences.length === 0) return null;
  
  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
      {presences.map((presence, index) => {
        // Generate consistent position based on presence ID
        const hash = presence.id.split("").reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0);
        
        const x = 10 + (Math.abs(hash) % 80);
        const y = 10 + (Math.abs(hash >> 8) % 80);
        const size = 4 + (index % 3) * 2;
        
        return (
          <motion.div
            key={presence.id}
            className="absolute rounded-full bg-[var(--fg)]"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: size,
              height: size,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0.1, 0.3, 0.1],
              scale: [1, 1.2, 1],
              x: [0, Math.sin(index) * 20, 0],
              y: [0, Math.cos(index) * 20, 0],
            }}
            transition={{
              duration: 8 + index * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        );
      })}
    </div>
  );
}
