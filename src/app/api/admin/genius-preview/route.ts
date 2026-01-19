import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Genius Preview - AI-powered writing analysis
const SYSTEM_PROMPT = `You are a literary analyst providing deep insights about writing pieces. Analyze the given text and provide:

1. **Mood & Atmosphere**: The emotional tone and feeling
2. **Key Themes**: 2-3 main themes explored
3. **Literary Devices**: Notable techniques used (metaphors, imagery, etc.)
4. **Resonance Score**: A poetic assessment of impact (e.g., "Echoes like rain on still water")
5. **Reading Companion**: A brief note about what kind of reader would connect with this
6. **Suggested Tags**: 3-5 thematic tags

Keep each section concise (1-2 sentences). Be insightful and poetic in your analysis, not clinical. Format as JSON with keys: mood, themes (array), devices (array), resonance, companion, suggestedTags (array).`;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { content, title } = await request.json();

    if (!content || content.length < 50) {
      return NextResponse.json({ error: "Content too short for analysis" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      // Fallback response for demo
      return NextResponse.json({
        analysis: generateFallbackAnalysis(content, title),
      });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Title: "${title || 'Untitled'}"\n\nContent:\n${content.slice(0, 3000)}` },
        ],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API error");
      return NextResponse.json({
        analysis: generateFallbackAnalysis(content, title),
      });
    }

    const data = await response.json();
    const analysisText = data.choices[0]?.message?.content || "{}";
    
    try {
      const analysis = JSON.parse(analysisText);
      return NextResponse.json({ analysis });
    } catch {
      return NextResponse.json({
        analysis: generateFallbackAnalysis(content, title),
      });
    }
  } catch (error) {
    console.error("Genius preview error:", error);
    return NextResponse.json(
      { error: "Failed to analyze" },
      { status: 500 }
    );
  }
}

function generateFallbackAnalysis(content: string, title?: string) {
  // Simple heuristic-based analysis
  const wordCount = content.split(/\s+/).length;
  const hasQuestions = content.includes("?");
  const hasEllipsis = content.includes("...");
  
  const moodIndicators = {
    melancholic: ["rain", "shadow", "loss", "memory", "fade", "silent", "alone", "empty"],
    hopeful: ["light", "dawn", "hope", "grow", "begin", "new", "rise", "dream"],
    contemplative: ["perhaps", "wonder", "seem", "might", "time", "moment", "still"],
    peaceful: ["quiet", "gentle", "soft", "calm", "breath", "rest", "peace"],
  };
  
  const contentLower = content.toLowerCase();
  let detectedMood = "introspective";
  let maxScore = 0;
  
  for (const [mood, words] of Object.entries(moodIndicators)) {
    const score = words.filter(w => contentLower.includes(w)).length;
    if (score > maxScore) {
      maxScore = score;
      detectedMood = mood;
    }
  }

  const themes = [];
  if (contentLower.includes("time") || contentLower.includes("memory") || contentLower.includes("past")) {
    themes.push("Time & Memory");
  }
  if (contentLower.includes("heart") || contentLower.includes("feel") || contentLower.includes("love")) {
    themes.push("Emotional Depth");
  }
  if (contentLower.includes("silence") || contentLower.includes("alone") || contentLower.includes("solitude")) {
    themes.push("Solitude");
  }
  if (themes.length === 0) themes.push("Human Experience", "Reflection");

  const devices = [];
  if (hasEllipsis) devices.push("Strategic pauses");
  if (hasQuestions) devices.push("Rhetorical questioning");
  if (content.includes(",") && content.split(",").length > 5) devices.push("Flowing rhythm");
  if (devices.length === 0) devices.push("Prose poetry elements");

  const resonanceOptions = [
    "Settles like dust in afternoon light",
    "Echoes through quiet corridors of thought",
    "Lingers like the last note of a song",
    "Ripples outward from a still center",
    "Whispers at the edge of consciousness",
  ];

  const companionOptions = [
    "Readers who find comfort in stillness",
    "Those who pause to watch rain fall",
    "People who keep journals of quiet moments",
    "Seekers of meaning in the ordinary",
  ];

  return {
    mood: detectedMood.charAt(0).toUpperCase() + detectedMood.slice(1) + (wordCount < 300 ? ", condensed" : ", expansive"),
    themes,
    devices,
    resonance: resonanceOptions[Math.floor(Math.random() * resonanceOptions.length)],
    companion: companionOptions[Math.floor(Math.random() * companionOptions.length)],
    suggestedTags: themes.map(t => t.toLowerCase().replace(/\s+/g, "-")).concat(detectedMood),
  };
}
