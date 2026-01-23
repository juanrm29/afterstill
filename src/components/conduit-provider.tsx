"use client";

import { useEffect, useState, useRef, useCallback, createContext, useContext } from "react";
import { useRouter, usePathname } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import AmbientMusic from "./ambient-music";
import { type ConduitCommand, type ConduitResponse, type WritingPreview } from "@/lib/conduit-protocol";

type ConnectionStatus = "waiting" | "connected" | "disconnected";

interface AltarState {
  currentWriting: WritingPreview | null;
  readingProgress: number;
  isReading: boolean;
  atmosphere: {
    soundLevel: number;
    isDimmed: boolean;
  };
}

// Context for other components to interact with conduit
interface ConduitContextValue {
  isConnected: boolean;
  sendToWand: (response: ConduitResponse) => void;
  updateReadingProgress: (progress: number) => void;
  setCurrentWriting: (writing: WritingPreview | null) => void;
}

const ConduitContext = createContext<ConduitContextValue | null>(null);

export function useConduit() {
  return useContext(ConduitContext);
}

export default function ConduitProvider() {
  const router = useRouter();
  const pathname = usePathname();
  
  // Don't show on conduit page
  const isConduitPage = pathname === "/conduit";
  
  const [roomCode, setRoomCode] = useState<string>("");
  const [status, setStatus] = useState<ConnectionStatus>("waiting");
  const [isExpanded, setIsExpanded] = useState(false);
  const [conduitUrl, setConduitUrl] = useState("");
  const [shakeEffect, setShakeEffect] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  
  const [altarState, setAltarState] = useState<AltarState>({
    currentWriting: null,
    readingProgress: 0,
    isReading: false,
    atmosphere: {
      soundLevel: 0.3,
      isDimmed: false,
    },
  });
  
  const peerRef = useRef<any>(null);
  const connRef = useRef<any>(null);
  const mountedRef = useRef(true);
  
  // Send response to connected wand
  const sendToWand = useCallback((response: ConduitResponse) => {
    if (connRef.current && status === "connected") {
      try {
        connRef.current.send(response);
      } catch (err) {
        console.error("Failed to send to wand:", err);
      }
    }
  }, [status]);
  
  // Update reading progress and sync to wand
  const updateReadingProgress = useCallback((progress: number) => {
    setAltarState(prev => ({ ...prev, readingProgress: progress }));
    sendToWand({ type: "state:reading", progress });
  }, [sendToWand]);
  
  // Set current writing and sync to wand
  const setCurrentWriting = useCallback((writing: WritingPreview | null) => {
    setAltarState(prev => ({ ...prev, currentWriting: writing, isReading: !!writing }));
    if (writing) {
      sendToWand({ type: "state:writing", writing });
    }
  }, [sendToWand]);

  // Generate room code once
  useEffect(() => {
    const code = `${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    setRoomCode(code);
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Build conduit URL
  useEffect(() => {
    if (roomCode && typeof window !== "undefined") {
      const baseUrl = window.location.origin;
      setConduitUrl(`${baseUrl}/conduit?room=${roomCode}`);
    }
  }, [roomCode]);

  // Handle conduit commands from wand
  const handleCommand = useCallback(async (data: ConduitCommand) => {
    console.log("Received command:", data);
    
    // Show feedback on altar
    const showFeedback = (msg: string) => {
      setFeedbackMessage(msg);
      setTimeout(() => setFeedbackMessage(null), 2000);
    };
    
    switch (data.type) {
      case "handshake":
        if (mountedRef.current) {
          setStatus("connected");
          sendToWand({ type: "connected", roomCode });
          
          // Send current state
          if (altarState.currentWriting) {
            sendToWand({ type: "state:writing", writing: altarState.currentWriting });
          }
        }
        break;
        
      case "gesture:shake":
        // Shake triggers random writing
        setShakeEffect(true);
        showFeedback("🌀 Destiny shaken...");
        
        try {
          const res = await fetch("/api/writings?random=1");
          if (res.ok) {
            const writings = await res.json();
            if (writings.length > 0) {
              const random = writings[0];
              setTimeout(() => {
                setShakeEffect(false);
                router.push(`/reading/${random.slug}`);
              }, 600);
            }
          }
        } catch (err) {
          console.error("Failed to get random:", err);
          setShakeEffect(false);
        }
        break;
        
      case "gesture:swipe":
        // Swipe controls scroll or navigation
        if (data.direction === "up" || data.direction === "down") {
          const scrollAmount = data.direction === "up" ? -300 : 300;
          window.scrollBy({ top: scrollAmount, behavior: "smooth" });
          showFeedback(data.direction === "up" ? "↑ Ascending..." : "↓ Descending...");
        } else if (data.direction === "left") {
          router.back();
          showFeedback("← Returning...");
        } else if (data.direction === "right") {
          router.push("/archive");
          showFeedback("→ To the archive...");
        }
        break;
        
      case "gesture:tilt":
        // Tilt controls ambient atmosphere (subtle scroll parallax)
        // Could be used for more visual effects
        break;
        
      case "gesture:tap":
        // Tap to pause/resume
        showFeedback("✧ Presence acknowledged");
        sendToWand({ type: "feedback:vibrate", pattern: [30] });
        break;
        
      case "gesture:hold":
        // Hold to enter zen mode
        document.body.classList.toggle("zen-mode");
        showFeedback(document.body.classList.contains("zen-mode") ? "🧘 Zen activated" : "Zen released");
        break;
        
      case "gesture:draw":
        // Shape casting
        if (data.shape === "circle") {
          // Circle = Oracle divine
          showFeedback("○ Circle of fate cast...");
          try {
            const res = await fetch("/api/oracle/divine", { method: "POST" });
            if (res.ok) {
              const result = await res.json();
              sendToWand({
                type: "oracle:result",
                writing: {
                  id: result.writing.id,
                  slug: result.writing.slug,
                  title: result.writing.title,
                  excerpt: result.writing.content?.slice(0, 100),
                },
                message: result.message,
              });
              router.push(`/reading/${result.writing.slug}`);
            }
          } catch (err) {
            console.error("Oracle error:", err);
          }
        } else if (data.shape === "triangle") {
          showFeedback("△ Ascending to wisdom...");
          router.push("/about");
        } else if (data.shape === "infinity") {
          showFeedback("∞ The eternal scroll...");
          router.push("/archive");
        }
        break;
        
      case "navigate:random":
        showFeedback("🎲 Fate deciding...");
        try {
          const res = await fetch("/api/writings?random=1");
          if (res.ok) {
            const writings = await res.json();
            if (writings.length > 0) {
              router.push(`/reading/${writings[0].slug}`);
            }
          }
        } catch (err) {
          console.error("Failed to get random:", err);
        }
        break;
        
      case "navigate:path":
        if (data.path) {
          router.push(data.path);
          showFeedback(`→ Navigating...`);
        }
        break;
        
      case "reading:scroll":
        // Sync scroll from wand
        if (typeof data.delta === "number") {
          window.scrollBy({ top: data.delta * 5, behavior: "smooth" });
        }
        break;
        
      case "reading:pause":
        // Toggle pause state
        document.body.classList.toggle("reading-paused");
        showFeedback("⏸ Reading paused");
        break;
        
      case "oracle:divine":
        showFeedback("🔮 Consulting the oracle...");
        try {
          const body: { latitude?: number; longitude?: number } = {};
          if (data.location) {
            body.latitude = data.location.lat;
            body.longitude = data.location.lon;
          }
          
          const res = await fetch("/api/oracle/divine", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          
          if (res.ok) {
            const result = await res.json();
            sendToWand({
              type: "oracle:result",
              writing: {
                id: result.writing.id,
                slug: result.writing.slug,
                title: result.writing.title,
                excerpt: result.writing.content?.slice(0, 100),
              },
              message: result.message,
            });
            router.push(`/reading/${result.writing.slug}`);
          }
        } catch (err) {
          console.error("Oracle error:", err);
          sendToWand({ type: "oracle:result", message: "The oracle is silent..." });
        }
        break;
        
      case "oracle:whisper":
        // Handle whisper question from wand
        showFeedback("🌙 The void hears you...");
        if (data.message) {
          try {
            const res = await fetch("/api/oracle/respond", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ message: data.message }),
            });
            
            if (res.ok) {
              const result = await res.json();
              sendToWand({
                type: "oracle:response",
                message: result.message,
                quote: result.quote,
              });
            }
          } catch (err) {
            console.error("Whisper error:", err);
          }
        }
        break;
        
      case "atmosphere:sound":
        // Control ambient sound level via custom event
        if (typeof data.level === "number") {
          window.dispatchEvent(new CustomEvent("conduit:sound", { detail: { level: data.level } }));
          setAltarState(prev => ({
            ...prev,
            atmosphere: { ...prev.atmosphere, soundLevel: data.level as number },
          }));
        }
        break;
        
      case "atmosphere:dim":
        // Toggle dim mode
        document.body.classList.toggle("dimmed", true);
        setAltarState(prev => ({
          ...prev,
          atmosphere: { ...prev.atmosphere, isDimmed: true },
        }));
        showFeedback("🌑 Dimming the altar...");
        break;
        
      case "atmosphere:brighten":
        document.body.classList.remove("dimmed");
        setAltarState(prev => ({
          ...prev,
          atmosphere: { ...prev.atmosphere, isDimmed: false },
        }));
        showFeedback("☀️ Light returns...");
        break;
        
      case "voice:command":
        // Voice command from wand
        if (data.text) {
          // Parse simple commands
          const cmd = (data.text as string).toLowerCase();
          if (cmd.includes("random")) {
            router.push("/archive?random=true");
          } else if (cmd.includes("oracle")) {
            router.push("/conduit");
          } else if (cmd.includes("home")) {
            router.push("/");
          }
        }
        break;
    }
  }, [router, roomCode, sendToWand, altarState.currentWriting]);

  // Initialize PeerJS as host (altar) - persistent connection
  useEffect(() => {
    if (!roomCode || isConduitPage) return;

    let retryTimeout: NodeJS.Timeout;

    const initPeer = async () => {
      try {
        const Peer = (await import("peerjs")).default;
        
        // Clean up previous peer if exists
        if (peerRef.current) {
          try {
            peerRef.current.destroy();
          } catch {
            // Ignore destroy errors
          }
        }
        
        // Create peer as altar with predictable ID
        const peer = new Peer(`altar-${roomCode}`, {
          debug: 0,
          config: {
            iceServers: [
              { urls: "stun:stun.l.google.com:19302" },
              { urls: "stun:stun1.l.google.com:19302" },
            ],
          },
        });
        peerRef.current = peer;

        peer.on("open", (id) => {
          console.log("Altar ready with ID:", id);
        });

        peer.on("connection", (conn) => {
          console.log("Conduit connecting...");
          connRef.current = conn;

          conn.on("open", () => {
            console.log("Conduit connected!");
            if (mountedRef.current) setStatus("connected");
          });

          conn.on("data", (rawData: unknown) => {
            const data = rawData as ConduitCommand;
            handleCommand(data);
          });

          conn.on("close", () => {
            console.log("Conduit disconnected");
            if (mountedRef.current) {
              setStatus("disconnected");
              setTimeout(() => {
                if (mountedRef.current) setStatus("waiting");
              }, 3000);
            }
          });
          
          conn.on("error", (err) => {
            console.error("Connection error:", err);
          });
        });

        peer.on("error", (err) => {
          console.error("Peer error:", err);
          // Retry on some errors - with exponential backoff
          const retryErrors = ["unavailable-id", "network", "server-error", "socket-error", "socket-closed"];
          if (retryErrors.includes(err.type)) {
            retryTimeout = setTimeout(() => {
              if (mountedRef.current) initPeer();
            }, 5000);
          }
        });
        
        peer.on("disconnected", () => {
          // Try to reconnect
          if (mountedRef.current && peerRef.current) {
            peerRef.current.reconnect();
          }
        });

      } catch (err) {
        console.error("Failed to initialize PeerJS:", err);
      }
    };

    initPeer();

    return () => {
      clearTimeout(retryTimeout);
      // Don't destroy peer on unmount - keep connection alive
    };
  }, [roomCode, isConduitPage, handleCommand]);

  // Cleanup on full unmount only
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (connRef.current) connRef.current.close();
      if (peerRef.current) peerRef.current.destroy();
    };
  }, []);

  // Don't render on conduit page
  if (isConduitPage) return null;
  
  const contextValue: ConduitContextValue = {
    isConnected: status === "connected",
    sendToWand,
    updateReadingProgress,
    setCurrentWriting,
  };

  return (
    <ConduitContext.Provider value={contextValue}>
      {/* Shake overlay effect */}
      {shakeEffect && (
        <div className="fixed inset-0 z-[300] pointer-events-none animate-conduit-shake bg-white/5" />
      )}
      
      {/* Feedback message overlay */}
      {feedbackMessage && (
        <div 
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[400] 
                     px-6 py-4 rounded-2xl border border-white/20 bg-black/80 backdrop-blur-xl
                     text-white text-center pointer-events-none"
          style={{ 
            fontFamily: "var(--font-cormorant), serif",
            animation: "fadeInOut 2s ease-out forwards"
          }}
        >
          <p className="text-lg">{feedbackMessage}</p>
        </div>
      )}
      
      {/* Conduit Panel */}
      <div className="fixed bottom-6 left-6 z-[200]">
        {/* Collapsed - mysterious icon */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`
            relative w-10 h-10 rounded-full border transition-all duration-500
            ${status === "connected" 
              ? "border-green-500/50 bg-green-500/10" 
              : "border-foreground/10 bg-background/50 hover:border-foreground/20"
            }
          `}
        >
          {/* Connection indicator */}
          {status === "connected" ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>
          ) : (
            <svg 
              className="w-4 h-4 absolute inset-0 m-auto text-foreground/40"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          )}
        </button>

        {/* Expanded panel */}
        {isExpanded && (
          <div 
            className="absolute bottom-12 left-0 w-64 p-4 rounded-xl border border-foreground/10 bg-background/95 backdrop-blur-md shadow-2xl"
            style={{ animation: "fadeIn 0.3s ease-out" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-[9px] font-mono tracking-[0.3em] uppercase text-foreground/40">
                The Conduit
              </span>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  status === "connected" ? "bg-green-500" :
                  status === "disconnected" ? "bg-red-500" : "bg-foreground/30"
                }`} />
                <span className="text-[8px] font-mono text-foreground/30">
                  {status === "connected" ? "LINKED" : 
                   status === "disconnected" ? "SEVERED" : "AWAITING"}
                </span>
              </div>
            </div>

            {status === "connected" ? (
              /* Connected state */
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full border border-green-500/30 bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-500/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm text-foreground/70 mb-1" style={{ fontFamily: "var(--font-cormorant), serif" }}>
                  A presence has been detected
                </p>
                <p className="text-[9px] font-mono text-foreground/30">
                  The conduit is active
                </p>
              </div>
            ) : (
              /* Waiting state - QR Code */
              <>
                <div className="flex justify-center mb-4">
                  <div className="p-2 bg-white rounded-lg">
                    <QRCodeSVG 
                      value={conduitUrl}
                      size={120}
                      level="M"
                      bgColor="#ffffff"
                      fgColor="#030304"
                    />
                  </div>
                </div>

                <p 
                  className="text-xs text-center text-foreground/60 mb-3"
                  style={{ fontFamily: "var(--font-cormorant), serif" }}
                >
                  Scan to become the observer
                </p>

                <div className="flex items-center justify-center gap-2 text-[9px] font-mono text-foreground/30">
                  <span className="px-2 py-0.5 rounded border border-foreground/10 bg-foreground/5">
                    {roomCode}
                  </span>
                </div>

                {/* Manual URL hint */}
                <p className="text-[8px] text-foreground/20 text-center mt-3 break-all">
                  /conduit?room={roomCode}
                </p>
              </>
            )}

            <div className="mt-4 pt-3 border-t border-foreground/5">
              <p className="text-[8px] text-foreground/20 text-center font-mono italic">
                {status === "connected" 
                  ? "\"The ritual is complete\""
                  : "\"Seek the connection\""}
              </p>
            </div>
          </div>
        )}

        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeInOut {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
            15% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            85% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
          }
        `}</style>
      </div>
      
      {/* Ambient Music - always available */}
      <AmbientMusic />
    </ConduitContext.Provider>
  );
}
