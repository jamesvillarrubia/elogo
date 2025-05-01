import { redis } from '@/lib/redis';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const designBrief = await redis.get('design_brief');
    if (!designBrief) {
      return NextResponse.json({ error: 'Design brief not found' }, { status: 404 });
    }
    return NextResponse.json({ designBrief });
  } catch (error) {
    console.error('Error fetching design brief:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 