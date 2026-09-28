/**
 * Route SUFFIXES, deliberately without the "/portal" prefix: they are matched with
 * href$= / endsWith so the same locator works against a deployed portal and a local
 * dev server mounted on a different base path.
 */
export const ROUTES = {
    DEFAULT: '/',
    PORTAL: {
        SIGN_IN: '/sign-in',
        /** "Traders that you can represent" — the Agent banner "Select" target. */
        TRADERS: '/company-profile/traders',
        /** The Agent banner "Stop representing" action — matched as an href suffix
         *  (its full parent path is not asserted). */
        STOP_REPRESENTING: '/stop-representing',
        COMPANY_PROFILE: '/company-profile',
        REQUEST_EORI_CHANGE: '/company-profile/company-information/request-eori-change',
        COMPANY_INFORMATION_CHECK_ANSWERS: '/company-profile/company-information/edit/check-your-answer!',
    }
} as const;


export const MOVEMENT_ROUTE = {
    GOODS_MOVEMENT_SEGMENT: 'goods-movement',
    OVERVIEW_SEGMENT: 'overview',
    NEW_CONSIGNMENT_SEGMENT: 'new-consignment',
    GMR_RECORD_PATH: /\/goods-movement-records\/GMR\d+/,
} as const;

export const SUPPLEMENTARY_DECLARATION_ROUTE = {
    UNAUTHORISED_PARTIES_SEGMENT: 'unauthorised-parties',
} as const;
