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
 * Additional procedure codes for which the service HIDES the supplementary-unit field
 * (IMMI, from 2026-08-31 - Trung).
 *
 * Kept as a list rather than folded into the caller for the same reason the warehouse
 * rule is: the service's own rule is stated once here, so a test that changes its
 * additional procedure code gets the right screen with nothing else to remember.
 */
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
