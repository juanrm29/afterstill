"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

type RitualAction = 
  | "pause"        // Space - pause time, enhance ambient
  | "zen"          // Escape - toggle zen mode (hide UI)
  | "breathe"      // B - start breathing exercise
  | "oracle"       // O - open oracle
  | "random"       // R - random writing
  | "search"       // / - open search
  | "navigate"     // Arrow keys - navigate writings
  | "close";       // Escape again - close overlay

interface KeyboardState {
  isZenMode: boolean;
  isPaused: boolean;
  isBreathing: boolean;
  activeRitual: RitualAction | null;
}

/**
 * useKeyboardRituals - Hook for keyboard-based interactions
 */
export function useKeyboardRituals(
  onAction?: (action: RitualAction) => void
): KeyboardState & {
  toggleZenMode: () => void;
  togglePause: () => void;
  startBreathing: () => void;
  stopBreathing: () => void;
} {
  const [state, setState] = useState<KeyboardState>({
    isZenMode: false,
    isPaused: false,
    isBreathing: false,
    activeRitual: null,
  });
  
  const toggleZenMode = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      isZenMode: !prev.isZenMode,
      activeRitual: !prev.isZenMode ? "zen" : null,
    }));
    onAction?.("zen");
  }, [onAction]);
  
  const togglePause = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      isPaused: !prev.isPaused,
      activeRitual: !prev.isPaused ? "pause" : null,
    }));
    onAction?.("pause");
  }, [onAction]);
  
  const startBreathing = useCallback(() => {
    setState(prev => ({ ...prev, isBreathing: true, activeRitual: "breathe" }));
    onAction?.("breathe");
  }, [onAction]);
  
  const stopBreathing = useCallback(() => {
    setState(prev => ({ ...prev, isBreathing: false, activeRitual: null }));
  }, []);
  
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if typing in input or contenteditable
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return;
      }
      
      // Escape always works (close overlays or zen mode)
      if (e.key === "Escape") {
        e.preventDefault();
        if (state.isBreathing) {
          stopBreathing();
        } else if (state.isPaused) {
          togglePause();
        } else {
          toggleZenMode();
        }
        return;
      }
      
      // Period (.) - Pause/meditation (easy to press, no conflict)
      if (e.key === ".") {
        e.preventDefault();
        togglePause();
        return;
      }
      
      // Comma (,) - Breathing exercise
      if (e.key === ",") {
        e.preventDefault();
        if (!state.isBreathing) {
          startBreathing();
        } else {
          stopBreathing();
        }
        return;
      }
      
      // Shift + O - Oracle
      if (e.shiftKey && (e.key === "o" || e.key === "O")) {
        e.preventDefault();
        onAction?.("oracle");
        return;
      }
      
      // Shift + R - Random writing
      if (e.shiftKey && (e.key === "r" || e.key === "R")) {
        e.preventDefault();
        onAction?.("random");
        return;
      }
      
      // Shift + / (?) - Search/help
      if (e.shiftKey && e.key === "/") {
        e.preventDefault();
        onAction?.("search");
        return;
      }
    }
    
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [state, togglePause, toggleZenMode, startBreathing, stopBreathing, onAction]);
  
  return {
    ...state,
    toggleZenMode,
    togglePause,
    startBreathing,
    stopBreathing,
  };
}

/**
 * PauseOverlay - Displayed when space is pressed
 */
export function PauseOverlay({ 
  isVisible,
  onDismiss,
}: { 
  isVisible: boolean;
  onDismiss: () => void;
}) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[200] flex items-center justify-center cursor-pointer"
          onClick={onDismiss}
          style={{
            background: "radial-gradient(ellipse at center, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.9) 100%)",
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="text-center"
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="text-6xl mb-6"
            >
              ◉
            </motion.div>
            <p className="text-[var(--fg-muted)] text-sm tracking-wide">
              Time paused. Breathe.
            </p>
            <p className="text-[var(--fg-muted)]/50 text-xs mt-4">
              tap anywhere or press space to continue
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * ZenModeIndicator - Subtle indicator when in zen mode
 */
export function ZenModeIndicator({ isActive }: { isActive: boolean }) {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-4 right-4 z-[100]"
        >
          <div className="px-3 py-1.5 rounded-full bg-[var(--bg)]/80 border border-[var(--card-border)] backdrop-blur-xl">
            <span className="text-xs text-[var(--fg-muted)]">
              Zen Mode · Esc to exit
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * BreathingExercise - Guided breathing overlay
 */
export function BreathingExercise({ 
  isActive,
  onComplete,
}: { 
  isActive: boolean;
  onComplete: () => void;
}) {
  const [phase, setPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [count, setCount] = useState(0);
  const cycles = 3;
  
  useEffect(() => {
    if (!isActive) {
      setPhase("inhale");
      setCount(0);
      return;
    }
    
    const sequence = [
      { phase: "inhale" as const, duration: 4000 },
      { phase: "hold" as const, duration: 4000 },
      { phase: "exhale" as const, duration: 6000 },
    ];
    
    let currentIndex = 0;
    let cycleCount = 0;
    
    function nextPhase() {
      if (!isActive) return;
      
      const current = sequence[currentIndex];
      setPhase(current.phase);
      
      setTimeout(() => {
        currentIndex++;
        if (currentIndex >= sequence.length) {
          currentIndex = 0;
          cycleCount++;
          setCount(cycleCount);
          
          if (cycleCount >= cycles) {
            onComplete();
            return;
          }
        }
        nextPhase();
      }, current.duration);
    }
    
    nextPhase();
  }, [isActive, onComplete]);
  
  const phaseText = {
    inhale: "Breathe in...",
    hold: "Hold...",
    exhale: "Breathe out...",
  };
  
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{
            background: "radial-gradient(ellipse at center, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.95) 100%)",
          }}
        >
          <div className="text-center">
            {/* Breathing circle */}
            <motion.div
              animate={{
                scale: phase === "inhale" ? 1.5 : phase === "hold" ? 1.5 : 1,
                opacity: phase === "hold" ? 0.8 : 0.6,
              }}
              transition={{
                duration: phase === "inhale" ? 4 : phase === "hold" ? 0.3 : 6,
                ease: "easeInOut",
              }}
              className="w-32 h-32 mx-auto mb-8 rounded-full border border-[var(--fg)]/30"
              style={{
                background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)",
              }}
            />
            
            {/* Phase text */}
            <motion.p
              key={phase}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl text-[var(--fg)] font-light"
            >
              {phaseText[phase]}
            </motion.p>
            
            {/* Progress */}
            <p className="text-xs text-[var(--fg-muted)] mt-6">
              {count + 1} / {cycles}
            </p>
            
            <p className="text-xs text-[var(--fg-muted)]/50 mt-8">
              press Esc to exit
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * KeyboardHints - Shows available keyboard shortcuts
 */
export function KeyboardHints({ className = "" }: { className?: string }) {
  const hints = [
    { key: ".", action: "Pause" },
    { key: ",", action: "Breathe" },
    { key: "Esc", action: "Zen / Close" },
    { key: "⇧O", action: "Oracle" },
    { key: "⇧R", action: "Random" },
  ];
  
  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {hints.map((hint) => (
        <div 
          key={hint.key}
          className="flex items-center gap-2 text-xs text-[var(--fg-muted)]"
        >
          <kbd className="px-1.5 py-0.5 rounded bg-[var(--muted)] font-mono text-[10px]">
            {hint.key}
          </kbd>
          <span className="opacity-60">{hint.action}</span>
        </div>
      ))}
    </div>
  );
}
