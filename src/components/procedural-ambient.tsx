"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTemporal } from "./consciousness-provider";
import { getAmbientSound } from "@/lib/ambient-sound";

/**
 * ProceduralAmbientPlayer - Generates time-aware ambient soundscapes
 * 
 * Uses Web Audio API to create evolving tones that shift with the time of day.
 * Much more subtle and ethereal than traditional music.
 */
export function ProceduralAmbientPlayer() {
  const { phase, isHydrated } = useTemporal();
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.12);
  const [showControls, setShowControls] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  // Handle play/pause
  const togglePlay = useCallback(async () => {
    const ambient = getAmbientSound();
    
    if (isPlaying) {
      ambient.stop();
      setIsPlaying(false);
    } else {
      await ambient.play(phase, volume);
      setIsPlaying(true);
      setHasInteracted(true);
    }
  }, [isPlaying, phase, volume]);
  
  // Update volume
  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
    const ambient = getAmbientSound();
    ambient.setVolume(newVolume);
  }, []);
  
  // Transition when phase changes
  useEffect(() => {
    if (isPlaying && hasInteracted) {
      const ambient = getAmbientSound();
      ambient.transitionToPhase(phase);
    }
  }, [phase, isPlaying, hasInteracted]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const ambient = getAmbientSound();
      ambient.dispose();
    };
  }, []);
  
  if (!isHydrated) return null;
  
  return (
    <div 
      className="fixed bottom-6 right-6 z-50"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full right-0 mb-3 p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] backdrop-blur-xl"
            style={{ minWidth: "180px" }}
          >
            <div className="text-xs text-[var(--fg-muted)] mb-3 tracking-wide">
              Ambient Tones
            </div>
            
            {/* Volume slider */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs opacity-50">◐</span>
              <input
                type="range"
                min="0"
                max="0.3"
                step="0.01"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="flex-1 h-1 appearance-none bg-[var(--muted)] rounded-full cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-3
                  [&::-webkit-slider-thumb]:h-3
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-[var(--fg)]
                  [&::-webkit-slider-thumb]:cursor-pointer"
              />
              <span className="text-xs opacity-50">●</span>
            </div>
            
            {/* Phase indicator */}
            <div className="text-xs text-[var(--fg-muted)] opacity-60">
              Tuned to {phase}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Main toggle button */}
      <motion.button
        onClick={togglePlay}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`
          w-12 h-12 rounded-full flex items-center justify-center
          transition-all duration-300 backdrop-blur-xl
          ${isPlaying 
            ? "bg-[var(--fg)]/10 border border-[var(--fg)]/20" 
            : "bg-[var(--card-bg)] border border-[var(--card-border)]"
          }
        `}
        aria-label={isPlaying ? "Stop ambient sound" : "Play ambient sound"}
      >
        {isPlaying ? (
          // Sound waves animation
          <div className="flex items-center gap-0.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-0.5 bg-[var(--fg)]"
                animate={{
                  height: [8, 16, 8],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        ) : (
          // Sound off icon
          <svg 
            width="18" 
            height="18" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.5"
            className="text-[var(--fg-muted)]"
          >
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <path d="M23 9l-6 6M17 9l6 6" />
          </svg>
        )}
      </motion.button>
    </div>
  );
}
