"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WhisperVoidResponse } from "./whisper-mode-ui";

type OracleMode = "divine" | "whisper" | "void" | "idle";

interface OracleState {
  mode: OracleMode;
  isLoading: boolean;
  cosmicMessage: string | null;
  selectedWriting: {
    id: string;
    title: string;
  } | null;
  voidResponse: {
    response: string;
    quote: string | null;
    cosmic: string;
  } | null;
  error: string | null;
}

interface EnvironmentData {
  time: string;
  moon: { phase: string; emoji: string; illumination: number };
  weather?: { condition: string; description: string };
  season: string;
  isLiminal: boolean;
}

/**
 * useOracleSession - Complete oracle experience hook
 */
export function useOracleSession() {
  const [state, setState] = useState<OracleState>({
    mode: "idle",
    isLoading: false,
    cosmicMessage: null,
    selectedWriting: null,
    voidResponse: null,
    error: null,
  });
  
  const [environment, setEnvironment] = useState<EnvironmentData | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  
  // Request location permission
  const requestLocation = useCallback(() => {
    if (typeof navigator !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          });
        },
        () => {
          // Location denied, proceed without it
          console.log("Location access denied, proceeding without weather");
        }
      );
    }
  }, []);
  
  // Divine - let the universe choose
  const divine = useCallback(async () => {
    setState(prev => ({ ...prev, mode: "divine", isLoading: true, error: null }));
    
    try {
      const response = await fetch("/api/oracle/divine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: userLocation?.lat,
          lon: userLocation?.lon,
        }),
      });
      
      if (!response.ok) throw new Error("Oracle silent");
      
      const data = await response.json();
      
      setEnvironment(data.oracle.environment);
      setState(prev => ({
        ...prev,
        isLoading: false,
        cosmicMessage: data.oracle.cosmicMessage,
        selectedWriting: data.oracle.writing,
      }));
      
    } catch {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: "The oracle is silent. Try again.",
      }));
    }
  }, [userLocation]);
  
  // Ask the void (with optional whisper)
  const askVoid = useCallback(async (whisper?: string) => {
    if (!state.selectedWriting) {
      setState(prev => ({ ...prev, error: "First, let the universe choose a writing" }));
      return;
    }
    
    setState(prev => ({ ...prev, mode: "void", isLoading: true, error: null }));
    
    try {
      const response = await fetch("/api/oracle/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          writingId: state.selectedWriting.id,
          userWhisper: whisper,
          lat: userLocation?.lat,
          lon: userLocation?.lon,
        }),
      });
      
      if (!response.ok) throw new Error("Void silent");
      
      const data = await response.json();
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        mode: "whisper",
        voidResponse: {
          response: data.void.response,
          quote: data.void.quote,
          cosmic: data.void.environment.cosmic,
        },
      }));
      
    } catch {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: "The void is silent. Try again.",
      }));
    }
  }, [state.selectedWriting, userLocation]);
  
  // Reset session
  const reset = useCallback(() => {
    setState({
      mode: "idle",
      isLoading: false,
      cosmicMessage: null,
      selectedWriting: null,
      voidResponse: null,
      error: null,
    });
    setEnvironment(null);
  }, []);
  
  return {
    ...state,
    environment,
    divine,
    askVoid,
    reset,
    requestLocation,
    hasLocation: !!userLocation,
  };
}

/**
 * OraclePanel - Full oracle experience UI
 */
export function OraclePanel() {
  const {
    mode,
    isLoading,
    cosmicMessage,
    selectedWriting,
    voidResponse,
    error,
    environment,
    divine,
    askVoid,
    reset,
    requestLocation,
    hasLocation,
  } = useOracleSession();
  
  const [whisperInput, setWhisperInput] = useState("");
  
  // Request location on mount
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);
  
  return (
    <div className="min-h-screen bg-[#030304] text-white flex flex-col">
      {/* Ambient background */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          background: mode === "whisper"
            ? "radial-gradient(ellipse at center, rgba(100,50,150,0.3) 0%, transparent 70%)"
            : mode === "divine" && selectedWriting
            ? "radial-gradient(ellipse at center, rgba(50,100,150,0.3) 0%, transparent 70%)"
            : "radial-gradient(ellipse at center, rgba(30,30,50,0.3) 0%, transparent 70%)",
        }}
      />
      
      {/* Header */}
      <header className="relative z-10 p-6 text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-light tracking-wide"
          style={{ fontFamily: "var(--font-cormorant), serif" }}
        >
          The Oracle
        </motion.h1>
        
        {environment && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            className="mt-2 text-xs font-mono text-white/40"
          >
            {environment.moon.emoji} {environment.season} · {environment.time}
            {environment.weather && ` · ${environment.weather.description}`}
          </motion.p>
        )}
      </header>
      
      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <AnimatePresence mode="wait">
          {/* Idle State - Start */}
          {mode === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center max-w-sm"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="w-24 h-24 mx-auto mb-8 rounded-full border border-white/20 flex items-center justify-center"
              >
                <span className="text-3xl">✧</span>
              </motion.div>
              
              <p className="text-white/60 mb-8" style={{ fontFamily: "var(--font-cormorant), serif" }}>
                The universe holds words meant for you.
                <br />
                Let it choose.
              </p>
              
              <motion.button
                onClick={divine}
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-3 rounded-full border border-white/30 bg-white/5 text-white/90 font-light tracking-wide disabled:opacity-50"
              >
                Divine
              </motion.button>
              
              {!hasLocation && (
                <p className="mt-6 text-[10px] text-white/30">
                  Location access enhances the oracle with weather
                </p>
              )}
            </motion.div>
          )}
          
          {/* Loading State */}
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 mx-auto mb-6 rounded-full border border-white/20 border-t-white/60"
              />
              <p className="text-sm text-white/50" style={{ fontFamily: "var(--font-cormorant), serif" }}>
                {mode === "divine" ? "Reading the cosmic patterns..." : "The void is responding..."}
              </p>
            </motion.div>
          )}
          
          {/* Divine Result */}
          {mode === "divine" && selectedWriting && !isLoading && (
            <motion.div
              key="divine"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center max-w-sm"
            >
              {/* Cosmic message */}
              {cosmicMessage && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 0.6, y: 0 }}
                  className="text-xs italic text-white/50 mb-6"
                >
                  {cosmicMessage}
                </motion.p>
              )}
              
              {/* Selected writing */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-6 rounded-xl border border-white/20 bg-white/5 mb-6"
              >
                <p className="text-xs text-white/40 mb-2 font-mono">THE UNIVERSE CHOSE</p>
                <h2 
                  className="text-xl text-white/90"
                  style={{ fontFamily: "var(--font-cormorant), serif" }}
                >
                  {selectedWriting.title}
                </h2>
              </motion.div>
              
              {/* Actions */}
              <div className="space-y-3">
                <motion.button
                  onClick={() => askVoid()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 rounded-lg border border-white/30 bg-white/5 text-white/80"
                >
                  Let it speak to me
                </motion.button>
                
                {/* Whisper input */}
                <div className="relative">
                  <input
                    type="text"
                    value={whisperInput}
                    onChange={(e) => setWhisperInput(e.target.value)}
                    placeholder="Or whisper something..."
                    className="w-full py-3 px-4 rounded-lg border border-white/10 bg-white/5 text-white/80 text-center placeholder:text-white/30 focus:outline-none focus:border-white/30"
                  />
                  {whisperInput && (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => askVoid(whisperInput)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50"
                    >
                      →
                    </motion.button>
                  )}
                </div>
                
                <button
                  onClick={reset}
                  className="text-xs text-white/30 hover:text-white/50"
                >
                  Start over
                </button>
              </div>
            </motion.div>
          )}
          
          {/* Whisper/Void Response */}
          {mode === "whisper" && voidResponse && !isLoading && (
            <motion.div
              key="whisper"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-sm w-full"
            >
              <WhisperVoidResponse
                response={voidResponse.response}
                quote={voidResponse.quote}
                cosmicContext={voidResponse.cosmic}
              />
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
                className="mt-8 space-y-3 text-center"
              >
                <button
                  onClick={() => askVoid()}
                  className="text-sm text-white/50 hover:text-white/70"
                >
                  Ask again
                </button>
                <br />
                <button
                  onClick={reset}
                  className="text-xs text-white/30 hover:text-white/50"
                >
                  New divination
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-20 text-sm text-red-400/70"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </main>
      
      {/* Footer */}
      <footer className="relative z-10 p-4 text-center">
        <p className="text-[9px] font-mono text-white/20 tracking-wider">
          THE ORACLE • AFTERSTILL
        </p>
      </footer>
    </div>
  );
}
