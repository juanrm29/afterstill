"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/ui-helpers";

// Badge Component
interface BadgeProps {
  readonly variant?: "default" | "success" | "warning" | "error" | "info" | "ghost";
  readonly size?: "sm" | "md" | "lg";
  readonly dot?: boolean;
  readonly pulse?: boolean;
  readonly className?: string;
  readonly children?: ReactNode;
}

const badgeVariants = {
  default: "bg-zinc-800 text-zinc-300 border-zinc-700",
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  error: "bg-red-500/10 text-red-400 border-red-500/30",
  info: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  ghost: "bg-transparent text-zinc-400 border-zinc-700/50",
};

const badgeSizes = {
  sm: "text-[10px] px-2 py-0.5",
  md: "text-xs px-2.5 py-1",
  lg: "text-sm px-3 py-1.5",
};

export function Badge({
  variant = "default",
  size = "md",
  dot,
  pulse,
  className,
  children,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        badgeVariants[variant],
        badgeSizes[size],
        className
      )}
    >
      {dot && (
        <span className={cn(
          "w-1.5 h-1.5 rounded-full",
          variant === "success" && "bg-emerald-400",
          variant === "warning" && "bg-amber-400",
          variant === "error" && "bg-red-400",
          variant === "info" && "bg-blue-400",
          variant === "default" && "bg-zinc-400",
          variant === "ghost" && "bg-zinc-500",
          pulse && "animate-pulse"
        )} />
      )}
      {children}
    </span>
  );
}

// Tooltip Component
interface TooltipProps {
  readonly content: ReactNode;
  readonly children: ReactNode;
  readonly position?: "top" | "bottom" | "left" | "right";
  readonly delay?: number;
}

export function Tooltip({
  content,
  children,
  position = "top",
  delay = 200,
}: TooltipProps) {
  const positions = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div className="relative group">
      {children}
      <div
        className={cn(
          "absolute z-50 px-3 py-2 text-xs text-zinc-200 bg-zinc-900 border border-zinc-800 rounded-lg",
          "opacity-0 invisible group-hover:opacity-100 group-hover:visible",
          "transition-all duration-200 whitespace-nowrap shadow-xl",
          positions[position]
        )}
        style={{ transitionDelay: `${delay}ms` }}
      >
        {content}
        {/* Arrow */}
        <div
          className={cn(
            "absolute w-2 h-2 bg-zinc-900 border-zinc-800 rotate-45",
            position === "top" && "-bottom-1.25 left-1/2 -translate-x-1/2 border-r border-b",
            position === "bottom" && "-top-1.25 left-1/2 -translate-x-1/2 border-l border-t",
            position === "left" && "-right-1.25 top-1/2 -translate-y-1/2 border-t border-r",
            position === "right" && "-left-1.25 top-1/2 -translate-y-1/2 border-b border-l"
          )}
        />
      </div>
    </div>
  );
}

// Avatar Component
interface AvatarProps {
  readonly src?: string;
  readonly alt?: string;
  readonly fallback?: string;
  readonly size?: "sm" | "md" | "lg" | "xl";
  readonly status?: "online" | "offline" | "away" | "busy";
  readonly className?: string;
}

const avatarSizes = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-base",
  xl: "w-20 h-20 text-lg",
};

const statusColors = {
  online: "bg-emerald-500",
  offline: "bg-zinc-500",
  away: "bg-amber-500",
  busy: "bg-red-500",
};

export function Avatar({
  src,
  alt = "",
  fallback,
  size = "md",
  status,
  className,
}: AvatarProps) {
  const initials = fallback || alt.charAt(0).toUpperCase() || "?";

  return (
    <div className={cn("relative inline-flex", className)}>
      <div
        className={cn(
          "rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-700/50",
          avatarSizes[size]
        )}
      >
        {src ? (
          <img src={src} alt={alt} className="w-full h-full object-cover" />
        ) : (
          <span className="font-medium text-zinc-400">{initials}</span>
        )}
      </div>
      {status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-zinc-950",
            statusColors[status]
          )}
        />
      )}
    </div>
  );
}

// Divider Component
interface DividerProps {
  readonly orientation?: "horizontal" | "vertical";
  readonly label?: string;
  readonly className?: string;
}

export function Divider({ orientation = "horizontal", label, className }: DividerProps) {
  if (orientation === "vertical") {
    return <div className={cn("w-px h-full bg-zinc-800", className)} />;
  }

  return (
    <div className={cn("flex items-center gap-4 w-full", className)}>
      <div className="flex-1 h-px bg-zinc-800" />
      {label && (
        <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
          {label}
        </span>
      )}
      <div className="flex-1 h-px bg-zinc-800" />
    </div>
  );
}

// Progress Component
interface ProgressProps {
  readonly value: number;
  readonly max?: number;
  readonly size?: "sm" | "md" | "lg";
  readonly variant?: "default" | "gradient" | "success" | "warning" | "error";
  readonly showValue?: boolean;
  readonly animated?: boolean;
  readonly className?: string;
}

const progressSizes = {
  sm: "h-1",
  md: "h-2",
  lg: "h-3",
};

const progressVariants = {
  default: "bg-zinc-400",
  gradient: "bg-gradient-to-r from-zinc-500 via-zinc-300 to-zinc-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  error: "bg-red-500",
};

export function Progress({
  value,
  max = 100,
  size = "md",
  variant = "default",
  showValue = false,
  animated = false,
  className,
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn("w-full", className)}>
      <div className={cn("w-full bg-zinc-800 rounded-full overflow-hidden", progressSizes[size])}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={cn(
            "h-full rounded-full",
            progressVariants[variant],
            animated && "animate-pulse"
          )}
        />
      </div>
      {showValue && (
        <p className="mt-1 text-xs text-zinc-500 text-right">{Math.round(percentage)}%</p>
      )}
    </div>
  );
}

// Skeleton Component
interface SkeletonProps {
  readonly variant?: "text" | "circular" | "rectangular";
  readonly width?: string | number;
  readonly height?: string | number;
  readonly className?: string;
}

export function Skeleton({ variant = "rectangular", width, height, className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-zinc-800/50",
        variant === "circular" && "rounded-full",
        variant === "text" && "rounded h-4",
        variant === "rectangular" && "rounded-lg",
        className
      )}
      style={{ width, height }}
    />
  );
}

// Empty State Component
interface EmptyStateProps {
  readonly icon?: ReactNode;
  readonly title: string;
  readonly description?: string;
  readonly action?: ReactNode;
  readonly className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      {icon && (
        <div className="mb-4 p-4 rounded-full bg-zinc-800/50 text-zinc-500">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-zinc-200 mb-2" style={{ fontFamily: "var(--font-cormorant)" }}>
        {title}
      </h3>
      {description && (
        <p className="text-sm text-zinc-500 max-w-sm mb-6">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
