"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

type ThemeMode = "midnight" | "twilight" | "dawn";

interface ThemeConfig {
  name: string;
  icon: string;
  filter: string;
  bgOpacity: number;
  description: string;
}

// SVG Icons for themes
const ThemeIcon = ({ mode }: { mode: ThemeMode }) => {
  if (mode === "midnight") {
    return (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
    );
  }
  if (mode === "twilight") {
    return (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 3v1M12 20v1M4.22 4.22l.7.7M18.36 18.36l.7.7M1 12h1M22 12h1M4.22 19.78l.7-.7M18.36 5.64l.7-.7" />
      <circle cx="12" cy="12" r="5" />
      <path d="M12 7v0M12 17v0" />
    </svg>
  );
};

const THEMES: Record<ThemeMode, ThemeConfig> = {
  midnight: {
    name: "Midnight",
    icon: "midnight",
    filter: "none",
    bgOpacity: 1,
    description: "The original darkness",
  },
  twilight: {
    name: "Twilight",
    icon: "twilight",
    filter: "brightness(1.12) contrast(0.96)",
    bgOpacity: 0.85,
    description: "Softened shadows",
  },
  dawn: {
    name: "Dawn",
    icon: "dawn",
    filter: "brightness(1.25) contrast(0.92) saturate(1.05)",
    bgOpacity: 0.7,
    description: "Gentle awakening",
  },
};

const STORAGE_KEY = "afterstill-theme-mode";

export function ThemeSoftener() {
  const [mode, setMode] = useState<ThemeMode>("midnight");
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load saved preference
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (saved && THEMES[saved]) {
      setMode(saved);
      applyTheme(saved);
    }
  }, []);

  // Apply theme to document
  const applyTheme = useCallback((newMode: ThemeMode) => {
    const config = THEMES[newMode];
    const root = document.documentElement;
    
    // Apply CSS filter to main content (not fixed elements)
    root.style.setProperty("--theme-filter", config.filter);
    root.style.setProperty("--theme-bg-opacity", config.bgOpacity.toString());
    
    // Add/remove class for additional CSS hooks
    root.classList.remove("theme-midnight", "theme-twilight", "theme-dawn");
    root.classList.add(`theme-${newMode}`);
    
    // Apply filter to body's children, not body itself (to avoid affecting fixed overlays)
    const mainContent = document.querySelector("main");
    if (mainContent) {
      (mainContent as HTMLElement).style.filter = config.filter;
    }
  }, []);

  const changeTheme = useCallback((newMode: ThemeMode) => {
    setMode(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
    applyTheme(newMode);
    setIsOpen(false);
  }, [applyTheme]);

  // Keyboard shortcut: Shift + T to cycle themes
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === "T") {
        const modes: ThemeMode[] = ["midnight", "twilight", "dawn"];
        const currentIndex = modes.indexOf(mode);
        const nextMode = modes[(currentIndex + 1) % modes.length];
        changeTheme(nextMode);
      }
    };
    
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [mode, changeTheme]);

  if (!mounted) return null;

  return (
    <>
      {/* Theme Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-6 right-6 z-[150] w-10 h-10 rounded-full border border-foreground/10 bg-background/50 backdrop-blur-md flex items-center justify-center hover:border-foreground/20 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Change theme brightness (Shift+T)"
      >
        <ThemeIcon mode={mode} />
      </motion.button>

      {/* Theme Selector Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[149] bg-black/20 backdrop-blur-sm"
            />
            
            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="fixed top-20 right-6 z-[150] w-64 p-4 rounded-xl border border-foreground/10 bg-background/95 backdrop-blur-xl shadow-2xl"
            >
              <p className="text-[9px] font-mono tracking-[0.3em] uppercase text-foreground/40 mb-3">
                Atmosphere
              </p>
              
              <div className="space-y-2">
                {(Object.entries(THEMES) as [ThemeMode, ThemeConfig][]).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => changeTheme(key)}
                    className={`w-full p-3 rounded-lg border transition-all text-left ${
                      mode === key
                        ? "border-foreground/30 bg-foreground/10"
                        : "border-foreground/5 bg-foreground/5 hover:border-foreground/15"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-foreground/60"><ThemeIcon mode={key} /></div>
                      <div>
                        <p className="text-sm font-medium text-foreground/80">
                          {config.name}
                        </p>
                        <p className="text-[10px] text-foreground/40">
                          {config.description}
                        </p>
                      </div>
                      {mode === key && (
                        <motion.div
                          layoutId="theme-indicator"
                          className="ml-auto w-1.5 h-1.5 rounded-full bg-foreground/50"
                        />
                      )}
                    </div>
                  </button>
                ))}
              </div>
              
              <p className="text-[8px] text-foreground/20 text-center mt-4 font-mono">
                Shift + T to cycle
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
