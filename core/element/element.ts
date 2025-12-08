import {BrowserManagement} from '../browser/browser-management';
import { PlaywrightUtils } from '../util/playwright-utils';
import { PageUtils } from '../page/page-utils';
import { DEFAULT_TIMEOUT } from '../../config/environment';

export class Element {
    locator: string;

    constructor(locator: string) {
        this.locator = locator;
    }
    
    private get locatorElement() {
        return BrowserManagement.page.locator(this.locator);
    }

    async click(): Promise<void> {
        await this.waitForElementToBeVisible();
        await this.locatorElement.click();
    }

    async clickWithRetry(timeout = DEFAULT_TIMEOUT): Promise<void> {
        await PlaywrightUtils.retry(() => this.click(), timeout);
    }

    async enter(text: string): Promise<void> {
        await this.waitForElementToBeVisible();
        await this.locatorElement.type(text);
    }

    async waitForElement(options?: { state?: 'attached' | 'detached' | 'visible' | 'hidden'; timeout?: number }): Promise<void> {
        await this.locatorElement.waitFor(options);
    }

    async waitForElementToBeVisible(): Promise<void> {
        await this.waitForElement({ state: 'visible', timeout: DEFAULT_TIMEOUT });
    }

    async waitForElementToBeHidden(): Promise<void> {
        await this.waitForElement({ state: 'hidden', timeout: DEFAULT_TIMEOUT });
    }

    async fillText(text: string): Promise<void> {
        await this.waitForElementToBeVisible();
        await this.locatorElement.fill(text);
    }

    async hover(): Promise<void> {
        await this.waitForElementToBeVisible();
        await this.locatorElement.hover();
    }

    async clearText(): Promise<void> {
        await this.waitForElementToBeVisible();
        await this.locatorElement.clear();
    }

    async getText(): Promise<string | null> {
        return await this.locatorElement.textContent();
    }

    async isVisible(): Promise<boolean> {
        return await this.locatorElement.isVisible();
    }

    async scrollToView(): Promise<void> {
        await this.locatorElement.scrollIntoViewIfNeeded();
    }

    async getAttribute(attributeName: string): Promise<string | null> {
        return await this.locatorElement.getAttribute(attributeName);
    }

    // Missing methods from element.ts
    async rightClick(): Promise<void> {
        await this.waitForElementToBeVisible();
        await this.locatorElement.click({ button: 'right' });
    }

    async middleClick(): Promise<void> {
        await this.waitForElementToBeVisible();
        await this.locatorElement.click({ button: 'middle' });
    }

    async doubleClick(): Promise<void> {
        await this.waitForElementToBeVisible();
        await this.locatorElement.dblclick();
    }

    async holdKeyAndClick(options?: {
        modifiers?: ('Alt' | 'Control' | 'Meta' | 'Shift')[];
        timeout?: number;
    }): Promise<void> {
        await this.waitForElementToBeVisible();
        await this.locatorElement.click(options);
    }

    async pressKey(key: string): Promise<void> {
        await this.waitForElementToBeVisible();
        await this.locatorElement.press(key);
    }

    async isEnabled(): Promise<boolean> {
        return await this.locatorElement.isEnabled();
    }

    async isDisabled(): Promise<boolean> {
        return await this.locatorElement.isDisabled();
    }

    async isHidden(): Promise<boolean> {
        return await this.locatorElement.isHidden();
    }

    async getElementCount(): Promise<number> {
        return await this.locatorElement.count();
    }

    static async findElements(locator: string) {
        const locators = await BrowserManagement.page.locator(locator).all();
        return locators.map((_, i) => new Element(`${locator} >> nth=${i}`));
    }

    // Additional useful methods
    async focus(): Promise<void> {
        await this.waitForElement({ state: 'attached' });
        await this.locatorElement.focus();
    }

    async blur(): Promise<void> {
        await this.waitForElement({ state: 'attached' });
        await this.locatorElement.blur();
    }

    async selectOption(values: string | string[]): Promise<void> {
        await this.waitForElementToBeVisible();
        await this.locatorElement.selectOption(values);
    }

    async check(): Promise<void> {
        await this.waitForElementToBeVisible();
        await this.locatorElement.check();
    }

    async uncheck(): Promise<void> {
        await this.waitForElementToBeVisible();
        await this.locatorElement.uncheck();
    }

    async isChecked(): Promise<boolean> {
        return await this.locatorElement.isChecked();
    }

    async getValue(): Promise<string> {
        return await this.locatorElement.inputValue();
    }

    async getInnerHTML(): Promise<string> {
        return await this.locatorElement.innerHTML();
    }

    async uploadFiles(files: string | string[]): Promise<void> {
        await this.waitForElement({ state: 'attached' });
        await this.locatorElement.setInputFiles(files);
    }

    async dragTo(target: Element): Promise<void> {
        await this.waitForElementToBeVisible();
        await this.locatorElement.dragTo(target.locatorElement);
    }

    async screenshot(options?: { path?: string; type?: 'png' | 'jpeg' }): Promise<Buffer> {
        return await this.locatorElement.screenshot(options);
    }

    async highlight(): Promise<void> {
        await this.locatorElement.highlight();
    }

    async getChildElement(childSelector: string, index = 0): Promise<Element> {
        const child = this.locatorElement.locator(childSelector).nth(index);
        await child.waitFor({ state: 'visible', timeout: DEFAULT_TIMEOUT });

        return new Element(`${this.locator} >> ${childSelector} >> nth=${index}`);
    }

    async getParentElement(): Promise<Element> {
        const parentLocator = `${this.locator}/..`;
        return new Element(parentLocator);
    }

    async waitForCount(count: number, timeout: number = DEFAULT_TIMEOUT): Promise<boolean> {
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

    async waitForText(text: string, timeout: number = DEFAULT_TIMEOUT): Promise<boolean> {
        try {
            await this.waitForElementToBeVisible();
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

    async clickIfVisible(timeout: number = DEFAULT_TIMEOUT): Promise<boolean> {
        try {
            await this.waitForElementToBeVisible();
            if (await this.isVisible()) {
                await this.click();
                return true;
            }
        } catch (error) {
            // Element not visible within timeout
            console.warn(`Element not visible for click within timeout (${timeout}ms):`, error);
        }
        return false;
    }

    async typeSlowly(text: string, delay: number = 100): Promise<void> {
        await this.waitForElementToBeVisible();
        await this.locatorElement.type(text, { delay });
    }

    async clearAndType(text: string): Promise<void> {
        await this.clearText();
        await this.fillText(text);
    }

    //Iframe related methods
    
}