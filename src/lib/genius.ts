import type { Writing } from "@/types/writing";

// ═══════════════════════════════════════════════════════════════
// SEMANTIC DNA GENERATOR
// Creates a unique visual fingerprint for each writing
// ═══════════════════════════════════════════════════════════════

export type SemanticDNA = {
  sequence: number[];  // 16-point signature
  dominantFrequency: number;
  entropy: number;
  color: string;
};

const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

export const generateSemanticDNA = (writing: Writing): SemanticDNA => {
  const text = `${writing.title} ${writing.content}`;
  const words = text.toLowerCase().split(/\s+/);
  
  // Generate 16-point sequence based on content characteristics
  const sequence: number[] = [];
  const chunkSize = Math.ceil(words.length / 16);
  
  for (let i = 0; i < 16; i++) {
    const chunk = words.slice(i * chunkSize, (i + 1) * chunkSize);
    const avgLength = chunk.reduce((a, w) => a + w.length, 0) / (chunk.length || 1);
    const uniqueRatio = new Set(chunk).size / (chunk.length || 1);
    sequence.push(Math.sin(avgLength * uniqueRatio * Math.PI) * 0.5 + 0.5);
  }
  
  // Calculate entropy (information density)
  const charFreq = new Map<string, number>();
  for (const char of text.toLowerCase()) {
    if (/[a-z]/.test(char)) {
      charFreq.set(char, (charFreq.get(char) || 0) + 1);
    }
  }
  const total = Array.from(charFreq.values()).reduce((a, b) => a + b, 0);
  const entropy = -Array.from(charFreq.values()).reduce((acc, freq) => {
    const p = freq / total;
    return acc + p * Math.log2(p);
  }, 0) / 4.7; // Normalize to 0-1
  
  // Dominant frequency based on sentence rhythm
  const sentences = writing.content.split(/[.!?]+/).filter(Boolean);
  const avgSentenceLength = sentences.reduce((a, s) => a + s.length, 0) / (sentences.length || 1);
  const dominantFrequency = Math.min(1, avgSentenceLength / 150);
  
  // Color based on content hash
  const hash = hashString(writing.id);
  const hue = hash % 360;
  const color = `hsl(${hue}, 15%, 50%)`;
  
  return { sequence, dominantFrequency, entropy, color };
};

// ═══════════════════════════════════════════════════════════════
// READING VELOCITY TRACKER
// Analyzes scroll patterns to understand reading behavior
// ═══════════════════════════════════════════════════════════════

export type ReadingVelocity = {
  wordsPerMinute: number;
  scrollPattern: 'scanning' | 'reading' | 'studying';
  attentionScore: number;
  predictedTimeLeft: number;
};

export class VelocityTracker {
  private scrollPositions: { y: number; time: number }[] = [];
  private wordCount: number;
  private startTime: number;
  
  constructor(wordCount: number) {
    this.wordCount = wordCount;
    this.startTime = Date.now();
  }
  
  recordScroll(y: number, documentHeight: number) {
    const now = Date.now();
    this.scrollPositions.push({ y, time: now });
    
    // Keep last 20 positions
    if (this.scrollPositions.length > 20) {
      this.scrollPositions.shift();
    }
    
    return this.analyze(documentHeight);
  }
  
  private analyze(documentHeight: number): ReadingVelocity {
    const positions = this.scrollPositions;
    if (positions.length < 2) {
      return {
        wordsPerMinute: 0,
        scrollPattern: 'reading',
        attentionScore: 100,
        predictedTimeLeft: Math.ceil(this.wordCount / 200),
      };
    }
    
    // Calculate scroll velocity
    const recentPositions = positions.slice(-10);
    const velocities: number[] = [];
    
    for (let i = 1; i < recentPositions.length; i++) {
      const dy = Math.abs(recentPositions[i].y - recentPositions[i - 1].y);
      const dt = recentPositions[i].time - recentPositions[i - 1].time;
      if (dt > 0) velocities.push(dy / dt);
    }
    
    const avgVelocity = velocities.reduce((a, b) => a + b, 0) / (velocities.length || 1);
    
    // Determine pattern
    let scrollPattern: ReadingVelocity['scrollPattern'] = 'reading';
    if (avgVelocity > 2) scrollPattern = 'scanning';
    else if (avgVelocity < 0.3) scrollPattern = 'studying';
    
    // Calculate actual reading progress
    const currentY = positions[positions.length - 1].y;
    const progress = Math.min(1, currentY / documentHeight);
    const elapsedMinutes = (Date.now() - this.startTime) / 60000;
    const wordsRead = progress * this.wordCount;
    const wordsPerMinute = elapsedMinutes > 0.1 ? Math.round(wordsRead / elapsedMinutes) : 200;
    
    // Attention score based on reading consistency
    const velocityVariance = velocities.length > 1
      ? velocities.reduce((acc, v) => acc + Math.pow(v - avgVelocity, 2), 0) / velocities.length
      : 0;
    const attentionScore = Math.max(0, Math.min(100, 100 - velocityVariance * 50));
    
    // Predict remaining time
    const wordsLeft = this.wordCount - wordsRead;
    const predictedTimeLeft = wordsPerMinute > 0 
      ? Math.ceil(wordsLeft / wordsPerMinute) 
      : Math.ceil(wordsLeft / 200);
    
    return {
      wordsPerMinute,
      scrollPattern,
      attentionScore: Math.round(attentionScore),
      predictedTimeLeft,
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// SEMANTIC SIMILARITY MATRIX
// Calculates deep relationships between all writings
// ═══════════════════════════════════════════════════════════════

export type SimilarityEdge = {
  from: string;
  to: string;
  strength: number;
  sharedConcepts: string[];
};

const tokenize = (text: string): string[] => {
  const stopWords = new Set([
    'dan', 'yang', 'di', 'ke', 'dari', 'untuk', 'dengan', 'pada',
    'adalah', 'atau', 'ini', 'itu', 'the', 'and', 'of', 'to', 'a', 'in', 'is'
  ]);
  return text.toLowerCase()
    .replace(/[^a-zA-Z\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !stopWords.has(t));
};

const tfidf = (term: string, doc: string[], corpus: string[][]): number => {
  const tf = doc.filter(t => t === term).length / doc.length;
  const docsWithTerm = corpus.filter(d => d.includes(term)).length;
  const idf = Math.log((corpus.length + 1) / (docsWithTerm + 1));
  return tf * idf;
};

export const buildSimilarityMatrix = (writings: Writing[]): SimilarityEdge[] => {
  const corpus = writings.map(w => tokenize(`${w.title} ${w.content}`));
  const edges: SimilarityEdge[] = [];
  
  // Get top terms for each document
  const topTerms = corpus.map((doc, i) => {
    const termScores = new Map<string, number>();
    const uniqueTerms = [...new Set(doc)];
    uniqueTerms.forEach(term => {
      termScores.set(term, tfidf(term, doc, corpus));
    });
    return [...termScores.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([term]) => term);
  });
  
  // Calculate pairwise similarity
  for (let i = 0; i < writings.length; i++) {
    for (let j = i + 1; j < writings.length; j++) {
      const sharedConcepts = topTerms[i].filter(t => topTerms[j].includes(t));
      const tagOverlap = writings[i].tags.filter(t => writings[j].tags.includes(t));
      
      const conceptStrength = sharedConcepts.length / 10;
      const tagStrength = tagOverlap.length / Math.max(writings[i].tags.length, writings[j].tags.length, 1);
      const strength = conceptStrength * 0.6 + tagStrength * 0.4;
      
      if (strength > 0.1) {
        edges.push({
          from: writings[i].id,
          to: writings[j].id,
          strength,
          sharedConcepts: [...sharedConcepts, ...tagOverlap].slice(0, 3),
        });
      }
    }
  }
  
  return edges.sort((a, b) => b.strength - a.strength);
};

// ═══════════════════════════════════════════════════════════════
// EMOTIONAL ARC ANALYZER
// Maps the emotional journey through a piece of writing
// ═══════════════════════════════════════════════════════════════

export type EmotionalPoint = {
  position: number; // 0-1
  intensity: number; // 0-1
  tone: 'calm' | 'rising' | 'peak' | 'falling' | 'resolve';
};

const emotionWords = {
  positive: ['harapan', 'cahaya', 'terbit', 'indah', 'tenang', 'hope', 'light', 'peace', 'joy'],
  negative: ['gelap', 'sedih', 'rindu', 'takut', 'dark', 'sad', 'fear', 'lost'],
  intensity: ['sangat', 'paling', 'selalu', 'tidak', 'bukan', 'very', 'most', 'always', 'never'],
};

export const analyzeEmotionalArc = (content: string): EmotionalPoint[] => {
  const sentences = content.split(/[.!?]+/).filter(Boolean);
  const points: EmotionalPoint[] = [];
  const windowSize = Math.ceil(sentences.length / 8);
  
  for (let i = 0; i < 8; i++) {
    const start = i * windowSize;
    const chunk = sentences.slice(start, start + windowSize).join(' ').toLowerCase();
    const words = chunk.split(/\s+/);
    
    const positiveCount = words.filter(w => emotionWords.positive.some(e => w.includes(e))).length;
    const negativeCount = words.filter(w => emotionWords.negative.some(e => w.includes(e))).length;
    const intensityCount = words.filter(w => emotionWords.intensity.some(e => w.includes(e))).length;
    
    const valence = (positiveCount - negativeCount) / (words.length || 1);
    const intensity = Math.min(1, (positiveCount + negativeCount + intensityCount) / 10);
    
    let tone: EmotionalPoint['tone'] = 'calm';
    if (i < 2) tone = valence > 0 ? 'rising' : 'calm';
    else if (i < 4) tone = intensity > 0.3 ? 'peak' : 'rising';
    else if (i < 6) tone = 'falling';
    else tone = 'resolve';
    
    points.push({
      position: i / 7,
      intensity: 0.3 + intensity * 0.7,
      tone,
    });
  }
  
  return points;
};

// ═══════════════════════════════════════════════════════════════
// CONCEPT CONSTELLATION MAPPER
// Groups related concepts into visual clusters
// ═══════════════════════════════════════════════════════════════

export type ConceptNode = {
  id: string;
  label: string;
  weight: number;
  cluster: number;
  x: number;
  y: number;
};

export type ConceptEdge = {
  source: string;
  target: string;
  weight: number;
};

export const buildConceptConstellation = (writings: Writing[]): {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
} => {
  // Extract all concepts
  const conceptCounts = new Map<string, number>();
  const conceptWritings = new Map<string, Set<string>>();
  
  writings.forEach(w => {
    const tokens = tokenize(`${w.title} ${w.content}`);
    const concepts = [...new Set([...w.tags, ...tokens.slice(0, 20)])];
    
    concepts.forEach(c => {
      conceptCounts.set(c, (conceptCounts.get(c) || 0) + 1);
      if (!conceptWritings.has(c)) conceptWritings.set(c, new Set());
      conceptWritings.get(c)!.add(w.id);
    });
  });
  
  // Get top concepts
  const topConcepts = [...conceptCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([concept]) => concept);
  
  // Build edges based on co-occurrence
  const edges: ConceptEdge[] = [];
  for (let i = 0; i < topConcepts.length; i++) {
    for (let j = i + 1; j < topConcepts.length; j++) {
      const aWritings = conceptWritings.get(topConcepts[i]) || new Set();
      const bWritings = conceptWritings.get(topConcepts[j]) || new Set();
      const intersection = [...aWritings].filter(w => bWritings.has(w)).length;
      
      if (intersection > 0) {
        edges.push({
          source: topConcepts[i],
          target: topConcepts[j],
          weight: intersection / Math.max(aWritings.size, bWritings.size),
        });
      }
    }
  }
  
  // Simple clustering based on connectivity
  const clusters = new Map<string, number>();
  let currentCluster = 0;
  
  topConcepts.forEach(concept => {
    if (clusters.has(concept)) return;
    
    const connected = edges
      .filter(e => e.source === concept || e.target === concept)
      .flatMap(e => [e.source, e.target])
      .filter(c => c !== concept);
    
    clusters.set(concept, currentCluster);
    connected.forEach(c => {
      if (!clusters.has(c)) clusters.set(c, currentCluster);
    });
    
    currentCluster++;
  });
  
  // Position nodes in a force-directed-like layout
  const nodes: ConceptNode[] = topConcepts.map((concept, i) => {
    const cluster = clusters.get(concept) || 0;
    const angle = (cluster / currentCluster) * Math.PI * 2;
    const radius = 30 + Math.random() * 20;
    
    return {
      id: concept,
      label: concept,
      weight: conceptCounts.get(concept) || 1,
      cluster,
      x: 50 + Math.cos(angle + i * 0.3) * radius,
      y: 50 + Math.sin(angle + i * 0.3) * radius,
    };
  });
  
  return { nodes, edges };
};

// ═══════════════════════════════════════════════════════════════
// TIME-AWARE THEME
// Adjusts UI warmth based on time of day
// ═══════════════════════════════════════════════════════════════

export type TimeTheme = {
  warmth: number; // 0 = cool, 1 = warm
  brightness: number;
  period: 'night' | 'dawn' | 'day' | 'dusk';
};

export const getTimeTheme = (): TimeTheme => {
  const hour = new Date().getHours();
  
  let period: TimeTheme['period'];
  let warmth: number;
  let brightness: number;
  
  if (hour >= 5 && hour < 8) {
    period = 'dawn';
    warmth = 0.3;
    brightness = 0.4;
  } else if (hour >= 8 && hour < 17) {
    period = 'day';
    warmth = 0.2;
    brightness = 0.5;
  } else if (hour >= 17 && hour < 20) {
    period = 'dusk';
    warmth = 0.6;
    brightness = 0.35;
  } else {
    period = 'night';
    warmth = 0.1;
    brightness = 0.3;
  }
  
  return { warmth, brightness, period };
};

// ═══════════════════════════════════════════════════════════════
// WRITING RHYTHM ANALYZER  
// Detects the natural rhythm and pacing of text
// ═══════════════════════════════════════════════════════════════

export type RhythmProfile = {
  avgSentenceLength: number;
  variance: number;
  tempo: 'adagio' | 'andante' | 'allegro';
  breathingPoints: number[]; // Positions (0-1) where natural pauses occur
};

export const analyzeRhythm = (content: string): RhythmProfile => {
  const sentences = content.split(/[.!?]+/).filter(Boolean);
  const lengths = sentences.map(s => s.trim().split(/\s+/).length);
  
  const avg = lengths.reduce((a, b) => a + b, 0) / (lengths.length || 1);
  const variance = lengths.reduce((acc, l) => acc + Math.pow(l - avg, 2), 0) / (lengths.length || 1);
  
  let tempo: RhythmProfile['tempo'];
  if (avg < 10) tempo = 'allegro';
  else if (avg < 20) tempo = 'andante';
  else tempo = 'adagio';
  
  // Find breathing points (after longer sentences)
  const breathingPoints: number[] = [];
  let position = 0;
  sentences.forEach((s, i) => {
    position += s.length;
    if (lengths[i] > avg * 1.3) {
      breathingPoints.push(position / content.length);
    }
  });
  
  return {
    avgSentenceLength: Math.round(avg),
    variance: Math.round(variance),
    tempo,
    breathingPoints: breathingPoints.slice(0, 5),
  };
};

// ═══════════════════════════════════════════════════════════════
// SEMANTIC WEIGHT HIGHLIGHTER
// Identifies the most semantically important words
// ═══════════════════════════════════════════════════════════════

export const getSemanticWeights = (content: string): Map<string, number> => {
  const words = tokenize(content);
  const freq = new Map<string, number>();
  
  words.forEach(w => freq.set(w, (freq.get(w) || 0) + 1));
  
  // Position boost (beginning and end are more important)
  const positionBoost = new Map<string, number>();
  const totalWords = words.length;
  
  words.forEach((w, i) => {
    const normalizedPos = i / totalWords;
    const boost = normalizedPos < 0.2 || normalizedPos > 0.8 ? 1.5 : 1;
    positionBoost.set(w, Math.max(positionBoost.get(w) || 0, boost));
  });
  
  // Combine frequency and position
  const weights = new Map<string, number>();
  freq.forEach((count, word) => {
    const freqScore = Math.log(count + 1);
    const posBoost = positionBoost.get(word) || 1;
    weights.set(word, freqScore * posBoost);
  });
  
  // Normalize
  const maxWeight = Math.max(...weights.values());
  weights.forEach((w, k) => weights.set(k, w / maxWeight));
  
  return weights;
};
