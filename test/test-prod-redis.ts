import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from 'redis';

// Load environment variables from .env.development.local
config({ path: resolve(process.cwd(), '.env.development.local') });

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.error('REDIS_URL not found in .env.development.local');
  process.exit(1);
}

async function testRedisConnection() {
  console.log('Testing Redis connection with URL:', redisUrl);
  
  const client = createClient({
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

  client.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  try {
    await client.connect();
    console.log('Successfully connected to Redis');

    // Test basic operations
    console.log('\nTesting Redis operations...');
    
    // 1. Test GET operation on design brief
    console.log('\nFetching design brief...');
    const designBrief = await client.get('design_brief');
    console.log('Design brief:', designBrief || 'Not found');

    // 2. Test HGETALL operation on logos
    console.log('\nFetching all logos...');
    const logos = await client.hGetAll('logos');
    console.log('Logos:', logos);
    console.log('Number of logos:', Object.keys(logos).length);

    // Print each logo's details
    Object.entries(logos).forEach(([key, value]) => {
      try {
        const logo = JSON.parse(value);
        console.log(`\nLogo ${key}:`, {
          name: logo.name,
          eloRating: logo.eloRating,
          totalMatches: logo.totalMatches
        });
      } catch (error) {
        console.error(`Error parsing logo ${key}:`, error);
      }
    });

  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    process.exit(1);
  } finally {
    await client.quit();
    console.log('\nRedis connection closed');
  }
}

testRedisConnection(); 