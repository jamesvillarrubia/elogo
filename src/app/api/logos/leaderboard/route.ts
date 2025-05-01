import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { LeaderboardEntry } from '@/types';

export async function GET() {
  try {
    // Get all logos from Redis
    const logos = await redis.hgetall('logos') as Record<string, string>;
    const logoArray = Object.values(logos).map(logoStr => JSON.parse(logoStr) as LeaderboardEntry);

    // Sort by ELO rating
    const sortedLogos = logoArray.sort((a, b) => b.eloRating - a.eloRating);

    // Calculate win rates
    const entries = sortedLogos.map(logo => ({
      ...logo,
      winRate: logo.totalMatches > 0 ? 
        (logo.eloRating - 1400) / (logo.totalMatches * 32) : 
        undefined
    }));

    return NextResponse.json(entries);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 