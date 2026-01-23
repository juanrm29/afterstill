/**
 * Collective Presence System
 * 
 * Creates awareness of other visitors reading at the same time.
 * Uses localStorage + BroadcastChannel for demo, but can be extended to WebSocket.
 */

export interface Presence {
  id: string;
  page: string;
  joinedAt: number;
  lastSeen: number;
}

const PRESENCE_KEY = "afterstill_presence";
const PRESENCE_TIMEOUT = 30 * 1000; // 30 seconds

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Get current presence from storage
 */
function getStoredPresences(): Presence[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(PRESENCE_KEY);
    if (stored) {
      const presences: Presence[] = JSON.parse(stored);
      // Filter out stale presences
      return presences.filter(p => Date.now() - p.lastSeen < PRESENCE_TIMEOUT);
    }
  } catch {
    // Storage not available
  }
  return [];
}

/**
 * Save presences to storage
 */
function savePresences(presences: Presence[]): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(PRESENCE_KEY, JSON.stringify(presences));
  } catch {
    // Storage not available
  }
}

/**
 * PresenceTracker - Manages local presence
 */
export class PresenceTracker {
  private sessionId: string;
  private currentPage: string;
  private updateInterval: NodeJS.Timeout | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private onUpdate: ((presences: Presence[]) => void) | null = null;

  constructor() {
    this.sessionId = generateSessionId();
    this.currentPage = typeof window !== "undefined" ? window.location.pathname : "/";
    
    // Use BroadcastChannel for cross-tab communication
    if (typeof BroadcastChannel !== "undefined") {
      this.broadcastChannel = new BroadcastChannel("afterstill_presence");
      this.broadcastChannel.onmessage = () => {
        this.notifyUpdate();
      };
    }
  }

  /**
   * Start tracking presence
   */
  start(onUpdate?: (presences: Presence[]) => void): void {
    if (typeof window === "undefined") return;
    
    this.onUpdate = onUpdate || null;
    this.currentPage = window.location.pathname;
    
    // Add self to presences
    this.updatePresence();
    
    // Heartbeat every 10 seconds
    this.updateInterval = setInterval(() => {
      this.updatePresence();
    }, 10 * 1000);

    // Clean up on page unload
    window.addEventListener("beforeunload", this.handleUnload);
    window.addEventListener("visibilitychange", this.handleVisibility);
  }

  /**
   * Stop tracking
   */
  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    if (typeof window !== "undefined") {
      window.removeEventListener("beforeunload", this.handleUnload);
      window.removeEventListener("visibilitychange", this.handleVisibility);
    }
    
    // Remove self from presences
    this.removePresence();
    
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
  }

  /**
   * Update page location
   */
  setPage(page: string): void {
    this.currentPage = page;
    this.updatePresence();
  }

  /**
   * Get all active presences
   */
  getPresences(): Presence[] {
    return getStoredPresences();
  }

  /**
   * Get count of other active visitors
   */
  getOtherCount(): number {
    const presences = this.getPresences();
    return presences.filter(p => p.id !== this.sessionId).length;
  }

  /**
   * Get presences on current page
   */
  getPagePresences(): Presence[] {
    return this.getPresences().filter(
      p => p.page === this.currentPage && p.id !== this.sessionId
    );
  }

  private updatePresence(): void {
    const presences = getStoredPresences();
    const now = Date.now();
    
    // Find and update self, or add if not exists
    const existingIndex = presences.findIndex(p => p.id === this.sessionId);
    
    const selfPresence: Presence = {
      id: this.sessionId,
      page: this.currentPage,
      joinedAt: existingIndex >= 0 ? presences[existingIndex].joinedAt : now,
      lastSeen: now,
    };
    
    if (existingIndex >= 0) {
      presences[existingIndex] = selfPresence;
    } else {
      presences.push(selfPresence);
    }
    
    savePresences(presences);
    this.broadcast();
    this.notifyUpdate();
  }

  private removePresence(): void {
    const presences = getStoredPresences();
    const filtered = presences.filter(p => p.id !== this.sessionId);
    savePresences(filtered);
    this.broadcast();
  }

  private broadcast(): void {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({ type: "update" });
      } catch {
        // Channel closed
      }
    }
  }

  private notifyUpdate(): void {
    if (this.onUpdate) {
      this.onUpdate(this.getPresences());
    }
  }

  private handleUnload = (): void => {
    this.removePresence();
  };

  private handleVisibility = (): void => {
    if (document.visibilityState === "visible") {
      this.updatePresence();
    }
  };
}

// Singleton instance
let trackerInstance: PresenceTracker | null = null;

export function getPresenceTracker(): PresenceTracker {
  if (!trackerInstance) {
    trackerInstance = new PresenceTracker();
  }
  return trackerInstance;
}

/**
 * Generate poetic presence messages
 */
export function getPresenceMessage(count: number): string {
  if (count === 0) return "";
  if (count === 1) return "One other soul is here with you.";
  if (count === 2) return "Two others share this moment.";
  if (count <= 5) return `${count} quiet presences nearby.`;
  if (count <= 10) return `${count} souls in the stillness.`;
  if (count <= 25) return `${count} wanderers gathered.`;
  if (count <= 50) return `${count} hearts beating in unison.`;
  return `${count} souls — a constellation forming.`;
}
