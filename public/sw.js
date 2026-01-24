/**
 * Afterstill Service Worker v3
 * Enhanced PWA with intelligent caching, offline support, and background sync
 */

const CACHE_VERSION = "v3";
const STATIC_CACHE = `afterstill-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `afterstill-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `afterstill-images-${CACHE_VERSION}`;
const CONTENT_CACHE = `afterstill-content-${CACHE_VERSION}`;
const FONT_CACHE = `afterstill-fonts-${CACHE_VERSION}`;

// Cache limits
const MAX_DYNAMIC_CACHE_ITEMS = 50;
const MAX_IMAGE_CACHE_ITEMS = 100;
const MAX_CONTENT_CACHE_ITEMS = 30;

// Assets to precache on install
const PRECACHE_ASSETS = [
  "/",
  "/offline",
  "/manifest.json",
  "/conduit",
  "/archive",
  "/about",
];

// Font patterns to cache
const FONT_PATTERNS = [
  "fonts.googleapis.com",
  "fonts.gstatic.com",
];

const sw = self;

// ============================================================================
// INSTALL EVENT - Precache critical assets
// ============================================================================
sw.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker v3...");
  
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      
      // Cache assets individually to handle failures gracefully
      const cachePromises = PRECACHE_ASSETS.map(async (url) => {
        try {
          const response = await fetch(url, { cache: "reload" });
          if (response.ok) {
            await cache.put(url, response);
            console.log(`[SW] Cached: ${url}`);
          }
        } catch (error) {
          console.warn(`[SW] Failed to cache: ${url}`, error);
        }
      });
      
      await Promise.all(cachePromises);
      console.log("[SW] Precaching complete");
    })()
  );
  
  // Activate immediately
  sw.skipWaiting();
});

// ============================================================================
// ACTIVATE EVENT - Cleanup old caches
// ============================================================================
sw.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker v3...");
  
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      const validCaches = [STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE, CONTENT_CACHE, FONT_CACHE];
      
      await Promise.all(
        cacheNames
          .filter((name) => !validCaches.includes(name))
          .map((name) => {
            console.log(`[SW] Deleting old cache: ${name}`);
            return caches.delete(name);
          })
      );
      
      // Take control of all clients immediately
      await sw.clients.claim();
      console.log("[SW] Activation complete");
    })()
  );
});

// ============================================================================
// FETCH EVENT - Intelligent routing and caching
// ============================================================================
sw.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== "GET") return;
  
  // Skip chrome-extension and other protocols
  if (!url.protocol.startsWith("http")) return;
  
  // Handle share target
  if (url.pathname === "/share" && request.method === "GET") {
    event.respondWith(handleShareTarget(request));
    return;
  }
  
  // Skip cross-origin requests (except fonts and CDN)
  const isFontRequest = FONT_PATTERNS.some((pattern) => url.hostname.includes(pattern));
  const isSameOrigin = url.origin === location.origin;
  
  if (!isSameOrigin && !isFontRequest) return;
  
  // Route based on request type
  if (isFontRequest) {
    event.respondWith(cacheFonts(request));
    return;
  }
  
  // API requests
  if (url.pathname.startsWith("/api/")) {
    // Writings and content APIs - cache for offline reading
    if (url.pathname.includes("/writings") || url.pathname.includes("/oracle")) {
      event.respondWith(networkFirstWithFallback(request, CONTENT_CACHE));
      return;
    }
    // Other APIs - network only with timeout
    event.respondWith(networkWithTimeout(request, 5000));
    return;
  }
  
  // Images - cache first with network fallback
  if (request.destination === "image" || url.pathname.match(/\.(png|jpg|jpeg|gif|webp|avif|svg|ico)$/i)) {
    event.respondWith(cacheFirstWithRefresh(request, IMAGE_CACHE, MAX_IMAGE_CACHE_ITEMS));
    return;
  }
  
  // Static assets (JS, CSS) - stale while revalidate
  if (request.destination === "script" || request.destination === "style") {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }
  
  // Navigation requests - network first with offline fallback
  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(navigationHandler(request));
    return;
  }
  
  // Default - stale while revalidate
  event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
});

// ============================================================================
// CACHING STRATEGIES
// ============================================================================

/**
 * Cache First with Background Refresh
 * Best for: Images, fonts, static assets that rarely change
 */
async function cacheFirstWithRefresh(request, cacheName, maxItems = 100) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Background refresh
  const fetchPromise = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        await cache.put(request, response.clone());
        await trimCache(cacheName, maxItems);
      }
      return response;
    })
    .catch(() => null);
  
  // Return cached immediately, refresh in background
  if (cachedResponse) {
    fetchPromise; // Fire and forget
    return cachedResponse;
  }
  
  // No cache, wait for network
  const networkResponse = await fetchPromise;
  if (networkResponse) return networkResponse;
  
  // Return placeholder for images
  return new Response(
    '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#1a1a1a" width="100" height="100"/></svg>',
    { headers: { "Content-Type": "image/svg+xml" } }
  );
}

/**
 * Network First with Cache Fallback
 * Best for: API requests, dynamic content
 */
async function networkFirstWithFallback(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
      await trimCache(cacheName, MAX_CONTENT_CACHE_ITEMS);
    }
    return response;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      // Add header to indicate offline response
      const headers = new Headers(cachedResponse.headers);
      headers.set("X-Served-From", "cache");
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers,
      });
    }
    
    // Return offline JSON response
    return new Response(
      JSON.stringify({
        offline: true,
        message: "You are currently offline. This content will be available when you reconnect.",
        cached: false,
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * Network with Timeout
 * Best for: Non-critical API requests
 */
async function networkWithTimeout(request, timeout) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      return new Response(
        JSON.stringify({ error: "Request timeout", offline: true }),
        { status: 408, headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response(
      JSON.stringify({ error: "Network error", offline: true }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * Stale While Revalidate
 * Best for: Assets that change occasionally
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        await cache.put(request, response.clone());
        await trimCache(cacheName, MAX_DYNAMIC_CACHE_ITEMS);
      }
      return response;
    })
    .catch(() => cachedResponse);
  
  return cachedResponse || fetchPromise;
}

/**
 * Navigation Handler
 * Special handling for page navigation with offline support
 */
async function navigationHandler(request) {
  try {
    // Try network first
    const response = await fetch(request);
    
    // Cache successful navigation
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;
    
    // Fallback to offline page
    const offlinePage = await caches.match("/offline");
    if (offlinePage) return offlinePage;
    
    // Last resort - basic offline HTML
    return new Response(
      `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Offline - Afterstill</title>
        <style>
          body { 
            font-family: system-ui, sans-serif; 
            background: #030304; 
            color: #fafafa;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            text-align: center;
          }
          .container { padding: 2rem; max-width: 400px; }
          h1 { font-size: 1.5rem; margin-bottom: 1rem; opacity: 0.9; }
          p { opacity: 0.6; line-height: 1.6; }
          button {
            margin-top: 1.5rem;
            padding: 0.75rem 1.5rem;
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            color: white;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
          }
          button:hover { background: rgba(255,255,255,0.15); }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>You're Offline</h1>
          <p>The ethereal connection seems to have faded. Please check your internet connection and try again.</p>
          <button onclick="location.reload()">Try Again</button>
        </div>
      </body>
      </html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }
}

/**
 * Font Caching
 * Long-term caching for fonts
 */
async function cacheFonts(request) {
  const cache = await caches.open(FONT_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) return cachedResponse;
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response("", { status: 404 });
  }
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

/**
 * Trim cache to maximum number of items
 */
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxItems) {
    const deleteCount = keys.length - maxItems;
    for (let i = 0; i < deleteCount; i++) {
      await cache.delete(keys[i]);
    }
  }
}

// ============================================================================
// BACKGROUND SYNC
// ============================================================================
sw.addEventListener("sync", (event) => {
  console.log(`[SW] Background sync: ${event.tag}`);
  
  if (event.tag === "sync-reflections") {
    event.waitUntil(syncOfflineData("reflections"));
  }
  
  if (event.tag === "sync-analytics") {
    event.waitUntil(syncOfflineData("analytics"));
  }
  
  if (event.tag === "sync-readings") {
    event.waitUntil(syncOfflineData("readings"));
  }
});

/**
 * Sync offline data stored in IndexedDB
 */
async function syncOfflineData(type) {
  console.log(`[SW] Syncing ${type}...`);
  
  try {
    // Open IndexedDB
    const db = await openDB("afterstill-offline", 1);
    const tx = db.transaction(type, "readonly");
    const store = tx.objectStore(type);
    const items = await getAllFromStore(store);
    
    if (items.length === 0) return;
    
    // Send to server
    const response = await fetch(`/api/sync/${type}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    
    if (response.ok) {
      // Clear synced items
      const clearTx = db.transaction(type, "readwrite");
      clearTx.objectStore(type).clear();
      console.log(`[SW] Synced ${items.length} ${type} items`);
    }
  } catch (error) {
    console.error(`[SW] Sync failed for ${type}:`, error);
  }
}

/**
 * Simple IndexedDB wrapper
 */
function openDB(name, version) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("reflections")) {
        db.createObjectStore("reflections", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("analytics")) {
        db.createObjectStore("analytics", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("readings")) {
        db.createObjectStore("readings", { keyPath: "id", autoIncrement: true });
      }
    };
  });
}

function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

// ============================================================================
// PERIODIC BACKGROUND SYNC
// ============================================================================
sw.addEventListener("periodicsync", (event) => {
  console.log(`[SW] Periodic sync: ${event.tag}`);
  
  if (event.tag === "update-content") {
    event.waitUntil(updateCachedContent());
  }
});

/**
 * Periodically update cached content
 */
async function updateCachedContent() {
  const cache = await caches.open(CONTENT_CACHE);
  const keys = await cache.keys();
  
  for (const request of keys) {
    try {
      const response = await fetch(request);
      if (response.ok) {
        await cache.put(request, response);
        console.log(`[SW] Updated cached: ${request.url}`);
      }
    } catch (error) {
      // Ignore failures during periodic sync
    }
  }
}

// ============================================================================
// PUSH NOTIFICATIONS
// ============================================================================
sw.addEventListener("push", (event) => {
  if (!event.data) return;
  
  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "Afterstill", body: event.data.text() };
  }
  
  const options = {
    body: data.body || "New content available",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [100, 50, 100],
    tag: data.tag || "afterstill-notification",
    renotify: true,
    requireInteraction: data.requireInteraction || false,
    data: {
      url: data.url || "/",
      timestamp: Date.now(),
    },
    actions: data.actions || [
      { action: "open", title: "Read Now" },
      { action: "dismiss", title: "Later" },
    ],
  };
  
  event.waitUntil(
    sw.registration.showNotification(data.title || "Afterstill", options)
  );
});

sw.addEventListener("notificationclick", (event) => {
  event.notification.close();
  
  const action = event.action;
  const url = event.notification.data?.url || "/";
  
  if (action === "dismiss") return;
  
  event.waitUntil(
    sw.clients.matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url.includes(location.origin) && "focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        // Open new window
        return sw.clients.openWindow(url);
      })
  );
});

// ============================================================================
// MESSAGE HANDLING
// ============================================================================
sw.addEventListener("message", (event) => {
  const { type, payload } = event.data || {};
  
  switch (type) {
    case "SKIP_WAITING":
      sw.skipWaiting();
      break;
      
    case "CLEAR_CACHE":
      event.waitUntil(clearAllCaches());
      break;
      
    case "CACHE_URLS":
      if (payload?.urls) {
        event.waitUntil(cacheUrls(payload.urls, payload.cacheName || DYNAMIC_CACHE));
      }
      break;
      
    case "GET_CACHE_SIZE":
      event.waitUntil(getCacheSize().then((size) => {
        event.ports[0]?.postMessage({ type: "CACHE_SIZE", size });
      }));
      break;
      
    case "PRECACHE_CONTENT":
      event.waitUntil(precacheContent());
      break;
  }
});

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((name) => caches.delete(name)));
  console.log("[SW] All caches cleared");
}

async function cacheUrls(urls, cacheName) {
  const cache = await caches.open(cacheName);
  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
      }
    } catch (error) {
      console.warn(`[SW] Failed to cache: ${url}`);
    }
  }
}

async function getCacheSize() {
  if (!navigator.storage?.estimate) return null;
  const estimate = await navigator.storage.estimate();
  return {
    usage: estimate.usage,
    quota: estimate.quota,
    usageDetails: estimate.usageDetails,
  };
}

async function precacheContent() {
  try {
    // Fetch and cache writings list
    const writingsResponse = await fetch("/api/writings");
    if (writingsResponse.ok) {
      const cache = await caches.open(CONTENT_CACHE);
      await cache.put("/api/writings", writingsResponse.clone());
      
      const writings = await writingsResponse.json();
      
      // Cache individual writing pages (first 10)
      for (const writing of writings.slice(0, 10)) {
        try {
          const pageResponse = await fetch(`/reading/${writing.slug}`);
          if (pageResponse.ok) {
            await cache.put(`/reading/${writing.slug}`, pageResponse);
          }
        } catch {
          // Ignore individual failures
        }
      }
    }
  } catch (error) {
    console.error("[SW] Precache content failed:", error);
  }
}

// ============================================================================
// SHARE TARGET (Web Share Target API)
// ============================================================================
async function handleShareTarget(request) {
  const url = new URL(request.url);
  const title = url.searchParams.get("title") || "";
  const text = url.searchParams.get("text") || "";
  const sharedUrl = url.searchParams.get("url") || "";
  
  // Redirect to a page that handles the shared content
  const redirectUrl = new URL("/", location.origin);
  redirectUrl.searchParams.set("shared", "true");
  if (title) redirectUrl.searchParams.set("title", title);
  if (text) redirectUrl.searchParams.set("text", text);
  if (sharedUrl) redirectUrl.searchParams.set("url", sharedUrl);
  
  return Response.redirect(redirectUrl.toString(), 303);
}
