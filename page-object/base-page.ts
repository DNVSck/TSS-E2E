import { Page } from '@playwright/test';
import { BrowserManagement } from "../core/browser/browser-management";
import { Element } from "../core/element/element";
import { PortalPage } from "./portal-page";
import { expect } from '../tests/test-hooks';
import { PageUtils } from '../core/page/page-utils';
import { PlaywrightUtils } from '../core/util/playwright-utils';


export class BasePage {

    element(locator: string): Element {
        return new Element(locator);
    }
    
    /**
     * Universal portal navigation with language switching
     * Combines: navigate → clear storage → switch language if needed
     */
    async navigateToPortal(url: string, testInfo: any): Promise<void> {
        
        // Step 1: Navigate to portal page
        await PageUtils.goto(url);
        
        // Step 2: Clear browser storage
        await this.clearBrowserStorage();
        
        // Step 3: Switch to Welsh if cy project
        await this.switchToWelshIfNeeded(testInfo);

        console.log(`Navigated to portal: ${url}`);
    }
    
    /**
     * Clear browser storage safely
     */
    private async clearBrowserStorage(): Promise<void> {
        const page: Page = PageUtils.page();
        try {
            const url = page.url();
            if (!url || url === 'about:blank') {
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
        } catch (error) {
            console.warn(`Storage clear failed: ${error}`);
        }
    }
    
    /**
     * Switch to Welsh language if cy project
     */
    private async switchToWelshIfNeeded(testInfo: any): Promise<void> {
        const isCyProject = testInfo.project.name.includes('cy');
        if (isCyProject) {
            const page = PageUtils.page();
            BrowserManagement.page = page;
            
            console.log('Switching to Welsh language...');
            
            const portalPage = new PortalPage();
            await portalPage.languageSwitcher.click();
            
            // Wait until language switch completes successfully
            await this.waitUntilLanguageSwitchSuccess('cy');
        } else {
            // For English projects, wait until page loads correctly
            await this.waitUntilLanguageSwitchSuccess('en');
        }
    }

    private async waitUntilLanguageSwitchSuccess(lang: 'en' | 'cy'): Promise<void> {
        
        const portalPage = new PortalPage();

        // Define expected titles for each language
        const expectedTitles = {
            'en': 'Trader Support Service',
            'cy': 'Gwasanaeth Cymorth Masnachwyr'
        };
        
        const expectedTitle = expectedTitles[lang];
        const titleLocator = portalPage.portalTitlte;
        
        // Wait until the title contains the expected text
        await titleLocator.waitForElementToBeVisible();
        
    // Wait until text content matches the expected language
    await PlaywrightUtils.retry(async () => {
        const currentTitle = await titleLocator.getText();
        if (currentTitle !== expectedTitle) {
            throw new Error(`Title mismatch: expected "${expectedTitle}", but got "${currentTitle}"`);
        }
    },
    60000,
    1000);

    console.log(`Language switch OK → Title shows "${expectedTitle}"`);
    }

    /**
     * Set viewport size
     */
    async setViewport(width: number = 1920, height: number = 1080): Promise<void> {
        const page: Page = PageUtils.page();
        await page.setViewportSize({ width, height });
    }
};
