"use client";

import { useMemo } from "react";

type Props = {
  mood: "melancholic" | "hopeful" | "introspective" | "peaceful" | "neutral";
  seed?: string;
};

// Living Illustration SVG - generative art based on mood
export function LivingIllustration({ mood, seed = "default" }: Props) {
  // Deterministic random based on seed
  const random = useMemo(() => {
    let h = 0;
    for (const ch of seed) {
      h = ((h << 5) - h + (ch.codePointAt(0) ?? 0)) | 0;
    }
    return () => {
      h = Math.imul(h ^ (h >>> 15), h | 1);
      h ^= h + Math.imul(h ^ (h >>> 7), h | 61);
      return ((h ^ (h >>> 14)) >>> 0) / 4294967296;
    };
  }, [seed]);

  // Color palette based on mood
  const palette = useMemo(() => {
    switch (mood) {
      case "melancholic":
        return { primary: "#64748b", secondary: "#a5b4fc", bg: "#1e293b", accent: "#475569" };
      case "hopeful":
        return { primary: "#fde68a", secondary: "#fbbf24", bg: "#422006", accent: "#f59e0b" };
      case "introspective":
        return { primary: "#a78bfa", secondary: "#c4b5fd", bg: "#2e1065", accent: "#8b5cf6" };
      case "peaceful":
        return { primary: "#67e8f9", secondary: "#bae6fd", bg: "#164e63", accent: "#06b6d4" };
      default:
        return { primary: "#a1a1aa", secondary: "#d4d4d8", bg: "#18181b", accent: "#71717a" };
    }
  }, [mood]);

  // Generate shapes based on mood
  const shapes = useMemo(() => {
    const elements: React.ReactNode[] = [];
    
    if (mood === "melancholic") {
      // Falling drops / rain effect
      for (let i = 0; i < 15; i++) {
        const x = random() * 320;
        const y = random() * 60 + 10;
        const length = random() * 12 + 4;
        const delay = random() * 2;
        elements.push(
          <line
            key={`drop-${i}`}
            x1={x}
            y1={y}
            x2={x}
            y2={y + length}
            stroke={palette.secondary}
            strokeWidth={0.8}
            opacity={0.2 + random() * 0.3}
            style={{ animation: `fall ${1.5 + random()}s ease-in infinite ${delay}s` }}
          />
        );
      }
      // Wave at bottom
      elements.push(
        <path
          key="wave"
          d="M0 65 Q80 50 160 65 T320 65 V80 H0Z"
          fill={palette.primary}
          opacity={0.15}
        />
      );
    }
    
    if (mood === "hopeful") {
      // Sun rays
      const cx = 160, cy = 35;
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const r1 = 22;
        const r2 = 30 + random() * 10;
        elements.push(
          <line
            key={`ray-${i}`}
            x1={cx + Math.cos(angle) * r1}
            y1={cy + Math.sin(angle) * r1}
            x2={cx + Math.cos(angle) * r2}
            y2={cy + Math.sin(angle) * r2}
            stroke={palette.secondary}
            strokeWidth={1.5}
            opacity={0.15 + random() * 0.15}
            strokeLinecap="round"
          />
        );
      }
      // Sun circle
      elements.push(
        <circle key="sun" cx={cx} cy={cy} r={18} fill={palette.primary} opacity={0.25} />
      );
      // Small floating particles
      for (let i = 0; i < 8; i++) {
        elements.push(
          <circle
            key={`particle-${i}`}
            cx={random() * 280 + 20}
            cy={random() * 50 + 15}
            r={1 + random() * 2}
            fill={palette.accent}
            opacity={0.2 + random() * 0.2}
            style={{ animation: `float ${2 + random() * 2}s ease-in-out infinite` }}
          />
        );
      }
    }
    
    if (mood === "introspective") {
      // Spiral/labyrinth pattern
      const spiralPoints: string[] = [];
      for (let t = 0; t < 6 * Math.PI; t += 0.2) {
        const r = 5 + t * 2.5;
        const x = 160 + Math.cos(t) * r;
        const y = 40 + Math.sin(t) * r * 0.5;
        spiralPoints.push(`${x},${y}`);
      }
      elements.push(
        <polyline
          key="spiral"
          points={spiralPoints.join(" ")}
          fill="none"
          stroke={palette.primary}
          strokeWidth={1.2}
          opacity={0.2}
          strokeLinecap="round"
        />
      );
      // Dots at intersections
      for (let i = 0; i < 6; i++) {
        const t = i * Math.PI;
        const r = 5 + t * 2.5;
        elements.push(
          <circle
            key={`dot-${i}`}
            cx={160 + Math.cos(t) * r}
            cy={40 + Math.sin(t) * r * 0.5}
            r={2}
            fill={palette.secondary}
            opacity={0.3}
          />
        );
      }
    }
    
    if (mood === "peaceful") {
      // Soft clouds
      const cloudGroups = [
        { cx: 80, cy: 45, rx: 35, ry: 15 },
        { cx: 200, cy: 35, rx: 40, ry: 12 },
        { cx: 280, cy: 50, rx: 25, ry: 10 }
      ];
      cloudGroups.forEach((cloud, idx) => {
        elements.push(
          <ellipse
            key={`cloud-${idx}`}
            cx={cloud.cx}
            cy={cloud.cy}
            rx={cloud.rx}
            ry={cloud.ry}
            fill={palette.primary}
            opacity={0.1 + random() * 0.1}
          />
        );
        // Secondary ellipses for depth
        elements.push(
          <ellipse
            key={`cloud-shadow-${idx}`}
            cx={cloud.cx + 10}
            cy={cloud.cy + 5}
            rx={cloud.rx * 0.7}
            ry={cloud.ry * 0.8}
            fill={palette.secondary}
            opacity={0.08}
          />
        );
      });
      // Gentle horizontal lines
      for (let i = 0; i < 4; i++) {
        const y = 60 + i * 5;
        elements.push(
          <line
            key={`horizon-${i}`}
            x1={40 + i * 20}
            y1={y}
            x2={280 - i * 20}
            y2={y}
            stroke={palette.accent}
            strokeWidth={0.5}
            opacity={0.1 - i * 0.02}
          />
        );
      }
    }
    
    if (mood === "neutral") {
      // Abstract geometric
      elements.push(
        <circle key="c1" cx={160} cy={40} r={25} fill="none" stroke={palette.primary} strokeWidth={0.8} opacity={0.15} />
      );
      elements.push(
        <circle key="c2" cx={160} cy={40} r={18} fill="none" stroke={palette.secondary} strokeWidth={0.5} opacity={0.12} />
      );
      elements.push(
        <line key="l1" x1={135} y1={40} x2={185} y2={40} stroke={palette.accent} strokeWidth={0.5} opacity={0.2} />
      );
      elements.push(
        <line key="l2" x1={160} y1={15} x2={160} y2={65} stroke={palette.accent} strokeWidth={0.5} opacity={0.2} />
      );
    }
    
    return elements;
  }, [mood, random, palette]);

  return (
    <svg 
      viewBox="0 0 320 80" 
      className="w-full h-auto max-w-lg mx-auto"
      style={{ minHeight: 60 }}
      aria-hidden="true"
    >
      <style>
        {`
          @keyframes fall {
            0% { transform: translateY(-10px); opacity: 0; }
            50% { opacity: 0.4; }
            100% { transform: translateY(20px); opacity: 0; }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
          }
        `}
      </style>
      
      {/* Background gradient */}
      <defs>
        <linearGradient id={`bg-${mood}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={palette.primary} stopOpacity="0.08" />
          <stop offset="100%" stopColor={palette.bg} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      
      <rect x="0" y="0" width="320" height="80" fill={`url(#bg-${mood})`} rx="8" />
      
      {/* Generated shapes */}
      {shapes}
    </svg>
  );
}
