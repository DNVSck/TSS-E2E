import {BrowserManagement} from '../browser/browser-management';
import { PlaywrightUtils } from '../util/playwright-utils';

export class Element {
    locator: string;

    constructor(locator: string) {
        this.locator = locator;
    }

    async click(): Promise<void> {
        await this.waitForElement({ state: 'visible' });
        await BrowserManagement.page.locator(this.locator).click();
    }

    async clickWithRetry(timeout = 5000): Promise<void> {
        await PlaywrightUtils.retry(() => this.click(), timeout);
    }

    async enter(text: string): Promise<void> {
        await this.waitForElement({ state: 'visible' });
        await BrowserManagement.page.locator(this.locator).type(text);
    }

    async waitForElement(options?: { state?: 'attached' | 'detached' | 'visible' | 'hidden'; timeout?: number }): Promise<void> {
        await BrowserManagement.page.locator(this.locator).waitFor(options);
    }

    async waitForElementToBeVisible(): Promise<void> {
        await this.waitForElement({ state: 'visible', timeout: 5000 });
    }

    async waitForElementToBeHidden(): Promise<void> {
        await this.waitForElement({ state: 'hidden', timeout: 5000 });
    }

    async fillText(text: string): Promise<void> {
        await this.waitForElement({ state: 'visible' });
        await BrowserManagement.page.locator(this.locator).fill(text);
    }

    async hover(): Promise<void> {
        await this.waitForElement({ state: 'visible' });
        await BrowserManagement.page.locator(this.locator).hover();
    }

    async clearText(): Promise<void> {
        await this.waitForElement({ state: 'visible' });
        await BrowserManagement.page.locator(this.locator).clear();
    }

    async getText(): Promise<string | null> {
        return await BrowserManagement.page.locator(this.locator).textContent();
    }

    async isVisible(): Promise<boolean> {
        return await BrowserManagement.page.locator(this.locator).isVisible();
    }

    async scrollToView(): Promise<void> {
        await BrowserManagement.page.locator(this.locator).scrollIntoViewIfNeeded();
    }

    async getAttribute(attributeName: string): Promise<string | null> {
        return await BrowserManagement.page.locator(this.locator).getAttribute(attributeName);
    }

    // Missing methods from element.ts
    async rightClick(): Promise<void> {
        await this.waitForElement({ state: 'visible' });
        await BrowserManagement.page.locator(this.locator).click({ button: 'right' });
    }

    async middleClick(): Promise<void> {
        await this.waitForElement({ state: 'visible' });
        await BrowserManagement.page.locator(this.locator).click({ button: 'middle' });
    }

    async doubleClick(): Promise<void> {
        await this.waitForElement({ state: 'visible' });
        await BrowserManagement.page.locator(this.locator).dblclick();
    }

    async holdKeyAndClick(options?: {
        modifiers?: ('Alt' | 'Control' | 'Meta' | 'Shift')[];
        timeout?: number;
    }): Promise<void> {
        await this.waitForElement({ state: 'visible' });
        await BrowserManagement.page.locator(this.locator).click(options);
    }

    async pressKey(key: string): Promise<void> {
        await this.waitForElement({ state: 'visible' });
        await BrowserManagement.page.locator(this.locator).press(key);
    }

    async isEnabled(): Promise<boolean> {
        return await BrowserManagement.page.locator(this.locator).isEnabled();
    }

    async isDisabled(): Promise<boolean> {
        return await BrowserManagement.page.locator(this.locator).isDisabled();
    }

    async isHidden(): Promise<boolean> {
        return await BrowserManagement.page.locator(this.locator).isHidden();
    }

    async getElementCount(): Promise<number> {
        return await BrowserManagement.page.locator(this.locator).count();
    }

    static async findElements(locator: string) {
        return await BrowserManagement.page.locator(locator).all();
    }

    // Additional useful methods
    async focus(): Promise<void> {
        await this.waitForElement({ state: 'attached' });
        await BrowserManagement.page.locator(this.locator).focus();
    }

    async blur(): Promise<void> {
        await this.waitForElement({ state: 'attached' });
        await BrowserManagement.page.locator(this.locator).blur();
    }

    async selectOption(values: string | string[]): Promise<void> {
        await this.waitForElement({ state: 'visible' });
        await BrowserManagement.page.locator(this.locator).selectOption(values);
    }

    async check(): Promise<void> {
        await this.waitForElement({ state: 'visible' });
        await BrowserManagement.page.locator(this.locator).check();
    }

    async uncheck(): Promise<void> {
        await this.waitForElement({ state: 'visible' });
        await BrowserManagement.page.locator(this.locator).uncheck();
    }

    async isChecked(): Promise<boolean> {
        return await BrowserManagement.page.locator(this.locator).isChecked();
    }

    async getValue(): Promise<string> {
        return await BrowserManagement.page.locator(this.locator).inputValue();
    }

    async getInnerHTML(): Promise<string> {
        return await BrowserManagement.page.locator(this.locator).innerHTML();
    }

    async uploadFiles(files: string | string[]): Promise<void> {
        await this.waitForElement({ state: 'attached' });
        await BrowserManagement.page.locator(this.locator).setInputFiles(files);
    }

    async dragTo(targetLocator: string): Promise<void> {
        await this.waitForElement({ state: 'visible' });
        await BrowserManagement.page.locator(this.locator).dragTo(BrowserManagement.page.locator(targetLocator));
    }

    async screenshot(options?: { path?: string; type?: 'png' | 'jpeg' }): Promise<Buffer> {
        return await BrowserManagement.page.locator(this.locator).screenshot(options);
    }

    async highlight(): Promise<void> {
        await BrowserManagement.page.locator(this.locator).highlight();
    }

    async getChildElement(childSelector: string, index: number = 0): Promise<Element> {
        const childLocator = `${this.locator} ${childSelector}`;
        const elements = await BrowserManagement.page.locator(childLocator).all();
        if (elements[index]) {
            return new Element(`(${childLocator})[${index + 1}]`);
        }
        throw new Error(`Child element at index ${index} not found`);
    }

    async getParentElement(): Promise<Element> {
        const parentLocator = `${this.locator}/..`;
        return new Element(parentLocator);
    }

    async waitForCount(count: number, timeout: number = 5000): Promise<boolean> {
        try {
            const startTime = Date.now();
            while (Date.now() - startTime < timeout) {
                const actualCount = await this.getElementCount();
                if (actualCount === count) {
                    return true;
                }
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return false;
        } catch {
            return false;
        }
    }

    async waitForText(text: string, timeout: number = 5000): Promise<boolean> {
        try {
            await BrowserManagement.page.locator(this.locator).waitFor({
                state: 'visible',
                timeout
            });
            const actualText = await this.getText();
            return actualText?.includes(text) || false;
        } catch {
            return false;
        }
    }

    async hasClass(className: string): Promise<boolean> {
        const classes = await this.getAttribute('class');
        return classes?.split(' ').includes(className) || false;
    }

    async hasAttribute(attributeName: string): Promise<boolean> {
        const attr = await this.getAttribute(attributeName);
        return attr !== null;
    }

    async clickIfVisible(timeout: number = 5000): Promise<boolean> {
        try {
            await this.waitForElementToBeVisible();
            if (await this.isVisible()) {
                await this.click();
                return true;
            }
        } catch {
            // Element not visible within timeout
        }
        return false;
    }

    async typeSlowly(text: string, delay: number = 100): Promise<void> {
        await this.waitForElement({ state: 'visible' });
        await BrowserManagement.page.locator(this.locator).type(text, { delay });
    }

    async clearAndType(text: string): Promise<void> {
        await this.clearText();
        await this.fillText(text);
    }
}