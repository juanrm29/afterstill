"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  type ConduitCommand,
  type ConduitResponse,
  type DeviceInfo,
  type WritingPreview,
  GESTURE_CONFIG,
  detectSwipe,
  detectShake,
  detectShape,
} from "@/lib/conduit-protocol";

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";
type WandMode = "gesture" | "reading" | "oracle" | "drawing" | "whisper";

interface WandState {
  mode: WandMode;
  isConnected: boolean;
  currentWriting: WritingPreview | null;
  readingProgress: number;
  lastGesture: string | null;
  oracleMessage: string | null;
  voidResponse: { message: string; quote?: string } | null;
}

/**
 * ConduitWand - Mobile controller for desktop experience
 */
export function ConduitWand({ roomCode }: { roomCode: string }) {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [state, setState] = useState<WandState>({
    mode: "gesture",
    isConnected: false,
    currentWriting: null,
    readingProgress: 0,
    lastGesture: null,
    oracleMessage: null,
    voidResponse: null,
  });
  const [needsPermission, setNeedsPermission] = useState(false);
  const [whisperText, setWhisperText] = useState("");
  
  const peerRef = useRef<any>(null);
  const connRef = useRef<any>(null);
  
  // Touch tracking
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const drawPointsRef = useRef<{ x: number; y: number }[]>([]);
  const isDrawingRef = useRef(false);
  
  // Accelerometer tracking
  const lastAccelRef = useRef({ x: 0, y: 0, z: 0 });
  const lastShakeTimeRef = useRef(0);
  
  // Send command to desktop
  const sendCommand = useCallback((command: ConduitCommand) => {
    if (connRef.current && status === "connected") {
      connRef.current.send(command);
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(20);
      }
    }
  }, [status]);
  
  // Handle response from desktop
  const handleResponse = useCallback((response: ConduitResponse) => {
    switch (response.type) {
      case "connected":
        setState(prev => ({ ...prev, isConnected: true }));
        break;
        
      case "state:writing":
        setState(prev => ({ ...prev, currentWriting: response.writing }));
        break;
        
      case "state:reading":
        setState(prev => ({
          ...prev,
          readingProgress: response.progress,
          mode: "reading",
        }));
        break;
        
      case "oracle:result":
        setState(prev => ({ 
          ...prev, 
          currentWriting: response.writing ?? null,
          oracleMessage: response.message ?? null,
        }));
        break;
        
      case "oracle:response":
        setState(prev => ({
          ...prev,
          voidResponse: { message: response.message ?? "", quote: response.quote },
          mode: "whisper" as WandMode,
        }));
        break;
        
      case "feedback:vibrate":
        if (navigator.vibrate) {
          navigator.vibrate(response.pattern);
        }
        break;
    }
  }, []);
  
  // Initialize PeerJS connection
  useEffect(() => {
    if (!roomCode) return;
    
    let mounted = true;
    
    const initPeer = async () => {
      try {
        const Peer = (await import("peerjs")).default;
        
        const peerId = `wand-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const peer = new Peer(peerId, { 
          debug: 0,
          config: {
            iceServers: [
              { urls: "stun:stun.l.google.com:19302" },
              { urls: "stun:stun1.l.google.com:19302" },
            ],
          },
        });
        peerRef.current = peer;
        
        peer.on("open", () => {
          if (!mounted) return;
          
          const conn = peer.connect(`altar-${roomCode}`, { reliable: true });
          connRef.current = conn;
          
          conn.on("open", () => {
            if (!mounted) return;
            setStatus("connected");
            
            // Send handshake
            const deviceInfo: DeviceInfo = {
              type: window.innerWidth < 768 ? "mobile" : "tablet",
              hasGyroscope: "DeviceOrientationEvent" in window,
              hasAccelerometer: "DeviceMotionEvent" in window,
              hasVibration: "vibrate" in navigator,
              screenWidth: window.innerWidth,
              screenHeight: window.innerHeight,
            };
            
            conn.send({ type: "handshake", deviceInfo });
          });
          
          conn.on("data", (data: unknown) => {
            handleResponse(data as ConduitResponse);
          });
          
          conn.on("close", () => {
            if (!mounted) return;
            setStatus("disconnected");
          });
          
          conn.on("error", () => {
            if (!mounted) return;
            setStatus("error");
          });
        });
        
        peer.on("error", (err) => {
          console.error("Peer error:", err);
          if (!mounted) return;
          setStatus("error");
        });
        
      } catch (err) {
        console.error("PeerJS error:", err);
        if (!mounted) return;
        setStatus("error");
      }
    };
    
    initPeer();
    
    return () => {
      mounted = false;
      if (connRef.current) connRef.current.close();
      if (peerRef.current) peerRef.current.destroy();
    };
  }, [roomCode, handleResponse]);
  
  // Check iOS permission
  useEffect(() => {
    if (typeof window !== "undefined") {
      const DeviceMotion = DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> };
      if (typeof DeviceMotion.requestPermission === "function") {
        setNeedsPermission(true);
      }
    }
  }, []);
  
  // Request sensor permission (iOS)
  const requestPermission = async () => {
    try {
      const DeviceMotion = DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> };
      const DeviceOrientation = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
      
      if (typeof DeviceMotion.requestPermission === "function") {
        await DeviceMotion.requestPermission();
      }
      if (typeof DeviceOrientation.requestPermission === "function") {
        await DeviceOrientation.requestPermission();
      }
      setNeedsPermission(false);
    } catch {
      console.error("Permission denied");
    }
  };
  
  // Accelerometer & Gyroscope handlers
  useEffect(() => {
    if (needsPermission || status !== "connected") return;
    
    // Shake detection
    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc || acc.x === null || acc.y === null || acc.z === null) return;
      
      const current = { x: acc.x, y: acc.y, z: acc.z };
      const { isShake, intensity } = detectShake(current, lastAccelRef.current);
      
      if (isShake) {
        const now = Date.now();
        if (now - lastShakeTimeRef.current > GESTURE_CONFIG.shake.cooldown) {
          lastShakeTimeRef.current = now;
          setState(prev => ({ ...prev, lastGesture: "shake" }));
          sendCommand({ type: "gesture:shake", intensity });
          
          // Strong vibration
          if (navigator.vibrate) {
            navigator.vibrate([50, 50, 50]);
          }
        }
      }
      
      lastAccelRef.current = current;
    };
    
    // Tilt detection
    const handleOrientation = (event: DeviceOrientationEvent) => {
      const { gamma, beta } = event;
      if (gamma === null || beta === null) return;
      
      // Only send significant tilts
      if (Math.abs(gamma) > 10 || Math.abs(beta - 45) > 20) {
        sendCommand({
          type: "gesture:tilt",
          x: gamma * GESTURE_CONFIG.tilt.sensitivity,
          y: (beta - 45) * GESTURE_CONFIG.tilt.sensitivity,
        });
      }
    };
    
    window.addEventListener("devicemotion", handleMotion);
    window.addEventListener("deviceorientation", handleOrientation);
    
    return () => {
      window.removeEventListener("devicemotion", handleMotion);
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, [needsPermission, status, sendCommand]);
  
  // Touch gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    
    if (state.mode === "drawing") {
      isDrawingRef.current = true;
      drawPointsRef.current = [{ x: touch.clientX, y: touch.clientY }];
    }
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (state.mode === "drawing" && isDrawingRef.current) {
      const touch = e.touches[0];
      drawPointsRef.current.push({ x: touch.clientX, y: touch.clientY });
    }
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartRef.current;
    if (!start) return;
    
    const touch = e.changedTouches[0];
    const duration = Date.now() - start.time;
    
    // Drawing mode
    if (state.mode === "drawing" && isDrawingRef.current) {
      isDrawingRef.current = false;
      const shape = detectShape(drawPointsRef.current);
      if (shape) {
        setState(prev => ({ ...prev, lastGesture: `draw:${shape}` }));
        sendCommand({ type: "gesture:draw", shape });
      }
      drawPointsRef.current = [];
      return;
    }
    
    // Swipe detection
    const swipe = detectSwipe(start.x, start.y, touch.clientX, touch.clientY, duration);
    if (swipe) {
      setState(prev => ({ ...prev, lastGesture: `swipe:${swipe.direction}` }));
      sendCommand({ type: "gesture:swipe", ...swipe });
      return;
    }
    
    // Tap detection
    if (duration < GESTURE_CONFIG.tap.maxDuration) {
      setState(prev => ({ ...prev, lastGesture: "tap" }));
      sendCommand({ type: "gesture:tap", count: 1 });
    }
    
    touchStartRef.current = null;
  };
  
  // Mode actions
  const triggerOracle = () => {
    setState(prev => ({ ...prev, mode: "oracle", lastGesture: "oracle" }));
    
    // Get location if available
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          sendCommand({
            type: "oracle:divine",
            location: { lat: pos.coords.latitude, lon: pos.coords.longitude },
          });
        },
        () => {
          sendCommand({ type: "oracle:divine" });
        }
      );
    } else {
      sendCommand({ type: "oracle:divine" });
    }
  };
  
  const triggerRandom = () => {
    setState(prev => ({ ...prev, lastGesture: "random" }));
    sendCommand({ type: "navigate:random" });
  };
  
  const sendWhisper = () => {
    if (!whisperText.trim()) return;
    sendCommand({ type: "oracle:whisper", message: whisperText });
    setWhisperText("");
    setState(prev => ({ ...prev, mode: "oracle", lastGesture: "whisper" }));
  };
  
  // Render
  return (
    <div 
      className="min-h-screen bg-[#030304] text-white flex flex-col select-none touch-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Status bar */}
      <header className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{
                scale: status === "connected" ? [1, 1.2, 1] : 1,
                backgroundColor: status === "connected" ? "#22c55e" : 
                  status === "connecting" ? "#eab308" : "#ef4444",
              }}
              transition={{ repeat: status === "connecting" ? Infinity : 0, duration: 1 }}
              className="w-2 h-2 rounded-full"
            />
            <span className="text-[10px] font-mono tracking-wider text-white/50 uppercase">
              {status}
            </span>
          </div>
          <span className="text-[9px] font-mono text-white/30">{roomCode}</span>
        </div>
      </header>
      
      {/* Main gesture area */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative">
        {/* Permission request */}
        {needsPermission && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={requestPermission}
            className="absolute top-4 left-4 right-4 py-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-200 text-sm"
          >
            Enable motion sensors
          </motion.button>
        )}
        
        {/* Current writing */}
        <AnimatePresence mode="wait">
          {state.currentWriting && (
            <motion.div
              key={state.currentWriting.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 text-center"
            >
              <p className="text-[10px] font-mono text-white/30 mb-2">CURRENT</p>
              <h2 className="text-lg" style={{ fontFamily: "var(--font-cormorant), serif" }}>
                {state.currentWriting.title}
              </h2>
              
              {/* Reading progress */}
              {state.mode === "reading" && (
                <div className="mt-4 w-full max-w-[200px] mx-auto">
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-white/50"
                      animate={{ width: `${state.readingProgress}%` }}
                    />
                  </div>
                  <p className="text-[10px] font-mono text-white/30 mt-1">
                    {Math.round(state.readingProgress)}%
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Gesture feedback */}
        <motion.div
          className="w-48 h-48 rounded-full border border-white/20 flex items-center justify-center mb-8"
          animate={{
            borderColor: state.lastGesture ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)",
            scale: state.lastGesture ? [1, 1.1, 1] : 1,
          }}
          transition={{ duration: 0.3 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={state.lastGesture || "idle"}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-white/60"
            >
              {state.lastGesture === "shake" && (
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 4l4 4M20 4l-4 4M4 20l4-4M20 20l-4-4" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
              {state.lastGesture?.startsWith("swipe") && (
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              )}
              {state.lastGesture === "tap" && (
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="3" />
                  <circle cx="12" cy="12" r="8" strokeDasharray="4 4" />
                </svg>
              )}
              {state.lastGesture === "oracle" && (
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
                </svg>
              )}
              {state.lastGesture === "random" && (
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8" cy="8" r="1.5" fill="currentColor" />
                  <circle cx="16" cy="16" r="1.5" fill="currentColor" />
                  <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                </svg>
              )}
              {state.lastGesture === "whisper" && (
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
              )}
              {!state.lastGesture && (
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M18 11V6a6 6 0 00-12 0v5" />
                  <path d="M12 11v6" />
                  <circle cx="12" cy="19" r="2" />
                  <path d="M8 11h8" />
                </svg>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
        
        {/* Instructions */}
        <div className="space-y-2 text-center text-[10px] font-mono text-white/30">
          <p>Tilt to browse · Shake for random</p>
          <p>Swipe to scroll · Tap to select</p>
        </div>
        
        {/* Oracle Message */}
        <AnimatePresence>
          {state.oracleMessage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-6 px-4 py-3 rounded-lg border border-amber-500/20 bg-amber-500/5 max-w-xs text-center"
            >
              <p className="text-sm text-amber-200/80" style={{ fontFamily: "var(--font-cormorant), serif" }}>
                {state.oracleMessage}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Void Response */}
        <AnimatePresence>
          {state.voidResponse && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="mt-6 px-4 py-4 rounded-xl border border-purple-500/20 bg-purple-500/5 max-w-xs"
            >
              <p className="text-[10px] font-mono text-purple-300/50 mb-2 text-center">THE VOID RESPONDS</p>
              <p className="text-sm text-purple-100/90 text-center" style={{ fontFamily: "var(--font-cormorant), serif" }}>
                {state.voidResponse.message}
              </p>
              {state.voidResponse.quote && (
                <p className="text-[10px] text-purple-300/50 mt-3 text-center italic">
                  "{state.voidResponse.quote}"
                </p>
              )}
              <button
                onClick={() => setState(prev => ({ ...prev, voidResponse: null, mode: "gesture" }))}
                className="w-full mt-3 py-2 rounded-lg border border-white/10 text-white/50 text-xs"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Whisper Input Mode */}
        {state.mode === "whisper" && !state.voidResponse && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 w-full max-w-xs"
          >
            <p className="text-[10px] font-mono text-white/30 mb-2 text-center">WHISPER TO THE VOID</p>
            <input
              type="text"
              value={whisperText}
              onChange={(e) => setWhisperText(e.target.value)}
              placeholder="Your question..."
              className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/40"
              onKeyDown={(e) => e.key === "Enter" && sendWhisper()}
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setState(prev => ({ ...prev, mode: "gesture" }))}
                className="flex-1 py-2 rounded-lg border border-white/10 text-white/50 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={sendWhisper}
                className="flex-1 py-2 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-200 text-xs"
              >
                Send
              </button>
            </div>
          </motion.div>
        )}
      </main>
      
      {/* Action buttons */}
      <footer className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={triggerOracle}
            className="flex-1 py-3 rounded-lg border border-white/20 bg-white/5 text-white/70 text-sm flex items-center justify-center"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
            </svg>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={triggerRandom}
            className="flex-1 py-3 rounded-lg border border-white/20 bg-white/5 text-white/70 text-sm flex items-center justify-center"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8" cy="8" r="1.5" fill="currentColor" />
              <circle cx="16" cy="8" r="1.5" fill="currentColor" />
              <circle cx="8" cy="16" r="1.5" fill="currentColor" />
              <circle cx="16" cy="16" r="1.5" fill="currentColor" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            </svg>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setState(prev => ({ 
              ...prev, 
              mode: prev.mode === "whisper" ? "gesture" : "whisper",
              voidResponse: null,
            }))}
            className={`flex-1 py-3 rounded-lg border text-sm flex items-center justify-center ${
              state.mode === "whisper" 
                ? "border-purple-500/50 bg-purple-500/20 text-purple-200"
                : "border-white/20 bg-white/5 text-white/70"
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setState(prev => ({ 
              ...prev, 
              mode: prev.mode === "drawing" ? "gesture" : "drawing" 
            }))}
            className={`flex-1 py-3 rounded-lg border text-sm flex items-center justify-center ${
              state.mode === "drawing" 
                ? "border-cyan-500/50 bg-cyan-500/20 text-cyan-200"
                : "border-white/20 bg-white/5 text-white/70"
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 19l7-7 3 3-7 7-3-3z" />
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
              <path d="M2 2l7.586 7.586" />
              <circle cx="11" cy="11" r="2" />
            </svg>
          </motion.button>
        </div>
        
        {/* Mode labels */}
        <div className="flex gap-2 mt-2">
          <span className="flex-1 text-center text-[8px] font-mono text-white/30">Oracle</span>
          <span className="flex-1 text-center text-[8px] font-mono text-white/30">Random</span>
          <span className="flex-1 text-center text-[8px] font-mono text-white/30">Whisper</span>
          <span className="flex-1 text-center text-[8px] font-mono text-white/30">Draw</span>
        </div>
      </footer>
    </div>
  );
}
