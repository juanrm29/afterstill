"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { OraclePanel } from "@/components/oracle-panel";
import { ConduitWand } from "@/components/conduit-wand";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import type { ConduitCommand, ConduitResponse } from "@/lib/conduit-protocol";
import type { DataConnection } from "peerjs";
import type Peer from "peerjs";

type ConnectionStatus = "waiting" | "connected" | "disconnected" | "error";

// Loading fallback
function ConduitLoading() {
  return (
    <div className="min-h-screen bg-[#030304] text-white flex items-center justify-center">
      <div className="text-center">
        <motion.div
          className="w-16 h-16 mx-auto mb-6"
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="1"
              strokeDasharray="20 80"
            />
          </svg>
        </motion.div>
        <p className="text-sm text-white/50 font-serif italic">
          The oracle awakens...
        </p>
      </div>
    </div>
  );
}

// Desktop Oracle with PeerJS host for mobile connection
function DesktopOracle() {
  const router = useRouter();
  const [roomCode] = useState(() => 
    Math.random().toString(36).slice(2, 8).toUpperCase()
  );
  const [conduitUrl, setConduitUrl] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus>("waiting");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  
  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const mountedRef = useRef(true);
  const roomCodeRef = useRef(roomCode);

  // Keep roomCodeRef in sync
  useEffect(() => {
    roomCodeRef.current = roomCode;
  }, [roomCode]);

  // Set conduit URL once on mount
  useEffect(() => {
    if (globalThis.window !== undefined) {
      setConduitUrl(`${globalThis.location.origin}/conduit?room=${roomCode}`);
    }
  }, [roomCode]);

  // Send response to wand
  const sendToWand = useCallback((response: ConduitResponse) => {
    if (connRef.current) {
      try {
        connRef.current.send(response);
      } catch (err) {
        console.error("Failed to send to wand:", err);
      }
    }
  }, []);

  // Show feedback message
  const showFeedback = useCallback((msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 2000);
  }, []);

  // Handle commands from wand - using ref to avoid dependency issues
  const handleCommandRef = useRef<((data: ConduitCommand) => Promise<void>) | null>(null);
  
  handleCommandRef.current = async (data: ConduitCommand) => {
    console.log("Received command:", data);
    
    switch (data.type) {
      case "handshake":
        setStatus("connected");
        sendToWand({ type: "connected", roomCode });
        showFeedback("✧ Wand connected!");
        break;
        
      case "gesture:shake":
        showFeedback("🌀 Destiny shaken...");
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
        
      case "gesture:swipe":
        if (data.direction === "up" || data.direction === "down") {
          const scrollAmount = data.direction === "up" ? -300 : 300;
          globalThis.scrollBy({ top: scrollAmount, behavior: "smooth" });
          showFeedback(data.direction === "up" ? "↑ Ascending..." : "↓ Descending...");
        } else if (data.direction === "left") {
          router.back();
          showFeedback("← Returning...");
        } else if (data.direction === "right") {
          router.push("/archive");
          showFeedback("→ To the archive...");
        }
        break;
        
      case "gesture:tap":
        showFeedback("✧ Presence acknowledged");
        sendToWand({ type: "feedback:vibrate", pattern: [30] });
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
        
      case "oracle:divine":
        showFeedback("🔮 Consulting the oracle...");
        try {
          const body: { lat?: number; lon?: number } = {};
          if (data.location) {
            body.lat = data.location.lat;
            body.lon = data.location.lon;
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
              writing: result.oracle?.writing ? {
                id: result.oracle.writing.id,
                slug: result.oracle.writing.slug,
                title: result.oracle.writing.title,
                excerpt: "",
              } : undefined,
              message: result.oracle?.cosmicMessage,
            });
            if (result.oracle?.writing?.slug) {
              router.push(`/reading/${result.oracle.writing.slug}`);
            }
          }
        } catch (err) {
          console.error("Oracle error:", err);
          sendToWand({ type: "oracle:result", message: "The oracle is silent..." });
        }
        break;
        
      case "oracle:whisper":
        showFeedback("🌙 The void hears you...");
        if (data.message) {
          try {
            const res = await fetch("/api/oracle/respond", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userWhisper: data.message }),
            });
            
            if (res.ok) {
              const result = await res.json();
              sendToWand({
                type: "oracle:response",
                message: result.void?.response ?? "The void is silent...",
                quote: result.void?.quote,
              });
            }
          } catch (err) {
            console.error("Whisper error:", err);
          }
        }
        break;
        
      case "gesture:draw":
        if (data.shape === "circle") {
          showFeedback("○ Circle of fate cast...");
          // Trigger oracle divine
          try {
            const res = await fetch("/api/oracle/divine", { method: "POST" });
            if (res.ok) {
              const result = await res.json();
              if (result.oracle?.writing?.slug) {
                router.push(`/reading/${result.oracle.writing.slug}`);
              }
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
    }
  };

  // Initialize PeerJS as host - only run once
  useEffect(() => {
    mountedRef.current = true;
    const code = roomCodeRef.current;
    let isCleanedUp = false;
    let retryTimeout: NodeJS.Timeout;
    let initTimeout: NodeJS.Timeout;

    const initPeer = async () => {
      if (isCleanedUp) return;
      
      try {
        const PeerModule = await import("peerjs");
        const PeerClass = PeerModule.default;
        
        // Clean up previous peer
        if (peerRef.current) {
          try {
            peerRef.current.destroy();
          } catch {
            // Ignore
          }
          peerRef.current = null;
          // Wait a bit for the server to release the ID
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        if (isCleanedUp) return;
        
        // Create peer as altar with predictable ID based on roomCode
        const peer = new PeerClass(`altar-${code}`, {
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
          console.log("Oracle altar ready with ID:", id);
        });

        peer.on("connection", (conn) => {
          console.log("Wand connecting...");
          connRef.current = conn;

          conn.on("open", () => {
            console.log("Wand connected!");
            if (mountedRef.current) {
              setStatus("connected");
              setShowQR(false); // Close QR modal on connect
            }
          });

          conn.on("data", (rawData: unknown) => {
            // Use ref to get latest handler
            handleCommandRef.current?.(rawData as ConduitCommand);
          });

          conn.on("close", () => {
            console.log("Wand disconnected");
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
          if (isCleanedUp) return;
          
          if (err.type === "unavailable-id") {
            // ID is taken - this means another session has same roomCode
            // Just wait, the peer server will eventually free the ID
            console.log("Peer ID taken, waiting for it to be freed...");
            if (peerRef.current) {
              try {
                peerRef.current.destroy();
              } catch {
                // Ignore
              }
              peerRef.current = null;
            }
            // Retry after delay
            retryTimeout = setTimeout(() => {
              if (mountedRef.current && !isCleanedUp) initPeer();
            }, 2000);
            return;
          }
          
          const retryErrors = ["network", "server-error", "socket-error", "socket-closed"];
          if (retryErrors.includes(err.type)) {
            retryTimeout = setTimeout(() => {
              if (mountedRef.current && !isCleanedUp) initPeer();
            }, 5000);
          }
        });
        
        peer.on("disconnected", () => {
          if (mountedRef.current && peerRef.current && !isCleanedUp) {
            peerRef.current.reconnect();
          }
        });

      } catch (err) {
        console.error("Failed to initialize PeerJS:", err);
        if (!isCleanedUp) setStatus("error");
      }
    };

    // Delay init slightly to avoid React Strict Mode double-mount issues
    initTimeout = setTimeout(() => {
      if (!isCleanedUp) initPeer();
    }, 100);

    return () => {
      isCleanedUp = true;
      mountedRef.current = false;
      clearTimeout(retryTimeout);
      clearTimeout(initTimeout);
      if (connRef.current) {
        try { connRef.current.close(); } catch { /* ignore */ }
      }
      if (peerRef.current) {
        try { peerRef.current.destroy(); } catch { /* ignore */ }
        peerRef.current = null;
      }
    };
   
  }, []);

  return (
    <div className="min-h-screen bg-[#030304] relative">
      {/* Feedback message overlay */}
      <AnimatePresence>
        {feedbackMessage && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-200 
                       px-8 py-5 rounded-2xl border border-white/20 bg-black/90 backdrop-blur-xl
                       text-white text-center pointer-events-none"
            style={{ fontFamily: "var(--font-cormorant), serif" }}
          >
            <p className="text-xl">{feedbackMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back navigation */}
      <div className="fixed top-6 left-6 z-50">
        <Link
          href="/"
          className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors group"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="text-xs tracking-wider uppercase font-mono">Return</span>
        </Link>
      </div>

      {/* Mobile Connection Button */}
      <div className="fixed top-6 right-6 z-50">
        <motion.button
          onClick={() => setShowQR(!showQR)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-xs font-mono uppercase tracking-wider ${
            status === "connected" 
              ? "border-green-500/50 bg-green-500/10 text-green-400"
              : "border-white/20 bg-white/5 text-white/60 hover:text-white hover:border-white/40"
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {status === "connected" ? (
            <>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>Connected</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span>Connect Mobile</span>
            </>
          )}
        </motion.button>
      </div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQR && conduitUrl && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQR(false)}
              className="fixed inset-0 z-100 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-101 p-8 rounded-2xl border border-white/20 bg-zinc-900/95 backdrop-blur-xl text-center max-w-sm w-full mx-4"
            >
              <button
                onClick={() => setShowQR(false)}
                className="absolute top-4 right-4 text-white/40 hover:text-white/70"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <h3 className="text-lg font-light text-white/90 mb-2" style={{ fontFamily: "var(--font-cormorant), serif" }}>
                Connect Your Wand
              </h3>
              <p className="text-xs text-white/50 mb-6">
                Scan with your phone to control the oracle
              </p>
              
              <div className="bg-white p-4 rounded-xl inline-block mb-4">
                <QRCodeSVG
                  value={conduitUrl}
                  size={180}
                  level="M"
                  bgColor="white"
                  fgColor="black"
                />
              </div>
              
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-xs text-white/40 font-mono">Room:</span>
                <span className="text-sm text-white/80 font-mono tracking-widest bg-white/10 px-3 py-1 rounded">{roomCode}</span>
                <div className={`w-2 h-2 rounded-full ${
                  status === "connected" ? "bg-green-500" : "bg-amber-500 animate-pulse"
                }`} />
              </div>

              <p className="text-[10px] text-white/30 mb-4">
                {status === "waiting" && "Waiting for connection..."}
                {status === "connected" && "✓ Wand connected!"}
                {status === "error" && "Connection error. Please refresh."}
              </p>
              
              <div className="text-[10px] text-white/30 space-y-1 border-t border-white/10 pt-4">
                <p>📱 Shake phone → Random writing</p>
                <p>👆 Swipe → Navigate</p>
                <p>✍️ Draw shapes → Special actions</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Oracle Panel */}
      <OraclePanel />
    </div>
  );
}

// Inner component that uses searchParams
function ConduitContent() {
  const searchParams = useSearchParams();
  const roomCode = searchParams.get("room");
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = 
        globalThis.innerWidth < 768 || 
        "ontouchstart" in globalThis ||
        navigator.maxTouchPoints > 0;
      setIsMobile(isMobileDevice);
      setIsLoading(false);
    };
    
    checkMobile();
    globalThis.addEventListener("resize", checkMobile);
    return () => globalThis.removeEventListener("resize", checkMobile);
  }, []);
  
  if (isLoading) {
    return <ConduitLoading />;
  }
  
  // If room code is provided and mobile, show wand interface
  if (roomCode && isMobile) {
    return <ConduitWand roomCode={roomCode} />;
  }
  
  // Otherwise show Oracle panel (desktop)
  return <DesktopOracle />;
}

export default function ConduitPage() {
  return (
    <Suspense fallback={<ConduitLoading />}>
      <ConduitContent />
    </Suspense>
  );
}
