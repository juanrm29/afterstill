import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rate limiting store (use Redis in production)
const rateLimit = new Map<string, { count: number; resetTime: number }>();

// Content Security Policy
const generateCSP = () => {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  
  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https: 'unsafe-inline'`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com data:`,
    `img-src 'self' data: blob: https:`,
    `media-src 'self' blob:`,
    `connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com https://api.openai.com wss: https:`,
    `frame-ancestors 'self'`,
    `form-action 'self'`,
    `base-uri 'self'`,
    `object-src 'none'`,
    `upgrade-insecure-requests`,
  ].join("; ");

  return { csp, nonce };
};

// Enhanced security headers
const getSecurityHeaders = (nonce?: string) => ({
  "X-DNS-Prefetch-Control": "on",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Frame-Options": "SAMEORIGIN",
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(self), interest-cohort=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "credentialless",
});

// API paths that need higher rate limits
const highLimitPaths = ["/api/writings", "/api/settings"];

// Paths to skip rate limiting
const skipRateLimitPaths = ["/_next", "/static", "/favicon", "/manifest"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Skip rate limiting for static assets
  const shouldSkipRateLimit = skipRateLimitPaths.some(path => pathname.startsWith(path));
  
  // Generate CSP for non-API routes
  const isApiRoute = pathname.startsWith("/api");
  
  // Add security headers
  const securityHeaders = getSecurityHeaders();
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Add CSP for non-API routes (more lenient for SSR)
  if (!isApiRoute && process.env.NODE_ENV === "production") {
    const { csp } = generateCSP();
    response.headers.set("Content-Security-Policy", csp);
  }

  // Enhanced rate limiting
  if (!shouldSkipRateLimit) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() 
      ?? request.headers.get("x-real-ip") 
      ?? request.headers.get("cf-connecting-ip")
      ?? "unknown";
    
    const now = Date.now();
    const userLimit = rateLimit.get(ip);
    
    // Different limits for different paths
    const isHighLimitPath = highLimitPaths.some(path => pathname.startsWith(path));
    const maxRequests = isHighLimitPath ? 200 : isApiRoute ? 50 : 100;
    const windowMs = 10000; // 10 seconds

    if (userLimit && now < userLimit.resetTime) {
      if (userLimit.count >= maxRequests) {
        // Add Retry-After header
        const retryAfter = Math.ceil((userLimit.resetTime - now) / 1000);
        return new NextResponse(
          JSON.stringify({ 
            error: "Too Many Requests", 
            retryAfter,
            message: "Please wait before making more requests"
          }), 
          { 
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": String(retryAfter),
              "X-RateLimit-Limit": String(maxRequests),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": String(Math.ceil(userLimit.resetTime / 1000)),
            }
          }
        );
      }
      userLimit.count++;
      
      // Add rate limit headers
      response.headers.set("X-RateLimit-Limit", String(maxRequests));
      response.headers.set("X-RateLimit-Remaining", String(maxRequests - userLimit.count));
      response.headers.set("X-RateLimit-Reset", String(Math.ceil(userLimit.resetTime / 1000)));
    } else {
      rateLimit.set(ip, { count: 1, resetTime: now + windowMs });
      response.headers.set("X-RateLimit-Limit", String(maxRequests));
      response.headers.set("X-RateLimit-Remaining", String(maxRequests - 1));
      response.headers.set("X-RateLimit-Reset", String(Math.ceil((now + windowMs) / 1000)));
    }

    // Clean up old entries (1% chance per request)
    if (Math.random() < 0.01) {
      const entries = Array.from(rateLimit.entries());
      for (const [key, value] of entries) {
        if (now > value.resetTime + 60000) { // Clean entries older than 1 minute past reset
          rateLimit.delete(key);
        }
      }
    }
  }

  // Add timing header for performance monitoring
  response.headers.set("Server-Timing", `middleware;dur=${Date.now() - performance.now()}`);

  // Handle CORS for API routes
  if (isApiRoute) {
    const origin = request.headers.get("origin");
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_SITE_URL || "https://afterstill.com",
      "http://localhost:3000",
      "http://localhost:3001",
    ];

    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      response.headers.set("Access-Control-Max-Age", "86400");
    }

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      return new NextResponse(null, { 
        status: 200,
        headers: response.headers,
      });
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.svg$|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.webp$|.*\\.ico$|robots\\.txt$|sitemap\\.xml$).*)",
  ],
};
