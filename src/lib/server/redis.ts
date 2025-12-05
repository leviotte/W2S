/**
 * lib/server/redis.ts
 *
 * Singleton-patroon voor de Redis-client.
 * Dit voorkomt een "connection flood" in zowel development (HMR) als productie (serverless).
 * De connectie wordt gecached op de globale scope om hergebruikt te worden.
 *
 * BELANGRIJK: Dit bestand mag ENKEL op de server geïmporteerd worden.
 */
import { createClient } from 'redis';

// Haal de Redis URL op uit de environment variables.
const redisUrl = process.env.REDIS_URL;

// TypeScript: Vertel de compiler dat we een 'redis' property op de globale scope kunnen hebben.
declare global {
  var redis: ReturnType<typeof createClient> | undefined;
}

let client: ReturnType<typeof createClient>;

if (!redisUrl) {
  // Als er geen Redis URL is, willen we niet crashen, maar een duidelijke melding geven
  // en een 'mock' client voorzien die niets doet. Dit kan handig zijn voor lokale tests zonder Redis.
  console.warn('🔴 REDIS_URL is niet ingesteld. Redis-client zal niet functioneren.');
  // We creëren een dummy client om te voorkomen dat de app crasht bij aanroepen.
  // In een echte productie-omgeving zou je hier misschien een error willen throwen.
  client = {} as ReturnType<typeof createClient>;
} else {
  // In development, hergebruiken we de connectie van 'global.redis' om HMR-problemen te voorkomen.
  if (process.env.NODE_ENV === 'development') {
    if (!global.redis) {
      console.log('✨ Creating new Redis connection for development...');
      global.redis = createClient({ url: redisUrl });
      global.redis.connect().catch(console.error);
    }
    client = global.redis;
  } else {
    // In productie, creëren we altijd een nieuwe client.
    // Vercel's architectuur zorgt voor het hergebruiken van de "warme" instantie.
    client = createClient({ url: redisUrl });
    client.connect().catch(console.error);
  }
}

// Exporteer de (mogelijk gecachte) client.
export default client;