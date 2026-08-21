/**
 * Allure config used ONLY by `pnpm report:share`.
 *
 * The report the suite normally generates fetches its data at runtime from `data/` and
 * `widgets/`, so opening its `index.html` from disk shows an empty report - the browser
 * refuses the requests as cross-origin. That makes the ordinary `allure-report` folder
 * useless to send to anyone who is not going to serve it.
 *
 * `singleFile` inlines everything into one `index.html` instead, which opens by
 * double-clicking. Around 4 MB for a small run; it grows with attachments, so a long
 * run with screenshots and videos can be large.
 *
 * Not named `allurerc.mjs` on purpose: Allure loads that one automatically, and this
 * must apply only when it is passed with `--config`. The normal report, and the one
 * globalTeardown writes, stay exactly as they were.
 */
export default {
    name: 'TSS E2E Report',
    output: './allure-report-share',
    plugins: {
        awesome: {
            options: {
                singleFile: true,
            },
        },
    },
};
