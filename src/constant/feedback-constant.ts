/** The value each radio of the feedback form posts. */
export const TASK_EASE_SCORE = {
    VERY_DIFFICULT: '1',
    DIFFICULT: '2',
    NEITHER: '3',
    EASY: '4',
    VERY_EASY: '5',
} as const;

export const SATISFACTION_SCORE = {
    VERY_DISSATISFIED: '1',
    DISSATISFIED: '2',
    NEITHER: '3',
    SATISFIED: '4',
    VERY_SATISFIED: '5',
} as const;

export const FEEDBACK = {
    /** The names the check-your-answers "Change" links carry in `?field=`. */
    FIELD: {
        IS_PAGE_USEFUL: 'isPageUseful',
        COMMENT: 'comment',
    },
    /** Service pages the Beta banner can be used from, as the banner's `fromUrl` names them. */
    FROM_URL: {
        DIRECTION_OF_DECLARATION: '/declaration/form/direction-of-declaration',
        GB_NI_PROCESS: '/declaration/form/gb-ni-process',
    },
} as const;
