/**
 * Conduit Protocol - Real-time sync between Mobile (Wand) and Desktop (Altar)
 * 
 * Commands that can be sent from mobile to desktop:
 */

export type ConduitCommand = 
  // Connection
  | { type: "handshake"; deviceInfo: DeviceInfo }
  | { type: "heartbeat" }
  
  // Gesture Casting
  | { type: "gesture:swipe"; direction: "up" | "down" | "left" | "right"; intensity: number }
  | { type: "gesture:shake"; intensity: number }
  | { type: "gesture:tilt"; x: number; y: number }
  | { type: "gesture:tap"; count: number }
  | { type: "gesture:hold"; duration: number }
  | { type: "gesture:draw"; shape: "circle" | "spiral" | "line" | "heart" | "infinity" | "triangle" }
  
  // Atmosphere Control
  | { type: "atmosphere:brightness"; level: number }  // 0-100
  | { type: "atmosphere:particles"; intensity: number }
  | { type: "atmosphere:darkness"; active: boolean }
  | { type: "atmosphere:meditation"; active: boolean }
  
  // Navigation
  | { type: "navigate:writing"; writingId: string }
  | { type: "navigate:random" }
  | { type: "navigate:home" }
  | { type: "navigate:oracle" }
  | { type: "navigate:path"; path: string }
  
  // Sync Reading
  | { type: "reading:start"; writingId: string }
  | { type: "reading:scroll"; progress?: number; delta?: number }  // 0-100 or delta
  | { type: "reading:pause" }
  | { type: "reading:resume" }
  | { type: "reading:highlight"; position: number }
  
  // Atmosphere Control (additional)
  | { type: "atmosphere:sound"; level: number }  // 0-1
  | { type: "atmosphere:dim" }
  | { type: "atmosphere:brighten" }
  
  // Oracle Integration
  | { type: "oracle:divine"; location?: { lat: number; lon: number } }
  | { type: "oracle:whisper"; message: string }
  | { type: "oracle:respond"; writingId: string }
  
  // Voice Bridge
  | { type: "voice:start" }
  | { type: "voice:data"; audioData: string }  // base64
  | { type: "voice:end" }
  | { type: "voice:command"; text: string };

export type ConduitResponse =
  // Connection
  | { type: "connected"; altarInfo?: AltarInfo; roomCode?: string }
  | { type: "heartbeat:ack" }
  
  // State Updates
  | { type: "state:update"; state: AltarState }
  | { type: "state:writing"; writing: WritingPreview }
  | { type: "state:reading"; progress: number; currentSection?: string }
  
  // Oracle Responses
  | { type: "oracle:result"; message?: string; writing?: WritingPreview }
  | { type: "oracle:response"; message?: string; quote?: string }
  | { type: "oracle:void"; response: string; quote?: string }
  
  // Feedback
  | { type: "feedback:vibrate"; pattern: number[] }
  | { type: "feedback:success" }
  | { type: "feedback:error"; message: string };

export interface DeviceInfo {
  type: "mobile" | "tablet";
  hasGyroscope: boolean;
  hasAccelerometer: boolean;
  hasVibration: boolean;
  screenWidth: number;
  screenHeight: number;
}

export interface AltarInfo {
  roomCode: string;
  currentPath: string;
  currentWriting?: WritingPreview;
  temporalPhase: string;
  moonEmoji: string;
}

export interface AltarState {
  path: string;
  writing?: WritingPreview;
  isReading: boolean;
  readingProgress: number;
  atmosphereBrightness: number;
  particleIntensity: number;
  isMeditationMode: boolean;
}

export interface WritingPreview {
  id: string;
  slug?: string;
  title: string;
  excerpt?: string;
}

/**
 * Gesture detection thresholds
 */
export const GESTURE_CONFIG = {
  shake: {
    threshold: 15,
    cooldown: 1000,
  },
  tilt: {
    threshold: 25,
    sensitivity: 0.3,
  },
  swipe: {
    minDistance: 50,
    maxTime: 300,
  },
  tap: {
    maxDuration: 200,
    doubleInterval: 300,
    tripleInterval: 500,
  },
  hold: {
    minDuration: 800,
  },
};

/**
 * Detect swipe direction from touch events
 */
export function detectSwipe(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  duration: number
): { direction: "up" | "down" | "left" | "right"; intensity: number } | null {
  if (duration > GESTURE_CONFIG.swipe.maxTime) return null;
  
  const deltaX = endX - startX;
  const deltaY = endY - startY;
  const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
  
  if (distance < GESTURE_CONFIG.swipe.minDistance) return null;
  
  const intensity = Math.min(1, distance / 200);
  
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    return {
      direction: deltaX > 0 ? "right" : "left",
      intensity,
    };
  } else {
    return {
      direction: deltaY > 0 ? "down" : "up",
      intensity,
    };
  }
}

/**
 * Detect shake from accelerometer
 */
export function detectShake(
  current: { x: number; y: number; z: number },
  previous: { x: number; y: number; z: number }
): { isShake: boolean; intensity: number } {
  const deltaX = Math.abs(current.x - previous.x);
  const deltaY = Math.abs(current.y - previous.y);
  const deltaZ = Math.abs(current.z - previous.z);
  
  const maxDelta = Math.max(deltaX, deltaY, deltaZ);
  const isShake = maxDelta > GESTURE_CONFIG.shake.threshold;
  const intensity = Math.min(1, maxDelta / 30);
  
  return { isShake, intensity };
}

/**
 * Simple shape detection from drawn points
 */
export function detectShape(
  points: { x: number; y: number }[]
): "circle" | "spiral" | "line" | "heart" | "infinity" | null {
  if (points.length < 10) return null;
  
  const first = points[0];
  const last = points[points.length - 1];
  const distance = Math.sqrt((last.x - first.x) ** 2 + (last.y - first.y) ** 2);
  
  // Calculate bounding box
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  
  for (const p of points) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  
  const width = maxX - minX;
  const height = maxY - minY;
  const aspectRatio = width / height;
  
  // Circle: closed loop, roughly square aspect ratio
  if (distance < 50 && aspectRatio > 0.7 && aspectRatio < 1.3) {
    return "circle";
  }
  
  // Line: very different aspect ratio
  if (aspectRatio > 3 || aspectRatio < 0.33) {
    return "line";
  }
  
  // Infinity: crosses itself, wide
  if (aspectRatio > 1.5 && distance < width * 0.3) {
    return "infinity";
  }
  
  return null;
}
