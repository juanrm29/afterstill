import { NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const SYSTEM_PROMPT = `You are a thoughtful writing prompt generator inspired by Stoic philosophy and introspective literature. 
Generate a single, evocative writing prompt that encourages deep reflection on human experience, mortality, relationships, memory, or personal growth.

Guidelines:
- Keep prompts concise (1-2 sentences max)
- Use poetic, contemplative language
- Draw from themes like: time, loss, silence, solitude, change, acceptance, impermanence
- Occasionally include prompts inspired by Stoic philosophers (Marcus Aurelius, Seneca, Epictetus)
- Make prompts universal enough for anyone to relate to
- Avoid clichés and overly positive/motivational tones
- Embrace melancholy, reflection, and quiet wisdom

Respond with ONLY the prompt text, nothing else. No quotation marks, no attribution, just the prompt itself.`;

export async function POST() {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: "Generate a writing prompt." },
        ],
        max_tokens: 100,
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.error?.message || "OpenAI API error" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const prompt = data.choices[0]?.message?.content?.trim() || "";

    return NextResponse.json({ prompt });
  } catch (error) {
    console.error("Error generating prompt:", error);
    return NextResponse.json(
      { error: "Failed to generate prompt" },
      { status: 500 }
    );
  }
}
