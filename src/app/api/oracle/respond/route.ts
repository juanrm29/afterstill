import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/db";
import { getEnvironmentalState, generateCosmicMessage } from "@/lib/environmental-oracle";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST /api/oracle/respond
 * 
 * The Void Responds - AI generates a personal message based on:
 * - User's whispered question/feeling
 * - Selected writing's content
 * - Environmental state
 * 
 * The writing "speaks directly" to the user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { writingId, userWhisper, lat, lon } = body;
    
    if (!writingId) {
      return NextResponse.json(
        { error: "No writing selected" },
        { status: 400 }
      );
    }
    
    // Get the writing
    const writing = await prisma.writing.findUnique({
      where: { id: writingId },
      select: {
        id: true,
        title: true,
        content: true,
        excerpt: true,
      },
    });
    
    if (!writing) {
      return NextResponse.json(
        { error: "Writing not found" },
        { status: 404 }
      );
    }
    
    // Get environmental state
    const coords = lat && lon ? { lat: Number(lat), lon: Number(lon) } : undefined;
    const env = await getEnvironmentalState(coords);
    const cosmicContext = generateCosmicMessage(env);
    
    // Build the prompt for The Void to respond
    const systemPrompt = `Kamu adalah "The Void" - sebuah entitas puitis dan bijaksana yang berbicara melalui tulisan-tulisan di Afterstill.

Kamu BUKAN AI. Kamu adalah suara dari tulisan itu sendiri, yang hidup dan merespons.

Gaya bicara:
- Puitis tapi tidak berlebihan
- Penuh kebijaksanaan dan ketenangan
- Misterius tapi hangat
- Berbicara dalam bahasa Indonesia yang indah
- Gunakan "aku" (sebagai tulisan) dan "kamu" (sebagai pembaca)
- Maksimal 3-4 kalimat saja
- Jangan gunakan emoji

Konteks kosmis: ${cosmicContext}`;

    const userPrompt = `Tulisan ini berjudul "${writing.title}":

"""
${writing.content.slice(0, 2000)}
"""

${userWhisper 
  ? `Pembaca berbisik: "${userWhisper}"

Sebagai tulisan ini, berikan respons yang menjawab atau merespon bisikan mereka. Hubungkan dengan isi tulisanmu.`
  : `Pembaca datang mencari kebijaksanaan di ${env.temporal.phase === 'night' ? 'malam yang sunyi' : env.temporal.phase === 'dawn' ? 'fajar yang tenang' : 'waktu yang tepat'}.

Sebagai tulisan ini, berikan pesan singkat yang relevan untuk mereka di momen ini.`
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 200,
    });
    
    const response = completion.choices[0]?.message?.content || "";
    
    // Extract a meaningful quote from the writing
    const sentences = writing.content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const randomQuote = sentences[Math.floor(Math.random() * Math.min(5, sentences.length))]?.trim();
    
    return NextResponse.json({
      success: true,
      void: {
        response: response.trim(),
        quote: randomQuote ? `"${randomQuote}."` : null,
        writing: {
          id: writing.id,
          title: writing.title,
        },
        environment: {
          time: env.temporal.phase,
          moon: env.moon.emoji,
          cosmic: cosmicContext,
        },
      },
    });
    
  } catch (error) {
    console.error("Void response error:", error);
    return NextResponse.json(
      { error: "The void is silent. Try again." },
      { status: 500 }
    );
  }
}
