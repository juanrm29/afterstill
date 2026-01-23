"use client";

import { useMemo } from 'react';

interface Star {
  id: string;
  left: string;
  top: string;
  opacity: number;
  animationDelay: string;
  size: 'sm' | 'md';
}

interface StarFieldProps {
  count?: number;
  className?: string;
}

/**
 * StarField - Generates decorative star elements without using array index as key
 */
export function StarField({ count = 30, className = '' }: StarFieldProps) {
  const stars = useMemo<Star[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: `star-${i}-${Math.random().toString(36).substring(7)}`,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      opacity: 0.1 + Math.random() * 0.4,
      animationDelay: `${Math.random() * 5}s`,
      size: Math.random() > 0.7 ? 'md' : 'sm',
    }));
  }, [count]);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {stars.map((star) => (
        <div
          key={star.id}
          className={`absolute rounded-full bg-white animate-twinkle ${
            star.size === 'md' ? 'w-1 h-1' : 'w-0.5 h-0.5'
          }`}
          style={{
            left: star.left,
            top: star.top,
            opacity: star.opacity,
            animationDelay: star.animationDelay,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Particle effects for various phases
 */
interface ParticleConfig {
  id: string;
  delay: number;
  duration: number;
  x: number;
  y: number;
  scale: number;
}

interface PhaseParticlesProps {
  count?: number;
  color: 'violet' | 'cyan' | 'amber' | 'orange';
  active: boolean;
  className?: string;
}

export function PhaseParticles({ 
  count = 8, 
  color, 
  active,
  className = '' 
}: PhaseParticlesProps) {
  const particles = useMemo<ParticleConfig[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: `particle-${i}-${Math.random().toString(36).substring(7)}`,
      delay: i * 0.15,
      duration: 2 + Math.random(),
      x: (Math.random() - 0.5) * 40,
      y: (Math.random() - 0.5) * 40 - 20,
      scale: 0.5 + Math.random() * 0.5,
    }));
  }, [count]);

  if (!active) return null;

  const colorClasses = {
    violet: 'bg-violet-400/40',
    cyan: 'bg-cyan-400/40',
    amber: 'bg-amber-400/40',
    orange: 'bg-orange-400/40',
  };

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`absolute w-1 h-1 rounded-full ${colorClasses[color]} animate-float`}
          style={{
            left: '50%',
            top: '50%',
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
            transform: `translate(${particle.x}px, ${particle.y}px) scale(${particle.scale})`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Signal bars for radio component
 */
interface SignalBarsProps {
  levels: number[];
  phase: string;
  isHover: boolean;
  className?: string;
}

export function SignalBars({ levels, phase, isHover, className = '' }: SignalBarsProps) {
  const barIds = useMemo(() => {
    return levels.map((_, i) => `bar-${i}-${Math.random().toString(36).substring(7)}`);
  }, [levels.length]);

  const getBarClass = () => {
    if (phase === 'acquired') return 'bg-cyan-400/70';
    if (phase !== 'idle') return 'bg-cyan-500/40';
    if (isHover) return 'bg-zinc-600/40';
    return 'bg-zinc-700/30';
  };

  const getHeightMultiplier = () => {
    if (phase !== 'idle') return 1;
    if (isHover) return 0.8;
    return 0.5;
  };

  return (
    <div className={`flex items-end justify-center gap-0.5 h-6 ${className}`}>
      {levels.map((level, i) => (
        <div
          key={barIds[i]}
          className={`w-1 rounded-full transition-all duration-100 ${getBarClass()}`}
          style={{
            height: `${level * getHeightMultiplier() * 100}%`,
          }}
        />
      ))}
    </div>
  );
}
