"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  createWhisperController,
  tokenizeForWhisper,
  generateRevealMask,
  type WhisperState,
} from "@/lib/whisper-mode";

/**
 * useWhisperMode - Hook for whisper-based text revelation
 */
export function useWhisperMode(text: string) {
  const [state, setState] = useState<WhisperState>({
    revealProgress: 0,
    lastAcceleration: 0,
    isWhispering: false,
    revealedWords: 0,
    totalWords: 0,
  });
  
  const controllerRef = useRef(createWhisperController());
  const [hasPermission, setHasPermission] = useState(false);
  const [needsPermission, setNeedsPermission] = useState(false);
  
  // Initialize with text
  useEffect(() => {
    const { total } = tokenizeForWhisper(text);
    controllerRef.current.init(total);
  }, [text]);
  
  // Subscribe to state changes
  useEffect(() => {
    return controllerRef.current.subscribe(setState);
  }, []);
  
  // Check for permission requirement (iOS)
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    if (typeof (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === "function") {
      setNeedsPermission(true);
    } else {
      setHasPermission(true);
    }
  }, []);
  
  // Handle device motion
  useEffect(() => {
    if (!hasPermission) return;
    
    function handleMotion(event: DeviceMotionEvent) {
      const acc = event.accelerationIncludingGravity;
      if (acc && acc.x !== null && acc.y !== null && acc.z !== null) {
        controllerRef.current.processMotion({
          x: acc.x,
          y: acc.y,
          z: acc.z,
        });
      }
    }
    
    window.addEventListener("devicemotion", handleMotion);
    return () => window.removeEventListener("devicemotion", handleMotion);
  }, [hasPermission]);
  
  const requestPermission = useCallback(async () => {
    try {
      const DeviceMotion = DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> };
      if (typeof DeviceMotion.requestPermission === "function") {
        const result = await DeviceMotion.requestPermission();
        if (result === "granted") {
          setHasPermission(true);
          setNeedsPermission(false);
        }
      }
    } catch {
      // Permission denied
    }
  }, []);
  
  return {
    ...state,
    controller: controllerRef.current,
    hasPermission,
    needsPermission,
    requestPermission,
  };
}

/**
 * WhisperText - Text that reveals based on device movement
 */
export function WhisperText({
  text,
  className = "",
  revealPattern = "linear",
  onComplete,
}: {
  text: string;
  className?: string;
  revealPattern?: "linear" | "random" | "center";
  onComplete?: () => void;
}) {
  const {
    revealProgress,
    revealedWords,
    isWhispering,
    needsPermission,
    hasPermission,
    requestPermission,
    controller,
  } = useWhisperMode(text);
  
  const { words, total } = tokenizeForWhisper(text);
  const mask = generateRevealMask(total, revealedWords, revealPattern);
  
  // Track completion
  const completedRef = useRef(false);
  useEffect(() => {
    if (revealProgress >= 100 && !completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  }, [revealProgress, onComplete]);
  
  // Track actual word index (excluding whitespace)
  let wordIndex = 0;
  
  return (
    <div className={className}>
      {/* Permission request */}
      {needsPermission && !hasPermission && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={requestPermission}
          className="mb-4 px-4 py-2 rounded-lg border border-white/20 bg-white/5 text-sm text-white/70 w-full"
        >
          Enable motion sensors to whisper
        </motion.button>
      )}
      
      {/* Progress indicator */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex-1 h-px bg-white/10 overflow-hidden">
          <motion.div
            className="h-full bg-white/30"
            animate={{ width: `${revealProgress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <span className="text-[10px] font-mono text-white/30">
          {Math.round(revealProgress)}%
        </span>
      </div>
      
      {/* Whisper indicator */}
      <AnimatePresence>
        {isWhispering && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-2 text-xs text-white/40 text-center"
          >
            ✧ listening... ✧
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* The text */}
      <p className="leading-relaxed" style={{ fontFamily: "var(--font-cormorant), serif" }}>
        {words.map((word, i) => {
          const isWhitespace = !word.text.trim();
          const isRevealed = isWhitespace || mask[wordIndex];
          
          if (!isWhitespace) {
            wordIndex++;
          }
          
          return (
            <motion.span
              key={i}
              initial={{ opacity: 0 }}
              animate={{
                opacity: isRevealed ? 1 : 0.1,
                filter: isRevealed ? "blur(0px)" : "blur(4px)",
              }}
              transition={{ duration: 0.3 }}
              className={isRevealed ? "text-white" : "text-white/20 select-none"}
            >
              {word.text}
            </motion.span>
          );
        })}
      </p>
      
      {/* Manual reveal button (fallback) */}
      {!hasPermission && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          onClick={() => controller.manualReveal(revealProgress + 10)}
          className="mt-6 w-full py-3 rounded-lg border border-white/20 text-white/50 text-sm"
        >
          Tap to reveal more
        </motion.button>
      )}
      
      {/* Quick reveal hint */}
      {hasPermission && revealProgress < 100 && (
        <p className="mt-4 text-[10px] text-white/20 text-center font-mono">
          Move device closer to reveal
        </p>
      )}
    </div>
  );
}

/**
 * WhisperVoidResponse - Special styling for oracle responses
 */
export function WhisperVoidResponse({
  response,
  quote,
  cosmicContext,
}: {
  response: string;
  quote?: string | null;
  cosmicContext?: string;
}) {
  const [isRevealed, setIsRevealed] = useState(false);
  
  return (
    <div className="space-y-6">
      {/* Cosmic context */}
      {cosmicContext && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          className="text-xs text-center italic text-white/40"
        >
          {cosmicContext}
        </motion.p>
      )}
      
      {/* Main response */}
      <WhisperText
        text={response}
        className="text-lg text-center"
        revealPattern="center"
        onComplete={() => setIsRevealed(true)}
      />
      
      {/* Quote from writing */}
      <AnimatePresence>
        {isRevealed && quote && (
          <motion.blockquote
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="border-l-2 border-white/20 pl-4 text-sm text-white/50 italic"
          >
            {quote}
          </motion.blockquote>
        )}
      </AnimatePresence>
    </div>
  );
}
