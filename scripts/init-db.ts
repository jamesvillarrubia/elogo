import { kv } from '@vercel/kv';

interface Logo {
  id: string;
  url: string;
  name: string;
  eloRating: number;
  totalMatches: number;
}

const sampleLogos: Logo[] = [
  {
    id: 'file',
    url: '/file.svg',
    name: 'File Logo',
    eloRating: 1000,
    totalMatches: 0
  },
  {
    id: 'globe',
    url: '/globe.svg',
    name: 'Globe Logo',
    eloRating: 1000,
    totalMatches: 0
  },
  {
    id: 'next',
    url: '/next.svg',
    name: 'Next.js Logo',
    eloRating: 1000,
    totalMatches: 0
  },
  {
    id: 'vercel',
    url: '/vercel.svg',
    name: 'Vercel Logo',
    eloRating: 1000,
    totalMatches: 0
  },
  {
    id: 'window',
    url: '/window.svg',
    name: 'Window Logo',
    eloRating: 1000,
    totalMatches: 0
  }
];

async function initializeDatabase() {
  try {
    console.log('Clearing existing data...');
    await kv.del('logos');
    
    console.log('Adding sample logos...');
    for (const logo of sampleLogos) {
      await kv.hset('logos', {
        [logo.id]: JSON.stringify(logo)
      });
    }
    
    console.log('Database initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase(); 