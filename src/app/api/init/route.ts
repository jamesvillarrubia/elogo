import { redis } from '@/lib/redis';
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import crypto from 'crypto';
import { NextResponse } from 'next/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Generate a deterministic ID based on the URL
function generateLogoId(url: string): string {
  return `logo_${crypto.createHash('md5').update(url).digest('hex').slice(0, 8)}`;
}

export async function POST() {
  try {
    console.log('Starting data initialization...');
    
    // Read YAML file
    const yamlPath = path.join(process.cwd(), 'data', 'logos.yml');
    const yamlContent = fs.readFileSync(yamlPath, 'utf8');
    const config = yaml.load(yamlContent) as { designBrief: string; logos: { name: string; url: string }[] };
    
    // Store the design brief
    await redis.set('design_brief', config.designBrief);
    console.log('Design brief stored');
    
    // Clear existing logo data
    console.log('Clearing existing logo data...');
    await redis.del('logos');
    
    // Add logos with generated IDs and default values
    console.log('Adding logos...');
    for (const logo of config.logos) {
      const logoWithDefaults = {
        ...logo,
        id: generateLogoId(logo.url),
        eloRating: 1400,
        totalMatches: 0
      };
      
      await redis.hset('logos', { [logoWithDefaults.id]: JSON.stringify(logoWithDefaults) });
    }
    
    // Verify the data was stored
    const storedLogos = await redis.hgetall('logos');
    const logoCount = Object.keys(storedLogos || {}).length;
    
    return NextResponse.json({ 
      success: true, 
      message: `Initialized ${logoCount} logos and design brief` 
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error initializing data:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
} 