import { BASE_URL } from '../config/environment';
import { BrowserManagement } from '../core/browser/browser-management';
import { AllureTestManager } from '../core/report/AllureTestManager';
import { ReportLog } from '../core/report/ReportLog';
import { expectMain as expect, testMain } from '../fixtures/main-fixture';
import { BasePage } from '../page-object/base-page';

// Timeout configuration from environment variables
const CONFIG_TIMEOUT = {
    TEST_BASE_TIMEOUT: parseInt(process.env.TEST_BASE_TIMEOUT || '30000', 10),
    GLOBAL_TIMEOUT: parseInt(process.env.GLOBAL_TIMEOUT || '0', 10),
    EXPECT_BASE_TIMEOUT: parseInt(process.env.EXPECT_BASE_TIMEOUT || '30000', 10),
    PAGE_TIMEOUT: parseInt(process.env.PAGE_TIMEOUT || '30000', 10)
};


// Use testMain from main-fixture which already has all necessary extensions
export const test = testMain;

/**
 * Before each test - setup with Allure integration
 */
testMain.beforeEach(async ({ page }, testInfo) => {
    console.log(` Starting test: ${testInfo.title}`);
    console.log(` Project: ${testInfo.project.name}`);
    
    // Initialize Allure Test Manager
    AllureTestManager.setCurrentTestInfo(testInfo);
    
    // Create parent test in Allure
    AllureTestManager.createParentTest(
        testInfo.title, 
        `Test: ${testInfo.title} | File: ${testInfo.file}`
    );
    
    // Add test metadata
    AllureTestManager.addParameter('Test File', testInfo.file);
    AllureTestManager.addParameter('Project Name', testInfo.project.name);
    AllureTestManager.addParameter('Expected Status', testInfo.expectedStatus);
    
    // Log test start
    ReportLog.info(`Test started: ${testInfo.title}`);
    
    // Clear browser storage
    await ReportLog.step('Clear Browser Storage', async () => {
        try {
            // Check if page is loaded and has a valid URL
            const url = page.url();
            if (!url || url === 'about:blank') {
                ReportLog.info('Page not loaded yet, skipping storage clear');
                return;
            }

            await page.evaluate(() => {
                try {
                    if (typeof Storage !== 'undefined') {
                        localStorage.clear();
                        sessionStorage.clear();
                    }
                } catch (error) {
                    console.warn('Storage clear failed:', error);
                }
            });
            ReportLog.info('Browser storage cleared successfully');
        } catch (error) {
            ReportLog.warn(`Storage clear failed: ${error}`);
            // Don't fail the test for storage clear issues
        }
    }, page);
    
    // Note: Language switching moved to helper function - call after navigation to portal page
});

/**
 * After each test - cleanup with Allure integration
 */
testMain.afterEach(async ({ page }, testInfo) => {
    console.log(`Finished test: ${testInfo.title}`);
    
    // Handle test results based on status
    switch (testInfo.status) {
        case 'passed':
            ReportLog.pass(`Test completed successfully: ${testInfo.title}`);
            break;
            
        case 'failed':
            // Capture screenshot on failure
            await ReportLog.attachScreenshot(page, `Failed Test Screenshot - ${testInfo.title}`);
            
            // Attach video if available
            await attachVideoToReport(testInfo, `Failed Test Video - ${testInfo.title}`);
            
            // Log failure details
            const errorMessage = testInfo.error?.message || 'Test failed without specific error message';
            await ReportLog.fail(`Test failed: ${testInfo.title} - ${errorMessage}`, page);
            
            break;
            
        case 'skipped':
            const skipReason = testInfo.error?.message || 'Test was skipped';
            ReportLog.skip(`Test skipped: ${testInfo.title} - ${skipReason}`);
            break;
            
        case 'timedOut':
            await ReportLog.attachScreenshot(page, `Timeout Screenshot - ${testInfo.title}`);
            
            // Attach video for timeout as well
            await attachVideoToReport(testInfo, `Timeout Test Video - ${testInfo.title}`);
            
            ReportLog.fail(`Test timed out: ${testInfo.title} after ${testInfo.timeout}ms`);
            break;
            
        default:
            ReportLog.warn(`Test finished with unknown status: ${testInfo.status}`);
            break;
    }
    
    // Update Allure test report with final status
    AllureTestManager.updateTestReport(testInfo);
    
    // Add test execution metadata
    AllureTestManager.addParameter('Duration', `${testInfo.duration}ms`);
    AllureTestManager.addParameter('Final Status', testInfo.status || 'unknown');
    
    if (testInfo.annotations?.length > 0) {
        ReportLog.addTestData(testInfo.annotations, 'Test Annotations');
    }
    
    // Cleanup Allure manager
    AllureTestManager.cleanup();
});

/**
 * Attach video recording to Allure report (helper function)
 */
const attachVideoToReport = async (testInfo: any, videoName: string): Promise<void> => {
    try {
        console.log(' === VIDEO DEBUG START ===');
        console.log(' Test title:', testInfo.title);
        console.log(' Test status:', testInfo.status);
        console.log(' Test outputDir:', testInfo.outputDir);
        console.log(' Test outputPath method available:', typeof testInfo.outputPath);
        
        const fs = require('fs');
        const path = require('path');
        
        // Check if video is in test attachments first (Playwright auto-attachments)
        if (testInfo.attachments?.length > 0) {
            console.log(' Found testInfo.attachments:', testInfo.attachments.length);
            
            for (const attachment of testInfo.attachments) {
                console.log(' Attachment details:');
                console.log('  - name:', attachment.name);
                console.log('  - path:', attachment.path);
                console.log('  - contentType:', attachment.contentType);
                
                if (attachment.path && attachment.path.includes('video')) {
                    console.log('Found video attachment at:', attachment.path);
                    
                    if (fs.existsSync(attachment.path)) {
                        // Use ReportLog method for proper Allure video display
                        ReportLog.addVideoAttachment(videoName, attachment.path);
                        
                        console.log('Video successfully attached to Allure via path');
                        logInfo(`Video attached for HTML display: ${attachment.path}`);
                        return;
                    }
                }
            }
        }
        
        // Manual path detection as fallback
        const possibleVideoPaths = [
            testInfo.outputPath ? testInfo.outputPath('video.webm') : null,
            testInfo.outputPath ? testInfo.outputPath('video.mp4') : null,
            testInfo.outputDir ? path.join(testInfo.outputDir, 'video.webm') : null,
            testInfo.outputDir ? path.join(testInfo.outputDir, 'video.mp4') : null
        ].filter(Boolean);
        
        console.log(' Manual video path check:', possibleVideoPaths);
        
        for (const videoPath of possibleVideoPaths) {
            console.log(' Checking path:', videoPath);
            if (fs.existsSync(videoPath)) {
                console.log(' Found video file at:', videoPath);
                
                // Use ReportLog method for proper Allure video display
                ReportLog.addVideoAttachment(videoName, videoPath);
                
                console.log(' Video attached via manual path detection');
                logInfo(`Video successfully attached: ${videoPath}`);
                return;
            }
        }
        
        console.warn('No video recording found anywhere');
        console.log(' === VIDEO DEBUG END ===');
        logWarn('No video recording found - check playwright config video settings');
        
    } catch (error) {
        console.error(' Video attachment error:', error);
        logWarn(`Failed to attach video: ${error}`);
    }
};


/**
 * Get the base URL for tests (centralized access)
 */
export const getBaseUrl = (): string => {
    return BASE_URL;
};

// ===== ALLURE HELPER FUNCTIONS =====

/**
 * Create test step with automatic Allure integration
 */
export const testStep = async <T>(
    stepName: string, 
    stepFunction: () => Promise<T> | T, 
    page?: any
): Promise<T> => {
    return await ReportLog.step(stepName, stepFunction, page, true);
};

/**
 * Add test data to Allure report
 */
export const addTestData = (data: any, name?: string) => {
    ReportLog.addTestData(data, name);
};

/**
 * Add test parameter to Allure report
 */
export const addParameter = (name: string, value: string) => {
    AllureTestManager.addParameter(name, value);
};

/**
 * Add test link (Jira, TestRail, etc.)
 */
export const addTestLink = (url: string, name?: string, type?: 'issue' | 'tms') => {
    AllureTestManager.addTestLink(url, name, type);
};

/**
 * Add test labels/tags
 */
export const addLabel = (name: string, value: string) => {
    AllureTestManager.addTestLabel(name, value);
};

/**
 * Log info message to Allure
 */
export const logInfo = (message: string) => {
    ReportLog.info(message);
};

/**
 * Log pass message to Allure
 */
export const logPass = (message: string) => {
    ReportLog.pass(message);
};

/**
 * Log warning to Allure
 */
export const logWarn = (message: string) => {
    ReportLog.warn(message);
};


// Export expect
export { expect };

