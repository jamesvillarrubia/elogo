/**
 * Script to clear the local Redis database
 * Usage: tsx scripts/clear-redis.ts
 */

import { createClient } from 'redis';

const client = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

client.on('error', (err) => {
  console.error('Redis Client Error:', err);
  process.exit(1);
});

async function clearRedis() {
  try {
    await client.connect();
    console.log('Connected to Redis');
    
    // Flush all keys
    await client.flushAll();
    console.log('Redis database cleared successfully');
    
    await client.quit();
    console.log('Disconnected from Redis');
  } catch (error) {
    console.error('Error clearing Redis:', error);
    process.exit(1);
  }
}

clearRedis(); 