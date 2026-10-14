export interface OfferedElement {
    kind: 'change' | 'button' | 'record';
    label: string;
    target: string;
    enabled: boolean;
    html?: string;
}

export interface SurfaceFacts {
    surface: string;
    url: string;
    reachable: boolean;
    refusalHeading: string;
    offered: OfferedElement[];
    inheritedCount?: number;
}

export interface PartyOutcome {
    party: string;
    view: string;
    record: string;
    expected: string;
    failures: string[];
    surfaces: SurfaceFacts[];
}

export const outcomeOf = (outcome: PartyOutcome): 'PASS' | 'FAIL' =>
    outcome.failures.length > 0 ? 'FAIL' : 'PASS';

function elementLine(element: OfferedElement): string {
    const state = element.enabled ? 'enabled' : 'DISABLED';

    if (element.kind === 'change') {
        return `change "${element.label}" -> ${element.target}`;
    }
    if (element.kind === 'record') {
        return `record link "${element.label}" -> ${element.target}`;
    }
    return `button "${element.label}" [${element.target}] ${state}`;
}

function surfaceLines(surface: SurfaceFacts): string[] {
    const lines = [`  ${surface.surface}`, `    url: ${surface.url}`];

    if (!surface.reachable) {
        return [...lines, `    refused - heading shown: "${surface.refusalHeading || 'none'}"`];
    }
    const usable = surface.offered.filter(element => element.enabled);
    const withheld = surface.offered.filter(element => !element.enabled);

    if (surface.inheritedCount) {
        lines.push(`    (${surface.inheritedCount} page-level element(s) as on the record above, not repeated)`);
    }
    if (usable.length === 0) {
        lines.push('    usable: nothing');
    } else {
        lines.push('    usable:');
        for (const element of usable) {
            lines.push(`      - ${elementLine(element)}`);
            if (element.html) {
                lines.push(`          ${element.html}`);
            }
        }
    }
    if (withheld.length > 0) {
        const labels = withheld.map(element => '"' + element.label + '"').join(', ');
        lines.push(`    shown but disabled: ${labels}`);
    }
    return lines;
}

export function partyReport(outcome: PartyOutcome): string {
    return [
        `${outcome.party} - ${outcome.record} - ${outcomeOf(outcome)}`,
        `View     : ${outcome.view}`,
        `Expected : ${outcome.expected}`,
        '',
        'FAILED CHECKS',
        ...(outcome.failures.length > 0 ? outcome.failures.map(failure => `  - ${failure}`) : ['  none']),
        '',
        'WHAT EACH SCREEN OFFERED THIS PARTY (usable elements are outlined in red on the FAILED screenshots)',
        ...outcome.surfaces.flatMap(surfaceLines),
    ].join('\n');
}

const cell = (text: string): string => text.replaceAll('|', String.raw`\|`);

export function authorityDigest(outcomes: readonly PartyOutcome[]): string {
    const failed = outcomes.filter(outcome => outcomeOf(outcome) === 'FAIL').length;
    const lines = [
        `**${outcomes.length} party check(s), ${failed} failed**`,
        '',
        '| Party | View | Record | Expected | Result | Failed checks |',
        '| --- | --- | --- | --- | --- | --- |',
    ];

    for (const outcome of outcomes) {
        lines.push(`| ${[
            outcome.party, outcome.view, outcome.record, outcome.expected,
            outcomeOf(outcome) === 'FAIL' ? '**FAIL**' : 'PASS',
            outcome.failures.join('<br>') || '-',
        ].map(cell).join(' | ')} |`);
    }

    lines.push('', 'Each failed party has a report attachment listing what every screen offered it, '
        + 'and a screenshot with those elements outlined in red.');
    return lines.join('\n');
}
