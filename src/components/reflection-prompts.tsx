"use client";

import { useState, useEffect, useCallback } from "react";

interface ReflectionPromptsProps {
  readonly isVisible: boolean;
  readonly writingTitle: string;
  readonly writingTags: string[];
  readonly onClose?: () => void;
}

// Reflection prompts organized by themes
const reflectionPrompts = {
  universal: [
    "What feeling lingered most after reading this?",
    "Did any phrase echo something you've felt before?",
    "What would you tell your past self about this?",
    "Is there something here you need to let go of?",
    "What truth did you find uncomfortable?",
  ],
  growth: [
    "How does this change how you see yourself?",
    "What old belief does this challenge?",
    "What small step could this inspire?",
  ],
  loss: [
    "What grief does this touch in you?",
    "Is there healing in acknowledging this?",
    "Who would you share this silence with?",
  ],
  love: [
    "Who came to mind as you read this?",
    "What love letter remains unwritten?",
    "How do you carry those who've left?",
  ],
  time: [
    "What moment does this resurrect?",
    "What future does this make you long for?",
    "What would older-you say about this?",
  ],
  solitude: [
    "What does your quiet voice say about this?",
    "In your stillness, what surfaces?",
    "What company do words like these keep?",
  ],
  memory: [
    "What forgotten thing did this unearth?",
    "Whose voice do you hear in these words?",
    "What do you wish you could remember?",
  ],
};

// Map tags to prompt categories
const tagToCategory: Record<string, keyof typeof reflectionPrompts> = {
  "personal-growth": "growth",
  "self-reflection": "growth",
  "healing": "growth",
  "grief": "loss",
  "loss": "loss",
  "letting-go": "loss",
  "love": "love",
  "relationships": "love",
  "connection": "love",
  "time": "time",
  "past": "time",
  "future": "time",
  "nostalgia": "time",
  "solitude": "solitude",
  "quiet": "solitude",
  "introspection": "solitude",
  "memory": "memory",
  "remembrance": "memory",
  "childhood": "memory",
};

export function ReflectionPrompts({ 
  isVisible, 
  writingTitle, 
  writingTags,
  onClose 
}: ReflectionPromptsProps) {
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [userReflection, setUserReflection] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [savedReflections, setSavedReflections] = useState<string[]>([]);
  
  // Select a relevant prompt based on tags
  const selectPrompt = useCallback(() => {
    // Find matching category from tags
    let category: keyof typeof reflectionPrompts = "universal";
    for (const tag of writingTags) {
      if (tagToCategory[tag.toLowerCase()]) {
        category = tagToCategory[tag.toLowerCase()];
        break;
      }
    }
    
    // Get prompts from category + universal
    const prompts = [
      ...reflectionPrompts[category],
      ...reflectionPrompts.universal.slice(0, 2),
    ];
    
    // Random selection
    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
    return randomPrompt;
  }, [writingTags]);
  
  // Initialize prompt
  useEffect(() => {
    if (isVisible && !currentPrompt) {
      setCurrentPrompt(selectPrompt());
    }
  }, [isVisible, currentPrompt, selectPrompt]);
  
  // Get new prompt
  const getNewPrompt = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentPrompt(selectPrompt());
      setIsAnimating(false);
    }, 300);
  };
  
  // Save reflection (to localStorage)
  const saveReflection = () => {
    if (!userReflection.trim()) return;
    
    const reflection = {
      prompt: currentPrompt,
      response: userReflection,
      writingTitle,
      timestamp: new Date().toISOString(),
    };
    
    try {
      const existing = localStorage.getItem("afterstill-reflections");
      const reflections = existing ? JSON.parse(existing) : [];
      reflections.push(reflection);
      localStorage.setItem("afterstill-reflections", JSON.stringify(reflections));
      setSavedReflections(prev => [...prev, userReflection]);
      setUserReflection("");
      setShowInput(false);
      
      // Show confirmation
      setTimeout(() => getNewPrompt(), 500);
    } catch {
      // ignore storage errors
    }
  };
  
  if (!isVisible) return null;
  
  return (
    <div 
      className={`
        fixed inset-x-0 bottom-0 z-50
        transition-all duration-700 ease-out
        ${isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}
      `}
    >
      {/* Gradient fade */}
      <div 
        className="absolute inset-x-0 bottom-full h-32 pointer-events-none"
        style={{
          background: "linear-gradient(to top, hsl(var(--background)) 0%, transparent 100%)",
        }}
      />
      
      {/* Content */}
      <div className="bg-background/95 backdrop-blur-xl border-t border-zinc-800/50 px-6 py-8">
        <div className="max-w-xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-[10px] text-zinc-400 tracking-[0.2em] uppercase">
              A moment to reflect
            </p>
            {onClose && (
              <button 
                onClick={onClose}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
          
          {/* Prompt */}
          <div 
            className={`
              mb-6 transition-all duration-300
              ${isAnimating ? "opacity-0 transform translate-y-2" : "opacity-100 transform translate-y-0"}
            `}
          >
            <p className="text-lg text-zinc-200 font-light leading-relaxed">
              {currentPrompt}
            </p>
          </div>
          
          {/* Input area */}
          {showInput ? (
            <div className="space-y-4">
              <textarea
                value={userReflection}
                onChange={(e) => setUserReflection(e.target.value)}
                placeholder="Write your thoughts..."
                className="
                  w-full h-24 px-4 py-3
                  bg-zinc-900/50 border border-zinc-700
                  rounded-lg resize-none
                  text-sm text-zinc-200 placeholder:text-zinc-500
                  focus:outline-none focus:border-zinc-600
                  transition-colors
                "
                autoFocus
              />
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowInput(false)}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveReflection}
                  disabled={!userReflection.trim()}
                  className="
                    px-4 py-2 text-xs
                    bg-zinc-700 hover:bg-zinc-600
                    text-zinc-200 rounded-lg
                    transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  Save Reflection
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowInput(true)}
                className="
                  flex-1 px-4 py-3
                  bg-zinc-900/50 border border-zinc-700
                  rounded-lg text-left
                  text-sm text-zinc-400
                  hover:border-zinc-600 hover:text-zinc-300
                  transition-colors
                "
              >
                Write a reflection...
              </button>
              <button
                onClick={getNewPrompt}
                className="
                  p-3 rounded-lg
                  border border-zinc-700
                  text-zinc-400 hover:text-zinc-300 hover:border-zinc-600
                  transition-colors
                "
                title="Different prompt"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path 
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          )}
          
          {/* Saved indicator */}
          {savedReflections.length > 0 && (
            <p className="mt-4 text-[10px] text-zinc-500 text-center">
              ✓ {savedReflections.length} reflection{savedReflections.length > 1 ? "s" : ""} saved
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReflectionPrompts;
