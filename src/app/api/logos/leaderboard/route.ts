import { redis } from '@/lib/redis';
import { NextResponse } from 'next/server';
import { Logo } from '@/types';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const K_FACTOR = 32; // ELO K-factor used in rating calculations

export async function GET() {
  try {
    // Get all logos from Redis
    const logos = await redis.hgetall('logos');
    if (!logos) {
      return NextResponse.json({ error: 'No logos found' }, { status: 404, headers: corsHeaders });
    }

    // Parse logos and calculate win rates
    const logosArray = Object.values(logos)
      .map(logo => {
        const parsedLogo = JSON.parse(logo as string) as Logo;
        // Calculate win rate based on ELO rating difference from 1400
        // A rating of 1400 means 50% win rate
        // Each 32 points (K_FACTOR) difference represents one full win/loss
        const ratingDiff = parsedLogo.eloRating - 1400;
        const winRate = parsedLogo.totalMatches > 0 ? 
          0.5 + (ratingDiff / (K_FACTOR * parsedLogo.totalMatches)) : 0;
        
        return {
          ...parsedLogo,
          // Ensure win rate stays between 0 and 1
          winRate: Math.max(0, Math.min(1, winRate))
        };
      })
      .sort((a, b) => b.eloRating - a.eloRating);

    return NextResponse.json(logosArray, { headers: corsHeaders });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
} 