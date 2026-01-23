"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";

/**
 * BreathingText - Text that subtly pulses like breathing
 * 
 * Creates a meditative, living feel to the typography.
 * So subtle it's almost imperceptible, but adds life.
 */
export function BreathingText({ 
  children, 
  intensity = 0.02,
  duration = 4,
  className = "",
}: { 
  children: ReactNode;
  intensity?: number;
  duration?: number;
  className?: string;
}) {
  return (
    <motion.span
      className={className}
      animate={{
        opacity: [1, 1 - intensity, 1],
        letterSpacing: ["0em", "0.005em", "0em"],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.span>
  );
}

/**
 * BreathingParagraph - Entire paragraph breathes together
 */
export function BreathingParagraph({ 
  children,
  delay = 0,
  className = "",
}: { 
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.p
      className={className}
      initial={{ opacity: 0.95 }}
      animate={{
        opacity: [0.95, 1, 0.95],
        transform: ["translateY(0px)", "translateY(-1px)", "translateY(0px)"],
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    >
      {children}
    </motion.p>
  );
}

/**
 * PulsingWord - Individual word that pulses on hover
 */
export function PulsingWord({ 
  children,
  className = "",
}: { 
  children: string;
  className?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.span
      className={`inline-block cursor-default ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={isHovered ? {
        scale: [1, 1.02, 1],
        opacity: [1, 0.8, 1],
      } : {}}
      transition={{
        duration: 0.6,
        repeat: isHovered ? Infinity : 0,
      }}
    >
      {children}
    </motion.span>
  );
}

/**
 * TypewriterReveal - Text reveals character by character
 */
export function TypewriterReveal({ 
  text,
  speed = 50,
  delay = 0,
  className = "",
  onComplete,
}: { 
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  onComplete?: () => void;
}) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      let index = 0;
      const interval = setInterval(() => {
        if (index < text.length) {
          setDisplayedText(text.slice(0, index + 1));
          index++;
        } else {
          clearInterval(interval);
          setIsComplete(true);
          onComplete?.();
        }
      }, speed);
      
      return () => clearInterval(interval);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [text, speed, delay, onComplete]);
  
  return (
    <span className={className}>
      {displayedText}
      {!isComplete && (
        <motion.span
          className="inline-block w-[2px] h-[1em] bg-current ml-0.5"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}
    </span>
  );
}

/**
 * FadeInWords - Words fade in one by one
 */
export function FadeInWords({ 
  text,
  staggerDelay = 0.1,
  initialDelay = 0,
  className = "",
}: { 
  text: string;
  staggerDelay?: number;
  initialDelay?: number;
  className?: string;
}) {
  const words = text.split(" ");
  
  return (
    <span className={className}>
      {words.map((word, index) => (
        <motion.span
          key={index}
          className="inline-block mr-[0.25em]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: initialDelay + index * staggerDelay,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

/**
 * GlowOnRead - Text glows subtly when scrolled into view
 */
export function GlowOnRead({ 
  children,
  className = "",
}: { 
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0.7 }}
      animate={isVisible ? {
        opacity: 1,
        textShadow: [
          "0 0 0px transparent",
          "0 0 20px rgba(255,255,255,0.1)",
          "0 0 0px transparent",
        ],
      } : {}}
      transition={{
        duration: 2,
        textShadow: {
          duration: 1.5,
          delay: 0.3,
        },
      }}
    >
      {children}
    </motion.span>
  );
}

/**
 * ScatterReveal - Letters scatter in from random positions
 */
export function ScatterReveal({ 
  text,
  className = "",
}: { 
  text: string;
  className?: string;
}) {
  const letters = text.split("");
  
  return (
    <span className={className}>
      {letters.map((letter, index) => (
        <motion.span
          key={index}
          className="inline-block"
          initial={{ 
            opacity: 0, 
            x: (Math.random() - 0.5) * 50,
            y: (Math.random() - 0.5) * 50,
            rotate: (Math.random() - 0.5) * 30,
          }}
          animate={{ 
            opacity: 1, 
            x: 0, 
            y: 0,
            rotate: 0,
          }}
          transition={{
            duration: 0.8,
            delay: index * 0.03,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {letter === " " ? "\u00A0" : letter}
        </motion.span>
      ))}
    </span>
  );
}
