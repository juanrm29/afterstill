/**
 * Visitor Memory System
 * 
 * Afterstill remembers its visitors - creating continuity and personal connection.
 * The website becomes aware of your patterns and responds accordingly.
 */

export interface VisitorMemory {
  // Identity
  visitorId: string;
  firstVisit: number;
  
  // Visit patterns
  totalVisits: number;
  lastVisit: number;
  visitStreak: number;
  longestStreak: number;
  
  // Reading behavior
  writingsRead: string[];
  lastReading: string | null;
  favoriteTimePhase: string;
  averageSessionDuration: number;
  
  // Preferences (learned)
  preferredMood: string | null;
  scrollSpeed: "slow" | "medium" | "fast";
  engagementLevel: "casual" | "regular" | "devoted";
  
  // Emotional state tracking
  lastMoodInferred: string | null;
  
  // Session data
  currentSessionStart: number;
}

const STORAGE_KEY = "afterstill_visitor_memory";
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Generate a unique visitor ID
 */
function generateVisitorId(): string {
  return `visitor_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Get visitor memory from localStorage
 */
export function getVisitorMemory(): VisitorMemory | null {
  if (typeof window === "undefined") return null;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Storage not available
  }
  return null;
}

/**
 * Save visitor memory to localStorage
 */
export function saveVisitorMemory(memory: VisitorMemory): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  } catch {
    // Storage not available
  }
}

/**
 * Initialize or update visitor memory for current session
 */
export function initializeVisitorMemory(): VisitorMemory {
  const existing = getVisitorMemory();
  const now = Date.now();
  
  if (existing) {
    // Returning visitor
    const daysSinceLastVisit = (now - existing.lastVisit) / DAY_MS;
    const isNewDay = daysSinceLastVisit >= 1;
    const streakBroken = daysSinceLastVisit > 2; // Allow 2 day gap
    
    const updated: VisitorMemory = {
      ...existing,
      totalVisits: existing.totalVisits + (isNewDay ? 1 : 0),
      lastVisit: now,
      visitStreak: streakBroken ? 1 : (isNewDay ? existing.visitStreak + 1 : existing.visitStreak),
      longestStreak: Math.max(existing.longestStreak, existing.visitStreak + (isNewDay && !streakBroken ? 1 : 0)),
      currentSessionStart: now,
    };
    
    saveVisitorMemory(updated);
    return updated;
  }
  
  // New visitor
  const newMemory: VisitorMemory = {
    visitorId: generateVisitorId(),
    firstVisit: now,
    totalVisits: 1,
    lastVisit: now,
    visitStreak: 1,
    longestStreak: 1,
    writingsRead: [],
    lastReading: null,
    favoriteTimePhase: "",
    averageSessionDuration: 0,
    preferredMood: null,
    scrollSpeed: "medium",
    engagementLevel: "casual",
    lastMoodInferred: null,
    currentSessionStart: now,
  };
  
  saveVisitorMemory(newMemory);
  return newMemory;
}

/**
 * Record that a writing was read
 */
export function recordReading(slug: string): void {
  const memory = getVisitorMemory();
  if (!memory) return;
  
  const updated: VisitorMemory = {
    ...memory,
    writingsRead: memory.writingsRead.includes(slug) 
      ? memory.writingsRead 
      : [...memory.writingsRead, slug],
    lastReading: slug,
  };
  
  saveVisitorMemory(updated);
}

/**
 * Update scroll speed preference based on behavior
 */
export function updateScrollBehavior(scrollsPerMinute: number): void {
  const memory = getVisitorMemory();
  if (!memory) return;
  
  let scrollSpeed: VisitorMemory["scrollSpeed"] = "medium";
  if (scrollsPerMinute < 5) scrollSpeed = "slow";
  else if (scrollsPerMinute > 15) scrollSpeed = "fast";
  
  const updated: VisitorMemory = {
    ...memory,
    scrollSpeed,
  };
  
  saveVisitorMemory(updated);
}

/**
 * Calculate engagement level based on patterns
 */
export function calculateEngagement(memory: VisitorMemory): VisitorMemory["engagementLevel"] {
  if (memory.totalVisits >= 20 && memory.visitStreak >= 5) return "devoted";
  if (memory.totalVisits >= 5 && memory.visitStreak >= 2) return "regular";
  return "casual";
}

/**
 * Get time since last visit in human-readable format
 */
export function getTimeSinceLastVisit(memory: VisitorMemory): string {
  const now = Date.now();
  const diff = now - memory.lastVisit;
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / DAY_MS);
  
  if (minutes < 5) return "moments";
  if (minutes < 60) return `${minutes} minutes`;
  if (hours < 24) return hours === 1 ? "an hour" : `${hours} hours`;
  if (days === 1) return "a day";
  if (days < 7) return `${days} days`;
  if (days < 30) return `${Math.floor(days / 7)} weeks`;
  return `${Math.floor(days / 30)} months`;
}

/**
 * Generate personalized welcome message
 */
export function getWelcomeMessage(memory: VisitorMemory): string {
  const timeSince = getTimeSinceLastVisit(memory);
  const engagement = calculateEngagement(memory);
  
  // First time visitor
  if (memory.totalVisits === 1) {
    return "Welcome, wanderer. This is your first time here.";
  }
  
  // Devoted visitor
  if (engagement === "devoted") {
    if (memory.visitStreak >= 7) {
      return `${memory.visitStreak} days walking together. The path knows you.`;
    }
    return "A familiar presence returns. Welcome home.";
  }
  
  // Regular visitor
  if (engagement === "regular") {
    return `Back after ${timeSince}. The stillness waited.`;
  }
  
  // Casual visitor
  if (memory.totalVisits === 2) {
    return "You returned. That means something.";
  }
  
  return `Welcome back after ${timeSince} of silence.`;
}

/**
 * Get reading continuity message
 */
export function getReadingContinuity(memory: VisitorMemory): string | null {
  if (!memory.lastReading) return null;
  
  const timeSince = getTimeSinceLastVisit(memory);
  return `You were reading "${memory.lastReading}" ${timeSince} ago.`;
}

/**
 * Check if visitor is returning (for this session)
 */
export function isReturningVisitor(): boolean {
  const memory = getVisitorMemory();
  return memory !== null && memory.totalVisits > 1;
}

/**
 * Get visitor stats for display
 */
export function getVisitorStats(memory: VisitorMemory) {
  const daysSinceFirst = Math.floor((Date.now() - memory.firstVisit) / DAY_MS);
  
  return {
    totalVisits: memory.totalVisits,
    daysTogether: daysSinceFirst,
    currentStreak: memory.visitStreak,
    longestStreak: memory.longestStreak,
    writingsRead: memory.writingsRead.length,
    engagement: calculateEngagement(memory),
  };
}
