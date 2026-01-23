/**
 * UI State helper functions for reducing conditional complexity
 * Used to simplify nested ternary operations in components
 */

// Phase-based styling helpers
type Phase = "idle" | string;

interface PhaseStyleOptions {
  idle: string;
  active: string;
  hover?: string;
}

/**
 * Get style based on phase state
 */
export function getPhaseStyle(
  phase: Phase,
  isHover: boolean,
  options: PhaseStyleOptions
): string {
  if (phase !== "idle") return options.active;
  if (isHover && options.hover) return options.hover;
  return options.idle;
}

/**
 * Get style with multiple phase options
 */
export function getMultiPhaseStyle(
  phase: string,
  isHover: boolean,
  styles: Record<string, string>,
  defaultStyle: string = ""
): string {
  if (styles[phase]) return styles[phase];
  if (phase !== "idle") return styles.active || defaultStyle;
  if (isHover && styles.hover) return styles.hover;
  return styles.idle || defaultStyle;
}

/**
 * Combine conditional classes
 */
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Generate unique keys for array items
 */
export function generateKey(prefix: string, index: number, uniqueId?: string): string {
  return uniqueId ? `${prefix}-${uniqueId}` : `${prefix}-${index}-${Date.now()}`;
}

/**
 * Oracle phase styling
 */
export const oracleStyles = {
  getBackgroundGlow: (phase: Phase, isHover: boolean): string => {
    if (phase !== "idle") return "bg-gradient-to-br from-violet-500/20 via-transparent to-transparent opacity-100 blur-xl";
    if (isHover) return "bg-gradient-to-br from-violet-500/10 via-transparent to-transparent opacity-100 blur-lg";
    return "opacity-0";
  },
  
  getAmbientGlow: (phase: Phase, isHover: boolean): string => {
    if (phase !== "idle") return "bg-violet-500/10 blur-3xl";
    if (isHover) return "bg-violet-500/5 blur-2xl";
    return "bg-transparent";
  },
  
  getBorderStyle: (phase: Phase, isHover: boolean): string => {
    if (phase !== "idle") return "border-violet-400/20 scale-110";
    if (isHover) return "border-violet-500/10 scale-105";
    return "border-zinc-800/20 scale-100";
  },
  
  getTextColor: (phase: Phase, isHover: boolean): string => {
    if (phase !== "idle") return "text-violet-300";
    if (isHover) return "text-zinc-300";
    return "text-zinc-500";
  },
  
  getSvgFill: (phase: Phase): string => {
    if (phase !== "idle") return "fill-violet-500/20 stroke-violet-400/60";
    return "fill-transparent stroke-current";
  },
};

/**
 * Radio phase styling
 */
export const radioStyles = {
  getBackgroundGlow: (phase: Phase, isHover: boolean): string => {
    if (phase !== "idle") return "bg-gradient-to-br from-cyan-500/20 via-transparent to-transparent opacity-100 blur-xl";
    if (isHover) return "bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent opacity-100 blur-lg";
    return "opacity-0";
  },
  
  getAmbientGlow: (phase: Phase, isHover: boolean): string => {
    if (phase !== "idle") return "bg-cyan-500/10 blur-3xl";
    if (isHover) return "bg-cyan-500/5 blur-2xl";
    return "bg-transparent";
  },
  
  getContainerStyle: (phase: Phase, isHover: boolean): string => {
    if (phase !== "idle") return "border-cyan-500/30 bg-gradient-to-b from-zinc-800/80 to-zinc-900/80";
    if (isHover) return "border-zinc-700/40 bg-zinc-800/50";
    return "border-zinc-800/30 bg-zinc-900/40";
  },
  
  getDisplayStyle: (phase: string): string => {
    if (phase === "acquired") return "border-cyan-400/50 bg-cyan-500/10 shadow-inner shadow-cyan-500/10";
    if (phase !== "idle") return "border-cyan-500/20 bg-zinc-800/50";
    return "border-zinc-700/20 bg-zinc-900/50";
  },
  
  getTextColor: (phase: string): string => {
    if (phase === "acquired") return "text-cyan-300";
    if (phase !== "idle") return "text-zinc-300";
    return "text-zinc-500";
  },
  
  getNoiseBarStyle: (phase: string, isHover: boolean): string => {
    if (phase === "acquired") return "bg-cyan-400/70";
    if (phase !== "idle") return "bg-cyan-500/40";
    if (isHover) return "bg-zinc-600/40";
    return "bg-zinc-700/30";
  },
  
  getNoiseHeight: (phase: Phase, level: number, isHover: boolean): number => {
    if (phase !== "idle") return level * 100;
    if (isHover) return level * 80;
    return level * 50;
  },
};

/**
 * Catalog phase styling
 */
export const catalogStyles = {
  getBackgroundGlow: (phase: Phase, isHover: boolean): string => {
    if (phase !== "idle") return "bg-gradient-to-br from-amber-500/20 via-transparent to-transparent opacity-100 blur-xl";
    if (isHover) return "bg-gradient-to-br from-amber-500/10 via-transparent to-transparent opacity-100 blur-lg";
    return "opacity-0";
  },
  
  getAmbientGlow: (phase: Phase, isHover: boolean): string => {
    if (phase !== "idle") return "bg-amber-500/10 blur-3xl";
    if (isHover) return "bg-amber-500/5 blur-2xl";
    return "bg-transparent";
  },
  
  getCardOffset: (isFound: boolean, isActive: boolean, phase: string, cardElevation: number): number => {
    if (isFound) return -cardElevation;
    if (isActive && phase === "sorting") return -20;
    return 0;
  },
};

/**
 * Candle phase styling
 */
export const candleStyles = {
  getGlowIntensity: (phase: string): number => {
    switch (phase) {
      case "striking": return 0.2;
      case "lighting": return 0.5;
      case "glowing": return 0.8;
      case "illuminating": return 1;
      default: return 0;
    }
  },
  
  getFlameStyle: (phase: string): string => {
    switch (phase) {
      case "striking": return "opacity-30 scale-50";
      case "lighting": return "opacity-60 scale-75";
      case "glowing": return "opacity-80 scale-90";
      case "illuminating": return "opacity-100 scale-100";
      default: return "opacity-0 scale-0";
    }
  },
};

/**
 * Animation helpers
 */
export const animationHelpers = {
  getPulseAnimation: (isActive: boolean): string => {
    return isActive ? "pulse 2s ease-in-out infinite" : "none";
  },
  
  getTransitionClasses: (duration: number = 300): string => {
    return `transition-all duration-${duration} ease-in-out`;
  },
};
