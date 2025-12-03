// src/middleware.ts
import { NextResponse, type NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';

// Initiëer Redis client enkel als de credentials aanwezig zijn.
// Dit is efficiënter en voorkomt onnodige initialisatie.
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const RATE_LIMIT_COUNT = parseInt(process.env.RATE_LIMIT_COUNT || '60', 10);
const RATE_LIMIT_WINDOW = parseInt(
  process.env.RATE_LIMIT_WINDOW_SECONDS || '60',
  10
);

/**
 * Bepaalt een unieke identifier voor de inkomende request.
 * Geeft prioriteit aan een API key, anders valt het terug op het IP-adres.
 */
function getRequestIdentifier(req: NextRequest): string {
  // Geef prioriteit aan een 'x-api-key' header voor authentieke services.
  const apiKey = req.headers.get('x-api-key');
  if (apiKey) {
    return `rate_limit:api:${apiKey}`;
  }
  
  // Fallback naar IP-adres. Gebruik 'x-forwarded-for' vanwege Vercel's proxy.
  const ip = req.ip ?? req.headers.get('x-forwarded-for') ?? '127.0.0.1';
  return `rate_limit:ip:${ip}`;
}

export async function middleware(req: NextRequest) {
  // Als Redis niet geconfigureerd is, slaan we rate limiting over in productie.
  // Een in-memory fallback is onbetrouwbaar in een serverless omgeving.
  if (!redis) {
    console.warn('Rate Limiter: Redis is not configured. Skipping rate limit.');
    return NextResponse.next();
  }

  const key = getRequestIdentifier(req);

  try {
    const [count, expiration] = await redis.multi().incr(key).expire(key, RATE_LIMIT_WINDOW, 'NX').exec();

    // Als de teller boven de limiet is, blokkeer de request.
    if (count && Number(count) > RATE_LIMIT_COUNT) {
      const ttl = await redis.ttl(key);
      const headers = new Headers();
      headers.set('Retry-After', String(ttl > 0 ? ttl : RATE_LIMIT_WINDOW));
      headers.set('X-RateLimit-Limit', String(RATE_LIMIT_COUNT));
      headers.set('X-RateLimit-Remaining', '0');

      return new NextResponse(
        JSON.stringify({ error: 'Too Many Requests' }),
        { status: 429, headers }
      );
    }

    // Voeg de rate limit headers toe aan de response voor de client.
    const remaining = Math.max(0, RATE_LIMIT_COUNT - Number(count || 0));
    const res = NextResponse.next(); // Laat de request door naar de API route
    res.headers.set('X-RateLimit-Limit', String(RATE_LIMIT_COUNT));
    res.headers.set('X-RateLimit-Remaining', String(remaining));
    
    return res;

  } catch (err) {
    console.error('Rate Limiter Middleware Error:', err);
    // In geval van een fout met de rate limiter, laten we de request door
    // om de beschikbaarheid van de app niet te compromitteren.
    return NextResponse.next();
  }
}

// De 'config' export zorgt ervoor dat deze middleware ENKEL draait voor
// paden die overeenkomen met de matcher. Dit is cruciaal voor performance.
export const config = {
  matcher: [
    /*
     * Match all API routes except for:
     * - /api/auth/* (voor login/logout)
     * - /api/webhook/* (webhooks hebben vaak hun eigen authenticatie)
     */
    '/api/((?!auth|webhook).*)',
  ],
};