"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";

interface ReadingModeContextType {
  isImmersive: boolean;
  toggleImmersive: () => void;
  fontSize: "small" | "medium" | "large";
  setFontSize: (size: "small" | "medium" | "large") => void;
  theme: "dark" | "sepia" | "night";
  setTheme: (theme: "dark" | "sepia" | "night") => void;
  lineHeight: "compact" | "normal" | "relaxed";
  setLineHeight: (height: "compact" | "normal" | "relaxed") => void;
}

const ReadingModeContext = createContext<ReadingModeContextType | null>(null);

export function useReadingMode() {
  const context = useContext(ReadingModeContext);
  if (!context) {
    throw new Error("useReadingMode must be used within ReadingModeProvider");
  }
  return context;
}

export function ReadingModeProvider({ children }: { children: React.ReactNode }) {
  const [isImmersive, setIsImmersive] = useState(false);
  const [fontSize, setFontSize] = useState<"small" | "medium" | "large">("medium");
  const [theme, setTheme] = useState<"dark" | "sepia" | "night">("dark");
  const [lineHeight, setLineHeight] = useState<"compact" | "normal" | "relaxed">("normal");
  
  // Load preferences from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("reading-preferences");
      if (saved) {
        const prefs = JSON.parse(saved);
        if (prefs.fontSize) setFontSize(prefs.fontSize);
        if (prefs.theme) setTheme(prefs.theme);
        if (prefs.lineHeight) setLineHeight(prefs.lineHeight);
      }
    } catch {
      // Ignore errors
    }
  }, []);
  
  // Save preferences
  useEffect(() => {
    try {
      localStorage.setItem("reading-preferences", JSON.stringify({ fontSize, theme, lineHeight }));
    } catch {
      // Ignore errors
    }
  }, [fontSize, theme, lineHeight]);
  
  const toggleImmersive = useCallback(() => {
    setIsImmersive(prev => !prev);
  }, []);
  
  return (
    <ReadingModeContext.Provider value={{
      isImmersive,
      toggleImmersive,
      fontSize,
      setFontSize,
      theme,
      setTheme,
      lineHeight,
      setLineHeight,
    }}>
      {children}
    </ReadingModeContext.Provider>
  );
}

// Reading settings panel
export function ReadingSettings() {
  const { fontSize, setFontSize, theme, setTheme, lineHeight, setLineHeight, isImmersive, toggleImmersive } = useReadingMode();
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-6 right-6 z-[60] w-10 h-10 rounded-full glass flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
        aria-label="Reading settings"
      >
        <svg className="w-5 h-5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
        </svg>
      </button>
      
      {/* Settings panel */}
      <div 
        className={`fixed top-20 right-6 z-[55] w-72 glass rounded-2xl p-5 transition-all duration-300 ${
          isOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <h3 className="text-sm font-medium text-zinc-300 mb-4">Reading Settings</h3>
        
        {/* Immersive mode toggle */}
        <div className="flex items-center justify-between mb-5">
          <span className="text-xs text-zinc-400">Immersive Mode</span>
          <button
            type="button"
            onClick={toggleImmersive}
            className={`relative w-11 h-6 rounded-full transition-colors ${isImmersive ? "bg-violet-500" : "bg-zinc-700"}`}
          >
            <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${isImmersive ? "translate-x-5" : ""}`} />
          </button>
        </div>
        
        {/* Font size */}
        <div className="mb-5">
          <span className="text-xs text-zinc-400 block mb-2">Font Size</span>
          <div className="flex gap-2">
            {(["small", "medium", "large"] as const).map(size => (
              <button
                key={size}
                type="button"
                onClick={() => setFontSize(size)}
                className={`flex-1 py-2 rounded-lg text-xs capitalize transition-colors ${
                  fontSize === size 
                    ? "bg-zinc-700 text-zinc-200" 
                    : "bg-zinc-800/50 text-zinc-500 hover:bg-zinc-800"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
        
        {/* Theme */}
        <div className="mb-5">
          <span className="text-xs text-zinc-400 block mb-2">Theme</span>
          <div className="flex gap-2">
            {(["dark", "sepia", "night"] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                className={`flex-1 py-2 rounded-lg text-xs capitalize transition-colors ${
                  theme === t 
                    ? "bg-zinc-700 text-zinc-200" 
                    : "bg-zinc-800/50 text-zinc-500 hover:bg-zinc-800"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        
        {/* Line height */}
        <div>
          <span className="text-xs text-zinc-400 block mb-2">Line Spacing</span>
          <div className="flex gap-2">
            {(["compact", "normal", "relaxed"] as const).map(h => (
              <button
                key={h}
                type="button"
                onClick={() => setLineHeight(h)}
                className={`flex-1 py-2 rounded-lg text-xs capitalize transition-colors ${
                  lineHeight === h 
                    ? "bg-zinc-700 text-zinc-200" 
                    : "bg-zinc-800/50 text-zinc-500 hover:bg-zinc-800"
                }`}
              >
                {h}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[50]" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

// CSS variables based on reading mode
export function getReadingStyles(fontSize: string, theme: string, lineHeight: string) {
  const fontSizes = {
    small: "16px",
    medium: "18px",
    large: "20px",
  };
  
  const lineHeights = {
    compact: "1.7",
    normal: "2.1",
    relaxed: "2.5",
  };
  
  const themes = {
    dark: {
      bg: "#030304",
      text: "#d4d4d8",
      muted: "#71717a",
    },
    sepia: {
      bg: "#1a1815",
      text: "#c4b5a3",
      muted: "#8b7355",
    },
    night: {
      bg: "#0a0a0c",
      text: "#9ca3af",
      muted: "#4b5563",
    },
  };
  
  const themeConfig = themes[theme as keyof typeof themes] || themes.dark;
  
  return {
    "--reading-font-size": fontSizes[fontSize as keyof typeof fontSizes] || fontSizes.medium,
    "--reading-line-height": lineHeights[lineHeight as keyof typeof lineHeights] || lineHeights.normal,
    "--reading-bg": themeConfig.bg,
    "--reading-text": themeConfig.text,
    "--reading-muted": themeConfig.muted,
  };
}
