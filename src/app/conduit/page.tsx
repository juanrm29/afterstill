"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

interface WritingCard {
  id: string;
  title: string;
  date: string;
}

// Loading fallback
function ConduitLoading() {
  return (
    <div className="min-h-screen bg-[#030304] text-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border border-white/20 rounded-full flex items-center justify-center mb-4 mx-auto">
          <div className="w-8 h-8 border-t border-white/40 rounded-full animate-spin" />
        </div>
        <p className="text-sm text-white/50" style={{ fontFamily: "serif" }}>
          Initializing conduit...
        </p>
      </div>
    </div>
  );
}

// Main conduit component
function ConduitContent() {
  const searchParams = useSearchParams();
  const roomCode = searchParams.get("room");
  
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [statusMessage, setStatusMessage] = useState("Establishing connection...");
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [cards, setCards] = useState<WritingCard[]>([]);
  const [isShaking, setIsShaking] = useState(false);
  const [tiltX, setTiltX] = useState(0);
  const [lastShakeTime, setLastShakeTime] = useState(0);
  const [needsPermission, setNeedsPermission] = useState(false);
  
  const peerRef = useRef<any>(null);
  const connRef = useRef<any>(null);
  const lastTiltChangeRef = useRef(0);

  // Fetch writings from database
  useEffect(() => {
    fetch("/api/writings")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCards(data.map((w: WritingCard) => ({ id: w.id, title: w.title, date: w.date })));
        }
      })
      .catch(console.error);
  }, []);

  // Initialize PeerJS connection
  useEffect(() => {
    if (!roomCode) {
      setStatus("error");
      setStatusMessage("No room code provided");
      return;
    }

    let mounted = true;
    let connectionTimeout: NodeJS.Timeout;

    const initPeer = async () => {
      try {
        const Peer = (await import("peerjs")).default;
        
        // Create peer with unique ID
        const peerId = `conduit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const peer = new Peer(peerId, {
          debug: 0,
        });
        peerRef.current = peer;

        peer.on("open", () => {
          if (!mounted) return;
          setStatusMessage("Connecting to altar...");
          
          // Set connection timeout
          connectionTimeout = setTimeout(() => {
            if (mounted && status === "connecting") {
              setStatus("error");
              setStatusMessage("Connection timeout - altar not found");
            }
          }, 10000);
          
          // Connect to the altar (desktop)
          const conn = peer.connect(`altar-${roomCode}`, {
            reliable: true,
          });
          connRef.current = conn;

          conn.on("open", () => {
            clearTimeout(connectionTimeout);
            if (!mounted) return;
            setStatus("connected");
            setStatusMessage("You are now the observer");
            
            // Send initial handshake
            conn.send({ type: "conduit-connected" });
          });

          conn.on("data", (data: any) => {
            console.log("Received from altar:", data);
            // Handle responses from desktop
          });

          conn.on("close", () => {
            if (!mounted) return;
            setStatus("disconnected");
            setStatusMessage("Connection severed");
          });

          conn.on("error", (err) => {
            clearTimeout(connectionTimeout);
            console.error("Connection error:", err);
            if (!mounted) return;
            setStatus("error");
            setStatusMessage("Connection failed");
          });
        });

        peer.on("error", (err) => {
          console.error("Peer error:", err);
          if (!mounted) return;
          
          if (err.type === "peer-unavailable") {
            setStatus("error");
            setStatusMessage("Altar not found - check room code");
          } else {
            setStatus("error");
            setStatusMessage("Failed to initialize");
          }
        });

      } catch (err) {
        console.error("PeerJS error:", err);
        if (!mounted) return;
        setStatus("error");
        setStatusMessage("Connection unavailable");
      }
    };

    initPeer();

    return () => {
      mounted = false;
      clearTimeout(connectionTimeout);
      if (connRef.current) connRef.current.close();
      if (peerRef.current) peerRef.current.destroy();
    };
  }, [roomCode]);

  // Send command to desktop
  const sendCommand = useCallback((command: any) => {
    if (connRef.current && status === "connected") {
      connRef.current.send(command);
    }
  }, [status]);

  // Shake detection
  useEffect(() => {
    if (needsPermission) return;
    
    let lastX = 0, lastY = 0, lastZ = 0;
    const threshold = 15;

    const handleMotion = (event: DeviceMotionEvent) => {
      const { accelerationIncludingGravity } = event;
      if (!accelerationIncludingGravity) return;

      const { x, y, z } = accelerationIncludingGravity;
      if (x === null || y === null || z === null) return;

      const deltaX = Math.abs(x - lastX);
      const deltaY = Math.abs(y - lastY);
      const deltaZ = Math.abs(z - lastZ);

      if ((deltaX > threshold || deltaY > threshold || deltaZ > threshold)) {
        const now = Date.now();
        if (now - lastShakeTime > 1000) { // Debounce 1 second
          setLastShakeTime(now);
          handleShake();
        }
      }

      lastX = x;
      lastY = y;
      lastZ = z;
    };

    if (typeof window !== "undefined" && "DeviceMotionEvent" in window) {
      window.addEventListener("devicemotion", handleMotion);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("devicemotion", handleMotion);
      }
    };
  }, [lastShakeTime, needsPermission]);

  // Check if iOS needs permission
  useEffect(() => {
    if (typeof window !== "undefined" && 
        typeof (DeviceMotionEvent as any).requestPermission === "function") {
      setNeedsPermission(true);
    }
  }, []);

  // Request iOS permission
  const requestSensorPermission = async () => {
    try {
      if (typeof (DeviceMotionEvent as any).requestPermission === "function") {
        const motionPerm = await (DeviceMotionEvent as any).requestPermission();
        const orientPerm = await (DeviceOrientationEvent as any).requestPermission();
        if (motionPerm === "granted" && orientPerm === "granted") {
          setNeedsPermission(false);
        }
      }
    } catch (err) {
      console.error("Permission request failed:", err);
    }
  };

  // Tilt detection (gyroscope) with debounce
  useEffect(() => {
    if (needsPermission) return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      const { gamma } = event; // Left/right tilt (-90 to 90)
      if (gamma !== null) {
        setTiltX(gamma);
        
        const now = Date.now();
        // Debounce card changes (500ms minimum between changes)
        if (now - lastTiltChangeRef.current < 500) return;
        
        // Browse cards based on tilt
        if (gamma > 25 && currentCardIndex < cards.length - 1) {
          lastTiltChangeRef.current = now;
          setCurrentCardIndex(prev => Math.min(prev + 1, cards.length - 1));
          if (navigator.vibrate) navigator.vibrate(20);
        } else if (gamma < -25 && currentCardIndex > 0) {
          lastTiltChangeRef.current = now;
          setCurrentCardIndex(prev => Math.max(prev - 1, 0));
          if (navigator.vibrate) navigator.vibrate(20);
        }
      }
    };

    if (typeof window !== "undefined" && "DeviceOrientationEvent" in window) {
      window.addEventListener("deviceorientation", handleOrientation);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("deviceorientation", handleOrientation);
      }
    };
  }, [currentCardIndex, cards.length, needsPermission]);

  // Handle shake - random card
  const handleShake = () => {
    setIsShaking(true);
    const randomIndex = Math.floor(Math.random() * cards.length);
    setCurrentCardIndex(randomIndex);
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([50, 50, 50]);
    }
    
    sendCommand({ 
      type: "shake", 
      randomWritingId: cards[randomIndex].id 
    });
    
    setTimeout(() => setIsShaking(false), 500);
  };

  // Handle tap - select current card
  const handleSelect = () => {
    const selectedCard = cards[currentCardIndex];
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
    
    sendCommand({ 
      type: "navigate", 
      writingId: selectedCard.id 
    });
  };

  // Manual navigation (fallback for devices without gyroscope)
  const handleSwipe = (direction: "left" | "right") => {
    if (direction === "left" && currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
    } else if (direction === "right" && currentCardIndex > 0) {
      setCurrentCardIndex(prev => prev - 1);
    }
    
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  };

  return (
    <div className="min-h-screen bg-[#030304] text-white flex flex-col">
      {/* Status bar */}
      <header className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              status === "connected" ? "bg-green-500" :
              status === "connecting" ? "bg-yellow-500 animate-pulse" :
              status === "error" ? "bg-red-500" : "bg-gray-500"
            }`} />
            <span className="text-[10px] font-mono tracking-wider text-white/50 uppercase">
              {status}
            </span>
          </div>
          <span className="text-[9px] font-mono text-white/30">
            {roomCode}
          </span>
        </div>
        <p className="text-[11px] text-white/40 mt-1 text-center" style={{ fontFamily: "serif" }}>
          {statusMessage}
        </p>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        {/* iOS Permission Request */}
        {needsPermission && status === "connected" && (
          <div className="mb-6 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10">
            <p className="text-sm text-amber-200/80 mb-3 text-center">
              Enable motion sensors for the full experience
            </p>
            <button
              onClick={requestSensorPermission}
              className="w-full py-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-200 text-sm"
            >
              Enable Sensors
            </button>
          </div>
        )}

        {status === "connected" ? (
          <>
            {/* Card display */}
            <div 
              className={`relative w-full max-w-[280px] aspect-[3/4] rounded-xl border border-white/20 bg-white/5 p-6 flex flex-col justify-between transition-transform duration-300 ${
                isShaking ? "animate-shake" : ""
              }`}
              style={{
                transform: `perspective(1000px) rotateY(${tiltX * 0.3}deg)`,
              }}
              onClick={handleSelect}
            >
              {/* Card number */}
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono text-white/30">
                  {currentCardIndex + 1} / {cards.length}
                </span>
                <span className="text-[9px] font-mono text-white/20">
                  {cards[currentCardIndex].date}
                </span>
              </div>

              {/* Title */}
              <div className="flex-1 flex items-center justify-center">
                <h2 
                  className="text-xl text-center text-white/90 leading-relaxed"
                  style={{ fontFamily: "var(--font-cormorant), serif" }}
                >
                  {cards[currentCardIndex].title}
                </h2>
              </div>

              {/* Tap hint */}
              <p className="text-[9px] text-white/30 text-center font-mono">
                TAP TO SELECT
              </p>
              
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-purple-500/10 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Navigation arrows */}
            <div className="flex items-center justify-center gap-8 mt-6">
              <button 
                onClick={() => handleSwipe("right")}
                disabled={currentCardIndex === 0}
                className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center disabled:opacity-30"
              >
                <svg className="w-5 h-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button 
                onClick={() => handleSwipe("left")}
                disabled={currentCardIndex === cards.length - 1}
                className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center disabled:opacity-30"
              >
                <svg className="w-5 h-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Instructions */}
            <div className="mt-8 space-y-2 text-center">
              <p className="text-[10px] font-mono text-white/30 flex items-center justify-center gap-2">
                <span className="inline-block w-4 h-4 border border-white/20 rounded flex items-center justify-center text-[8px]">↔</span>
                Tilt to browse
              </p>
              <p className="text-[10px] font-mono text-white/30 flex items-center justify-center gap-2">
                <span className="inline-block w-4 h-4 border border-white/20 rounded flex items-center justify-center text-[8px]">◎</span>
                Shake for random
              </p>
              <p className="text-[10px] font-mono text-white/30 flex items-center justify-center gap-2">
                <span className="inline-block w-4 h-4 border border-white/20 rounded flex items-center justify-center text-[8px]">↵</span>
                Tap to select
              </p>
            </div>
          </>
        ) : status === "connecting" ? (
          <div className="text-center">
            <div className="w-16 h-16 border border-white/20 rounded-full flex items-center justify-center mb-4 mx-auto animate-pulse">
              <div className="w-8 h-8 border-t border-white/40 rounded-full animate-spin" />
            </div>
            <p className="text-sm text-white/50" style={{ fontFamily: "serif" }}>
              Establishing connection...
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-lg text-white/70 mb-4" style={{ fontFamily: "serif" }}>
              {statusMessage}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="text-sm text-white/50 underline"
            >
              Try again
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="p-4 text-center">
        <p className="text-[9px] font-mono text-white/20 tracking-wider">
          THE CONDUIT • AFTERSTILL
        </p>
      </footer>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0) rotate(0); }
          25% { transform: translateX(-5px) rotate(-2deg); }
          75% { transform: translateX(5px) rotate(2deg); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}

// Export with Suspense wrapper for useSearchParams
export default function ConduitPage() {
  return (
    <Suspense fallback={<ConduitLoading />}>
      <ConduitContent />
    </Suspense>
  );
}
