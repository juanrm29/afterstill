"use client";

import { useState, useRef, useEffect } from "react";

// Melancholic ambient playlist - royalty free / creative commons
const playlist = [
  {
    id: 1,
    title: "Weightless",
    artist: "Marconi Union",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", // Placeholder - replace with actual
  },
  {
    id: 2,
    title: "Nocturne",
    artist: "The Archive",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  },
  {
    id: 3,
    title: "Fragments",
    artist: "Afterstill",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  },
];

export default function AmbientMusic() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [volume, setVolume] = useState(0.3);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio only on client
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const audio = new Audio();
    audio.volume = volume;
    audio.loop = false;
    audio.preload = "metadata";
    audioRef.current = audio;
    
    const handleEnded = () => {
      setCurrentTrack((prev) => (prev + 1) % playlist.length);
    };
    
    const handleCanPlay = () => {
      setIsLoaded(true);
    };
    
    const handleError = (e: ErrorEvent) => {
      console.log("Audio load error - using placeholder URL");
    };
    
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("canplaythrough", handleCanPlay);
    audio.addEventListener("error", handleError as any);
    
    // Set initial source
    audio.src = playlist[currentTrack].url;

    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("canplaythrough", handleCanPlay);
      audio.removeEventListener("error", handleError as any);
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  // Handle track change
  useEffect(() => {
    if (audioRef.current && hasInteracted) {
      audioRef.current.src = playlist[currentTrack].url;
      if (isPlaying) {
        audioRef.current.play().catch((err) => {
          console.log("Playback prevented:", err.message);
        });
      }
    }
  }, [currentTrack, hasInteracted]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    if (!hasInteracted) setHasInteracted(true);
    
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => {});
      }
      setIsPlaying(!isPlaying);
    }
  };

  const nextTrack = () => {
    setCurrentTrack((prev) => (prev + 1) % playlist.length);
  };

  const prevTrack = () => {
    setCurrentTrack((prev) => (prev - 1 + playlist.length) % playlist.length);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[200]">
      {/* Collapsed state - just a music icon */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          relative w-10 h-10 rounded-full border transition-all duration-500
          ${isExpanded 
            ? "border-foreground/30 bg-background/90 backdrop-blur-sm" 
            : "border-foreground/10 bg-background/50 hover:border-foreground/20"
          }
          ${isPlaying ? "animate-pulse" : ""}
        `}
        style={{ animationDuration: "3s" }}
      >
        {/* Sound waves animation when playing */}
        {isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center gap-0.5">
            <div className="w-0.5 h-2 bg-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-0.5 h-3 bg-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-0.5 h-2 bg-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        )}
        
        {/* Music icon when not playing */}
        {!isPlaying && (
          <svg 
            className="w-4 h-4 absolute inset-0 m-auto text-foreground/40"
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        )}
      </button>

      {/* Expanded player */}
      {isExpanded && (
        <div 
          className="absolute bottom-12 right-0 w-64 p-4 rounded-xl border border-foreground/10 bg-background/95 backdrop-blur-md shadow-2xl"
          style={{
            animation: "fadeIn 0.3s ease-out",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-[9px] font-mono tracking-[0.3em] uppercase text-foreground/40">
              Ambient Reading
            </span>
            <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? "bg-green-500/70" : "bg-foreground/20"}`} />
          </div>

          {/* Track info */}
          <div className="mb-4">
            <p 
              className="text-sm text-foreground/80 mb-1 truncate"
              style={{ fontFamily: "var(--font-cormorant), serif" }}
            >
              {playlist[currentTrack].title}
            </p>
            <p className="text-[10px] font-mono text-foreground/40 tracking-wider">
              {playlist[currentTrack].artist}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <button 
              onClick={prevTrack}
              className="text-foreground/40 hover:text-foreground/70 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
              </svg>
            </button>
            
            <button 
              onClick={togglePlay}
              className="w-10 h-10 rounded-full border border-foreground/20 flex items-center justify-center hover:border-foreground/40 transition-all hover:scale-105"
            >
              {isPlaying ? (
                <svg className="w-4 h-4 text-foreground/70" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
              ) : (
                <svg className="w-4 h-4 text-foreground/70 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>
            
            <button 
              onClick={nextTrack}
              className="text-foreground/40 hover:text-foreground/70 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
              </svg>
            </button>
          </div>

          {/* Volume slider */}
          <div className="flex items-center gap-2">
            <svg className="w-3 h-3 text-foreground/30" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
            </svg>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="flex-1 h-1 bg-foreground/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground/50"
            />
            <span className="text-[9px] font-mono text-foreground/30 w-6 text-right">
              {Math.round(volume * 100)}
            </span>
          </div>

          {/* Playlist hint */}
          <p className="text-[8px] text-foreground/20 text-center mt-3 font-mono">
            {currentTrack + 1} / {playlist.length} tracks
          </p>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
