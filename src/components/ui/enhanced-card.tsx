"use client";

import { forwardRef, ReactNode } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/ui-helpers";

interface CardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children?: ReactNode;
  variant?: "default" | "elevated" | "glass" | "outline" | "gradient";
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  glow?: boolean;
  interactive?: boolean;
}

const cardVariants = {
  default: "bg-zinc-900/50 border-zinc-800/50",
  elevated: "bg-zinc-900/80 border-zinc-800/60 shadow-xl shadow-black/20",
  glass: "bg-white/5 backdrop-blur-2xl border-white/10",
  outline: "bg-transparent border-zinc-700/50",
  gradient: "bg-gradient-to-br from-zinc-900/80 via-zinc-900/60 to-zinc-800/40 border-zinc-700/30",
};

const paddings = {
  none: "p-0",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export const EnhancedCard = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = "default",
      padding = "md",
      hover = false,
      glow = false,
      interactive = false,
      className,
      ...props
    },
    ref
  ) => {
    const getHoverAnimation = () => {
      if (interactive) return { scale: 1.02, y: -2 };
      if (hover) return { y: -2 };
      return undefined;
    };
    
    return (
      <motion.div
        ref={ref}
        whileHover={getHoverAnimation()}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          // Base
          "relative rounded-2xl border overflow-hidden",
          "transition-all duration-500",
          // Variant
          cardVariants[variant],
          // Padding
          paddings[padding],
          // Hover
          hover && "hover:border-zinc-700/80 hover:shadow-lg hover:shadow-black/10",
          // Interactive
          interactive && "cursor-pointer",
          // Custom
          className
        )}
        {...props}
      >
        {/* Glow effect */}
        {glow && (
          <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-zinc-400/5 via-transparent to-zinc-400/5 pointer-events-none" />
        )}
        
        {/* Shine effect on hover */}
        {(hover || interactive) && (
          <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-700">
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000" />
          </div>
        )}
        
        {/* Content */}
        <div className="relative z-10">{children}</div>
      </motion.div>
    );
  }
);

EnhancedCard.displayName = "EnhancedCard";

// Card Header
interface CardHeaderProps {
  readonly title?: string;
  readonly subtitle?: string;
  readonly action?: ReactNode;
  readonly className?: string;
  readonly children?: ReactNode;
}

export function CardHeader({ title, subtitle, action, className, children }: CardHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between mb-4", className)}>
      <div>
        {title && (
          <h3 className="text-lg font-medium text-zinc-100 mb-1" style={{ fontFamily: "var(--font-cormorant)" }}>
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="text-sm text-zinc-500">{subtitle}</p>
        )}
        {children}
      </div>
      {action && <div className="shrink-0 ml-4">{action}</div>}
    </div>
  );
}

// Card Content
export function CardContent({ className, children }: { readonly className?: string; readonly children?: ReactNode }) {
  return (
    <div className={cn("", className)}>
      {children}
    </div>
  );
}

// Card Footer
export function CardFooter({ className, children }: { readonly className?: string; readonly children?: ReactNode }) {
  return (
    <div className={cn("mt-6 pt-4 border-t border-zinc-800/50 flex items-center justify-between", className)}>
      {children}
    </div>
  );
}
