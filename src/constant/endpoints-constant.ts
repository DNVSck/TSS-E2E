const PORTAL_BASE = '/portal';

export const ROUTES = {
    DEFAULT: '/',
    PORTAL: {
        SIGN_IN: `${PORTAL_BASE}/sign-in`,
        /** "Traders that you can represent" — the Agent banner "Select" target. */
        TRADERS: `${PORTAL_BASE}/company-profile/traders`,
        /** The Agent banner "Stop representing" action — matched as an href suffix
         *  (its full parent path is not asserted). */
        STOP_REPRESENTING: '/stop-representing',
    }
} as const;