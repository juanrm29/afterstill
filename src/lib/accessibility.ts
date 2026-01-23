/**
 * Accessibility utilities for Afterstill
 * 
 * Provides WCAG 2.1 AA compliant accessibility enhancements
 */

/**
 * Skip to main content link component styles
 */
export const skipLinkStyles = `
  .skip-link {
    position: absolute;
    top: -40px;
    left: 0;
    background: #000;
    color: white;
    padding: 8px 16px;
    z-index: 9999;
    text-decoration: none;
    font-size: 14px;
    border-radius: 0 0 4px 0;
  }

  .skip-link:focus {
    top: 0;
    outline: 2px solid #fff;
    outline-offset: 2px;
  }
`;

/**
 * Announce content to screen readers
 */
export function announceToScreenReader(
  message: string,
  priority: "polite" | "assertive" = "polite"
): void {
  if (typeof document === "undefined") return;

  const announcer = document.createElement("div");
  announcer.setAttribute("role", "status");
  announcer.setAttribute("aria-live", priority);
  announcer.setAttribute("aria-atomic", "true");
  announcer.className = "sr-only";
  announcer.style.cssText = `
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  `;

  document.body.appendChild(announcer);

  // Delay to ensure the element is in the DOM before announcing
  setTimeout(() => {
    announcer.textContent = message;
  }, 100);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcer);
  }, 1000);
}

/**
 * Focus trap for modals and dialogs
 */
export function createFocusTrap(container: HTMLElement): {
  activate: () => void;
  deactivate: () => void;
} {
  const focusableElements = container.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  let previouslyFocused: HTMLElement | null = null;

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

  return {
    activate() {
      previouslyFocused = document.activeElement as HTMLElement;
      container.addEventListener("keydown", handleKeyDown);
      firstFocusable?.focus();
    },
    deactivate() {
      container.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    },
  };
}

/**
 * Manage keyboard navigation for lists/grids
 */
export function createRovingTabIndex(
  container: HTMLElement,
  selector: string,
  options: {
    orientation?: "horizontal" | "vertical" | "both";
    loop?: boolean;
  } = {}
): () => void {
  const { orientation = "vertical", loop = true } = options;
  const items = container.querySelectorAll<HTMLElement>(selector);

  if (items.length === 0) return () => {};

  // Initialize: first item is focusable, rest are not
  items.forEach((item, index) => {
    item.setAttribute("tabindex", index === 0 ? "0" : "-1");
  });

  function handleKeyDown(event: KeyboardEvent) {
    const currentIndex = Array.from(items).findIndex(
      (item) => item === document.activeElement
    );

    if (currentIndex === -1) return;

    let nextIndex = currentIndex;
    const isVertical = orientation === "vertical" || orientation === "both";
    const isHorizontal = orientation === "horizontal" || orientation === "both";

    switch (event.key) {
      case "ArrowDown":
        if (isVertical) {
          event.preventDefault();
          nextIndex = currentIndex + 1;
        }
        break;
      case "ArrowUp":
        if (isVertical) {
          event.preventDefault();
          nextIndex = currentIndex - 1;
        }
        break;
      case "ArrowRight":
        if (isHorizontal) {
          event.preventDefault();
          nextIndex = currentIndex + 1;
        }
        break;
      case "ArrowLeft":
        if (isHorizontal) {
          event.preventDefault();
          nextIndex = currentIndex - 1;
        }
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

    // Handle looping
    if (loop) {
      if (nextIndex < 0) nextIndex = items.length - 1;
      if (nextIndex >= items.length) nextIndex = 0;
    } else {
      nextIndex = Math.max(0, Math.min(nextIndex, items.length - 1));
    }

    // Update tabindex and focus
    items[currentIndex].setAttribute("tabindex", "-1");
    items[nextIndex].setAttribute("tabindex", "0");
    items[nextIndex].focus();
  }

  container.addEventListener("keydown", handleKeyDown);

  return () => {
    container.removeEventListener("keydown", handleKeyDown);
  };
}

/**
 * Detect user's motion preference
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Detect user's color scheme preference
 */
export function prefersColorScheme(): "light" | "dark" | "no-preference" {
  if (typeof window === "undefined") return "no-preference";
  
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  if (window.matchMedia("(prefers-color-scheme: light)").matches) {
    return "light";
  }
  return "no-preference";
}

/**
 * Check if high contrast mode is enabled
 */
export function prefersHighContrast(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-contrast: more)").matches;
}

/**
 * Generate unique IDs for form elements
 */
let idCounter = 0;
export function generateId(prefix = "a11y"): string {
  return `${prefix}-${++idCounter}`;
}

/**
 * ARIA live region for dynamic content
 */
export function createLiveRegion(
  ariaLive: "polite" | "assertive" = "polite"
): HTMLElement {
  const region = document.createElement("div");
  region.setAttribute("aria-live", ariaLive);
  region.setAttribute("aria-atomic", "true");
  region.setAttribute("role", "status");
  region.className = "sr-only";
  region.style.cssText = `
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  `;
  document.body.appendChild(region);
  return region;
}

/**
 * Color contrast checker (WCAG 2.1)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const luminance1 = getLuminance(color1);
  const luminance2 = getLuminance(color2);
  
  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

function getLuminance(color: string): number {
  const rgb = hexToRgb(color);
  if (!rgb) return 0;

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Check if contrast meets WCAG requirements
 */
export function meetsContrastRequirement(
  ratio: number,
  level: "AA" | "AAA" = "AA",
  isLargeText = false
): boolean {
  if (level === "AAA") {
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  }
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Screen reader only CSS class
 */
export const srOnlyClass = `
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .sr-only-focusable:focus,
  .sr-only-focusable:active {
    position: static;
    width: auto;
    height: auto;
    padding: inherit;
    margin: inherit;
    overflow: visible;
    clip: auto;
    white-space: normal;
  }
`;

/**
 * Focus visible styles
 */
export const focusVisibleStyles = `
  :focus-visible {
    outline: 2px solid var(--focus-ring-color, #4F46E5);
    outline-offset: 2px;
  }

  :focus:not(:focus-visible) {
    outline: none;
  }
`;
