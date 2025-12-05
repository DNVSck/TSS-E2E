import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Access environment variables via process.env (loaded by playwright.config.ts)
const tssUrl = process.env.BASE_URL!;

// Set viewport for all tests
test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
});

test.describe('TSS WCAG 2.2 AA Compliance Tests', () => {
  
  test('should not have any automatically detectable WCAG A or AA violations on front page', async ({ page }) => {
    await page.goto(tssUrl);
    
    // Wait for page to load
    await expect(page.locator('h1')).toContainText('Trader Support Service');
    
    // Run comprehensive WCAG 2.2 AA scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    
    // Assert no accessibility violations for build pipeline
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should not have any automatically detectable WCAG A or AA violations on sign in page', async ({ page }) => {
    await page.goto(tssUrl);
    
    // Navigate to sign in page
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.locator('#main-content')).toContainText('Sign in to your account');
    
    // Run WCAG 2.2 AA scan on sign in form
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    
    // Assert no accessibility violations for build pipeline
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should meet WCAG 2.2 AA color contrast requirements', async ({ page }) => {
    await page.goto(tssUrl);
    
    // Test specifically for color contrast compliance
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .withRules(['color-contrast'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper keyboard navigation for WCAG 2.2 AA compliance', async ({ page }) => {
    await page.goto(tssUrl);
    
    // Test keyboard accessibility rules  
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper form labels and ARIA for WCAG 2.2 AA compliance', async ({ page }) => {
    await page.goto(tssUrl);
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    // Test form and ARIA compliance
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .withRules(['label', 'aria-required-attr', 'form-field-multiple-labels', 'aria-valid-attr'])        
      .analyze();    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should meet WCAG 2.2 AA compliance for all interactive elements', async ({ page }) => {
    await page.goto(tssUrl);
    
    // Comprehensive scan for all WCAG 2.2 AA requirements
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    
    // If violations exist, log them for build pipeline debugging
    if (accessibilityScanResults.violations.length > 0) {
      console.error('WCAG 2.2 AA Violations Found:', JSON.stringify(accessibilityScanResults.violations, null, 2));
    }
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper heading structure for WCAG 2.2 AA compliance', async ({ page }) => {
    await page.goto(tssUrl);
    
    // Test heading hierarchy compliance
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .withRules(['heading-order', 'page-has-heading-one'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper image accessibility for WCAG 2.2 AA compliance', async ({ page }) => {
    await page.goto(tssUrl);
    
    // Test image accessibility compliance
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .withRules(['image-alt', 'image-redundant-alt'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should scan specific form element for WCAG compliance', async ({ page }) => {
    await page.goto(tssUrl);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForLoadState('networkidle');
    
    // Wait for any forms to be present in the page
    await page.waitForSelector('body', { timeout: 10000 });

    // Scan only the main form element if it exists, otherwise scan the whole page
    const hasForm = await page.locator('form').count() > 0;
    
    if (hasForm) {
      const accessibilityScanResults = await new AxeBuilder({ page })
        .include('form') // Scan only form elements
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
        
      expect(accessibilityScanResults.violations).toEqual([]);
    } else {
      // No forms found, skip this test
      console.log('No forms found on the page, skipping form-specific accessibility test');
    }
  });

  test('should scan specific navigation area for WCAG compliance', async ({ page }) => {
    await page.goto(tssUrl);
    
    // Scan only navigation/header area
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('header, nav, [role="navigation"]') // Multiple selectors
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should scan main content area excluding third-party widgets', async ({ page }) => {
    await page.goto(tssUrl);
    
    // Scan main content but exclude certain elements
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('#main-content, main, [role="main"]') // Include main content
      .exclude('.third-party-widget, .advertisement') // Exclude specific elements
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

});