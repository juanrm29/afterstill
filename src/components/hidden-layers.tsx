"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type Props = {
  content: string;
  writingId: string;
};

type HiddenLayer = {
  id: string;
  type: "thought" | "whisper" | "memory" | "subtext";
  trigger: string;
  position: number;
  aiGenerated?: string;
  isLoading?: boolean;
};

// Extract potential hidden layers from content
function extractHiddenLayers(content: string, writingId: string): HiddenLayer[] {
  const layers: HiddenLayer[] = [];
  
  // Find emphasized words (*word* or _word_) as triggers for thoughts
  const emphasisRegex = /[*_]([^*_]+)[*_]/g;
  let match;
  let idx = 0;
  
  while ((match = emphasisRegex.exec(content)) !== null && idx < 4) {
    layers.push({
      id: `${writingId}-layer-${idx}`,
      type: idx % 2 === 0 ? "thought" : "whisper",
      trigger: match[1],
      position: match.index
    });
    idx++;
  }
  
  // Find quoted text as memories
  const quoteRegex = /"([^"]+)"/g;
  while ((match = quoteRegex.exec(content)) !== null && idx < 6) {
    layers.push({
      id: `${writingId}-layer-${idx}`,
      type: "memory",
      trigger: match[1].split(' ').slice(0, 4).join(' '),
      position: match.index
    });
    idx++;
  }
  
  // Find sentences with ellipsis as subtext
  const ellipsisRegex = /([^.!?]*\.{3}[^.!?]*)/g;
  while ((match = ellipsisRegex.exec(content)) !== null && idx < 8) {
    const phrase = match[1].trim().split(' ').slice(0, 5).join(' ');
    if (phrase.length > 10) {
      layers.push({
        id: `${writingId}-layer-${idx}`,
        type: "subtext",
        trigger: phrase,
        position: match.index
      });
      idx++;
    }
  }
  
  return layers;
}

const typeConfig: Record<string, { icon: string; label: string; prompt: string }> = {
  thought: {
    icon: "◈",
    label: "inner thought",
    prompt: "What deeper meaning or unspoken thought might lie beneath this phrase? Respond in 1-2 poetic sentences, as if revealing a hidden layer of consciousness."
  },
  whisper: {
    icon: "✧",
    label: "whisper",
    prompt: "What secret or whispered truth does this phrase hint at? Respond in 1-2 mysterious, evocative sentences."
  },
  memory: {
    icon: "◌",
    label: "memory echo",
    prompt: "What memory or echo from the past might this phrase evoke? Respond in 1-2 nostalgic, dreamlike sentences."
  },
  subtext: {
    icon: "∘",
    label: "subtext",
    prompt: "What is left unsaid in this phrase? What lies between the lines? Respond in 1-2 contemplative sentences."
  }
};

export function HiddenLayers({ content, writingId }: Props) {
  const [layers] = useState(() => extractHiddenLayers(content, writingId));
  const [revealedLayers, setRevealedLayers] = useState<Map<string, string>>(new Map());
  const [loadingLayers, setLoadingLayers] = useState<Set<string>>(new Set());
  const [activeLayer, setActiveLayer] = useState<HiddenLayer | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    
    globalThis.addEventListener('mousemove', handleMouseMove);
    return () => globalThis.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  // Fetch AI interpretation for a layer
  const fetchAIInterpretation = useCallback(async (layer: HiddenLayer) => {
    if (revealedLayers.has(layer.id) || loadingLayers.has(layer.id)) return;
    
    setLoadingLayers(prev => new Set([...prev, layer.id]));
    
    try {
      const config = typeConfig[layer.type];
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `The phrase is: "${layer.trigger}"\n\n${config.prompt}`,
          maxTokens: 100
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const interpretation = data.analysis || data.result || data.text || 
          `The phrase "${layer.trigger}" resonates with something deeper, a meaning that unfolds in stillness.`;
        
        setRevealedLayers(prev => new Map([...prev, [layer.id, interpretation]]));
      } else {
        // Fallback to poetic generated text
        const fallback = generateFallbackInterpretation(layer.trigger, layer.type);
        setRevealedLayers(prev => new Map([...prev, [layer.id, fallback]]));
      }
    } catch {
      const fallback = generateFallbackInterpretation(layer.trigger, layer.type);
      setRevealedLayers(prev => new Map([...prev, [layer.id, fallback]]));
    } finally {
      setLoadingLayers(prev => {
        const next = new Set(prev);
        next.delete(layer.id);
        return next;
      });
    }
  }, [revealedLayers, loadingLayers]);
  
  const handleTriggerHover = (layer: HiddenLayer) => {
    setActiveLayer(layer);
    fetchAIInterpretation(layer);
  };
  
  const handleTriggerLeave = () => {
    setActiveLayer(null);
  };
  
  const discoveredCount = revealedLayers.size;
  const totalCount = layers.length;
  
  if (layers.length === 0) return null;
  
  return (
    <div ref={containerRef} className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-[9px] text-zinc-600 uppercase tracking-[0.2em]">
            Hidden Layers
          </span>
          <div className="h-px w-8 bg-gradient-to-r from-zinc-800 to-transparent" />
        </div>
        
        {/* Progress indicator */}
        <div className="flex items-center gap-2">
          <div className="flex gap-[3px]">
            {layers.map((layer) => (
              <div
                key={layer.id}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-700 ${
                  revealedLayers.has(layer.id)
                    ? "bg-violet-400/80 shadow-sm shadow-violet-400/30"
                    : loadingLayers.has(layer.id)
                    ? "bg-violet-400/40 animate-pulse"
                    : "bg-zinc-800"
                }`}
              />
            ))}
          </div>
          <span className="text-[9px] text-zinc-700 font-mono">
            {discoveredCount}/{totalCount}
          </span>
        </div>
      </div>
      
      {/* Trigger words */}
      <div className="flex flex-wrap gap-2">
        {layers.map(layer => {
          const config = typeConfig[layer.type];
          const isRevealed = revealedLayers.has(layer.id);
          const isLoading = loadingLayers.has(layer.id);
          const isActive = activeLayer?.id === layer.id;
          
          return (
            <button
              key={layer.id}
              onMouseEnter={() => handleTriggerHover(layer)}
              onMouseLeave={handleTriggerLeave}
              onFocus={() => handleTriggerHover(layer)}
              onBlur={handleTriggerLeave}
              className={`group relative text-[10px] px-3 py-1.5 rounded-full border transition-all duration-500 ${
                isRevealed
                  ? "bg-violet-500/[0.08] border-violet-500/20 text-violet-400"
                  : isActive
                  ? "bg-white/[0.04] border-white/10 text-zinc-300 scale-[1.02]"
                  : "border-zinc-800/50 text-zinc-600 hover:text-zinc-400 hover:border-zinc-700"
              }`}
            >
              {/* Loading pulse */}
              {isLoading && (
                <span className="absolute inset-0 rounded-full border border-violet-400/30 animate-ping" />
              )}
              
              <span className={`mr-1.5 transition-all duration-300 ${isActive ? "opacity-100" : "opacity-60"}`}>
                {config.icon}
              </span>
              <span className="truncate max-w-[100px]">
                {layer.trigger.slice(0, 18)}{layer.trigger.length > 18 ? "…" : ""}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* Floating reveal tooltip */}
      {activeLayer && (
        <div
          className="fixed z-50 max-w-xs p-4 rounded-xl bg-zinc-950/95 border border-white/[0.08] backdrop-blur-2xl shadow-2xl animate-fade-in pointer-events-none"
          style={{
            left: Math.min(mousePos.x + 16, globalThis.innerWidth - 320),
            top: Math.min(mousePos.y + 16, globalThis.innerHeight - 150),
          }}
        >
          {/* Type label */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-violet-400/80">
              {typeConfig[activeLayer.type].icon}
            </span>
            <span className="text-[9px] text-zinc-600 uppercase tracking-wider">
              {typeConfig[activeLayer.type].label}
            </span>
          </div>
          
          {/* Content */}
          {loadingLayers.has(activeLayer.id) ? (
            <div className="flex items-center gap-2 py-2">
              <div className="w-1 h-1 rounded-full bg-violet-400/60 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1 h-1 rounded-full bg-violet-400/60 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1 h-1 rounded-full bg-violet-400/60 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          ) : (
            <p className="text-[13px] text-zinc-300 leading-relaxed">
              {revealedLayers.get(activeLayer.id) || "Hover to reveal..."}
            </p>
          )}
        </div>
      )}
      
      {/* Completed message */}
      {discoveredCount === totalCount && totalCount > 0 && (
        <div className="mt-5 flex items-center justify-center gap-2 text-[10px] text-violet-400/50">
          <span className="w-4 h-px bg-violet-400/20" />
          <span>all layers revealed</span>
          <span className="w-4 h-px bg-violet-400/20" />
        </div>
      )}
    </div>
  );
}

// Fallback poetic interpretations
function generateFallbackInterpretation(trigger: string, type: string): string {
  const interpretations: Record<string, string[]> = {
    thought: [
      `Within "${trigger}" lies a universe of unspoken truths, waiting to be understood.`,
      `The weight of "${trigger}" echoes through consciousness, asking to be felt rather than explained.`,
      `"${trigger}" — a doorway to deeper knowing, where meaning unfolds like petals.`
    ],
    whisper: [
      `"${trigger}" whispers of things half-remembered, truths that exist in twilight.`,
      `In the silence after "${trigger}", something ancient stirs.`,
      `The secret held by "${trigger}" reveals itself only to those who listen with stillness.`
    ],
    memory: [
      `"${trigger}" carries echoes of another time, another self.`,
      `Memory wraps around "${trigger}" like morning mist around a mountain.`,
      `In "${trigger}", the past breathes quietly, present and eternal.`
    ],
    subtext: [
      `Beneath "${trigger}" flows an undercurrent of meaning, felt but not spoken.`,
      `What "${trigger}" doesn't say speaks louder than words.`,
      `The spaces between "${trigger}" hold their own kind of truth.`
    ]
  };
  
  const options = interpretations[type] || interpretations.thought;
  return options[Math.floor(Math.random() * options.length)];
}
