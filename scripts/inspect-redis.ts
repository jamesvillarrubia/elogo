/**
 * Script to inspect Redis data in a readable format
 * Usage: tsx scripts/inspect-redis.ts
 */

import { createClient } from 'redis';

async function inspectRedis() {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const client = createClient({ url: redisUrl });

  try {
    console.log('Connecting to Redis...');
    await client.connect();
    console.log('Connected successfully\n');

    // Get all keys
    console.log('Fetching all keys...');
    const keys = await client.keys('*');
    console.log('Found keys:', keys, '\n');

    // Inspect each key
    for (const key of keys) {
      console.log(`\n=== ${key} ===`);
      
      // Check if it's a hash
      const type = await client.type(key);
      
      if (type === 'hash') {
        // Get all fields and values
        const hashData = await client.hGetAll(key);
        console.log('Hash data:');
        Object.entries(hashData).forEach(([field, value]) => {
          try {
            const parsed = JSON.parse(value);
            console.log(`  ${field}:`, JSON.stringify(parsed, null, 2));
          } catch {
            console.log(`  ${field}:`, value);
          }
        });
      } else {
        // Get the value
        const value = await client.get(key);
        try {
          const parsed = JSON.parse(value || '');
          console.log('Value:', JSON.stringify(parsed, null, 2));
        } catch {
          console.log('Value:', value);
        }
      }
    }

  } catch (error) {
    console.error('Error inspecting Redis:', error);
    process.exit(1);
  } finally {
    await client.quit();
    console.log('\nRedis connection closed');
  }
}

// Run the inspection
inspectRedis(); 