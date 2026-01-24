"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WhisperVoidResponse } from "./whisper-mode-ui";
import Link from "next/link";

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

  // Calculate background gradient based on mode
  const backgroundGradient = useMemo(() => {
    if (mode === "whisper") {
      return "radial-gradient(ellipse at center, rgba(100,50,150,0.3) 0%, transparent 70%)";
    }
    if (mode === "divine" && selectedWriting) {
      return "radial-gradient(ellipse at center, rgba(50,100,150,0.3) 0%, transparent 70%)";
    }
    return "radial-gradient(ellipse at center, rgba(30,30,50,0.3) 0%, transparent 70%)";
  }, [mode, selectedWriting]);
  
  return (
    <div className="min-h-screen bg-[#030304] text-white flex flex-col">
      {/* Ambient background */}
      <motion.div 
        className="fixed inset-0 pointer-events-none"
        animate={{ opacity: 0.4 }}
        transition={{ duration: 1 }}
        style={{ background: backgroundGradient }}
      />
      
      {/* Floating particles - memoized to avoid impure render */}
      {/* Removed floating particles to fix impure function issue - visual not essential */}
      
      {/* Header */}
      <header className="relative z-10 pt-8 pb-4 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block"
        >
          <p className="text-[9px] tracking-[0.5em] uppercase text-white/30 font-mono mb-2">
            AFTERSTILL
          </p>
          <h1
            className="text-3xl md:text-4xl font-light tracking-wide text-white/90"
            style={{ fontFamily: "var(--font-cormorant), serif" }}
          >
            The Oracle
          </h1>
        </motion.div>
        
        {environment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4 flex items-center justify-center gap-3 text-xs text-white/40"
          >
            <span className="flex items-center gap-1">
              <span className="text-lg">{environment.moon.emoji}</span>
              <span className="font-mono text-[10px]">{environment.moon.phase}</span>
            </span>
            <span className="text-white/20">·</span>
            <span className="font-mono text-[10px]">{environment.season}</span>
            <span className="text-white/20">·</span>
            <span className="font-mono text-[10px]">{environment.time}</span>
            {environment.weather && (
              <>
                <span className="text-white/20">·</span>
                <span className="font-mono text-[10px]">{environment.weather.description}</span>
              </>
            )}
          </motion.div>
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
              className="text-center max-w-md"
            >
              {/* Mystical circle */}
              <motion.div
                className="relative w-32 h-32 mx-auto mb-10"
              >
                {/* Outer rotating ring */}
                <motion.svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 100 100"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                >
                  <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                  <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" strokeDasharray="4 8" />
                </motion.svg>
                
                {/* Inner pulsing ring */}
                <motion.svg
                  className="absolute inset-4 w-24 h-24"
                  viewBox="0 0 100 100"
                  animate={{ 
                    scale: [1, 1.05, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                  <circle cx="50" cy="50" r="25" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
                </motion.svg>
                
                {/* Center symbol */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <span className="text-4xl text-white/80">✧</span>
                </motion.div>
              </motion.div>
              
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-white/60 mb-2 leading-relaxed"
                style={{ fontFamily: "var(--font-cormorant), serif" }}
              >
                The universe holds words meant for you.
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-white/40 mb-10 text-sm italic"
                style={{ fontFamily: "var(--font-cormorant), serif" }}
              >
                Let it choose.
              </motion.p>
              
              <motion.button
                onClick={divine}
                disabled={isLoading}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.03, boxShadow: "0 0 30px rgba(255,255,255,0.1)" }}
                whileTap={{ scale: 0.97 }}
                className="relative px-12 py-4 rounded-full border border-white/20 bg-white/5 text-white/90 font-light tracking-widest uppercase text-sm disabled:opacity-50 overflow-hidden group"
              >
                <span className="relative z-10">Divine</span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.6 }}
                />
              </motion.button>
              
              {!hasLocation && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="mt-8 text-[10px] text-white/25 font-mono"
                >
                  ✦ Location access enhances the oracle with weather ✦
                </motion.p>
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
              <motion.div className="relative w-20 h-20 mx-auto mb-8">
                {/* Multiple rotating rings */}
                <motion.svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 100 100"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                </motion.svg>
                <motion.svg
                  className="absolute inset-2 w-16 h-16"
                  viewBox="0 0 100 100"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="10 20" />
                </motion.svg>
                <motion.svg
                  className="absolute inset-4 w-12 h-12"
                  viewBox="0 0 100 100"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                >
                  <circle cx="50" cy="50" r="35" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeDasharray="5 15" />
                </motion.svg>
              </motion.div>
              
              <motion.p
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-sm text-white/60 italic"
                style={{ fontFamily: "var(--font-cormorant), serif" }}
              >
                {mode === "divine" ? "Reading the cosmic patterns..." : "The void is responding..."}
              </motion.p>
            </motion.div>
          )}
          
          {/* Divine Result */}
          {mode === "divine" && selectedWriting && !isLoading && (
            <motion.div
              key="divine"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center max-w-md w-full"
            >
              {/* Cosmic message */}
              {cosmicMessage && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 0.7, y: 0 }}
                  className="text-sm italic text-white/50 mb-8"
                  style={{ fontFamily: "var(--font-cormorant), serif" }}
                >
                  &ldquo;{cosmicMessage}&rdquo;
                </motion.p>
              )}
              
              {/* Selected writing card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="relative p-8 rounded-2xl border border-white/15 bg-gradient-to-b from-white/10 to-white/5 mb-8 overflow-hidden"
              >
                {/* Decorative corners */}
                <div className="absolute top-3 left-3 w-4 h-4 border-l border-t border-white/20" />
                <div className="absolute top-3 right-3 w-4 h-4 border-r border-t border-white/20" />
                <div className="absolute bottom-3 left-3 w-4 h-4 border-l border-b border-white/20" />
                <div className="absolute bottom-3 right-3 w-4 h-4 border-r border-b border-white/20" />
                
                <p className="text-[10px] tracking-[0.4em] text-white/30 mb-4 font-mono uppercase">
                  THE UNIVERSE CHOSE
                </p>
                <h2 
                  className="text-2xl md:text-3xl text-white/90 leading-tight"
                  style={{ fontFamily: "var(--font-cormorant), serif" }}
                >
                  {selectedWriting.title}
                </h2>
                
                {/* Subtle glow effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-t from-purple-500/5 to-transparent pointer-events-none"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              </motion.div>
              
              {/* Actions */}
              <div className="space-y-4">
                <motion.button
                  onClick={() => askVoid()}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.1)" }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 rounded-xl border border-white/25 bg-white/5 text-white/90 font-light tracking-wide transition-colors"
                >
                  Let it speak to me
                </motion.button>
                
                {/* Whisper input */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="relative group"
                >
                  <input
                    type="text"
                    value={whisperInput}
                    onChange={(e) => setWhisperInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && whisperInput && askVoid(whisperInput)}
                    placeholder="Or whisper something to the void..."
                    className="w-full py-4 px-5 rounded-xl border border-white/10 bg-white/5 text-white/80 text-center placeholder:text-white/25 focus:outline-none focus:border-white/30 transition-colors"
                  />
                  {whisperInput && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => askVoid(whisperInput)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 transition-colors"
                    >
                      →
                    </motion.button>
                  )}
                </motion.div>
                
                {/* Read the writing link */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <Link
                    href={`/reading/${selectedWriting.id}`}
                    className="inline-block text-sm text-white/40 hover:text-white/70 transition-colors underline underline-offset-4"
                  >
                    Read this writing →
                  </Link>
                </motion.div>
                
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  onClick={reset}
                  className="text-xs text-white/25 hover:text-white/50 transition-colors mt-4"
                >
                  ✧ Start over ✧
                </motion.button>
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
              className="max-w-md w-full"
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
                className="mt-10 flex flex-col items-center gap-4"
              >
                <button
                  onClick={() => askVoid()}
                  className="px-6 py-2 rounded-full border border-white/20 bg-white/5 text-sm text-white/60 hover:text-white/90 hover:border-white/30 transition-colors"
                >
                  Ask again
                </button>
                <button
                  onClick={reset}
                  className="text-[10px] text-white/30 hover:text-white/50 tracking-wider uppercase transition-colors"
                >
                  ✧ New divination ✧
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-24 px-6 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-sm text-red-300/80"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      {/* Footer */}
      <footer className="relative z-10 p-6 text-center border-t border-white/5">
        <p className="text-[9px] font-mono text-white/20 tracking-[0.3em] uppercase">
          The Oracle • Afterstill
        </p>
      </footer>
    </div>
  );
}
