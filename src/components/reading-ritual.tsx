"use client";

import { useState, useEffect, useCallback } from "react";

type Props = {
  title: string;
  excerpt: string;
  onComplete: () => void;
};

export function ReadingRitual({ title, excerpt, onComplete }: Props) {
  const [phase, setPhase] = useState<"enter" | "breathe" | "word" | "ready" | "complete">("enter");
  const [breathCount, setBreathCount] = useState(0);
  const [isBreathingIn, setIsBreathingIn] = useState(true);
  const [revealedWord, setRevealedWord] = useState("");
  const [opacity, setOpacity] = useState(1);
  
  // Extract a meaningful word from title or excerpt
  useEffect(() => {
    const words = `${title} ${excerpt}`.split(/\s+/).filter(w => w.length > 4 && w.length < 12);
    const meaningfulWords = words.filter(w => !/^(yang|dari|untuk|dengan|dalam|adalah|atau|pada|ini|itu|akan|bisa|juga|tidak|ada|mereka|kita|kami|saya|kamu|dia)$/i.test(w));
    const word = meaningfulWords[Math.floor(Math.random() * meaningfulWords.length)] || words[0] || title.split(" ")[0];
    setRevealedWord(word.replace(/[.,!?;:'"]/g, ""));
  }, [title, excerpt]);

  // Phase transitions
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    if (phase === "enter") {
      timers.push(setTimeout(() => setPhase("breathe"), 1500));
    } else if (phase === "breathe" && breathCount >= 2) {
      timers.push(setTimeout(() => setPhase("word"), 500));
    } else if (phase === "word") {
      timers.push(setTimeout(() => setPhase("ready"), 3000));
    } else if (phase === "ready") {
      timers.push(setTimeout(() => {
        setOpacity(0);
        setTimeout(() => {
          setPhase("complete");
          onComplete();
        }, 1000);
      }, 1500));
    }
    
    return () => timers.forEach(clearTimeout);
  }, [phase, breathCount, onComplete]);

  // Breathing cycle
  useEffect(() => {
    if (phase !== "breathe") return;
    
    const breathCycle = () => {
      setIsBreathingIn(true);
      setTimeout(() => {
        setIsBreathingIn(false);
        setTimeout(() => {
          setBreathCount(prev => prev + 1);
        }, 2500);
      }, 2500);
    };
    
    breathCycle();
    const interval = setInterval(breathCycle, 5000);
    return () => clearInterval(interval);
  }, [phase]);

  // Skip ritual on click
  const handleSkip = useCallback(() => {
    setOpacity(0);
    setTimeout(() => {
      setPhase("complete");
      onComplete();
    }, 300);
  }, [onComplete]);

  if (phase === "complete") return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950 cursor-pointer transition-opacity duration-1000"
      style={{ opacity }}
      onClick={handleSkip}
    >
      {/* Subtle background pulse */}
      <div 
        className={`absolute inset-0 transition-all duration-[2500ms] ease-in-out ${
          phase === "breathe" && isBreathingIn ? "bg-zinc-900/30" : "bg-transparent"
        }`}
      />
      
      {/* Center content */}
      <div className="relative z-10 text-center px-8 max-w-lg">
        
        {/* Enter phase */}
        {phase === "enter" && (
          <div className="animate-fade-in">
            <div className="w-1 h-1 bg-zinc-600 rounded-full mx-auto mb-8 animate-pulse" />
            <p className="text-[10px] text-zinc-700 uppercase tracking-[0.4em]">
              entering stillness
            </p>
          </div>
        )}
        
        {/* Breathe phase */}
        {phase === "breathe" && (
          <div className="animate-fade-in">
            {/* Breathing circle */}
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div 
                className={`absolute inset-0 rounded-full border border-zinc-800 transition-all duration-[2500ms] ease-in-out ${
                  isBreathingIn ? "scale-100 opacity-60" : "scale-75 opacity-30"
                }`}
              />
              <div 
                className={`absolute inset-2 rounded-full border border-zinc-700/50 transition-all duration-[2500ms] ease-in-out ${
                  isBreathingIn ? "scale-100 opacity-40" : "scale-50 opacity-20"
                }`}
              />
              <div 
                className={`absolute inset-4 rounded-full bg-zinc-800/20 transition-all duration-[2500ms] ease-in-out ${
                  isBreathingIn ? "scale-100" : "scale-25"
                }`}
              />
            </div>
            
            <p className="text-[11px] text-zinc-600 tracking-[0.2em] transition-all duration-500">
              {isBreathingIn ? "breathe in" : "breathe out"}
            </p>
            
            {/* Breath counter */}
            <div className="flex items-center justify-center gap-2 mt-6">
              {[0, 1].map(i => (
                <div 
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                    i < breathCount ? "bg-zinc-500" : "bg-zinc-800"
                  }`}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Word reveal phase */}
        {phase === "word" && (
          <div className="animate-fade-in">
            <p className="text-[9px] text-zinc-700 uppercase tracking-[0.3em] mb-6">
              a word awaits
            </p>
            <h2 
              className="text-3xl md:text-4xl text-zinc-400 font-light tracking-wide animate-word-reveal"
              style={{ fontFamily: "var(--font-cormorant), serif" }}
            >
              {revealedWord}
            </h2>
          </div>
        )}
        
        {/* Ready phase */}
        {phase === "ready" && (
          <div className="animate-fade-in">
            <div className="w-12 h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent mx-auto mb-6" />
            <p className="text-[10px] text-zinc-600 tracking-[0.2em]">
              ready
            </p>
          </div>
        )}
      </div>
      
      {/* Skip hint */}
      <p className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[9px] text-zinc-800 tracking-wider">
        tap to skip
      </p>
      
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes word-reveal {
          0% { opacity: 0; letter-spacing: 0.5em; filter: blur(8px); }
          100% { opacity: 1; letter-spacing: 0.05em; filter: blur(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
        .animate-word-reveal {
          animation: word-reveal 2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
