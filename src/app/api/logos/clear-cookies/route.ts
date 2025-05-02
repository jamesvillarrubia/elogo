import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { Logo } from '@/types';
import { cookies } from 'next/headers';
import { calculateNewRatings } from '@/lib/elo';

const VOTE_HISTORY_COOKIE = 'elo_voter_history';
const USER_ID_COOKIE = 'elo_voter_user_id';
const K_FACTOR = 32; // ELO K-factor used in rating calculations

export async function POST() {
  try {
    console.log('Clear cookies route: Starting cookie clearing process');
    
    // Get the user's vote history from cookies
    const cookieStore = cookies();
    const voteHistoryCookie = cookieStore.get(VOTE_HISTORY_COOKIE);
    
    if (!voteHistoryCookie) {
      console.log('Clear cookies route: No vote history found');
      return NextResponse.json({ success: true });
    }

    try {
      const voteHistory = JSON.parse(decodeURIComponent(voteHistoryCookie.value));
      const userComparisons = voteHistory.logoComparisons || [];
      
      if (userComparisons.length === 0) {
        console.log('Clear cookies route: No comparisons to remove');
        return NextResponse.json({ success: true });
      }

      // Get all logos from Redis
      console.log('Clear cookies route: Fetching all logos from Redis');
      const allLogos = await redis.hgetall('logos');
      
      if (!allLogos) {
        return NextResponse.json({ success: true });
      }

      // Parse all logos and create a map for easy access
      const logosMap = Object.entries(allLogos).reduce((acc, [id, logoStr]) => {
        acc[id] = JSON.parse(logoStr as string);
        return acc;
      }, {} as Record<string, Logo>);

      // Process each comparison in reverse order
      for (let i = userComparisons.length - 1; i >= 0; i--) {
        const comparison = userComparisons[i];
        const [id1, id2] = comparison.split('-');
        const logo1 = logosMap[id1];
        const logo2 = logosMap[id2];
        
        if (logo1 && logo2) {
          // Determine which was winner and loser based on their ratings at the time of the vote
          const [winnerId, loserId] = logo1.eloRating > logo2.eloRating ? [id1, id2] : [id2, id1];
          const winner = logosMap[winnerId];
          const loser = logosMap[loserId];
          
          // Calculate what the ratings would have been before this match
          const expectedWinner = 1 / (1 + Math.pow(10, (loser.eloRating - winner.eloRating) / 400));
          const ratingChange = K_FACTOR * (1 - expectedWinner);
          
          // Undo the rating changes
          winner.eloRating -= ratingChange;
          loser.eloRating += ratingChange;
          
          // Reduce match counts
          winner.totalMatches = Math.max(0, winner.totalMatches - 1);
          loser.totalMatches = Math.max(0, loser.totalMatches - 1);
          
          // Update the map
          logosMap[winnerId] = winner;
          logosMap[loserId] = loser;
        }
      }

      // Convert the updated logos map back to Redis format
      const updatedLogos = Object.entries(logosMap).reduce((acc, [id, logo]) => {
        acc[id] = JSON.stringify(logo);
        return acc;
      }, {} as Record<string, string>);

      // Update Redis with the modified logos
      console.log('Clear cookies route: Updating Redis with modified logos');
      await redis.hset('logos', updatedLogos);
    } catch (error) {
      console.error('Clear cookies route: Error parsing vote history:', error);
    }

    // Create response
    const response = NextResponse.json({ success: true });

    // Clear only this user's cookies
    console.log('Clear cookies route: Setting cookies to expire');
    response.cookies.set(VOTE_HISTORY_COOKIE, '', {
      path: '/',
      expires: new Date(0),
      httpOnly: true,
      sameSite: 'lax'
    });

    response.cookies.set(USER_ID_COOKIE, '', {
      path: '/',
      expires: new Date(0),
      httpOnly: true,
      sameSite: 'lax'
    });

    console.log('Clear cookies route: Cookie clearing complete');
    return response;

  } catch (error: any) {
    console.error('Clear cookies route: Error clearing cookies:', error);
    console.error('Clear cookies route: Error details:', {
      message: error?.message,
      stack: error?.stack
    });
    return NextResponse.json(
      { error: 'Failed to clear cookies' },
      { status: 500 }
    );
  }
} 