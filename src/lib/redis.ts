import { createClient } from 'redis';
import { Logo } from '../types/logo';

// Check if we're in a build environment
const isBuild = process.env.NEXT_PHASE === 'phase-production-build';
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Redis client singleton
let redisClient: ReturnType<typeof createClient> | null = null;

async function getRedisClient() {
  // Use in-memory store during build
  if (isBuild) {
    console.log('Build environment detected, using in-memory store');
    return null;
  }

  if (!redisClient) {
    console.log('Creating new Redis client with URL:', redisUrl);
    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          console.log(`Redis reconnection attempt ${retries}`);
          if (retries > 10) {
            console.error('Redis reconnection failed after 10 attempts');
            return new Error('Redis reconnection failed');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
      console.error('Redis URL:', redisUrl);
      redisClient = null;
    });

    try {
      await redisClient.connect();
      console.log('Redis client connected successfully');
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      console.error('Redis URL:', redisUrl);
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
      if (!client) {
        throw new Error('Redis client not available');
      }
      return client.hSet(key, value);
    } catch (error) {
      console.error('Redis hset error:', error);
      throw error;
    }
  },

  async hget(key: string, field: string) {
    try {
      const client = await getRedisClient();
      if (!client) {
        throw new Error('Redis client not available');
      }
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
      if (!client) {
        throw new Error('Redis client not available');
      }
      return client.hGetAll(key);
    } catch (error) {
      console.error('Redis hgetall error:', error);
      throw error;
    }
  },

  async del(key: string) {
    try {
      const client = await getRedisClient();
      if (!client) {
        throw new Error('Redis client not available');
      }
      return client.del(key);
    } catch (error) {
      console.error('Redis del error:', error);
      throw error;
    }
  },

  async set(key: string, value: string) {
    try {
      const client = await getRedisClient();
      if (!client) {
        throw new Error('Redis client not available');
      }
      return client.set(key, value);
    } catch (error) {
      console.error('Redis set error:', error);
      throw error;
    }
  },

  async get(key: string) {
    try {
      const client = await getRedisClient();
      if (!client) {
        throw new Error('Redis client not available');
      }
      return client.get(key);
    } catch (error) {
      console.error('Redis get error:', error);
      throw error;
    }
  }
};

export { store as redis }; 