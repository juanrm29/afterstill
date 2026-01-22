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

  // Canvas ripple animation - lighter version
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
      
      // Draw subtle ripples only
      ripples.forEach(ripple => {
        const age = (now - ripple.startTime) / 1000;
        const maxAge = ripple.size >= 2 ? 3 : 2;
        
        if (age < 0 || age > maxAge) return;
        
        const progress = Math.max(0, Math.min(1, age / maxAge));
        const maxRadius = ripple.size >= 2 ? 200 : 120;
        const radius = Math.max(0.1, progress * maxRadius);
        const opacity = (1 - progress) * (ripple.size >= 2 ? 0.15 : 0.08);
        
        if (opacity <= 0) return;
        
        // Single subtle ring
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(139, 92, 246, ${opacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Inner faint ring
        const innerRadius = radius * 0.6;
        if (innerRadius > 20) {
          ctx.beginPath();
          ctx.arc(ripple.x, ripple.y, innerRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(139, 92, 246, ${opacity * 0.5})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      });

      // Very subtle ambient shimmer
      const waterTime = now / 4000;
      for (let i = 0; i < 5; i++) {
        const sx = (Math.sin(waterTime + i * 1.2) * 0.4 + 0.5) * rect.width;
        const sy = (Math.cos(waterTime * 0.5 + i * 2) * 0.4 + 0.5) * rect.height;
        
        ctx.beginPath();
        ctx.arc(sx, sy, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139, 92, 246, ${0.015 + Math.sin(waterTime + i) * 0.01})`;
        ctx.fill();
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [ripples]);

  // Clean old ripples
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setRipples(prev => prev.filter(r => now - r.startTime < 3000));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Handle mouse move - create ripples only (lighter)
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });
    
    const now = Date.now();
    
    // Throttle ripple creation - less frequent
    if (now - lastRippleTime.current > 200) {
      lastRippleTime.current = now;
      setRipples(prev => [...prev.slice(-15), {
        id: rippleIdRef.current++,
        x,
        y,
        startTime: now,
        size: 0.8,
      }]);
    }
  }, []);

  // Handle click - create subtle ripple
  const handleClick = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Create simple ripples for click
    const now = Date.now();
    setRipples(prev => [
      ...prev.slice(-20),
      { id: rippleIdRef.current++, x, y, startTime: now, size: 2 },
      { id: rippleIdRef.current++, x, y, startTime: now + 100, size: 1.5 },
    ]);
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
  }, [draggingCard, dragOffset]);

  // Drag end - create subtle splash ripple
  const handleDragEnd = useCallback(() => {
    if (!draggingCard) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    const card = floatingCards.find(c => c.id === draggingCard);
    
    if (rect && card) {
      const dropX = (card.x / 100) * rect.width;
      const dropY = (card.y / 100) * rect.height;
      const now = Date.now();
      
      // Create subtle splash ripples
      setRipples(prev => [
        ...prev.slice(-15),
        { id: rippleIdRef.current++, x: dropX, y: dropY, startTime: now, size: 2 },
        { id: rippleIdRef.current++, x: dropX, y: dropY, startTime: now + 100, size: 1.5 },
      ]);
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
    >
      {/* Very subtle water surface hint - almost invisible */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(139, 92, 246, 0.02) 0%, transparent 70%)',
        }}
      />

      {/* Water ripple canvas */}
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Center title */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <h1 
            className="text-3xl sm:text-4xl md:text-5xl font-light tracking-[-0.02em] mb-3"
            style={{ 
              fontFamily: 'var(--font-cormorant), serif',
              color: 'rgba(168, 162, 158, 0.4)',
            }}
          >
            Afterstill
          </h1>
          <p 
            className="text-[10px] sm:text-xs tracking-[0.25em] uppercase"
            style={{ color: 'rgba(120, 113, 108, 0.35)' }}
          >
            Words floating in stillness
          </p>
        </div>
      </div>

      {/* Floating cards */}
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
                height: '30px',
                transform: 'scaleY(-1)',
                opacity: card.isHovered ? 0.1 : 0.05,
                filter: 'blur(4px)',
                maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 100%)',
                transition: 'opacity 0.3s',
              }}
            >
              <div 
                className="px-4 py-3 rounded-lg bg-stone-900/40"
                style={{ minWidth: '120px', maxWidth: '180px' }}
              >
                <span className="text-xs text-stone-400 opacity-40">{card.title}</span>
              </div>
            </div>
            
            {/* Simple card */}
            <div 
              className="relative px-4 py-3 rounded-lg border transition-all duration-300"
              style={{
                minWidth: '120px',
                maxWidth: '180px',
                background: card.isHovered || card.isLifted 
                  ? 'rgba(28, 25, 23, 0.8)'
                  : 'rgba(20, 17, 15, 0.6)',
                borderColor: card.isHovered || card.isLifted 
                  ? 'rgba(139, 92, 246, 0.2)' 
                  : 'rgba(68, 64, 60, 0.15)',
                boxShadow: card.isHovered || card.isLifted
                  ? '0 4px 20px rgba(0, 0, 0, 0.2)'
                  : '0 2px 10px rgba(0, 0, 0, 0.15)',
                transform: isDragging
                  ? 'translateY(-15px) scale(1.05)'
                  : card.isHovered 
                    ? 'translateY(-8px) scale(1.02)' 
                    : 'translateY(0) scale(1)',
              }}
            >
              <h3 
                className="text-sm font-light leading-snug transition-colors duration-300"
                style={{ 
                  fontFamily: 'var(--font-cormorant), serif',
                  color: card.isHovered || card.isLifted ? 'rgba(245, 245, 244, 0.9)' : 'rgba(168, 162, 158, 0.7)',
                }}
              >
                {card.title}
              </h3>
              
              {/* Show excerpt on hover */}
              <div className={`overflow-hidden transition-all duration-300 ${
                card.isHovered && !isDragging ? 'max-h-16 opacity-100 mt-2' : 'max-h-0 opacity-0'
              }`}>
                <p className="text-[10px] text-stone-500/70 line-clamp-2">
                  {card.excerpt}
                </p>
              </div>
            </div>
            
            {/* Click to navigate link */}
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
