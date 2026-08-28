import fs from 'node:fs';
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

    // Local dev loads .env.<env>; CI provides the variables via process.env
    // (injected from the per-environment variable group), so the file is optional.
    if (fs.existsSync(envPath)) {
        console.log(`Loading env file: ${envPath}`);

        const result = dotenv.config({
            path: envPath,
            override: false,
        });

        if (result.error) {
            throw new Error(
                `Unable to load environment file "${envFile}": ` +
                result.error.message,
            );
        }
    } else {
        console.log(`No ${envFile} file present; using process.env`);
    }

    // Optional but junior-friendly: validate required vars early
    const required = ['BASE_URL'];
    const missing = required.filter(v => !process.env[v]);

    if (missing.length) {
        throw new Error(
            `Missing required environment variables: ${missing.join(', ')}`
        );
    }
}
