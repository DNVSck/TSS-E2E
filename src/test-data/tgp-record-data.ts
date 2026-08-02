import {COUNTRY_CODE} from "../constant/country-code-dropdown-constant";

export interface TgpRecordData {
    /** The record's id. Shown on the overview under "Choose the TGP that you want to use". */
    recordId: string;
    /** The trader's own reference for the record, shown beside the id in the suggestion list. */
    traderRef: string;
    /**
     * What to type into the "Enter your Trader Goods Profile number" autocomplete.
     * The lookup matches the record id, the trader reference or the commodity code,
     * so any of the three works. Defaults to the trader reference: it is short
     * enough to type quickly and still unique.
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

const defaults: TgpRecordData = {
    recordId: 'a03b409c-c22a-461e-acd1-4a9e346e743b',
    traderRef: 'TGP123',
    lookup: '6306290000',
    commodityCode: '6306290000',
    goodsDescription:'Textiles and textile articles',
    supplementaryUnits: '',
    countryOfOrigin: COUNTRY_CODE.UNITED_KINGDOM,
};

export const tgpRecord = (overrides?: Partial<TgpRecordData>): TgpRecordData => ({
    ...defaults,
    ...overrides,
});
