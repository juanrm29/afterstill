/**
 * Reading Progress System
 * 
 * Remembers where the user stopped reading and offers to continue.
 * Creates continuity across sessions.
 */

export interface ReadingProgress {
  slug: string;
  title: string;
  scrollPercentage: number;
  lastRead: number;
  timeSpent: number; // seconds
  isComplete: boolean;
}

export interface ReadingHistory {
  inProgress: ReadingProgress[];
  completed: string[];
  totalTimeSpent: number;
}

const STORAGE_KEY = "afterstill_reading_progress";
const MAX_IN_PROGRESS = 10;
const COMPLETE_THRESHOLD = 90; // % scroll = complete

/**
 * Get reading history from storage
 */
export function getReadingHistory(): ReadingHistory {
  if (typeof window === "undefined") {
    return { inProgress: [], completed: [], totalTimeSpent: 0 };
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Storage not available
  }
  
  return { inProgress: [], completed: [], totalTimeSpent: 0 };
}

/**
 * Save reading history
 */
function saveReadingHistory(history: ReadingHistory): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // Storage not available
  }
}

/**
 * Update reading progress for a specific writing
 */
export function updateReadingProgress(
  slug: string,
  title: string,
  scrollPercentage: number,
  timeSpent: number
): void {
  const history = getReadingHistory();
  const now = Date.now();
  const isComplete = scrollPercentage >= COMPLETE_THRESHOLD;
  
  // Find existing progress
  const existingIndex = history.inProgress.findIndex(p => p.slug === slug);
  
  if (isComplete) {
    // Move to completed
    if (existingIndex >= 0) {
      history.inProgress.splice(existingIndex, 1);
    }
    if (!history.completed.includes(slug)) {
      history.completed.push(slug);
    }
  } else {
    // Update in progress
    const progress: ReadingProgress = {
      slug,
      title,
      scrollPercentage,
      lastRead: now,
      timeSpent: existingIndex >= 0 
        ? history.inProgress[existingIndex].timeSpent + timeSpent 
        : timeSpent,
      isComplete: false,
    };
    
    if (existingIndex >= 0) {
      history.inProgress[existingIndex] = progress;
    } else {
      history.inProgress.unshift(progress);
      // Limit in-progress items
      if (history.inProgress.length > MAX_IN_PROGRESS) {
        history.inProgress.pop();
      }
    }
  }
  
  // Update total time
  history.totalTimeSpent += timeSpent;
  
  saveReadingHistory(history);
}

/**
 * Get progress for a specific writing
 */
export function getReadingProgress(slug: string): ReadingProgress | null {
  const history = getReadingHistory();
  return history.inProgress.find(p => p.slug === slug) || null;
}

/**
 * Check if a writing is completed
 */
export function isWritingCompleted(slug: string): boolean {
  const history = getReadingHistory();
  return history.completed.includes(slug);
}

/**
 * Get most recent in-progress reading
 */
export function getMostRecentReading(): ReadingProgress | null {
  const history = getReadingHistory();
  if (history.inProgress.length === 0) return null;
  
  // Sort by lastRead and return most recent
  const sorted = [...history.inProgress].sort((a, b) => b.lastRead - a.lastRead);
  return sorted[0];
}

/**
 * Format time since last read
 */
export function formatTimeSince(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return `${Math.floor(days / 7)} weeks ago`;
}

/**
 * Format time spent reading
 */
export function formatTimeSpent(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

/**
 * Get continue reading message
 */
export function getContinueMessage(progress: ReadingProgress): string {
  const timeSince = formatTimeSince(progress.lastRead);
  const percent = Math.round(progress.scrollPercentage);
  
  return `Continue "${progress.title}" — ${percent}% read, left off ${timeSince}`;
}

/**
 * Get reading stats
 */
export function getReadingStats(): {
  totalRead: number;
  inProgress: number;
  totalTime: string;
} {
  const history = getReadingHistory();
  
  return {
    totalRead: history.completed.length,
    inProgress: history.inProgress.length,
    totalTime: formatTimeSpent(history.totalTimeSpent),
  };
}

/**
 * Clear all reading progress
 */
export function clearReadingProgress(): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage not available
  }
}
