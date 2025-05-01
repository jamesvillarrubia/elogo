/**
 * Script to import logos from YAML to Redis while preserving existing vote values
 * This script is designed to run during the Vercel build process
 */

import { redis } from '../src/lib/redis';
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import crypto from 'crypto';

// Generate a deterministic ID based on the URL
function generateLogoId(url: string): string {
  return `logo_${crypto.createHash('md5').update(url).digest('hex').slice(0, 8)}`;
}

// Helper function to safely parse Redis values
function parseRedisValue(value: any): any {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (e) {
      return value;
    }
  }
  return value;
}

async function importLogos() {
  try {
    console.log('Starting logo import process...');
    
    // Read YAML file
    const yamlPath = path.join(process.cwd(), 'data', 'logos.yml');
    const yamlContent = fs.readFileSync(yamlPath, 'utf8');
    const config = yaml.load(yamlContent) as { designBrief: string; logos: { name: string; url: string }[] };
    
    // Store the design brief
    await redis.set('design_brief', config.designBrief);
    console.log('Design brief stored');
    
    // Get existing logos from Redis
    console.log('Fetching existing logos from Redis...');
    const existingLogos = await redis.hgetall('logos');
    
    // Create a map of existing logos by URL for quick lookup
    const existingLogosByUrl = new Map<string, any>();
    if (existingLogos) {
      Object.values(existingLogos).forEach(logoStr => {
        const logo = parseRedisValue(logoStr);
        existingLogosByUrl.set(logo.url, logo);
      });
    }
    
    // Process each logo from YAML
    console.log('Processing logos from YAML...');
    const logosToUpdate: Record<string, string> = {};
    
    for (const logo of config.logos) {
      const logoId = generateLogoId(logo.url);
      const existingLogo = existingLogosByUrl.get(logo.url);
      
      if (existingLogo) {
        // Preserve existing vote data
        logosToUpdate[logoId] = JSON.stringify({
          ...logo,
          id: logoId,
          eloRating: existingLogo.eloRating,
          totalMatches: existingLogo.totalMatches
        });
        console.log(`Preserved existing data for logo ${logo.name}`);
      } else {
        // New logo, use default values
        logosToUpdate[logoId] = JSON.stringify({
          ...logo,
          id: logoId,
          eloRating: 1400,
          totalMatches: 0
        });
        console.log(`Added new logo ${logo.name}`);
      }
    }
    
    // Update Redis with the processed logos
    if (Object.keys(logosToUpdate).length > 0) {
      console.log('Updating Redis with processed logos...');
      await redis.hset('logos', logosToUpdate);
      console.log('Logo import completed successfully');
    } else {
      console.log('No logos to update');
    }
    
  } catch (error) {
    console.error('Error during logo import:', error);
    process.exit(1);
  }
}

// Run the import process
importLogos(); 