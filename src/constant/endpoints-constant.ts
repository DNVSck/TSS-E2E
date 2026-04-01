const PORTAL_BASE = '/portal';
const DECLARATION_BASE = `${PORTAL_BASE}/declaration/form`;

export const ROUTES = {
    DEFAULT: '/',
    PORTAL: {
        SIGN_IN: `${PORTAL_BASE}/sign-in`,
        DECLARATION_FORM: {
            INTRODUCTORY: `${DECLARATION_BASE}/introductory`
        }
    }
} as const;