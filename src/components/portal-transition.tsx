"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface PortalTransitionProps {
  children: React.ReactNode;
}

// Inject styles once
const injectStyles = () => {
  if (typeof document !== 'undefined' && !document.getElementById('portal-styles')) {
    const style = document.createElement('style');
    style.id = 'portal-styles';
    style.textContent = `
      @keyframes portal-ripple {
        0% { transform: scale(0); opacity: 1; }
        100% { transform: scale(50); opacity: 0; }
      }
      @keyframes portal-zoom {
        0% { transform: scale(1); filter: blur(0px); }
        100% { transform: scale(1.5); filter: blur(20px); }
      }
      @keyframes portal-particles {
        0% { opacity: 0; transform: translateY(0) scale(0); }
        50% { opacity: 1; }
        100% { opacity: 0; transform: translateY(-100px) scale(1); }
      }
      @keyframes portal-text-fade {
        0% { opacity: 0; transform: translateY(20px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      .portal-ripple {
        animation: portal-ripple 1.2s ease-out forwards;
      }
      .portal-zoom {
        animation: portal-zoom 0.8s ease-in forwards;
      }
      .portal-particle {
        animation: portal-particles 1s ease-out forwards;
      }
      .portal-text {
        animation: portal-text-fade 0.5s ease-out forwards;
      }
    `;
    document.head.appendChild(style);
  }
};

interface PortalState {
  isActive: boolean;
  origin: { x: number; y: number };
  destination: string;
  title?: string;
}

// Global portal state
let globalPortalCallback: ((state: PortalState) => void) | null = null;

// Trigger portal from anywhere
export function triggerPortal(destination: string, origin: { x: number; y: number }, title?: string) {
  if (globalPortalCallback) {
    globalPortalCallback({ isActive: true, origin, destination, title });
  }
}

export function PortalTransitionProvider({ children }: PortalTransitionProps) {
  const router = useRouter();
  const [portal, setPortal] = useState<PortalState>({
    isActive: false,
    origin: { x: 50, y: 50 },
    destination: "",
    title: undefined,
  });
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; delay: number }[]>([]);
  
  useEffect(() => {
    injectStyles();
    globalPortalCallback = setPortal;
    return () => {
      globalPortalCallback = null;
    };
  }, []);
  
  // Generate particles when portal activates
  useEffect(() => {
    if (portal.isActive) {
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: portal.origin.x + (Math.random() - 0.5) * 200,
        y: portal.origin.y + (Math.random() - 0.5) * 200,
        delay: Math.random() * 0.3,
      }));
      setParticles(newParticles);
      
      // Navigate after animation then reset
      const timer = setTimeout(() => {
        router.push(portal.destination);
        // Reset portal state after navigation starts
        setTimeout(() => {
          setPortal(prev => ({ ...prev, isActive: false }));
          setParticles([]);
        }, 100);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [portal.isActive, portal.origin, portal.destination, router]);
  
  return (
    <>
      {children}
      
      {/* Portal overlay */}
      {portal.isActive && (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
          {/* Ripple from click point */}
          <div
            className="absolute rounded-full bg-zinc-100 portal-ripple"
            style={{
              left: portal.origin.x,
              top: portal.origin.y,
              width: 20,
              height: 20,
              marginLeft: -10,
              marginTop: -10,
            }}
          />
          
          {/* Dark vignette */}
          <div 
            className="absolute inset-0 bg-zinc-950 transition-opacity duration-700"
            style={{ opacity: 0.9 }}
          />
          
          {/* Particles floating up */}
          {particles.map(p => (
            <div
              key={p.id}
              className="absolute w-1 h-1 rounded-full bg-zinc-400 portal-particle"
              style={{
                left: p.x,
                top: p.y,
                animationDelay: `${p.delay}s`,
              }}
            />
          ))}
          
          {/* Loading indicator */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-1 h-1 rounded-full bg-zinc-500"
                  style={{
                    animation: 'portal-particles 1s ease-out infinite',
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Link component with portal effect
interface PortalLinkProps {
  href: string;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function PortalLink({ href, title, children, className }: PortalLinkProps) {
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    triggerPortal(href, {
      x: e.clientX || rect.left + rect.width / 2,
      y: e.clientY || rect.top + rect.height / 2,
    }, title);
  }, [href, title]);
  
  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}

export default PortalTransitionProvider;
