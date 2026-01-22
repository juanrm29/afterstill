"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

type Writing = {
  id: string;
  title: string;
  tags: string[];
  excerpt: string;
  date: string;
};

type MoodType = "morning" | "afternoon" | "evening" | "night" | "melancholic" | "hopeful" | "peaceful" | "introspective";

const moodKeywords: Record<MoodType, string[]> = {
  morning: ["dawn", "beginning", "hope", "light", "fresh", "new", "awaken", "rise"],
  afternoon: ["journey", "path", "growth", "work", "progress", "walk", "sun"],
  evening: ["reflection", "sunset", "gratitude", "memory", "dusk", "twilight"],
  night: ["stillness", "quiet", "dreams", "stars", "solitude", "darkness", "moon"],
  melancholic: ["melancholy", "sadness", "loss", "grief", "rain", "tears", "fade"],
  hopeful: ["hope", "light", "growth", "future", "dawn", "bloom", "rise", "spring"],
  peaceful: ["peace", "calm", "quiet", "rest", "stillness", "serenity", "gentle"],
  introspective: ["introspection", "thought", "mind", "reflection", "solitude", "self", "wonder"]
};

const moodConfig: Record<MoodType, {
  accent: string;
  icon: string;
  label: string;
  verse: string;
}> = {
  morning: { accent: "text-amber-500/70", icon: "◐", label: "Dawn", verse: "when light first speaks" },
  afternoon: { accent: "text-yellow-500/70", icon: "◉", label: "Meridian", verse: "at the peak of knowing" },
  evening: { accent: "text-orange-500/70", icon: "◑", label: "Gloaming", verse: "where day meets memory" },
  night: { accent: "text-indigo-400/70", icon: "●", label: "Nocturne", verse: "in the quiet hours" },
  melancholic: { accent: "text-slate-400/70", icon: "◌", label: "Rain Song", verse: "for the gentle ache" },
  hopeful: { accent: "text-emerald-500/70", icon: "✧", label: "Uprising", verse: "seeds of becoming" },
  peaceful: { accent: "text-cyan-500/70", icon: "○", label: "Still Waters", verse: "in the breath between" },
  introspective: { accent: "text-violet-400/70", icon: "◎", label: "Inward", verse: "the self, reflected" }
};

function getTimeBasedMood(): MoodType {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

function scoreWritingForMood(writing: Writing, mood: MoodType): number {
  const keywords = moodKeywords[mood];
  const tags = writing.tags.map(t => t.toLowerCase());
  const excerptWords = writing.excerpt.toLowerCase().split(/\s+/);
  const titleWords = writing.title.toLowerCase().split(/\s+/);
  
  let score = 0;
  for (const keyword of keywords) {
    if (tags.some(t => t.includes(keyword))) score += 4;
    if (titleWords.some(w => w.includes(keyword))) score += 3;
    if (excerptWords.some(w => w.includes(keyword))) score += 1;
  }
  
  score += Math.random() * 0.3;
  return score;
}

export function MoodRecommendation({ writings }: { writings: Writing[] }) {
  const [mood] = useState<MoodType>(() => getTimeBasedMood());
  const [isVisible, setIsVisible] = useState(false);
  const [userMood, setUserMood] = useState<MoodType | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [time, setTime] = useState(() => new Date());
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500);
    const timeInterval = setInterval(() => setTime(new Date()), 60000);
    return () => {
      clearTimeout(timer);
      clearInterval(timeInterval);
    };
  }, []);
  
  const activeMood = userMood || mood;
  const config = moodConfig[activeMood];
  
  const recommendation = useMemo(() => {
    if (!writings.length) return null;
    const scored = writings.map(w => ({ writing: w, score: scoreWritingForMood(w, activeMood) }));
    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.writing || writings[0];
  }, [writings, activeMood]);
  
  const poeticTime = useMemo(() => {
    const hour = time.getHours();
    const minute = time.getMinutes();
    const hourStr = hour % 12 || 12;
    const period = hour >= 12 ? "pm" : "am";
    return `${hourStr}:${minute.toString().padStart(2, '0')} ${period}`;
  }, [time]);
  
  if (!recommendation) return null;
  
  return (
    <div className={`w-full max-w-xl mx-auto transition-all duration-1000 ${isVisible ? "opacity-100" : "opacity-0"}`}>
      {/* Minimal Header */}
      <div className="flex items-center gap-4 mb-6">
        <span className="text-[9px] text-zinc-700 font-mono tracking-wider">{poeticTime}</span>
        <div className="h-px flex-1 bg-zinc-800/30" />
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-[9px] text-zinc-600 hover:text-zinc-400 uppercase tracking-[0.2em] transition-colors"
        >
          <span className={config.accent}>{config.icon}</span>
          <span>{config.label}</span>
          <span className={`text-[8px] transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}>▾</span>
        </button>
      </div>
      
      {/* Expandable Mood Selector */}
      <div className={`overflow-hidden transition-all duration-500 ${isExpanded ? "max-h-20 opacity-100 mb-6" : "max-h-0 opacity-0"}`}>
        <div className="flex items-center justify-center gap-1 py-2">
          {(Object.keys(moodConfig) as MoodType[]).map(m => {
            const mc = moodConfig[m];
            const isActive = activeMood === m;
            return (
              <button
                key={m}
                onClick={() => setUserMood(m === userMood ? null : m)}
                className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isActive ? "" : "opacity-40 hover:opacity-70"
                }`}
                title={mc.label}
              >
                {isActive && <span className="absolute inset-0 rounded-full border border-zinc-700" />}
                <span className={`text-sm ${mc.accent}`}>{mc.icon}</span>
              </button>
            );
          })}
        </div>
        <p className="text-center text-[9px] text-zinc-600 italic">{config.verse}</p>
      </div>
      
      {/* The Recommendation - Minimal, Integrated */}
      <Link href={`/reading/${recommendation.id}`} className="group block">
        <div className="relative">
          {/* Subtle left accent */}
          <div className={`absolute left-0 top-0 bottom-0 w-px ${config.accent} opacity-30 group-hover:opacity-60 transition-opacity duration-500`} />
          
          <div className="pl-5">
            {/* Subtle label */}
            <span className="text-[8px] text-zinc-700 uppercase tracking-[0.3em] mb-2 block">
              for this moment
            </span>
            
            {/* Title */}
            <h3 
              className="text-xl md:text-2xl text-zinc-400 font-light leading-tight mb-2 transition-colors duration-500 group-hover:text-zinc-200"
              style={{ fontFamily: "var(--font-cormorant), serif" }}
            >
              {recommendation.title}
            </h3>
            
            {/* Excerpt - very subtle */}
            <p className="text-[11px] text-zinc-700 leading-relaxed line-clamp-2 mb-3 transition-colors duration-300 group-hover:text-zinc-600">
              {recommendation.excerpt}
            </p>
            
            {/* Tags & Action */}
            <div className="flex items-center gap-3">
              {recommendation.tags.slice(0, 2).map(tag => (
                <span key={tag} className="text-[8px] text-zinc-700">
                  {tag}
                </span>
              ))}
              <span className="text-[9px] text-zinc-700 group-hover:text-zinc-500 transition-colors flex items-center gap-1">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">read</span>
                <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
