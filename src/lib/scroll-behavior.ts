/**
 * Scroll Behavior Analysis
 * 
 * Detects reading patterns and emotional state based on scroll behavior.
 * Fast scrolling = anxious/searching, slow = calm/engaged.
 */

export type ScrollMood = "calm" | "focused" | "browsing" | "anxious";

export interface ScrollBehavior {
  mood: ScrollMood;
  speed: number; // pixels per second
  direction: "up" | "down" | "idle";
  engagementScore: number; // 0-1
  readingPace: "slow" | "medium" | "fast";
  pauseCount: number;
  totalScrollDistance: number;
}

interface ScrollState {
  lastY: number;
  lastTime: number;
  speeds: number[];
  pauses: number;
  direction: "up" | "down" | "idle";
  totalDistance: number;
}

const state: ScrollState = {
  lastY: 0,
  lastTime: Date.now(),
  speeds: [],
  pauses: 0,
  direction: "idle",
  totalDistance: 0,
};

const MAX_SPEED_SAMPLES = 20;

/**
 * Analyze scroll mood based on speed patterns
 */
function analyzeMood(avgSpeed: number): ScrollMood {
  if (avgSpeed < 50) return "calm";
  if (avgSpeed < 150) return "focused";
  if (avgSpeed < 400) return "browsing";
  return "anxious";
}

/**
 * Calculate engagement score (0-1)
 * Higher score = more engaged reading
 */
function calculateEngagement(speeds: number[], pauses: number): number {
  if (speeds.length === 0) return 0.5;
  
  const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
  const speedScore = Math.max(0, 1 - avgSpeed / 500);
  const pauseScore = Math.min(1, pauses / 10);
  
  return speedScore * 0.7 + pauseScore * 0.3;
}

/**
 * Determine reading pace
 */
function getReadingPace(avgSpeed: number): ScrollBehavior["readingPace"] {
  if (avgSpeed < 80) return "slow";
  if (avgSpeed < 200) return "medium";
  return "fast";
}

/**
 * Process a scroll event and update behavior analysis
 */
export function processScrollEvent(): ScrollBehavior {
  if (typeof window === "undefined") {
    return getDefaultBehavior();
  }
  
  const currentY = window.scrollY;
  const currentTime = Date.now();
  const timeDelta = currentTime - state.lastTime;
  
  if (timeDelta > 0) {
    const distance = Math.abs(currentY - state.lastY);
    const speed = (distance / timeDelta) * 1000; // pixels per second
    
    // Track direction
    if (currentY > state.lastY) {
      state.direction = "down";
    } else if (currentY < state.lastY) {
      state.direction = "up";
    }
    
    // Detect pause (no movement for 500ms+)
    if (speed < 10 && timeDelta > 500) {
      state.pauses++;
    }
    
    // Add to speed samples
    state.speeds.push(speed);
    if (state.speeds.length > MAX_SPEED_SAMPLES) {
      state.speeds.shift();
    }
    
    // Track total distance
    state.totalDistance += distance;
  }
  
  state.lastY = currentY;
  state.lastTime = currentTime;
  
  return getScrollBehavior();
}

/**
 * Get current scroll behavior analysis
 */
export function getScrollBehavior(): ScrollBehavior {
  if (state.speeds.length === 0) {
    return getDefaultBehavior();
  }
  
  const avgSpeed = state.speeds.reduce((a, b) => a + b, 0) / state.speeds.length;
  
  return {
    mood: analyzeMood(avgSpeed),
    speed: avgSpeed,
    direction: state.direction,
    engagementScore: calculateEngagement(state.speeds, state.pauses),
    readingPace: getReadingPace(avgSpeed),
    pauseCount: state.pauses,
    totalScrollDistance: state.totalDistance,
  };
}

/**
 * Reset scroll tracking
 */
export function resetScrollTracking(): void {
  state.speeds = [];
  state.pauses = 0;
  state.totalDistance = 0;
  state.direction = "idle";
}

/**
 * Default behavior for SSR
 */
function getDefaultBehavior(): ScrollBehavior {
  return {
    mood: "calm",
    speed: 0,
    direction: "idle",
    engagementScore: 0.5,
    readingPace: "medium",
    pauseCount: 0,
    totalScrollDistance: 0,
  };
}

/**
 * Get mood-based recommendations
 */
export function getMoodMessage(mood: ScrollMood): string {
  switch (mood) {
    case "calm":
      return "You're reading peacefully. Take your time.";
    case "focused":
      return "Deep in thought. The words are landing.";
    case "browsing":
      return "Exploring. Something will catch your eye.";
    case "anxious":
      return "Take a breath. The stillness will wait.";
  }
}

/**
 * Get ambient adjustment based on mood
 */
export function getMoodAmbientAdjustment(mood: ScrollMood): {
  intensity: number;
  warmth: number;
} {
  switch (mood) {
    case "calm":
      return { intensity: 0.8, warmth: 0.6 };
    case "focused":
      return { intensity: 0.6, warmth: 0.5 };
    case "browsing":
      return { intensity: 0.4, warmth: 0.4 };
    case "anxious":
      return { intensity: 0.3, warmth: 0.3 };
  }
}
