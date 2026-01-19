"use client";

import { useState } from "react";

interface GeniusAnalysis {
  mood: string;
  themes: string[];
  devices: string[];
  resonance: string;
  companion: string;
  suggestedTags: string[];
}

interface GeniusPreviewProps {
  content: string;
  title: string;
  onTagSuggestion?: (tags: string[]) => void;
}

export default function GeniusPreview({ content, title, onTagSuggestion }: GeniusPreviewProps) {
  const [analysis, setAnalysis] = useState<GeniusAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = async () => {
    if (content.length < 50) {
      setError("Write at least 50 characters to analyze");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/genius-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, title }),
      });

      if (!res.ok) throw new Error("Analysis failed");

      const data = await res.json();
      setAnalysis(data.analysis);
      setIsExpanded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-6">
      {/* Toggle button */}
      <button
        onClick={analysis ? () => setIsExpanded(!isExpanded) : analyze}
        disabled={isLoading}
        className="flex items-center gap-2 text-xs text-violet-400/70 hover:text-violet-400 transition-colors disabled:opacity-50"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        </svg>
        {isLoading ? "Analyzing..." : analysis ? (isExpanded ? "Hide Genius Preview" : "Show Genius Preview") : "✨ Genius Preview"}
      </button>

      {error && (
        <p className="mt-2 text-xs text-red-400/70">{error}</p>
      )}

      {/* Analysis panel */}
      {analysis && isExpanded && (
        <div className="mt-4 p-5 bg-gradient-to-br from-violet-950/20 to-indigo-950/20 border border-violet-500/10 rounded-xl animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🔮</span>
            <h3 className="text-xs uppercase tracking-widest text-violet-400/70">Genius Analysis</h3>
          </div>

          <div className="space-y-4">
            {/* Mood */}
            <div>
              <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1">Mood & Atmosphere</p>
              <p className="text-sm text-zinc-300">{analysis.mood}</p>
            </div>

            {/* Resonance */}
            <div>
              <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1">Resonance</p>
              <p className="text-sm text-zinc-400 italic" style={{ fontFamily: "var(--font-cormorant), serif" }}>
                "{analysis.resonance}"
              </p>
            </div>

            {/* Themes */}
            <div>
              <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-2">Key Themes</p>
              <div className="flex flex-wrap gap-2">
                {analysis.themes.map((theme, i) => (
                  <span key={i} className="px-2 py-1 bg-violet-500/10 border border-violet-500/20 rounded text-[10px] text-violet-300">
                    {theme}
                  </span>
                ))}
              </div>
            </div>

            {/* Devices */}
            <div>
              <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-2">Literary Devices</p>
              <div className="flex flex-wrap gap-2">
                {analysis.devices.map((device, i) => (
                  <span key={i} className="px-2 py-1 bg-zinc-800/50 border border-zinc-700/30 rounded text-[10px] text-zinc-400">
                    {device}
                  </span>
                ))}
              </div>
            </div>

            {/* Companion */}
            <div>
              <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1">Ideal Reader</p>
              <p className="text-sm text-zinc-400">{analysis.companion}</p>
            </div>

            {/* Suggested Tags */}
            {onTagSuggestion && analysis.suggestedTags.length > 0 && (
              <div className="pt-4 border-t border-zinc-800/30">
                <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-2">Suggested Tags</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.suggestedTags.map((tag, i) => (
                    <button
                      key={i}
                      onClick={() => onTagSuggestion([tag])}
                      className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-[10px] text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Re-analyze button */}
          <button
            onClick={analyze}
            disabled={isLoading}
            className="mt-4 text-[10px] text-zinc-600 hover:text-zinc-500 transition-colors"
          >
            {isLoading ? "Analyzing..." : "↻ Re-analyze"}
          </button>
        </div>
      )}
    </div>
  );
}
