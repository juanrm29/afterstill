/**
 * Advanced Animation Utilities
 * Genius micro-interactions and physics-based animations
 */

import React from "react";
import { MotionValue, useSpring, useTransform } from "framer-motion";

/**
 * Magnetic cursor effect for interactive elements
 */
export function useMagneticCursor(
  ref: React.RefObject<HTMLElement>,
  strength: number = 0.3
) {
  const handleMouseMove = (e: MouseEvent) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = (e.clientX - centerX) * strength;
    const deltaY = (e.clientY - centerY) * strength;

    ref.current.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
  };

  const handleMouseLeave = () => {
    if (!ref.current) return;
    ref.current.style.transform = "translate(0, 0)";
  };

  return { handleMouseMove, handleMouseLeave };
}

/**
 * Parallax scroll effect
 */
export function useParallax(value: MotionValue<number>, distance: number) {
  return useTransform(value, [0, 1], [-distance, distance]);
}

/**
 * Smooth spring animation
 */
export function useSmoothSpring(value: number) {
  return useSpring(value, {
    stiffness: 100,
    damping: 30,
    mass: 1,
  });
}

/**
 * Page transition variants
 */
export const pageTransition = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1], // Custom easing
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

/**
 * Stagger children animation
 */
export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

/**
 * Morphing SVG path animation
 */
export function morphPath(from: string, to: string, progress: number): string {
  // Simple linear interpolation for demo
  // Use flubber or similar for production morphing
  return progress < 0.5 ? from : to;
}

/**
 * Reveal text animation
 */
export const revealText = {
  hidden: {
    opacity: 0,
    y: 100,
    rotateX: -90,
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

/**
 * Liquid cursor follow effect
 */
export class LiquidCursor {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly points: Array<{ x: number; y: number; vx: number; vy: number }> = [];
  private mouse = { x: 0, y: 0 };
  private animationId: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.resize();
    this.init();
  }

  private resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  private init() {
    for (let i = 0; i < 20; i++) {
      this.points.push({
        x: this.mouse.x,
        y: this.mouse.y,
        vx: 0,
        vy: 0,
      });
    }
  }

  updateMouse(x: number, y: number) {
    this.mouse = { x, y };
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Update points
    this.points.forEach((point, i) => {
      const spring = 0.4;
      const friction = 0.5;

      if (i === 0) {
        point.vx += (this.mouse.x - point.x) * spring;
        point.vy += (this.mouse.y - point.y) * spring;
      } else {
        point.vx += (this.points[i - 1].x - point.x) * spring;
        point.vy += (this.points[i - 1].y - point.y) * spring;
      }

      point.vx *= friction;
      point.vy *= friction;
      point.x += point.vx;
      point.y += point.vy;
    });

    // Draw
    this.ctx.beginPath();
    this.ctx.moveTo(this.points[0].x, this.points[0].y);

    for (let i = 1; i < this.points.length - 1; i++) {
      const xc = (this.points[i].x + this.points[i + 1].x) / 2;
      const yc = (this.points[i].y + this.points[i + 1].y) / 2;
      this.ctx.quadraticCurveTo(this.points[i].x, this.points[i].y, xc, yc);
    }

    this.ctx.strokeStyle = "rgba(147, 51, 234, 0.3)";
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  start() {
    this.animate();
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}

/**
 * Elastic scale on hover
 */
export const elasticHover = {
  rest: { scale: 1 },
  hover: {
    scale: 1.05,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10,
    },
  },
  tap: {
    scale: 0.95,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10,
    },
  },
};

/**
 * Typewriter effect
 */
export function useTypewriter(text: string, speed: number = 50) {
  const [displayText, setDisplayText] = React.useState("");
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, speed]);

  return displayText;
}

/**
 * Glitch effect
 */
export const glitchAnimation = {
  animate: {
    x: [0, -2, 2, -2, 2, 0],
    y: [0, 2, -2, 2, -2, 0],
    skewX: [0, 2, -2, 2, -2, 0],
    transition: {
      duration: 0.3,
      repeat: Infinity,
      repeatDelay: 5,
    },
  },
};
