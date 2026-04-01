import { ACCESSIBILITY_RULES } from '../../src/constant/accessibility-rules';
import { ACCESSIBILITY_TARGETS } from '../../src/constant/accessibility-targets';

import {
  test,
  getBaseUrl
} from '../test-hooks';

import { runAccessibilityCheck } from '../../src/core/util/accessibility-scanner';

test.describe('TSS Portal Page - WCAG 2.2 AA Compliance Tests', () => {

  test.describe('1. Perceivable - Make information and UI components presentable to users', () => {

    test.describe('1.1 Text Alternatives (A) - Provide text alternatives for non-text content', () => {

      test('Images should have proper alternative text @accessibility', async ({ basePage, makeAxeBuilder }, testInfo) => {
        await basePage.navigateToPortal(getBaseUrl(), testInfo);

        await runAccessibilityCheck({
          makeAxeBuilder,
          testInfo,
          step: 'Image Alt Text (WCAG 1.1.1)',
          rules: ACCESSIBILITY_RULES.IMAGE_ALT
        });
      });
    });

    test.describe('1.3 Adaptable (A/AA) - Create content that can be presented in different ways', () => {

      test('Heading structure should follow proper hierarchy @accessibility', async ({ basePage, makeAxeBuilder }, testInfo) => {
        await basePage.navigateToPortal(getBaseUrl(), testInfo);

        await runAccessibilityCheck({
          makeAxeBuilder,
          testInfo,
          step: 'Heading Hierarchy (WCAG 1.3.1)',
          rules: ACCESSIBILITY_RULES.HEADING_STRUCTURE
        });
      });

      test('Page should have proper document structure @accessibility', async ({ basePage, makeAxeBuilder }, testInfo) => {
        await basePage.navigateToPortal(getBaseUrl(), testInfo);

        await runAccessibilityCheck({
          makeAxeBuilder,
          testInfo,
          step: 'Check Document Structure (WCAG 1.3.1, 3.1.1)',
          rules: ACCESSIBILITY_RULES.DOCUMENT_STRUCTURE
        });
      });
    });

    test.describe('1.4 Distinguishable (A/AA) - Make it easier for users to see and hear content', () => {

      test('Color contrast should meet WCAG 2.2 AA standards @accessibility', async ({ basePage, makeAxeBuilder }, testInfo) => {
        await basePage.navigateToPortal(getBaseUrl(), testInfo);

        await runAccessibilityCheck({
          makeAxeBuilder,
          testInfo,
          step: 'Check Color Contrast (WCAG 1.4.3)',
          rules: ACCESSIBILITY_RULES.COLOR_CONTRAST
        });
      });

      test('Text content should be readable and properly structured @accessibility', async ({ basePage, makeAxeBuilder }, testInfo) => {
        await basePage.navigateToPortal(getBaseUrl(), testInfo);

        await runAccessibilityCheck({
          makeAxeBuilder,
          testInfo,
          step: 'Check Text Readability (WCAG 1.4.3, 1.4.4)',
          rules: ACCESSIBILITY_RULES.TEXT_READABILITY
        });
      });
    });
  });

  test.describe('2. Operable - UI components and navigation must be operable', () => {

    test.describe('2.1 Keyboard Accessible (A) - Make all functionality available from a keyboard', () => {

      test('Keyboard navigation should be fully accessible @accessibility', async ({ basePage, makeAxeBuilder }, testInfo) => {
        await basePage.navigateToPortal(getBaseUrl(), testInfo);

        await runAccessibilityCheck({
          makeAxeBuilder,
          testInfo,
          step: 'Check Keyboard Navigation (WCAG 2.1.1, 2.1.2)',
          rules: ACCESSIBILITY_RULES.KEYBOARD_NAV
        });
      });
    });

    test.describe('2.4 Navigable (A/AA) - Provide ways to help users navigate and find content', () => {

      test('Navigation area should be fully accessible @accessibility', async ({ basePage, makeAxeBuilder }, testInfo) => {
        await basePage.navigateToPortal(getBaseUrl(), testInfo);

        await runAccessibilityCheck({
          makeAxeBuilder,
          testInfo,
          step: 'Check Navigation Accessibility (WCAG 2.4.1, 2.4.3)',
          rules: ACCESSIBILITY_RULES.NAVIGATION_ACCESSIBILITY,
          include: ACCESSIBILITY_TARGETS.NAVIGATION
        });
      });

      test('Links should have descriptive text and proper context @accessibility', async ({ basePage, makeAxeBuilder }, testInfo) => {
        await basePage.navigateToPortal(getBaseUrl(), testInfo);

        await runAccessibilityCheck({
          makeAxeBuilder,
          testInfo,
          step: 'Check Link Accessibility (WCAG 2.4.4, 2.4.9)',
          rules: ACCESSIBILITY_RULES.LINK_ACCESSIBILITY
        });
      });
    });
  });

});
