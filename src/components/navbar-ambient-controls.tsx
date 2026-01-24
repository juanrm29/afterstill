"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTemporal } from "./consciousness-provider";
import { getAmbientSound } from "@/lib/ambient-sound";

/**
 * NavbarAmbientControls - Compact ambient sound & music controls for navbar
 */
export function NavbarAmbientControls() {
  const { phase, isHydrated } = useTemporal();
  
  // Ambient sound state
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);
  const ambientVolume = 0.12;
  
  // Music state
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.3);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [showMusicPanel, setShowMusicPanel] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Playlist
  const playlist = useMemo(() => [
    { title: "Forest Rain", artist: "Nature Sounds", url: "https://archive.org/download/rainforest_sounds/rain-on-leaves.mp3" },
    { title: "Ocean Waves", artist: "Ocean Sounds", url: "https://archive.org/download/ocean-waves-sounds/ocean-waves.mp3" },
    { title: "Night Ambient", artist: "Ethereal", url: "https://archive.org/download/night-ambient-sounds/night-ambient.mp3" },
  ], []);

  // Initialize audio
  useEffect(() => {
    if (globalThis.window !== undefined) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
      audioRef.current.volume = musicVolume;
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [musicVolume]);

  // Handle ambient toggle
  const toggleAmbient = useCallback(async () => {
    const ambient = getAmbientSound();
    if (isAmbientPlaying) {
      ambient.stop();
      setIsAmbientPlaying(false);
    } else {
      await ambient.play(phase, ambientVolume);
      setIsAmbientPlaying(true);
    }
  }, [isAmbientPlaying, phase, ambientVolume]);

  // Handle music toggle
  const toggleMusic = useCallback(() => {
    if (!audioRef.current) return;
    
    if (isMusicPlaying) {
      audioRef.current.pause();
      setIsMusicPlaying(false);
    } else {
      if (!audioRef.current.src) {
        audioRef.current.src = playlist[currentTrack].url;
      }
      audioRef.current.play().catch(() => setIsMusicPlaying(false));
      setIsMusicPlaying(true);
    }
  }, [isMusicPlaying, currentTrack, playlist]);

  // Update music volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = musicVolume;
    }
  }, [musicVolume]);

  // Transition ambient when phase changes
  useEffect(() => {
    if (isAmbientPlaying) {
      const ambient = getAmbientSound();
      ambient.transitionToPhase(phase);
    }
  }, [phase, isAmbientPlaying]);

  // Cleanup ambient on unmount
  useEffect(() => {
    return () => {
      const ambient = getAmbientSound();
      ambient.dispose();
    };
  }, []);

  if (!isHydrated) return null;

  return (
    <div className="flex items-center gap-1">
      {/* Ambient Sound Toggle */}
      <button
        onClick={toggleAmbient}
        className={`
          relative w-8 h-8 rounded-full flex items-center justify-center
          transition-all duration-300
          ${isAmbientPlaying 
            ? "bg-zinc-700/50 text-zinc-200" 
            : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
          }
        `}
        aria-label={isAmbientPlaying ? "Stop ambient sound" : "Play ambient sound"}
        title="Ambient tones"
      >
        {isAmbientPlaying ? (
          <div className="flex items-center gap-0.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-0.5 bg-current rounded-full"
                animate={{ height: [4, 10, 4] }}
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <path d="M23 9l-6 6M17 9l6 6" />
          </svg>
        )}
      </button>

      {/* Music Toggle */}
      <div className="relative">
        <button
          onClick={toggleMusic}
          onContextMenu={(e) => {
            e.preventDefault();
            setShowMusicPanel(!showMusicPanel);
          }}
          className={`
            relative w-8 h-8 rounded-full flex items-center justify-center
            transition-all duration-300
            ${isMusicPlaying 
              ? "bg-zinc-700/50 text-zinc-200" 
              : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
            }
          `}
          aria-label={isMusicPlaying ? "Pause music" : "Play music"}
          title="Music (right-click for options)"
        >
          {isMusicPlaying ? (
            <div className="flex items-center gap-0.5">
              <div className="w-0.5 h-2 bg-current animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-0.5 h-3 bg-current animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-0.5 h-2 bg-current animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          )}
        </button>

        {/* Music Panel (on right-click) */}
        <AnimatePresence>
          {showMusicPanel && (
            <motion.div
              initial={{ opacity: 0, y: 5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.95 }}
              className="absolute top-full right-0 mt-2 w-56 p-3 rounded-lg bg-zinc-900/95 border border-zinc-800 backdrop-blur-xl shadow-xl z-50"
              onMouseLeave={() => setShowMusicPanel(false)}
            >
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Now Playing</div>
              <p className="text-sm text-zinc-300 truncate">{playlist[currentTrack].title}</p>
              <p className="text-xs text-zinc-500 mb-3">{playlist[currentTrack].artist}</p>
              
              {/* Controls */}
              <div className="flex items-center justify-center gap-3 mb-3">
                <button
                  onClick={() => setCurrentTrack((prev) => (prev - 1 + playlist.length) % playlist.length)}
                  className="text-zinc-500 hover:text-zinc-300"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                  </svg>
                </button>
                <button
                  onClick={toggleMusic}
                  className="w-8 h-8 rounded-full border border-zinc-700 flex items-center justify-center hover:border-zinc-500"
                >
                  {isMusicPlaying ? (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={() => setCurrentTrack((prev) => (prev + 1) % playlist.length)}
                  className="text-zinc-500 hover:text-zinc-300"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                  </svg>
                </button>
              </div>

              {/* Volume */}
              <div className="flex items-center gap-2">
                <svg className="w-3 h-3 text-zinc-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3z" />
                </svg>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={musicVolume}
                  onChange={(e) => setMusicVolume(Number.parseFloat(e.target.value))}
                  className="flex-1 h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-2
                    [&::-webkit-slider-thumb]:h-2
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-zinc-400"
                />
                <span className="text-[9px] text-zinc-600 w-6 text-right">
                  {Math.round(musicVolume * 100)}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
