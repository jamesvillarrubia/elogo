/**
 * Script to import logos from YAML to Redis while preserving existing vote values
 * This script is designed to run during the Vercel build process
 */

import { readFileSync } from 'fs';
import { load } from 'js-yaml';
import { redis } from '../src/lib/redis';

// Check if we're in a build environment
const isBuild = process.env.NEXT_PHASE === 'phase-production-build';

function generateLogoId(name: string): string {
  return `logo_${name.toLowerCase().replace(/\s+/g, '_')}`;
}

async function importLogos() {
  console.log('Starting logo import process...');

  if (isBuild) {
    console.log('Build environment detected, skipping logo import');
    return;
  }

  try {
    // Read logos from YAML
    const logosYaml = readFileSync('data/logos.yml', 'utf8');
    const config = load(logosYaml) as { designBrief: string; logos: Array<{ name: string; url: string }> };

    // Store the design brief
    console.log('Storing design brief...');
    console.log('Design brief content:', config.designBrief);
    await redis.set('design_brief', config.designBrief);
    console.log('Design brief stored');

    // Fetch existing logos from Redis
    console.log('Fetching existing logos from Redis...');
    const existingLogos = await redis.hgetall('logos');
    console.log('Existing logos from Redis:', existingLogos);

    // Process existing logos
    const processedLogos: Record<string, string> = {};
    if (existingLogos) {
      for (const [key, value] of Object.entries(existingLogos)) {
        console.log(`Processing existing logo key: ${key}, value: ${value}`);
        try {
          const logo = JSON.parse(value as string);
          processedLogos[key] = value as string;
          console.log('Parsed logo:', logo);
        } catch (error) {
          console.error(`Error parsing logo ${key}:`, error);
        }
      }
    }

    // Process logos from YAML
    console.log('Processing logos from YAML...');
    for (const logo of config.logos) {
      const logoId = generateLogoId(logo.name);
      const logoWithDefaults = {
        ...logo,
        id: logoId,
        eloRating: 1400,
        totalMatches: 0
      };

      // If the logo already exists, preserve its ELO rating and total matches
      if (processedLogos[logoId]) {
        try {
          const existingLogo = JSON.parse(processedLogos[logoId]);
          logoWithDefaults.eloRating = existingLogo.eloRating;
          logoWithDefaults.totalMatches = existingLogo.totalMatches;
          console.log(`Preserved existing logo data for ${logo.name}:`, {
            eloRating: logoWithDefaults.eloRating,
            totalMatches: logoWithDefaults.totalMatches
          });
        } catch (error) {
          console.error(`Error parsing existing logo ${logoId}:`, error);
        }
      }

      console.log(`Adding logo ${logoId}:`, logoWithDefaults);
      processedLogos[logoId] = JSON.stringify(logoWithDefaults);
    }

    // Store all logos
    console.log('Storing all logos...');
    await redis.hset('logos', processedLogos);
    console.log('Logos stored successfully');

  } catch (error) {
    console.error('Error importing logos:', error);
    process.exit(1);
  } finally {
    await redis.quit();
    console.log('Redis connection closed');
    process.exit(0);
  }
}

importLogos(); 