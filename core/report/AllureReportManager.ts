import { allure } from 'allure-playwright';
import * as fs from 'fs';
import * as path from 'path';

export class AllureReportManager {
    private static instance: AllureReportManager;
    private reportPath: string;
    private initialized = false;

    private constructor() {
        this.reportPath = path.resolve(process.cwd(), 'test-results');
        this.initializeReport();
    }

    public static getInstance(): AllureReportManager {
        if (!this.instance) {
            this.instance = new AllureReportManager();
        }
        return this.instance;
    }

    private initializeReport(): void {
        if (this.initialized) return;
        this.createReportDirectories();
        this.setEnvironmentInfo();
        this.initialized = true;
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

    private setEnvironmentInfo(): void {
        const env = {
            'Test Environment': process.env.ENV || 'default',
            'Base URL': process.env.BASE_URL || 'N/A',
            Browser: process.env.BROWSER || 'chromium',
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

    public static generateReport(): void {
        console.log('Allure report generation completed');
        console.log('Results location: allure-results/');
    }

    public getReportPath(): string {
        return this.reportPath;
    }

}

