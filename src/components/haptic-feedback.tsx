"use client";

import { useCallback, useEffect, useState } from "react";

// Check if device supports haptic feedback
const supportsHaptic = typeof window !== "undefined" && "vibrate" in navigator;

// Haptic patterns
export const HapticPatterns = {
  light: [10],
  medium: [20],
  heavy: [40],
  success: [10, 50, 10],
  error: [50, 100, 50],
  selection: [5],
  impact: [30],
  notification: [10, 30, 10, 30, 10],
} as const;

type HapticPattern = keyof typeof HapticPatterns;

// Trigger haptic feedback
export function triggerHaptic(pattern: HapticPattern = "light") {
  if (supportsHaptic) {
    try {
      navigator.vibrate(HapticPatterns[pattern]);
    } catch {
      // Silently fail if vibration is not available
    }
  }
}

// Hook for haptic feedback
export function useHaptic() {
  const trigger = useCallback((pattern: HapticPattern = "light") => {
    triggerHaptic(pattern);
  }, []);
  
  return { trigger, supportsHaptic };
}

// Touch ripple effect component
interface TouchRippleProps {
  children: React.ReactNode;
  className?: string;
  haptic?: HapticPattern | false;
  disabled?: boolean;
  onClick?: () => void;
}

export function TouchRipple({ 
  children, 
  className = "", 
  haptic = "light",
  disabled = false,
  onClick 
}: TouchRippleProps) {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    
    setRipples(prev => [...prev, { x, y, id }]);
    
    if (haptic) {
      triggerHaptic(haptic);
    }
    
    onClick?.();
    
    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, 600);
  }, [disabled, haptic, onClick]);
  
  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      onClick={handleClick}
    >
      {children}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute pointer-events-none rounded-full bg-white/10 animate-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}
      <style jsx>{`
        @keyframes ripple {
          0% {
            width: 0;
            height: 0;
            opacity: 0.5;
          }
          100% {
            width: 200px;
            height: 200px;
            opacity: 0;
          }
        }
        .animate-ripple {
          animation: ripple 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

// Pull to refresh hook
interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
}

export function usePullToRefresh({ onRefresh, threshold = 80 }: UsePullToRefreshOptions) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  useEffect(() => {
    let startY = 0;
    let currentY = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
        setIsPulling(true);
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling) return;
      
      currentY = e.touches[0].clientY;
      const distance = Math.max(0, (currentY - startY) * 0.5);
      setPullDistance(Math.min(distance, threshold * 1.5));
      
      if (distance > threshold) {
        triggerHaptic("medium");
      }
    };
    
    const handleTouchEnd = async () => {
      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        triggerHaptic("success");
        
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }
      
      setIsPulling(false);
      setPullDistance(0);
    };
    
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd);
    
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh]);
  
  return { isPulling, pullDistance, isRefreshing, threshold };
}

// Swipe gesture hook
interface UseSwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
}

export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
}: UseSwipeOptions) {
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    });
  }, []);
  
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
    };
    
    const diffX = touchStart.x - touchEnd.x;
    const diffY = touchStart.y - touchEnd.y;
    
    const isHorizontal = Math.abs(diffX) > Math.abs(diffY);
    
    if (isHorizontal) {
      if (diffX > threshold) {
        triggerHaptic("selection");
        onSwipeLeft?.();
      } else if (diffX < -threshold) {
        triggerHaptic("selection");
        onSwipeRight?.();
      }
    } else {
      if (diffY > threshold) {
        triggerHaptic("selection");
        onSwipeUp?.();
      } else if (diffY < -threshold) {
        triggerHaptic("selection");
        onSwipeDown?.();
      }
    }
  }, [touchStart, threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);
  
  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
    },
  };
}
