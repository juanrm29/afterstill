'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { marked } from 'marked';

interface Props {
  text: string;
  title?: string;
  onComplete?: () => void;
  className?: string;
}

// Configure marked
marked.setOptions({
  gfm: true,
  breaks: true,
});

// Simple HTML sanitizer
function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined') return html;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script').forEach(el => el.remove());
  doc.querySelectorAll('*').forEach(el => {
    Array.from(el.attributes).forEach(attr => {
      if (attr.name.startsWith('on')) el.removeAttribute(attr.name);
    });
  });
  return doc.body.innerHTML;
}

export function TypewriterMode({ text, title, onComplete, className = '' }: Props) {
  const [displayedText, setDisplayedText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [speed, setSpeed] = useState<'contemplative' | 'flowing' | 'swift'>('flowing');
  const [showCursor, setShowCursor] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [inkOpacity, setInkOpacity] = useState(1);
  const [breathPhase, setBreathPhase] = useState(0);
  
  const indexRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastSoundTimeRef = useRef(0);

  // Speed mappings - poetic names
  const speeds = {
    contemplative: { min: 100, max: 180, pause: 600, name: 'Contemplate' },
    flowing: { min: 50, max: 90, pause: 350, name: 'Flow' },
    swift: { min: 20, max: 45, pause: 150, name: 'Swift' },
  };

  // Soft, pleasant keystroke - like gentle rain on paper
  const playKeystroke = useCallback(() => {
    if (!soundEnabled) return;
    
    const now = Date.now();
    if (now - lastSoundTimeRef.current < 40) return;
    lastSoundTimeRef.current = now;
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // Soft muted tone - like paper being touched
      const baseFreq = 800 + Math.random() * 400;
      oscillator.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 0.3, ctx.currentTime + 0.03);
      oscillator.type = 'sine';
      
      // Low-pass filter for warmth
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, ctx.currentTime);
      filter.Q.setValueAtTime(0.5, ctx.currentTime);
      
      // Very gentle envelope
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.012, ctx.currentTime + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.05);
    } catch {
      // Audio not supported
    }
  }, [soundEnabled]);

  // Soft chime for paragraph end
  const playChime = useCallback(() => {
    if (!soundEnabled) return;
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.setValueAtTime(1200, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.4);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.015, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.6);
    } catch {
      // Audio not supported
    }
  }, [soundEnabled]);

  // Calculate delay with natural rhythm
  const getDelay = useCallback((char: string, nextChar?: string) => {
    const { min, max, pause } = speeds[speed];
    
    if (['.', '!', '?'].includes(char)) {
      if (nextChar === '\n') return pause * 2.5;
      return pause * 2;
    }
    if ([',', ';', ':'].includes(char)) return pause;
    if (char === '\n' && nextChar === '\n') return pause * 3;
    if (char === '\n') return pause * 1.5;
    
    // Slight hesitation before long words
    if (char === ' ' && nextChar && /[a-zA-Z]/.test(nextChar)) {
      const wordAhead = text.slice(indexRef.current + 1).split(/\s/)[0];
      if (wordAhead && wordAhead.length > 8) return max * 1.5;
    }
    
    return min + Math.random() * (max - min);
  }, [speed, text]);

  // Type next character
  const typeNext = useCallback(() => {
    if (indexRef.current >= text.length) {
      setIsComplete(true);
      setIsPlaying(false);
      playChime();
      onComplete?.();
      return;
    }

    const char = text[indexRef.current];
    const nextChar = text[indexRef.current + 1];
    
    setDisplayedText(text.slice(0, indexRef.current + 1));
    
    if (/[a-zA-Z0-9]/.test(char)) {
      playKeystroke();
    }
    
    if (char === '.' && nextChar === '\n') {
      setTimeout(playChime, 200);
    }
    
    indexRef.current++;
    
    // Subtle ink fading
    if (indexRef.current % 200 === 0) {
      setInkOpacity(prev => Math.max(0.75, prev - 0.015));
    }
    
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
    
    const delay = getDelay(char, nextChar);
    timeoutRef.current = setTimeout(typeNext, delay);
  }, [text, getDelay, playKeystroke, playChime, onComplete]);

  const togglePlay = useCallback(() => {
    if (isComplete) {
      indexRef.current = 0;
      setDisplayedText('');
      setIsComplete(false);
      setIsPlaying(true);
      setInkOpacity(1);
    } else if (isPlaying) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
    }
  }, [isComplete, isPlaying]);

  const skipToEnd = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    indexRef.current = text.length;
    setDisplayedText(text);
    setIsComplete(true);
    setIsPlaying(false);
    onComplete?.();
  }, [text, onComplete]);

  const reset = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    indexRef.current = 0;
    setDisplayedText('');
    setIsComplete(false);
    setIsPlaying(false);
    setInkOpacity(1);
  }, []);

  useEffect(() => {
    if (isPlaying && !isComplete) {
      typeNext();
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isPlaying, isComplete, typeNext]);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
      setBreathPhase(prev => (prev + 1) % 100);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const progress = text.length > 0 ? (indexRef.current / text.length) * 100 : 0;
  const wordsTyped = displayedText.split(/\s+/).filter(Boolean).length;
  const totalWords = text.split(/\s+/).filter(Boolean).length;

  // Cursor HTML to inject
  const cursorHtml = !isComplete ? `<span class="typewriter-cursor" style="display:inline-block;width:2px;height:1.1em;margin-left:2px;vertical-align:text-bottom;background-color:${showCursor ? 'rgba(217,119,6,0.7)' : 'transparent'};box-shadow:${showCursor ? '0 0 6px rgba(217,119,6,0.3)' : 'none'};border-radius:1px;transition:all 0.15s ease;"></span>` : '';

  // Render markdown with cursor at the end
  const renderedHtml = useMemo(() => {
    if (!displayedText) return '';
    const html = sanitizeHtml(marked(displayedText) as string);
    // Insert cursor before the last closing tag
    if (!isComplete && html) {
      // Find the last closing tag and insert cursor before it
      const lastCloseTag = html.lastIndexOf('</');
      if (lastCloseTag > 0) {
        return html.slice(0, lastCloseTag) + cursorHtml + html.slice(lastCloseTag);
      }
      return html + cursorHtml;
    }
    return html;
  }, [displayedText, isComplete, cursorHtml]);

  return (
    <div className={`relative bg-stone-950 rounded-2xl overflow-hidden ${className}`}>
      {/* Atmospheric background */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          background: `
            radial-gradient(ellipse at 20% 20%, rgba(139, 92, 246, 0.06) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(217, 119, 6, 0.04) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(30, 27, 24, 1) 0%, rgba(12, 10, 9, 1) 100%)
          `
        }}
      />
      
      {/* Subtle grain */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header */}
      <div className="relative p-5 border-b border-stone-800/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-900/20 border border-amber-800/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-500/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-stone-300 text-sm font-light tracking-wide">
                {title || 'Untitled'}
              </h3>
              <p className="text-[10px] text-stone-600 mt-0.5 font-mono">
                {wordsTyped} / {totalWords} words
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg transition-all duration-300 ${
              soundEnabled 
                ? 'bg-amber-900/30 text-amber-400 border border-amber-800/40' 
                : 'bg-stone-800/30 text-stone-600 border border-stone-700/30 hover:text-stone-400'
            }`}
            title={soundEnabled ? 'Sound on' : 'Sound off'}
          >
            {soundEnabled ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Content area */}
      <div 
        ref={containerRef}
        className="relative min-h-[300px] max-h-[400px] overflow-y-auto"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(68, 64, 60, 0.3) transparent',
        }}
      >
        <div className="p-6 sm:p-8">
          {/* Rendered markdown content */}
          <div 
            className="relative prose prose-invert prose-stone max-w-none
              prose-headings:font-light prose-headings:tracking-tight prose-headings:text-stone-200
              prose-h1:text-2xl prose-h1:mt-8 prose-h1:mb-4
              prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3
              prose-h3:text-lg prose-h3:mt-4 prose-h3:mb-2
              prose-p:text-base prose-p:sm:text-lg prose-p:leading-[2] prose-p:text-stone-300 prose-p:font-light prose-p:tracking-[0.01em] prose-p:mb-6
              prose-a:text-amber-400 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-stone-200 prose-strong:font-medium
              prose-em:text-stone-400 prose-em:italic
              prose-code:text-amber-400 prose-code:bg-stone-800/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-stone-900/60 prose-pre:border prose-pre:border-stone-800/50 prose-pre:rounded-lg prose-pre:p-4
              prose-blockquote:border-l-2 prose-blockquote:border-amber-500/40 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-stone-400 prose-blockquote:not-italic prose-blockquote:font-light
              prose-ul:text-stone-300 prose-ol:text-stone-300
              prose-li:marker:text-stone-600
              prose-hr:border-stone-800/50 prose-hr:my-8"
            style={{
              opacity: inkOpacity,
              textShadow: isPlaying ? '0 0 15px rgba(217, 119, 6, 0.08)' : 'none',
            }}
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
          
          
          {!isPlaying && !displayedText && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
              <div className="w-10 h-10 rounded-full border border-stone-700/40 flex items-center justify-center mb-3 animate-pulse">
                <svg className="w-4 h-4 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                </svg>
              </div>
              <p className="text-stone-600 text-xs font-light italic">
                Begin the journey
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="relative p-5 border-t border-stone-800/30 bg-stone-900/30">
        {/* Progress line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-stone-800/40">
          <div 
            className="h-full transition-all duration-300"
            style={{ 
              width: `${progress}%`,
              background: 'linear-gradient(90deg, rgba(217, 119, 6, 0.2), rgba(217, 119, 6, 0.5))',
            }}
          />
        </div>
        
        {/* Speed pills */}
        <div className="flex items-center justify-center gap-1 mb-4">
          {(['contemplative', 'flowing', 'swift'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-3 py-1 text-[10px] rounded-full transition-all duration-300 ${
                speed === s 
                  ? 'bg-stone-800 text-stone-200 border border-stone-600/50' 
                  : 'text-stone-600 hover:text-stone-400 border border-transparent'
              }`}
            >
              {speeds[s].name}
            </button>
          ))}
        </div>
        
        {/* Main controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={reset}
            disabled={!displayedText && !isPlaying}
            className="p-2 rounded-full text-stone-500 hover:text-stone-300 hover:bg-stone-800/40 disabled:opacity-20 transition-all"
            title="Reset"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          
          <button
            onClick={togglePlay}
            className="p-3 rounded-full transition-all duration-300"
            style={{
              background: isPlaying 
                ? 'linear-gradient(135deg, rgba(120, 53, 15, 0.4), rgba(180, 83, 9, 0.2))'
                : 'linear-gradient(135deg, rgba(68, 64, 60, 0.4), rgba(41, 37, 36, 0.4))',
              border: '1px solid',
              borderColor: isPlaying ? 'rgba(180, 83, 9, 0.4)' : 'rgba(68, 64, 60, 0.4)',
              boxShadow: isPlaying ? '0 0 15px rgba(217, 119, 6, 0.15)' : 'none',
            }}
          >
            {isPlaying ? (
              <svg className="w-5 h-5 text-amber-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
              </svg>
            ) : isComplete ? (
              <svg className="w-5 h-5 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              </svg>
            )}
          </button>
          
          <button
            onClick={skipToEnd}
            disabled={isComplete}
            className="p-2 rounded-full text-stone-500 hover:text-stone-300 hover:bg-stone-800/40 disabled:opacity-20 transition-all"
            title="Skip"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        <div className="mt-3 text-center">
          <p className="text-[10px] text-stone-600 font-light tracking-wider">
            {isComplete ? '— fin —' : isPlaying ? `${Math.round(progress)}%` : displayedText ? 'paused' : ''}
          </p>
        </div>
      </div>
      
      {/* Ambient glow */}
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-20 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(217, 119, 6, 0.04) 0%, transparent 70%)',
          opacity: 0.5 + Math.sin(breathPhase * 0.1) * 0.25,
        }}
      />
    </div>
  );
}

export default TypewriterMode;
