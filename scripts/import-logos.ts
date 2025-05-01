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
      console.error('Error parsing Redis value:', value);
      throw e;
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
    console.log('Storing design brief...');
    console.log('Design brief content:', config.designBrief);
    await redis.set('design_brief', config.designBrief);
    console.log('Design brief stored');
    
    // Verify the design brief was stored
    const storedBrief = await redis.get('design_brief');
    console.log('Stored design brief:', storedBrief);
    
    // Get existing logos from Redis
    console.log('Fetching existing logos from Redis...');
    const existingLogos = await redis.hgetall('logos');
    console.log('Existing logos from Redis:', JSON.stringify(existingLogos, null, 2));
    
    // Create a map of existing logos by URL for quick lookup
    const existingLogosByUrl = new Map<string, any>();
    if (existingLogos) {
      Object.entries(existingLogos).forEach(([key, value]) => {
        console.log(`Processing existing logo key: ${key}, value:`, value);
        try {
          const logo = parseRedisValue(value);
          console.log('Parsed logo:', logo);
          existingLogosByUrl.set(logo.url, { ...logo, id: key });
        } catch (error) {
          console.error(`Error processing logo with key ${key}:`, error);
          throw error;
        }
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
        const updatedLogo = {
          ...logo,
          id: logoId,
          eloRating: existingLogo.eloRating,
          totalMatches: existingLogo.totalMatches
        };
        console.log('Updated logo:', updatedLogo);
        logosToUpdate[logoId] = JSON.stringify(updatedLogo);
        console.log(`Preserved existing data for logo ${logo.name}`);
      } else {
        // New logo, use default values
        const newLogo = {
          ...logo,
          id: logoId,
          eloRating: 1400,
          totalMatches: 0
        };
        console.log('New logo:', newLogo);
        logosToUpdate[logoId] = JSON.stringify(newLogo);
        console.log(`Added new logo ${logo.name}`);
      }
    }
    
    // Update Redis with the processed logos
    if (Object.keys(logosToUpdate).length > 0) {
      console.log('Updating Redis with processed logos:', JSON.stringify(logosToUpdate, null, 2));
      await redis.hset('logos', logosToUpdate);
      console.log('Logo import completed successfully');
    } else {
      console.log('No logos to update');
    }
    
  } catch (error) {
    console.error('Error during logo import:', error);
    process.exit(1);
  } finally {
    // Ensure Redis connection is closed
    try {
      await redis.quit();
      console.log('Redis connection closed');
    } catch (error) {
      console.error('Error closing Redis connection:', error);
    }
    process.exit(0);
  }
}

// Run the import process
importLogos(); 