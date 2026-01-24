"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PerformanceMetrics {
  fcp: number | null;
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  ttfb: number | null;
  loadTime: number | null;
  memoryUsage: number | null;
}

interface NetworkInfo {
  effectiveType: string | null;
  downlink: number | null;
  rtt: number | null;
  saveData: boolean;
}

/**
 * Performance Monitor - Development tool for monitoring Core Web Vitals
 */
export function PerformanceMonitor() {
  const [isOpen, setIsOpen] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
    loadTime: null,
    memoryUsage: null,
  });
  const [network, setNetwork] = useState<NetworkInfo>({
    effectiveType: null,
    downlink: null,
    rtt: null,
    saveData: false,
  });

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Get navigation timing
    const navEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    if (navEntry) {
      setMetrics(prev => ({
        ...prev,
        ttfb: Math.round(navEntry.responseStart - navEntry.requestStart),
        loadTime: Math.round(navEntry.loadEventEnd - navEntry.startTime),
      }));
    }

    // Memory usage (Chrome only)
    const memory = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
    if (memory) {
      setMetrics(prev => ({
        ...prev,
        memoryUsage: Math.round(memory.usedJSHeapSize / 1024 / 1024),
      }));
    }

    // Network info
    const connection = (navigator as Navigator & { 
      connection?: { 
        effectiveType: string;
        downlink: number;
        rtt: number;
        saveData: boolean;
      } 
    }).connection;
    
    if (connection) {
      setNetwork({
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData || false,
      });
    }

    // Observe Core Web Vitals
    try {
      // FCP
      const fcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === "first-contentful-paint") {
            setMetrics(prev => ({ ...prev, fcp: Math.round(entry.startTime) }));
          }
        }
      });
      fcpObserver.observe({ type: "paint", buffered: true });

      // LCP
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
        if (lastEntry) {
          setMetrics(prev => ({ ...prev, lcp: Math.round(lastEntry.startTime) }));
        }
      });
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });

      // CLS
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
          if (!shift.hadRecentInput) {
            clsValue += shift.value;
            setMetrics(prev => ({ ...prev, cls: Math.round(clsValue * 1000) / 1000 }));
          }
        }
      });
      clsObserver.observe({ type: "layout-shift", buffered: true });

      return () => {
        fcpObserver.disconnect();
        lcpObserver.disconnect();
        clsObserver.disconnect();
      };
    } catch {
      // PerformanceObserver not fully supported
    }
  }, []);

  const getScoreColor = useCallback((metric: string, value: number | null): string => {
    if (value === null) return "text-zinc-500";
    
    const thresholds: Record<string, { good: number; poor: number }> = {
      fcp: { good: 1800, poor: 3000 },
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      ttfb: { good: 800, poor: 1800 },
    };

    const threshold = thresholds[metric];
    if (!threshold) return "text-zinc-400";

    if (value <= threshold.good) return "text-emerald-400";
    if (value > threshold.poor) return "text-red-400";
    return "text-amber-400";
  }, []);

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-32 left-4 z-200 w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 transition-colors"
        title="Performance Monitor"
      >
        <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3v18h18" />
          <path d="M7 16l4-4 4 4 6-6" />
        </svg>
      </button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="fixed bottom-44 left-4 z-200 w-64 p-4 rounded-xl bg-zinc-950/95 border border-zinc-800 backdrop-blur-xl shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-medium text-zinc-300">Performance</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              {/* Core Web Vitals */}
              <div>
                <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-2">
                  Core Web Vitals
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <MetricItem
                    label="FCP"
                    value={metrics.fcp !== null ? `${metrics.fcp}ms` : "—"}
                    color={getScoreColor("fcp", metrics.fcp)}
                  />
                  <MetricItem
                    label="LCP"
                    value={metrics.lcp !== null ? `${metrics.lcp}ms` : "—"}
                    color={getScoreColor("lcp", metrics.lcp)}
                  />
                  <MetricItem
                    label="CLS"
                    value={metrics.cls !== null ? String(metrics.cls) : "—"}
                    color={getScoreColor("cls", metrics.cls)}
                  />
                  <MetricItem
                    label="TTFB"
                    value={metrics.ttfb !== null ? `${metrics.ttfb}ms` : "—"}
                    color={getScoreColor("ttfb", metrics.ttfb)}
                  />
                </div>
              </div>

              {/* Other Metrics */}
              <div>
                <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-2">
                  Resources
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <MetricItem
                    label="Load Time"
                    value={metrics.loadTime !== null ? `${metrics.loadTime}ms` : "—"}
                    color="text-zinc-300"
                  />
                  <MetricItem
                    label="Memory"
                    value={metrics.memoryUsage !== null ? `${metrics.memoryUsage}MB` : "—"}
                    color="text-zinc-300"
                  />
                </div>
              </div>

              {/* Network */}
              {network.effectiveType && (
                <div>
                  <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-2">
                    Network
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-zinc-400">{network.effectiveType.toUpperCase()}</span>
                    {network.downlink && (
                      <span className="text-zinc-500">• {network.downlink}Mbps</span>
                    )}
                    {network.rtt && (
                      <span className="text-zinc-500">• {network.rtt}ms RTT</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-800">
              <p className="text-[10px] text-zinc-600">
                🟢 Good · 🟡 Needs Improvement · 🔴 Poor
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function MetricItem({ 
  label, 
  value, 
  color 
}: { 
  label: string; 
  value: string; 
  color: string;
}) {
  return (
    <div className="bg-zinc-900/50 rounded-lg p-2">
      <p className="text-[10px] text-zinc-500 mb-0.5">{label}</p>
      <p className={`text-sm font-mono ${color}`}>{value}</p>
    </div>
  );
}

// Export hook for programmatic access
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
    loadTime: null,
    memoryUsage: null,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const navEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    if (navEntry) {
      setMetrics(prev => ({
        ...prev,
        ttfb: navEntry.responseStart - navEntry.requestStart,
        loadTime: navEntry.loadEventEnd - navEntry.startTime,
      }));
    }
  }, []);

  return metrics;
}
