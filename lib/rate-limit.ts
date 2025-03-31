// Mock implementation for Redis and Ratelimit
import { Ratelimit } from '@upstash/ratelimit';

// Create a mock Redis instance that stores data in memory
class MockRedis {
  private storage: Map<string, any> = new Map();

  async get(key: string) {
    return this.storage.get(key);
  }

  async set(key: string, value: any, options?: any) {
    this.storage.set(key, value);
    return 'OK';
  }

  async incr(key: string) {
    const value = (this.storage.get(key) || 0) + 1;
    this.storage.set(key, value);
    return value;
  }

  async del(key: string) {
    this.storage.delete(key);
    return 1;
  }

  async expire(key: string, ttl: number) {
    // No real expiration in the mock, but we'll pretend it works
    return 1;
  }

  async setex(key: string, ttl: number, value: any) {
    this.storage.set(key, value);
    return 'OK';
  }
}

// Create a new Redis instance
export const redis = new MockRedis() as any;

// Create a very permissive mock rate limiter with significantly higher limits
export const rateLimiter = {
  limit: async () => ({
    success: true,
    limit: 2000,         // Doubled from 1000
    remaining: 1999,      // Doubled from 999
    reset: Date.now() + 7200000, // 2 hours from now (doubled from 1 hour)
    pending: Promise.resolve(),
  }),
} as unknown as Ratelimit;
