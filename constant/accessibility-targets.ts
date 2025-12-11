export const ACCESSIBILITY_TARGETS = {
  NAVIGATION: 'header, nav, [role="navigation"], [role="banner"]',
  MAIN: '#main-content, main, [role="main"]',
  FOOTER: 'footer, [role="contentinfo"]',
  IMAGES: 'img, svg, picture',
  FORMS: 'form, input, select, textarea, button',
  LANGUAGE_SWITCHER: `
    a[href*="/portal/change-language"],
    [href*="change-language"],
    button[aria-label*="language"],
    button[aria-label*="Change language"],
    [role="button"][aria-label*="language"]`

};