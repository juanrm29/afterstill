"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { AmbientLandscape } from "@/components/ambient-landscape";
import { BreathingGuide } from "@/components/breathing-guide";
import { triggerPortal } from "@/components/portal-transition";
import { DeckReveal } from "@/components/deck-reveal";
import { MainNavbar } from "@/components/main-navbar";
import { AmbientParticles } from "@/components/ambient-particles";
import { ScrollProgress, ScrollToTop } from "@/components/scroll-progress";
import { MoodRecommendation } from "@/components/mood-recommendation";
import { InkPool } from "@/components/ink-pool";

// Writing type
type Writing = {
  id: string;
  title: string;
  date: string;
  tags: string[];
  excerpt: string;
  content: string;
};

function pickWeightedRandomId(ids: string[]): string {
  if (ids.length === 0) return "";
  const weights = ids.map((_, i) => 1 + Math.max(0, ids.length - i) * 0.06);
  const total = weights.reduce((sum, w) => sum + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < ids.length; i++) {
    r -= weights[i];
    if (r <= 0) return ids[i];
  }
  return ids.at(-1) ?? "";
}

// Phase types
type OraclePhase = "idle" | "gazing" | "revealing" | "shown";
type RadioPhase = "idle" | "scanning" | "locking" | "acquired" | "transmitting";
type CatalogPhase = "idle" | "shuffling" | "sorting" | "found" | "opening";
type CandlePhase = "idle" | "striking" | "lighting" | "glowing" | "illuminating";

// Helper functions for card state classes
function getPhaseClass(
  isActive: boolean,
  isHovered: boolean,
  activeClass: string,
  hoverClass: string,
  defaultClass: string
): string {
  if (isActive) return activeClass;
  if (isHovered) return hoverClass;
  return defaultClass;
}

function getRadioBarClass(
  phase: RadioPhase,
  isHovered: boolean,
  level: number
): { className: string; height: string; boxShadow: string } {
  const isAcquired = phase === "acquired";
  const isActive = phase !== "idle";
  
  let className: string;
  if (isAcquired) {
    className = "bg-cyan-400/70";
  } else if (isActive) {
    className = "bg-cyan-500/40";
  } else if (isHovered) {
    className = "bg-zinc-600/40";
  } else {
    className = "bg-zinc-700/30";
  }
  
  let heightMultiplier: number;
  if (isActive) {
    heightMultiplier = 100;
  } else if (isHovered) {
    heightMultiplier = 80;
  } else {
    heightMultiplier = 50;
  }
  
  return {
    className,
    height: `${level * heightMultiplier}%`,
    boxShadow: isAcquired ? `0 0 4px rgba(34,211,238,${level * 0.3})` : "none",
  };
}

// Site settings type
type SiteSettings = {
  siteName: string;
  siteTagline: string;
  siteDescription: string | null;
  oracleEnabled: boolean;
  radioEnabled: boolean;
  catalogEnabled: boolean;
  candleEnabled: boolean;
  nightStartHour: number;
  nightEndHour: number;
  twitterUrl: string | null;
  githubUrl: string | null;
  emailContact: string | null;
};

export default function HomePage() {
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Site settings from database
  const [settings, setSettings] = useState<SiteSettings>({
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
  
  // Instrument states
  const [oraclePhase, setOraclePhase] = useState<OraclePhase>("idle");
  const [oracleText, setOracleText] = useState("");
  const [oracleSource, setOracleSource] = useState("");
  const [oracleHover, setOracleHover] = useState(false);
  
  const [radioPhase, setRadioPhase] = useState<RadioPhase>("idle");
  const [radioHover, setRadioHover] = useState(false);
  const [frequency, setFrequency] = useState(88);
  const [signalNoise, setSignalNoise] = useState<number[]>([]);
  const [dialRotation, setDialRotation] = useState(0);
  
  const [catalogPhase, setCatalogPhase] = useState<CatalogPhase>("idle");
  const [catalogHover, setCatalogHover] = useState(false);
  const [cardRotations, setCardRotations] = useState([0, 0, 0, 0, 0]);
  const [activeCardIndex, setActiveCardIndex] = useState(2);
  const [cardElevation, setCardElevation] = useState(0);
  
  const [candlePhase, setCandlePhase] = useState<CandlePhase>("idle");
  const [candleHover, setCandleHover] = useState(false);
  const [flameIntensity, setFlameIntensity] = useState(0);
  const [flickerOffset, setFlickerOffset] = useState({ x: 0, y: 0 });
  const [isNightTime, setIsNightTime] = useState(false);
  
  // Ideas section
  const [currentPrompt, setCurrentPrompt] = useState("Write about a room you can never return to.");
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);
  
  // Writings from database
  const [writings, setWritings] = useState<Writing[]>([]);
  
  // Echo fragments
  const [echoIndex, setEchoIndex] = useState(0);
  const [echoOpacity, setEchoOpacity] = useState(0);
  
  // Whisper Wall quotes
  const [whisperIndex, setWhisperIndex] = useState(0);
  const [whisperOpacity, setWhisperOpacity] = useState(1);
  
  // 3D tilt state
  const tiltRef = useRef({ oracle: { x: 0, y: 0 }, radio: { x: 0, y: 0 }, catalog: { x: 0, y: 0 }, candle: { x: 0, y: 0 } });
  const [tiltKey, setTiltKey] = useState(0);
  const forceUpdate = useCallback(() => setTiltKey(prev => prev + 1), []);
  
  // Fetch site settings
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data?.id) {
          // Merge with defaults for empty values
          setSettings(prev => ({
            ...prev,
            ...data,
            siteName: data.siteName || prev.siteName,
            siteTagline: data.siteTagline || prev.siteTagline,
          }));
        }
      })
      .catch(console.error);
  }, []);
  
  // Fetch writings from database
  useEffect(() => {
    fetch("/api/writings")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setWritings(data);
        }
      })
      .catch(console.error);
  }, []);
  
  // Compute active instrument
  const activeInstrument = useMemo(() => {
    if (oraclePhase !== "idle") return "oracle" as const;
    if (radioPhase !== "idle") return "radio" as const;
    if (catalogPhase !== "idle") return "catalog" as const;
    if (candlePhase !== "idle") return "candle" as const;
    return null;
  }, [oraclePhase, radioPhase, catalogPhase, candlePhase]);
  
  const instrumentIntensity = useMemo(() => {
    if (oraclePhase === "revealing" || oraclePhase === "shown") return 1;
    if (radioPhase === "acquired" || radioPhase === "transmitting") return 1;
    if (catalogPhase === "found" || catalogPhase === "opening") return cardElevation / 30;
    if (candlePhase === "glowing" || candlePhase === "illuminating") return flameIntensity;
    return 0.5;
  }, [oraclePhase, radioPhase, catalogPhase, candlePhase, cardElevation, flameIntensity]);

  // Extract echo fragments
  const echoFragments = useMemo(() => {
    const fragments: string[] = [];
    writings.forEach(w => {
      const content = w.content || "";
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20 && s.trim().length < 100);
      if (sentences.length > 0) {
        fragments.push(sentences[Math.floor(Math.random() * Math.min(3, sentences.length))].trim());
      }
    });
    if (fragments.length < 5) {
      fragments.push(
        "Words left behind in the quiet",
        "Echoes of thoughts once spoken",
        "Fragments drifting through time"
      );
    }
    return fragments.slice(0, 5);
  }, [writings]);

  // Whisper quotes from writings
  const whisperQuotes = useMemo(() => {
    const quotes: string[] = [];
    writings.forEach(w => {
      const content = w.content || "";
      // Extract meaningful sentences
      const sentences = content.split(/[.!?]+/).filter(s => {
        const trimmed = s.trim();
        return trimmed.length > 30 && trimmed.length < 150 && !trimmed.includes('http');
      });
      if (sentences.length > 0) {
        quotes.push(sentences[Math.floor(Math.random() * Math.min(2, sentences.length))].trim());
      }
    });
    // Fallback quotes if not enough from writings
    if (quotes.length < 5) {
      const fallbacks = [
        "In the stillness between moments, we find what we've been searching for",
        "Some words are meant to be whispered, not spoken",
        "The quiet hours hold more wisdom than the noise",
        "We write to remember what we cannot say aloud",
        "Between the lines lies the truth we hesitate to name"
      ];
      fallbacks.forEach(f => {
        if (quotes.length < 8) quotes.push(f);
      });
    }
    return quotes;
  }, [writings]);

  const idsByRecency = useMemo(() => {
    return [...writings]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map((w) => w.id);
  }, [writings]);

  // Initial load
  useEffect(() => {
    const t = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);
  
  // Whisper Wall rotation
  useEffect(() => {
    if (whisperQuotes.length === 0) return;
    
    const rotateQuote = () => {
      // Fade out
      setWhisperOpacity(0);
      
      setTimeout(() => {
        setWhisperIndex(prev => (prev + 1) % whisperQuotes.length);
        // Fade in
        setWhisperOpacity(1);
      }, 500);
    };
    
    const interval = setInterval(rotateQuote, 8000); // Change every 8 seconds
    return () => clearInterval(interval);
  }, [whisperQuotes.length]);
  
  // Time detection using settings
  useEffect(() => {
    const detectTime = () => {
      const hour = new Date().getHours();
      // Use settings for night hours
      const nightStart = settings.nightStartHour;
      const nightEnd = settings.nightEndHour;
      
      if (nightStart > nightEnd) {
        // Night spans midnight (e.g., 20-5)
        setIsNightTime(hour >= nightStart || hour < nightEnd);
      } else {
        // Night within same day (e.g., 22-23)
        setIsNightTime(hour >= nightStart && hour < nightEnd);
      }
    };
    detectTime();
    const interval = setInterval(detectTime, 60000);
    return () => clearInterval(interval);
  }, [settings.nightStartHour, settings.nightEndHour]);
  
  // Candle flicker
  useEffect(() => {
    if (candlePhase === "idle" && !candleHover) {
      setFlameIntensity(0);
      return;
    }
    const flickerInterval = setInterval(() => {
      setFlickerOffset({
        x: (Math.random() - 0.5) * 4,
        y: (Math.random() - 0.5) * 2 - 1,
      });
      if (candlePhase === "glowing" || candlePhase === "illuminating") {
        setFlameIntensity(0.7 + Math.random() * 0.3);
      } else if (candlePhase === "lighting") {
        setFlameIntensity(0.4 + Math.random() * 0.3);
      } else if (candleHover) {
        setFlameIntensity(0.2 + Math.random() * 0.2);
      }
    }, 100);
    return () => clearInterval(flickerInterval);
  }, [candlePhase, candleHover]);

  // Signal noise for radio
  useEffect(() => {
    const interval = setInterval(() => {
      setSignalNoise(Array.from({ length: 24 }, () => Math.random()));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Radio hover animation
  useEffect(() => {
    if (!radioHover || radioPhase !== "idle") return;
    const interval = setInterval(() => {
      setFrequency(prev => {
        const next = prev + (Math.random() - 0.5) * 2;
        return Math.max(88, Math.min(108, next));
      });
      setDialRotation(prev => prev + (Math.random() - 0.5) * 10);
    }, 100);
    return () => clearInterval(interval);
  }, [radioHover, radioPhase]);

  // Catalog hover
  useEffect(() => {
    if (!catalogHover || catalogPhase !== "idle") return;
    const interval = setInterval(() => {
      setCardRotations(prev => prev.map((r, i) => {
        const base = (i - 2) * 2;
        return base + Math.sin(Date.now() / 300 + i) * 1.5;
      }));
    }, 50);
    return () => clearInterval(interval);
  }, [catalogHover, catalogPhase]);

  // Echo cycling
  useEffect(() => {
    let cancelled = false;
    const cycle = async () => {
      if (cancelled) return;
      for (let i = 0; i <= 10; i++) {
        if (cancelled) return;
        setEchoOpacity(i / 10);
        await new Promise(r => setTimeout(r, 120));
      }
      await new Promise(r => setTimeout(r, 4000));
      for (let i = 10; i >= 0; i--) {
        if (cancelled) return;
        setEchoOpacity(i / 10);
        await new Promise(r => setTimeout(r, 120));
      }
      if (!cancelled) setEchoIndex(prev => (prev + 1) % Math.max(1, echoFragments.length));
    };
    const startTimer = setTimeout(cycle, 1500);
    const interval = setInterval(cycle, 8000);
    return () => { cancelled = true; clearTimeout(startTimer); clearInterval(interval); };
  }, [echoFragments.length]);

  // Fetch AI prompt
  const fetchNewPrompt = useCallback(async () => {
    setIsLoadingPrompt(true);
    setPromptError(null);
    try {
      const response = await fetch("/api/prompt", { method: "POST" });
      const data = await response.json();
      if (data.error) setPromptError(data.error);
      else if (data.prompt) setCurrentPrompt(data.prompt);
    } catch {
      setPromptError("Failed to connect");
    } finally {
      setIsLoadingPrompt(false);
    }
  }, []);

  // INSTRUMENT JOURNEYS
  
  const runOracleJourney = useCallback(async () => {
    if (oraclePhase !== "idle") return;
    if (writings.length === 0) return; // Guard against empty array
    const randomWriting = writings[Math.floor(Math.random() * writings.length)];
    const content = randomWriting?.content || "";
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 30 && s.trim().length < 150);
    const excerpt = sentences.length > 0 
      ? sentences[Math.floor(Math.random() * sentences.length)].trim() + "."
      : "Words drift like dust in sunlight...";

    setOraclePhase("gazing");
    await new Promise(r => setTimeout(r, 1200));
    setOraclePhase("revealing");
    setOracleText(excerpt);
    setOracleSource(randomWriting.title);
    await new Promise(r => setTimeout(r, 800));
    setOraclePhase("shown");
    await new Promise(r => setTimeout(r, 5000));
    setOraclePhase("idle");
    setOracleText("");
    setOracleSource("");
  }, [oraclePhase, writings]);

  const runRadioJourney = useCallback(async () => {
    if (radioPhase !== "idle") return;
    if (writings.length === 0) return; // Guard against empty array
    const id = pickWeightedRandomId(idsByRecency);
    if (!id) return;

    setRadioPhase("scanning");
    for (let i = 0; i < 15; i++) {
      setFrequency(88 + Math.random() * 20);
      setDialRotation(prev => prev + 15);
      await new Promise(r => setTimeout(r, 80));
    }
    setRadioPhase("locking");
    for (let i = 0; i < 6; i++) {
      setFrequency(prev => prev + (103.7 - prev) * 0.3);
      setDialRotation(prev => prev + 5);
      await new Promise(r => setTimeout(r, 120));
    }
    setFrequency(103.7);
    setRadioPhase("acquired");
    await new Promise(r => setTimeout(r, 800));
    setRadioPhase("transmitting");
    await new Promise(r => setTimeout(r, 400));
    
    const writing = writings.find(w => w.id === id);
    triggerPortal(`/reading/${id}`, { x: window.innerWidth / 2, y: window.innerHeight / 2 }, writing?.title);
  }, [radioPhase, idsByRecency, writings]);

  const runCatalogJourney = useCallback(async () => {
    if (catalogPhase !== "idle") return;

    setCatalogPhase("shuffling");
    for (let i = 0; i < 6; i++) {
      setCardRotations([-35 - i*2, -18 - i, 0, 18 + i, 35 + i*2]);
      setCardElevation(i * 3);
      await new Promise(r => setTimeout(r, 60));
    }
    await new Promise(r => setTimeout(r, 200));

    setCatalogPhase("sorting");
    const searchSequence = [0, 1, 4, 3, 1, 2, 4, 0, 3, 2];
    for (const cardIndex of searchSequence) {
      setActiveCardIndex(cardIndex);
      await new Promise(r => setTimeout(r, 100));
    }

    for (let i = 0; i < 8; i++) {
      setCardRotations(prev => prev.map((r, idx) => {
        const target = (idx - 2) * 4;
        return r + (target - r) * 0.35;
      }));
      setCardElevation(prev => Math.max(0, prev - 2));
      await new Promise(r => setTimeout(r, 50));
    }
    setCardRotations([-8, -4, 0, 4, 8]);
    setActiveCardIndex(2);
    setCardElevation(0);

    setCatalogPhase("found");
    await new Promise(r => setTimeout(r, 300));
    for (let i = 0; i < 10; i++) {
      setCardElevation(i * 4);
      await new Promise(r => setTimeout(r, 40));
    }
    await new Promise(r => setTimeout(r, 400));

    setCatalogPhase("opening");
    for (let i = 0; i < 8; i++) {
      setCardElevation(prev => prev + 8);
      await new Promise(r => setTimeout(r, 40));
    }
    await new Promise(r => setTimeout(r, 200));
    
    triggerPortal("/archive", { x: window.innerWidth / 2, y: window.innerHeight / 2 }, "The Archive");
  }, [catalogPhase]);

  const runCandleJourney = useCallback(async () => {
    if (candlePhase !== "idle" || !isNightTime) return;

    setCandlePhase("striking");
    for (let i = 0; i < 8; i++) {
      setFlickerOffset({ x: (Math.random() - 0.5) * 15, y: (Math.random() - 0.5) * 10 });
      setFlameIntensity(Math.random() * 0.3);
      await new Promise(r => setTimeout(r, 60));
    }
    await new Promise(r => setTimeout(r, 200));

    setCandlePhase("lighting");
    for (let i = 0; i < 12; i++) {
      setFlameIntensity(prev => Math.min(0.6, prev + 0.05));
      setFlickerOffset({ x: (Math.random() - 0.5) * 6, y: (Math.random() - 0.5) * 3 - i * 0.3 });
      await new Promise(r => setTimeout(r, 80));
    }
    await new Promise(r => setTimeout(r, 300));

    setCandlePhase("glowing");
    for (let i = 0; i < 15; i++) {
      setFlameIntensity(0.7 + Math.sin(i * 0.5) * 0.15);
      await new Promise(r => setTimeout(r, 60));
    }
    await new Promise(r => setTimeout(r, 400));

    setCandlePhase("illuminating");
    for (let i = 0; i < 8; i++) {
      setFlameIntensity(0.85 + i * 0.02);
      await new Promise(r => setTimeout(r, 50));
    }
    await new Promise(r => setTimeout(r, 300));
    
    triggerPortal("/about", { x: window.innerWidth / 2, y: window.innerHeight / 2 }, "About");
  }, [candlePhase, isNightTime]);

  // Labels
  const getRadioLabel = () => {
    switch (radioPhase) {
      case "scanning": return "Scanning...";
      case "locking": return "Locking...";
      case "acquired": return "Signal Found";
      case "transmitting": return "Transmitting...";
      default: return "Radio";
    }
  };

  const getCatalogLabel = () => {
    switch (catalogPhase) {
      case "shuffling": return "Fanning Out...";
      case "sorting": return "Searching...";
      case "found": return "Entry Located";
      case "opening": return "Opening...";
      default: return "Catalog";
    }
  };

  const getCandleLabel = () => {
    if (!isNightTime) return "Only at Night";
    switch (candlePhase) {
      case "striking": return "Striking...";
      case "lighting": return "Igniting...";
      case "glowing": return "Burning...";
      case "illuminating": return "Illuminating...";
      default: return "Candle";
    }
  };
  
  const getOracleLabel = () => {
    switch (oraclePhase) {
      case "gazing": return "Gazing...";
      case "revealing": return "Revealing...";
      case "shown": return "Oracle";
      default: return "Oracle";
    }
  };

  const isAnyActive = oraclePhase !== "idle" || radioPhase !== "idle" || catalogPhase !== "idle" || candlePhase !== "idle";
  
  // 3D Tilt handlers
  const handleCardTilt = (
    e: React.MouseEvent<HTMLButtonElement>,
    card: "oracle" | "radio" | "catalog" | "candle"
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    tiltRef.current[card] = {
      x: ((y - centerY) / centerY) * -8,
      y: ((x - centerX) / centerX) * 8,
    };
    forceUpdate();
  };
  
  const resetTilt = useCallback((card: "oracle" | "radio" | "catalog" | "candle") => {
    tiltRef.current[card] = { x: 0, y: 0 };
    forceUpdate();
  }, [forceUpdate]);

  return (
    <div className="min-h-screen text-foreground relative overflow-hidden safe-area-inset">
      {/* Ambient Particles */}
      <AmbientParticles count={40} color="violet" intensity="subtle" interactive={true} />
      
      {/* Scroll Progress */}
      <ScrollProgress showPercentage={false} color="rgba(139, 92, 246, 0.3)" />
      <ScrollToTop />
      
      {/* Ambient Landscape Background */}
      <AmbientLandscape 
        activeInstrument={activeInstrument}
        instrumentIntensity={instrumentIntensity}
      />
      
      {/* Nebula Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Primary nebula - indigo */}
        <div 
          className="absolute w-225 h-225 rounded-full blur-[150px] opacity-[0.04]"
          style={{
            background: 'radial-gradient(circle, #6366f1, transparent 70%)',
            left: '5%',
            top: '10%',
            animation: 'nebulaFloat1 25s ease-in-out infinite',
          }}
        />
        {/* Secondary nebula - cyan */}
        <div 
          className="absolute w-175 h-175 rounded-full blur-[120px] opacity-[0.035]"
          style={{
            background: 'radial-gradient(circle, #06b6d4, transparent 70%)',
            right: '10%',
            bottom: '15%',
            animation: 'nebulaFloat2 30s ease-in-out infinite',
          }}
        />
        {/* Tertiary nebula - purple */}
        <div 
          className="absolute w-150 h-150 rounded-full blur-[100px] opacity-[0.03]"
          style={{
            background: 'radial-gradient(circle, #a855f7, transparent 70%)',
            left: '40%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            animation: 'nebulaFloat3 35s ease-in-out infinite',
          }}
        />
        {/* Accent nebula - rose */}
        <div 
          className="absolute w-125 h-125 rounded-full blur-[80px] opacity-[0.025]"
          style={{
            background: 'radial-gradient(circle, #f43f5e, transparent 70%)',
            right: '25%',
            top: '20%',
            animation: 'nebulaFloat4 20s ease-in-out infinite',
          }}
        />
        
        {/* Distant stars layer */}
        <svg className="absolute inset-0 w-full h-full opacity-40">
          {Array.from({ length: 80 }).map((_, i) => {
            const seed = i * 9973;
            const x = ((seed * 7) % 1000) / 10;
            const y = ((seed * 13) % 1000) / 10;
            const size = 0.3 + ((seed * 17) % 100) / 100;
            const delay = ((seed * 23) % 100) / 10;
            return (
              <circle
                key={`star-${i}`}
                cx={`${x}%`}
                cy={`${y}%`}
                r={size}
                fill="white"
                opacity={0.2 + ((seed * 29) % 100) / 200}
                style={{
                  animation: `starTwinkle ${3 + delay}s ease-in-out infinite`,
                  animationDelay: `${delay}s`,
                }}
              />
            );
          })}
        </svg>
      </div>
      
      {/* Breathing Guide */}
      <BreathingGuide isActive={candlePhase === "lighting" || candlePhase === "glowing"} />
      
      {/* Subtle vignette */}
      <div 
        className="pointer-events-none fixed inset-0"
        style={{ background: "radial-gradient(ellipse at center, transparent 20%, rgba(2,2,3,0.7) 80%, rgba(2,2,3,0.9) 100%)" }}
      />

      {/* Main Navbar */}
      <MainNavbar siteName={settings.siteName} />

      {/* Main content */}
      <main className="flex flex-col">
        
        {/* Hero Section - Full Viewport */}
        <div className="min-h-screen flex flex-col px-6 sm:px-8 lg:px-16 pt-24 pb-12">
        
        {/* Hero Section - Cinematic Center Stage */}
        <div className="flex-1 flex flex-col items-center justify-center max-w-6xl mx-auto w-full relative">
          
          {/* Radial light effect from title */}
          <div 
            className="absolute pointer-events-none"
            style={{
              width: '800px',
              height: '600px',
              background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.03) 0%, transparent 50%)',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -60%)',
            }}
          />
          
          {/* The Word - Mind-Blowing Center Typography */}
          <div className={`text-center relative z-10 ${isLoaded ? "animate-reveal" : "opacity-0"}`}>
            
            {/* Subtle top accent */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <span className="w-12 h-px bg-linear-to-r from-transparent to-zinc-700/40" />
              <span className="text-[9px] tracking-[0.5em] uppercase text-zinc-600/80 font-light">
                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <span className="w-12 h-px bg-linear-to-l from-transparent to-zinc-700/40" />
            </div>
            
            {/* Main Title - Parallax Depth + Aurora Text */}
            <div className="relative">
              
              {/* Ambient glow behind text */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 40%, transparent 70%)',
                  filter: 'blur(40px)',
                  animation: 'glowPulse 8s ease-in-out infinite',
                  transform: 'scale(1.5)',
                }}
              />
              
              {/* Depth Layer 3 - Furthest back */}
              <h1 
                className="absolute inset-0 text-[clamp(3.5rem,12vw,9rem)] font-extralight tracking-[-0.05em] text-transparent leading-[0.85] select-none"
                style={{ 
                  fontFamily: "var(--font-cormorant), serif",
                  WebkitTextStroke: '1px rgba(59, 130, 246, 0.08)',
                  transform: 'translate(-4px, 4px)',
                  animation: 'depthDrift 20s ease-in-out infinite',
                  filter: 'blur(3px)',
                }}
                aria-hidden="true"
              >
                {settings.siteName}
              </h1>
              
              {/* Depth Layer 2 - Middle */}
              <h1 
                className="absolute inset-0 text-[clamp(3.5rem,12vw,9rem)] font-extralight tracking-[-0.05em] text-transparent leading-[0.85] select-none"
                style={{ 
                  fontFamily: "var(--font-cormorant), serif",
                  WebkitTextStroke: '1px rgba(139, 92, 246, 0.15)',
                  transform: 'translate(-2px, 2px)',
                  animation: 'depthDriftReverse 15s ease-in-out infinite',
                  filter: 'blur(1.5px)',
                }}
                aria-hidden="true"
              >
                {settings.siteName}
              </h1>
              
              {/* Main title - Aurora gradient flowing through text */}
              <h1 
                className="relative text-[clamp(3.5rem,12vw,9rem)] font-extralight tracking-[-0.05em] text-transparent leading-[0.85]"
                style={{ 
                  fontFamily: "var(--font-cormorant), serif",
                  background: 'linear-gradient(135deg, rgba(250, 250, 249, 0.95) 0%, rgba(139, 92, 246, 0.8) 25%, rgba(59, 130, 246, 0.7) 50%, rgba(168, 162, 158, 0.9) 75%, rgba(250, 250, 249, 0.95) 100%)',
                  backgroundSize: '400% 400%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: 'auroraFlow 12s ease-in-out infinite',
                }}
              >
                {settings.siteName}
              </h1>
              
              {/* Front highlight layer */}
              <h1 
                className="absolute inset-0 text-[clamp(3.5rem,12vw,9rem)] font-extralight tracking-[-0.05em] text-transparent leading-[0.85] select-none pointer-events-none"
                style={{ 
                  fontFamily: "var(--font-cormorant), serif",
                  WebkitTextStroke: '0.5px rgba(255, 255, 255, 0.1)',
                  mixBlendMode: 'overlay',
                }}
                aria-hidden="true"
              >
                {settings.siteName}
              </h1>
            </div>
            
            {/* Tagline with elegant reveal */}
            <div className="mt-6 overflow-hidden">
              <p 
                className="text-lg sm:text-xl text-zinc-500 font-light tracking-[0.15em] uppercase"
                style={{ 
                  fontFamily: "var(--font-cormorant), serif",
                  letterSpacing: '0.2em',
                }}
              >
                {settings.siteTagline}
              </p>
            </div>
            
            {/* Description - Poetic treatment */}
            {settings.siteDescription && (
              <div className="mt-8 max-w-lg mx-auto">
                <p 
                  className="text-base text-zinc-500/70 font-light leading-relaxed italic"
                  style={{ fontFamily: "var(--font-cormorant), serif" }}
                >
                  {settings.siteDescription}
                </p>
              </div>
            )}
            
            {/* Minimal divider */}
            <div className="mt-12 flex items-center justify-center">
              <div className="w-px h-16 bg-linear-to-b from-zinc-700/50 via-zinc-700/20 to-transparent" />
            </div>
            
            {/* Whisper Quote - Floating wisdom */}
            <div className="mt-8 h-16 flex items-center justify-center">
              <p 
                className="text-sm text-zinc-600/60 max-w-md font-light transition-opacity duration-500"
                style={{ 
                  fontFamily: "var(--font-cormorant), serif",
                  opacity: whisperOpacity,
                }}
              >
                "{whisperQuotes[whisperIndex]}"
              </p>
            </div>
          </div>
          
          {/* Scroll indicator - Minimal */}
          <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 ${isLoaded ? "animate-reveal delay-3" : "opacity-0"}`}>
            <span className="text-[9px] tracking-[0.3em] uppercase text-zinc-600/50 font-light">Scroll</span>
            <div className="w-px h-8 bg-gradient-to-b from-zinc-600/50 to-transparent relative overflow-hidden">
              <div 
                className="absolute inset-x-0 h-4 bg-zinc-400/60"
                style={{ animation: 'scrollPulse 2s ease-in-out infinite' }}
              />
            </div>
          </div>
        </div>
        </div>
        
        {/* The Deck Section - Separate */}
        <div className="min-h-screen flex flex-col items-center justify-center px-6 sm:px-8 lg:px-16 py-24 relative">
          
          {/* Section Title */}
          <div className={`text-center mb-16 ${isLoaded ? "animate-reveal" : "opacity-0"}`}>
            <span className="text-[9px] tracking-[0.5em] uppercase text-zinc-600/60 font-light">Choose Your Path</span>
            <h2 
              className="mt-4 text-2xl sm:text-3xl font-extralight text-zinc-300/80 tracking-wide"
              style={{ fontFamily: "var(--font-cormorant), serif" }}
            >
              The Four Instruments
            </h2>
          </div>
          
          {/* Sacred geometry background */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
            {/* Outer ring */}
            <div className="absolute w-[500px] h-[500px] rounded-full border border-zinc-800/20" />
            {/* Middle ring */}
            <div className="absolute w-[400px] h-[400px] rounded-full border border-zinc-800/15" style={{ animation: "spin 90s linear infinite" }} />
            {/* Inner ring */}
            <div className="absolute w-[300px] h-[300px] rounded-full border border-zinc-800/10" style={{ animation: "spin 60s linear infinite reverse" }} />
            
            {/* Cross lines */}
            <div className="absolute w-px h-[500px] bg-gradient-to-b from-transparent via-zinc-800/15 to-transparent" />
            <div className="absolute w-[500px] h-px bg-gradient-to-r from-transparent via-zinc-800/15 to-transparent" />
          </div>
          
          {/* The Deck */}
          <div className="relative z-10">
            <DeckReveal isLoaded={isLoaded}>
            {/* ORACLE */}
            {settings.oracleEnabled && (
            <button
              type="button"
              onClick={runOracleJourney}
              disabled={isAnyActive}
              className={`group relative text-left h-full ${isLoaded ? "animate-reveal delay-1" : "opacity-0"}`}
              style={{
                transform: `perspective(1200px) rotateX(${tiltRef.current.oracle.x}deg) rotateY(${tiltRef.current.oracle.y}deg)`,
                transformStyle: "preserve-3d",
                transition: oracleHover ? "transform 0.1s ease-out" : "transform 0.5s ease-out",
              }}
              onMouseEnter={() => setOracleHover(true)}
              onMouseLeave={() => { setOracleHover(false); resetTilt("oracle"); }}
              onMouseMove={(e) => oracleHover && handleCardTilt(e, "oracle")}
            >
              {/* Card glow effect */}
              <div className={`absolute -inset-0.5 rounded-3xl transition-all duration-700 ${
                oraclePhase !== "idle" 
                  ? "bg-gradient-to-br from-violet-500/20 via-purple-500/10 to-transparent opacity-100 blur-xl" 
                  : oracleHover 
                    ? "bg-gradient-to-br from-violet-500/10 via-transparent to-transparent opacity-100 blur-lg"
                    : "opacity-0"
              }`} />
              
              <div className={`relative rounded-3xl border transition-all duration-500 p-6 sm:p-8 h-full flex flex-col overflow-hidden ${
                oracleHover || oraclePhase !== "idle"
                  ? "border-violet-500/20 bg-gradient-to-b from-zinc-900/90 via-zinc-900/80 to-zinc-950/90 shadow-2xl shadow-violet-500/5" 
                  : "border-zinc-800/40 bg-gradient-to-b from-zinc-900/60 to-zinc-950/60"
              }`}>
                {/* Ambient particles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {(oracleHover || oraclePhase !== "idle") && [...Array(8)].map((_, i) => (
                    <div 
                      key={`oracle-particle-${i}`}
                      className="absolute w-1 h-1 rounded-full bg-violet-400/30"
                      style={{
                        left: `${20 + (i * 10)}%`,
                        top: `${30 + Math.sin(i) * 20}%`,
                        animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
                        animationDelay: `${i * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
                
                {/* Inner glow */}
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full transition-all duration-700 ${
                  oraclePhase !== "idle" 
                    ? "bg-violet-500/10 blur-3xl" 
                    : oracleHover 
                      ? "bg-violet-500/5 blur-2xl" 
                      : "bg-transparent"
                }`} />
                
                <div className="h-36 sm:h-40 relative flex items-center justify-center mb-4">
                  {/* Concentric rings */}
                  <div className={`absolute w-28 h-28 rounded-full border transition-all duration-1000 ${
                    oraclePhase !== "idle" ? "border-violet-400/20 scale-110" : oracleHover ? "border-violet-500/10 scale-105" : "border-zinc-800/20 scale-100"
                  }`} style={{ animation: oraclePhase !== "idle" ? "pulse 2s ease-in-out infinite" : "none" }} />
                  <div className={`absolute w-20 h-20 rounded-full border transition-all duration-700 ${
                    oraclePhase !== "idle" ? "border-violet-400/30" : oracleHover ? "border-violet-500/15" : "border-zinc-800/15"
                  }`} />
                  
                  {/* Eye icon - enhanced */}
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg 
                      className={`w-14 h-14 transition-all duration-500 ${
                        oraclePhase !== "idle" ? "text-violet-300" : oracleHover ? "text-zinc-300" : "text-zinc-500"
                      }`} 
                      viewBox="0 0 48 48" fill="none"
                    >
                      <path 
                        d="M4 24C4 24 12 10 24 10C36 10 44 24 44 24C44 24 36 38 24 38C12 38 4 24 4 24Z" 
                        stroke="currentColor" 
                        strokeWidth="1.5" 
                        fill="none"
                        className={`transition-all duration-500 ${oraclePhase === "gazing" ? "animate-pulse" : ""}`}
                      />
                      <circle 
                        cx="24" cy="24" r="9" 
                        className={`transition-all duration-500 ${
                          oraclePhase !== "idle" ? "fill-violet-500/20 stroke-violet-400/60" : "fill-transparent stroke-current"
                        }`}
                        strokeWidth="1"
                      />
                      <circle 
                        cx="24" cy="24" r="4" 
                        className={`transition-all duration-300 ${
                          oraclePhase !== "idle" ? "fill-violet-300" : "fill-current"
                        }`}
                      />
                      {/* Light reflection */}
                      <circle cx="21" cy="21" r="1.5" fill="currentColor" opacity="0.5" />
                    </svg>
                    
                    {oraclePhase === "gazing" && (
                      <>
                        <div className="absolute inset-0 rounded-full border border-violet-400/30 animate-ping" style={{ animationDuration: "1.5s" }} />
                        <div className="absolute inset-2 rounded-full border border-violet-400/20 animate-ping" style={{ animationDuration: "2s", animationDelay: "0.5s" }} />
                      </>
                    )}
                  </div>
                </div>
                
                {oraclePhase === "shown" && oracleText && (
                  <div className="absolute inset-4 flex flex-col items-center justify-center text-center bg-gradient-to-b from-zinc-950/95 to-zinc-900/95 backdrop-blur-md rounded-2xl p-4 border border-violet-500/10">
                    <p className="text-sm text-zinc-200 italic leading-relaxed line-clamp-4" style={{ fontFamily: "var(--font-cormorant), serif" }}>
                      &ldquo;{oracleText}&rdquo;
                    </p>
                    <p className="text-[10px] text-violet-400/70 mt-3 tracking-widest uppercase">— {oracleSource}</p>
                  </div>
                )}
                
                {oraclePhase !== "idle" && (
                  <div className="absolute top-4 right-4">
                    <div className={`w-2 h-2 rounded-full ${oraclePhase === "shown" ? "bg-violet-400 shadow-lg shadow-violet-400/50" : "bg-violet-500/60 animate-pulse"}`} />
                  </div>
                )}
                
                {/* Roman numeral */}
                <div className={`absolute top-4 left-4 text-[10px] font-light tracking-widest transition-all duration-500 ${
                  oracleHover || oraclePhase !== "idle" ? "text-violet-400/50" : "text-zinc-700/50"
                }`}>I</div>
                
                <div className="text-center mt-auto relative z-10">
                  <h3 className={`text-xl font-extralight tracking-wide mb-1.5 transition-all duration-500 ${
                    oracleHover || oraclePhase !== "idle" ? "text-zinc-200" : "text-zinc-400"
                  }`} style={{ fontFamily: "var(--font-cormorant), serif" }}>
                    {getOracleLabel()}
                  </h3>
                  <p className={`text-[9px] tracking-[0.25em] uppercase font-light ${
                    oracleHover || oraclePhase !== "idle" ? "text-violet-400/70" : "text-zinc-600"
                  }`}>
                    {oraclePhase === "idle" ? "Glimpse a Fragment" : "Reading..."}
                  </p>
                </div>
                
                {/* Bottom accent line */}
                <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-px transition-all duration-500 ${
                  oracleHover || oraclePhase !== "idle" ? "w-16 bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" : "w-8 bg-gradient-to-r from-transparent via-zinc-700/30 to-transparent"
                }`} />
              </div>
            </button>
            )}

            {/* RADIO */}
            {settings.radioEnabled && (
            <button
              type="button"
              onClick={runRadioJourney}
              disabled={isAnyActive}
              className={`group relative text-center h-full ${isLoaded ? "animate-reveal delay-2" : "opacity-0"}`}
              style={{
                transform: `perspective(1200px) rotateX(${tiltRef.current.radio.x}deg) rotateY(${tiltRef.current.radio.y}deg)`,
                transformStyle: "preserve-3d",
                transition: radioHover ? "transform 0.1s ease-out" : "transform 0.5s ease-out",
              }}
              onMouseEnter={() => setRadioHover(true)}
              onMouseLeave={() => { setRadioHover(false); resetTilt("radio"); }}
              onMouseMove={(e) => radioHover && handleCardTilt(e, "radio")}
            >
              {/* Card glow */}
              <div className={`absolute -inset-0.5 rounded-3xl transition-all duration-700 ${
                radioPhase !== "idle" 
                  ? "bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-transparent opacity-100 blur-xl" 
                  : radioHover 
                    ? "bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent opacity-100 blur-lg"
                    : "opacity-0"
              }`} />
              
              <div className={`relative rounded-3xl border transition-all duration-500 p-6 sm:p-8 h-full flex flex-col overflow-hidden ${
                radioHover || radioPhase !== "idle"
                  ? "border-cyan-500/20 bg-gradient-to-b from-zinc-900/90 via-zinc-900/80 to-zinc-950/90 shadow-2xl shadow-cyan-500/5" 
                  : "border-zinc-800/40 bg-gradient-to-b from-zinc-900/60 to-zinc-950/60"
              }`}>
                {/* Inner glow */}
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full transition-all duration-700 ${
                  radioPhase !== "idle" ? "bg-cyan-500/10 blur-3xl" : radioHover ? "bg-cyan-500/5 blur-2xl" : "bg-transparent"
                }`} />
                
                <div className="h-36 sm:h-40 relative flex items-center justify-center mb-4">
                  <div className="relative w-28 h-28">
                    {/* Radio body */}
                    <div className={`absolute inset-0 rounded-2xl border-2 transition-all duration-500 ${
                      radioPhase !== "idle" ? "border-cyan-500/30 bg-gradient-to-b from-zinc-800/80 to-zinc-900/80" : radioHover ? "border-zinc-700/40 bg-zinc-800/50" : "border-zinc-800/30 bg-zinc-900/30"
                    }`}>
                      {/* Frequency display */}
                      <div className="absolute top-3 inset-x-3">
                        <div className={`h-10 rounded-lg border flex items-center justify-center overflow-hidden transition-all duration-300 ${
                          radioPhase === "acquired" ? "border-cyan-400/50 bg-cyan-500/10 shadow-inner shadow-cyan-500/10" : radioPhase !== "idle" ? "border-cyan-500/20 bg-zinc-800/50" : "border-zinc-700/20 bg-zinc-900/30"
                        }`}>
                          <span className={`font-mono text-2xl tabular-nums tracking-wider transition-all duration-300 ${
                            radioPhase === "acquired" ? "text-cyan-300" : radioPhase !== "idle" ? "text-zinc-300" : "text-zinc-500"
                          }`}>
                            {frequency.toFixed(1)}
                          </span>
                          <span className={`ml-1 text-[9px] font-mono ${radioPhase !== "idle" ? "text-cyan-400/60" : "text-zinc-600"}`}>MHz</span>
                        </div>
                      </div>
                      
                      {/* Signal bars - enhanced */}
                      <div className="absolute top-16 inset-x-3 h-5 flex items-end justify-center gap-0.5">
                        {signalNoise.map((level, i) => (
                          <div key={`noise-${i}`} className={`w-1 rounded-full transition-all duration-100 ${
                            radioPhase === "acquired" ? "bg-cyan-400/70" : radioPhase !== "idle" ? "bg-cyan-500/40" : radioHover ? "bg-zinc-600/40" : "bg-zinc-700/30"
                          }`} style={{ 
                            height: `${(radioPhase !== "idle" ? level * 100 : radioHover ? level * 80 : level * 50)}%`,
                            boxShadow: radioPhase === "acquired" ? `0 0 4px rgba(34,211,238,${level * 0.3})` : "none"
                          }} />
                        ))}
                      </div>
                      
                      {/* Tuning dial */}
                      <div className="absolute bottom-2 inset-x-0 flex justify-center">
                        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                          radioPhase !== "idle" ? "border-cyan-500/40 shadow-lg shadow-cyan-500/10" : "border-zinc-700/30"
                        }`}>
                          <div className="w-7 h-7 rounded-full border border-zinc-700/30 relative" style={{ transform: `rotate(${dialRotation}deg)`, transition: "transform 0.1s ease-out" }}>
                            <div className={`absolute top-1 left-1/2 -translate-x-1/2 w-0.5 h-2 rounded-full ${radioPhase === "acquired" ? "bg-cyan-400" : "bg-zinc-500"}`} />
                          </div>
                        </div>
                      </div>
                      
                      {radioPhase !== "idle" && (
                        <div className="absolute top-2 right-2">
                          <div className={`w-2 h-2 rounded-full ${radioPhase === "acquired" ? "bg-cyan-400 shadow-lg shadow-cyan-400/50" : "bg-cyan-500/60 animate-pulse"}`} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Roman numeral */}
                <div className={`absolute top-4 left-4 text-[10px] font-light tracking-widest transition-all duration-500 ${
                  radioHover || radioPhase !== "idle" ? "text-cyan-400/50" : "text-zinc-700/50"
                }`}>II</div>
                
                <div className="text-center mt-auto relative z-10">
                  <h3 className={`text-xl font-extralight tracking-wide mb-1.5 transition-all duration-500 ${
                    radioHover || radioPhase !== "idle" ? "text-zinc-200" : "text-zinc-400"
                  }`} style={{ fontFamily: "var(--font-cormorant), serif" }}>
                    {getRadioLabel()}
                  </h3>
                  <p className={`text-[9px] tracking-[0.25em] uppercase font-light ${
                    radioHover || radioPhase !== "idle" ? "text-cyan-400/70" : "text-zinc-600"
                  }`}>
                    {radioPhase === "idle" ? "Receive a Signal" : `${frequency.toFixed(1)} MHz`}
                  </p>
                </div>
                
                {/* Bottom accent */}
                <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-px transition-all duration-500 ${
                  radioHover || radioPhase !== "idle" ? "w-16 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" : "w-8 bg-gradient-to-r from-transparent via-zinc-700/30 to-transparent"
                }`} />
              </div>
            </button>
            )}

            {/* CATALOG */}
            {settings.catalogEnabled && (
            <button
              type="button"
              onClick={runCatalogJourney}
              disabled={isAnyActive}
              className={`group relative text-left h-full ${isLoaded ? "animate-reveal delay-3" : "opacity-0"}`}
              style={{
                transform: `perspective(1200px) rotateX(${tiltRef.current.catalog.x}deg) rotateY(${tiltRef.current.catalog.y}deg)`,
                transformStyle: "preserve-3d",
                transition: catalogHover ? "transform 0.1s ease-out" : "transform 0.5s ease-out",
              }}
              onMouseEnter={() => setCatalogHover(true)}
              onMouseLeave={() => { setCatalogHover(false); resetTilt("catalog"); }}
              onMouseMove={(e) => catalogHover && handleCardTilt(e, "catalog")}
            >
              {/* Card glow */}
              <div className={`absolute -inset-0.5 rounded-3xl transition-all duration-700 ${
                catalogPhase !== "idle" 
                  ? "bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent opacity-100 blur-xl" 
                  : catalogHover 
                    ? "bg-gradient-to-br from-amber-500/10 via-transparent to-transparent opacity-100 blur-lg"
                    : "opacity-0"
              }`} />
              
              <div className={`relative rounded-3xl border transition-all duration-500 p-6 sm:p-8 overflow-hidden h-full flex flex-col ${
                catalogHover || catalogPhase !== "idle"
                  ? "border-amber-500/20 bg-gradient-to-b from-zinc-900/90 via-zinc-900/80 to-zinc-950/90 shadow-2xl shadow-amber-500/5" 
                  : "border-zinc-800/40 bg-gradient-to-b from-zinc-900/60 to-zinc-950/60"
              }`}>
                {/* Inner glow */}
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full transition-all duration-700 ${
                  catalogPhase !== "idle" ? "bg-amber-500/10 blur-3xl" : catalogHover ? "bg-amber-500/5 blur-2xl" : "bg-transparent"
                }`} />
                
                <div className="h-36 sm:h-40 relative flex items-center justify-center mb-4">
                  <div className="relative w-28 h-28 flex items-center justify-center" style={{ perspective: "500px" }}>
                    {[0, 1, 2, 3, 4].map((i) => {
                      const isActive = i === activeCardIndex;
                      const rotation = cardRotations[i] || (i - 2) * 5;
                      const isFound = isActive && (catalogPhase === "found" || catalogPhase === "opening");
                      const baseZ = Math.abs(i - 2) * -8;
                      const activeZ = isActive && catalogPhase !== "idle" ? 40 : 0;
                      const yOffset = isFound ? -cardElevation : (isActive && catalogPhase === "sorting" ? -20 : 0);
                      const scale = isFound ? 1.2 + (cardElevation / 80) : 1;
                      
                      return (
                        <div key={`catalog-card-${i}`} className={`absolute w-14 h-20 rounded-lg transition-all ${
                          isFound 
                            ? "border-2 border-amber-400/60 bg-gradient-to-br from-amber-500/20 via-amber-600/10 to-transparent shadow-lg shadow-amber-500/20" 
                            : isActive && catalogPhase !== "idle" 
                              ? "border-2 border-amber-500/40 bg-amber-500/5" 
                              : catalogHover || catalogPhase !== "idle" 
                                ? "border border-zinc-600/40 bg-zinc-800/30" 
                                : "border border-zinc-800/30 bg-zinc-900/40"
                        }`} style={{
                          transform: `rotateY(${(i - 2) * 4}deg) rotateZ(${rotation}deg) translateY(${yOffset}px) translateZ(${baseZ + activeZ}px) scale(${scale})`,
                          transformOrigin: "center bottom",
                          zIndex: isActive ? 20 : 10 - Math.abs(i - 2),
                          transitionDuration: catalogPhase === "shuffling" ? "60ms" : catalogPhase === "sorting" ? "100ms" : "200ms",
                        }}>
                          {/* Card content lines */}
                          <div className={`mx-2 mt-2 h-0.5 rounded-full ${isFound ? "bg-amber-400/60" : "bg-zinc-600/30"}`} />
                          <div className="px-2 pt-2 space-y-1">
                            <div className={`h-0.5 rounded-full ${isFound ? "bg-amber-400/40 w-full" : "bg-zinc-700/30 w-3/4"}`} />
                            <div className={`h-0.5 rounded-full ${isFound ? "bg-amber-400/30 w-4/5" : "bg-zinc-800/30 w-1/2"}`} />
                          </div>
                          {/* Card number */}
                          <div className={`absolute bottom-1 right-1.5 text-[7px] font-mono ${isFound ? "text-amber-400/80" : "text-zinc-600/50"}`}>
                            {String(i + 1).padStart(2, "0")}
                          </div>
                          {/* Count badge on center card */}
                          {i === 2 && (
                            <div className={`absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[7px] font-mono tracking-wider transition-all duration-300 ${
                              isFound ? "bg-amber-500 text-zinc-900 shadow-lg shadow-amber-500/30" : catalogPhase !== "idle" ? "bg-amber-500/30 text-amber-300" : catalogHover ? "bg-zinc-700/50 text-zinc-400" : "bg-zinc-800/50 text-zinc-600"
                            }`}>
                              {writings.length}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {/* Shadow */}
                    <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-4 rounded-full blur-md transition-all duration-300 ${
                      catalogPhase !== "idle" ? "bg-amber-500/15" : catalogHover ? "bg-zinc-600/10" : "bg-zinc-800/5"
                    }`} />
                  </div>
                </div>
                
                {/* Roman numeral */}
                <div className={`absolute top-4 left-4 text-[10px] font-light tracking-widest transition-all duration-500 ${
                  catalogHover || catalogPhase !== "idle" ? "text-amber-400/50" : "text-zinc-700/50"
                }`}>III</div>
                
                <div className="text-center mt-auto relative z-10">
                  <h3 className={`text-xl font-extralight tracking-wide mb-1.5 transition-all duration-500 ${
                    catalogHover || catalogPhase !== "idle" ? "text-zinc-200" : "text-zinc-400"
                  }`} style={{ fontFamily: "var(--font-cormorant), serif" }}>
                    {getCatalogLabel()}
                  </h3>
                  <p className={`text-[9px] tracking-[0.25em] uppercase font-light ${
                    catalogHover || catalogPhase !== "idle" ? "text-amber-400/70" : "text-zinc-600"
                  }`}>
                    {catalogPhase === "idle" ? "Browse Archive" : catalogPhase === "found" || catalogPhase === "opening" ? `Entry #${activeCardIndex + 1}` : "Indexing..."}
                  </p>
                </div>
                
                {/* Bottom accent */}
                <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-px transition-all duration-500 ${
                  catalogHover || catalogPhase !== "idle" ? "w-16 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" : "w-8 bg-gradient-to-r from-transparent via-zinc-700/30 to-transparent"
                }`} />
              </div>
            </button>
            )}

            {/* CANDLE */}
            {settings.candleEnabled && (
            <button
              type="button"
              onClick={runCandleJourney}
              disabled={isAnyActive || !isNightTime}
              className={`group relative text-left h-full ${isLoaded ? "animate-reveal delay-4" : "opacity-0"}`}
              style={{
                transform: `perspective(1200px) rotateX(${tiltRef.current.candle.x}deg) rotateY(${tiltRef.current.candle.y}deg)`,
                transformStyle: "preserve-3d",
                transition: candleHover ? "transform 0.1s ease-out" : "transform 0.5s ease-out",
              }}
              onMouseEnter={() => setCandleHover(true)}
              onMouseLeave={() => { setCandleHover(false); resetTilt("candle"); }}
              onMouseMove={(e) => candleHover && handleCardTilt(e, "candle")}
            >
              {/* Card glow - only at night */}
              {isNightTime && (
                <div className={`absolute -inset-0.5 rounded-3xl transition-all duration-700 ${
                  candlePhase !== "idle" 
                    ? "bg-gradient-to-br from-rose-500/20 via-orange-500/15 to-transparent opacity-100 blur-xl" 
                    : candleHover 
                      ? "bg-gradient-to-br from-rose-500/10 via-transparent to-transparent opacity-100 blur-lg"
                      : "opacity-0"
                }`} />
              )}
              
              <div className={`relative rounded-3xl border transition-all duration-500 p-6 sm:p-8 h-full flex flex-col overflow-hidden ${
                !isNightTime 
                  ? "border-zinc-800/20 bg-gradient-to-b from-zinc-900/40 to-zinc-950/40 opacity-40" 
                  : candleHover || candlePhase !== "idle" 
                    ? "border-rose-500/20 bg-gradient-to-b from-zinc-900/90 via-zinc-900/80 to-zinc-950/90 shadow-2xl shadow-rose-500/5" 
                    : "border-zinc-800/40 bg-gradient-to-b from-zinc-900/60 to-zinc-950/60"
              }`}>
                {/* Warm glow at night */}
                {isNightTime && (candleHover || candlePhase !== "idle") && (
                  <div className="absolute top-10 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full bg-gradient-to-t from-rose-500/10 via-orange-500/5 to-transparent blur-2xl" 
                    style={{ opacity: flameIntensity * 0.8 }} 
                  />
                )}
                
                <div className="h-36 sm:h-40 relative flex items-center justify-center mb-4 overflow-hidden">
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      {/* Base shadow */}
                      <ellipse cx="50" cy="88" rx="18" ry="5" className={`${isNightTime && (candleHover || candlePhase !== "idle") ? "fill-zinc-800/80" : "fill-zinc-900/40"}`} />
                      
                      {/* Candle body - enhanced */}
                      <rect x="42" y="48" width="16" height="38" rx="2" className={`transition-all duration-300 ${
                        isNightTime && (candleHover || candlePhase !== "idle") 
                          ? "fill-gradient-to-b from-rose-100/90 to-rose-200/80" 
                          : "fill-zinc-500/20"
                      }`} fill={isNightTime && (candleHover || candlePhase !== "idle") ? "url(#candleBody)" : undefined} />
                      
                      {/* Wick */}
                      <line x1="50" y1="48" x2="50" y2="42" className={`${isNightTime && (candleHover || candlePhase !== "idle") ? "stroke-zinc-700" : "stroke-zinc-600/30"}`} strokeWidth="1.5" strokeLinecap="round" />
                      
                      {/* Flame - only when active */}
                      {isNightTime && (candleHover || candlePhase !== "idle") && (
                        <>
                          {/* Outer glow */}
                          <ellipse 
                            cx={50 + flickerOffset.x * 0.3} 
                            cy={26 + flickerOffset.y} 
                            rx={14 + flameIntensity * 8} 
                            ry={20 + flameIntensity * 10} 
                            fill="url(#flameGlow)" 
                            style={{ opacity: flameIntensity * 0.6, filter: "blur(8px)" }} 
                          />
                          
                          {/* Main flame */}
                          <path
                            d={`M50 42 Q${45 + flickerOffset.x} ${32 + flickerOffset.y} ${47 + flickerOffset.x * 0.5} ${22 + flickerOffset.y} Q${49 + flickerOffset.x * 0.3} ${16 + flickerOffset.y * 0.5} ${50} ${12 + flameIntensity * -4} Q${51 - flickerOffset.x * 0.3} ${16 + flickerOffset.y * 0.5} ${53 - flickerOffset.x * 0.5} ${22 + flickerOffset.y} Q${55 - flickerOffset.x} ${32 + flickerOffset.y} 50 42`}
                            fill="url(#flameGradient)"
                            style={{ opacity: 0.7 + flameIntensity * 0.3, filter: "blur(0.3px)" }}
                          />
                          
                          {/* Inner bright core */}
                          {flameIntensity > 0.3 && (
                            <ellipse 
                              cx={50 + flickerOffset.x * 0.15} 
                              cy={34 + flickerOffset.y * 0.3} 
                              rx={3 + flameIntensity * 2} 
                              ry={7 + flameIntensity * 4} 
                              fill="#fff5eb" 
                              style={{ opacity: flameIntensity * 0.95 }} 
                            />
                          )}
                        </>
                      )}
                      
                      <defs>
                        <linearGradient id="candleBody" x1="50%" y1="0%" x2="50%" y2="100%">
                          <stop offset="0%" stopColor="#fef2f2" />
                          <stop offset="100%" stopColor="#fecaca" />
                        </linearGradient>
                        <radialGradient id="flameGlow" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#fb923c" stopOpacity="0.6" />
                          <stop offset="50%" stopColor="#f97316" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
                        </radialGradient>
                        <linearGradient id="flameGradient" x1="50%" y1="100%" x2="50%" y2="0%">
                          <stop offset="0%" stopColor="#ea580c" />
                          <stop offset="30%" stopColor="#f97316" />
                          <stop offset="60%" stopColor="#fbbf24" />
                          <stop offset="100%" stopColor="#fef3c7" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>
                
                {/* Night indicator */}
                {!isNightTime && (
                  <div className="absolute top-4 right-4 flex items-center gap-1.5">
                    <svg viewBox="0 0 20 20" className="w-4 h-4 text-zinc-700">
                      <path fill="currentColor" d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                  </div>
                )}
                
                {/* Roman numeral */}
                <div className={`absolute top-4 left-4 text-[10px] font-light tracking-widest transition-all duration-500 ${
                  isNightTime && (candleHover || candlePhase !== "idle") ? "text-rose-400/50" : "text-zinc-700/50"
                }`}>IV</div>
                
                <div className="text-center mt-auto relative z-10">
                  <h3 className={`text-xl font-extralight tracking-wide mb-1.5 transition-all duration-500 ${
                    !isNightTime ? "text-zinc-600" : candleHover || candlePhase !== "idle" ? "text-zinc-200" : "text-zinc-400"
                  }`} style={{ fontFamily: "var(--font-cormorant), serif" }}>
                    {getCandleLabel()}
                  </h3>
                  <p className={`text-[9px] tracking-[0.25em] uppercase font-light ${
                    !isNightTime ? "text-zinc-700" : candleHover || candlePhase !== "idle" ? "text-rose-400/70" : "text-zinc-600"
                  }`}>
                    {!isNightTime ? "Available after dusk" : candlePhase === "idle" ? "Intimate Reflections" : "Lighting..."}
                  </p>
                </div>
                
                {/* Bottom accent */}
                <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-px transition-all duration-500 ${
                  isNightTime && (candleHover || candlePhase !== "idle") ? "w-16 bg-gradient-to-r from-transparent via-rose-500/50 to-transparent" : "w-8 bg-gradient-to-r from-transparent via-zinc-700/30 to-transparent"
                }`} />
              </div>
            </button>
            )}
          </DeckReveal>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION: ECHO FRAGMENTS
            Fading text fragments from writings
        ═══════════════════════════════════════════════════════════════ */}
        {echoFragments.length > 0 && (
        <section className="relative py-16 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] rounded-full bg-violet-500/3 blur-3xl" />
          </div>
          
          <div className="relative max-w-2xl mx-auto px-8 text-center">
            <p className="text-[9px] tracking-[0.5em] uppercase text-zinc-800 mb-6">
              Echo
            </p>
            <p 
              className="text-sm text-zinc-600/70 italic transition-opacity duration-500"
              style={{ 
                fontFamily: "var(--font-cormorant), serif",
                opacity: echoOpacity,
              }}
            >
              {echoFragments[echoIndex] || ""}
            </p>
          </div>
        </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 2: MOOD-BASED RECOMMENDATION
            Daily reading recommendation based on time and mood
        ═══════════════════════════════════════════════════════════════ */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          {/* Subtle divider */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 flex items-center gap-4">
            <div className="w-16 md:w-24 h-px bg-gradient-to-r from-transparent to-zinc-800/40" />
            <div className="w-1 h-1 rounded-full bg-zinc-800/50" />
            <div className="w-16 md:w-24 h-px bg-gradient-to-l from-transparent to-zinc-800/40" />
          </div>
          
          <div className="relative max-w-6xl mx-auto px-4 md:px-8">
            <MoodRecommendation writings={writings} />
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION: THE INK POOL
            Interactive pool of floating writings
        ═══════════════════════════════════════════════════════════════ */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          {/* Subtle divider */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 flex items-center gap-4">
            <div className="w-16 md:w-24 h-px bg-gradient-to-r from-transparent to-zinc-800/40" />
            <div className="w-1.5 h-1.5 rounded-full bg-violet-500/30" />
            <div className="w-16 md:w-24 h-px bg-gradient-to-l from-transparent to-zinc-800/40" />
          </div>
          
          <div className="relative max-w-6xl mx-auto px-4 md:px-8">
            {/* Section header */}
            <div className="text-center mb-10">
              <p className="text-[10px] tracking-[0.5em] uppercase text-zinc-600 mb-3">
                Explore the depths
              </p>
              <h3 className="text-2xl font-extralight text-zinc-400" style={{ fontFamily: "var(--font-cormorant), serif" }}>
                The Ink Pool
              </h3>
            </div>
            
            {/* The Pool */}
            <InkPool writings={writings} />
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 3: THE WHISPER WALL
            Rotating quotes/excerpts from writings
        ═══════════════════════════════════════════════════════════════ */}
        <section className="relative py-40 overflow-hidden">
          {/* Subtle divider */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 flex items-center gap-4">
            <div className="w-24 h-px bg-gradient-to-r from-transparent to-zinc-800/40" />
            <div className="w-1 h-1 rounded-full bg-zinc-800/50" />
            <div className="w-24 h-px bg-gradient-to-l from-transparent to-zinc-800/40" />
          </div>
          
          {/* Background whisper effect */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-zinc-800/5 blur-3xl" />
          </div>
          
          {/* Whisper content */}
          <div className="relative max-w-3xl mx-auto px-8 text-center">
            <p className="text-[10px] tracking-[0.5em] uppercase text-zinc-700 mb-8">
              Whispers from the archive
            </p>
            
            <div className="min-h-[120px] flex items-center justify-center">
              <blockquote 
                className="text-xl sm:text-2xl lg:text-3xl font-extralight text-zinc-400 leading-relaxed transition-all duration-1000"
                style={{ 
                  fontFamily: "var(--font-cormorant), serif",
                  fontStyle: "italic",
                  opacity: whisperOpacity,
                  transform: `translateY(${(1 - whisperOpacity) * 20}px)`,
                }}
              >
                "{whisperQuotes[whisperIndex]}"
              </blockquote>
            </div>
            
            {/* Whisper indicator dots */}
            <div className="flex items-center justify-center gap-2 mt-8">
              {whisperQuotes.slice(0, 5).map((_, i) => (
                <div 
                  key={`whisper-dot-${i}`}
                  className={`w-1 h-1 rounded-full transition-all duration-500 ${
                    i === whisperIndex % 5 ? "bg-zinc-500 scale-125" : "bg-zinc-800"
                  }`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 3: RECENT TRANSMISSIONS
            Latest 3 writings in elegant horizontal cards
        ═══════════════════════════════════════════════════════════════ */}
        <section className="relative py-24">
          <div className="max-w-6xl mx-auto px-8">
            {/* Section header */}
            <div className="flex items-center justify-between mb-12">
              <div>
                <p className="text-[10px] tracking-[0.5em] uppercase text-zinc-700 mb-2">
                  Recent Transmissions
                </p>
                <h3 className="text-xl font-extralight text-zinc-400" style={{ fontFamily: "var(--font-cormorant), serif" }}>
                  Latest from the archive
                </h3>
              </div>
              <a 
                href="/archive"
                className="text-[10px] tracking-[0.3em] uppercase text-zinc-600 hover:text-zinc-400 transition-colors duration-300 flex items-center gap-2"
              >
                View all
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
            </div>
            
            {/* Writings grid */}
            <div className="grid md:grid-cols-3 gap-6">
              {writings.slice(0, 3).map((writing, index) => (
                <a
                  key={writing.id}
                  href={`/reading/${writing.id}`}
                  className="group relative block"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Card glow on hover */}
                  <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-zinc-700/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 blur-lg transition-all duration-500" />
                  
                  <div className="relative rounded-2xl border border-zinc-800/40 bg-zinc-900/40 p-6 h-full transition-all duration-500 group-hover:border-zinc-700/50 group-hover:bg-zinc-900/60">
                    {/* Number */}
                    <div className="absolute top-4 right-4 text-[10px] font-mono text-zinc-800 group-hover:text-zinc-700 transition-colors">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    
                    {/* Date */}
                    <p className="text-[10px] tracking-wider text-zinc-700 mb-3">
                      {new Date(writing.date).toLocaleDateString("en-US", { 
                        month: "short", 
                        day: "numeric",
                        year: "numeric"
                      })}
                    </p>
                    
                    {/* Title */}
                    <h4 className="text-lg font-extralight text-zinc-400 mb-3 group-hover:text-zinc-300 transition-colors" style={{ fontFamily: "var(--font-cormorant), serif" }}>
                      {writing.title}
                    </h4>
                    
                    {/* Excerpt */}
                    <p className="text-sm text-zinc-600 leading-relaxed line-clamp-3 group-hover:text-zinc-500 transition-colors">
                      {writing.excerpt}
                    </p>
                    
                    {/* Read indicator */}
                    <div className="mt-4 pt-4 border-t border-zinc-800/30 flex items-center gap-2 text-zinc-700 group-hover:text-zinc-500 transition-colors">
                      <span className="text-[9px] tracking-[0.3em] uppercase">Read</span>
                      <svg className="w-3 h-3 transform group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 4: THE SPARK
            AI Writing Prompt - minimalist floating card
        ═══════════════════════════════════════════════════════════════ */}
        <section className="relative py-32">
          {/* Ambient background */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-violet-500/5 blur-3xl" />
            <div className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-amber-500/5 blur-3xl" />
          </div>
          
          <div className="relative max-w-2xl mx-auto px-8">
            {/* Section label */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-zinc-800/40 bg-zinc-900/30">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-zinc-600">
                  <path fill="currentColor" d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z"/>
                </svg>
                <span className="text-[10px] tracking-[0.4em] uppercase text-zinc-600">The Spark</span>
              </div>
            </div>
            
            {/* Prompt card */}
            <div className="relative">
              {/* Card glow */}
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-zinc-700/20 via-transparent to-zinc-700/10 blur-xl" />
              
              <div className="relative rounded-3xl border border-zinc-800/50 bg-zinc-950/80 backdrop-blur-sm p-8 sm:p-10">
                {/* Quote mark */}
                <div className="absolute top-6 left-6 text-4xl text-zinc-800/50 font-serif">"</div>
                
                {/* Prompt text */}
                <div className="min-h-[100px] flex items-center justify-center py-4">
                  {isLoadingPrompt ? (
                    <div className="flex items-center gap-3 text-zinc-600">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span className="text-sm tracking-wide">Conjuring inspiration...</span>
                    </div>
                  ) : promptError ? (
                    <div className="flex flex-col items-center gap-2 text-rose-500/70">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                      </svg>
                      <span className="text-sm tracking-wide">{promptError}</span>
                    </div>
                  ) : (
                    <p 
                      className="text-lg sm:text-xl text-zinc-400 text-center leading-relaxed"
                      style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: "italic" }}
                    >
                      {currentPrompt}
                    </p>
                  )}
                </div>
                
                {/* Actions */}
                <div className="flex items-center justify-between pt-6 border-t border-zinc-800/30">
                  <p className="text-[9px] tracking-[0.3em] uppercase text-zinc-700">AI Writing Prompt</p>
                  <button 
                    type="button"
                    onClick={fetchNewPrompt}
                    disabled={isLoadingPrompt}
                    className="group flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-800/50 bg-zinc-900/50 hover:border-zinc-700/50 hover:bg-zinc-800/50 transition-all duration-300 disabled:opacity-50"
                  >
                    <svg 
                      viewBox="0 0 24 24" 
                      className={`w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors ${isLoadingPrompt ? "animate-spin" : ""}`} 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="1.5"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                    <span className="text-[10px] tracking-wider text-zinc-600 group-hover:text-zinc-400 uppercase transition-colors">New Spark</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            FOOTER
            Minimal elegant footer
        ═══════════════════════════════════════════════════════════════ */}
        <footer className="relative py-16 border-t border-zinc-900/50">
          <div className="max-w-6xl mx-auto px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              {/* Brand */}
              <div className="text-center sm:text-left">
                <p className="text-[11px] tracking-[0.4em] uppercase text-zinc-700 mb-1">
                  {settings.siteName}
                </p>
                <p className="text-[10px] text-zinc-800" style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: "italic" }}>
                  {settings.siteTagline}
                </p>
              </div>
              
              {/* Stats */}
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <p className="text-lg font-extralight text-zinc-600">{writings.length}</p>
                  <p className="text-[9px] tracking-[0.3em] uppercase text-zinc-800">Writings</p>
                </div>
                <div className="w-px h-8 bg-zinc-800/30" />
                <div className="text-center">
                  <p className="text-lg font-extralight text-zinc-600">
                    {new Date().getFullYear() - 2024}
                  </p>
                  <p className="text-[9px] tracking-[0.3em] uppercase text-zinc-800">Years</p>
                </div>
              </div>
              
              {/* Links */}
              <div className="flex items-center gap-6">
                {settings.twitterUrl && (
                  <a href={settings.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-700 hover:text-zinc-500 transition-colors">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                )}
                {settings.githubUrl && (
                  <a href={settings.githubUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-700 hover:text-zinc-500 transition-colors">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </a>
                )}
                {settings.emailContact && (
                  <a href={`mailto:${settings.emailContact}`} className="text-zinc-700 hover:text-zinc-500 transition-colors">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                  </a>
                )}
              </div>
            </div>
            
            {/* Copyright */}
            <div className="mt-12 pt-6 border-t border-zinc-900/30 text-center space-y-2">
              <p className="text-[9px] tracking-wider text-zinc-800">
                © {new Date().getFullYear()} {settings.siteName || "Afterstill"}. All words carefully placed.
              </p>
              <p className="text-[8px] tracking-wider text-zinc-800/60">
                Crafted with intention by <span className="text-zinc-600">Juan Rizky Maulana</span>
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}