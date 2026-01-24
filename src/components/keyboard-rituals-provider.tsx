"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  useKeyboardRituals,
  PauseOverlay,
  ZenModeIndicator,
  BreathingExercise,
} from "@/components/keyboard-rituals";
import {
  useEasterEggs,
  EasterEggDiscovery,
  VoidMessage,
} from "@/components/easter-eggs-ui";

/**
 * KeyboardRitualsProvider - Global provider for keyboard shortcuts and easter eggs
 * 
 * Shortcuts:
 * - Space: Pause time
 * - Escape: Zen mode / close overlays
 * - B: Breathing exercise
 * - O: Oracle (random wisdom)
 * - R: Random writing
 * - /: Search
 */
export function KeyboardRitualsProvider({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const router = useRouter();
  
  const handleAction = useCallback((action: string) => {
    switch (action) {
      case "oracle":
        // Navigate to oracle/conduit
        router.push("/conduit");
        break;
      case "random":
        // Navigate to random writing
        router.push("/path/random");
        break;
      case "search":
        // Focus search or navigate to archive
        router.push("/archive");
        break;
    }
  }, [router]);
  
  const {
    isPaused,
    isZenMode,
    isBreathing,
    togglePause,
    stopBreathing,
  } = useKeyboardRituals(handleAction);
  
  const {
    discoveredEgg,
    dismissDiscovery,
    isInVoid,
  } = useEasterEggs();
  
  return (
    <>
      {/* Zen mode hides UI elements */}
      <div className={isZenMode ? "zen-mode-active" : ""}>
        {children}
      </div>
      
      {/* Overlays */}
      <PauseOverlay isVisible={isPaused} onDismiss={togglePause} />
      <ZenModeIndicator isActive={isZenMode} />
      <BreathingExercise isActive={isBreathing} onComplete={stopBreathing} />
      
      {/* Easter eggs */}
      <EasterEggDiscovery eggId={discoveredEgg} onDismiss={dismissDiscovery} />
      <VoidMessage isVisible={isInVoid} />
    </>
  );
}
