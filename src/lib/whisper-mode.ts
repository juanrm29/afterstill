/**
 * Whisper Mode - Progressive text revelation
 * 
 * Text is revealed based on phone proximity/movement:
 * - Closer = more revealed
 * - Movement = words appear
 * 
 * Uses accelerometer Z-axis to simulate "bringing closer"
 */

export interface WhisperState {
  revealProgress: number;  // 0-100
  lastAcceleration: number;
  isWhispering: boolean;
  revealedWords: number;
  totalWords: number;
}

export interface WhisperConfig {
  sensitivityThreshold: number;  // How sensitive to movement
  revealSpeed: number;           // Words per movement
  decayRate: number;             // How fast reveal fades if no movement
}

const DEFAULT_CONFIG: WhisperConfig = {
  sensitivityThreshold: 2,
  revealSpeed: 3,
  decayRate: 0.5,
};

/**
 * Create whisper mode controller
 */
export function createWhisperController(config: Partial<WhisperConfig> = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  let state: WhisperState = {
    revealProgress: 0,
    lastAcceleration: 0,
    isWhispering: false,
    revealedWords: 0,
    totalWords: 0,
  };
  
  let listeners: ((state: WhisperState) => void)[] = [];
  let decayInterval: NodeJS.Timeout | null = null;
  
  function emit() {
    listeners.forEach(cb => cb({ ...state }));
  }
  
  function startDecay() {
    if (decayInterval) return;
    
    decayInterval = setInterval(() => {
      if (state.revealProgress > 0 && !state.isWhispering) {
        state.revealProgress = Math.max(0, state.revealProgress - cfg.decayRate);
        state.revealedWords = Math.floor((state.revealProgress / 100) * state.totalWords);
        emit();
      }
    }, 100);
  }
  
  function stopDecay() {
    if (decayInterval) {
      clearInterval(decayInterval);
      decayInterval = null;
    }
  }
  
  return {
    init(totalWords: number) {
      state.totalWords = totalWords;
      state.revealedWords = 0;
      state.revealProgress = 0;
      emit();
    },
    
    /**
     * Process accelerometer data
     * Z-axis indicates device tilt toward face
     */
    processMotion(acceleration: { x: number; y: number; z: number }) {
      const { z } = acceleration;
      
      // Calculate movement delta
      const delta = Math.abs(z - state.lastAcceleration);
      state.lastAcceleration = z;
      
      // Check if significant movement
      if (delta > cfg.sensitivityThreshold) {
        state.isWhispering = true;
        
        // Reveal more words based on Z position
        // More negative Z = phone facing up/toward face
        const proximityBonus = z < -5 ? 2 : z < 0 ? 1 : 0;
        const wordsToReveal = cfg.revealSpeed + proximityBonus;
        
        state.revealProgress = Math.min(100, state.revealProgress + (wordsToReveal / state.totalWords) * 100);
        state.revealedWords = Math.floor((state.revealProgress / 100) * state.totalWords);
        
        emit();
        
        // Reset whispering flag after delay
        setTimeout(() => {
          state.isWhispering = false;
        }, 300);
      }
    },
    
    /**
     * Manual reveal (for testing or fallback)
     */
    manualReveal(percentage: number) {
      state.revealProgress = Math.min(100, Math.max(0, percentage));
      state.revealedWords = Math.floor((state.revealProgress / 100) * state.totalWords);
      emit();
    },
    
    /**
     * Full reveal
     */
    revealAll() {
      state.revealProgress = 100;
      state.revealedWords = state.totalWords;
      emit();
    },
    
    /**
     * Reset to hidden
     */
    reset() {
      state.revealProgress = 0;
      state.revealedWords = 0;
      state.isWhispering = false;
      emit();
    },
    
    /**
     * Subscribe to state changes
     */
    subscribe(callback: (state: WhisperState) => void) {
      listeners.push(callback);
      startDecay();
      
      return () => {
        listeners = listeners.filter(cb => cb !== callback);
        if (listeners.length === 0) {
          stopDecay();
        }
      };
    },
    
    getState() {
      return { ...state };
    },
  };
}

/**
 * Split text into words with positions
 */
export function tokenizeForWhisper(text: string): {
  words: { text: string; index: number }[];
  total: number;
} {
  const words = text
    .split(/(\s+)/)
    .filter(Boolean)
    .map((text, index) => ({ text, index }));
  
  return {
    words,
    total: words.filter(w => w.text.trim()).length,
  };
}

/**
 * Generate reveal mask based on progress
 */
export function generateRevealMask(
  totalWords: number,
  revealedCount: number,
  pattern: "linear" | "random" | "center" = "linear"
): boolean[] {
  const mask = new Array(totalWords).fill(false);
  
  if (pattern === "linear") {
    // Reveal from start
    for (let i = 0; i < revealedCount; i++) {
      mask[i] = true;
    }
  } else if (pattern === "random") {
    // Random reveal (seeded for consistency)
    const indices = Array.from({ length: totalWords }, (_, i) => i);
    // Simple shuffle with seed
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor((Math.sin(i * 9999) * 10000) % (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    for (let i = 0; i < revealedCount; i++) {
      mask[indices[i]] = true;
    }
  } else if (pattern === "center") {
    // Reveal from center outward
    const center = Math.floor(totalWords / 2);
    for (let i = 0; i < revealedCount; i++) {
      const offset = Math.floor(i / 2);
      const index = i % 2 === 0 ? center + offset : center - offset - 1;
      if (index >= 0 && index < totalWords) {
        mask[index] = true;
      }
    }
  }
  
  return mask;
}
