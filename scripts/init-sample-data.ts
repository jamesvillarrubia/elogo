import { redis } from '../src/lib/redis';
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import crypto from 'crypto';

// Generate a deterministic ID based on the URL
function generateLogoId(url: string): string {
  return `logo_${crypto.createHash('md5').update(url).digest('hex').slice(0, 8)}`;
}

async function initSampleData() {
  try {
    console.log('Starting sample data initialization...');
    
    // Read YAML file
    const yamlPath = path.join(process.cwd(), 'data', 'logos.yml');
    const yamlContent = fs.readFileSync(yamlPath, 'utf8');
    const config = yaml.load(yamlContent) as { designBrief: string; logos: { name: string; url: string }[] };
    
    // Store the design brief
    await redis.set('design_brief', config.designBrief);
    console.log('Design brief stored');
    
    // Clear existing logo data
    console.log('Clearing existing logo data...');
    const deleteResult = await redis.del('logos');
    console.log('Delete result:', deleteResult);
    
    // Add logos with generated IDs and default values
    console.log('Adding logos...');
    for (const logo of config.logos) {
      const logoWithDefaults = {
        ...logo,
        id: generateLogoId(logo.url),
        eloRating: 1400,
        totalMatches: 0
      };
      
      console.log(`Adding logo ${logoWithDefaults.id}:`, logoWithDefaults);
      const result = await redis.hset('logos', { [logoWithDefaults.id]: JSON.stringify(logoWithDefaults) });
      console.log(`Added logo ${logoWithDefaults.id}, result:`, result);
    }
    
    // Verify the data was stored
    console.log('Verifying stored data...');
    const storedLogos = await redis.hgetall('logos');
    console.log('Raw stored logos:', storedLogos);
    console.log('Number of stored logos:', Object.keys(storedLogos || {}).length);
    
    // Verify we can parse the stored data
    if (storedLogos) {
      console.log('Parsing stored logos...');
      const parsedLogos = Object.values(storedLogos).map(logoStr => {
        try {
          const parsed = JSON.parse(logoStr as string);
          console.log(`Successfully parsed logo ${parsed.id}`);
          return parsed;
        } catch (err) {
          console.error('Error parsing logo string:', logoStr);
          console.error('Parse error:', err);
          return null;
        }
      }).filter(logo => logo !== null);
      
      console.log('Parsed logos:', parsedLogos);
      console.log('Number of valid parsed logos:', parsedLogos.length);
    }
    
    console.log('Sample data initialization completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing sample data:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    process.exit(1);
  }
}

initSampleData(); 