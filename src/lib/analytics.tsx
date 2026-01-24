"use client";

import { useEffect, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Analytics event types
interface AnalyticsEvent {
  name: string;
  properties?: Record<string, string | number | boolean>;
}

// Simple analytics implementation (replace with your analytics provider)
class Analytics {
  private queue: AnalyticsEvent[] = [];
  private isInitialized = false;

  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    
    // Flush any queued events
    this.queue.forEach(event => this.send(event));
    this.queue = [];
  }

  track(name: string, properties?: Record<string, string | number | boolean>) {
    const event = { name, properties };
    
    if (!this.isInitialized) {
      this.queue.push(event);
      return;
    }

    this.send(event);
  }

  private send(event: AnalyticsEvent) {
    // Send to your analytics endpoint
    if (process.env.NODE_ENV === "production") {
      const body = JSON.stringify({
        event: event.name,
        properties: event.properties,
        url: typeof window !== "undefined" ? window.location.href : "",
        timestamp: Date.now(),
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        referrer: typeof document !== "undefined" ? document.referrer : "",
      });

      // Use sendBeacon for reliability
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon("/api/analytics/events", body);
      } else {
        fetch("/api/analytics/events", {
          method: "POST",
          body,
          headers: { "Content-Type": "application/json" },
          keepalive: true,
        }).catch(() => {});
      }
    }

    // Log in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[Analytics] ${event.name}`, event.properties);
    }
  }

  pageView(path: string) {
    this.track("page_view", { path });
  }
}

export const analytics = new Analytics();

// Hook for page view tracking
export function usePageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    analytics.init();
    
    const url = pathname + (searchParams?.toString() ? `?${searchParams}` : "");
    analytics.pageView(url);
  }, [pathname, searchParams]);
}

// Hook for custom event tracking
export function useAnalytics() {
  const track = useCallback((name: string, properties?: Record<string, string | number | boolean>) => {
    analytics.track(name, properties);
  }, []);

  return { track };
}

// Analytics provider component
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  usePageView();
  
  // Track Web Vitals
  useEffect(() => {
    if (typeof window === "undefined") return;

    const reportWebVitals = (metric: { name: string; value: number }) => {
      analytics.track("web_vitals", {
        metric_name: metric.name,
        metric_value: Math.round(metric.value),
      });
    };

    // Import web-vitals dynamically (optional dependency)
    // Using Function constructor to bypass TypeScript module resolution
    const loadWebVitals = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const module = await (Function('return import("web-vitals")')() as Promise<any>);
        module.onCLS?.(reportWebVitals);
        module.onFID?.(reportWebVitals);
        module.onLCP?.(reportWebVitals);
        module.onFCP?.(reportWebVitals);
        module.onTTFB?.(reportWebVitals);
        module.onINP?.(reportWebVitals);
      } catch {
        // web-vitals not available, skip reporting
        console.debug("[Analytics] web-vitals not available");
      }
    };

    loadWebVitals();
  }, []);

  return <>{children}</>;
}

// Common tracking events
export const trackEvents = {
  // User engagement
  buttonClick: (buttonName: string, location: string) => 
    analytics.track("button_click", { button_name: buttonName, location }),
  
  linkClick: (url: string, isExternal: boolean) =>
    analytics.track("link_click", { url, is_external: isExternal }),

  // Content interaction
  articleView: (articleId: string, articleTitle: string) =>
    analytics.track("article_view", { article_id: articleId, article_title: articleTitle }),

  articleShare: (articleId: string, platform: string) =>
    analytics.track("article_share", { article_id: articleId, platform }),

  // Search
  search: (query: string, resultsCount: number) =>
    analytics.track("search", { query, results_count: resultsCount }),

  // Reading
  readingProgress: (articleId: string, progress: number) =>
    analytics.track("reading_progress", { article_id: articleId, progress }),

  readingComplete: (articleId: string, timeSpent: number) =>
    analytics.track("reading_complete", { article_id: articleId, time_spent_seconds: timeSpent }),

  // User preferences
  settingsChange: (setting: string, value: string | boolean) =>
    analytics.track("settings_change", { setting, value: String(value) }),

  // Errors
  error: (errorType: string, errorMessage: string) =>
    analytics.track("error", { error_type: errorType, error_message: errorMessage }),

  // Performance
  slowLoad: (page: string, loadTime: number) =>
    analytics.track("slow_load", { page, load_time_ms: loadTime }),
};

// Scroll depth tracking hook
export function useScrollDepthTracking(articleId?: string) {
  useEffect(() => {
    if (!articleId) return;

    const milestones = [25, 50, 75, 100];
    const reached = new Set<number>();

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);

      milestones.forEach(milestone => {
        if (scrollPercent >= milestone && !reached.has(milestone)) {
          reached.add(milestone);
          analytics.track("scroll_depth", { 
            article_id: articleId, 
            depth: milestone 
          });
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [articleId]);
}

// Time on page tracking
export function useTimeOnPage(pageId?: string) {
  useEffect(() => {
    if (!pageId) return;

    const startTime = Date.now();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        const timeSpent = Math.round((Date.now() - startTime) / 1000);
        analytics.track("time_on_page", { 
          page_id: pageId, 
          time_spent_seconds: timeSpent 
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      if (timeSpent > 5) { // Only track if spent more than 5 seconds
        analytics.track("time_on_page", { 
          page_id: pageId, 
          time_spent_seconds: timeSpent 
        });
      }
    };
  }, [pageId]);
}
