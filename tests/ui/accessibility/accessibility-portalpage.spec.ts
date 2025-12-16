import { attachViolationDetailsToReport, fingerprintsFromScanResults, createFingerprint } from '../../fixtures/axe-fixture';
import { ACCESSIBILITY_RULES } from '../../constant/accessibility-rules';
import { ACCESSIBILITY_TARGETS } from '../../constant/accessibility-targets';
import { expectMain as expect, testMain as test } from '../../fixtures/main-fixture';
import { runAccessibilityCheck } from  '../../core/util/accessibility-scanner';
import { getBaseUrl, logInfo, logPass, testStep } from '../test-hooks';
import { afterAccessibilityTest, beforeAccessibilityTest } from './accessibility-test-hooks';
import { ENVIRONMENT_INFO } from '../../config/environment';

// Set viewport for all tests
test.beforeEach(async ({ basePage }) => {
  await basePage.setViewport(ENVIRONMENT_INFO.viewport.width, ENVIRONMENT_INFO.viewport.height);
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

        await runAccessibilityCheck({
          makeAxeBuilder,
          testInfo,
          step: 'Image Alt Text (WCAG 1.1.1)',
          rules: ACCESSIBILITY_RULES.IMAGE_ALT
        });

        logPass('All images have proper alternative text (WCAG 1.1.1)');
      });
    });

    test.describe('1.3 Adaptable (A/AA) - Create content that can be presented in different ways', () => {
      
      test('Heading structure should follow proper hierarchy @accessibility', async ({ basePage, makeAxeBuilder }, testInfo) => {
        await testStep('Navigate to Portal Page', async () => {
          await basePage.navigateToPortal(getBaseUrl(), testInfo);
          logPass('Portal page loaded for heading structure testing');
        });

        await runAccessibilityCheck({
          makeAxeBuilder,
          testInfo,
          step: 'Heading Hierarchy (WCAG 1.3.1)',
          rules: ACCESSIBILITY_RULES.HEADING_STRUCTURE
        });

        logPass('Heading structure follows proper hierarchy H1→H2→H3 (WCAG 1.3.1)');
      });

      test('Page should have proper document structure @accessibility', async ({ basePage, makeAxeBuilder }, testInfo) => {
        await testStep('Navigate to Portal Page', async () => {
          await basePage.navigateToPortal(getBaseUrl(), testInfo);
          logPass('Portal page loaded for document structure testing');
        });

        await runAccessibilityCheck({
          makeAxeBuilder,
          testInfo,
          step: 'Check Document Structure (WCAG 1.3.1, 3.1.1)',
          rules: ACCESSIBILITY_RULES.DOCUMENT_STRUCTURE
        });
        logPass('Document has proper structure with landmarks and language (WCAG 1.3.1, 3.1.1)');
      });
    });

    test.describe('1.4 Distinguishable (A/AA) - Make it easier for users to see and hear content', () => {
      
      test('Color contrast should meet WCAG 2.2 AA standards @accessibility', async ({ basePage, makeAxeBuilder }, testInfo) => {
        await testStep('Navigate to Portal Page', async () => {
          await basePage.navigateToPortal(getBaseUrl(), testInfo);
          logPass('Portal page loaded for color contrast testing');
        });

        await runAccessibilityCheck({
          makeAxeBuilder,
          testInfo,
          step: 'Check Color Contrast (WCAG 1.4.3)',
          rules: ACCESSIBILITY_RULES.COLOR_CONTRAST
        });
        logPass('All color contrasts meet WCAG 2.2 AA standards 4.5:1 ratio (WCAG 1.4.3)');
        
      });

      test('Text content should be readable and properly structured @accessibility', async ({ basePage, makeAxeBuilder }, testInfo) => {
        await testStep('Navigate to Portal Page', async () => {
          await basePage.navigateToPortal(getBaseUrl(), testInfo);
          logPass('Portal page loaded for text readability testing');
        });

        await runAccessibilityCheck({
          makeAxeBuilder,
          testInfo,
          step: 'Check Text Readability (WCAG 1.4.3, 1.4.4)',
          rules: ACCESSIBILITY_RULES.TEXT_READABILITY
        });
        logPass('All text content is readable and properly structured (WCAG 1.4.3, 1.4.4)');

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

        await runAccessibilityCheck({
          makeAxeBuilder,
          testInfo,
          step: 'Check Keyboard Navigation (WCAG 2.1.1, 2.1.2)',
          rules: ACCESSIBILITY_RULES.KEYBOARD_NAV
        });
        logPass('All interactive elements are keyboard accessible (WCAG 2.1.1, 2.1.2)');

      });
    });

    test.describe('2.4 Navigable (A/AA) - Provide ways to help users navigate and find content', () => {
      
      test('Navigation area should be fully accessible @accessibility', async ({ basePage, makeAxeBuilder }, testInfo) => {
        await testStep('Navigate to Portal Page', async () => {
          await basePage.navigateToPortal(getBaseUrl(), testInfo);
          logPass('Portal page loaded for navigation testing');
        });

        await runAccessibilityCheck({
          makeAxeBuilder,
          testInfo,
          step: 'Check Navigation Accessibility (WCAG 2.4.1, 2.4.3)',
          rules: ACCESSIBILITY_RULES.NAVIGATION_ACCESSIBILITY,
          include: ACCESSIBILITY_TARGETS.NAVIGATION
        });
        logPass('Navigation area is fully accessible (WCAG 2.4.1, 2.4.3)');

      });

      test('Links should have descriptive text and proper context @accessibility', async ({ basePage, makeAxeBuilder }, testInfo) => {
        await testStep('Navigate to Portal Page', async () => {
          await basePage.navigateToPortal(getBaseUrl(), testInfo);
          logPass('Portal page loaded for link accessibility testing');
        });

        await runAccessibilityCheck({
          makeAxeBuilder,
          testInfo,
          step: 'Check Link Accessibility (WCAG 2.4.4, 2.4.9)',
          rules: ACCESSIBILITY_RULES.LINK_ACCESSIBILITY,
        });
        logPass('All links have descriptive text and proper context (WCAG 2.4.4, 2.4.9)');

      });
    });

    test.describe('2.5 Input Modalities (A/AA) - Make it easier for users to operate functionality', () => {
      
      test('Interactive elements should meet size and spacing requirements @accessibility', async ({ basePage, makeAxeBuilder }, testInfo) => {
        await testStep('Navigate to Portal Page', async () => {
          await basePage.navigateToPortal(getBaseUrl(), testInfo);
          logPass('Portal page loaded for interactive element testing');
        });

        await runAccessibilityCheck({
          makeAxeBuilder,
          testInfo,
          step: 'Check Interactive Element Size (WCAG 2.5.8)',
          rules: ACCESSIBILITY_RULES.INTERACTIVE_SIZE,
        });
        logPass('All interactive elements meet minimum size 24x24px (WCAG 2.5.8)');

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

        await runAccessibilityCheck({
          makeAxeBuilder,
          testInfo,
          step: 'Check Language Switching (WCAG 3.1.1, 3.1.2)',
          rules: ACCESSIBILITY_RULES.LANGUAGE_RULES,
          include: ACCESSIBILITY_TARGETS.LANGUAGE_SWITCHER
        });
        logPass('Language switching is accessible via keyboard and screen readers (WCAG 3.1.1, 3.1.2)');

      });
    });

    test.describe('3.2 Predictable (A/AA) - Make web pages appear and operate in predictable ways', () => {
      
      test('Form elements should have proper labels and ARIA attributes @accessibility', async ({ basePage, makeAxeBuilder }, testInfo) => {
        await testStep('Navigate to Portal Page', async () => {
          await basePage.navigateToPortal(getBaseUrl(), testInfo);
          logPass('Portal page loaded for form accessibility testing');
        });

        await runAccessibilityCheck({
          makeAxeBuilder,
          testInfo,
          step: 'Check Form Labels and ARIA (WCAG 3.2.2, 1.3.1)',
          rules: ACCESSIBILITY_RULES.FORM_LABELS,
          include: ACCESSIBILITY_TARGETS.FORMS
        });
        logPass('All form elements have proper labels and ARIA attributes (WCAG 3.2.2, 1.3.1)');

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

        await runAccessibilityCheck({
          makeAxeBuilder,
          testInfo,
          step: 'Check Assistive Technology Support (WCAG 4.1.1, 4.1.2)',
          rules: ACCESSIBILITY_RULES.ASSISTIVE_TECH
        });
        logPass('Page supports assistive technologies - screen readers, etc. (WCAG 4.1.1, 4.1.2)');

      });

      test('Main content area should be accessible @accessibility', async ({ basePage, makeAxeBuilder }, testInfo) => {
        await testStep('Navigate to Portal Page', async () => {
          await basePage.navigateToPortal(getBaseUrl(), testInfo);
          logPass('Portal page loaded for main content testing');
        });

        await runAccessibilityCheck({
          makeAxeBuilder,
          testInfo,
          step: 'Check Main Content Structure (WCAG 4.1.1, 4.1.2)',
          include: ACCESSIBILITY_TARGETS.MAIN
        });
        logPass('Main content area is fully accessible (WCAG 4.1.1, 4.1.2)');

      });
    });
  });

  test.describe('WCAG 2.2 AA - Comprehensive Compliance Test', () => {
    
    test('Portal page should meet all WCAG 2.2 AA requirements @accessibility @smoke', async ({ t, portalPage, basePage, makeAxeBuilder }, testInfo) => {
      logInfo(`Starting comprehensive WCAG 2.2 AA accessibility test with locale: ${ENVIRONMENT_INFO.currentLocale}`);
      
      await testStep('Navigate to Portal Page', async () => {
        await basePage.navigateToPortal(getBaseUrl(), testInfo);
        const expectedTitle = t('portal.title');
        await portalPage.verifyPortalTitle(expectedTitle);
        logPass('Portal page loaded successfully');
      });

      await runAccessibilityCheck({
          makeAxeBuilder,
          testInfo,
          step: 'Comprehensive WCAG 2.2 AA Scan (All Guidelines)',
        });
        logPass('Portal page meets all WCAG 2.2 AA requirements - full compliance achieved');

    });
  });

});

