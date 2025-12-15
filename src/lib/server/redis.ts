// src/lib/server/redis.ts
import 'server-only';
import { kv } from '@vercel/kv';

/**
 * Vercel KV client for Redis operations
 * 
 * Automatically uses environment variables:
 * - KV_REST_API_URL
 * - KV_REST_API_TOKEN
 * 
 * Setup in Vercel dashboard:
 * https://vercel.com/docs/storage/vercel-kv/quickstart
 * 
 * Local development:
 * Use Vercel CLI: `vercel env pull .env.local`
 */

// Export the KV client directly
export { kv };

// Helper functions for common operations
export const cache = {
  /**
   * Get cached data with automatic JSON parsing
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      return await kv.get<T>(key);
    } catch (error) {
      console.error(`[KV] Error getting key "${key}":`, error);
      return null;
    }
  },

  /**
   * Set cached data with optional TTL (in seconds)
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await kv.set(key, value, { ex: ttl });
      } else {
        await kv.set(key, value);
      }
    } catch (error) {
      console.error(`[KV] Error setting key "${key}":`, error);
    }
  },

  /**
   * Delete cached data
   */
  async del(key: string): Promise<void> {
    try {
      await kv.del(key);
    } catch (error) {
      console.error(`[KV] Error deleting key "${key}":`, error);
    }
  },

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      return (await kv.exists(key)) === 1;
    } catch (error) {
      console.error(`[KV] Error checking key "${key}":`, error);
      return false;
    }
  },
};

export default kv;