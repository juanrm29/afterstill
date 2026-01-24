"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";

// ============================================================================
// Types
// ============================================================================
interface PWAContextType {
  // Installation
  isInstallable: boolean;
  isInstalled: boolean;
  installApp: () => Promise<void>;
  
  // Update
  hasUpdate: boolean;
  updateApp: () => void;
  
  // Network status
  isOnline: boolean;
  
  // Service Worker
  isServiceWorkerReady: boolean;
  registration: ServiceWorkerRegistration | null;
  
  // Cache
  clearCache: () => Promise<void>;
  precacheContent: () => void;
  getCacheSize: () => Promise<CacheSize | null>;
  
  // Notifications
  notificationPermission: NotificationPermission | null;
  requestNotificationPermission: () => Promise<boolean>;
}

interface CacheSize {
  usage: number;
  quota: number;
  usageDetails?: Record<string, number>;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// ============================================================================
// Context
// ============================================================================
const PWAContext = createContext<PWAContextType | null>(null);

export function usePWA() {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error("usePWA must be used within a PWAProvider");
  }
  return context;
}

// Safe hook that doesn't throw
export function usePWASafe() {
  return useContext(PWAContext);
}

// ============================================================================
// Provider
// ============================================================================
interface PWAProviderProps {
  children: ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  // Installation state
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  
  // Update state
  const [hasUpdate, setHasUpdate] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  
  // Network state
  const [isOnline, setIsOnline] = useState(true);
  
  // Service Worker state
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  
  // Notification state
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null);

  // Check if app is installed
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const checkInstalled = () => {
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
      const isIOSStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
      setIsInstalled(isStandalone || isIOSStandalone);
    };
    
    checkInstalled();
    
    // Listen for display mode changes
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    mediaQuery.addEventListener("change", checkInstalled);
    
    return () => mediaQuery.removeEventListener("change", checkInstalled);
  }, []);

  // Handle install prompt
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };
    
    const handleAppInstalled = () => {
      setIsInstallable(false);
      setIsInstalled(true);
      setDeferredPrompt(null);
      console.log("[PWA] App installed successfully");
    };
    
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Register Service Worker
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    
    const registerSW = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        
        setRegistration(reg);
        console.log("[PWA] Service Worker registered:", reg.scope);
        
        // Check if SW is ready
        if (reg.active) {
          setIsServiceWorkerReady(true);
        }
        
        // Handle updates
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              console.log("[PWA] New version available");
              setHasUpdate(true);
              setWaitingWorker(newWorker);
            }
          });
        });
        
        // Check for updates periodically
        setInterval(() => {
          reg.update().catch(() => {});
        }, 60 * 60 * 1000); // Every hour
        
        // Check for waiting worker on load
        if (reg.waiting) {
          setHasUpdate(true);
          setWaitingWorker(reg.waiting);
        }
      } catch (error) {
        console.error("[PWA] Service Worker registration failed:", error);
      }
    };
    
    // Wait for window load to not impact page load performance
    if (document.readyState === "complete") {
      registerSW();
    } else {
      window.addEventListener("load", registerSW, { once: true });
    }
  }, []);

  // Handle controller change (SW activated)
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    
    const handleControllerChange = () => {
      console.log("[PWA] Controller changed, reloading...");
      window.location.reload();
    };
    
    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
    
    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  // Network status
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => {
      setIsOnline(true);
      console.log("[PWA] Back online");
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      console.log("[PWA] Gone offline");
    };
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Check notification permission
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    setNotificationPermission(Notification.permission);
  }, []);

  // Install app
  const installApp = useCallback(async () => {
    if (!deferredPrompt) {
      console.log("[PWA] No install prompt available");
      return;
    }
    
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`[PWA] Install prompt outcome: ${outcome}`);
      
      if (outcome === "accepted") {
        setIsInstallable(false);
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error("[PWA] Install failed:", error);
    }
  }, [deferredPrompt]);

  // Update app
  const updateApp = useCallback(() => {
    if (!waitingWorker) return;
    
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
    setHasUpdate(false);
    setWaitingWorker(null);
  }, [waitingWorker]);

  // Clear cache
  const clearCache = useCallback(async () => {
    if (!registration?.active) return;
    
    return new Promise<void>((resolve) => {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = () => resolve();
      
      registration.active?.postMessage({ type: "CLEAR_CACHE" }, [messageChannel.port2]);
      
      // Fallback timeout
      setTimeout(resolve, 2000);
    });
  }, [registration]);

  // Precache content
  const precacheContent = useCallback(() => {
    if (!registration?.active) return;
    registration.active.postMessage({ type: "PRECACHE_CONTENT" });
  }, [registration]);

  // Get cache size
  const getCacheSize = useCallback(async (): Promise<CacheSize | null> => {
    if (!navigator.storage?.estimate) return null;
    
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage || 0,
      quota: estimate.quota || 0,
    };
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    if (!("Notification" in window)) {
      console.log("[PWA] Notifications not supported");
      return false;
    }
    
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      return permission === "granted";
    } catch (error) {
      console.error("[PWA] Notification permission request failed:", error);
      return false;
    }
  }, []);

  const value: PWAContextType = {
    isInstallable,
    isInstalled,
    installApp,
    hasUpdate,
    updateApp,
    isOnline,
    isServiceWorkerReady,
    registration,
    clearCache,
    precacheContent,
    getCacheSize,
    notificationPermission,
    requestNotificationPermission,
  };

  return <PWAContext.Provider value={value}>{children}</PWAContext.Provider>;
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook to detect PWA display mode
 */
export function useDisplayMode() {
  const [displayMode, setDisplayMode] = useState<"browser" | "standalone" | "minimal-ui" | "fullscreen">("browser");
  
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const modes: Array<"standalone" | "minimal-ui" | "fullscreen"> = ["standalone", "minimal-ui", "fullscreen"];
    
    for (const mode of modes) {
      if (window.matchMedia(`(display-mode: ${mode})`).matches) {
        setDisplayMode(mode);
        return;
      }
    }
    
    setDisplayMode("browser");
  }, []);
  
  return displayMode;
}

/**
 * Hook to track online/offline status
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
  
  return isOnline;
}

/**
 * Hook to detect if app can be installed
 */
export function useInstallPrompt() {
  const [canInstall, setCanInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };
    
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);
  
  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false;
    
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setCanInstall(false);
      return outcome === "accepted";
    } catch {
      return false;
    }
  }, [deferredPrompt]);
  
  return { canInstall, promptInstall };
}

/**
 * Register for background sync
 */
export async function registerBackgroundSync(tag: string): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("SyncManager" in window)) {
    console.log("[PWA] Background Sync not supported");
    return false;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register(tag);
    console.log(`[PWA] Background sync registered: ${tag}`);
    return true;
  } catch (error) {
    console.error("[PWA] Background sync registration failed:", error);
    return false;
  }
}

/**
 * Register for periodic background sync
 */
export async function registerPeriodicSync(
  tag: string,
  minInterval: number = 24 * 60 * 60 * 1000 // 24 hours
): Promise<boolean> {
  if (!("serviceWorker" in navigator)) return false;
  
  try {
    const registration = await navigator.serviceWorker.ready;
    const periodicSync = (registration as ServiceWorkerRegistration & { 
      periodicSync?: { register: (tag: string, options: { minInterval: number }) => Promise<void> } 
    }).periodicSync;
    
    if (!periodicSync) {
      console.log("[PWA] Periodic Sync not supported");
      return false;
    }
    
    await periodicSync.register(tag, { minInterval });
    console.log(`[PWA] Periodic sync registered: ${tag}`);
    return true;
  } catch (error) {
    console.error("[PWA] Periodic sync registration failed:", error);
    return false;
  }
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(vapidPublicKey?: string): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.log("[PWA] Push notifications not supported");
    return null;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    
    const options: PushSubscriptionOptionsInit = {
      userVisibleOnly: true,
    };
    
    if (vapidPublicKey) {
      const keyArray = urlBase64ToUint8Array(vapidPublicKey);
      options.applicationServerKey = keyArray.buffer as ArrayBuffer;
    }
    
    const subscription = await registration.pushManager.subscribe(options);
    console.log("[PWA] Push subscription created");
    
    return subscription;
  } catch (error) {
    console.error("[PWA] Push subscription failed:", error);
    return null;
  }
}

/**
 * Convert base64 VAPID key to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

/**
 * Check if running as PWA
 */
export function isPWA(): boolean {
  if (typeof window === "undefined") return false;
  
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
    document.referrer.includes("android-app://")
  );
}

/**
 * Check PWA capabilities
 */
export function getPWACapabilities() {
  if (typeof window === "undefined") {
    return {
      serviceWorker: false,
      pushNotifications: false,
      backgroundSync: false,
      periodicSync: false,
      share: false,
      shareTarget: false,
      persistentStorage: false,
      notifications: false,
    };
  }
  
  return {
    serviceWorker: "serviceWorker" in navigator,
    pushNotifications: "PushManager" in window,
    backgroundSync: "SyncManager" in window,
    periodicSync: "PeriodicSyncManager" in window,
    share: "share" in navigator,
    shareTarget: "launchQueue" in window,
    persistentStorage: "storage" in navigator && "persist" in navigator.storage,
    notifications: "Notification" in window,
  };
}

// ============================================================================
// Default export for backward compatibility
// ============================================================================
export { PWAProvider as default };
