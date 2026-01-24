"use client";

import { useEffect, useRef, useMemo, memo } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  hue: number;
}

interface MouseTrailProps {
  color?: string;
  particleCount?: number;
  fadeSpeed?: number;
}

/**
 * MouseTrail - Elegant particle trail following cursor
 * Performance optimized with requestAnimationFrame and canvas
 */
export const MouseTrail = memo(function MouseTrail({
  color = "255, 255, 255",
  particleCount = 30,
  fadeSpeed = 0.02,
}: MouseTrailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number>(0);
  const isActiveRef = useRef(false);
  
  useEffect(() => {
    // Skip on touch devices
    if ("ontouchstart" in globalThis) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Set canvas size
    const resize = () => {
      canvas.width = globalThis.innerWidth;
      canvas.height = globalThis.innerHeight;
    };
    resize();
    globalThis.addEventListener("resize", resize);
    
    // Mouse tracking
    const handleMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      isActiveRef.current = true;
      
      // Add new particle
      if (particlesRef.current.length < particleCount) {
        particlesRef.current.push({
          x: e.clientX,
          y: e.clientY,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 2 + 1,
          opacity: 0.6,
          hue: Math.random() * 20 - 10,
        });
      }
    };
    
    const handleLeave = () => {
      isActiveRef.current = false;
    };
    
    globalThis.addEventListener("mousemove", handleMouse);
    document.addEventListener("mouseleave", handleLeave);
    
    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particlesRef.current = particlesRef.current.filter(p => {
        // Update
        p.x += p.vx;
        p.y += p.vy;
        p.opacity -= fadeSpeed;
        p.size *= 0.99;
        
        // Draw
        if (p.opacity > 0) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${color}, ${p.opacity})`;
          ctx.fill();
        }
        
        return p.opacity > 0;
      });
      
      // Add trailing particles towards mouse
      if (isActiveRef.current && particlesRef.current.length < particleCount) {
        const lastP = particlesRef.current.at(-1);
        if (lastP) {
          const dx = mouseRef.current.x - lastP.x;
          const dy = mouseRef.current.y - lastP.y;
          const dist = Math.hypot(dx, dy);
          
          if (dist > 5) {
            particlesRef.current.push({
              x: lastP.x + dx * 0.3,
              y: lastP.y + dy * 0.3,
              vx: (Math.random() - 0.5) * 0.3,
              vy: (Math.random() - 0.5) * 0.3,
              size: Math.random() * 1.5 + 0.5,
              opacity: 0.4,
              hue: Math.random() * 20 - 10,
            });
          }
        }
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      globalThis.removeEventListener("resize", resize);
      globalThis.removeEventListener("mousemove", handleMouse);
      document.removeEventListener("mouseleave", handleLeave);
      cancelAnimationFrame(animationRef.current);
    };
  }, [color, particleCount, fadeSpeed]);
  
  // Don't render on touch devices
  if (globalThis.window !== undefined && "ontouchstart" in globalThis) {
    return null;
  }
  
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-100 cursor-effect"
      style={{ mixBlendMode: "screen" }}
    />
  );
});

interface StarfieldProps {
  starCount?: number;
  speed?: number;
}

/**
 * Starfield - High-performance 3D starfield background
 */
export const Starfield = memo(function Starfield({
  starCount = 200,
  speed = 0.5,
}: StarfieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    let width = window.innerWidth;
    let height = window.innerHeight;
    
    canvas.width = width;
    canvas.height = height;
    
    // Initialize stars
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width - width / 2,
      y: Math.random() * height - height / 2,
      z: Math.random() * 1000,
    }));
    
    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    
    window.addEventListener("resize", resize);
    
    let animationId: number;
    
    const animate = () => {
      ctx.fillStyle = "rgba(3, 3, 4, 0.2)";
      ctx.fillRect(0, 0, width, height);
      
      const cx = width / 2;
      const cy = height / 2;
      
      for (const star of stars) {
        star.z -= speed;
        
        if (star.z <= 0) {
          star.x = Math.random() * width - cx;
          star.y = Math.random() * height - cy;
          star.z = 1000;
        }
        
        const perspective = 400 / star.z;
        const px = star.x * perspective + cx;
        const py = star.y * perspective + cy;
        
        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          const size = Math.max(0.5, (1 - star.z / 1000) * 2);
          const opacity = Math.max(0.1, 1 - star.z / 1000);
          
          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
          ctx.fill();
        }
      }
      
      animationId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, [starCount, speed]);
  
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: -1 }}
    />
  );
});

const DEFAULT_ORB_COLORS = ["rgba(100,100,255,0.03)", "rgba(255,100,100,0.02)", "rgba(100,255,100,0.02)"];

/**
 * FloatingOrbs - Gentle floating ambient orbs
 */
export const FloatingOrbs = memo(function FloatingOrbs({
  count = 5,
  colors = DEFAULT_ORB_COLORS,
}: {
  count?: number;
  colors?: string[];
}) {
  // Memoize orbs to avoid re-creating on every render
  const orbs = useMemo(() => 
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 300 + 200,
      color: colors[i % colors.length],
      duration: Math.random() * 20 + 30,
      delay: Math.random() * -20,
    })),
    // Only regenerate when count changes, colors are stable via DEFAULT_ORB_COLORS
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count]
  );
  
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none floating-particle" style={{ zIndex: -1 }}>
      {orbs.map(orb => (
        <div
          key={orb.id}
          className="absolute rounded-full blur-3xl animate-float"
          style={{
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            width: orb.size,
            height: orb.size,
            background: orb.color,
            animationDuration: `${orb.duration}s`,
            animationDelay: `${orb.delay}s`,
          }}
        />
      ))}
    </div>
  );
});
