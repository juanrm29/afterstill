import { NextResponse } from "next/server";
import { 
  getEnvironmentalState, 
  selectFatedWriting,
  generateCosmicMessage,
  type WritingMood,
} from "@/lib/environmental-oracle";
import { prisma } from "@/lib/db";

/**
 * POST /api/oracle/divine
 * 
 * Environmental Oracle - The universe selects a writing based on:
 * - Time of day
 * - Moon phase  
 * - Weather conditions
 * - Season
 * - Cosmic alignment
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lat, lon } = body;
    
    // Get environmental state
    const coords = lat && lon ? { lat: Number(lat), lon: Number(lon) } : undefined;
    const env = await getEnvironmentalState(coords);
    
    // Fetch all writings with their content for theme analysis
    const writings = await prisma.writing.findMany({
      where: { status: "PUBLISHED" },
      select: {
        id: true,
        title: true,
        content: true,
        tags: {
          select: {
            tag: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
    
    if (writings.length === 0) {
      return NextResponse.json(
        { error: "No writings found" },
        { status: 404 }
      );
    }
    
    // Analyze writings and assign mood/themes
    const analyzedWritings: WritingMood[] = writings.map(w => {
      // Extract themes from content and tags
      const content = w.content.toLowerCase();
      const tags = w.tags.map((t) => t.tag.name.toLowerCase());
      
      const themes: string[] = [...tags];
      
      // Simple theme extraction from content
      const themeKeywords = {
        stillness: ["diam", "tenang", "sunyi", "hening", "still"],
        melancholy: ["sedih", "hilang", "kehilangan", "rindu", "pergi"],
        hope: ["harap", "cahaya", "esok", "mimpi", "bangkit"],
        love: ["cinta", "kasih", "hati", "jiwa", "bersama"],
        nature: ["hujan", "laut", "langit", "malam", "bulan", "angin"],
        introspection: ["diri", "aku", "pikir", "rasa", "dalam"],
        time: ["waktu", "masa", "hari", "detik", "abadi"],
        change: ["berubah", "jalan", "langkah", "baru", "lagi"],
      };
      
      for (const [theme, keywords] of Object.entries(themeKeywords)) {
        if (keywords.some(k => content.includes(k))) {
          themes.push(theme);
        }
      }
      
      // Determine energy
      let energy: WritingMood["energy"] = "calm";
      if (content.includes("!") || themes.includes("hope")) {
        energy = "hopeful";
      } else if (themes.includes("melancholy")) {
        energy = "melancholic";
      } else if (themes.includes("nature") && themes.includes("time")) {
        energy = "mysterious";
      } else if (content.length > 2000) {
        energy = "intense";
      }
      
      // Time affinity based on themes
      const timeAffinity: WritingMood["timeAffinity"] = [];
      if (themes.includes("stillness") || themes.includes("introspection")) {
        timeAffinity.push("night", "midnight");
      }
      if (themes.includes("hope") || themes.includes("change")) {
        timeAffinity.push("dawn", "morning");
      }
      if (themes.includes("melancholy")) {
        timeAffinity.push("dusk", "night");
      }
      if (timeAffinity.length === 0) {
        timeAffinity.push("afternoon", "morning"); // Default
      }
      
      // Weather affinity
      const weatherAffinity: WritingMood["weatherAffinity"] = [];
      if (content.includes("hujan") || themes.includes("melancholy")) {
        weatherAffinity.push("rain");
      }
      if (themes.includes("stillness")) {
        weatherAffinity.push("clear", "mist");
      }
      if (themes.includes("hope")) {
        weatherAffinity.push("clear", "clouds");
      }
      if (energy === "mysterious") {
        weatherAffinity.push("mist", "storm");
      }
      if (weatherAffinity.length === 0) {
        weatherAffinity.push("clear", "clouds");
      }
      
      // Moon affinity
      const moonAffinity: WritingMood["moonAffinity"] = [];
      if (themes.includes("introspection") || themes.includes("stillness")) {
        moonAffinity.push("new");
      }
      if (themes.includes("love") || energy === "intense") {
        moonAffinity.push("full");
      }
      if (themes.includes("hope") || themes.includes("change")) {
        moonAffinity.push("waxing");
      }
      if (themes.includes("melancholy") || themes.includes("time")) {
        moonAffinity.push("waning");
      }
      if (moonAffinity.length === 0) {
        moonAffinity.push("waxing", "waning");
      }
      
      return {
        id: w.id,
        title: w.title,
        themes,
        energy,
        timeAffinity,
        weatherAffinity,
        moonAffinity,
      };
    });
    
    // Select fated writing
    const reading = selectFatedWriting(analyzedWritings, env);
    
    if (!reading) {
      return NextResponse.json(
        { error: "Could not divine a reading" },
        { status: 500 }
      );
    }
    
    // Get the full writing
    const selectedWriting = writings.find(w => w.id === reading.writingId);
    
    return NextResponse.json({
      success: true,
      oracle: {
        writing: {
          id: selectedWriting?.id,
          title: selectedWriting?.title,
        },
        resonance: reading.resonanceScore,
        cosmicMessage: reading.cosmicMessage,
        factors: reading.environmentalFactors,
        environment: {
          time: env.temporal.phase,
          moon: env.moon,
          weather: env.weather,
          season: env.cosmic.season,
          isLiminal: env.cosmic.isLiminal,
        },
      },
    });
    
  } catch (error) {
    console.error("Oracle error:", error);
    return NextResponse.json(
      { error: "The oracle is silent" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/oracle/divine
 * 
 * Quick divine without location
 */
export async function GET() {
  try {
    const env = await getEnvironmentalState();
    
    return NextResponse.json({
      success: true,
      environment: {
        time: env.temporal.phase,
        moon: env.moon,
        season: env.cosmic.season,
        isLiminal: env.cosmic.isLiminal,
      },
      cosmicMessage: generateCosmicMessage(env),
    });
    
  } catch (error) {
    console.error("Oracle error:", error);
    return NextResponse.json(
      { error: "The oracle is silent" },
      { status: 500 }
    );
  }
}
