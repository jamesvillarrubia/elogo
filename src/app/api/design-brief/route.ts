import { redis } from '@/lib/redis';
import { NextResponse } from 'next/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function GET() {
  try {
    const designBrief = await redis.get('design_brief');
    if (!designBrief) {
      return NextResponse.json({ error: 'Design brief not found' }, { status: 404, headers: corsHeaders });
    }
    return NextResponse.json({ designBrief }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error fetching design brief:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
} 