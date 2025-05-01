/**
 * Environment variable logging utility
 * This file is used to log environment variables during build time
 * and development time.
 */

export function logEnvironmentVariables() {
  console.log('Environment Variables:');
  console.log('REDIS_URL:', process.env.REDIS_URL);
  // Add other environment variables you want to log here
}

// Log during module initialization (build time)
logEnvironmentVariables(); 