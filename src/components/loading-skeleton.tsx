"use client";

import { useState, useEffect } from "react";

interface SkeletonProps {
  className?: string;
  animate?: boolean;
}

export function Skeleton({ className = "", animate = true }: SkeletonProps) {
  return (
    <div 
      className={`bg-zinc-800/50 rounded ${animate ? "skeleton" : ""} ${className}`}
      aria-hidden="true"
    />
  );
}

export function WritingCardSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-800/40 bg-zinc-900/40 p-6 animate-pulse">
      <Skeleton className="w-20 h-3 mb-3" />
      <Skeleton className="w-3/4 h-6 mb-3" />
      <Skeleton className="w-full h-4 mb-2" />
      <Skeleton className="w-2/3 h-4" />
      <div className="mt-4 pt-4 border-t border-zinc-800/30 flex items-center gap-2">
        <Skeleton className="w-12 h-3" />
      </div>
    </div>
  );
}

export function WritingListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-4 animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
          <Skeleton className="w-2 h-2 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="w-2/3 h-5" />
            <Skeleton className="w-1/3 h-3" />
          </div>
          <Skeleton className="w-16 h-4 shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function PageLoadingSkeleton() {
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), 500);
    return () => clearTimeout(timer);
  }, []);
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center animate-fade-out" style={{ animationDelay: "300ms", animationDuration: "200ms", animationFillMode: "forwards" }}>
      <div className="relative">
        {/* Pulsing dot */}
        <div className="w-3 h-3 rounded-full bg-zinc-600 animate-ping" />
        <div className="absolute inset-0 w-3 h-3 rounded-full bg-zinc-500" />
      </div>
    </div>
  );
}

// Lazy image with blur placeholder
interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function LazyImage({ src, alt, className = "" }: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!isLoaded && !error && (
        <div className="absolute inset-0 skeleton" />
      )}
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/50">
          <span className="text-zinc-600 text-xs">Failed to load</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setError(true)}
          className={`transition-opacity duration-500 ${isLoaded ? "opacity-100" : "opacity-0"}`}
        />
      )}
    </div>
  );
}

// Progressive content reveal
interface ProgressiveRevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function ProgressiveReveal({ children, delay = 0, className = "" }: ProgressiveRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  
  return (
    <div 
      className={`transition-all duration-700 ${className} ${
        isVisible 
          ? "opacity-100 translate-y-0 blur-0" 
          : "opacity-0 translate-y-4 blur-sm"
      }`}
    >
      {children}
    </div>
  );
}
