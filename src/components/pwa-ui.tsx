"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePWASafe } from "./pwa-provider";

// ============================================================================
// Install Prompt Banner
// ============================================================================
export function InstallPromptBanner() {
  const pwa = usePWASafe();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has dismissed before
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      const dismissedTime = Number.parseInt(dismissed, 10);
      // Show again after 7 days
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        setIsDismissed(true);
        return;
      }
    }

    // Delay showing banner for better UX
    const timer = setTimeout(() => {
      if (pwa?.isInstallable && !pwa.isInstalled) {
        setShowBanner(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [pwa?.isInstallable, pwa?.isInstalled]);

  const handleInstall = async () => {
    if (pwa?.installApp) {
      await pwa.installApp();
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setIsDismissed(true);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  if (!showBanner || isDismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md"
      >
        <div className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-2xl p-4 shadow-2xl">
          <div className="flex items-start gap-3">
            {/* App Icon */}
            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-zinc-700 to-zinc-800 flex items-center justify-center shrink-0">
              <svg
                className="w-6 h-6 text-zinc-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
                />
              </svg>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-zinc-100">
                Install Afterstill
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Add to your home screen for a better reading experience
              </p>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleInstall}
                  className="px-3 py-1.5 text-xs font-medium bg-white text-black rounded-lg hover:bg-zinc-200 transition-colors"
                >
                  Install
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Not now
                </button>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================================================
// Update Available Banner
// ============================================================================
export function UpdateBanner() {
  const pwa = usePWASafe();

  if (!pwa?.hasUpdate) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-md"
      >
        <div className="bg-blue-950/95 backdrop-blur-xl border border-blue-800/50 rounded-xl p-3 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm text-blue-100">A new version is available</p>
            </div>
            <button
              onClick={() => pwa.updateApp()}
              className="px-3 py-1.5 text-xs font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition-colors"
            >
              Update
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================================================
// Offline Indicator
// ============================================================================
export function OfflineIndicator() {
  const pwa = usePWASafe();
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    // Only show after initial load
    const timer = setTimeout(() => {
      if (pwa?.isOnline === false) {
        setShowIndicator(true);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [pwa?.isOnline]);

  // Update when online status changes
  useEffect(() => {
    if (pwa?.isOnline === false) {
      setShowIndicator(true);
    } else {
      // Delay hiding to show "back online" message
      const timer = setTimeout(() => setShowIndicator(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [pwa?.isOnline]);

  return (
    <AnimatePresence>
      {showIndicator && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
        >
          <div
            className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-lg ${
              pwa?.isOnline
                ? "bg-green-950/90 text-green-200 border border-green-800/50"
                : "bg-amber-950/90 text-amber-200 border border-amber-800/50"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                pwa?.isOnline ? "bg-green-400 animate-pulse" : "bg-amber-400"
              }`}
            />
            {pwa?.isOnline ? "Back online" : "You're offline"}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// iOS Install Instructions
// ============================================================================
export function IOSInstallInstructions() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if iOS Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = (globalThis.navigator as Navigator & { standalone?: boolean }).standalone;
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);

    if (isIOS && isSafari && !isStandalone) {
      const dismissedBefore = localStorage.getItem("ios-install-dismissed");
      if (!dismissedBefore) {
        setTimeout(() => setShow(true), 5000);
      }
    }
  }, []);

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    localStorage.setItem("ios-install-dismissed", "true");
  };

  if (!show || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm"
      >
        <div className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-2xl p-4 shadow-2xl">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-zinc-100">Add to Home Screen</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Tap the{" "}
                <span className="inline-flex items-center">
                  <svg className="w-4 h-4 mx-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </span>{" "}
                share button, then &quot;Add to Home Screen&quot;
              </p>
              <button
                onClick={handleDismiss}
                className="mt-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Got it
              </button>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================================================
// Combined PWA UI Component
// ============================================================================
export function PWAUI() {
  return (
    <>
      <InstallPromptBanner />
      <UpdateBanner />
      <OfflineIndicator />
      <IOSInstallInstructions />
    </>
  );
}

export default PWAUI;
