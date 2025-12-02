// proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

const RATE_LIMIT = parseInt(process.env.RATE_LIMIT || "60", 10);
const WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW_SECONDS || "60", 10);

async function getKey(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key") || req.headers.get("authorization");
  if (apiKey) return `rate:${apiKey}`;

  const ip = req.ip ?? req.headers.get("x-forwarded-for") ?? "unknown";
  return `rate:ip:${ip}`;
}

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Only apply to API routes
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const upstashConfigured = Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );

  const key = await getKey(req);

  // Local fallback when no Upstash configured
  if (!upstashConfigured) {
    (global as any).__rateLimiter = (global as any).__rateLimiter || {};
    const now = Math.floor(Date.now() / 1000);
    const entry = (global as any).__rateLimiter[key] || { ts: now, count: 0 };

    if (now - entry.ts >= WINDOW) {
      entry.ts = now;
      entry.count = 1;
    } else {
      entry.count += 1;
    }

    (global as any).__rateLimiter[key] = entry;

    if (entry.count > RATE_LIMIT) {
      return new NextResponse(
        JSON.stringify({ error: "Too Many Requests" }),
        { status: 429 }
      );
    }

    return NextResponse.next();
  }

  try {
    const cnt = await redis.incr(key);
    if (cnt === 1) await redis.expire(key, WINDOW);

    const ttl = await redis.ttl(key);

    if (cnt > RATE_LIMIT) {
      const headers = new Headers();
      headers.set("Retry-After", String(ttl > 0 ? ttl : WINDOW));
      headers.set("X-RateLimit-Limit", String(RATE_LIMIT));
      headers.set("X-RateLimit-Remaining", "0");

      return new NextResponse(
        JSON.stringify({ error: "Too Many Requests" }),
        { status: 429, headers }
      );
    }

    const remaining = Math.max(0, RATE_LIMIT - cnt);

    const res = NextResponse.next();
    res.headers.set("X-RateLimit-Limit", String(RATE_LIMIT));
    res.headers.set("X-RateLimit-Remaining", String(remaining));
    res.headers.set(
      "X-RateLimit-Reset",
      String(Math.floor(Date.now() / 1000) + (ttl > 0 ? ttl : WINDOW))
    );

    return res;
  } catch (err) {
    console.error("Rate limiter proxy error:", err);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/api/:path*"],
};
