"use client";

import { useEffect, useRef, useCallback } from "react";
import { useConduit } from "./conduit-provider";
import type { WritingPreview } from "@/lib/conduit-protocol";

interface SyncReadingProps {
  writing: {
    id: string;
    slug: string;
    title: string;
    content?: string;
  };
}

/**
 * SyncReading - Syncs scroll progress with connected wand device
 * Wraps around reading content to track and broadcast progress
 */
export function SyncReading({ writing }: SyncReadingProps) {
  const conduit = useConduit();
  const containerRef = useRef<HTMLDivElement>(null);
  const lastProgressRef = useRef(0);
  const throttleRef = useRef<NodeJS.Timeout | null>(null);
  
  // Calculate scroll progress
  const calculateProgress = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    
    if (docHeight <= 0) return 0;
    return Math.min(100, Math.max(0, (scrollTop / docHeight) * 100));
  }, []);
  
  // Send initial writing info to wand
  useEffect(() => {
    if (!conduit?.isConnected) return;
    
    const writingPreview: WritingPreview = {
      id: writing.id,
      slug: writing.slug,
      title: writing.title,
      excerpt: writing.content?.slice(0, 150),
    };
    
    conduit.setCurrentWriting(writingPreview);
    
    return () => {
      conduit.setCurrentWriting(null);
    };
  }, [conduit, writing]);
  
  // Track scroll progress with throttling
  useEffect(() => {
    if (!conduit?.isConnected) return;
    
    const handleScroll = () => {
      if (throttleRef.current) return;
      
      throttleRef.current = setTimeout(() => {
        const progress = calculateProgress();
        
        // Only send if changed significantly
        if (Math.abs(progress - lastProgressRef.current) > 1) {
          lastProgressRef.current = progress;
          conduit.updateReadingProgress(progress);
        }
        
        throttleRef.current = null;
      }, 100);
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    
    // Send initial progress
    handleScroll();
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (throttleRef.current) clearTimeout(throttleRef.current);
    };
  }, [conduit, calculateProgress]);
  
  // Connection indicator (subtle)
  if (!conduit?.isConnected) return null;
  
  return (
    <div ref={containerRef} className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-green-500/20 bg-green-500/5 backdrop-blur-sm">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        <span className="text-[9px] font-mono text-green-500/70 uppercase tracking-wider">
          Synced
        </span>
      </div>
    </div>
  );
}

/**
 * SyncReadingMobile - Minimal mobile reading view
 * Shows condensed text for focused reading while laptop shows full visuals
 */
export function SyncReadingMobile({ 
  title, 
  progress,
  onScrollRequest 
}: { 
  title: string; 
  progress: number;
  onScrollRequest?: (direction: "up" | "down") => void;
}) {
  return (
    <div className="p-4 text-center">
      <p className="text-[10px] font-mono text-white/30 mb-2">READING</p>
      <h2 
        className="text-xl mb-4"
        style={{ fontFamily: "var(--font-cormorant), serif" }}
      >
        {title}
      </h2>
      
      {/* Progress bar */}
      <div className="w-full max-w-[200px] mx-auto mb-4">
        <div className="h-0.5 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white/50 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-[9px] font-mono text-white/30 mt-1">
          {Math.round(progress)}%
        </p>
      </div>
      
      {/* Scroll controls */}
      {onScrollRequest && (
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => onScrollRequest("up")}
            className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center"
          >
            ↑
          </button>
          <button
            onClick={() => onScrollRequest("down")}
            className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center"
          >
            ↓
          </button>
        </div>
      )}
    </div>
  );
}
