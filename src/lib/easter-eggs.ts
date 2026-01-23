/**
 * Easter Eggs - Hidden delights throughout the sanctuary
 * 
 * Secret interactions that reward curious visitors:
 * - Konami Code: Unlocks special visual mode
 * - Triple-click logo: Reveals hidden message
 * - Scroll to the void: Discover content at the end
 * - Moon phases: UI subtly changes with real moon
 * - Secret word typing: Triggers animations
 */

type EasterEgg = {
  id: string;
  name: string;
  triggered: boolean;
  discoveredAt?: Date;
};

interface EasterEggState {
  discovered: EasterEgg[];
  konamiProgress: number;
  secretWord: string;
  lastKeyTime: number;
}

const KONAMI_CODE = [
  "ArrowUp", "ArrowUp",
  "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight",
  "ArrowLeft", "ArrowRight",
  "b", "a",
];

const SECRET_WORDS = [
  "stillness",
  "breathe",
  "wonder",
  "silence",
  "aurora",
];

const STORAGE_KEY = "afterstill-easter-eggs";

/**
 * Load discovered easter eggs
 */
export function loadDiscoveredEggs(): EasterEgg[] {
  if (typeof window === "undefined") return [];
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch {
    // Ignore
  }
  return [];
}

/**
 * Save discovered easter egg
 */
export function saveDiscoveredEgg(egg: EasterEgg): void {
  if (typeof window === "undefined") return;
  
  const eggs = loadDiscoveredEggs();
  const exists = eggs.find(e => e.id === egg.id);
  
  if (!exists) {
    eggs.push({
      ...egg,
      triggered: true,
      discoveredAt: new Date(),
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(eggs));
  }
}

/**
 * Check if an easter egg has been discovered
 */
export function hasDiscovered(eggId: string): boolean {
  const eggs = loadDiscoveredEggs();
  return eggs.some(e => e.id === eggId && e.triggered);
}

/**
 * Create easter egg tracker
 */
export function createEasterEggTracker() {
  const state: EasterEggState = {
    discovered: loadDiscoveredEggs(),
    konamiProgress: 0,
    secretWord: "",
    lastKeyTime: 0,
  };
  
  const listeners: Map<string, (() => void)[]> = new Map();
  
  function emit(eggId: string) {
    const callbacks = listeners.get(eggId) || [];
    callbacks.forEach(cb => cb());
    
    saveDiscoveredEgg({
      id: eggId,
      name: eggId,
      triggered: true,
      discoveredAt: new Date(),
    });
  }
  
  function on(eggId: string, callback: () => void) {
    const callbacks = listeners.get(eggId) || [];
    callbacks.push(callback);
    listeners.set(eggId, callbacks);
    
    return () => {
      const cbs = listeners.get(eggId) || [];
      const idx = cbs.indexOf(callback);
      if (idx > -1) cbs.splice(idx, 1);
    };
  }
  
  function handleKeyPress(key: string) {
    const now = Date.now();
    
    // Reset if too slow (> 2 seconds)
    if (now - state.lastKeyTime > 2000) {
      state.konamiProgress = 0;
      state.secretWord = "";
    }
    state.lastKeyTime = now;
    
    // Check Konami code
    if (key === KONAMI_CODE[state.konamiProgress]) {
      state.konamiProgress++;
      if (state.konamiProgress === KONAMI_CODE.length) {
        emit("konami");
        state.konamiProgress = 0;
      }
    } else {
      state.konamiProgress = 0;
    }
    
    // Check secret words (only letters)
    if (/^[a-z]$/i.test(key)) {
      state.secretWord += key.toLowerCase();
      
      // Keep only last 10 chars
      if (state.secretWord.length > 10) {
        state.secretWord = state.secretWord.slice(-10);
      }
      
      for (const word of SECRET_WORDS) {
        if (state.secretWord.endsWith(word)) {
          emit(`word:${word}`);
          state.secretWord = "";
          break;
        }
      }
    }
  }
  
  return {
    handleKeyPress,
    on,
    hasDiscovered: (id: string) => state.discovered.some(e => e.id === id),
    getDiscoveredCount: () => state.discovered.length,
    getTotalCount: () => SECRET_WORDS.length + 1, // +1 for Konami
  };
}

/**
 * Moon phase calculation (simplified)
 */
export function getMoonPhase(): {
  phase: "new" | "waxing-crescent" | "first-quarter" | "waxing-gibbous" | 
         "full" | "waning-gibbous" | "last-quarter" | "waning-crescent";
  emoji: string;
  illumination: number;
} {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  
  // Simple moon phase calculation
  const c = Math.floor(365.25 * year);
  const e = Math.floor(30.6 * month);
  const jd = c + e + day - 694039.09; // Julian day
  const daysSinceNew = jd / 29.5305882;
  const moonAge = (daysSinceNew - Math.floor(daysSinceNew)) * 29.5305882;
  
  const illumination = Math.round((1 - Math.cos((moonAge / 29.5305882) * 2 * Math.PI)) / 2 * 100);
  
  if (moonAge < 1.84566) {
    return { phase: "new", emoji: "🌑", illumination };
  } else if (moonAge < 5.53699) {
    return { phase: "waxing-crescent", emoji: "🌒", illumination };
  } else if (moonAge < 9.22831) {
    return { phase: "first-quarter", emoji: "🌓", illumination };
  } else if (moonAge < 12.91963) {
    return { phase: "waxing-gibbous", emoji: "🌔", illumination };
  } else if (moonAge < 16.61096) {
    return { phase: "full", emoji: "🌕", illumination };
  } else if (moonAge < 20.30228) {
    return { phase: "waning-gibbous", emoji: "🌖", illumination };
  } else if (moonAge < 23.99361) {
    return { phase: "last-quarter", emoji: "🌗", illumination };
  } else if (moonAge < 27.68493) {
    return { phase: "waning-crescent", emoji: "🌘", illumination };
  }
  return { phase: "new", emoji: "🌑", illumination };
}

/**
 * Void scroll detection - trigger when user scrolls past content
 */
export function isInTheVoid(scrollY: number, documentHeight: number, windowHeight: number): boolean {
  const bottomThreshold = documentHeight - windowHeight - 50;
  return scrollY >= bottomThreshold;
}

/**
 * Logo click tracker - for triple-click easter egg
 */
export function createClickTracker(threshold: number = 3, timeWindow: number = 500) {
  let clicks = 0;
  let lastClick = 0;
  let callback: (() => void) | null = null;
  
  return {
    track() {
      const now = Date.now();
      if (now - lastClick < timeWindow) {
        clicks++;
        if (clicks >= threshold && callback) {
          callback();
          clicks = 0;
        }
      } else {
        clicks = 1;
      }
      lastClick = now;
    },
    onTrigger(cb: () => void) {
      callback = cb;
    },
  };
}

/**
 * Get poetic message for easter egg discovery
 */
export function getEasterEggMessage(eggId: string): string {
  const messages: Record<string, string> = {
    "konami": "The ancient code awakens something deep within...",
    "word:stillness": "You've found the heart of this sanctuary.",
    "word:breathe": "The air itself seems to respond.",
    "word:wonder": "Wonder unlocked. The ordinary becomes extraordinary.",
    "word:silence": "In silence, everything speaks.",
    "word:aurora": "Colors dance at the edge of perception.",
    "void": "You've reached the edge of everything. And nothing.",
    "triple-click": "Behind every surface lies another world.",
  };
  
  return messages[eggId] || "You've discovered something hidden.";
}
