import { createClient } from 'redis';
import { Logo } from '../types/logo';

// Check if we're in a build environment
const isBuild = process.env.NEXT_PHASE === 'phase-production-build';
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// In-memory store for development and build
let inMemoryStore: Record<string, string> = {};

// Redis client singleton
let redisClient: ReturnType<typeof createClient> | null = null;

async function getRedisClient() {
  // Use in-memory store during build
  if (isBuild) {
    return null;
  }

  if (!redisClient) {
    redisClient = createClient({
      url: redisUrl
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
      redisClient = null;
    });

    await redisClient.connect();
  }
  return redisClient;
}

// Development store implementation
const devStore = {
  async hset(key: string, value: Record<string, any>) {
    try {
      const client = await getRedisClient();
      if (!client) {
        // Use in-memory store during build
        Object.entries(value).forEach(([field, val]) => {
          inMemoryStore[`${key}:${field}`] = JSON.stringify(val);
        });
        return 1;
      }
      return client.hSet(key, value);
    } catch (error) {
      console.error('Redis hset error, using in-memory store:', error);
      Object.entries(value).forEach(([field, val]) => {
        inMemoryStore[`${key}:${field}`] = JSON.stringify(val);
      });
      return 1;
    }
  },

  async hget(key: string, field: string) {
    try {
      const client = await getRedisClient();
      if (!client) {
        // Use in-memory store during build
        const value = inMemoryStore[`${key}:${field}`];
        return value ? JSON.parse(value) : null;
      }
      const value = await client.hGet(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis hget error, using in-memory store:', error);
      const value = inMemoryStore[`${key}:${field}`];
      return value ? JSON.parse(value) : null;
    }
  },

  async hgetall(key: string) {
    try {
      const client = await getRedisClient();
      if (!client) {
        // Use in-memory store during build
        const result: Record<string, any> = {};
        Object.entries(inMemoryStore)
          .filter(([k]) => k.startsWith(`${key}:`))
          .forEach(([k, v]) => {
            result[k.replace(`${key}:`, '')] = JSON.parse(v);
          });
        return result;
      }
      const value = await client.hGetAll(key);
      return Object.fromEntries(
        Object.entries(value).map(([k, v]) => [k, JSON.parse(v)])
      );
    } catch (error) {
      console.error('Redis hgetall error, using in-memory store:', error);
      const result: Record<string, any> = {};
      Object.entries(inMemoryStore)
        .filter(([k]) => k.startsWith(`${key}:`))
        .forEach(([k, v]) => {
          result[k.replace(`${key}:`, '')] = JSON.parse(v);
        });
      return result;
    }
  },

  async del(key: string) {
    try {
      const client = await getRedisClient();
      if (!client) {
        // Use in-memory store during build
        Object.keys(inMemoryStore)
          .filter(k => k.startsWith(`${key}:`))
          .forEach(k => delete inMemoryStore[k]);
        return 1;
      }
      return client.del(key);
    } catch (error) {
      console.error('Redis del error, using in-memory store:', error);
      Object.keys(inMemoryStore)
        .filter(k => k.startsWith(`${key}:`))
        .forEach(k => delete inMemoryStore[k]);
      return 1;
    }
  },

  async set(key: string, value: string) {
    try {
      const client = await getRedisClient();
      if (!client) {
        // Use in-memory store during build
        inMemoryStore[key] = value;
        return 'OK';
      }
      return client.set(key, value);
    } catch (error) {
      console.error('Redis set error, using in-memory store:', error);
      inMemoryStore[key] = value;
      return 'OK';
    }
  },

  async get(key: string) {
    try {
      const client = await getRedisClient();
      if (!client) {
        // Use in-memory store during build
        return inMemoryStore[key] || null;
      }
      return client.get(key);
    } catch (error) {
      console.error('Redis get error, using in-memory store:', error);
      return inMemoryStore[key] || null;
    }
  }
};

export { devStore as redis }; 