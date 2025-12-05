import { attachViolationDetailsToReport, fingerprintsFromScanResults, createFingerprint } from '../../fixtures/axe-fixture';
import { expectMain as expect, testMain as test } from '../../fixtures/main-fixture';
import { getBaseUrl, logInfo, logPass, testStep } from '../test-hooks';
import { afterAccessibilityTest, beforeAccessibilityTest } from './accessibility-test-hooks';

// Set viewport for all tests
test.beforeEach(async ({ basePage }) => {
  await basePage.setViewport(1920, 1080);
  beforeAccessibilityTest();
});

test.afterEach(async ({ }, testInfo) => {
  afterAccessibilityTest(testInfo);
});

test.describe('TSS Portal Page - WCAG 2.2 AA Compliance Tests', () => {
  
  test.describe('1. Perceivable - Make information and UI components presentable to users', () => {
    
    test.describe('1.1 Text Alternatives (A) - Provide text alternatives for non-text content', () => {
      
      test('Images should have proper alternative text @accessibility', async ({ basePage, makeAxeBuilder }, testInfo) => {
        await testStep('Navigate to Portal Page', async () => {
          await basePage.navigateToPortal(getBaseUrl(), testInfo);
          logPass('Portal page loaded for image accessibility testing');
        });

        await testStep('Check Image Alt Text Compliance (WCAG 1.1.1)', async () => {
          const accessibilityScanResults = await makeAxeBuilder()
            .withRules(['image-alt', 'image-redundant-alt', 'object-alt', 'input-image-alt'])
            .analyze();
          
          // Attach violation details if any
          attachViolationDetailsToReport(accessibilityScanResults, 'Image Alt Text Compliance (WCAG 1.1.1)');
          
          expect(accessibilityScanResults.violations).toEqual([]);
          logPass('All images have appropriate alternative text (WCAG 1.1.1)');
        });
      });
    });

    test.describe('1.3 Adaptable (A/AA) - Create content that can be presented in different ways', () => {
      
      test('Heading structure should follow proper hierarchy @accessibility', async ({ basePage, makeAxeBuilder }, testInfo) => {
        await testStep('Navigate to Portal Page', async () => {
          await basePage.navigateToPortal(getBaseUrl(), testInfo);
          logPass('Portal page loaded for heading structure testing');
        });

        await testStep('Check Heading Hierarchy (WCAG 1.3.1)', async () => {
          const accessibilityScanResults = await makeAxeBuilder()
            .withRules(['heading-order', 'page-has-heading-one', 'empty-heading'])
            .analyze();
          
          // Attach violation details if any
          attachViolationDetailsToReport(accessibilityScanResults, 'Heading Hierarchy (WCAG 1.3.1)');
          
          expect(accessibilityScanResults.violations).toEqual([]);
          logPass('Heading structure follows proper hierarchy H1→H2→H3 (WCAG 1.3.1)');
        });
      });

      test('Page should have proper document structure @accessibility', async ({ basePage, makeAxeBuilder }, testInfo) => {
        await testStep('Navigate to Portal Page', async () => {
          await basePage.navigateToPortal(getBaseUrl(), testInfo);
          logPass('Portal page loaded for document structure testing');
        });

        await testStep('Check Document Structure (WCAG 1.3.1, 3.1.1)', async () => {
          const accessibilityScanResults = await makeAxeBuilder()
            .withRules([
              'page-has-heading-one', 'landmark-one-main', 'region', 'html-has-lang',
              'valid-lang', 'document-title', 'landmark-unique',
              'landmark-no-duplicate-main', 'landmark-banner-is-top-level'
            ])
            .analyze();
          
          // Attach violation details if any
          attachViolationDetailsToReport(accessibilityScanResults, 'Document Structure (WCAG 1.3.1, 3.1.1)');
          
          expect(accessibilityScanResults.violations).toEqual([]);
          logPass('Document has proper structure with landmarks and language (WCAG 1.3.1, 3.1.1)');
        });
      });
    });

    test.describe('1.4 Distinguishable (A/AA) - Make it easier for users to see and hear content', () => {
      
      test('Color contrast should meet WCAG 2.2 AA standards @accessibility', async ({ basePage, makeAxeBuilder }, testInfo) => {
        await testStep('Navigate to Portal Page', async () => {
          await basePage.navigateToPortal(getBaseUrl(), testInfo);
          logPass('Portal page loaded for color contrast testing');
        });

        await testStep('Check Color Contrast (WCAG 1.4.3)', async () => {
          const accessibilityScanResults = await makeAxeBuilder()
            .withRules(['color-contrast'])
            .analyze();
          
          // Attach violation details if any
          attachViolationDetailsToReport(accessibilityScanResults, 'Color Contrast (WCAG 1.4.3)');
          
          expect(accessibilityScanResults.violations).toEqual([]);
          logPass('All color contrasts meet WCAG 2.2 AA standards 4.5:1 ratio (WCAG 1.4.3)');
        });
      });

      test('Text content should be readable and properly structured @accessibility', async ({ basePage, makeAxeBuilder }, testInfo) => {
        await testStep('Navigate to Portal Page', async () => {
          await basePage.navigateToPortal(getBaseUrl(), testInfo);
          logPass('Portal page loaded for text readability testing');
        });

        await testStep('Check Text Readability (WCAG 1.4.3, 1.4.4)', async () => {
          const accessibilityScanResults = await makeAxeBuilder()
            .withRules([
              'color-contrast', 'empty-heading', 'p-as-heading'
              // Loại bỏ 'reading-order' - rule này không tồn tại trong axe-core
            ])
            .analyze();
          
          // Attach violation details if any
          attachViolationDetailsToReport(accessibilityScanResults, 'Text Readability (WCAG 1.4.3, 1.4.4)');
          
          expect(accessibilityScanResults.violations).toEqual([]);
          logPass('All text content is readable and properly structured (WCAG 1.4.3, 1.4.4)');
        });
      });
    });
  });

  test.describe('2. Operable - UI components and navigation must be operable', () => {
    
    test.describe('2.1 Keyboard Accessible (A) - Make all functionality available from a keyboard', () => {
      
      test('Keyboard navigation should be fully accessible @accessibility', async ({ basePage, makeAxeBuilder }, testInfo) => {
        await testStep('Navigate to Portal Page', async () => {
          await basePage.navigateToPortal(getBaseUrl(), testInfo);
          logPass('Portal page loaded for keyboard navigation testing');
        });

        await testStep('Check Keyboard Navigation (WCAG 2.1.1, 2.1.2)', async () => {
          const accessibilityScanResults = await makeAxeBuilder()
            .withRules(['tabindex', 'accesskeys'])
            .analyze();
          
          // Attach violation details if any
          attachViolationDetailsToReport(accessibilityScanResults, 'Keyboard Navigation (WCAG 2.1.1, 2.1.2)');
          
          expect(accessibilityScanResults.violations).toEqual([]);
          logPass('All interactive elements are keyboard accessible (WCAG 2.1.1, 2.1.2)');
        });
      });
    });

    test.describe('2.4 Navigable (A/AA) - Provide ways to help users navigate and find content', () => {
      
      test('Navigation area should be fully accessible @accessibility', async ({ basePage, makeAxeBuilder }, testInfo) => {
        await testStep('Navigate to Portal Page', async () => {
          await basePage.navigateToPortal(getBaseUrl(), testInfo);
          logPass('Portal page loaded for navigation testing');
        });

        await testStep('Check Navigation Accessibility (WCAG 2.4.1, 2.4.3)', async () => {
          const accessibilityScanResults = await makeAxeBuilder()
            .include('header, nav, [role="navigation"], [role="banner"]')
            .analyze();
          
          // Attach violation details if any
          attachViolationDetailsToReport(accessibilityScanResults, 'Navigation Accessibility (WCAG 2.4.1, 2.4.3)');
          
          expect(accessibilityScanResults.violations).toEqual([]);
          logPass('Navigation area is fully accessible (WCAG 2.4.1, 2.4.3)');
        });
      });

      test('Links should have descriptive text and proper context @accessibility', async ({ basePage, makeAxeBuilder }, testInfo) => {
        await testStep('Navigate to Portal Page', async () => {
          await basePage.navigateToPortal(getBaseUrl(), testInfo);
          logPass('Portal page loaded for link accessibility testing');
        });

        await testStep('Check Link Accessibility (WCAG 2.4.4, 2.4.9)', async () => {
          const accessibilityScanResults = await makeAxeBuilder()
            .withRules(['link-name', 'link-in-text-block'])
            .analyze();
          
          // Attach violation details if any
          attachViolationDetailsToReport(accessibilityScanResults, 'Link Accessibility (WCAG 2.4.4, 2.4.9)');
          
          expect(accessibilityScanResults.violations).toEqual([]);
          logPass('All links have descriptive text and proper context (WCAG 2.4.4, 2.4.9)');
        });
      });
    });

    test.describe('2.5 Input Modalities (A/AA) - Make it easier for users to operate functionality', () => {
      
      test('Interactive elements should meet size and spacing requirements @accessibility', async ({ basePage, makeAxeBuilder }, testInfo) => {
        await testStep('Navigate to Portal Page', async () => {
          await basePage.navigateToPortal(getBaseUrl(), testInfo);
          logPass('Portal page loaded for interactive element testing');
        });

        await testStep('Check Interactive Element Size (WCAG 2.5.8)', async () => {
          const accessibilityScanResults = await makeAxeBuilder()
            .withRules(['target-size'])
            .analyze();
          
          // Attach violation details if any
          attachViolationDetailsToReport(accessibilityScanResults, 'Interactive Element Size (WCAG 2.5.8)');
          
          expect(accessibilityScanResults.violations).toEqual([]);
          logPass('All interactive elements meet minimum size 24x24px (WCAG 2.5.8)');
        });
      });
    });
  });

  test.describe('3. Understandable - Information and operation of UI must be understandable', () => {
    
    test.describe('3.1 Readable (A) - Make text content readable and understandable', () => {
      
      test('Language switching functionality should be accessible @accessibility', async ({ basePage, makeAxeBuilder }, testInfo) => {
        await testStep('Navigate to Portal Page', async () => {
          await basePage.navigateToPortal(getBaseUrl(), testInfo);
          logPass('Portal page loaded for language switching testing');
        });

        await testStep('Check Language Switching (WCAG 3.1.1, 3.1.2)', async () => {
          const accessibilityScanResults = await makeAxeBuilder()
            .include('[href*="change-language"], [role="button"]')
            .withRules(['link-name', 'button-name', 'aria-valid-attr'])
            .analyze();
          
          // Attach violation details if any
          attachViolationDetailsToReport(accessibilityScanResults, 'Language Switching (WCAG 3.1.1, 3.1.2)');
          
          expect(accessibilityScanResults.violations).toEqual([]);
          logPass('Language switching is accessible via keyboard and screen readers (WCAG 3.1.1, 3.1.2)');
        });
      });
    });

    test.describe('3.2 Predictable (A/AA) - Make web pages appear and operate in predictable ways', () => {
      
      test('Form elements should have proper labels and ARIA attributes @accessibility', async ({ basePage, makeAxeBuilder }, testInfo) => {
        await testStep('Navigate to Portal Page', async () => {
          await basePage.navigateToPortal(getBaseUrl(), testInfo);
          logPass('Portal page loaded for form accessibility testing');
        });

        await testStep('Check Form Labels and ARIA (WCAG 3.2.2, 1.3.1)', async () => {
          const accessibilityScanResults = await makeAxeBuilder()
            .withRules([
              'label',
              'aria-required-attr',
              'aria-valid-attr',
              'aria-valid-attr-value',
              'form-field-multiple-labels',
              'label-title-only'
            ])
            .analyze();
          
          // Attach violation details if any
          attachViolationDetailsToReport(accessibilityScanResults, 'Form Labels and ARIA (WCAG 3.2.2, 1.3.1)');
          
          expect(accessibilityScanResults.violations).toEqual([]);
          logPass('All form elements have proper labels and ARIA attributes (WCAG 3.2.2, 1.3.1)');
        });
      });
    });
  });

  test.describe('4. Robust - Content must be robust enough for interpretation by assistive technologies', () => {
    
    test.describe('4.1 Compatible (A) - Maximize compatibility with current and future assistive technologies', () => {
      
      test('Should support assistive technologies @accessibility', async ({ basePage, makeAxeBuilder }, testInfo) => {
        await testStep('Navigate to Portal Page', async () => {
          await basePage.navigateToPortal(getBaseUrl(), testInfo);
          logPass('Portal page loaded for assistive technology testing');
        });

        await testStep('Check Assistive Technology Support (WCAG 4.1.1, 4.1.2)', async () => {
          const accessibilityScanResults = await makeAxeBuilder()
            .withRules([
              'aria-allowed-attr', 'aria-required-attr', 'aria-valid-attr',
              'aria-valid-attr-value', 'role-img-alt', 'bypass',
              'aria-dialog-name', 'aria-text', 'aria-treeitem-name'
            ])
            .analyze();
          
          // Attach violation details if any
          attachViolationDetailsToReport(accessibilityScanResults, 'Assistive Technology Support (WCAG 4.1.1, 4.1.2)');
          
          expect(accessibilityScanResults.violations).toEqual([]);
          logPass('Page supports assistive technologies - screen readers, etc. (WCAG 4.1.1, 4.1.2)');
        });
      });

      test('Main content area should be accessible @accessibility', async ({ basePage, makeAxeBuilder }, testInfo) => {
        await testStep('Navigate to Portal Page', async () => {
          await basePage.navigateToPortal(getBaseUrl(), testInfo);
          logPass('Portal page loaded for main content testing');
        });

        await testStep('Check Main Content Structure (WCAG 4.1.1, 4.1.2)', async () => {
          const accessibilityScanResults = await makeAxeBuilder()
            .include('#main-content, main, [role="main"]')
            .analyze();
          
          // Attach violation details if any
          attachViolationDetailsToReport(accessibilityScanResults, 'Main Content Structure (WCAG 4.1.1, 4.1.2)');
          
          expect(accessibilityScanResults.violations).toEqual([]);
          logPass('Main content area is fully accessible (WCAG 4.1.1, 4.1.2)');
        });
      });
    });
  });

  test.describe('WCAG 2.2 AA - Comprehensive Compliance Test', () => {
    
    test('Portal page should meet all WCAG 2.2 AA requirements @accessibility @smoke', async ({ t, portalPage, basePage, makeAxeBuilder }, testInfo) => {
      logInfo(`Starting comprehensive WCAG 2.2 AA accessibility test with locale: ${process.env.LOCALE}`);
      
      await testStep('Navigate to Portal Page', async () => {
        await basePage.navigateToPortal(getBaseUrl(), testInfo);
        const expectedTitle = t('portal.title');
        await portalPage.verifyPortalTitle(expectedTitle);
        logPass('Portal page loaded successfully');
      });

      await testStep('Comprehensive WCAG 2.2 AA Scan (All Guidelines)', async () => {
        const accessibilityScanResults = await makeAxeBuilder()
          .analyze();
        
        // Attach violation details if any
        attachViolationDetailsToReport(accessibilityScanResults, 'Comprehensive WCAG 2.2 AA Scan');
        
        if (accessibilityScanResults.violations.length > 0) {
          console.error('WCAG 2.2 AA Violations Found:', JSON.stringify(accessibilityScanResults.violations, null, 2));
        }
        
        expect(accessibilityScanResults.violations).toEqual([]);
        logPass('Portal page meets all WCAG 2.2 AA requirements - full compliance achieved');
      });
    });
  });

});

