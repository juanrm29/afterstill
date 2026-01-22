"use client";

import { useState, useEffect, useRef, useMemo } from "react";

interface MountainPathProgressProps {
  readonly progress: number; // 0-100
  readonly title: string;
}

// CSS for animations (injected once)
const injectStyles = () => {
  if (typeof document !== 'undefined' && !document.getElementById('mountain-path-styles')) {
    const style = document.createElement('style');
    style.id = 'mountain-path-styles';
    style.textContent = `
      @keyframes mtn-fade-in-up {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .mtn-animate-fade-in-up {
        animation: mtn-fade-in-up 0.5s ease-out forwards;
      }
    `;
    document.head.appendChild(style);
  }
};

export function MountainPathProgress({ progress, title }: MountainPathProgressProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const prevProgressRef = useRef(0);
  
  // Winding path points - abstract journey through text
  const pathPoints = useMemo(() => [
    { x: 15, y: 90, milestone: false },
    { x: 20, y: 80, milestone: false },
    { x: 30, y: 75, milestone: true, label: "beginning" },
    { x: 45, y: 65, milestone: false },
    { x: 40, y: 55, milestone: false },
    { x: 50, y: 48, milestone: true, label: "wandering" },
    { x: 60, y: 40, milestone: false },
    { x: 55, y: 32, milestone: false },
    { x: 65, y: 25, milestone: true, label: "deep" },
    { x: 70, y: 18, milestone: false },
    { x: 75, y: 12, milestone: true, label: "arrived" },
  ], []);
  
  // Calculate total path length and segment lengths
  const pathData = useMemo(() => {
    let totalLength = 0;
    const segments: { start: number; end: number; length: number }[] = [];
    
    for (let i = 0; i < pathPoints.length - 1; i++) {
      const dx = pathPoints[i + 1].x - pathPoints[i].x;
      const dy = pathPoints[i + 1].y - pathPoints[i].y;
      const length = Math.hypot(dx, dy);
      segments.push({
        start: totalLength,
        end: totalLength + length,
        length
      });
      totalLength += length;
    }
    
    return { totalLength, segments };
  }, [pathPoints]);
  
  // Get position on path based on progress (0-100)
  const getPositionOnPath = (prog: number) => {
    const targetDistance = (prog / 100) * pathData.totalLength;
    
    for (let i = 0; i < pathData.segments.length; i++) {
      const seg = pathData.segments[i];
      if (targetDistance <= seg.end) {
        const segProgress = (targetDistance - seg.start) / seg.length;
        const p1 = pathPoints[i];
        const p2 = pathPoints[i + 1];
        return {
          x: p1.x + (p2.x - p1.x) * segProgress,
          y: p1.y + (p2.y - p1.y) * segProgress
        };
      }
    }
    
    const lastPoint = pathPoints.at(-1)!;
    return { x: lastPoint.x, y: lastPoint.y };
  };
  
  // Smooth progress animation
  useEffect(() => {
    injectStyles();
    
    const diff = progress - animatedProgress;
    if (Math.abs(diff) < 0.3) {
      setAnimatedProgress(progress);
      return;
    }
    
    const timer = setTimeout(() => {
      setAnimatedProgress(prev => prev + diff * 0.08);
    }, 16);
    
    return () => clearTimeout(timer);
  }, [progress, animatedProgress]);
  
  // Check for completion
  useEffect(() => {
    if (progress >= 98 && prevProgressRef.current < 98) {
      setShowCompletion(true);
      setTimeout(() => setShowCompletion(false), 4000);
    }
    prevProgressRef.current = progress;
  }, [progress]);
  
  const travelerPos = getPositionOnPath(animatedProgress);
  
  // Generate SVG path string
  const pathString = useMemo(() => {
    return pathPoints
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ');
  }, [pathPoints]);
  
  // Calculate which milestones are reached
  const reachedMilestones = useMemo(() => {
    const reached: number[] = [];
    pathPoints.forEach((point, index) => {
      if (!point.milestone) return;
      
      let distanceToPoint = 0;
      for (let i = 0; i < index; i++) {
        const dx = pathPoints[i + 1].x - pathPoints[i].x;
        const dy = pathPoints[i + 1].y - pathPoints[i].y;
        distanceToPoint += Math.hypot(dx, dy);
      }
      const progressToPoint = (distanceToPoint / pathData.totalLength) * 100;
      
      if (animatedProgress >= progressToPoint) {
        reached.push(index);
      }
    });
    return reached;
  }, [animatedProgress, pathPoints, pathData.totalLength]);

  return (
    <>
      {/* Collapsed mini-view */}
      <button 
        type="button"
        className="fixed bottom-36 sm:bottom-34 right-4 sm:right-6 z-50 cursor-pointer group bg-transparent border-0 p-0"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={`
          relative bg-zinc-950/90 backdrop-blur-md rounded-lg border border-zinc-800/30
          transition-all duration-500 overflow-hidden
          ${isExpanded ? 'w-40 sm:w-44 h-52 sm:h-56 p-2 sm:p-3' : 'w-10 h-10 sm:w-12 sm:h-12 p-1.5 sm:p-2'}
        `}>
          {/* Mini map SVG */}
          <svg 
            viewBox="0 0 100 100" 
            className={`w-full h-full ${isExpanded ? '' : 'opacity-50 group-hover:opacity-80'} transition-opacity`}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Abstract terrain - layered hills */}
            <path
              d="M0,100 Q20,85 40,90 T80,85 T100,95 L100,100 Z"
              fill="#18181b"
              opacity="0.4"
            />
            <path
              d="M0,90 Q30,70 50,75 T90,65 L100,70 L100,100 L0,100 Z"
              fill="#18181b"
              opacity="0.3"
            />
            <path
              d="M0,80 Q25,55 45,60 T85,45 L100,50 L100,100 L0,100 Z"
              fill="#18181b"
              opacity="0.2"
            />
            
            {/* Path trail (dashed, unwalked) */}
            <path
              d={pathString}
              fill="none"
              stroke="#27272a"
              strokeWidth={isExpanded ? "1" : "1.5"}
              strokeDasharray="2,2"
              strokeLinecap="round"
            />
            
            {/* Path trail (solid, walked) */}
            <path
              d={pathString}
              fill="none"
              stroke="#52525b"
              strokeWidth={isExpanded ? "1.5" : "2"}
              strokeLinecap="round"
              strokeDasharray={pathData.totalLength}
              strokeDashoffset={pathData.totalLength * (1 - animatedProgress / 100)}
              style={{ transition: 'stroke-dashoffset 0.3s ease-out' }}
            />
            
            {/* Milestone markers */}
            {pathPoints.map((point) => {
              if (!point.milestone) return null;
              const pointIndex = pathPoints.indexOf(point);
              const isReached = reachedMilestones.includes(pointIndex);
              
              return (
                <g key={point.label || `milestone-${point.x}-${point.y}`}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={isExpanded ? 2 : 2.5}
                    fill={isReached ? "#71717a" : "#27272a"}
                    stroke={isReached ? "#a1a1aa" : "#3f3f46"}
                    strokeWidth="0.5"
                  />
                  
                  {/* Label (only when expanded) */}
                  {isExpanded && (
                    <text
                      x={point.x + 5}
                      y={point.y + 1}
                      fontSize="5"
                      fill={isReached ? "#71717a" : "#3f3f46"}
                      fontFamily="system-ui"
                      letterSpacing="0.05em"
                    >
                      {point.label}
                    </text>
                  )}
                </g>
              );
            })}
            
            {/* Traveler dot - minimal */}
            <circle
              cx={travelerPos.x}
              cy={travelerPos.y}
              r={isExpanded ? 2.5 : 3}
              fill="#a1a1aa"
              opacity="0.9"
            >
              <animate
                attributeName="opacity"
                values="0.6;1;0.6"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
            
            {/* End marker - small dot */}
            <circle
              cx={pathPoints.at(-1)!.x}
              cy={pathPoints.at(-1)!.y}
              r="1.5"
              fill={progress >= 98 ? "#a1a1aa" : "#3f3f46"}
              stroke={progress >= 98 ? "#d4d4d8" : "none"}
              strokeWidth="0.5"
            />
          </svg>
          
          {/* Progress percentage (mini mode) */}
          {!isExpanded && (
            <div className="absolute bottom-0.5 right-1 text-[8px] text-zinc-600 tabular-nums font-mono">
              {Math.round(animatedProgress)}
            </div>
          )}
          
          {/* Expanded info */}
          {isExpanded && (
            <div className="absolute bottom-2 left-3 right-3">
              <div className="text-[9px] text-zinc-600 truncate mb-1 italic">{title}</div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-zinc-500 tabular-nums font-mono">{Math.round(animatedProgress)}%</span>
                <span className="text-[8px] text-zinc-700 tracking-wider">
                  {reachedMilestones.length}/4
                </span>
              </div>
            </div>
          )}
        </div>
      </button>
      
      {/* Top progress bar (minimal) */}
      <div className="fixed top-0 left-0 right-0 z-50 h-px bg-zinc-900/30">
        <div 
          className="h-full bg-zinc-600/50 transition-all duration-300"
          style={{ width: `${animatedProgress}%` }}
        />
      </div>
      
      {/* Completion overlay */}
      {showCompletion && (
        <div className="fixed inset-0 z-60 pointer-events-none flex items-center justify-center">
          <div className="text-center mtn-animate-fade-in-up">
            <p className="text-sm text-zinc-500 font-light tracking-[0.3em] uppercase mb-2">
              words traversed
            </p>
            <p className="text-xs text-zinc-700 italic max-w-xs mx-auto">
              &ldquo;{title}&rdquo;
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default MountainPathProgress;
