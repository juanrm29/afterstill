"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  getMostRecentReading, 
  getContinueMessage,
  type ReadingProgress 
} from "@/lib/reading-progress";

/**
 * ContinueReadingPrompt - Gentle reminder to continue where you left off
 */
export function ContinueReadingPrompt() {
  const [recentReading, setRecentReading] = useState<ReadingProgress | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  
  useEffect(() => {
    // Check for recent reading after mount
    const recent = getMostRecentReading();
    if (recent && recent.scrollPercentage > 5 && recent.scrollPercentage < 90) {
      setRecentReading(recent);
      // Show after a delay
      setTimeout(() => setIsVisible(true), 3000);
    }
  }, []);
  
  const handleContinue = useCallback(() => {
    if (recentReading) {
      window.location.href = `/reading/${recentReading.slug}`;
    }
  }, [recentReading]);
  
  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => setIsDismissed(true), 300);
  }, []);
  
  if (!recentReading || isDismissed) return null;
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 left-6 z-50 max-w-sm"
        >
          <div className="p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] backdrop-blur-xl shadow-2xl">
            {/* Progress bar */}
            <div className="h-0.5 bg-[var(--muted)] rounded-full mb-3 overflow-hidden">
              <motion.div 
                className="h-full bg-[var(--fg-muted)]"
                initial={{ width: 0 }}
                animate={{ width: `${recentReading.scrollPercentage}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
              />
            </div>
            
            {/* Message */}
            <p className="text-sm text-[var(--fg-muted)] mb-3">
              {getContinueMessage(recentReading)}
            </p>
            
            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleContinue}
                className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--fg)]/10 text-[var(--fg)] text-xs font-medium hover:bg-[var(--fg)]/20 transition-colors"
              >
                Continue
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 rounded-lg text-[var(--fg-muted)] text-xs hover:text-[var(--fg)] transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * ReadingProgressBar - Shows current reading progress
 */
export function ReadingProgressBar({ 
  progress,
  className = "",
}: { 
  progress: number;
  className?: string;
}) {
  return (
    <div className={`h-0.5 bg-[var(--muted)] rounded-full overflow-hidden ${className}`}>
      <motion.div 
        className="h-full bg-gradient-to-r from-[var(--fg-muted)] to-[var(--fg)]"
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, progress)}%` }}
        transition={{ duration: 0.3 }}
      />
    </div>
  );
}

/**
 * ReadingMilestone - Celebrates reading milestones
 */
export function ReadingMilestone({ 
  milestone,
  onDismiss,
}: { 
  milestone: "25" | "50" | "75" | "100";
  onDismiss: () => void;
}) {
  const messages = {
    "25": "A quarter through. The journey unfolds.",
    "50": "Halfway. The words are settling.",
    "75": "Almost there. The end approaches.",
    "100": "Complete. This one lives in you now.",
  };
  
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50"
    >
      <div className="px-6 py-3 rounded-full bg-[var(--card-bg)] border border-[var(--card-border)] backdrop-blur-xl">
        <p className="text-sm text-[var(--fg)]">
          {messages[milestone]}
        </p>
      </div>
    </motion.div>
  );
}
