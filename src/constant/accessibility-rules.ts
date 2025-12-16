
/**
 * Accessibility rule groups — centralized to avoid typos.
 */

export const ACCESSIBILITY_RULES = {
  IMAGE_ALT: [
    'image-alt',
    'image-redundant-alt',
    'object-alt',
    'input-image-alt'
  ],

  HEADING_STRUCTURE: [
    'heading-order',
    'page-has-heading-one',
    'empty-heading'
  ],

  DOCUMENT_STRUCTURE: [
    'html-has-lang',
    'valid-lang',
    'document-title',
    'region',
    'landmark-one-main',
    'landmark-unique',
    'landmark-no-duplicate-main',
    'landmark-banner-is-top-level',
    'landmark-main-is-top-level',
    'landmark-contentinfo-is-top-level',
    'landmark-no-duplicate-banner',
    'landmark-no-duplicate-contentinfo'
  ],

  COLOR_CONTRAST: ['color-contrast'],

  TEXT_READABILITY: [
    'color-contrast',
    'empty-heading',
    'p-as-heading'
  ],

  KEYBOARD_NAV: [
    'skip-link',
    'tabindex',
    'accesskeys'
],

  LINK_ACCESSIBILITY: ['link-name', 'link-in-text-block'],

  NAVIGATION_ACCESSIBILITY: [
    // Keyboard + skip
    'skip-link',
    'tabindex',

    // Structure
    'heading-order',
    'page-has-heading-one',
    'empty-heading',
    'region',

    // Landmarks
    'landmark-one-main',
    'landmark-main-is-top-level',
    'landmark-banner-is-top-level',
    'landmark-contentinfo-is-top-level',
    'landmark-unique',
    'landmark-no-duplicate-main',
    'landmark-no-duplicate-banner',
    'landmark-no-duplicate-contentinfo',

    // ARIA
    'aria-allowed-role'
  ],

  FORM_LABELS: [
    'label',
    'aria-required-attr',
    'aria-valid-attr',
    'aria-valid-attr-value',
    'form-field-multiple-labels',
    'label-title-only'
  ],

  INTERACTIVE_SIZE: ['target-size'],

  ASSISTIVE_TECH: [
    'aria-allowed-attr',
    'aria-allowed-role',
    'aria-valid-attr',
    'aria-required-attr',
    'aria-valid-attr-value',
    'aria-dialog-name',
    'aria-text',
    'aria-treeitem-name',
    'presentation-role-conflict'
  ],

  LANGUAGE_RULES: [
  'html-has-lang',         
  'valid-lang',                             
  'link-name',             
  'button-name',           
  'aria-valid-attr',       
  'aria-allowed-role'
]
};
