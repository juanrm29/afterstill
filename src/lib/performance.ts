/**
 * Performance monitoring utilities for Afterstill
 * 
 * Tracks Core Web Vitals and custom metrics for optimal user experience
 */

// Web Vitals types
export interface WebVitalsMetric {
  id: string;
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta: number;
  navigationType: string;
}

// Performance thresholds (based on Google's Core Web Vitals)
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },     // Largest Contentful Paint
  FID: { good: 100, poor: 300 },        // First Input Delay
  CLS: { good: 0.1, poor: 0.25 },       // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 },      // First Contentful Paint
  TTFB: { good: 800, poor: 1800 },      // Time to First Byte
  INP: { good: 200, poor: 500 },        // Interaction to Next Paint
};

type MetricName = keyof typeof THRESHOLDS;

/**
 * Calculate rating based on metric value
 */
function getRating(name: MetricName, value: number): "good" | "needs-improvement" | "poor" {
  const threshold = THRESHOLDS[name];
  if (!threshold) return "good";
  
  if (value <= threshold.good) return "good";
  if (value > threshold.poor) return "poor";
  return "needs-improvement";
}

function generateId(): string {
  return `v1-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getNavigationType(): string {
  if (typeof performance === "undefined") return "navigate";
  
  const navTiming = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
  return navTiming?.type || "navigate";
}

export function reportWebVitals(metric: WebVitalsMetric) {
  if (process.env.NODE_ENV === "production") {
    // Send to analytics endpoint
    const body = JSON.stringify({
      id: metric.id,
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      navigationType: metric.navigationType,
      url: typeof window !== "undefined" ? window.location.pathname : "",
      timestamp: Date.now(),
    });

    // Use sendBeacon if available
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics/vitals", body);
    } else {
      fetch("/api/analytics/vitals", {
        body,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      }).catch(() => {
        // Silently fail - don't impact user experience
      });
    }
  }

  // Log in development
  if (process.env.NODE_ENV === "development") {
    console.log(`[Web Vitals] ${metric.name}:`, metric.value.toFixed(2), metric.rating);
  }
}

/**
 * Initialize Core Web Vitals tracking
 */
export function trackCoreWebVitals(): void {
  if (typeof window === "undefined" || typeof PerformanceObserver === "undefined") {
    return;
  }

  // Wait for page to fully load
  if (document.readyState === "complete") {
    collectMetrics();
  } else {
    window.addEventListener("load", collectMetrics);
  }
}

function collectMetrics(): void {
  // Observe LCP
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
      
      if (lastEntry) {
        const metric: WebVitalsMetric = {
          id: generateId(),
          name: "LCP",
          value: lastEntry.startTime,
          rating: getRating("LCP", lastEntry.startTime),
          delta: lastEntry.startTime,
          navigationType: getNavigationType(),
        };
        reportWebVitals(metric);
      }
    });
    lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
  } catch {
    // LCP not supported
  }

  // Observe FCP
  try {
    const fcpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === "first-contentful-paint") {
          const metric: WebVitalsMetric = {
            id: generateId(),
            name: "FCP",
            value: entry.startTime,
            rating: getRating("FCP", entry.startTime),
            delta: entry.startTime,
            navigationType: getNavigationType(),
          };
          reportWebVitals(metric);
        }
      }
    });
    fcpObserver.observe({ type: "paint", buffered: true });
  } catch {
    // FCP not supported
  }

  // Observe CLS
  try {
    let clsValue = 0;
    
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const layoutShiftEntry = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
        if (!layoutShiftEntry.hadRecentInput) {
          clsValue += layoutShiftEntry.value;
        }
      }
    });
    clsObserver.observe({ type: "layout-shift", buffered: true });

    // Report CLS when page is hidden
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden" && clsValue > 0) {
        const metric: WebVitalsMetric = {
          id: generateId(),
          name: "CLS",
          value: clsValue,
          rating: getRating("CLS", clsValue),
          delta: clsValue,
          navigationType: getNavigationType(),
        };
        reportWebVitals(metric);
      }
    }, { once: true });
  } catch {
    // CLS not supported
  }

  // Observe INP (Interaction to Next Paint)
  try {
    let maxINP = 0;

    const inpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const inpEntry = entry as PerformanceEntry & { duration: number };
        if (inpEntry.duration > maxINP) {
          maxINP = inpEntry.duration;
        }
      }
    });
    inpObserver.observe({ type: "event", buffered: true });

    // Report INP when page is hidden
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden" && maxINP > 0) {
        const metric: WebVitalsMetric = {
          id: generateId(),
          name: "INP",
          value: maxINP,
          rating: getRating("INP", maxINP),
          delta: maxINP,
          navigationType: getNavigationType(),
        };
        reportWebVitals(metric);
      }
    }, { once: true });
  } catch {
    // INP not supported
  }

  // Collect TTFB
  setTimeout(() => {
    const navTiming = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    if (navTiming) {
      const ttfb = navTiming.responseStart - navTiming.requestStart;
      const metric: WebVitalsMetric = {
        id: generateId(),
        name: "TTFB",
        value: ttfb,
        rating: getRating("TTFB", ttfb),
        delta: ttfb,
        navigationType: getNavigationType(),
      };
      reportWebVitals(metric);
    }
  }, 0);
}

/**
 * Measure component render time
 */
export function measureRender(componentName: string) {
  const start = performance.now();
  
  return () => {
    const end = performance.now();
    const duration = end - start;
    
    if (duration > 16.67) { // Longer than one frame (60fps)
      console.warn(`[Performance] ${componentName} render took ${duration.toFixed(2)}ms`);
    }
  };
}

/**
 * Lazy load images with intersection observer
 */
export function lazyLoadImage(
  element: HTMLImageElement,
  options?: IntersectionObserverInit
) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const src = img.dataset.src;
        
        if (src) {
          img.src = src;
          img.removeAttribute("data-src");
          observer.unobserve(img);
        }
      }
    });
  }, options);

  observer.observe(element);
  
  return () => observer.disconnect();
}

/**
 * Debounce function for performance
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for scroll/resize events
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Preload critical resources
 */
export function preloadResource(href: string, as: string) {
  const link = document.createElement("link");
  link.rel = "preload";
  link.href = href;
  link.as = as;
  document.head.appendChild(link);
}

/**
 * Request idle callback wrapper
 */
export function requestIdleCallback(
  callback: () => void,
  options?: { timeout?: number }
): number {
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    return window.requestIdleCallback(callback, options);
  }
  
  // Fallback for browsers without requestIdleCallback
  return setTimeout(callback, 1) as unknown as number;
}

/**
 * Cancel idle callback wrapper
 */
export function cancelIdleCallback(id: number) {
  if (typeof window !== "undefined" && "cancelIdleCallback" in window) {
    window.cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
}
