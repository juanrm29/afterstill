"use client";

import { useEffect, useRef, useState, useMemo } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  hue: number;
  life: number;
  maxLife: number;
}

interface AmbientParticlesProps {
  count?: number;
  color?: "violet" | "cyan" | "amber" | "neutral";
  intensity?: "subtle" | "medium" | "intense";
  interactive?: boolean;
}

export function AmbientParticles({ 
  count = 50, 
  color = "neutral",
  intensity = "subtle",
  interactive = true 
}: AmbientParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animationRef = useRef<number | undefined>(undefined);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  const colorConfig = useMemo(() => ({
    violet: { base: 270, range: 30, saturation: 60 },
    cyan: { base: 190, range: 20, saturation: 70 },
    amber: { base: 35, range: 15, saturation: 80 },
    neutral: { base: 0, range: 0, saturation: 0 },
  }), []);
  
  const intensityConfig = useMemo(() => ({
    subtle: { maxOpacity: 0.15, speed: 0.3, size: 2 },
    medium: { maxOpacity: 0.25, speed: 0.5, size: 3 },
    intense: { maxOpacity: 0.4, speed: 0.8, size: 4 },
  }), []);
  
  // Initialize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const updateDimensions = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(dpr, dpr);
      
      setDimensions({ width, height });
    };
    
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);
  
  // Create particles
  useEffect(() => {
    if (dimensions.width === 0) return;
    
    const config = colorConfig[color];
    const iConfig = intensityConfig[intensity];
    
    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * dimensions.width,
      y: Math.random() * dimensions.height,
      vx: (Math.random() - 0.5) * iConfig.speed,
      vy: (Math.random() - 0.5) * iConfig.speed,
      size: Math.random() * iConfig.size + 1,
      opacity: Math.random() * iConfig.maxOpacity,
      hue: config.base + (Math.random() - 0.5) * config.range,
      life: Math.random() * 100,
      maxLife: 100 + Math.random() * 100,
    }));
  }, [dimensions, count, color, intensity, colorConfig, intensityConfig]);
  
  // Mouse tracking
  useEffect(() => {
    if (!interactive) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };
    
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [interactive]);
  
  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const config = colorConfig[color];
    const iConfig = intensityConfig[intensity];
    
    const animate = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      
      particlesRef.current.forEach((particle) => {
        // Update life
        particle.life += 0.5;
        if (particle.life > particle.maxLife) {
          particle.life = 0;
          particle.x = Math.random() * dimensions.width;
          particle.y = Math.random() * dimensions.height;
        }
        
        // Calculate life-based opacity
        const lifeRatio = particle.life / particle.maxLife;
        const lifeOpacity = lifeRatio < 0.1 
          ? lifeRatio * 10 
          : lifeRatio > 0.9 
            ? (1 - lifeRatio) * 10 
            : 1;
        
        // Mouse interaction
        if (interactive) {
          const dx = mouseRef.current.x - particle.x;
          const dy = mouseRef.current.y - particle.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 150) {
            const force = (150 - dist) / 150;
            particle.vx -= (dx / dist) * force * 0.02;
            particle.vy -= (dy / dist) * force * 0.02;
          }
        }
        
        // Apply velocity with damping
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vx *= 0.99;
        particle.vy *= 0.99;
        
        // Wrap around edges
        if (particle.x < 0) particle.x = dimensions.width;
        if (particle.x > dimensions.width) particle.x = 0;
        if (particle.y < 0) particle.y = dimensions.height;
        if (particle.y > dimensions.height) particle.y = 0;
        
        // Draw particle
        const finalOpacity = particle.opacity * lifeOpacity;
        
        if (color === "neutral") {
          ctx.fillStyle = `rgba(255, 255, 255, ${finalOpacity})`;
        } else {
          ctx.fillStyle = `hsla(${particle.hue}, ${config.saturation}%, 70%, ${finalOpacity})`;
        }
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw glow for larger particles
        if (particle.size > 2 && finalOpacity > 0.1) {
          const gradient = ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, particle.size * 3
          );
          
          if (color === "neutral") {
            gradient.addColorStop(0, `rgba(255, 255, 255, ${finalOpacity * 0.3})`);
          } else {
            gradient.addColorStop(0, `hsla(${particle.hue}, ${config.saturation}%, 70%, ${finalOpacity * 0.3})`);
          }
          gradient.addColorStop(1, "transparent");
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dimensions, color, intensity, interactive, colorConfig, intensityConfig]);
  
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.8 }}
    />
  );
}
