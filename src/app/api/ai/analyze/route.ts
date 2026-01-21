import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { content, title } = await request.json();

    if (!content || content.trim().length < 50) {
      return NextResponse.json(
        { error: "Content terlalu pendek untuk dianalisis" },
        { status: 400 }
      );
    }

    const prompt = `Kamu adalah asisten editorial yang sangat cerdas untuk platform penulisan "Afterstill" - sebuah ruang untuk refleksi dan tulisan kontemplatif.

Analisis tulisan berikut dan berikan:

1. **Excerpt** (1-2 kalimat yang menangkap esensi tulisan, maksimal 200 karakter)
2. **Tags** (3-5 kata kunci relevan dalam bahasa Indonesia, lowercase, tanpa spasi)
3. **Mood** (satu kata yang menggambarkan suasana: melancholic, hopeful, introspective, peaceful, contemplative, nostalgic, bittersweet)
4. **Summary** (ringkasan singkat 2-3 kalimat untuk preview)

${title ? `Judul: "${title}"` : ""}

Tulisan:
"""
${content.slice(0, 3000)}
"""

Berikan respons dalam format JSON:
{
  "excerpt": "...",
  "tags": ["tag1", "tag2", "tag3"],
  "mood": "...",
  "summary": "..."
}

PENTING: Hanya berikan JSON, tanpa markdown atau penjelasan tambahan.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Kamu adalah asisten editorial yang menganalisis tulisan dan memberikan metadata. Selalu respons dalam JSON valid.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const responseText = completion.choices[0]?.message?.content || "";
    
    // Parse JSON from response
    let analysis;
    try {
      // Try to extract JSON if wrapped in markdown code block
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch {
      // Fallback parsing
      analysis = {
        excerpt: "",
        tags: [],
        mood: "contemplative",
        summary: responseText,
      };
    }

    return NextResponse.json({
      success: true,
      analysis: {
        excerpt: analysis.excerpt || "",
        tags: Array.isArray(analysis.tags) ? analysis.tags.slice(0, 5) : [],
        mood: analysis.mood || "contemplative",
        summary: analysis.summary || "",
      },
    });
  } catch (error) {
    console.error("AI analysis error:", error);
    return NextResponse.json(
      { error: "Gagal menganalisis tulisan" },
      { status: 500 }
    );
  }
}
