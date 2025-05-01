import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

const VOTE_HISTORY_COOKIE = 'elo_voter_history';
const USER_ID_COOKIE = 'elo_voter_user_id';

export async function POST() {
  try {
    console.log('Clear cookies route: Starting cookie clearing process');
    
    // Reset all logo ratings to 1400
    console.log('Clear cookies route: Fetching all logos from Redis');
    const allLogos = await redis.hgetall('logos');
    console.log('Clear cookies route: Found logos:', allLogos);

    if (allLogos) {
      console.log('Clear cookies route: Resetting logo ratings');
      const resetLogos = Object.entries(allLogos).map(([id, logoStr]) => {
        const logo = JSON.parse(logoStr as string);
        return {
          [id]: JSON.stringify({
            ...logo,
            eloRating: 1400,
            totalMatches: 0
          })
        };
      });

      console.log('Clear cookies route: Updating Redis with reset logos');
      await redis.hset('logos', Object.assign({}, ...resetLogos));
    }

    // Create response
    const response = NextResponse.json({ success: true });

    // Clear cookies by setting them to expire in the past
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