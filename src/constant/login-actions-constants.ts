export const LOGIN_ACTIONS = {
    // Labels on the "Choose how to verify your identity" screen. The radios
    // themselves carry session-scoped UUIDs for id/value, so these labels are
    // the only stable way to select one - see SignInPage.authenticatorAppRadio.
    AUTHENTICATOR_APP_OPTION_LABEL: 'Get a code on your authenticator app',
    EMAIL_CODE_OPTION_LABEL: 'Receive a code by email',
} as const;