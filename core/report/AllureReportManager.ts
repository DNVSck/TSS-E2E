import { allure } from 'allure-playwright';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Allure Report Manager - Singleton pattern
 * Wrapper around Allure to avoid direct dependency and provide customization
 */
export class AllureReportManager {
    private static instance: AllureReportManager;
    private reportPath: string;
    private initialized: boolean = false;

    private constructor() {
        this.reportPath = path.resolve(process.cwd(), 'test-results');
        this.initializeReport();
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): AllureReportManager {
        if (!AllureReportManager.instance) {
            AllureReportManager.instance = new AllureReportManager();
        }
        return AllureReportManager.instance;
    }

    /**
     * Initialize report configuration
     */
    private initializeReport(): void {
        if (this.initialized) return;

        // Create report directories
        this.createReportDirectories();
        
        // Set environment info
        this.setEnvironmentInfo();
        
        this.initialized = true;
    }

    /**
     * Create necessary directories for reports
     */
    private createReportDirectories(): void {
        const directories = [
            this.reportPath,
            path.join(this.reportPath, 'screenshots'),
            path.join(this.reportPath, 'videos'),
            'allure-results'
        ];

        directories.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    /**
     * Set environment information for the report
     */
    private setEnvironmentInfo(): void {
        const environmentInfo = {
            'Test Environment': process.env.ENV || 'default',
            'Base URL': process.env.BASE_URL || 'N/A',
            'Browser': process.env.BROWSER || 'chromium',
            'Node Version': process.version,
            'Test Execution Time': new Date().toISOString(),
            'Operating System': process.platform,
            'Framework': 'Playwright + TypeScript'
        };

        // Write environment.properties for Allure
        const envPropertiesPath = path.join('allure-results', 'environment.properties');
        const envContent = Object.entries(environmentInfo)
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');

        try {
            fs.writeFileSync(envPropertiesPath, envContent, 'utf8');
        } catch (error) {
            console.warn('Failed to write environment.properties:', error);
        }
    }

    /**
     * Set test suite information
     */
    public setTestSuite(suiteName: string, description?: string): void {
        allure.suite(suiteName);
        if (description) {
            allure.description(description);
        }
    }

    /**
     * Set test epic/feature information
     */
    public setTestEpic(epicName: string): void {
        allure.epic(epicName);
    }

    /**
     * Set test feature
     */
    public setTestFeature(featureName: string): void {
        allure.feature(featureName);
    }

    /**
     * Set test story
     */
    public setTestStory(storyName: string): void {
        allure.story(storyName);
    }

    /**
     * Set test severity
     */
    public setTestSeverity(severity: 'blocker' | 'critical' | 'normal' | 'minor' | 'trivial'): void {
        allure.severity(severity);
    }

    /**
     * Add test tags
     */
    public addTestTag(tag: string): void {
        allure.tag(tag);
    }

    /**
     * Generate final report
     */
    public static generateReport(): void {
        console.log('📊 Allure Report generation completed');
        console.log('📁 Results location: allure-results/');
        console.log('🔧 To view report: npx allure serve allure-results');
    }

    /**
     * Get report path
     */
    public getReportPath(): string {
        return this.reportPath;
    }

    /**
     * Cleanup old reports
     */
    public cleanupOldReports(maxAge: number = 7): void {
        const cutoffTime = Date.now() - (maxAge * 24 * 60 * 60 * 1000); // days to milliseconds
        
        try {
            const files = fs.readdirSync(this.reportPath);
            files.forEach(file => {
                const filePath = path.join(this.reportPath, file);
                const stats = fs.statSync(filePath);
                
                if (stats.mtime.getTime() < cutoffTime) {
                    fs.rmSync(filePath, { recursive: true, force: true });
                }
            });
        } catch (error) {
            console.warn('Failed to cleanup old reports:', error);
        }
    }
}