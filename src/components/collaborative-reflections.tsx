"use client";

import { useState, useEffect, useCallback } from "react";

type Reflection = {
  id: string;
  text: string;
  timestamp: number;
  likes: number;
  mood?: string;
};

type Props = {
  writingId: string;
  writingTitle: string;
};

export function CollaborativeReflections({ writingId, writingTitle }: Props) {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [newReflection, setNewReflection] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  // Load reflections from localStorage (in production, use API)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`reflections-${writingId}`);
      if (stored) {
        setReflections(JSON.parse(stored));
      }
      
      const submitted = localStorage.getItem(`submitted-${writingId}`);
      setHasSubmitted(submitted === "true");
    } catch {
      // Ignore storage errors
    }
  }, [writingId]);
  
  const saveReflections = useCallback((newReflections: Reflection[]) => {
    try {
      localStorage.setItem(`reflections-${writingId}`, JSON.stringify(newReflections));
    } catch {
      // Ignore storage errors
    }
  }, [writingId]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReflection.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const reflection: Reflection = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      text: newReflection.trim(),
      timestamp: Date.now(),
      likes: 0,
      mood: detectMood(newReflection)
    };
    
    const updated = [reflection, ...reflections];
    setReflections(updated);
    saveReflections(updated);
    setNewReflection("");
    setIsSubmitting(false);
    setHasSubmitted(true);
    
    try {
      localStorage.setItem(`submitted-${writingId}`, "true");
    } catch {
      // Ignore
    }
  };
  
  const handleLike = (id: string) => {
    const updated = reflections.map(r => 
      r.id === id ? { ...r, likes: r.likes + 1 } : r
    );
    setReflections(updated);
    saveReflections(updated);
  };
  
  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };
  
  const detectMood = (text: string): string => {
    const lower = text.toLowerCase();
    if (/hope|light|beautiful|love|joy/i.test(lower)) return "hopeful";
    if (/sad|pain|loss|dark|tears/i.test(lower)) return "melancholic";
    if (/think|wonder|question|curious/i.test(lower)) return "introspective";
    if (/peace|calm|still|quiet/i.test(lower)) return "peaceful";
    return "neutral";
  };
  
  const moodColors: Record<string, string> = {
    hopeful: "bg-amber-500/10 border-amber-500/20",
    melancholic: "bg-slate-500/10 border-slate-500/20",
    introspective: "bg-violet-500/10 border-violet-500/20",
    peaceful: "bg-cyan-500/10 border-cyan-500/20",
    neutral: "bg-zinc-500/10 border-zinc-500/20"
  };
  
  return (
    <div className="w-full mt-16">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between py-3 group"
      >
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-zinc-500 uppercase tracking-[0.2em]">
            Shared Reflections
          </span>
          {reflections.length > 0 && (
            <span className="text-[9px] text-zinc-600 px-2 py-0.5 bg-zinc-800/30 rounded-full">
              {reflections.length}
            </span>
          )}
        </div>
        <span className={`text-zinc-600 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>
      
      {/* Content */}
      <div className={`overflow-hidden transition-all duration-500 ${
        isExpanded ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
      }`}>
        {/* Input form */}
        {!hasSubmitted && (
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="relative">
              <textarea
                value={newReflection}
                onChange={(e) => setNewReflection(e.target.value)}
                placeholder="Share a thought this piece stirred in you..."
                maxLength={280}
                className="w-full h-24 p-4 text-[13px] text-zinc-300 bg-zinc-900/30 border border-zinc-800/50 rounded-lg resize-none focus:outline-none focus:border-violet-500/40 placeholder:text-zinc-600 transition-colors"
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-3">
                <span className="text-[9px] text-zinc-600">
                  {newReflection.length}/280
                </span>
                <button
                  type="submit"
                  disabled={!newReflection.trim() || isSubmitting}
                  className="text-[10px] text-violet-400 hover:text-violet-300 disabled:text-zinc-600 disabled:cursor-not-allowed transition-colors px-3 py-1.5 border border-violet-500/30 hover:border-violet-500/50 disabled:border-zinc-700 rounded-full"
                >
                  {isSubmitting ? "..." : "Share"}
                </button>
              </div>
            </div>
          </form>
        )}
        
        {hasSubmitted && (
          <div className="mb-6 text-center text-[11px] text-violet-400/60 py-3 border border-dashed border-violet-500/20 rounded-lg">
            ✦ Your reflection has been shared ✦
          </div>
        )}
        
        {/* Reflections list */}
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          {reflections.length === 0 ? (
            <p className="text-center text-[11px] text-zinc-600 py-8 italic">
              Be the first to share a reflection
            </p>
          ) : (
            reflections.map(reflection => (
              <div
                key={reflection.id}
                className={`p-3 rounded-lg border ${moodColors[reflection.mood || "neutral"]} transition-all duration-300 hover:scale-[1.01]`}
              >
                <p className="text-[13px] text-zinc-300 leading-relaxed mb-2">
                  "{reflection.text}"
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-zinc-600">
                    {formatTime(reflection.timestamp)}
                  </span>
                  <button
                    onClick={() => handleLike(reflection.id)}
                    className="flex items-center gap-1 text-[9px] text-zinc-500 hover:text-violet-400 transition-colors"
                  >
                    <span>♡</span>
                    <span>{reflection.likes > 0 ? reflection.likes : ""}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
