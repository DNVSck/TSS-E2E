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
import { LOCALES_CONSTANT } from '../constant/locales-constant';

// Load the environment file based on ENV setting
const envFile = ENV ? `.env.${ENV}` : '.env';
const envPath = path.resolve(process.cwd(), envFile);

console.log(`Loading environment: ${ENV || 'default'}`);
console.log(`Config file: ${envPath}`);

// Load environment variables FIRST
dotenv.config({ path: envPath, override: true });

// READ LOCALE FROM ENVIRONMENT VARIABLE AFTER dotenv is loaded
export const LOCALE: 'all' | 'en' | 'cy' = (process.env.LOCALE as 'all' | 'en' | 'cy') || LOCALES_CONSTANT.CY_GB;
export const BASE_URL = process.env.BASE_URL!;
export const DEFAULT_TIMEOUT = process.env.DEFAULT_TIMEOUT ? Number(process.env.DEFAULT_TIMEOUT) : 5000;
const MAX_WIDTH = process.env.MAX_WIDTH ? Number(process.env.MAX_WIDTH) : 1920;
const MAX_HEIGHT = process.env.MAX_HEIGHT ? Number(process.env.MAX_HEIGHT) : 1080;

console.log(`Loading locale: ${LOCALE}`);
console.log(`Base URL: ${BASE_URL}`);


// Export environment info for logging
export const ENVIRONMENT_INFO = {
  currentEnv: ENV,
  currentLocale: LOCALE,
  configFile: envPath,
  baseUrl: BASE_URL,
  userName: process.env.USER_NAME,
  defaultTimeout: DEFAULT_TIMEOUT,
  viewport: {
    width: Number.isFinite(MAX_WIDTH) ? MAX_WIDTH : 1920,
    height: Number.isFinite(MAX_HEIGHT) ? MAX_HEIGHT : 1080
  }
};

// Log loaded environment
console.log('Environment loaded:', ENVIRONMENT_INFO);