"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useConsciousness } from "./consciousness-provider";
import { formatPhase } from "@/lib/temporal";

/**
 * TemporalWelcome - Ethereal greeting that appears on page load
 * 
 * Shows personalized message based on time of day and visitor memory.
 * Fades away gracefully after acknowledgment.
 */
export function TemporalWelcome() {
  const { 
    temporal, 
    welcomeMessage, 
    isReturning, 
    showWelcome, 
    dismissWelcome,
    isHydrated 
  } = useConsciousness();
  
  const [isVisible, setIsVisible] = useState(false);
  
  // Delay visibility for smooth entrance
  useEffect(() => {
    if (showWelcome && isHydrated) {
      const timer = setTimeout(() => setIsVisible(true), 300);
      return () => clearTimeout(timer);
    }
  }, [showWelcome, isHydrated]);
  
  // Auto-dismiss after 8 seconds
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(dismissWelcome, 500);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, dismissWelcome]);
  
  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(dismissWelcome, 500);
  };
  
  if (!isHydrated) return null;
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center"
          style={{
            background: `radial-gradient(ellipse at center, ${temporal.colors.primary} 0%, transparent 70%)`,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto text-center px-8 max-w-lg cursor-pointer"
            onClick={handleDismiss}
          >
            {/* Time phase indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 0.4 }}
              className="text-xs tracking-[0.3em] uppercase text-[var(--fg-muted)] mb-4"
            >
              {formatPhase(temporal.phase)}
            </motion.div>
            
            {/* Main greeting */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="font-serif text-2xl md:text-3xl text-[var(--fg)] leading-relaxed"
              style={{ 
                fontWeight: 300,
                letterSpacing: "-0.02em",
              }}
            >
              {welcomeMessage}
            </motion.p>
            
            {/* Subtle hint to continue */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              transition={{ delay: 1.5, duration: 1 }}
              className="mt-8 text-xs text-[var(--fg-muted)]"
            >
              {isReturning ? "continue your journey" : "tap anywhere to enter"}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * TemporalGlow - Subtle ambient layer that changes with time
 * 
 * Adds barely perceptible color shifting based on time of day.
 * Should never distract, only enhance atmosphere.
 */
export function TemporalGlow() {
  const { temporal, isHydrated } = useConsciousness();
  
  if (!isHydrated) return null;
  
  return (
    <div 
      className="fixed inset-0 pointer-events-none z-0 transition-all duration-[5000ms] ease-out"
      style={{ opacity: temporal.ambientIntensity * 0.5 }}
    >
      {/* Primary glow from bottom */}
      <div 
        className="absolute inset-0 transition-all duration-[5000ms]"
        style={{
          background: `radial-gradient(ellipse 150% 50% at 50% 100%, ${temporal.colors.primary} 0%, transparent 70%)`,
        }}
      />
      
      {/* Secondary ambient from top corners */}
      <div 
        className="absolute inset-0 transition-all duration-[5000ms]"
        style={{
          background: `
            radial-gradient(ellipse 80% 40% at 0% 0%, ${temporal.colors.secondary} 0%, transparent 50%),
            radial-gradient(ellipse 80% 40% at 100% 0%, ${temporal.colors.secondary} 0%, transparent 50%)
          `,
        }}
      />
      
      {/* Center accent glow */}
      <div 
        className="absolute inset-0 transition-all duration-[5000ms]"
        style={{
          background: `radial-gradient(ellipse 60% 60% at 50% 50%, ${temporal.colors.glow} 0%, transparent 60%)`,
        }}
      />
    </div>
  );
}

/**
 * TemporalIndicator - Minimal time phase indicator
 * 
 * Shows current phase as a subtle badge in the corner.
 */
export function TemporalIndicator({ className = "" }: { className?: string }) {
  const { temporal, isHydrated } = useConsciousness();
  
  if (!isHydrated) return null;
  
  const phaseIcons: Record<string, string> = {
    dawn: "◐",
    morning: "○",
    afternoon: "●",
    dusk: "◑",
    night: "◒",
    midnight: "◓",
  };
  
  return (
    <div 
      className={`
        flex items-center gap-2 text-xs text-[var(--fg-muted)]
        transition-all duration-1000
        ${className}
      `}
    >
      <span className="opacity-50">{phaseIcons[temporal.phase]}</span>
      <span className="tracking-wider uppercase opacity-60">
        {formatPhase(temporal.phase)}
      </span>
    </div>
  );
}
