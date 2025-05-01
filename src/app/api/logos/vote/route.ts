import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { Logo } from '@/types';
import { calculateNewRatings } from '@/lib/elo';

const VOTE_HISTORY_COOKIE = 'elo_voter_history';
const USER_ID_COOKIE = 'elo_voter_user_id';

export async function POST(request: Request) {
  try {
    console.log('Vote route: Starting request processing');
    const { winnerId, loserId } = await request.json();
    console.log('Vote route: Received vote for winner:', winnerId, 'loser:', loserId);
    
    if (!winnerId || !loserId) {
      console.log('Vote route: Missing winnerId or loserId');
      return NextResponse.json(
        { error: 'Missing winnerId or loserId' },
        { status: 400 }
      );
    }

    // Get current ratings from Redis
    console.log('Vote route: Fetching logos from Redis');
    const winnerStr = await redis.hget('logos', winnerId);
    const loserStr = await redis.hget('logos', loserId);

    if (!winnerStr || !loserStr) {
      console.log('Vote route: One or both logos not found in Redis');
      return NextResponse.json(
        { error: 'One or both logos not found' },
        { status: 404 }
      );
    }

    console.log('Vote route: Parsing logo data from Redis');
    const winner: Logo = winnerStr as unknown as Logo;
    const loser: Logo = loserStr as unknown as Logo;
    console.log('Vote route: Current ratings - winner:', winner.eloRating, 'loser:', loser.eloRating);

    // Calculate new ratings
    const [newWinnerRating, newLoserRating] = calculateNewRatings(
      winner.eloRating,
      loser.eloRating
    );
    console.log('Vote route: New ratings - winner:', newWinnerRating, 'loser:', newLoserRating);

    // Update logos in Redis
    const updatedWinner: Logo = {
      ...winner,
      eloRating: newWinnerRating,
      totalMatches: winner.totalMatches + 1
    };

    const updatedLoser: Logo = {
      ...loser,
      eloRating: newLoserRating,
      totalMatches: loser.totalMatches + 1
    };

    console.log('Vote route: Updating logos in Redis');
    await redis.hset('logos', {
      [winnerId]: JSON.stringify(updatedWinner),
      [loserId]: JSON.stringify(updatedLoser)
    });

    // Get the vote history cookie
    const cookieHeader = request.headers.get('cookie');
    console.log('Vote route: Cookie header:', cookieHeader);
    
    let userId = '';
    let logoComparisons = new Set<string>();
    
    if (cookieHeader) {
      // Get user ID
      const userIdCookie = cookieHeader
        .split(';')
        .find(c => c.trim().startsWith(`${USER_ID_COOKIE}=`));
      
      if (userIdCookie) {
        userId = userIdCookie.split('=')[1].trim();
        console.log('Vote route: Found user ID:', userId);
      }

      // Get vote history
      const historyValue = cookieHeader
        .split(';')
        .find(c => c.trim().startsWith(`${VOTE_HISTORY_COOKIE}=`));
      
      if (historyValue) {
        try {
          console.log('Vote route: Found history cookie:', historyValue);
          const cookieValue = historyValue.split('=')[1].trim();
          console.log('Vote route: Raw cookie value:', cookieValue);
          const decodedValue = decodeURIComponent(cookieValue);
          console.log('Vote route: Decoded cookie value:', decodedValue);
          const parsed = JSON.parse(decodedValue);
          console.log('Vote route: Parsed cookie data:', parsed);
          const normalizedComparisons = (parsed.logoComparisons || []).map((key: string) => {
            const [id1, id2] = key.split('-');
            return [id1, id2].sort().join('-');
          });
          logoComparisons = new Set(normalizedComparisons);
          console.log('Vote route: Normalized comparisons:', Array.from(logoComparisons));
        } catch (err: any) {
          console.error('Vote route: Error parsing vote history cookie:', err);
          console.error('Vote route: Error details:', {
            message: err?.message,
            stack: err?.stack
          });
        }
      }
    }

    // Create response with updated ratings
    const response = NextResponse.json({
      winner: updatedWinner,
      loser: updatedLoser
    });

    // Update the vote history cookie
    const comparisonKey = [winnerId, loserId].sort().join('-');
    console.log('Vote route: New comparison key:', comparisonKey);
    
    // Add the new comparison if it doesn't exist
    if (!logoComparisons.has(comparisonKey)) {
      console.log('Vote route: Adding new comparison to history');
      logoComparisons.add(comparisonKey);
      
      // Set the updated cookie
      const cookieValue = JSON.stringify({ 
        userId,
        logoComparisons: Array.from(logoComparisons)
      });
      console.log('Vote route: New cookie value:', cookieValue);
      
      response.cookies.set(VOTE_HISTORY_COOKIE, cookieValue, {
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        httpOnly: true,
        sameSite: 'lax'
      });
    } else {
      console.log('Vote route: Comparison already exists in history');
    }

    console.log('Vote route: Request processing complete');
    return response;

  } catch (error: any) {
    console.error('Vote route: Error in vote route:', error);
    console.error('Vote route: Error details:', {
      message: error?.message,
      stack: error?.stack
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 