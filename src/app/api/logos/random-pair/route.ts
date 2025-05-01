import { redis } from '@/lib/redis';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function GET() {
  try {
    // Get all logos from Redis
    const logos = await redis.hgetall('logos');
    if (!logos) {
      return NextResponse.json({ error: 'No logos found' }, { status: 404, headers: corsHeaders });
    }

    // Parse logos and convert to array
    const logosArray = Object.values(logos).map(logo => JSON.parse(logo as string));
    if (logosArray.length < 2) {
      return NextResponse.json({ error: 'Not enough logos for comparison' }, { status: 400, headers: corsHeaders });
    }

    // Get previously compared pairs from cookies
    const cookieStore = cookies();
    const comparedPairs = cookieStore.get('compared_pairs')?.value;
    const comparedPairsSet = new Set(comparedPairs ? comparedPairs.split(',') : []);

    // Find a new pair that hasn't been compared
    let attempts = 0;
    const maxAttempts = 100;
    let logo1, logo2;

    while (attempts < maxAttempts) {
      const randomIndex1 = Math.floor(Math.random() * logosArray.length);
      let randomIndex2;
      do {
        randomIndex2 = Math.floor(Math.random() * logosArray.length);
      } while (randomIndex2 === randomIndex1);

      logo1 = logosArray[randomIndex1];
      logo2 = logosArray[randomIndex2];

      const pairKey = `${logo1.id}-${logo2.id}`;
      const reversePairKey = `${logo2.id}-${logo1.id}`;

      if (!comparedPairsSet.has(pairKey) && !comparedPairsSet.has(reversePairKey)) {
        break;
      }

      attempts++;
    }

    if (attempts === maxAttempts) {
      return NextResponse.json({ error: 'All possible comparisons have been made' }, { status: 400, headers: corsHeaders });
    }

    return NextResponse.json({ logo1, logo2 }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error fetching random pair:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
} 