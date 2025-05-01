import { createClient } from 'redis';

interface Logo {
  id: string;
  name: string;
  url: string;
  eloRating: number;
  totalMatches: number;
}

async function initDb() {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const client = createClient({ url: redisUrl });

  try {
    console.log('Connecting to Redis...');
    await client.connect();
    console.log('Connected successfully');

    // Sample logos
    const logos: Logo[] = [
      {
        id: 'logo_1',
        name: 'Twitter',
        url: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Logo_of_Twitter.svg',
        eloRating: 1400,
        totalMatches: 0
      },
      {
        id: 'logo_2',
        name: 'Facebook',
        url: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png',
        eloRating: 1400,
        totalMatches: 0
      },
      {
        id: 'logo_3',
        name: 'Google',
        url: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
        eloRating: 1400,
        totalMatches: 0
      }
    ];

    // Store logos in Redis
    console.log('Storing logos...');
    const logosMap: Record<string, string> = {};
    for (const logo of logos) {
      logosMap[logo.id] = JSON.stringify(logo);
    }
    await client.hSet('logos', logosMap);
    console.log('Logos stored successfully');

  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  } finally {
    await client.quit();
    console.log('Redis connection closed');
  }
}

initDb(); 