import { redis } from '@/lib/redis';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { VoteHistory } from '@/types';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const VOTE_HISTORY_COOKIE = 'elo_voter_history';

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

    // Get vote history from cookies
    const cookieStore = cookies();
    const voteHistoryCookie = cookieStore.get(VOTE_HISTORY_COOKIE);
    let voteHistory: VoteHistory = { userId: '', logoComparisons: new Set() };
    
    if (voteHistoryCookie) {
      try {
        const parsedHistory = JSON.parse(decodeURIComponent(voteHistoryCookie.value));
        voteHistory = {
          userId: parsedHistory.userId || '',
          logoComparisons: new Set(parsedHistory.logoComparisons || [])
        };
      } catch (e) {
        console.error('Error parsing vote history cookie:', e);
      }
    }

    // Calculate total possible comparisons
    const totalPossibleComparisons = (logosArray.length * (logosArray.length - 1)) / 2;

    // If all possible comparisons have been made, return error
    if (voteHistory.logoComparisons.size >= totalPossibleComparisons) {
      return NextResponse.json(
        { error: 'All possible comparisons have been made', allComparisonsComplete: true },
        { status: 400, headers: corsHeaders }
      );
    }

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

      const pairKey = [logo1.id, logo2.id].sort().join('-');
      
      if (!voteHistory.logoComparisons.has(pairKey)) {
        break;
      }

      attempts++;
    }

    if (attempts === maxAttempts) {
      return NextResponse.json(
        { error: 'All possible comparisons have been made', allComparisonsComplete: true },
        { status: 400, headers: corsHeaders }
      );
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