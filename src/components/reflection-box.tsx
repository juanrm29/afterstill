"use client";

import { useState, useEffect, useRef, memo } from "react";

interface Reflection {
  id: string;
  content: string;
  mood: string | null;
  createdAt: string;
}

interface ReflectionBoxProps {
  writingId: string;
  writingTitle: string;
  show: boolean;
}

const MOODS = [
  { id: "contemplative", label: "Contemplative", emoji: "🌙" },
  { id: "inspired", label: "Inspired", emoji: "✨" },
  { id: "peaceful", label: "Peaceful", emoji: "🍃" },
  { id: "curious", label: "Curious", emoji: "🔮" },
  { id: "moved", label: "Moved", emoji: "💫" },
  { id: "thoughtful", label: "Thoughtful", emoji: "🌊" },
];

function ReflectionBoxInner({ writingId, writingTitle, show }: ReflectionBoxProps) {
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publicReflections, setPublicReflections] = useState<Reflection[]>([]);
  const [ownReflection, setOwnReflection] = useState<Reflection | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Use ref to track fetch status - survives re-renders without causing them
  const hasFetchedRef = useRef(false);
  const fetchedWritingIdRef = useRef<string | null>(null);
  
  useEffect(() => {
    // Only fetch if we haven't fetched for this writingId yet
    if (hasFetchedRef.current && fetchedWritingIdRef.current === writingId) return;
    
    hasFetchedRef.current = true;
    fetchedWritingIdRef.current = writingId;
    
    fetch(`/api/reflections?writingId=${writingId}`)
      .then(res => res.json())
      .then(data => {
        setPublicReflections(data.reflections || []);
        if (data.ownReflection) {
          setOwnReflection(data.ownReflection);
          setContent(data.ownReflection.content);
          setMood(data.ownReflection.mood);
          setIsPublic(data.ownReflection.isPublic);
        }
      })
      .catch(console.error);
  }, [writingId]);

  const handleSubmit = async () => {
    if (!content.trim() || content.length < 10) {
      setError("Please write at least 10 characters");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/reflections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          writingId,
          content: content.trim(),
          mood,
          isPublic,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save");
      }

      setSubmitted(true);
      setOwnReflection(data.reflection);
      
      // Refresh public reflections if this one is public
      if (isPublic) {
        const refreshRes = await fetch(`/api/reflections?writingId=${writingId}`);
        const refreshData = await refreshRes.json();
        setPublicReflections(refreshData.reflections || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save reflection");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className={`mt-20 transition-all duration-700 ${
        show 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 translate-y-8 pointer-events-none"
      }`}
    >
      {/* Section header */}
      <div className="flex items-center gap-6 mb-8">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-zinc-700/30 to-transparent" />
        <h3 className="text-[10px] text-zinc-500 uppercase tracking-[0.35em]">
          Reflections
        </h3>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-zinc-700/30 to-transparent" />
      </div>

      {/* Reflection form */}
      <div className="bg-zinc-900/30 border border-zinc-800/40 rounded-xl p-6 mb-8">
        {submitted && !ownReflection ? (
          // Success state
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <p className="text-zinc-400 text-sm">Thank you for sharing your reflection</p>
            <p className="text-zinc-600 text-xs mt-2">Your thoughts have been saved</p>
          </div>
        ) : (
          <>
            {/* Prompt */}
            <p className="text-zinc-400 text-sm mb-4 leading-relaxed">
              {ownReflection 
                ? "You've shared a reflection on this piece. Feel free to update it."
                : `What did "${writingTitle}" stir within you?`
              }
            </p>

            {/* Textarea */}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts, feelings, or what resonated with you..."
              rows={4}
              maxLength={2000}
              className="w-full px-4 py-3 bg-zinc-800/30 border border-zinc-700/40 rounded-lg text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-600/60 resize-none transition-colors"
            />
            
            {/* Character count */}
            <div className="flex justify-between items-center mt-2 mb-4">
              <span className="text-[10px] text-zinc-600">
                {content.length}/2000
              </span>
              {error && (
                <span className="text-[10px] text-red-400">{error}</span>
              )}
            </div>

            {/* Mood selection */}
            <div className="mb-4">
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">
                How does this piece make you feel? (optional)
              </p>
              <div className="flex flex-wrap gap-2">
                {MOODS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMood(mood === m.id ? null : m.id)}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                      mood === m.id
                        ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                        : "bg-zinc-800/30 border-zinc-700/40 text-zinc-500 hover:text-zinc-400 hover:border-zinc-600/50"
                    }`}
                  >
                    {m.emoji} {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Public toggle */}
            <label className="flex items-center gap-3 mb-6 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-zinc-800 rounded-full peer-checked:bg-violet-600/50 transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-zinc-500 rounded-full peer-checked:translate-x-5 peer-checked:bg-violet-300 transition-all" />
              </div>
              <div>
                <span className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors">
                  Share publicly
                </span>
                <p className="text-[10px] text-zinc-600">
                  Others can see your reflection (anonymously)
                </p>
              </div>
            </label>

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || content.length < 10}
              className="w-full px-4 py-3 bg-zinc-800/60 border border-zinc-700/50 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/60 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin" />
                  Saving...
                </>
              ) : ownReflection ? (
                "Update Reflection"
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Share Reflection
                </>
              )}
            </button>
          </>
        )}
      </div>

      {/* Public reflections from others */}
      {publicReflections.length > 0 && (
        <div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-wider hover:text-zinc-400 transition-colors mb-4"
          >
            <svg 
              className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-90" : ""}`} 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
            {publicReflections.length} reflection{publicReflections.length !== 1 ? "s" : ""} from others
          </button>

          {isExpanded && (
            <div className="space-y-4 animate-fade-in">
              {publicReflections.map((reflection) => (
                <div
                  key={reflection.id}
                  className="p-4 bg-zinc-900/20 border border-zinc-800/30 rounded-lg"
                >
                  <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">
                    {reflection.content}
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    {reflection.mood && (
                      <span className="text-xs text-zinc-600">
                        {MOODS.find(m => m.id === reflection.mood)?.emoji}{" "}
                        {MOODS.find(m => m.id === reflection.mood)?.label}
                      </span>
                    )}
                    <span className="text-[10px] text-zinc-700">
                      {new Date(reflection.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders from parent scroll updates
export const ReflectionBox = memo(ReflectionBoxInner);