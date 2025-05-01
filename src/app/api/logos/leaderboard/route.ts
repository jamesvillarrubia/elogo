import { redis } from '@/lib/redis';
import { NextResponse } from 'next/server';

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

    // Parse logos and sort by ELO rating
    const logosArray = Object.values(logos)
      .map(logo => JSON.parse(logo as string))
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