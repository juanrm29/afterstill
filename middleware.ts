import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rate limiting store (use Redis in production)
const rateLimit = new Map<string, { count: number; resetTime: number }>();

// Security headers
const securityHeaders = {
  "X-DNS-Prefetch-Control": "on",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Frame-Options": "SAMEORIGIN",
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Add security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Simple rate limiting (10 requests per 10 seconds)
  const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown";
  const now = Date.now();
  const userLimit = rateLimit.get(ip);

  if (userLimit && now < userLimit.resetTime) {
    if (userLimit.count >= 100) {
      return new NextResponse("Too Many Requests", { status: 429 });
    }
    userLimit.count++;
  } else {
    rateLimit.set(ip, { count: 1, resetTime: now + 10000 });
  }

  // Clean up old entries
  if (Math.random() < 0.01) {
    Array.from(rateLimit.entries()).forEach(([key, value]) => {
      if (now > value.resetTime) {
        rateLimit.delete(key);
      }
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp).*)",
  ],
};
