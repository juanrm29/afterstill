"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { 
  getTemporalState, 
  getMinutesUntilNextPhase,
  type TemporalState,
  type TimePhase 
} from "@/lib/temporal";
import {
  initializeVisitorMemory,
  getVisitorMemory,
  getWelcomeMessage,
  isReturningVisitor,
  type VisitorMemory,
} from "@/lib/visitor-memory";

interface ConsciousnessState {
  // Temporal awareness
  temporal: TemporalState;
  
  // Visitor memory
  visitor: VisitorMemory | null;
  isReturning: boolean;
  welcomeMessage: string;
  
  // UI state
  isHydrated: boolean;
  showWelcome: boolean;
  dismissWelcome: () => void;
}

const ConsciousnessContext = createContext<ConsciousnessState | null>(null);

/**
 * ConsciousnessProvider - The "brain" of Afterstill
 * 
 * Provides temporal awareness and visitor memory to the entire app,
 * making the website feel alive and conscious.
 */
export function ConsciousnessProvider({ children }: { children: ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [temporal, setTemporal] = useState<TemporalState>(() => getTemporalState());
  const [visitor, setVisitor] = useState<VisitorMemory | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  
  // Initialize on mount (client-side only)
  useEffect(() => {
    // Initialize visitor memory
    const memory = initializeVisitorMemory();
    setVisitor(memory);
    
    // Get accurate temporal state
    const returning = isReturningVisitor();
    setTemporal(getTemporalState(new Date(), returning));
    
    // Show welcome for returning visitors or first-timers after a delay
    const timer = setTimeout(() => {
      setShowWelcome(true);
    }, 1500);
    
    setIsHydrated(true);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Update temporal state periodically
  useEffect(() => {
    if (!isHydrated) return;
    
    // Calculate time until next phase change
    const minutesUntilChange = getMinutesUntilNextPhase(temporal.hour, temporal.minute);
    
    // Update every minute, or when phase changes
    const updateInterval = Math.min(60 * 1000, minutesUntilChange * 60 * 1000);
    
    const timer = setInterval(() => {
      const returning = visitor ? visitor.totalVisits > 1 : false;
      setTemporal(getTemporalState(new Date(), returning));
    }, updateInterval);
    
    return () => clearInterval(timer);
  }, [isHydrated, temporal.hour, temporal.minute, visitor]);
  
  const dismissWelcome = useCallback(() => {
    setShowWelcome(false);
  }, []);
  
  const welcomeMessage = visitor ? getWelcomeMessage(visitor) : "";
  const isReturning = visitor ? visitor.totalVisits > 1 : false;
  
  return (
    <ConsciousnessContext.Provider 
      value={{
        temporal,
        visitor,
        isReturning,
        welcomeMessage,
        isHydrated,
        showWelcome,
        dismissWelcome,
      }}
    >
      {children}
    </ConsciousnessContext.Provider>
  );
}

/**
 * Hook to access consciousness state
 */
export function useConsciousness() {
  const context = useContext(ConsciousnessContext);
  if (!context) {
    throw new Error("useConsciousness must be used within ConsciousnessProvider");
  }
  return context;
}

/**
 * Hook for temporal state only
 */
export function useTemporal() {
  const { temporal, isHydrated } = useConsciousness();
  return { ...temporal, isHydrated };
}

/**
 * Hook for visitor memory only
 */
export function useVisitor() {
  const { visitor, isReturning, welcomeMessage } = useConsciousness();
  return { visitor, isReturning, welcomeMessage };
}

/**
 * Hook to get phase-specific CSS classes
 */
export function useTemporalClasses() {
  const { temporal, isHydrated } = useConsciousness();
  
  if (!isHydrated) {
    return {
      phaseClass: "",
      moodClass: "",
    };
  }
  
  return {
    phaseClass: `phase-${temporal.phase}`,
    moodClass: `mood-${temporal.mood}`,
  };
}

/**
 * Get CSS custom properties for current phase
 */
export function useTemporalStyles() {
  const { temporal, isHydrated } = useConsciousness();
  
  if (!isHydrated) return {};
  
  return {
    "--temporal-primary": temporal.colors.primary,
    "--temporal-secondary": temporal.colors.secondary,
    "--temporal-accent": temporal.colors.accent,
    "--temporal-glow": temporal.colors.glow,
    "--temporal-intensity": temporal.ambientIntensity,
    "--temporal-warmth": temporal.typography.warmth,
  } as React.CSSProperties;
}
