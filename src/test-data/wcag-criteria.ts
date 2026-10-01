export interface WcagCriterion {
    id: string;
    name: string;
    level: 'A' | 'AA' | 'AAA';
    /** Who loses what when this criterion fails. Authored, not measured by axe. */
    why: string;
    /** Slug of the official W3C Understanding page, appended to UNDERSTANDING_BASE. */
    understanding: string;
    rules: string[];
}

export const UNDERSTANDING_BASE = 'https://www.w3.org/WAI/WCAG22/Understanding/';

export const WCAG_CRITERIA: WcagCriterion[] = [
    {
        id: '1.1.1', name: 'Non-text Content', level: 'A',
        why: 'Images, icons and image buttons carry meaning a screen reader cannot see. '
            + 'Without a text alternative that meaning never reaches the user.',
        understanding: 'non-text-content',
        rules: ['aria-meter-name', 'aria-progressbar-name', 'image-alt', 'input-image-alt',
            'object-alt', 'role-img-alt', 'svg-img-alt'],
    },
    {
        id: '1.2.1', name: 'Audio-only and Video-only (Prerecorded)', level: 'A',
        why: 'Media with only one track leaves out anyone who cannot use that track. '
            + 'A transcript or description gives them the same content.',
        understanding: 'audio-only-and-video-only-prerecorded',
        rules: ['audio-caption'],
    },
    {
        id: '1.2.2', name: 'Captions (Prerecorded)', level: 'A',
        why: 'Spoken content in video is lost to deaf and hard-of-hearing users unless '
            + 'captions carry it.',
        understanding: 'captions-prerecorded',
        rules: ['video-caption'],
    },
    {
        id: '1.3.1', name: 'Info and Relationships', level: 'A',
        why: 'Structure that sighted users read off the layout - headings, lists, tables, '
            + 'labels - must also exist in the markup. A screen reader user has only the '
            + 'markup, so fake structure loses them the grouping and order everyone else sees.',
        understanding: 'info-and-relationships',
        rules: ['aria-hidden-body', 'aria-required-children', 'aria-required-parent',
            'definition-list', 'dlitem', 'list', 'listitem', 'p-as-heading',
            'table-fake-caption', 'td-has-header', 'td-headers-attr', 'th-has-data-cells'],
    },
    {
        id: '1.3.4', name: 'Orientation', level: 'AA',
        why: 'Locking to one orientation blocks users whose device is fixed in the other, '
            + 'such as a wheelchair-mounted tablet.',
        understanding: 'orientation',
        rules: ['css-orientation-lock'],
    },
    {
        id: '1.3.5', name: 'Identify Input Purpose', level: 'AA',
        why: 'Naming what a field collects lets the browser fill it in, so users with motor '
            + 'or memory difficulties do not have to type it.',
        understanding: 'identify-input-purpose',
        rules: ['autocomplete-valid'],
    },
    {
        id: '1.4.1', name: 'Use of Color', level: 'A',
        why: 'Colour alone is invisible to colour-blind users and on a monochrome display. '
            + 'The same information needs a second cue.',
        understanding: 'use-of-color',
        rules: ['link-in-text-block'],
    },
    {
        id: '1.4.2', name: 'Audio Control', level: 'A',
        why: 'Audio that starts by itself drowns out a screen reader, and the user cannot '
            + 'hear the controls that would stop it.',
        understanding: 'audio-control',
        rules: ['no-autoplay-audio'],
    },
    {
        id: '1.4.3', name: 'Contrast (Minimum)', level: 'AA',
        why: 'Text too close in tone to its background is unreadable for users with low '
            + 'vision, and for anyone on a screen in daylight.',
        understanding: 'contrast-minimum',
        rules: ['color-contrast'],
    },
    {
        id: '1.4.4', name: 'Resize Text', level: 'AA',
        why: 'Users with low vision enlarge text. If the layout breaks or clips at 200 per '
            + 'cent, the content is gone.',
        understanding: 'resize-text',
        rules: ['meta-viewport'],
    },
    {
        id: '1.4.12', name: 'Text Spacing', level: 'AA',
        why: 'Users with dyslexia widen spacing to read. Content must reflow rather than '
            + 'overlap or get cut off.',
        understanding: 'text-spacing',
        rules: ['avoid-inline-spacing'],
    },
    {
        id: '2.1.1', name: 'Keyboard', level: 'A',
        why: 'Anyone who cannot use a mouse - screen reader users, people with tremor, '
            + 'people on switch devices - reaches everything by keyboard or not at all.',
        understanding: 'keyboard',
        rules: ['frame-focusable-content', 'scrollable-region-focusable',
            'server-side-image-map'],
    },
    {
        id: '2.1.3', name: 'Keyboard (No Exception)', level: 'AAA',
        why: 'The same as Keyboard, with no exception for input that depends on timing.',
        understanding: 'keyboard-no-exception',
        rules: ['scrollable-region-focusable'],
    },
    {
        id: '2.2.1', name: 'Timing Adjustable', level: 'A',
        why: 'A time limit that cannot be extended locks out anyone who reads, types or '
            + 'navigates more slowly.',
        understanding: 'timing-adjustable',
        rules: ['meta-refresh'],
    },
    {
        id: '2.2.2', name: 'Pause, Stop, Hide', level: 'A',
        why: 'Moving or blinking content distracts users with attention difficulties and '
            + 'can trigger seizures. It must be stoppable.',
        understanding: 'pause-stop-hide',
        rules: ['blink', 'marquee'],
    },
    {
        id: '2.4.1', name: 'Bypass Blocks', level: 'A',
        why: 'Without a skip link or landmarks, a keyboard user tabs through the whole '
            + 'header on every page before reaching the content.',
        understanding: 'bypass-blocks',
        rules: ['bypass'],
    },
    {
        id: '2.4.2', name: 'Page Titled', level: 'A',
        why: 'The title is what a screen reader announces first and what labels the browser '
            + 'tab. Without it users cannot tell pages apart.',
        understanding: 'page-titled',
        rules: ['document-title'],
    },
    {
        id: '2.4.4', name: 'Link Purpose (In Context)', level: 'A',
        why: 'Screen reader users often pull up a list of links out of context. A link whose '
            + 'text says nothing tells them nothing.',
        understanding: 'link-purpose-in-context',
        rules: ['area-alt', 'link-name'],
    },
    {
        id: '2.5.3', name: 'Label in Name', level: 'A',
        why: 'Voice control users say the label they can see. If the accessible name does '
            + 'not contain it, the spoken command fails.',
        understanding: 'label-in-name',
        rules: ['label-content-name-mismatch'],
    },
    {
        id: '2.5.8', name: 'Target Size (Minimum)', level: 'AA',
        why: 'Targets too small to hit are unusable for people with tremor or limited '
            + 'dexterity, and on touch screens generally.',
        understanding: 'target-size-minimum',
        rules: ['target-size'],
    },
    {
        id: '3.1.1', name: 'Language of Page', level: 'A',
        why: 'A screen reader picks its pronunciation from the page language. Wrong or '
            + 'missing, the page is read with the wrong rules and can be unintelligible.',
        understanding: 'language-of-page',
        rules: ['html-has-lang', 'html-lang-valid', 'html-xml-lang-mismatch'],
    },
    {
        id: '3.1.2', name: 'Language of Parts', level: 'AA',
        why: 'A passage in another language needs marking, or the screen reader reads it '
            + 'with the wrong pronunciation rules.',
        understanding: 'language-of-parts',
        rules: ['valid-lang'],
    },
    {
        id: '3.3.2', name: 'Labels or Instructions', level: 'A',
        why: 'A field with no label leaves the user guessing what to type, and a screen '
            + 'reader announces the control with no idea what it is for.',
        understanding: 'labels-or-instructions',
        rules: ['form-field-multiple-labels'],
    },
    {
        id: '4.1.2', name: 'Name, Role, Value', level: 'A',
        why: 'Assistive technology needs each control to say what it is, what it does and '
            + 'what state it is in. Missing any of the three makes the control unusable.',
        understanding: 'name-role-value',
        rules: ['area-alt', 'aria-allowed-attr', 'aria-braille-equivalent',
            'aria-command-name', 'aria-conditional-attr', 'aria-deprecated-role',
            'aria-hidden-body', 'aria-hidden-focus', 'aria-input-field-name',
            'aria-prohibited-attr', 'aria-required-attr', 'aria-roledescription',
            'aria-roles', 'aria-toggle-field-name', 'aria-tooltip-name', 'aria-valid-attr',
            'aria-valid-attr-value', 'button-name', 'duplicate-id-aria', 'frame-title',
            'frame-title-unique', 'input-button-name', 'input-image-alt', 'label',
            'link-name', 'nested-interactive', 'select-name', 'summary-name'],
    },
];
