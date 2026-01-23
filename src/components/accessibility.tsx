"use client";

import { useEffect } from "react";

/**
 * SkipLink - Accessible skip-to-main-content link
 * 
 * Appears on focus for keyboard users to bypass navigation
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="
        fixed left-4 -translate-y-full focus:translate-y-4
        z-[9999] bg-white text-black dark:bg-black dark:text-white
        px-4 py-2 rounded-md font-medium text-sm
        transition-transform duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        shadow-lg
      "
    >
      Skip to main content
    </a>
  );
}

/**
 * Screen reader announcement component
 */
export function ScreenReaderAnnouncement({
  message,
  priority = "polite",
}: {
  message: string;
  priority?: "polite" | "assertive";
}) {
  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}

/**
 * Visually hidden but accessible text
 */
export function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return (
    <span className="sr-only">
      {children}
    </span>
  );
}

/**
 * Focus management hook for modals and dialogs
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  isActive: boolean
) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    const previouslyFocused = document.activeElement as HTMLElement;

    // Focus first element
    firstFocusable?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Tab") return;

      if (event.shiftKey) {
        if (document.activeElement === firstFocusable) {
          event.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          event.preventDefault();
          firstFocusable?.focus();
        }
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        previouslyFocused?.focus();
      }
    }

    container.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keydown", handleEscape);
      previouslyFocused?.focus();
    };
  }, [containerRef, isActive]);
}

/**
 * Keyboard navigation hook for lists
 */
export function useKeyboardNavigation(
  containerRef: React.RefObject<HTMLElement | null>,
  selector: string,
  options: {
    orientation?: "horizontal" | "vertical";
    loop?: boolean;
  } = {}
) {
  const { orientation = "vertical", loop = true } = options;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const items = container.querySelectorAll<HTMLElement>(selector);
    if (items.length === 0) return;

    // Initialize tabindex
    items.forEach((item, index) => {
      item.setAttribute("tabindex", index === 0 ? "0" : "-1");
    });

    function handleKeyDown(event: KeyboardEvent) {
      const items = container!.querySelectorAll<HTMLElement>(selector);
      const currentIndex = Array.from(items).findIndex(
        (item) => item === document.activeElement
      );

      if (currentIndex === -1) return;

      let nextIndex = currentIndex;
      const isVertical = orientation === "vertical";

      switch (event.key) {
        case isVertical ? "ArrowDown" : "ArrowRight":
          event.preventDefault();
          nextIndex = currentIndex + 1;
          break;
        case isVertical ? "ArrowUp" : "ArrowLeft":
          event.preventDefault();
          nextIndex = currentIndex - 1;
          break;
        case "Home":
          event.preventDefault();
          nextIndex = 0;
          break;
        case "End":
          event.preventDefault();
          nextIndex = items.length - 1;
          break;
        default:
          return;
      }

      if (loop) {
        if (nextIndex < 0) nextIndex = items.length - 1;
        if (nextIndex >= items.length) nextIndex = 0;
      } else {
        nextIndex = Math.max(0, Math.min(nextIndex, items.length - 1));
      }

      items[currentIndex].setAttribute("tabindex", "-1");
      items[nextIndex].setAttribute("tabindex", "0");
      items[nextIndex].focus();
    }

    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [containerRef, selector, orientation, loop]);
}

/**
 * Reduced motion preference hook
 */
export function useReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  return mediaQuery.matches;
}

/**
 * Color scheme preference hook
 */
export function useColorScheme(): "light" | "dark" | "no-preference" {
  if (typeof window === "undefined") return "no-preference";
  
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  if (window.matchMedia("(prefers-color-scheme: light)").matches) {
    return "light";
  }
  return "no-preference";
}
