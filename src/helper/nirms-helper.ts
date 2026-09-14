import { ADDITIONAL_PROCEDURE_CODES } from '../constant/additional-procedure-codes-constant';

export interface NirmsFacts {
    isEnsOnly: boolean;
    useIMMI: boolean;
    importerEORI: string;
    hasNirmsAuthorisation: boolean;
    additionalProcedureCode: string;
    commodityCode: string;
    countryOfOrigin: string;
    tariffCoversCommodity?: boolean;
}

/** Whether the wizard owes a NIRMS screen, and the sentence that says why. */
export interface NirmsExpectation {
    expected: boolean;
    because: string;
}

/** True when the rule cannot be answered without asking the tariff first. */
export function nirmsNeedsTariff(facts: Omit<NirmsFacts, 'tariffCoversCommodity'>): boolean {
    return !facts.isEnsOnly && facts.hasNirmsAuthorisation && !facts.useIMMI;
}

/**
 * "Do you want to use NIRMS for these goods?" - whether the service will put it.
 *
 * The importer's NIRMS authorisation is necessary on every journey, and then a second
 * condition that is NOT the same on all of them: IMMI offers NIRMS only under one
 * additional procedure code, while SFD and EIDR ask the tariff whether it lists NIRMS
 * documents for the commodity. Shared by the ENS goods wizard and the IMMI standalone
 * one, which put the screen at different points but decide it the same way.
 */
export function nirmsExpectation(facts: NirmsFacts): NirmsExpectation {
    if (facts.isEnsOnly) {
        return {
            expected: false,
            because: 'an ENS-only declaration is never asked about NIRMS',
        };
    }

    if (!facts.hasNirmsAuthorisation) {
        return {
            expected: false,
            because: `${facts.importerEORI} holds no NIRMS authorisation`,
        };
    }

    const holdsAuthorisation = `${facts.importerEORI} holds a NIRMS authorisation`;

    if (facts.useIMMI) {
        const standardGoods = ADDITIONAL_PROCEDURE_CODES.SPIMM_STANDARD_GOODS_1SG;
        const isStandardGoods = facts.additionalProcedureCode === standardGoods;

        return {
            expected: isStandardGoods,
            because: isStandardGoods
                ? `${holdsAuthorisation} and this IMMI item is declared under `
                + `additional procedure code ${standardGoods}`
                : `this IMMI item is declared under additional procedure code `
                + `"${facts.additionalProcedureCode}", and IMMI offers NIRMS only `
                + `under ${standardGoods}`,
        };
    }

    const commodity = `commodity ${facts.commodityCode} from ${facts.countryOfOrigin}`;

    return {
        expected: facts.tariffCoversCommodity === true,
        because: facts.tariffCoversCommodity
            ? `${holdsAuthorisation} and the tariff covers ${commodity}`
            : `the tariff lists no NIRMS documents for ${commodity}`,
    };
}
