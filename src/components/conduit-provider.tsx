"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import AmbientMusic from "./ambient-music";

type ConnectionStatus = "waiting" | "connected" | "disconnected";

interface ConduitCommand {
  type: "conduit-connected" | "shake" | "navigate" | "atmosphere";
  randomWritingId?: string;
  writingId?: string;
  [key: string]: unknown;
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
  
  const peerRef = useRef<any>(null);
  const connRef = useRef<any>(null);
  const mountedRef = useRef(true);

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

  // Handle conduit commands
  const handleCommand = useCallback((data: ConduitCommand) => {
    console.log("Received command:", data);
    
    if (data.type === "conduit-connected") {
      if (mountedRef.current) setStatus("connected");
    } else if (data.type === "navigate" && data.writingId) {
      // Navigate to reading page
      router.push(`/reading/${data.writingId}`);
    } else if (data.type === "shake" && data.randomWritingId) {
      // Trigger shake effect then navigate
      if (mountedRef.current) setShakeEffect(true);
      setTimeout(() => {
        if (mountedRef.current) setShakeEffect(false);
        router.push(`/reading/${data.randomWritingId}`);
      }, 600);
    }
  }, [router]);

  // Initialize PeerJS as host (altar) - persistent connection
  useEffect(() => {
    if (!roomCode || isConduitPage) return;

    let retryTimeout: NodeJS.Timeout;

    const initPeer = async () => {
      try {
        const Peer = (await import("peerjs")).default;
        
        // Clean up previous peer if exists
        if (peerRef.current) {
          peerRef.current.destroy();
        }
        
        // Create peer as altar with predictable ID
        const peer = new Peer(`altar-${roomCode}`, {
          debug: 0,
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
          // Retry on some errors
          if (err.type === "unavailable-id" || err.type === "network") {
            retryTimeout = setTimeout(() => {
              if (mountedRef.current) initPeer();
            }, 3000);
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

  return (
    <>
      {/* Shake overlay effect */}
      {shakeEffect && (
        <div className="fixed inset-0 z-[300] pointer-events-none animate-conduit-shake" />
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

            {/* Mystical text */}
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
        `}</style>
      </div>
      
      {/* Ambient Music - always available */}
      <AmbientMusic />
    </>
  );
}
