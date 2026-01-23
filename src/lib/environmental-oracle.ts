/**
 * Environmental Oracle - The Universe Conspires
 * 
 * Combines multiple environmental factors to select a "fated" writing:
 * - Time of day (temporal phase)
 * - Moon phase
 * - Weather conditions
 * - Day of week
 * - Season
 * - User's visit history
 */

import { getTemporalState, type TimePhase } from "./temporal";
import { getMoonPhase } from "./easter-eggs";

export interface EnvironmentalState {
  temporal: {
    phase: TimePhase;
    hour: number;
  };
  moon: {
    phase: string;
    illumination: number;
    emoji: string;
  };
  weather?: {
    condition: WeatherCondition;
    temperature: number;
    humidity: number;
    description: string;
  };
  cosmic: {
    dayOfWeek: number;
    dayOfYear: number;
    season: Season;
    isLiminal: boolean; // Dawn, dusk, midnight, solstice, equinox
  };
}

export type WeatherCondition = 
  | "clear" 
  | "clouds" 
  | "rain" 
  | "storm" 
  | "snow" 
  | "mist" 
  | "unknown";

export type Season = "spring" | "summer" | "autumn" | "winter";

export interface OracleReading {
  writingId: string;
  resonanceScore: number;
  cosmicMessage: string;
  environmentalFactors: string[];
}

/**
 * Get current season based on date (Northern Hemisphere)
 */
function getSeason(date: Date): Season {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "autumn";
  return "winter";
}

/**
 * Check if current time is "liminal" (threshold/in-between)
 */
function isLiminalTime(date: Date): boolean {
  const hour = date.getHours();
  const month = date.getMonth();
  const day = date.getDate();
  
  // Liminal hours
  const liminalHours = [0, 5, 6, 17, 18, 23]; // Midnight, dawn, dusk
  if (liminalHours.includes(hour)) return true;
  
  // Solstices and Equinoxes (approximate)
  const liminalDays = [
    { month: 2, day: 20 },  // Spring equinox
    { month: 5, day: 21 },  // Summer solstice
    { month: 8, day: 22 },  // Autumn equinox
    { month: 11, day: 21 }, // Winter solstice
  ];
  
  return liminalDays.some(d => d.month === month && d.day === day);
}

/**
 * Fetch weather from free API
 */
export async function fetchWeather(
  lat: number, 
  lon: number
): Promise<EnvironmentalState["weather"] | undefined> {
  try {
    // Using Open-Meteo (free, no API key needed)
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code`
    );
    
    if (!response.ok) return undefined;
    
    const data = await response.json();
    const current = data.current;
    
    // Map weather code to condition
    const code = current.weather_code;
    let condition: WeatherCondition = "unknown";
    let description = "Unknown";
    
    if (code === 0) {
      condition = "clear";
      description = "Clear sky";
    } else if (code >= 1 && code <= 3) {
      condition = "clouds";
      description = code === 1 ? "Partly cloudy" : code === 2 ? "Cloudy" : "Overcast";
    } else if (code >= 45 && code <= 48) {
      condition = "mist";
      description = "Fog";
    } else if (code >= 51 && code <= 67) {
      condition = "rain";
      description = "Rain";
    } else if (code >= 71 && code <= 77) {
      condition = "snow";
      description = "Snow";
    } else if (code >= 80 && code <= 99) {
      condition = code >= 95 ? "storm" : "rain";
      description = code >= 95 ? "Thunderstorm" : "Showers";
    }
    
    return {
      condition,
      temperature: current.temperature_2m,
      humidity: current.relative_humidity_2m,
      description,
    };
  } catch {
    return undefined;
  }
}

/**
 * Get complete environmental state
 */
export async function getEnvironmentalState(
  coords?: { lat: number; lon: number }
): Promise<EnvironmentalState> {
  const now = new Date();
  const temporal = getTemporalState();
  const moon = getMoonPhase();
  
  // Calculate day of year
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  const state: EnvironmentalState = {
    temporal: {
      phase: temporal.phase,
      hour: now.getHours(),
    },
    moon: {
      phase: moon.phase,
      illumination: moon.illumination,
      emoji: moon.emoji,
    },
    cosmic: {
      dayOfWeek: now.getDay(),
      dayOfYear,
      season: getSeason(now),
      isLiminal: isLiminalTime(now),
    },
  };
  
  // Fetch weather if coords provided
  if (coords) {
    state.weather = await fetchWeather(coords.lat, coords.lon);
  }
  
  return state;
}

/**
 * Writing mood/theme tags for matching
 */
export interface WritingMood {
  id: string;
  title: string;
  themes: string[];
  energy: "calm" | "intense" | "melancholic" | "hopeful" | "mysterious";
  timeAffinity: TimePhase[];
  weatherAffinity: WeatherCondition[];
  moonAffinity: ("new" | "full" | "waxing" | "waning")[];
}

/**
 * Calculate resonance score between environment and writing
 */
export function calculateResonance(
  env: EnvironmentalState,
  writing: WritingMood
): number {
  let score = 0;
  const factors: string[] = [];
  
  // Time affinity (0-25 points)
  if (writing.timeAffinity.includes(env.temporal.phase)) {
    score += 25;
    factors.push(`aligned with ${env.temporal.phase}`);
  }
  
  // Weather affinity (0-25 points)
  if (env.weather && writing.weatherAffinity.includes(env.weather.condition)) {
    score += 25;
    factors.push(`resonates with ${env.weather.description.toLowerCase()}`);
  }
  
  // Moon affinity (0-20 points)
  const moonCategory = env.moon.phase.includes("waxing") ? "waxing" 
    : env.moon.phase.includes("waning") ? "waning"
    : env.moon.phase === "full" ? "full" 
    : "new";
  
  if (writing.moonAffinity.includes(moonCategory as "new" | "full" | "waxing" | "waning")) {
    score += 20;
    factors.push(`called by the ${env.moon.phase.replace("-", " ")} moon`);
  }
  
  // Liminal bonus (0-15 points)
  if (env.cosmic.isLiminal && writing.energy === "mysterious") {
    score += 15;
    factors.push("emerged from the in-between");
  }
  
  // Season bonus (0-15 points)
  const seasonThemes: Record<Season, string[]> = {
    spring: ["rebirth", "hope", "beginning", "growth"],
    summer: ["passion", "energy", "freedom", "light"],
    autumn: ["change", "letting go", "reflection", "harvest"],
    winter: ["stillness", "introspection", "rest", "memory"],
  };
  
  const hasSeasonTheme = writing.themes.some(t => 
    seasonThemes[env.cosmic.season].includes(t.toLowerCase())
  );
  
  if (hasSeasonTheme) {
    score += 15;
    factors.push(`echoes ${env.cosmic.season}'s essence`);
  }
  
  return score;
}

/**
 * Generate cosmic message based on environment
 */
export function generateCosmicMessage(env: EnvironmentalState): string {
  const messages: string[] = [];
  
  // Time-based
  const timeMessages: Record<TimePhase, string> = {
    dawn: "At the edge of night and day",
    morning: "As light unfolds",
    afternoon: "Under the watching sun",
    dusk: "Where shadows grow long",
    night: "In darkness, clarity emerges",
    midnight: "At the threshold of all things",
  };
  messages.push(timeMessages[env.temporal.phase]);
  
  // Moon-based
  if (env.moon.illumination > 90) {
    messages.push("the full moon illuminates what was hidden");
  } else if (env.moon.illumination < 10) {
    messages.push("in the new moon's darkness, seeds are planted");
  } else if (env.moon.phase.includes("waxing")) {
    messages.push("as the moon grows, so does understanding");
  } else {
    messages.push("the waning moon invites release");
  }
  
  // Weather-based
  if (env.weather) {
    const weatherMessages: Record<WeatherCondition, string> = {
      clear: "beneath an open sky",
      clouds: "veiled by clouds, yet present",
      rain: "washed by rain, renewed",
      storm: "through the storm, transformation comes",
      snow: "in the silence of snow",
      mist: "within the mist, boundaries dissolve",
      unknown: "the atmosphere holds mystery",
    };
    messages.push(weatherMessages[env.weather.condition]);
  }
  
  // Liminal bonus
  if (env.cosmic.isLiminal) {
    messages.push("— the veil is thin, the universe conspires");
  }
  
  return messages.join(", ") + ".";
}

/**
 * Select the "fated" writing based on environmental resonance
 */
export function selectFatedWriting(
  writings: WritingMood[],
  env: EnvironmentalState
): OracleReading | null {
  if (writings.length === 0) return null;
  
  // Calculate resonance for each writing
  const scored = writings.map(w => ({
    writing: w,
    score: calculateResonance(env, w),
  }));
  
  // Sort by score
  scored.sort((a, b) => b.score - a.score);
  
  // Add some cosmic randomness (top 3 can be chosen)
  const topCandidates = scored.slice(0, Math.min(3, scored.length));
  const cosmicRoll = (Date.now() % 100) / 100;
  
  // Weighted selection from top candidates
  const selected = cosmicRoll < 0.6 
    ? topCandidates[0] 
    : cosmicRoll < 0.9 && topCandidates[1]
    ? topCandidates[1]
    : topCandidates[topCandidates.length - 1];
  
  const factors: string[] = [];
  
  // Build factors list
  if (selected.score >= 25) {
    factors.push(generateCosmicMessage(env).split(",")[0]);
  }
  if (env.moon.illumination > 50) {
    factors.push(`${env.moon.emoji} Moon ${env.moon.illumination}% illuminated`);
  }
  if (env.weather) {
    factors.push(env.weather.description);
  }
  factors.push(env.cosmic.season.charAt(0).toUpperCase() + env.cosmic.season.slice(1));
  
  return {
    writingId: selected.writing.id,
    resonanceScore: selected.score,
    cosmicMessage: generateCosmicMessage(env),
    environmentalFactors: factors,
  };
}
