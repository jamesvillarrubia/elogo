import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { Logo, LogoPair } from '@/types';
import { getVoteHistory, hasBeenCompared } from '@/lib/cookies';

export async function GET(request: Request) {
  try {
    console.log('Random-pair route: Starting request processing');
    
    // Get all logos from Redis
    console.log('Random-pair route: Fetching logos from Redis');
    const rawLogos = await redis.hgetall('logos');
    console.log('Random-pair route: Raw logos from Redis:', rawLogos);
    
    if (!rawLogos || Object.keys(rawLogos).length === 0) {
      console.error('Random-pair route: No logos found in Redis');
      return NextResponse.json(
        { error: 'No logos available' },
        { status: 400 }
      );
    }

    // Parse logos from JSON strings
    console.log('Random-pair route: Parsing logos from Redis data');
    const logos: Logo[] = Object.values(rawLogos).map(logoStr => {
      try {
        return JSON.parse(logoStr as string);
      } catch (err) {
        console.error('Random-pair route: Error parsing logo:', err);
        throw new Error('Invalid logo data in Redis');
      }
    });
    console.log('Random-pair route: Parsed logos:', logos);

    if (logos.length < 2) {
      console.error('Random-pair route: Insufficient logos available:', logos.length);
      return NextResponse.json(
        { error: 'Insufficient logos available' },
        { status: 400 }
      );
    }

    // Get user's vote history from cookies
    const cookieHeader = request.headers.get('cookie');
    console.log('Random-pair route: Cookie header:', cookieHeader);
    
    // Since we're on the server, we need to parse the cookie manually
    let voteHistory: { logoComparisons: Set<string> } = { logoComparisons: new Set() };
    if (cookieHeader) {
      const historyCookie = cookieHeader
        .split(';')
        .find(c => c.trim().startsWith('elo_voter_history='));
      
      if (historyCookie) {
        try {
          console.log('Random-pair route: Found history cookie');
          const historyValue = historyCookie.split('=')[1];
          console.log('Random-pair route: Raw history value:', historyValue);
          const decodedValue = decodeURIComponent(historyValue);
          console.log('Random-pair route: Decoded history value:', decodedValue);
          const parsed = JSON.parse(decodedValue);
          console.log('Random-pair route: Parsed history:', parsed);
          
          // Normalize all comparison keys to be sorted and use actual logo IDs
          const normalizedComparisons = (parsed.logoComparisons || []).map((key: string) => {
            const [id1, id2] = key.split('-');
            return [id1, id2].sort().join('-');
          });
          voteHistory.logoComparisons = new Set(normalizedComparisons);
          console.log('Random-pair route: Normalized comparisons:', Array.from(voteHistory.logoComparisons));
        } catch (err) {
          console.error('Random-pair route: Error parsing vote history:', err);
          // If there's an error parsing, start with an empty set
          voteHistory.logoComparisons = new Set();
        }
      }
    }

    // Calculate total possible comparisons
    const totalPossibleComparisons = (logos.length * (logos.length - 1)) / 2;
    console.log('Random-pair route: Total possible comparisons:', totalPossibleComparisons);
    console.log('Random-pair route: Current comparisons made:', voteHistory.logoComparisons.size);

    // Check if all comparisons have been made
    if (voteHistory.logoComparisons.size >= totalPossibleComparisons) {
      console.log('Random-pair route: All comparisons have been made');
      return NextResponse.json(
        { allComparisonsComplete: true },
        { status: 400 }
      );
    }

    // Find a random pair that hasn't been compared yet
    console.log('Random-pair route: Finding new comparison pair');
    let attempts = 0;
    const maxAttempts = 100; // Prevent infinite loops
    
    while (attempts < maxAttempts) {
      const randomIndex1 = Math.floor(Math.random() * logos.length);
      let randomIndex2;
      do {
        randomIndex2 = Math.floor(Math.random() * logos.length);
      } while (randomIndex2 === randomIndex1);

      const logo1 = logos[randomIndex1];
      const logo2 = logos[randomIndex2];
      const comparisonKey = [logo1.id, logo2.id].sort().join('-');

      if (!voteHistory.logoComparisons.has(comparisonKey)) {
        console.log('Random-pair route: Found new comparison:', {
          logo1: logo1.name,
          logo2: logo2.name,
          comparisonKey
        });
        return NextResponse.json({
          logo1,
          logo2
        });
      }

      attempts++;
    }

    console.error('Random-pair route: Failed to find new comparison after', maxAttempts, 'attempts');
    return NextResponse.json(
      { error: 'Failed to find new comparison' },
      { status: 500 }
    );

  } catch (error: any) {
    console.error('Random-pair route: Error:', error);
    console.error('Random-pair route: Error details:', {
      message: error?.message,
      stack: error?.stack
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 