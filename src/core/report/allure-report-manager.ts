import * as fs from 'fs';
import * as path from 'path';

export class AllureReportManager {
    private static instance: AllureReportManager;
    private readonly reportPath: string;

    private constructor() {
        this.reportPath = path.resolve(process.cwd(), 'test-results');
        this.createReportDirectories();
        this.writeEnvironmentInfo();
    }

    public static getInstance(): AllureReportManager {
        if (!this.instance) {
            this.instance = new AllureReportManager();
        }
        return this.instance;
    }

    private createReportDirectories(): void {
        [
            this.reportPath,
            path.join(this.reportPath, 'screenshots'),
            path.join(this.reportPath, 'videos'),
            'allure-results'
        ].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    private writeEnvironmentInfo(): void {
        const env = {
            'Test Environment': process.env.ENV ?? 'default',
            'Base URL': process.env.BASE_URL ?? 'N/A',
            Browser: process.env.BROWSER ?? 'chromium',
            'Node Version': process.version,
            OS: process.platform,
            Framework: 'Playwright + TypeScript'
        };

        const content = Object.entries(env)
            .map(([k, v]) => `${k}=${v}`)
            .join('\n');

        fs.writeFileSync(
            path.join('allure-results', 'environment.properties'),
            content,
            'utf8'
        );
    }

    public getReportPath(): string {
        return this.reportPath;
    }
}
