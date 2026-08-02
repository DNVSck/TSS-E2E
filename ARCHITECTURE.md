# Architecture

How this suite is organised, and the rules that keep it that way. Read this before
adding a screen, a journey or a page object - most "where do I put this?" questions
are answered below, and several of the obvious-looking answers have already been
tried and rejected (see the last section).

## The layers

```
tests/functional/**.spec.ts     what to test, and the data that makes this case different
        |
        v
src/flows/common-flows/         the whole journey, portal -> submit. The ONLY flows a spec calls.
        |
        v
src/flows/<domain>/*-flow.ts    one journey's spine: which screens it visits, in what order
        |
        v
src/flows/<domain>/*-steps.ts   one method per screen. Owns that screen's Allure step name.
        |
        v
src/page-object/                locators and raw interaction. Nothing else.
```

`src/test-data/` feeds the spec. `src/constant/` feeds the test data.

## Where code goes

| Directory | Holds | Never holds |
| --- | --- | --- |
| `page-object/` | locators, `fill`/`check`/`selectOption`, one method per screen or field | `ReportLog.step`, test-data types, journey knowledge |
| `flows/<domain>/*-steps.ts` | one method per wizard screen, each wrapping `ReportLog.step` | locators, journey order |
| `flows/<domain>/*-flow.ts` | the screen list of ONE journey, plus its conditionals | locators, step names of its own |
| `flows/common-flows/` | the journey a spec runs end to end | driving a page directly |
| `test-data/` | factories: `defaults` + `...overrides` | logic, waits, assertions |
| `constant/` | opaque code lookups | self-describing strings |
| `helper/` | utilities that know about support this Business domain only | generic language helpers |
| `core/util/` | generic language helpers (string, date, json, ...) specific for all Playwright framework, NOT depend on Business domain | anything Playwright-aware |

Domains under `flows/` are `movement/`, `consignment/`, `goods-item/`. Flows that
belong to no domain (portal access, represent trader, initial form, GMR, ICS2) sit
flat in `flows/`.

## The rules

**1. One wizard screen = one step method = one Allure step.**
If a step answers two screens, a failure names the wrong one. Split when the flow can
see the screen boundary; keep them together when the boundary hides inside a page
object (see `PartyBlock`, which decides at runtime whether an address screen follows).

**2. A `*Steps` class owns a WIZARD, not a page.**
It also owns the action that OPENS the wizard, even when that button lives on another
page - `MovementSteps.openTransportDetails` (task list), `ConsignmentSteps.clickNewEnsConsignment`
(movement overview), `GoodsItemSteps.openNewGoodsRecord` (consignment overview). That
is why those classes take two page objects.

**3. Two screens that differ are two step methods.**
Not one method with a boolean. `enterPackagingDetails` (ENS, has "number of pieces")
and `enterStandalonePackagingDetails` (does not) are separate for this reason. A flag
inside a step is the sign that two screens were merged by mistake.

**4. A `*Steps` class exists when TWO OR MORE journeys share it.**
A step library is for sharing; one consumer is not sharing. Screens only one journey
shows are private step methods at the bottom of that journey's flow - same shape (one
method per screen, each owning its `ReportLog.step`), just no extra class. See
`AddNewFfdStandaloneConsignmentFlow`. Promote them to their own `*Steps` class the day
a second journey needs them; that move is mechanical.

Today's shared libraries and their consumers: `ConsignmentSteps` (7), `MovementSteps`
(5), `GoodsItemSteps` (4), `StandaloneConsignmentSteps` (3).

**5. A step takes the narrowest thing that works.**
`GoodsItemSteps` takes `GoodsData` because all four goods journeys share that one
type. `MovementSteps` and `ConsignmentSteps` take plain values, because ENS and the
three standalone journeys carry unrelated data types and a shared screen cannot depend
on either.

**6. Constants are for OPAQUE codes only.**
`GB`, `3a`, `R1`, `1EN` - values that say nothing on their own. Do NOT create one for a
self-describing string. The single exception is `DECLARATION_PROCEDURE`, and its file
says why: it drives control flow, so a typo would silently take the wrong branch.

**7. Sharing that NESTS gets a class. Sharing that OVERLAPS gets composition.**
`ConsignmentSteps` is a catalogue of every consignment screen, not the screen list of
any journey. Do not split it by consumer: controlled goods is ENS+SFD, the buyer
question is ENS+FFD, the container screens are ENS+SFD+FFD. Those subsets do not nest,
so no split holds - the next shared screen re-cuts the line. Which journey visits which
screen is stated by that journey's flow, and those spines are short enough to read.

**8. Test-data duplication between specs is fine. Flow duplication is not.**
A spec's data IS its specification; two tests repeating a document code is cheaper than
coupling them through a shared fixture. Duplicated *logic* across flows is different -
extract it (see `GoodsItemSteps.declareTgp`, which two journeys share).

**9. A screen whose PRESENCE depends on the environment is detected OUTSIDE its step.**
Some screens only appear when the account or the data has something set up - the TGP
question needs a trader with a TGP profile, the IMMI question needs an IMMI-enabled
importer. Detect first (`isUseTgpQuestionShown`, `isUseImmiQuestionShown`), then open
the `ReportLog.step` only if the screen is really there. Detecting inside the step
emits an "Answer ..." step on a run that was never asked the question - the test still
passes, and the report quietly records something that did not happen.

When such a screen is missing but the test asked for it, fail with a message that
names BOTH causes: the environment may not be set up, or the app may have failed to
offer the screen. Blaming only the environment sends the reader to the wrong place
when it is a product defect.

**10. Never wait on a timer.**
No `waitForTimeout`, no sleeps. Wait on the condition - a locator, a URL, `or()` of two
possible screens.

## Recipes

**Add a screen to an existing journey**

1. Locator + interaction in the page object that owns that screen.
2. A method in the matching `*-steps.ts`, wrapping `ReportLog.step`.
3. One line in the journey's `*-flow.ts`, in the right position.

Check the other step libraries first - most "new" screens already exist on another
journey.

**Add a journey-specific screen (e.g. FFD only)**

1. Locator + interaction in the journey's own page object
   (`FfdStandaloneConsignmentDeclarePage`).
2. A PRIVATE step method at the bottom of that journey's flow - not a new `*Steps`
   class. See rule 4.
3. One line in the spine.

Check the shared libraries first. Most "FFD-only" screens turn out not to be: of FFD's
24 screens, 14 were already covered by `MovementSteps`, `ConsignmentSteps` and
`StandaloneConsignmentSteps`.

**Add a dropdown**

If the option values are opaque, add a constant file named after the field, listing
value -> label. If they are self-describing, put the literal in test data and document
the alternatives in the field's doc comment.

**Map an unknown wizard**

Write a temporary spec that runs inside the harness (so it gets auth, representation
and the initial form for free), walks the wizard, and prints for each screen: URL,
heading, error summary, and every visible control with its id and select options. Fill
generically to advance; when validation blocks, add the real value and re-run. The
route in the URL (`transport-roro-acco-journey`, `tail-journey~h1-journey`) reveals the
branch structure better than anything on screen. Delete the spec afterwards.

## Already tried and rejected

- **A `*Steps` class per journey, shared or not.** `FfdConsignmentSteps` existed for one
  consumer and was folded back into the flow; see rule 4. A step library that nobody
  shares is a file to open for no reason.
- **Splitting `ConsignmentSteps` into "shared" and "ENS-only".** The journeys overlap
  without nesting; see rule 7.
- **Merging the three standalone goods-item flows into one.** They visit the same
  screens in different orders; merging needs a journey flag to drive the order, which
  is what the separate spines exist to avoid.
- **Committing an autocomplete by keyboard.** `locator.press()` focuses its element
  first, so ArrowDown-then-Enter loses the highlight and selects nothing. Click the
  option. See `selectAutocompleteValue`.
- **A generic element wrapper class.** Helpers must add value (a guard, a wait, a
  retry), not pass through to Playwright.

## Known gaps

- `locale-fixture.ts` mentions a locale-consistency guard test. It does not exist, which
  is why `cy.json` drifted. Welsh strings in `cy.json` are unverified against the app.
- The three standalone consignment data types share about twelve fields, including a
  seven-field exporter block, and the `exporterAddress` mapper exists in three copies.
- `page-object/` is flat. The six record-tab declare pages are a family that could be
  grouped.
- FFD standalone: only the RoRo branches and the free-circulation tail are verified.
  ILP Air, ILP Maritime, customs warehousing and the arrived movement are not.
