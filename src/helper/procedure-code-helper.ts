/**
 * Procedure codes whose declarations are warehoused, written as the service states
 * the rule: the first two digits, the last two, or either.
 *
 * A goods item declared under one of these is asking where the goods are being held,
 * so the wizard inserts a "Warehouse identifier" screen after the procedure codes.
 */
const WAREHOUSED_PREFIXES = ['61', '71', '07'];
const WAREHOUSED_SUFFIXES = ['71', '78'];

/**
 * Whether the goods-item wizard will ask for a warehouse identifier.
 *
 * Derived from the procedure code rather than declared as a flag in test data, and
 * deliberately so: the procedure code IS the service's rule, so a separate flag could
 * only ever agree with it or be wrong. A test that changes its procedure code then
 * gets the right screens with nothing else to remember.
 */
export function requiresWarehouseIdentifier(procedureCode: string): boolean {
    const code = procedureCode.trim();

    return WAREHOUSED_PREFIXES.some(prefix => code.startsWith(prefix))
        || WAREHOUSED_SUFFIXES.some(suffix => code.endsWith(suffix));
}

/**
 * The procedure codes that make the service ask for a supervising customs office
 * (DE 5/27), stated by CDS as a list rather than as a pattern - so it is written out
 * here rather than derived.
 *
 * A DIFFERENT set from the warehoused codes above, and deliberately kept apart. The
 * two overlap without either containing the other: 0153, 0154, 4053, 4054, 4253,
 * 4254, 5300, 5351, 5353 and 5354 ask for an office and never for a warehouse, while
 * every 61xx and 71xx code asks for a warehouse and never for an office. Sharing one
 * rule between the two screens silently skipped the first group.
 */
const SUPERVISING_OFFICE_CODES: ReadonlySet<string> = new Set([
    '0153', '0154', '0171', '0178', '0700', '0721', '0751', '0753', '0754', '0771',
    '0778', '4053', '4054', '4071', '4078', '4253', '4254', '4271', '4278', '5300',
    '5351', '5353', '5354', '5371', '5378',
]);

/**
 * Whether the goods-item wizard will ask for a supervising customs office.
 *
 * The code is only half the condition: DE 5/27 applies to the standard, simplified
 * and supplementary routes, and never to IMMI, where the service fills the office in
 * for itself. The route is not knowable from a procedure code, so the journey flow
 * decides whether to ask this at all - see AddNewEnsGoodsItemFlow.
 */
export function requiresSupervisingCustomsOffice(procedureCode: string): boolean {
    return SUPERVISING_OFFICE_CODES.has(procedureCode.trim());
}

const HIDES_SUPPLEMENTARY_UNIT: ReadonlySet<string> = new Set(['1SG', '1EN']);

/**
 * Whether the goods-item wizard will hide the supplementary-unit field.
 *
 * Hidden, not merely optional - so a flow that filled it anyway would be typing into a
 * field that is not on the screen, which fails as a timeout naming the input rather
 * than naming the rule that removed it.
 */
export function hidesSupplementaryUnit(additionalProcedureCode: string): boolean {
    return HIDES_SUPPLEMENTARY_UNIT.has(additionalProcedureCode.trim());
}
