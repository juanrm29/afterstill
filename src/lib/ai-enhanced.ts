/**
 * Advanced AI utilities for content analysis and recommendations
 */

import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Analyze writing sentiment and themes
 */
export async function analyzeWriting(content: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are a literary analyst. Analyze the given text and provide:
1. Sentiment (positive, negative, neutral, mixed)
2. Main themes (up to 5)
3. Emotional tone
4. Writing style
5. Complexity level (1-10)
6. Suggested tags
Return as JSON.`,
        },
        {
          role: "user",
          content,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("AI analysis error:", error);
    return null;
  }
}

/**
 * Generate semantic embeddings for similarity search
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error("Embedding generation error:", error);
    return [];
  }
}

/**
 * Calculate cosine similarity between embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Find similar writings based on embeddings
 */
export async function findSimilarWritings(
  targetEmbedding: number[],
  allWritings: Array<{ id: string; embedding: number[]; title: string }>,
  limit: number = 5
) {
  const similarities = allWritings
    .map((writing) => ({
      ...writing,
      similarity: cosineSimilarity(targetEmbedding, writing.embedding),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  return similarities;
}

/**
 * Generate smart excerpt from content
 */
export async function generateExcerpt(
  content: string,
  maxLength: number = 200
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `Generate a compelling excerpt (max ${maxLength} characters) that captures the essence of the text. Make it intriguing and representative.`,
        },
        {
          role: "user",
          content,
        },
      ],
      max_tokens: 100,
      temperature: 0.7,
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    // Fallback to simple excerpt
    return content.substring(0, maxLength) + "...";
  }
}

/**
 * Smart tag suggestion based on content
 */
export async function suggestTags(
  content: string,
  existingTags: string[] = []
): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `Suggest 3-5 relevant tags for this writing. Consider existing tags: ${existingTags.join(", ")}. Return as JSON array.`,
        },
        {
          role: "user",
          content,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.tags || [];
  } catch (error) {
    console.error("Tag suggestion error:", error);
    return [];
  }
}

/**
 * Generate reading time estimate with AI insights
 */
export function calculateReadingTime(
  content: string,
  wpm: number = 200
): {
  minutes: number;
  words: number;
  complexity: "easy" | "medium" | "hard";
} {
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wpm);

  // Simple complexity heuristic
  const avgWordLength =
    content.replace(/\s/g, "").length / words;
  const sentenceCount = content.split(/[.!?]+/).length;
  const avgWordsPerSentence = words / sentenceCount;

  let complexity: "easy" | "medium" | "hard" = "medium";
  if (avgWordLength < 5 && avgWordsPerSentence < 15) {
    complexity = "easy";
  } else if (avgWordLength > 6 || avgWordsPerSentence > 25) {
    complexity = "hard";
  }

  return { minutes, words, complexity };
}

/**
 * Personalized content recommendations
 */
export async function getPersonalizedRecommendations(
  userHistory: Array<{ id: string; embedding: number[] }>,
  allContent: Array<{ id: string; embedding: number[]; title: string }>,
  limit: number = 5
) {
  // Create user profile by averaging embeddings
  const userProfile = userHistory.reduce(
    (acc, item) => {
      item.embedding.forEach((val, i) => {
        acc[i] = (acc[i] || 0) + val / userHistory.length;
      });
      return acc;
    },
    [] as number[]
  );

  // Find similar content
  const recommendations = await findSimilarWritings(
    userProfile,
    allContent.filter(
      (c) => !userHistory.find((h) => h.id === c.id)
    ),
    limit
  );

  return recommendations;
}

/**
 * Mood-based content filtering
 */
export function filterByMood(
  writings: Array<{ mood?: string; tags: string[] }>,
  targetMood: string
): Array<any> {
  const moodMap: Record<string, string[]> = {
    calm: ["peaceful", "serene", "gentle", "quiet", "meditative"],
    energetic: ["dynamic", "exciting", "vibrant", "active", "intense"],
    melancholic: ["sad", "reflective", "nostalgic", "somber", "contemplative"],
    joyful: ["happy", "cheerful", "uplifting", "bright", "positive"],
    mysterious: ["enigmatic", "dark", "cryptic", "intriguing", "obscure"],
  };

  const relatedKeywords = moodMap[targetMood.toLowerCase()] || [];

  return writings.filter((writing) => {
    const matchesMood = writing.mood === targetMood;
    const matchesTags = writing.tags.some((tag) =>
      relatedKeywords.some((keyword) =>
        tag.toLowerCase().includes(keyword)
      )
    );
    return matchesMood || matchesTags;
  });
}

/**
 * Content quality scoring
 */
export function scoreContentQuality(content: string): {
  score: number;
  factors: Record<string, number>;
} {
  const factors = {
    length: Math.min((content.length / 2000) * 100, 100),
    vocabulary: calculateVocabularyRichness(content),
    readability: calculateReadability(content),
    structure: analyzeStructure(content),
  };

  const score =
    Object.values(factors).reduce((sum, val) => sum + val, 0) /
    Object.keys(factors).length;

  return { score, factors };
}

function calculateVocabularyRichness(text: string): number {
  const words = text.toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words);
  return Math.min((uniqueWords.size / words.length) * 100, 100);
}

function calculateReadability(text: string): number {
  // Flesch reading ease approximation
  const words = text.split(/\s+/).length;
  const sentences = text.split(/[.!?]+/).length;
  const syllables = text.split(/[aeiouy]+/i).length - 1;

  const avgWordsPerSentence = words / sentences;
  const avgSyllablesPerWord = syllables / words;

  const score =
    206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

  return Math.max(0, Math.min(score, 100));
}

function analyzeStructure(text: string): number {
  const paragraphs = text.split(/\n\n+/);
  const avgParagraphLength = text.length / paragraphs.length;

  // Good structure: 3-7 paragraphs, 100-300 chars each
  let score = 100;
  if (paragraphs.length < 3) score -= 20;
  if (paragraphs.length > 10) score -= 10;
  if (avgParagraphLength < 100) score -= 15;
  if (avgParagraphLength > 500) score -= 15;

  return Math.max(0, score);
}
