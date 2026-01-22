'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';

interface Writing {
  id: string;
  title: string;
  excerpt?: string;
  tags: string[];
}

interface Ripple {
  id: number;
  x: number;
  y: number;
  startTime: number;
  size: number; // 1 = normal, 2 = big (click)
}

interface InkTrail {
  id: number;
  x: number;
  y: number;
  startTime: number;
}

interface FloatingCard {
  id: string;
  title: string;
  excerpt?: string;
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  rotation: number;
  floatOffset: number;
  floatSpeed: number;
  delay: number;
  isHovered: boolean;
  isLifted: boolean;
  isDragging: boolean;
}

interface Props {
  writings: Writing[];
  onSelectWriting?: (id: string) => void;
}

export function InkPool({ writings, onSelectWriting }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [inkTrails, setInkTrails] = useState<InkTrail[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [floatingCards, setFloatingCards] = useState<FloatingCard[]>([]);
  const [time, setTime] = useState(0);
  const [draggingCard, setDraggingCard] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const rippleIdRef = useRef(0);
  const trailIdRef = useRef(0);
  const animationRef = useRef<number>(0);
  const lastRippleTime = useRef(0);
  const lastTrailTime = useRef(0);

  // Time ticker for animations
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(t => t + 1);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Initialize floating cards with positions
  useEffect(() => {
    if (writings.length === 0) return;
    
    const cards: FloatingCard[] = writings.slice(0, 8).map((w, i) => {
      const angle = (i / Math.min(writings.length, 8)) * Math.PI * 2;
      const radius = 25 + Math.random() * 15;
      const baseX = 50 + Math.cos(angle) * radius;
      const baseY = 50 + Math.sin(angle) * radius;
      return {
        id: w.id,
        title: w.title,
        excerpt: w.excerpt,
        x: baseX,
        y: baseY,
        baseX,
        baseY,
        rotation: -3 + Math.random() * 6,
        floatOffset: Math.random() * Math.PI * 2,
        floatSpeed: 0.8 + Math.random() * 0.4,
        delay: i * 0.15,
        isHovered: false,
        isLifted: false,
        isDragging: false,
      };
    });
    setFloatingCards(cards);
  }, [writings]);

  // Canvas ripple animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    
    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      
      const now = Date.now();
      
      // Draw ink trails first (behind ripples)
      inkTrails.forEach(trail => {
        const age = (now - trail.startTime) / 1000;
        const maxAge = 2;
        
        if (age > maxAge) return;
        
        const progress = age / maxAge;
        const opacity = (1 - progress) * 0.15;
        const size = 8 + progress * 20;
        
        // Ink blob effect
        ctx.beginPath();
        ctx.arc(trail.x, trail.y, size, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(trail.x, trail.y, 0, trail.x, trail.y, size);
        gradient.addColorStop(0, `rgba(80, 60, 120, ${opacity})`);
        gradient.addColorStop(0.5, `rgba(60, 40, 100, ${opacity * 0.5})`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fill();
      });
      
      // Draw ripples
      ripples.forEach(ripple => {
        const age = (now - ripple.startTime) / 1000;
        const maxAge = ripple.size === 2 ? 4 : 3;
        
        if (age > maxAge) return;
        
        const progress = age / maxAge;
        const maxRadius = ripple.size === 2 ? 300 : 180;
        const radius = progress * maxRadius;
        const opacity = (1 - progress) * (ripple.size === 2 ? 0.4 : 0.25);
        
        // Multiple concentric rings with varying thickness
        for (let i = 0; i < 4; i++) {
          const ringRadius = radius - i * (ripple.size === 2 ? 20 : 12);
          if (ringRadius < 0) continue;
          
          ctx.beginPath();
          ctx.arc(ripple.x, ripple.y, ringRadius, 0, Math.PI * 2);
          
          // Color varies - violet to indigo
          const hue = 270 - i * 10;
          ctx.strokeStyle = `hsla(${hue}, 60%, 60%, ${opacity * (1 - i * 0.2)})`;
          ctx.lineWidth = (2 - i * 0.3) * ripple.size;
          ctx.stroke();
        }
        
        // Inner glow for click ripples
        if (ripple.size === 2 && progress < 0.3) {
          const innerGradient = ctx.createRadialGradient(ripple.x, ripple.y, 0, ripple.x, ripple.y, 50);
          innerGradient.addColorStop(0, `rgba(139, 92, 246, ${0.2 * (1 - progress / 0.3)})`);
          innerGradient.addColorStop(1, 'transparent');
          ctx.fillStyle = innerGradient;
          ctx.fill();
        }
      });

      // Draw subtle moonlight reflection
      const moonX = rect.width * 0.8;
      const moonY = rect.height * 0.15;
      const gradient = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 180);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.04)');
      gradient.addColorStop(0.3, 'rgba(200, 200, 255, 0.02)');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, rect.width, rect.height);

      // Ambient water movement
      const waterTime = now / 3000;
      for (let i = 0; i < 8; i++) {
        const sx = (Math.sin(waterTime + i * 0.8) * 0.4 + 0.5) * rect.width;
        const sy = (Math.cos(waterTime * 0.6 + i * 1.5) * 0.4 + 0.5) * rect.height;
        const size = 3 + Math.sin(waterTime * 2 + i) * 2;
        
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139, 92, 246, ${0.03 + Math.sin(waterTime + i) * 0.015})`;
        ctx.fill();
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [ripples, inkTrails]);

  // Clean old ripples and trails
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setRipples(prev => prev.filter(r => now - r.startTime < 4000));
      setInkTrails(prev => prev.filter(t => now - t.startTime < 2000));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Handle mouse move - create ripples and ink trails
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });
    
    const now = Date.now();
    
    // Throttle ripple creation
    if (now - lastRippleTime.current > 120) {
      lastRippleTime.current = now;
      setRipples(prev => [...prev, {
        id: rippleIdRef.current++,
        x,
        y,
        startTime: now,
        size: 1,
      }]);
    }
    
    // Ink trail - more frequent
    if (now - lastTrailTime.current > 60) {
      lastTrailTime.current = now;
      setInkTrails(prev => [...prev.slice(-20), {
        id: trailIdRef.current++,
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        startTime: now,
      }]);
    }
  }, []);

  // Handle click - create bigger ripple burst
  const handleClick = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Create multiple ripples for click with big size
    const now = Date.now();
    setRipples(prev => [
      ...prev,
      { id: rippleIdRef.current++, x, y, startTime: now, size: 2 },
      { id: rippleIdRef.current++, x, y, startTime: now + 150, size: 1.5 },
      { id: rippleIdRef.current++, x, y, startTime: now + 300, size: 1 },
    ]);
    
    // Ink splash
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const dist = 20 + Math.random() * 30;
      setInkTrails(prev => [...prev, {
        id: trailIdRef.current++,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        startTime: now + i * 50,
      }]);
    }
  }, []);

  // Handle card hover
  const handleCardHover = useCallback((id: string, isHovered: boolean) => {
    if (draggingCard) return; // Don't hover while dragging
    setFloatingCards(prev => prev.map(card => 
      card.id === id ? { ...card, isHovered } : card
    ));
  }, [draggingCard]);

  // Handle card click - lift from water
  const handleCardClick = useCallback((id: string) => {
    if (draggingCard) return;
    setFloatingCards(prev => prev.map(card => 
      card.id === id ? { ...card, isLifted: true } : { ...card, isLifted: false }
    ));
    onSelectWriting?.(id);
  }, [onSelectWriting, draggingCard]);

  // Drag start
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const card = floatingCards.find(c => c.id === id);
    if (!card) return;
    
    const cardX = (card.x / 100) * rect.width;
    const cardY = (card.y / 100) * rect.height;
    
    setDragOffset({
      x: clientX - rect.left - cardX,
      y: clientY - rect.top - cardY,
    });
    
    setDraggingCard(id);
    setFloatingCards(prev => prev.map(c => 
      c.id === id ? { ...c, isDragging: true, isLifted: true } : c
    ));
  }, [floatingCards]);

  // Drag move
  const handleDragMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!draggingCard) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const x = ((clientX - rect.left - dragOffset.x) / rect.width) * 100;
    const y = ((clientY - rect.top - dragOffset.y) / rect.height) * 100;
    
    // Clamp within bounds
    const clampedX = Math.max(10, Math.min(90, x));
    const clampedY = Math.max(10, Math.min(90, y));
    
    setFloatingCards(prev => prev.map(card => 
      card.id === draggingCard ? { ...card, x: clampedX, y: clampedY } : card
    ));
    
    // Create trail while dragging
    const now = Date.now();
    if (now - lastTrailTime.current > 30) {
      lastTrailTime.current = now;
      setInkTrails(prev => [...prev.slice(-30), {
        id: trailIdRef.current++,
        x: clientX - rect.left,
        y: clientY - rect.top,
        startTime: now,
      }]);
    }
  }, [draggingCard, dragOffset]);

  // Drag end - create splash ripple
  const handleDragEnd = useCallback(() => {
    if (!draggingCard) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    const card = floatingCards.find(c => c.id === draggingCard);
    
    if (rect && card) {
      const dropX = (card.x / 100) * rect.width;
      const dropY = (card.y / 100) * rect.height;
      const now = Date.now();
      
      // Create big splash ripples
      setRipples(prev => [
        ...prev,
        { id: rippleIdRef.current++, x: dropX, y: dropY, startTime: now, size: 2.5 },
        { id: rippleIdRef.current++, x: dropX, y: dropY, startTime: now + 80, size: 2 },
        { id: rippleIdRef.current++, x: dropX, y: dropY, startTime: now + 160, size: 1.5 },
        { id: rippleIdRef.current++, x: dropX, y: dropY, startTime: now + 240, size: 1 },
      ]);
      
      // Create ink splash burst
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const dist = 30 + Math.random() * 50;
        setInkTrails(prev => [...prev, {
          id: trailIdRef.current++,
          x: dropX + Math.cos(angle) * dist,
          y: dropY + Math.sin(angle) * dist,
          startTime: now + i * 30,
        }]);
      }
    }
    
    // Update card state - keep new position
    setFloatingCards(prev => prev.map(c => 
      c.id === draggingCard 
        ? { ...c, isDragging: false, isLifted: false, baseX: c.x, baseY: c.y } 
        : c
    ));
    
    setDraggingCard(null);
  }, [draggingCard, floatingCards]);

  // Calculate floating animation
  const getFloatY = (card: FloatingCard) => {
    if (card.isDragging) return 0;
    const floatAmount = Math.sin((time * 0.1 * card.floatSpeed) + card.floatOffset) * 1.5;
    return card.isHovered || card.isLifted ? 0 : floatAmount;
  };

  const getFloatRotation = (card: FloatingCard) => {
    if (card.isDragging) return 0;
    const rotateAmount = Math.sin((time * 0.08 * card.floatSpeed) + card.floatOffset + 1) * 1;
    return card.isHovered ? 0 : card.rotation + rotateAmount;
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[70vh] min-h-[500px] overflow-hidden rounded-2xl select-none"
      onMouseMove={(e) => {
        handleMouseMove(e);
        handleDragMove(e);
      }}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      onTouchMove={handleDragMove}
      onTouchEnd={handleDragEnd}
      onClick={handleClick}
      style={{
        background: `
          radial-gradient(ellipse at 80% 15%, rgba(40, 35, 60, 0.6) 0%, transparent 40%),
          radial-gradient(ellipse at 20% 80%, rgba(25, 20, 50, 0.5) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 100%, rgba(20, 15, 40, 0.8) 0%, transparent 60%),
          linear-gradient(to bottom, #08080d 0%, #050509 50%, #030306 100%)
        `,
      }}
    >
      {/* Deep water gradient overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 50% 80%, rgba(60, 40, 100, 0.1) 0%, transparent 50%),
            linear-gradient(to bottom, transparent 0%, rgba(20, 15, 40, 0.3) 100%)
          `,
        }}
      />

      {/* Water surface canvas */}
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
      
      {/* Animated surface texture */}
      <div 
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.02' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          animation: 'surfaceShift 20s ease-in-out infinite',
        }}
      />

      {/* Center title - submerged in water */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div 
          className="text-center"
          style={{
            filter: 'blur(0.3px)',
            animation: 'titleFloat 6s ease-in-out infinite',
          }}
        >
          <h1 
            className="text-4xl sm:text-5xl md:text-6xl font-light tracking-[-0.02em] mb-4"
            style={{ 
              fontFamily: 'var(--font-cormorant), serif',
              background: 'linear-gradient(to bottom, rgba(214, 211, 209, 0.7), rgba(168, 162, 158, 0.4))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 2px 20px rgba(139, 92, 246, 0.1)',
            }}
          >
            Afterstill
          </h1>
          <p 
            className="text-xs sm:text-sm tracking-[0.3em] uppercase"
            style={{
              color: 'rgba(120, 113, 108, 0.5)',
            }}
          >
            Words floating in stillness
          </p>
        </div>
      </div>

      {/* Floating cards with water integration */}
      {floatingCards.map((card) => {
        const floatY = getFloatY(card);
        const floatRotation = getFloatRotation(card);
        const isDragging = card.isDragging;
        
        return (
          <div
            key={card.id}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 group ${
              isDragging ? 'cursor-grabbing z-50' : 'cursor-grab'
            }`}
            style={{
              left: `${card.x}%`,
              top: `${card.y + floatY}%`,
              transform: `translate(-50%, -50%) rotate(${floatRotation}deg) ${isDragging ? 'scale(1.1)' : ''}`,
              transition: isDragging 
                ? 'none' 
                : card.isHovered || card.isLifted 
                  ? 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), top 0.4s cubic-bezier(0.4, 0, 0.2, 1), left 0.4s cubic-bezier(0.4, 0, 0.2, 1)' 
                  : 'transform 0.1s ease-out, top 0.1s ease-out',
              animationDelay: `${card.delay}s`,
              zIndex: isDragging ? 50 : card.isHovered || card.isLifted ? 30 : 10,
            }}
            onMouseDown={(e) => handleDragStart(e, card.id)}
            onTouchStart={(e) => handleDragStart(e, card.id)}
            onMouseEnter={() => handleCardHover(card.id, true)}
            onMouseLeave={() => handleCardHover(card.id, false)}
          >
            {/* Water reflection beneath card */}
            <div 
              className="absolute left-0 right-0 pointer-events-none overflow-hidden"
              style={{
                top: '100%',
                height: '60px',
                transform: 'scaleY(-1)',
                opacity: isDragging ? 0 : card.isLifted ? 0.08 : 0.15,
                filter: `blur(${card.isLifted ? 8 : 4}px)`,
                maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)',
                transition: 'opacity 0.5s, filter 0.5s',
              }}
            >
              <div 
                className="px-5 py-4 rounded-lg bg-stone-900/60 border border-stone-800/30"
                style={{
                  minWidth: '140px',
                  maxWidth: '200px',
                }}
              >
                <span className="text-sm text-stone-400 opacity-60">{card.title}</span>
              </div>
            </div>
            
            {/* Drag glow effect */}
            {isDragging && (
              <div 
                className="absolute -inset-6 rounded-2xl pointer-events-none animate-pulse"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.3), transparent 70%)',
                  filter: 'blur(10px)',
                }}
              />
            )}
            
            {/* Water ripple ring around card on hover */}
            <div 
              className={`absolute -inset-4 rounded-full pointer-events-none transition-all duration-700 ${
                card.isHovered && !isDragging ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
              }`}
              style={{
                border: '1px solid rgba(139, 92, 246, 0.2)',
                boxShadow: '0 0 20px rgba(139, 92, 246, 0.1)',
              }}
            />
            
            {/* Card with water-submerged effect */}
            <div 
              className={`
                relative px-5 py-4 rounded-lg border backdrop-blur-sm
                transition-all duration-500
              `}
              style={{
                minWidth: '140px',
                maxWidth: '200px',
                background: card.isHovered || card.isLifted 
                  ? 'linear-gradient(to bottom, rgba(41, 37, 36, 0.85), rgba(28, 25, 23, 0.9))'
                  : 'linear-gradient(to bottom, rgba(28, 25, 23, 0.6), rgba(20, 17, 15, 0.7))',
                borderColor: card.isHovered || card.isLifted 
                  ? 'rgba(139, 92, 246, 0.3)' 
                  : 'rgba(68, 64, 60, 0.25)',
                boxShadow: isDragging
                  ? '0 20px 60px rgba(139, 92, 246, 0.3), 0 0 80px rgba(139, 92, 246, 0.15)'
                  : card.isHovered || card.isLifted
                    ? '0 8px 32px rgba(139, 92, 246, 0.15), 0 0 60px rgba(139, 92, 246, 0.05), inset 0 1px 0 rgba(255,255,255,0.05)'
                    : '0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.02)',
                transform: isDragging
                  ? 'translateY(-30px) scale(1.08)'
                  : card.isLifted 
                    ? 'translateY(-25px) scale(1.05)' 
                    : card.isHovered 
                      ? 'translateY(-12px) scale(1.02)' 
                      : 'translateY(0) scale(1)',
              }}
            >
              {/* Surface light reflection on card */}
              <div 
                className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 50%, rgba(139, 92, 246, 0.02) 100%)',
                }}
              />
              
              {/* Glow effect */}
              {(card.isHovered || card.isLifted || isDragging) && (
                <div 
                  className="absolute -inset-2 rounded-xl -z-10"
                  style={{
                    background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.15), transparent 70%)',
                    filter: 'blur(15px)',
                  }}
                />
              )}
              
              <h3 
                className="text-sm font-light leading-snug transition-colors duration-300 relative z-10"
                style={{ 
                  fontFamily: 'var(--font-cormorant), serif',
                  color: card.isHovered || card.isLifted || isDragging ? 'rgba(245, 245, 244, 0.95)' : 'rgba(168, 162, 158, 0.8)',
                }}
              >
                {card.title}
              </h3>
              
              {/* Show excerpt on hover - hide while dragging */}
              <div className={`overflow-hidden transition-all duration-500 ${
                card.isHovered && !isDragging ? 'max-h-20 opacity-100 mt-2' : 'max-h-0 opacity-0'
              }`}>
                <p className="text-[10px] text-stone-500/80 line-clamp-2">
                  {card.excerpt}
                </p>
              </div>

              {/* Water drip effect when lifted or dragging */}
              {(card.isLifted || isDragging) && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                  {[0, 1, 2].map(i => (
                    <div 
                      key={i}
                      className="w-1 h-1 rounded-full bg-violet-400/50"
                      style={{
                        animation: `waterDrip 0.8s ease-in ${i * 0.15}s forwards infinite`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
            
            {/* Click to navigate link - only show when not dragging */}
            {!isDragging && (
              <Link 
                href={`/reading/${card.id}`}
                className="absolute inset-0 z-20"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardClick(card.id);
                }}
              />
            )}
          </div>
        );
      })}

      {/* Instruction hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
        <p className="text-[10px] text-stone-600/60 tracking-widest">
          drag to move • click to read
        </p>
      </div>

      {/* Mouse follower glow - more integrated */}
      <div 
        className="absolute pointer-events-none"
        style={{
          left: mousePos.x,
          top: mousePos.y,
          transform: 'translate(-50%, -50%)',
          width: '150px',
          height: '150px',
          background: `
            radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, rgba(139, 92, 246, 0.04) 40%, transparent 70%)
          `,
          transition: 'left 0.08s ease-out, top 0.08s ease-out',
          filter: 'blur(2px)',
        }}
      />

      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes waterDrip {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          50% { transform: translateY(15px) scale(0.8); opacity: 0.6; }
          100% { transform: translateY(30px) scale(0.3); opacity: 0; }
        }
        
        @keyframes titleFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        
        @keyframes surfaceShift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(-1%, 1%) scale(1.02); }
          50% { transform: translate(1%, -1%) scale(1); }
          75% { transform: translate(-0.5%, -0.5%) scale(1.01); }
        }
      `}</style>
    </div>
  );
}

export default InkPool;
