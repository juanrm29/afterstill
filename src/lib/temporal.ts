/**
 * Temporal Intelligence System
 * 
 * Makes Afterstill aware of time - the website "breathes" differently
 * based on the hour, creating a living, conscious experience.
 */

export type TimePhase = 
  | "dawn"      // 04:00-07:00 - Gentle awakening
  | "morning"   // 07:00-12:00 - Clear, focused
  | "afternoon" // 12:00-17:00 - Warm, contemplative  
  | "dusk"      // 17:00-20:00 - Golden hour, reflective
  | "night"     // 20:00-00:00 - Deep, mysterious
  | "midnight"; // 00:00-04:00 - Intimate void

export interface TemporalState {
  phase: TimePhase;
  hour: number;
  minute: number;
  progress: number; // 0-1 progress through current phase
  greeting: string;
  mood: "melancholic" | "hopeful" | "introspective" | "peaceful" | "neutral";
  ambientIntensity: number;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    glow: string;
  };
  typography: {
    warmth: number; // 0-1, affects letter-spacing and weight
  };
}

/**
 * Get current time phase based on hour
 */
export function getTimePhase(hour: number): TimePhase {
  if (hour >= 4 && hour < 7) return "dawn";
  if (hour >= 7 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 20) return "dusk";
  if (hour >= 20 && hour < 24) return "night";
  return "midnight"; // 0-4
}

/**
 * Calculate progress through current phase (0-1)
 */
export function getPhaseProgress(hour: number, minute: number): number {
  const totalMinutes = hour * 60 + minute;
  
  const phaseRanges: Record<TimePhase, [number, number]> = {
    dawn: [4 * 60, 7 * 60],
    morning: [7 * 60, 12 * 60],
    afternoon: [12 * 60, 17 * 60],
    dusk: [17 * 60, 20 * 60],
    night: [20 * 60, 24 * 60],
    midnight: [0, 4 * 60],
  };
  
  const phase = getTimePhase(hour);
  const [start, end] = phaseRanges[phase];
  
  // Handle midnight wraparound
  if (phase === "midnight") {
    return totalMinutes / (4 * 60);
  }
  
  return (totalMinutes - start) / (end - start);
}

/**
 * Get contextual greeting based on time
 */
export function getGreeting(phase: TimePhase, isReturning: boolean): string {
  const greetings: Record<TimePhase, { new: string; returning: string }> = {
    dawn: {
      new: "The world stirs gently. Welcome.",
      returning: "You rise with the light. Welcome back.",
    },
    morning: {
      new: "A new day unfolds. Enter.",
      returning: "The morning knows your name.",
    },
    afternoon: {
      new: "The day holds space for you.",
      returning: "You return when the light is warm.",
    },
    dusk: {
      new: "Golden hour awaits. Come in.",
      returning: "The evening remembers you.",
    },
    night: {
      new: "The night is kind to wanderers.",
      returning: "Welcome back to the quiet hours.",
    },
    midnight: {
      new: "In the void, we find clarity.",
      returning: "The midnight knows your restlessness.",
    },
  };

  return isReturning ? greetings[phase].returning : greetings[phase].new;
}

/**
 * Get mood based on time phase
 */
export function getPhaseMood(phase: TimePhase): TemporalState["mood"] {
  const moods: Record<TimePhase, TemporalState["mood"]> = {
    dawn: "hopeful",
    morning: "peaceful",
    afternoon: "neutral",
    dusk: "introspective",
    night: "melancholic",
    midnight: "introspective",
  };
  return moods[phase];
}

/**
 * Get color palette for current phase
 */
export function getPhaseColors(phase: TimePhase): TemporalState["colors"] {
  const palettes: Record<TimePhase, TemporalState["colors"]> = {
    dawn: {
      primary: "rgba(251, 191, 36, 0.15)",   // Amber
      secondary: "rgba(253, 224, 71, 0.08)", // Yellow
      accent: "rgba(245, 158, 11, 0.2)",     // Orange
      glow: "rgba(251, 191, 36, 0.05)",
    },
    morning: {
      primary: "rgba(147, 197, 253, 0.12)",  // Light blue
      secondary: "rgba(191, 219, 254, 0.06)",
      accent: "rgba(59, 130, 246, 0.15)",
      glow: "rgba(147, 197, 253, 0.04)",
    },
    afternoon: {
      primary: "rgba(252, 211, 77, 0.1)",    // Warm yellow
      secondary: "rgba(253, 230, 138, 0.05)",
      accent: "rgba(245, 158, 11, 0.12)",
      glow: "rgba(252, 211, 77, 0.03)",
    },
    dusk: {
      primary: "rgba(249, 115, 22, 0.12)",   // Orange
      secondary: "rgba(251, 146, 60, 0.06)",
      accent: "rgba(234, 88, 12, 0.15)",
      glow: "rgba(249, 115, 22, 0.04)",
    },
    night: {
      primary: "rgba(99, 102, 241, 0.1)",    // Indigo
      secondary: "rgba(129, 140, 248, 0.05)",
      accent: "rgba(79, 70, 229, 0.12)",
      glow: "rgba(99, 102, 241, 0.03)",
    },
    midnight: {
      primary: "rgba(30, 27, 75, 0.15)",     // Deep purple
      secondary: "rgba(49, 46, 129, 0.08)",
      accent: "rgba(67, 56, 202, 0.1)",
      glow: "rgba(30, 27, 75, 0.05)",
    },
  };
  return palettes[phase];
}

/**
 * Get ambient intensity based on time
 * Higher during calm hours, lower during active hours
 */
export function getAmbientIntensity(phase: TimePhase): number {
  const intensities: Record<TimePhase, number> = {
    dawn: 0.6,
    morning: 0.4,
    afternoon: 0.3,
    dusk: 0.7,
    night: 0.8,
    midnight: 0.9,
  };
  return intensities[phase];
}

/**
 * Get complete temporal state
 */
export function getTemporalState(date: Date = new Date(), isReturning = false): TemporalState {
  const hour = date.getHours();
  const minute = date.getMinutes();
  const phase = getTimePhase(hour);
  
  return {
    phase,
    hour,
    minute,
    progress: getPhaseProgress(hour, minute),
    greeting: getGreeting(phase, isReturning),
    mood: getPhaseMood(phase),
    ambientIntensity: getAmbientIntensity(phase),
    colors: getPhaseColors(phase),
    typography: {
      warmth: phase === "night" || phase === "midnight" ? 0.8 : 0.5,
    },
  };
}

/**
 * Get minutes until next phase change
 */
export function getMinutesUntilNextPhase(hour: number, minute: number): number {
  const phaseEndHours: Record<TimePhase, number> = {
    dawn: 7,
    morning: 12,
    afternoon: 17,
    dusk: 20,
    night: 24,
    midnight: 4,
  };
  
  const phase = getTimePhase(hour);
  const endHour = phaseEndHours[phase];
  
  // Handle midnight wraparound
  if (phase === "midnight") {
    return (4 - hour) * 60 - minute;
  }
  if (phase === "night" && hour >= 20) {
    return (24 - hour) * 60 - minute;
  }
  
  return (endHour - hour) * 60 - minute;
}

/**
 * Format time phase for display
 */
export function formatPhase(phase: TimePhase): string {
  const labels: Record<TimePhase, string> = {
    dawn: "Dawn",
    morning: "Morning", 
    afternoon: "Afternoon",
    dusk: "Dusk",
    night: "Night",
    midnight: "Midnight",
  };
  return labels[phase];
}
