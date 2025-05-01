import { createClient } from 'redis';
import { Logo } from '../types/logo';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// In-memory store for development
let inMemoryStore: Record<string, string> = {};

// Redis client singleton
let redisClient: ReturnType<typeof createClient> | null = null;

async function getRedisClient() {
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
      return client.hGetAll(key);
    } catch (error) {
      console.error('Redis hgetall error, using in-memory store:', error);
      const result: Record<string, string> = {};
      Object.entries(inMemoryStore).forEach(([k, v]) => {
        if (k.startsWith(`${key}:`)) {
          result[k.replace(`${key}:`, '')] = v;
        }
      });
      return result;
    }
  },

  async del(key: string) {
    try {
      const client = await getRedisClient();
      return client.del(key);
    } catch (error) {
      console.error('Redis del error, using in-memory store:', error);
      Object.keys(inMemoryStore).forEach(k => {
        if (k.startsWith(`${key}:`)) {
          delete inMemoryStore[k];
        }
      });
      return 1;
    }
  },

  async set(key: string, value: string) {
    try {
      const client = await getRedisClient();
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
      return client.get(key);
    } catch (error) {
      console.error('Redis get error, using in-memory store:', error);
      return inMemoryStore[key] || null;
    }
  }
};

export { devStore as redis }; 