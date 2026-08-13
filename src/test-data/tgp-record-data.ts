import { COUNTRY_CODE } from "../constant/country-code-dropdown-constant";

export interface TgpRecordData {
    /** The record's id. Shown on the overview under "Choose the TGP that you want to use". */
    recordId: string;
    /** The trader's own reference for the record, shown beside the id in the suggestion list. */
    traderRef: string;
    /**
     * What to type into the "Enter your Trader Goods Profile number" autocomplete.
     * The lookup matches the record id, the trader reference or the commodity code,
     * so any of the three works.
     */
    lookup: string;

    // Populated onto the goods item by the service once the record is chosen — the
    // TGP journey never asks for any of these, so they are the only evidence the
    // record was really applied.
    commodityCode: string;
    goodsDescription: string;
    supplementaryUnits?: string;
    /** The code the record holds ("GB"); the overview prints the name — see COUNTRY_NAME. */
    countryOfOrigin: string;
}

/**
 * The TGP records that EXIST on the environment, named so a spec can pick one in a
 * single line.
 *
 * Deliberately whole records rather than a factory taking Partial overrides. A TGP
 * record is atomic: it either exists on the environment or it does not, and its
 * commodity code, description, units and country are the service's, not the test's.
 * Overriding a field or two would build a record that exists nowhere — and since the
 * goods-item overview is asserted against these exact values, such a record fails with
 * a mismatch that reads like a product bug.
 *
 * Which records exist depends on the trader whose profile is being declared against,
 * so a record is only usable by a test signed in as (or representing) the right
 * company. Note that beside each record; a spec cannot work it out.
 */
export const TGP_RECORD = {
    /** Looked up by commodity code — this record's trader reference is not unique enough. */
    TEXTILES_TGP123: {
        recordId: 'a03b409c-c22a-461e-acd1-4a9e346e743b',
        traderRef: 'TGP123',
        lookup: '6306290000',
        commodityCode: '6306290000',
        goodsDescription: 'Textiles and textile articles',
        supplementaryUnits: '',
        countryOfOrigin: COUNTRY_CODE.UNITED_KINGDOM,
    },
    MACHINERY_TGP456: {
        recordId: 'aab0b5bd-6557-4831-ae57-930611e6a302',
        traderRef: 'TGP456',
        lookup: 'TGP456',
        commodityCode: '8485100000',
        goodsDescription: 'Machinery and mechanical appliances; electrical equipment; parts thereof, sound recorders and reproducers, television image and sound recorders and reproducers, and parts and accessories of such articles',
        supplementaryUnits: '100',
        countryOfOrigin: COUNTRY_CODE.UNITED_KINGDOM,
    },
} satisfies Record<string, TgpRecordData>;
