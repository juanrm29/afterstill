/**
 * Resource hints for better page load performance
 * Add these to the <head> of your document
 */

// Critical resources that should be preloaded
export const preloadResources = [
  { href: "/fonts/inter-var.woff2", as: "font", type: "font/woff2", crossOrigin: "anonymous" },
  { href: "/fonts/cormorant-var.woff2", as: "font", type: "font/woff2", crossOrigin: "anonymous" },
];

// DNS prefetch for external domains
export const dnsPrefetch = [
  "https://fonts.googleapis.com",
  "https://fonts.gstatic.com",
  "https://api.openai.com",
];

// Preconnect for critical external domains
export const preconnect = [
  { href: "https://fonts.googleapis.com", crossOrigin: undefined },
  { href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
];

/**
 * Generate resource hints as JSX elements for Next.js head
 */
export function generateResourceHints() {
  return {
    dnsPrefetch: dnsPrefetch.map((href) => ({
      rel: "dns-prefetch",
      href,
    })),
    preconnect: preconnect.map(({ href, crossOrigin }) => ({
      rel: "preconnect",
      href,
      crossOrigin,
    })),
    preload: preloadResources.map((resource) => ({
      rel: "preload",
      ...resource,
    })),
  };
}

/**
 * Utility to prefetch a page/route
 */
export function prefetchRoute(url: string) {
  if (typeof window === "undefined") return;
  
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = url;
  document.head.appendChild(link);
}

/**
 * Utility to preload an image
 */
export function preloadImage(src: string) {
  if (typeof window === "undefined") return Promise.resolve();
  
  return new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Utility to preload multiple images
 */
export async function preloadImages(srcs: string[]) {
  await Promise.all(srcs.map(preloadImage));
}

/**
 * Prioritize critical resources by moving them to head
 */
export function prioritizeResource(element: HTMLLinkElement | HTMLScriptElement) {
  const head = document.head;
  const firstScript = head.querySelector("script");
  
  if (firstScript) {
    head.insertBefore(element, firstScript);
  } else {
    head.appendChild(element);
  }
}

/**
 * Lazy load a script
 */
export function lazyLoadScript(src: string, options?: { 
  async?: boolean; 
  defer?: boolean;
  id?: string;
}) {
  return new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }
    
    // Check if already loaded
    if (options?.id && document.getElementById(options.id)) {
      resolve();
      return;
    }
    
    const script = document.createElement("script");
    script.src = src;
    script.async = options?.async ?? true;
    script.defer = options?.defer ?? false;
    if (options?.id) script.id = options.id;
    
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    
    document.body.appendChild(script);
  });
}

/**
 * Delay non-critical work until the browser is idle
 */
export function runWhenIdle(callback: () => void, timeout = 2000) {
  if (typeof window === "undefined") {
    callback();
    return;
  }
  
  if ("requestIdleCallback" in window) {
    (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number })
      .requestIdleCallback(callback, { timeout });
  } else {
    setTimeout(callback, 1);
  }
}

/**
 * Intersection Observer based resource loading
 */
export function loadOnVisible(
  element: Element,
  onVisible: () => void,
  options?: IntersectionObserverInit
) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          onVisible();
          observer.disconnect();
        }
      });
    },
    { rootMargin: "100px", ...options }
  );
  
  observer.observe(element);
  
  return () => observer.disconnect();
}

/**
 * Check if the browser supports a feature
 */
export const supports = {
  webp: () => {
    if (typeof document === "undefined") return false;
    const canvas = document.createElement("canvas");
    return canvas.toDataURL("image/webp").startsWith("data:image/webp");
  },
  avif: async () => {
    if (typeof Image === "undefined") return false;
    return new Promise<boolean>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = "data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKBzgABpAQ0AIQ";
    });
  },
  intersectionObserver: () => typeof IntersectionObserver !== "undefined",
  mutationObserver: () => typeof MutationObserver !== "undefined",
  serviceWorker: () => "serviceWorker" in navigator,
  webGL: () => {
    if (typeof document === "undefined") return false;
    try {
      const canvas = document.createElement("canvas");
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
      );
    } catch {
      return false;
    }
  },
};
