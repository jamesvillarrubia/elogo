import { createClient } from 'redis';
import { Logo } from '../src/types';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.development.local
config({ path: resolve(process.cwd(), '.env.development.local') });

async function testProductionRedis() {
  console.log('Testing production Redis connection...');

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.error('Error: REDIS_URL not found in .env.development.local');
    process.exit(1);
  }

  console.log('Using Redis URL:', redisUrl);
  const client = createClient({
    url: redisUrl
  });

  try {
    await client.connect();
    console.log('Connected to production Redis successfully');

    // Check design brief
    const designBrief = await client.get('design_brief');
    console.log('\nDesign Brief exists:', !!designBrief);

    // Check logos
    const logos = await client.hGetAll('logos');
    console.log('\nLogos in database:', Object.keys(logos || {}).length);
    
    if (logos) {
      console.log('\nLogo details:');
      for (const [key, value] of Object.entries(logos)) {
        const logo = JSON.parse(value as string) as Logo;
        console.log(`- ${logo.name}:`);
        console.log(`  ELO Rating: ${logo.eloRating}`);
        console.log(`  Total Matches: ${logo.totalMatches}`);
        console.log(`  URL: ${logo.url}`);
        console.log('');
      }
    }

  } catch (error) {
    console.error('Error connecting to production Redis:', error);
    process.exit(1);
  } finally {
    await client.quit();
    console.log('Redis connection closed');
  }
}

testProductionRedis(); 