"use client";

import React, { useMemo } from 'react';

/**
 * Phase-based UI Components
 * 
 * Reusable components for handling complex phase-based styling
 * to reduce cognitive complexity in main components
 */

// Generic phase type
type PhaseState = string;

interface PhaseConfig {
  idle: string;
  active: string;
  hover?: string;
}

interface PhaseIndicatorProps {
  phase: PhaseState;
  isHover: boolean;
  configs: {
    idle: string;
    active: string;
    hover?: string;
  };
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
}

/**
 * PhaseIndicator - Handles complex phase-based className logic
 */
export function PhaseIndicator({
  phase,
  isHover,
  configs,
  className = '',
  children,
  style,
  onClick,
}: PhaseIndicatorProps) {
  const phaseClass = useMemo(() => {
    const isActive = phase !== 'idle';
    
    if (isActive) return configs.active;
    if (isHover && configs.hover) return configs.hover;
    return configs.idle;
  }, [phase, isHover, configs]);

  return (
    <div 
      className={`${phaseClass} ${className}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

/**
 * Get phase-based class - helper function
 */
export function getPhaseClass(
  phase: PhaseState,
  isHover: boolean,
  config: PhaseConfig
): string {
  const isActive = phase !== 'idle';
  
  if (isActive) return config.active;
  if (isHover && config.hover) return config.hover;
  return config.idle;
}

/**
 * Oracle Phase Styles
 */
export const oracleStyles = {
  glow: {
    idle: 'opacity-0',
    hover: 'bg-gradient-to-br from-violet-500/10 via-transparent to-transparent opacity-100 blur-lg',
    active: 'bg-gradient-to-br from-violet-500/20 via-purple-500/10 to-transparent opacity-100 blur-xl',
  },
  inner: {
    idle: 'bg-transparent',
    hover: 'bg-violet-500/5 blur-2xl',
    active: 'bg-violet-500/10 blur-3xl',
  },
  border: {
    idle: 'border-zinc-800/20 scale-100',
    hover: 'border-violet-500/10 scale-105',
    active: 'border-violet-400/20 scale-110',
  },
  text: {
    idle: 'text-zinc-500',
    hover: 'text-zinc-300',
    active: 'text-violet-300',
  },
  icon: {
    idle: 'fill-transparent stroke-current',
    active: 'fill-violet-500/20 stroke-violet-400/60',
  },
};

/**
 * Radio Phase Styles
 */
export const radioStyles = {
  glow: {
    idle: 'opacity-0',
    hover: 'bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent opacity-100 blur-lg',
    active: 'bg-gradient-to-br from-cyan-500/20 via-teal-500/10 to-transparent opacity-100 blur-xl',
  },
  inner: {
    idle: 'bg-transparent',
    hover: 'bg-cyan-500/5 blur-2xl',
    active: 'bg-cyan-500/10 blur-3xl',
  },
  container: {
    idle: 'border-zinc-800/30 bg-zinc-900/50',
    hover: 'border-zinc-700/40 bg-zinc-800/50',
    active: 'border-cyan-500/30 bg-gradient-to-b from-zinc-800/80 to-zinc-900/80',
  },
  display: {
    idle: 'border-zinc-700/30 bg-zinc-800/30',
    hover: 'border-zinc-600/40 bg-zinc-800/50',
    active: 'border-cyan-500/20 bg-zinc-800/50',
    acquired: 'border-cyan-400/50 bg-cyan-500/10 shadow-inner shadow-cyan-500/10',
  },
  text: {
    idle: 'text-zinc-500',
    hover: 'text-zinc-400',
    active: 'text-zinc-300',
    acquired: 'text-cyan-300',
  },
  bar: {
    idle: 'bg-zinc-700/30',
    hover: 'bg-zinc-600/40',
    active: 'bg-cyan-500/40',
    acquired: 'bg-cyan-400/70',
  },
};

/**
 * Catalog Phase Styles
 */
export const catalogStyles = {
  glow: {
    idle: 'opacity-0',
    hover: 'bg-gradient-to-br from-amber-500/10 via-transparent to-transparent opacity-100 blur-lg',
    active: 'bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent opacity-100 blur-xl',
  },
  inner: {
    idle: 'bg-transparent',
    hover: 'bg-amber-500/5 blur-2xl',
    active: 'bg-amber-500/10 blur-3xl',
  },
  card: {
    idle: 'bg-zinc-800/80 border-zinc-700/30',
    hover: 'bg-zinc-800/90 border-zinc-600/40',
    active: 'bg-amber-900/30 border-amber-500/30',
    found: 'bg-amber-800/40 border-amber-400/50 shadow-lg shadow-amber-500/20',
  },
};

/**
 * Candle Phase Styles
 */
export const candleStyles = {
  glow: {
    idle: 'opacity-0',
    hover: 'bg-gradient-to-t from-orange-500/10 via-amber-500/5 to-transparent opacity-100 blur-lg',
    active: 'bg-gradient-to-t from-orange-500/30 via-amber-500/20 to-transparent opacity-100 blur-xl',
  },
  flame: {
    idle: 'opacity-0 scale-0',
    hover: 'opacity-50 scale-75',
    active: 'opacity-100 scale-100',
  },
  container: {
    idle: 'border-zinc-800/30',
    hover: 'border-orange-500/10',
    active: 'border-orange-500/30',
  },
};

/**
 * Get radio bar height multiplier
 */
export function getRadioBarMultiplier(phase: string, isHover: boolean): number {
  if (phase === 'acquired' || phase === 'transmitting') return 1;
  if (phase !== 'idle') return 0.8;
  if (isHover) return 0.6;
  return 0.4;
}

/**
 * Get radio display class based on exact phase
 */
export function getRadioDisplayClass(phase: string, isHover: boolean): string {
  if (phase === 'acquired') return radioStyles.display.acquired;
  if (phase !== 'idle') return radioStyles.display.active;
  if (isHover) return radioStyles.display.hover;
  return radioStyles.display.idle;
}

/**
 * Get radio text class based on exact phase
 */
export function getRadioTextClass(phase: string, isHover: boolean): string {
  if (phase === 'acquired') return radioStyles.text.acquired;
  if (phase !== 'idle') return radioStyles.text.active;
  if (isHover) return radioStyles.text.hover;
  return radioStyles.text.idle;
}

/**
 * Get radio bar class based on exact phase
 */
export function getRadioBarClass(phase: string, isHover: boolean): string {
  if (phase === 'acquired') return radioStyles.bar.acquired;
  if (phase !== 'idle') return radioStyles.bar.active;
  if (isHover) return radioStyles.bar.hover;
  return radioStyles.bar.idle;
}

/**
 * Card elevation calculation for catalog
 */
export function getCardYOffset(
  isFound: boolean,
  isActive: boolean,
  phase: string,
  elevation: number
): number {
  if (isFound) return -elevation;
  if (isActive && phase === 'sorting') return -20;
  return 0;
}
