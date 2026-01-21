"use client";

import { useState } from "react";

interface GeniusAnalysis {
  excerpt: string;
  tags: string[];
  mood: string;
  summary: string;
}

interface GeniusPreviewProps {
  content: string;
  title: string;
  onApplyExcerpt?: (excerpt: string) => void;
  onApplyTags?: (tags: string[]) => void;
}

export default function GeniusPreview({ content, title, onApplyExcerpt, onApplyTags }: GeniusPreviewProps) {
  const [analysis, setAnalysis] = useState<GeniusAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedExcerpt, setAppliedExcerpt] = useState(false);
  const [appliedTags, setAppliedTags] = useState<string[]>([]);

  const analyze = async () => {
    if (content.length < 50) {
      setError("Tulis minimal 50 karakter untuk menganalisis");
      return;
    }

    setIsLoading(true);
    setError(null);
    setAppliedExcerpt(false);
    setAppliedTags([]);

    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, title }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Analysis failed");
      }

      const data = await res.json();
      setAnalysis(data.analysis);
      setIsExpanded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menganalisis");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyExcerpt = () => {
    if (analysis?.excerpt && onApplyExcerpt) {
      onApplyExcerpt(analysis.excerpt);
      setAppliedExcerpt(true);
    }
  };

  const handleApplyTag = (tag: string) => {
    if (onApplyTags && !appliedTags.includes(tag)) {
      onApplyTags([tag]);
      setAppliedTags(prev => [...prev, tag]);
    }
  };

  const handleApplyAllTags = () => {
    if (analysis?.tags && onApplyTags) {
      const newTags = analysis.tags.filter(t => !appliedTags.includes(t));
      onApplyTags(newTags);
      setAppliedTags(prev => [...prev, ...newTags]);
    }
  };

  const getMoodEmoji = (mood: string) => {
    const moods: Record<string, string> = {
      melancholic: "🌧️",
      hopeful: "🌅",
      introspective: "🪞",
      peaceful: "🍃",
      contemplative: "🌙",
      nostalgic: "📷",
      bittersweet: "🥀",
    };
    return moods[mood.toLowerCase()] || "✨";
  };

  return (
    <div className="mt-6">
      {/* Toggle button */}
      <button
        type="button"
        onClick={analysis ? () => setIsExpanded(!isExpanded) : analyze}
        disabled={isLoading}
        className="flex items-center gap-2 text-xs text-violet-400/70 hover:text-violet-400 transition-colors disabled:opacity-50"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z"/>
        </svg>
        {isLoading ? "🔮 Menganalisis dengan AI..." : analysis ? (isExpanded ? "Sembunyikan Genius" : "Tampilkan Genius") : "✨ Genius Preview"}
      </button>

      {error && (
        <p className="mt-2 text-xs text-red-400/70">{error}</p>
      )}

      {/* Analysis panel */}
      {analysis && isExpanded && (
        <div className="mt-4 p-5 bg-gradient-to-br from-violet-950/20 to-indigo-950/20 border border-violet-500/10 rounded-xl animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getMoodEmoji(analysis.mood)}</span>
              <h3 className="text-xs uppercase tracking-widest text-violet-400/70">Genius Analysis</h3>
            </div>
            <span className="px-2 py-1 bg-violet-500/10 border border-violet-500/20 rounded text-[10px] text-violet-300 capitalize">
              {analysis.mood}
            </span>
          </div>

          <div className="space-y-5">
            {/* Excerpt */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase tracking-wider text-zinc-600">Excerpt yang Disarankan</p>
                {onApplyExcerpt && (
                  <button
                    type="button"
                    onClick={handleApplyExcerpt}
                    disabled={appliedExcerpt}
                    className={`text-[10px] px-2 py-1 rounded transition-colors ${
                      appliedExcerpt 
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                        : "bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 border border-violet-500/20"
                    }`}
                  >
                    {appliedExcerpt ? "✓ Applied" : "Apply"}
                  </button>
                )}
              </div>
              <p className="text-sm text-zinc-400 italic" style={{ fontFamily: "var(--font-cormorant), serif" }}>
                "{analysis.excerpt}"
              </p>
            </div>

            {/* Summary */}
            <div>
              <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-2">Ringkasan</p>
              <p className="text-sm text-zinc-300 leading-relaxed">{analysis.summary}</p>
            </div>

            {/* Tags */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase tracking-wider text-zinc-600">Tags yang Disarankan</p>
                {onApplyTags && analysis.tags.some(t => !appliedTags.includes(t)) && (
                  <button
                    type="button"
                    onClick={handleApplyAllTags}
                    className="text-[10px] px-2 py-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 rounded transition-colors"
                  >
                    Apply All
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {analysis.tags.map((tag) => {
                  const isApplied = appliedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleApplyTag(tag)}
                      disabled={isApplied}
                      className={`px-2.5 py-1.5 rounded text-[11px] transition-colors ${
                        isApplied
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-zinc-800/50 text-zinc-300 hover:bg-violet-500/20 hover:text-violet-300 border border-zinc-700/30 hover:border-violet-500/30"
                      }`}
                    >
                      {isApplied ? "✓ " : "+ "}{tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Re-analyze button */}
          <button
            type="button"
            onClick={analyze}
            disabled={isLoading}
            className="mt-5 pt-4 border-t border-zinc-800/30 w-full text-left text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors flex items-center gap-2"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            {isLoading ? "Analyzing..." : "Analisis ulang"}
          </button>
        </div>
      )}
    </div>
  );
}
