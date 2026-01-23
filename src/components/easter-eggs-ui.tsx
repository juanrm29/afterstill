"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  createEasterEggTracker, 
  getMoonPhase, 
  getEasterEggMessage,
  isInTheVoid,
} from "@/lib/easter-eggs";

/**
 * useEasterEggs - Hook to track and respond to easter eggs
 */
export function useEasterEggs() {
  const [discoveredEgg, setDiscoveredEgg] = useState<string | null>(null);
  const [tracker] = useState(() => createEasterEggTracker());
  const [moonPhase, setMoonPhase] = useState(getMoonPhase);
  const [isInVoid, setIsInVoid] = useState(false);
  
  useEffect(() => {
    // Update moon phase daily
    setMoonPhase(getMoonPhase());
    const interval = setInterval(() => {
      setMoonPhase(getMoonPhase());
    }, 1000 * 60 * 60); // Every hour
    
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    // Keyboard listener for easter eggs
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      tracker.handleKeyPress(e.key);
    }
    
    // Subscribe to easter egg discoveries
    const unsubKonami = tracker.on("konami", () => {
      setDiscoveredEgg("konami");
    });
    
    const unsubStillness = tracker.on("word:stillness", () => {
      setDiscoveredEgg("word:stillness");
    });
    
    const unsubBreathe = tracker.on("word:breathe", () => {
      setDiscoveredEgg("word:breathe");
    });
    
    const unsubWonder = tracker.on("word:wonder", () => {
      setDiscoveredEgg("word:wonder");
    });
    
    const unsubSilence = tracker.on("word:silence", () => {
      setDiscoveredEgg("word:silence");
    });
    
    const unsubAurora = tracker.on("word:aurora", () => {
      setDiscoveredEgg("word:aurora");
    });
    
    window.addEventListener("keydown", handleKeyDown);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      unsubKonami();
      unsubStillness();
      unsubBreathe();
      unsubWonder();
      unsubSilence();
      unsubAurora();
    };
  }, [tracker]);
  
  useEffect(() => {
    // Scroll listener for void detection
    function handleScroll() {
      const inVoid = isInTheVoid(
        window.scrollY,
        document.documentElement.scrollHeight,
        window.innerHeight
      );
      setIsInVoid(inVoid);
    }
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  const dismissDiscovery = useCallback(() => {
    setDiscoveredEgg(null);
  }, []);
  
  return {
    discoveredEgg,
    dismissDiscovery,
    moonPhase,
    isInVoid,
    discoveredCount: tracker.getDiscoveredCount(),
    totalCount: tracker.getTotalCount(),
  };
}

/**
 * EasterEggDiscovery - Overlay when an easter egg is found
 */
export function EasterEggDiscovery({
  eggId,
  onDismiss,
}: {
  eggId: string | null;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (eggId) {
      const timer = setTimeout(onDismiss, 5000);
      return () => clearTimeout(timer);
    }
  }, [eggId, onDismiss]);
  
  return (
    <AnimatePresence>
      {eggId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[300] flex items-center justify-center cursor-pointer"
          onClick={onDismiss}
          style={{
            background: eggId === "konami" 
              ? "radial-gradient(ellipse at center, rgba(100,50,150,0.9) 0%, rgba(0,0,0,0.95) 100%)"
              : eggId.includes("aurora")
              ? "radial-gradient(ellipse at center, rgba(50,150,100,0.8) 0%, rgba(0,0,0,0.95) 100%)"
              : "radial-gradient(ellipse at center, rgba(50,100,150,0.8) 0%, rgba(0,0,0,0.95) 100%)",
          }}
        >
          {/* Animated particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-white/30"
                initial={{
                  x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1000),
                  y: typeof window !== "undefined" ? window.innerHeight + 50 : 1000,
                }}
                animate={{
                  y: -50,
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  delay: Math.random() * 2,
                  repeat: Infinity,
                }}
              />
            ))}
          </div>
          
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="text-center relative z-10 px-8"
          >
            <motion.div
              animate={{
                rotate: [0, 360],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
              }}
              className="text-5xl mb-6"
            >
              ✧
            </motion.div>
            
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xl font-light text-white mb-4"
            >
              Secret discovered
            </motion.h2>
            
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-white/70 max-w-md mx-auto"
            >
              {getEasterEggMessage(eggId)}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * MoonIndicator - Subtle moon phase display
 */
export function MoonIndicator({ className = "" }: { className?: string }) {
  const [moon, setMoon] = useState(getMoonPhase);
  
  useEffect(() => {
    setMoon(getMoonPhase());
  }, []);
  
  return (
    <motion.div 
      className={`flex items-center gap-2 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 2 }}
    >
      <span className="text-lg" title={`${moon.phase} - ${moon.illumination}% illuminated`}>
        {moon.emoji}
      </span>
    </motion.div>
  );
}

/**
 * VoidMessage - Message shown when scrolling to the very bottom
 */
export function VoidMessage({ isVisible }: { isVisible: boolean }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
        >
          <motion.p
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
            }}
            className="text-sm text-[var(--fg-muted)] text-center"
          >
            You&apos;ve reached the edge of everything
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * KonamiEffect - Special visual effect when Konami code is entered
 */
export function KonamiEffect({ isActive }: { isActive: boolean }) {
  if (!isActive) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 pointer-events-none z-[50]"
      style={{
        background: "linear-gradient(45deg, rgba(255,0,100,0.1) 0%, rgba(0,100,255,0.1) 50%, rgba(100,255,0,0.1) 100%)",
        mixBlendMode: "screen",
      }}
    />
  );
}
