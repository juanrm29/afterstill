"use client";

import { useState, useEffect, useMemo } from "react";

type SceneType = "deep-night" | "dawn-mist" | "grey-day" | "dusk-ember" | "evening-calm";
type InstrumentType = "oracle" | "radio" | "catalog" | "candle" | null;

interface AmbientLandscapeProps {
  activeInstrument?: InstrumentType;
  instrumentIntensity?: number;
}

// Scene colors based on time
const sceneColors: Record<SceneType, { sky: string[]; mountains: string[]; accent: string }> = {
  "deep-night": {
    sky: ["#010102", "#030306", "#05050a"],
    mountains: ["#0a0a12", "#060610", "#04040a"],
    accent: "#1e3a5f",
  },
  "dawn-mist": {
    sky: ["#030308", "#080810", "#0c0c18"],
    mountains: ["#0a0a14", "#080810", "#06060c"],
    accent: "#2d3a5f",
  },
  "grey-day": {
    sky: ["#050508", "#08080c", "#0a0a10"],
    mountains: ["#0c0c14", "#0a0a10", "#08080c"],
    accent: "#3a3a48",
  },
  "dusk-ember": {
    sky: ["#040406", "#08080e", "#0a0a14"],
    mountains: ["#0a0a10", "#08080c", "#060608"],
    accent: "#3d2d5f",
  },
  "evening-calm": {
    sky: ["#020204", "#04040a", "#06060e"],
    mountains: ["#080810", "#06060c", "#040408"],
    accent: "#2d3a5f",
  },
};

export function AmbientLandscape({ 
  activeInstrument = null, 
  instrumentIntensity = 0 
}: AmbientLandscapeProps) {
  const [currentScene, setCurrentScene] = useState<SceneType>("deep-night");
  
  // Determine scene based on time
  useEffect(() => {
    const updateScene = () => {
      const hour = new Date().getHours();
      if (hour >= 0 && hour < 5) setCurrentScene("deep-night");
      else if (hour >= 5 && hour < 7) setCurrentScene("dawn-mist");
      else if (hour >= 7 && hour < 17) setCurrentScene("grey-day");
      else if (hour >= 17 && hour < 20) setCurrentScene("dusk-ember");
      else setCurrentScene("evening-calm");
    };
    updateScene();
    const interval = setInterval(updateScene, 60000);
    return () => clearInterval(interval);
  }, []);
  
  const colors = sceneColors[currentScene];
  
  // Minimal stars for night scenes
  const stars = useMemo(() => {
    if (currentScene !== "deep-night" && currentScene !== "evening-calm") return [];
    return Array.from({ length: 25 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 50,
      size: Math.random() * 1 + 0.3,
      opacity: Math.random() * 0.2 + 0.05,
    }));
  }, [currentScene]);
  
  // Show moon only at night
  const showMoon = currentScene === "deep-night" || currentScene === "evening-calm";
  
  // Instrument effect colors
  const oracleActive = activeInstrument === "oracle";
  const candleActive = activeInstrument === "candle";

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Sky gradient */}
      <div 
        className="absolute inset-0 transition-colors duration-[5000ms]"
        style={{
          background: `linear-gradient(to bottom, ${colors.sky[0]} 0%, ${colors.sky[1]} 50%, ${colors.sky[2]} 100%)`,
        }}
      />
      
      {/* Oracle effect - subtle mystical glow */}
      {oracleActive && (
        <div 
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ 
            opacity: instrumentIntensity * 0.3,
            background: "radial-gradient(ellipse at 50% 50%, rgba(139, 92, 246, 0.08), transparent 60%)",
          }}
        />
      )}
      
      {/* Stars layer - CSS only, no animation */}
      {stars.length > 0 && (
        <div className="absolute inset-0">
          {stars.map((star) => (
            <div
              key={star.id}
              className="absolute rounded-full bg-slate-400"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: star.size,
                height: star.size,
                opacity: star.opacity,
              }}
            />
          ))}
        </div>
      )}
      
      {/* Moon */}
      {showMoon && (
        <div 
          className="absolute transition-opacity duration-[5000ms]"
          style={{
            top: "8%",
            right: "15%",
            width: "40px",
            height: "40px",
            opacity: currentScene === "deep-night" ? 0.08 : 0.05,
          }}
        >
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(120, 130, 150, 0.1) 0%, transparent 70%)",
              transform: "scale(2.5)",
            }}
          />
          <div className="absolute inset-0 rounded-full bg-zinc-500/8" />
        </div>
      )}
      
      {/* Distant mountains */}
      <svg 
        className="absolute bottom-0 w-full h-[40%]"
        viewBox="0 0 1440 400"
        preserveAspectRatio="none"
      >
        <path
          d="M0,400 L0,280 Q180,180 360,220 Q540,150 720,200 Q900,120 1080,180 Q1260,100 1440,160 L1440,400 Z"
          fill={colors.mountains[0]}
          opacity="0.6"
        />
      </svg>
      
      {/* Mid mountains */}
      <svg 
        className="absolute bottom-0 w-full h-[30%]"
        viewBox="0 0 1440 300"
        preserveAspectRatio="none"
      >
        <path
          d="M0,300 L0,200 Q120,120 240,160 Q360,80 480,130 Q600,60 720,100 Q840,40 960,90 Q1080,50 1200,80 Q1320,30 1440,70 L1440,300 Z"
          fill={colors.mountains[1]}
          opacity="0.8"
        />
      </svg>
      
      {/* Foreground hills */}
      <svg 
        className="absolute bottom-0 w-full h-[20%]"
        viewBox="0 0 1440 200"
        preserveAspectRatio="none"
      >
        <path
          d="M0,200 L0,120 Q180,80 360,100 Q540,60 720,90 Q900,50 1080,80 Q1260,40 1440,60 L1440,200 Z"
          fill={colors.mountains[2]}
        />
      </svg>
      
      {/* Candle effect - warm glow from bottom */}
      {candleActive && (
        <div 
          className="absolute bottom-0 left-0 right-0 h-1/3 transition-opacity duration-1000 pointer-events-none"
          style={{
            opacity: instrumentIntensity * 0.2,
            background: `radial-gradient(ellipse at 50% 100%, rgba(148, 163, 184, 0.08), transparent 50%)`,
          }}
        />
      )}
      
      {/* Ground fade */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
        style={{
          background: `linear-gradient(to top, ${colors.mountains[2]} 0%, transparent 100%)`,
          opacity: 0.5,
        }}
      />
      
      {/* Vignette */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 20%, rgba(2,2,3,0.5) 70%, rgba(2,2,3,0.8) 100%)",
        }}
      />
    </div>
  );
}

export default AmbientLandscape;
