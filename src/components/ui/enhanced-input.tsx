"use client";

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, ReactNode, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/ui-helpers";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  inputSize?: "sm" | "md" | "lg";
  variant?: "default" | "filled" | "ghost";
}

const inputSizes = {
  sm: "h-9 text-sm px-3",
  md: "h-11 text-base px-4",
  lg: "h-13 text-lg px-5",
};

const inputVariants = {
  default: "bg-zinc-900/50 border-zinc-700/50 focus:border-zinc-500",
  filled: "bg-zinc-800/80 border-transparent focus:border-zinc-600",
  ghost: "bg-transparent border-zinc-800/30 focus:border-zinc-600",
};

export const EnhancedInput = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      inputSize = "md",
      variant = "default",
      className,
      id,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;

    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-zinc-400 mb-2 transition-colors"
          >
            {label}
          </label>
        )}

        {/* Input wrapper */}
        <div className="relative">
          {/* Left icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
              {leftIcon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              // Base
              "w-full rounded-xl border outline-none",
              "transition-all duration-300",
              "placeholder:text-zinc-600",
              "focus:ring-2 focus:ring-zinc-500/20",
              // Size
              inputSizes[inputSize],
              // Variant
              inputVariants[variant],
              // Error state
              error ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20" : "",
              // Icons padding
              leftIcon ? "pl-10" : "",
              rightIcon ? "pr-10" : "",
              // Custom
              className
            )}
            {...props}
          />

          {/* Right icon */}
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
              {rightIcon}
            </div>
          )}

          {/* Focus glow */}
          <AnimatePresence>
            {isFocused && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 -z-10 rounded-xl bg-zinc-500/5 blur-xl"
              />
            )}
          </AnimatePresence>
        </div>

        {/* Error/Hint */}
        <AnimatePresence mode="wait">
          {error ? (
            <motion.p
              key="error"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="mt-2 text-sm text-red-400"
            >
              {error}
            </motion.p>
          ) : hint ? (
            <motion.p
              key="hint"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="mt-2 text-sm text-zinc-500"
            >
              {hint}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    );
  }
);

EnhancedInput.displayName = "EnhancedInput";

// Textarea variant
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  variant?: "default" | "filled" | "ghost";
}

export const EnhancedTextarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      hint,
      variant = "default",
      className,
      id,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const textareaId = id || `textarea-${Math.random().toString(36).slice(2, 9)}`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-zinc-400 mb-2"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <textarea
            ref={ref}
            id={textareaId}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              // Base
              "w-full rounded-xl border outline-none p-4 min-h-30 resize-y",
              "transition-all duration-300",
              "placeholder:text-zinc-600",
              "focus:ring-2 focus:ring-zinc-500/20",
              // Variant
              inputVariants[variant],
              // Error
              error && "border-red-500/50 focus:border-red-500 focus:ring-red-500/20",
              // Custom
              className
            )}
            {...props}
          />

          <AnimatePresence>
            {isFocused && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 -z-10 rounded-xl bg-zinc-500/5 blur-xl"
              />
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          {error ? (
            <motion.p
              key="error"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="mt-2 text-sm text-red-400"
            >
              {error}
            </motion.p>
          ) : hint ? (
            <motion.p
              key="hint"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="mt-2 text-sm text-zinc-500"
            >
              {hint}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    );
  }
);

EnhancedTextarea.displayName = "EnhancedTextarea";
