import dotenv from 'dotenv';
import path from 'node:path';

export function bootstrapEnv(): void {
    const envName = process.env.ENV;

    if (!envName) {
        throw new Error(
            'ENV is not set. Please provide ENV via CLI, CI, or Playwright config.'
        );
    }

    const envFile = `.env.${envName}`;
    const envPath = path.resolve(process.cwd(), envFile);

    console.log(`Bootstrapping environment: ${envName}`);
    console.log(`Loading env file: ${envPath}`);

    dotenv.config({ path: envPath, override: true });

    // Optional but junior-friendly: validate required vars early
    const required = ['BASE_URL'];
    const missing = required.filter(v => !process.env[v]);

    if (missing.length) {
        throw new Error(
            `Missing required environment variables: ${missing.join(', ')}`
        );
    }
}
