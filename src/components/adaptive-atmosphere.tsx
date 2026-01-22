"use client";

import { useMemo } from "react";

type Props = {
  intensity?: number; // 0-1
  mood?: "melancholic" | "hopeful" | "introspective" | "peaceful" | "neutral";
  className?: string;
};

export function AdaptiveAtmosphere({ intensity = 0.5, mood = "neutral", className = "" }: Props) {
  // Very subtle color tints - barely noticeable but add ambiance
  const moodColors = useMemo(() => {
    switch (mood) {
      case "melancholic":
        return {
          bottom: "rgba(71, 85, 105, 0.08)", // slate
          mid: "rgba(99, 102, 241, 0.03)", // indigo hint
        };
      case "hopeful":
        return {
          bottom: "rgba(180, 83, 9, 0.06)", // amber
          mid: "rgba(251, 191, 36, 0.02)",
        };
      case "introspective":
        return {
          bottom: "rgba(109, 40, 217, 0.06)", // violet
          mid: "rgba(139, 92, 246, 0.02)",
        };
      case "peaceful":
        return {
          bottom: "rgba(8, 145, 178, 0.05)", // cyan
          mid: "rgba(34, 211, 238, 0.02)",
        };
      default:
        return {
          bottom: "rgba(63, 63, 70, 0.04)", // zinc
          mid: "rgba(82, 82, 91, 0.02)",
        };
    }
  }, [mood]);

  // Very gentle opacity - should never distract
  const dynamicOpacity = 0.5 + intensity * 0.3;

  return (
    <div 
      className={`fixed inset-0 pointer-events-none transition-all duration-[3000ms] ease-out ${className}`}
      style={{ opacity: dynamicOpacity, zIndex: 0 }}
    >
      {/* Bottom gradient - main color area, fades up */}
      <div 
        className="absolute inset-0 transition-all duration-[3000ms]"
        style={{
          background: `linear-gradient(to top, ${moodColors.bottom} 0%, ${moodColors.mid} 30%, transparent 60%)`
        }}
      />
      
      {/* Very subtle bottom glow - wider spread */}
      <div 
        className="absolute inset-0 transition-all duration-[3000ms]"
        style={{
          background: `radial-gradient(ellipse 150% 40% at 50% 100%, ${moodColors.bottom} 0%, transparent 70%)`
        }}
      />
      
      {/* Minimal vignette - helps focus on content */}
      <div 
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.08) 100%)"
        }}
      />
    </div>
  );
}
