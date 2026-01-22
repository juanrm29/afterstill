"use client";

// Advanced mood detection system using content analysis, semantic keywords, and scoring

export type MoodType = "melancholic" | "hopeful" | "introspective" | "peaceful" | "neutral";

// Extended keyword dictionaries with weights
const moodKeywords: Record<MoodType, { words: string[]; weight: number }[]> = {
  melancholic: [
    // Strong indicators (weight 3)
    { words: ["grief", "loss", "tears", "weeping", "mourn", "sorrow", "despair", "anguish", "heartbreak", "devastat"], weight: 3 },
    // Medium indicators (weight 2)
    { words: ["sad", "melanchol", "rain", "dark", "shadow", "fade", "wither", "lonely", "empty", "miss", "gone", "lost", "pain", "hurt", "broken", "fall", "drown", "heavy", "burden", "regret", "longing", "yearn"], weight: 2 },
    // Subtle indicators (weight 1)
    { words: ["grey", "gray", "cold", "winter", "night", "silence", "echo", "memory", "past", "distant", "fog", "mist", "dust", "ash", "faded", "old", "worn", "tired", "alone"], weight: 1 }
  ],
  hopeful: [
    { words: ["joy", "bloom", "flourish", "triumph", "victory", "achieve", "succeed", "bright", "radiant", "glorious"], weight: 3 },
    { words: ["hope", "light", "dawn", "sunrise", "grow", "begin", "new", "fresh", "spring", "birth", "rise", "awaken", "dream", "wish", "believe", "faith", "trust", "tomorrow", "future", "forward", "possible"], weight: 2 },
    { words: ["warm", "sun", "sky", "open", "free", "fly", "soar", "lift", "climb", "reach", "create", "build", "plant", "seed", "flower", "color", "smile", "laugh", "gentle"], weight: 1 }
  ],
  introspective: [
    { words: ["consciousness", "existential", "philosophy", "metaphysic", "transcend", "epiphany", "revelation"], weight: 3 },
    { words: ["think", "thought", "mind", "reflect", "contemplate", "ponder", "wonder", "question", "seek", "search", "understand", "meaning", "purpose", "self", "soul", "spirit", "inner", "depth", "truth", "realize", "aware"], weight: 2 },
    { words: ["observe", "notice", "consider", "examine", "explore", "discover", "learn", "know", "sense", "feel", "perceive", "imagine", "dream", "idea", "concept", "pattern", "connect", "relate", "between", "within"], weight: 1 }
  ],
  peaceful: [
    { words: ["serenity", "tranquil", "bliss", "harmony", "content", "meditat", "zen", "nirvana"], weight: 3 },
    { words: ["peace", "calm", "quiet", "still", "rest", "ease", "gentle", "soft", "slow", "breathe", "relax", "settle", "float", "drift", "flow", "accept", "let", "release", "simple", "clear", "pure"], weight: 2 },
    { words: ["water", "lake", "river", "ocean", "wave", "breeze", "wind", "leaf", "tree", "forest", "mountain", "valley", "meadow", "garden", "cloud", "sky", "moon", "star", "evening", "dusk", "twilight"], weight: 1 }
  ],
  neutral: []
};

// Emotional punctuation patterns
const punctuationPatterns: Record<MoodType, RegExp[]> = {
  melancholic: [/\.{3,}/g, /—/g, /\.\.\./g], // Ellipses, em-dashes suggest trailing thoughts
  hopeful: [/!/g, /\?!/g], // Exclamations suggest excitement
  introspective: [/\?/g, /:/g], // Questions and colons suggest inquiry
  peaceful: [/,/g], // Commas suggest flowing, unhurried prose
  neutral: []
};

// Sentence structure analysis
function analyzeSentenceStructure(text: string): Partial<Record<MoodType, number>> {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const scores: Partial<Record<MoodType, number>> = {};
  
  if (sentences.length === 0) return scores;
  
  const avgLength = sentences.reduce((sum, s) => sum + s.trim().split(/\s+/).length, 0) / sentences.length;
  
  // Long sentences often indicate introspective or peaceful writing
  if (avgLength > 25) {
    scores.introspective = (scores.introspective || 0) + 2;
    scores.peaceful = (scores.peaceful || 0) + 1;
  }
  
  // Short, fragmented sentences can indicate melancholy or intensity
  if (avgLength < 10) {
    scores.melancholic = (scores.melancholic || 0) + 1;
  }
  
  // Check for repeated sentence starts (anaphora) - often emotional
  const starts = sentences.map(s => s.trim().split(/\s+/)[0]?.toLowerCase());
  const startCounts = new Map<string, number>();
  starts.forEach(s => s && startCounts.set(s, (startCounts.get(s) || 0) + 1));
  const hasAnaphora = [...startCounts.values()].some(c => c >= 3);
  if (hasAnaphora) {
    scores.melancholic = (scores.melancholic || 0) + 1;
    scores.introspective = (scores.introspective || 0) + 1;
  }
  
  return scores;
}

// Analyze temporal references
function analyzeTemporalReferences(text: string): Partial<Record<MoodType, number>> {
  const lower = text.toLowerCase();
  const scores: Partial<Record<MoodType, number>> = {};
  
  // Past tense focus often indicates melancholy or introspection
  const pastWords = ["was", "were", "had", "used to", "once", "before", "ago", "remember", "recalled", "forgot"];
  const pastCount = pastWords.reduce((c, w) => c + (lower.split(w).length - 1), 0);
  
  // Future tense focus often indicates hope
  const futureWords = ["will", "shall", "going to", "someday", "tomorrow", "soon", "one day", "eventually"];
  const futureCount = futureWords.reduce((c, w) => c + (lower.split(w).length - 1), 0);
  
  // Present tense focus can indicate peace/mindfulness
  const presentWords = ["now", "here", "this moment", "today", "currently", "present", "right now"];
  const presentCount = presentWords.reduce((c, w) => c + (lower.split(w).length - 1), 0);
  
  if (pastCount > 5) {
    scores.melancholic = (scores.melancholic || 0) + 2;
    scores.introspective = (scores.introspective || 0) + 1;
  }
  if (futureCount > 3) {
    scores.hopeful = (scores.hopeful || 0) + 2;
  }
  if (presentCount > 3) {
    scores.peaceful = (scores.peaceful || 0) + 2;
  }
  
  return scores;
}

// Main analysis function
export function analyzeMood(
  content: string,
  title: string,
  tags: string[],
  excerpt?: string
): { mood: MoodType; confidence: number; scores: Record<MoodType, number> } {
  const scores: Record<MoodType, number> = {
    melancholic: 0,
    hopeful: 0,
    introspective: 0,
    peaceful: 0,
    neutral: 0
  };
  
  // Combine all text for analysis
  const fullText = `${title} ${content} ${excerpt || ""} ${tags.join(" ")}`.toLowerCase();
  const wordCount = fullText.split(/\s+/).length;
  
  // 1. Keyword analysis (most important)
  for (const [mood, keywordGroups] of Object.entries(moodKeywords) as [MoodType, typeof moodKeywords.melancholic][]) {
    if (mood === "neutral") continue;
    
    for (const group of keywordGroups) {
      for (const word of group.words) {
        // Use regex to find partial matches (e.g., "melanchol" matches "melancholic", "melancholy")
        const regex = new RegExp(`\\b${word}`, "gi");
        const matches = fullText.match(regex);
        if (matches) {
          scores[mood] += matches.length * group.weight;
        }
      }
    }
  }
  
  // 2. Tag analysis (tags are strong indicators, multiply by 3)
  for (const tag of tags.map(t => t.toLowerCase())) {
    for (const [mood, keywordGroups] of Object.entries(moodKeywords) as [MoodType, typeof moodKeywords.melancholic][]) {
      if (mood === "neutral") continue;
      
      for (const group of keywordGroups) {
        if (group.words.some(w => tag.includes(w) || w.includes(tag))) {
          scores[mood] += group.weight * 3;
        }
      }
    }
  }
  
  // 3. Title analysis (titles are significant, multiply by 2)
  const titleLower = title.toLowerCase();
  for (const [mood, keywordGroups] of Object.entries(moodKeywords) as [MoodType, typeof moodKeywords.melancholic][]) {
    if (mood === "neutral") continue;
    
    for (const group of keywordGroups) {
      for (const word of group.words) {
        if (titleLower.includes(word)) {
          scores[mood] += group.weight * 2;
        }
      }
    }
  }
  
  // 4. Punctuation analysis
  for (const [mood, patterns] of Object.entries(punctuationPatterns) as [MoodType, RegExp[]][]) {
    if (mood === "neutral") continue;
    
    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches && matches.length > 2) {
        scores[mood] += Math.min(matches.length * 0.5, 3);
      }
    }
  }
  
  // 5. Sentence structure analysis
  const structureScores = analyzeSentenceStructure(content);
  for (const [mood, score] of Object.entries(structureScores) as [MoodType, number][]) {
    scores[mood] += score;
  }
  
  // 6. Temporal analysis
  const temporalScores = analyzeTemporalReferences(content);
  for (const [mood, score] of Object.entries(temporalScores) as [MoodType, number][]) {
    scores[mood] += score;
  }
  
  // 7. Normalize scores by word count (longer texts naturally have more matches)
  const normalizationFactor = Math.max(1, wordCount / 500);
  for (const mood of Object.keys(scores) as MoodType[]) {
    if (mood !== "neutral") {
      scores[mood] = scores[mood] / normalizationFactor;
    }
  }
  
  // 8. Find the dominant mood
  let maxScore = 0;
  let dominantMood: MoodType = "neutral";
  
  for (const [mood, score] of Object.entries(scores) as [MoodType, number][]) {
    if (mood !== "neutral" && score > maxScore) {
      maxScore = score;
      dominantMood = mood;
    }
  }
  
  // 9. Calculate confidence (0-1)
  // If no mood stands out strongly, default to neutral with low confidence
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0) - scores.neutral;
  const confidence = totalScore > 0 ? Math.min(maxScore / (totalScore * 0.5), 1) : 0;
  
  // If confidence is too low or max score is minimal, use neutral
  if (confidence < 0.3 || maxScore < 2) {
    // Try to infer a subtle mood even for neutral content
    // Default to introspective for literary content, peaceful for short content
    if (wordCount > 500) {
      dominantMood = "introspective";
    } else {
      dominantMood = "peaceful";
    }
  }
  
  return {
    mood: dominantMood,
    confidence,
    scores
  };
}

// Hook for using mood analysis in components
export function useMoodAnalysis(content: string, title: string, tags: string[], excerpt?: string) {
  const analysis = analyzeMood(content, title, tags, excerpt);
  return analysis;
}
