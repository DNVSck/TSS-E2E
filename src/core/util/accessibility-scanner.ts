import type AxeBuilder from '@axe-core/playwright';
import type { AxeResults } from 'axe-core';

type AccessibilityScanOptions = {
  makeAxeBuilder: () => AxeBuilder;
  rules?: string[];
  tags?: string[];
};

// withRules and withTags write the same runOnly field, so passing both would leave
// only the last one standing. Rules win here: a caller naming rules meant those rules.
export async function readAccessibilityScan({
  makeAxeBuilder,
  rules,
  tags
}: AccessibilityScanOptions): Promise<AxeResults> {
  const builder = makeAxeBuilder();

  if (rules?.length) {
    builder.withRules(rules);
  } else if (tags?.length) {
    builder.withTags(tags);
  } else {
    throw new Error(
      'A scan must say what it covers: pass "rules" (the WCAG table) or "tags". '
      + 'Left unset, axe runs every enabled rule including best practices, and a '
      + 'test would fail compliance for something WCAG does not require.'
    );
  }

  return builder.analyze();
}
