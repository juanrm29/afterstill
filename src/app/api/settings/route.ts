import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/settings - Get public site settings (no auth required)
export async function GET() {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "main" },
    });

    if (!settings) {
      // Return default settings if none exist
      return NextResponse.json({
        id: "main",
        siteName: "Afterstill",
        siteTagline: "Words for the quiet hours",
        siteDescription: null,
        oracleEnabled: true,
        radioEnabled: true,
        catalogEnabled: true,
        candleEnabled: true,
        nightStartHour: 20,
        nightEndHour: 5,
        twitterUrl: null,
        githubUrl: null,
        instagramUrl: null,
        emailContact: null,
        aboutPronunciation: "/ ˈæf.tɚ.stɪl / — the quiet that follows",
        aboutSection1Title: "The Space",
        aboutSection1Content: "Afterstill is a sanctuary for words that needed time to settle. Not a blog, not a journal—more like a collection of quiet observations gathered from the margins of experience.",
        aboutSection2Title: "The Name",
        aboutSection2Content: "What happens when motion stops? There's a stillness that follows—the afterstill. It's where things become clearer. Not because they've changed, but because we've finally stopped to look.",
        aboutSection3Title: "The Practice",
        aboutSection3Content: "Each piece begins as a fragment—an image, a question, a feeling that wouldn't dissolve. They're not answers, but attempts at attention. Attempts to stay with something long enough for it to reveal its shape.",
        aboutSection4Title: "The Craft",
        aboutSection4Content: "Built with intention—every animation, every spacing, every interaction considered. The design serves the words, creating a space where reading feels like breathing.",
        aboutQuote: "In the space between doing and not-doing, something waits to be noticed.",
        aboutPrivacyNote: "No tracking pixels. No invasive analytics. Your reading experience is respected.",
        aboutEstYear: "2024",
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to fetch public settings:", error);
    // Return defaults on error
    return NextResponse.json({
      siteName: "Afterstill",
      siteTagline: "Words for the quiet hours",
      siteDescription: null,
      oracleEnabled: true,
      radioEnabled: true,
      catalogEnabled: true,
      candleEnabled: true,
      nightStartHour: 20,
      nightEndHour: 5,
      twitterUrl: null,
      githubUrl: null,
      emailContact: null,
    });
  }
}
