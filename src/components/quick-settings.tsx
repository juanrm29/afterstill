"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface UserPreferences {
  reducedMotion: boolean;
  ambientSound: boolean;
  cursorEffects: boolean;
  particleDensity: "none" | "subtle" | "normal" | "rich";
  fontSize: "small" | "normal" | "large";
}

const DEFAULT_PREFS: UserPreferences = {
  reducedMotion: false,
  ambientSound: false,
  cursorEffects: true,
  particleDensity: "subtle",
  fontSize: "normal",
};

const STORAGE_KEY = "afterstill-user-prefs";

// Context for settings
interface SettingsContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  prefs: UserPreferences;
  updatePref: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  resetPrefs: () => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within QuickSettings");
  }
  return context;
}

/**
 * QuickSettings - Settings provider and panel
 */
export function QuickSettings() {
  const [isOpen, setIsOpen] = useState(false);
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFS);
  const [mounted, setMounted] = useState(false);

  // Load preferences
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(saved) });
      }
    } catch {
      // ignore
    }
  }, []);

  // Apply preferences
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    // Reduced motion
    if (prefs.reducedMotion) {
      root.classList.add("reduce-motion");
    } else {
      root.classList.remove("reduce-motion");
    }

    // Cursor effects
    root.dataset.cursorEffects = String(prefs.cursorEffects);

    // Font size
    const fontScale = prefs.fontSize === "small" ? "0.9" : prefs.fontSize === "large" ? "1.15" : "1";
    root.style.setProperty("--user-font-scale", fontScale);

    // Particle density
    root.dataset.particles = prefs.particleDensity;

    // Save
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [prefs, mounted]);

  const updatePref = useCallback(<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetPrefs = useCallback(() => {
    setPrefs(DEFAULT_PREFS);
  }, []);

  if (!mounted) return null;

  return (
    <SettingsContext.Provider value={{ isOpen, setIsOpen, prefs, updatePref, resetPrefs }}>
      {/* Settings panel */}
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

            {/* Panel - positioned from top for navbar integration */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="fixed top-16 right-6 z-[150] w-72 p-5 rounded-xl border border-foreground/10 bg-background/95 backdrop-blur-xl shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-[9px] font-mono tracking-[0.3em] uppercase text-foreground/40">
                  Experience
                </p>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-foreground/30 hover:text-foreground/50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Reduced Motion */}
                <ToggleSetting
                  label="Reduced Motion"
                  description="Minimize animations"
                  checked={prefs.reducedMotion}
                  onChange={(v) => updatePref("reducedMotion", v)}
                />

                {/* Cursor Effects */}
                <ToggleSetting
                  label="Cursor Effects"
                  description="Trail and glow effects"
                  checked={prefs.cursorEffects}
                  onChange={(v) => updatePref("cursorEffects", v)}
                />

                {/* Ambient Sound */}
                <ToggleSetting
                  label="Ambient Sound"
                  description="Background audio"
                  checked={prefs.ambientSound}
                  onChange={(v) => updatePref("ambientSound", v)}
                />

                {/* Particle Density */}
                <div>
                  <p className="text-xs text-foreground/60 mb-2">Particle Density</p>
                  <div className="flex gap-1">
                    {(["none", "subtle", "normal", "rich"] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => updatePref("particleDensity", level)}
                        className={`flex-1 py-1.5 text-[10px] rounded border transition-colors ${
                          prefs.particleDensity === level
                            ? "border-foreground/30 bg-foreground/10 text-foreground/80"
                            : "border-foreground/5 text-foreground/40 hover:border-foreground/15"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Size */}
                <div>
                  <p className="text-xs text-foreground/60 mb-2">Reading Size</p>
                  <div className="flex gap-1">
                    {(["small", "normal", "large"] as const).map((size) => (
                      <button
                        key={size}
                        onClick={() => updatePref("fontSize", size)}
                        className={`flex-1 py-1.5 text-[10px] rounded border transition-colors ${
                          prefs.fontSize === size
                            ? "border-foreground/30 bg-foreground/10 text-foreground/80"
                            : "border-foreground/5 text-foreground/40 hover:border-foreground/15"
                        }`}
                      >
                        {size === "small" ? "A" : size === "normal" ? "A+" : "A++"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Reset */}
              <button
                onClick={resetPrefs}
                className="mt-4 w-full py-2 text-[10px] text-foreground/30 hover:text-foreground/50 transition-colors"
              >
                Reset to defaults
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </SettingsContext.Provider>
  );
}

/**
 * NavbarSettingsButton - Compact settings button for navbar
 */
export function NavbarSettingsButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFS);
  const [mounted, setMounted] = useState(false);

  // Load preferences
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(saved) });
      }
    } catch {
      // ignore
    }
  }, []);

  // Apply preferences
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    // Reduced motion
    if (prefs.reducedMotion) {
      root.classList.add("reduce-motion");
    } else {
      root.classList.remove("reduce-motion");
    }

    // Cursor effects
    root.dataset.cursorEffects = String(prefs.cursorEffects);

    // Font size
    const fontScale = prefs.fontSize === "small" ? "0.9" : prefs.fontSize === "large" ? "1.15" : "1";
    root.style.setProperty("--user-font-scale", fontScale);

    // Particle density
    root.dataset.particles = prefs.particleDensity;

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [prefs, mounted]);

  const updatePref = useCallback(<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  }, []);

  if (!mounted) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-8 h-8 rounded-full flex items-center justify-center
          transition-all duration-300
          ${isOpen 
            ? "bg-zinc-700/50 text-zinc-200" 
            : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
          }
        `}
        aria-label="Settings"
        title="Experience settings"
      >
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[149]"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-full right-0 mt-2 z-[150] w-72 p-5 rounded-xl border border-zinc-800 bg-zinc-900/95 backdrop-blur-xl shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-[9px] font-mono tracking-[0.3em] uppercase text-zinc-500">
                  Experience
                </p>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-zinc-600 hover:text-zinc-400"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <ToggleSetting
                  label="Reduced Motion"
                  description="Minimize animations"
                  checked={prefs.reducedMotion}
                  onChange={(v) => updatePref("reducedMotion", v)}
                />

                <ToggleSetting
                  label="Cursor Effects"
                  description="Trail and glow effects"
                  checked={prefs.cursorEffects}
                  onChange={(v) => updatePref("cursorEffects", v)}
                />

                <ToggleSetting
                  label="Ambient Sound"
                  description="Background audio"
                  checked={prefs.ambientSound}
                  onChange={(v) => updatePref("ambientSound", v)}
                />

                <div>
                  <p className="text-xs text-zinc-400 mb-2">Particle Density</p>
                  <div className="flex gap-1">
                    {(["none", "subtle", "normal", "rich"] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => updatePref("particleDensity", level)}
                        className={`flex-1 py-1.5 text-[10px] rounded border transition-colors ${
                          prefs.particleDensity === level
                            ? "border-zinc-600 bg-zinc-800 text-zinc-200"
                            : "border-zinc-800 text-zinc-500 hover:border-zinc-700"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-zinc-400 mb-2">Reading Size</p>
                  <div className="flex gap-1">
                    {(["small", "normal", "large"] as const).map((size) => (
                      <button
                        key={size}
                        onClick={() => updatePref("fontSize", size)}
                        className={`flex-1 py-1.5 text-[10px] rounded border transition-colors ${
                          prefs.fontSize === size
                            ? "border-zinc-600 bg-zinc-800 text-zinc-200"
                            : "border-zinc-800 text-zinc-500 hover:border-zinc-700"
                        }`}
                      >
                        {size === "small" ? "A" : size === "normal" ? "A+" : "A++"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setPrefs(DEFAULT_PREFS)}
                className="mt-4 w-full py-2 text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                Reset to defaults
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function ToggleSetting({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-foreground/70">{label}</p>
        <p className="text-[10px] text-foreground/30">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${
          checked ? "bg-foreground/30" : "bg-foreground/10"
        }`}
      >
        <motion.div
          className="absolute top-0.5 w-4 h-4 rounded-full bg-foreground/70"
          animate={{ left: checked ? 20 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
}
