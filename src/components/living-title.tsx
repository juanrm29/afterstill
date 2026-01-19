"use client";

interface LivingTitleProps {
  text: string;
  className?: string;
}

export function LivingTitle({ text, className = "" }: LivingTitleProps) {
  return (
    <div className={`relative inline-block ${className}`}>
      {/* Subtle glow layer */}
      <div className="absolute inset-0 pointer-events-none blur-lg opacity-20 animate-pulse">
        <span>{text}</span>
      </div>
      
      {/* Main text with CSS animation */}
      <span className="relative animate-[breathe_4s_ease-in-out_infinite]">
        {text}
      </span>
      
      <style jsx>{`
        @keyframes breathe {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default LivingTitle;
