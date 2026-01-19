import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// AI Writing Assistant API
// This uses a prompt-based approach - can be connected to OpenAI, Claude, or local LLM

const SYSTEM_PROMPT = `You are a creative writing assistant for Afterstill, a contemplative writing platform. 
Your responses should be:
- Thoughtful and literary in style
- Concise but meaningful
- Match the tone of the existing content when improving/transforming
- Poetic when requested, professional when requested
Always respond with just the text, no explanations or meta-commentary.`;

const ACTION_PROMPTS: Record<string, (text: string, context: string) => string> = {
  continue: (text, context) => `Continue this writing naturally, maintaining the same style and voice. Write 2-3 paragraphs:\n\n${context.slice(-1000)}`,
  
  improve: (text) => `Improve this text while keeping its essence. Make it more vivid and engaging:\n\n${text}`,
  
  shorten: (text) => `Condense this text to half its length while preserving the key meaning and style:\n\n${text}`,
  
  expand: (text) => `Expand this text with more detail, description, and depth. Double its length:\n\n${text}`,
  
  rephrase: (text) => `Rephrase this text completely in a fresh way while keeping the same meaning:\n\n${text}`,
  
  fix_grammar: (text) => `Fix any grammar, spelling, or punctuation errors in this text. Return only the corrected text:\n\n${text}`,
  
  professional: (text) => `Rewrite this in a more professional, polished tone while keeping the core message:\n\n${text}`,
  
  poetic: (text) => `Transform this into more poetic, lyrical prose with literary devices and imagery:\n\n${text}`,
  
  summarize: (text) => `Summarize this text in 2-3 concise sentences:\n\n${text}`,
  
  ideas: (text, context) => `Based on this writing, suggest 3-5 interesting directions or ideas to explore next. Format as a simple list:\n\n${context.slice(-500)}`,
};

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { action, text, context } = await request.json();

    if (!action || !ACTION_PROMPTS[action]) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const prompt = ACTION_PROMPTS[action](text || "", context || "");

    // Check for OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      // Fallback: Return a placeholder response for demo
      return NextResponse.json({
        result: generateFallbackResponse(action, text),
      });
    }

    // Call OpenAI API
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
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("OpenAI API error:", error);
      return NextResponse.json({
        result: generateFallbackResponse(action, text),
      });
    }

    const data = await response.json();
    const result = data.choices[0]?.message?.content || "No response generated.";

    return NextResponse.json({ result });
  } catch (error) {
    console.error("AI Writer error:", error);
    return NextResponse.json(
      { error: "Failed to process AI request" },
      { status: 500 }
    );
  }
}

// Fallback responses when no API key is configured
function generateFallbackResponse(action: string, text: string): string {
  const responses: Record<string, string> = {
    continue: `[AI Continue] The narrative threads weave forward, each word a step deeper into the contemplation. What began as a whisper now grows into a meditation on the nature of stillness itself...

The silence between thoughts becomes its own language, speaking volumes in the spaces where words dare not tread. Here, in this liminal moment, understanding blooms like a night flower opening to the moon.`,
    
    improve: text 
      ? `[Improved] ${text.split('.').map((s, i) => i === 0 ? s.trim() + ', a truth both simple and profound' : s).join('. ')}`
      : "[AI] Select text to improve.",
    
    shorten: text 
      ? `[Shortened] ${text.split(' ').slice(0, Math.ceil(text.split(' ').length / 2)).join(' ')}...`
      : "[AI] Select text to shorten.",
    
    expand: text
      ? `[Expanded] ${text}\n\nThis thought deserves deeper exploration. Consider the layers beneath the surface—each word carries weight, each pause holds meaning. What we say speaks; what we leave unsaid resonates even louder.`
      : "[AI] Select text to expand.",
    
    rephrase: text
      ? `[Rephrased] In other words: ${text.split(' ').reverse().slice(0, -1).reverse().join(' ')}—a different path to the same destination.`
      : "[AI] Select text to rephrase.",
    
    fix_grammar: text || "[AI] Select text to check grammar.",
    
    professional: text
      ? `[Professional] Upon careful consideration, ${text.toLowerCase().replace(/^./, c => c.toUpperCase())}`
      : "[AI] Select text to make professional.",
    
    poetic: text
      ? `[Poetic] Like moonlight dancing on still water, ${text.toLowerCase()}—a truth whispered by the wind to those who pause to listen.`
      : "[AI] Select text to make poetic.",
    
    summarize: "[Summary] This piece explores themes of contemplation and presence, weaving together moments of stillness with deeper philosophical inquiry.",
    
    ideas: `Ideas to explore:
• What happens in the spaces between these moments?
• Consider the perspective of silence itself
• Explore the tension between movement and stillness
• What would the opposite voice say?
• Dive deeper into the sensory details`,
  };

  return responses[action] || "[AI] Processing...";
}
