/**
 * Environment Configuration Manager
 * Single point to control which environment to run
 */

// CHANGE THIS VALUE TO SWITCH ENVIRONMENT
export const ENV = 'poc'; // poc | staging | uat | production | qa

/**
 * Auto-load environment configuration based on ENV value
 */
import dotenv from 'dotenv';
import path from 'path';

// Load the environment file based on ENV setting
const envFile = ENV ? `.env.${ENV}` : '.env';
const envPath = path.resolve(process.cwd(), envFile);

console.log(`Loading environment: ${ENV || 'default'}`);
console.log(`Config file: ${envPath}`);

// Load environment variables FIRST
dotenv.config({ path: envPath, override: true });

// READ LOCALE FROM ENVIRONMENT VARIABLE AFTER dotenv is loaded
export const LOCALE: 'all' | 'en' | 'cy' = (process.env.LOCALE as 'all' | 'en' | 'cy') || 'cy';
export const BASE_URL = process.env.BASE_URL!;

console.log(`Loading locale: ${LOCALE}`);
console.log(`Base URL: ${BASE_URL}`);


// Export environment info for logging
export const ENVIRONMENT_INFO = {
  currentEnv: ENV,
  currentLocale: LOCALE,
  configFile: envPath,
  baseUrl: BASE_URL,
  userName: process.env.USER_NAME
};

// Log loaded environment
console.log('Environment loaded:', ENVIRONMENT_INFO);