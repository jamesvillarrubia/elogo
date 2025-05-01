import { createClient } from 'redis';
import { Logo } from '../types/logo';

// Redis client singleton
let redisClient: ReturnType<typeof createClient> | null = null;

// Check if we're in a build environment
const isBuild = process.env.NEXT_PHASE === 'phase-production-build';

async function getRedisClient() {
  if (isBuild) {
    console.log('Build environment detected, skipping Redis operations');
    return null;
  }

  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    console.log('Creating Redis client with URL:', redisUrl);
    
    redisClient = createClient({ url: redisUrl });

    redisClient.on('error', (error) => {
      console.error('Redis client error:', error);
    });

    try {
      await redisClient.connect();
      console.log('Redis client connected successfully');
    } catch (error) {
      console.error('Redis connection error:', error);
      redisClient = null;
      throw error;
    }
  }

  return redisClient;
}

// Redis store implementation
const store = {
  async hset(key: string, value: Record<string, any>) {
    try {
      const client = await getRedisClient();
      if (!client) return 0;
      return await client.hSet(key, value);
    } catch (error) {
      console.error('Redis hset error:', error);
      throw error;
    }
  },

  async hget(key: string, field: string) {
    try {
      const client = await getRedisClient();
      if (!client) return null;
      const value = await client.hGet(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis hget error:', error);
      throw error;
    }
  },

  async hgetall(key: string) {
    try {
      const client = await getRedisClient();
      if (!client) return null;
      return await client.hGetAll(key);
    } catch (error) {
      console.error('Redis hgetall error:', error);
      throw error;
    }
  },

  async del(key: string) {
    try {
      const client = await getRedisClient();
      if (!client) return 0;
      return await client.del(key);
    } catch (error) {
      console.error('Redis del error:', error);
      throw error;
    }
  },

  async set(key: string, value: string) {
    try {
      const client = await getRedisClient();
      if (!client) return 'OK';
      return await client.set(key, value);
    } catch (error) {
      console.error('Redis set error:', error);
      throw error;
    }
  },

  async get(key: string) {
    try {
      const client = await getRedisClient();
      if (!client) return null;
      return await client.get(key);
    } catch (error) {
      console.error('Redis get error:', error);
      throw error;
    }
  },

  async quit() {
    try {
      if (redisClient) {
        await redisClient.quit();
        redisClient = null;
        console.log('Redis connection closed');
      }
    } catch (error) {
      console.error('Error closing Redis connection:', error);
      throw error;
    }
  }
};

export { store as redis }; 