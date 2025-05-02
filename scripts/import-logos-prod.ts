/**
 * Script to import logos from YAML to Redis while preserving existing vote values
 * This script is designed to run during the Vercel build process
 */

import { readFileSync } from 'fs';
import { load } from 'js-yaml';
import { createClient } from 'redis';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.development.local
config({ path: resolve(process.cwd(), '.env.development.local') });

// Generate ID based on logo name to maintain consistency with existing data
function generateLogoId(name: string): string {
  return `logo_${name.toLowerCase().replace(/\s+/g, '_')}`;
}

async function importLogos() {
  console.log('Starting logo import process...');

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.error('Error: REDIS_URL not found in .env.development.local');
    process.exit(1);
  }

  console.log('Using Redis URL:', redisUrl);
  const client = createClient({ url: redisUrl });

  try {
    console.log('Connecting to Redis...');
    await client.connect();
    console.log('Connected successfully');

    // Read logos from YAML
    console.log('Reading logos.yml...');
    const logosYaml = readFileSync('data/logos.yml', 'utf8');
    const config = load(logosYaml) as { designBrief: string; logos: Array<{ name: string; url: string }> };

    if (!config || !config.logos || !Array.isArray(config.logos)) {
      throw new Error('Invalid logos.yml format');
    }

    // Store the design brief
    console.log('Storing design brief...');
    if (!config.designBrief) {
      console.warn('No design brief found in logos.yml');
    } else {
      await client.set('design_brief', config.designBrief);
      console.log('Design brief stored successfully');
    }

    // Fetch existing logos from Redis
    console.log('Fetching existing logos from Redis...');
    const existingLogos = await client.hGetAll('logos');
    console.log(`Found ${Object.keys(existingLogos || {}).length} existing logos`);

    // Keep track of valid logo IDs from YAML
    const validLogoIds = new Set<string>();

    // Process logos from YAML
    console.log('Processing logos from YAML...');
    let newLogos = 0;
    let updatedLogos = 0;
    const processedLogos: Record<string, string> = {};

    for (const logo of config.logos) {
      if (!logo.name) {
        console.warn('Skipping logo without name');
        continue;
      }

      if (!logo.url) {
        console.warn(`Skipping logo without URL: ${logo.name}`);
        continue;
      }

      const logoId = generateLogoId(logo.name);
      validLogoIds.add(logoId);

      const logoWithDefaults = {
        ...logo,
        id: logoId,
        eloRating: 1400,
        totalMatches: 0
      };

      // If the logo already exists, preserve its ELO rating and total matches
      if (existingLogos && existingLogos[logoId]) {
        try {
          const existingLogo = JSON.parse(existingLogos[logoId]);
          logoWithDefaults.eloRating = existingLogo.eloRating;
          logoWithDefaults.totalMatches = existingLogo.totalMatches;
          updatedLogos++;
          console.log(`Updated existing logo: ${logo.name} (preserved ELO: ${logoWithDefaults.eloRating})`);
        } catch (error) {
          console.error(`Error parsing existing logo ${logoId}:`, error);
        }
      } else {
        newLogos++;
        console.log(`Adding new logo: ${logo.name}`);
      }

      processedLogos[logoId] = JSON.stringify(logoWithDefaults);
    }

    // Find and remove orphaned logos (those in Redis but not in YAML)
    let removedLogos = 0;
    if (existingLogos) {
      for (const [key, value] of Object.entries(existingLogos)) {
        if (!validLogoIds.has(key)) {
          try {
            const logo = JSON.parse(value);
            console.log(`Removing orphaned logo: ${logo.name || key}`);
            removedLogos++;
            // Don't include this logo in processedLogos
          } catch (error) {
            console.error(`Error parsing orphaned logo ${key}:`, error);
          }
        }
      }
    }

    // Store all logos
    console.log('Storing all logos...');
    if (Object.keys(processedLogos).length === 0) {
      console.log('No logos to store, clearing Redis logos hash');
      await client.del('logos');
    } else {
      await client.del('logos'); // Clear existing logos first
      await client.hSet('logos', processedLogos); // Then set the new ones
    }
    console.log(`Logo import complete. Added ${newLogos} new logos, updated ${updatedLogos} existing logos, removed ${removedLogos} orphaned logos.`);

  } catch (error) {
    console.error('Error importing logos:', error);
    process.exit(1);
  } finally {
    await client.quit();
    console.log('Redis connection closed');
    process.exit(0);
  }
}

// Run the import
importLogos(); 