import { COUNTRY_CODE } from '../constant/country-code-dropdown-constant';
import { ITEM_CURRENCY } from '../constant/item-currency-constant';
import { INCOTERM } from '../constant/incoterm-constant';
import { NATURE_OF_GOODS } from '../constant/nature-of-goods-constant';
import { ADDITIONAL_RISK_STATUS } from '../constant/additional-risk-status-constant';
import { METHOD_OF_PAYMENT, MethodOfPaymentCode } from '../constant/method-of-payment-constant';
import { PREFERENCE_CODE, VALUATION_METHOD } from '../constant/preference-and-valuation-constant';
import { UNLOCODE, UnlocodeCode } from '../constant/unlocode-constant';
import { DocumentReferenceData, documentReference, goodsDocumentsWithoutSde } from './document-reference-data';
import { DOCUMENT_CODE } from '../constant/document-code-constant';
import { DOCUMENT_STATUS } from '../constant/document-status-constant';
import { AUTHORISATION_TYPE_CODE } from '../constant/authorisation-type-code-constant';
import { defermentAccountNumber } from '../helper/authorisation-helper';
import { IMPORTER_DPO } from '../../config/environment';
import { generateRandomInvoiceNumber, generateRandomTransportDocumentNumber } from '../helper/data-generate-helper';
import { CONSIGNMENT_GOODS_DOMESTIC_STATUS } from '../constant/consignment-goods-domestic-status-constant';
import { VEHICLE_REGISTRATION_NUMBER } from './movements-data';

/**
 * The answers a supplementary declaration still needs after it has been raised.
 *
 * An SD arrives pre-populated from the frontier declaration it belongs to, so this is
 * deliberately NOT a whole declaration: it is only the fields that frontier declaration
 * never captured. Almost all of them exist to value the goods - price, currency,
 * valuation method, preference, statistical value - because valuing the goods is what
 * a supplementary declaration is FOR. The frontier declaration moves them; this one
 * pays for them.
 *
 * Mapped from the wizard by walking it on SIT (2026-08-20). Two wizards, in the order
 * the app asks - though NO declaration is asked all of it. Each wizard puts only the
 * questions this declaration still has no answer to, so which screens appear depends
 * on what the frontier declaration already carried:
 *
 *   header   vehicle or trailer details -> buyer profile
 *            -> transport and destination -> exporter profile
 *            -> seller profile -> delivery terms
 *            -> either the UN/LOCODE, or the delivery country then the delivery place
 *            -> invoice currency
 *   goods    additional risk status -> country of origin -> commodity information
 *            -> weight -> nature of goods -> preference and valuation -> invoice details
 *            -> statistical value
 */
export interface SupplementaryDeclarationData {
    // ---- header: means of transport --------------------------------------------------
    /**
     * The registration on the wizard's first screen, pre-populated and then OVERWRITTEN.
     *
     * One field for both screens - "Vehicle registration number" when the movement was
     * accompanied, "Trailer registration number" when it was not. Only ever one of them
     * is shown, and the ROUTE says which, so nothing here has to name the movement type
     * and risk disagreeing with the declaration it came from.
     *
     * ALWAYS typed over, because what the service put there is never what the movement
     * declared. Seen twice, and differently each time: "GB12ABC" against a movement that
     * declared AB12CDE, and "IMO9198941#TR12LER" - which the field's own validation then
     * rejects for containing a "#", so the screen renders with an error before anything
     * is touched. Both on SIT, 2026-08-20.
     *
     * Defaulted to what the movement declares, so the two screens of one journey agree.
     */
    meansOfTransportRegistration: string;
    /**
     * "Nationality of transport".
     *
     * Re-selected rather than left alone, however the dropdown looks. It renders showing
     * "United Kingdom" and the screen still answers "Please select the nationality of
     * transport!" on Continue - the displayed country is not a selected one.
     */
    nationalityMeansOfTransport: string;

    buyerName: string;
    buyerStreetName: string;
    buyerStreetNumber: string;
    buyerCity: string;
    buyerPostCode: string;
    buyerCountryCode: string;

    transportDocumentNumber: string;
    goodsDomesticStatus: string;

    // ---- header: exporter profile --------------------------------------------------
    // No EORI: the SD asks for the exporter's name and address directly.
    exporterName: string;
    exporterStreetName: string;
    exporterStreetNumber: string;
    exporterCity: string;
    exporterPostCode: string;
    exporterCountryCode: string;

    sellerName: string;
    sellerStreetName: string;
    sellerStreetNumber: string;
    sellerCity: string;
    sellerPostCode: string;
    sellerCountryCode: string;

    // ---- header: delivery terms ----------------------------------------------------
    incoterm: string;
    /**
     * "Do you know the UN/LOCODE for the delivery location?"
     *
     * The answer chooses between the two fields below it and the two under that: yes
     * takes the code outright on one screen, no asks for the country and then the place.
     * Only the pair the answer selects is ever used.
     */
    isKnownUnlocode: boolean;
    /** Used when isKnownUnlocode is true. */
    unlocode: UnlocodeCode;
    /** Both used when isKnownUnlocode is false. */
    deliveryCountryCode: string;
    deliveryPlaceUnlocode: UnlocodeCode;

    // ---- header: invoice currency --------------------------------------------------
    invoiceCurrency: string;

    /**
     * "What method of payment will be used to pay for the goods on this consignment?"
     *
     * Set DELIBERATELY, after the header wizard, from the overview's "Change" link -
     * it is not left to whatever the company profile happened to inherit, because it is
     * the whole difference between this suite's two supplementary declaration routes.
     *
     * It also states what the declaration is expected to settle on, since that follows
     * how the duty is paid - see submittedSupplementaryStatusKeys.
     */
    methodOfPayment: MethodOfPaymentCode;

    /**
     * Holders of authorisation to REMOVE from the consignment, by type code.
     *
     * Paying through TSS means the trader's own permissions to defer payment no longer
     * belong on the declaration: the comprehensive guarantee (CGU) and the deferment of
     * payment authorisation (DPO) both describe an arrangement that is not the one being
     * used. Empty on the route that does pay from the trader's own account.
     */
    holdersOfAuthorisationToRemove: string[];

    /**
     * Document references to REMOVE from the goods item, by document code.
     *
     * The goods-item counterparts of the authorisations above - C506 cites the deferment
     * authorisation and C505 the guarantee - so the two lists are removed together or
     * not at all.
     */
    documentReferencesToRemove: string[];

    // ---- goods item ----------------------------------------------------------------
    additionalRiskStatus: string;
    countryOfOrigin: string;
    /**
     * "Supplementary units", asked on the commodity screen.
     *
     * The screen's own label calls it optional and the service can still refuse to move
     * on without it - the tariff decides, and a commodity measured in units requires
     * them. Always supplied for that reason: a value the screen does not want is
     * ignored, a missing one the tariff wants is a dead end.
     */
    supplementaryUnits: string;
    /** Gross mass arrives pre-populated from the frontier declaration; net does not. */
    netMass: string;
    natureOfGoods: string;
    preference: string;
    valuationMethod: string;
    /** Optional on the screen itself, and left out by default for that reason. */
    countryOfPreferentialOrigin?: string;
    invoiceNumber: string;
    itemCurrency: string;
    itemPrice: string;
    statisticalValue: string;

    /**
     * Additional procedure codes to ADD to the goods item, from the record's own "New
     * additional procedure code" button, after its wizard.
     *
     * Empty by default, because a declaration raised from a journey this suite declares
     * already carries the one its frontier declaration gave it - and adding a second is
     * not additive, it is a contradiction:
     *
     *     CDS12024: Uniqueness Error: The value declared should be unique
     *     CDS12149: Additional Procedure code 000 can not be declared with any other
     *               Additional Procedure Code
     *
     * both against Government Procedure Codes 2 and 3 of the same goods item - the
     * inherited 000 and the one added beside it. Measured on SIT 2026-08-21.
     *
     * Kept as a field rather than deleted, because the opposite failure is just as real:
     * a declaration reaching CDS with a procedure code and no additional code beside it
     * is refused with "CDS12070: Relation error: The value supplied in Data Element 1
     * mandates the completion of Data Element 2". So a journey whose declaration arrives
     * without one says so here; nothing is added on its behalf.
     */
    additionalProcedureCodes: string[];

    /**
     * Documents added to the goods record AFTER its wizard, from the record's own "New
     * document reference" button.
     *
     * Not part of either wizard, and not always needed: which documents a declaration
     * must cite follows its commodity and procedure. Empty by default, so a journey
     * that needs one says so rather than every journey carrying somebody else's.
     */
    documentReferences: DocumentReferenceData[];
}

const defaults: SupplementaryDeclarationData = {
    meansOfTransportRegistration: VEHICLE_REGISTRATION_NUMBER,
    nationalityMeansOfTransport: COUNTRY_CODE.UNITED_KINGDOM,

    buyerName: 'AUTOMATION BUYER LTD',
    buyerStreetName: 'DONEGALL SQUARE',
    buyerStreetNumber: '2',
    buyerCity: 'BELFAST',
    buyerPostCode: 'BT1 1AA',
    buyerCountryCode: COUNTRY_CODE.UNITED_KINGDOM,

    transportDocumentNumber: '',
    goodsDomesticStatus: CONSIGNMENT_GOODS_DOMESTIC_STATUS.NIDOM,

    exporterName: 'AUTOMATION EXPORTER LTD',
    exporterStreetName: 'DONEGALL SQUARE',
    exporterStreetNumber: '1',
    exporterCity: 'BELFAST',
    exporterPostCode: 'BT1 1AA',
    exporterCountryCode: COUNTRY_CODE.UNITED_KINGDOM,

    sellerName: 'AUTOMATION SELLER LTD',
    sellerStreetName: 'DONEGALL SQUARE',
    sellerStreetNumber: '3',
    sellerCity: 'BELFAST',
    sellerPostCode: 'BT1 1AA',
    sellerCountryCode: COUNTRY_CODE.UNITED_KINGDOM,

    incoterm: INCOTERM.COST_INSURANCE_AND_FREIGHT,
    /**
     * Yes - the shorter of the two branches, and the one a trader with a real delivery
     * address would take. It costs one screen instead of two.
     */
    isKnownUnlocode: true,
    unlocode: UNLOCODE.BELFAST,
    deliveryCountryCode: COUNTRY_CODE.UNITED_KINGDOM,
    deliveryPlaceUnlocode: UNLOCODE.BELFAST,

    invoiceCurrency: ITEM_CURRENCY.POUNDS_STERLING,

    /**
     * The trader's own deferment account, which is what the importer's company profile
     * sets and therefore what these declarations arrive carrying.
     *
     * Deliberately NOT "Card Payment Through TSS", which was tried and is the wrong
     * answer here for a reason worth keeping: the goods item already cites the trader's
     * own authorisation to defer payment ("[C506] XIDPO...") and the account behind it
     * ("[1207] ..."), so declaring that TSS will pay contradicts the documents beside
     * it, and CDS refuses the declaration. Measured on SIT 2026-08-21 against a
     * declaration that was otherwise identical to one it had accepted.
     */
    methodOfPayment: METHOD_OF_PAYMENT.TRADERS_OWN_DDA,
    holdersOfAuthorisationToRemove: [],
    documentReferencesToRemove: [],

    additionalRiskStatus: ADDITIONAL_RISK_STATUS.NO_ADDITIONAL_RISK_STATUS,
    countryOfOrigin: COUNTRY_CODE.UNITED_KINGDOM,
    supplementaryUnits: '1',
    netMass: '10',
    natureOfGoods: NATURE_OF_GOODS.TRANSFER_OF_OWNERSHIP_FOR_COMPENSATION,
    preference: PREFERENCE_CODE.NORMAL_THIRD_COUNTRY_TARIFF,
    valuationMethod: VALUATION_METHOD.TRANSACTION_VALUE,
    countryOfPreferentialOrigin: undefined,
    invoiceNumber: '',
    itemCurrency: ITEM_CURRENCY.POUNDS_STERLING,
    itemPrice: '100',
    /**
     * The value declared for statistics, which the service does not derive from the
     * item price. Kept equal to it: they are the same goods, and a difference no test
     * intends would be one more thing to explain when CDS objects.
     */
    statisticalValue: '100',

    additionalProcedureCodes: [],

    documentReferences: [],
};

/**
 * Build the answers for one supplementary declaration.
 *
 * The invoice number is generated per call rather than sitting in `defaults`, so two
 * declarations completed by the same worker do not cite the same invoice. The vehicle
 * registration deliberately is NOT: it names the transport the movement declared, and
 * a fresh one per call would say the goods arrived on a different vehicle.
 */
export const supplementaryDeclaration = (
    overrides?: Partial<SupplementaryDeclarationData>
): SupplementaryDeclarationData => ({
    ...defaults,
    invoiceNumber: generateRandomInvoiceNumber(),
    transportDocumentNumber: generateRandomTransportDocumentNumber(),
    ...overrides,
});

/**
 * The declaration is paid from the TRADER's own deferment account.
 *
 * The declaration arrives already describing this arrangement - it carries the trader's
 * guarantee and deferment authorisations, and cites them on the goods item - so this
 * route adds rather than removes: CDS wants the deferment ACCOUNT NUMBER as well as the
 * authorisation that grants it, and refuses the declaration when only one is present.
 * See defermentAccountNumber.
 */
export const traderDefermentSupplementaryDeclaration = (
    overrides?: Partial<SupplementaryDeclarationData>
): SupplementaryDeclarationData => supplementaryDeclaration({
    methodOfPayment: METHOD_OF_PAYMENT.TRADERS_OWN_DDA,
    documentReferences: [
        documentReference({
            documentCode: DOCUMENT_CODE['1207'],
            documentStatus: DOCUMENT_STATUS.AG,
            documentReference: defermentAccountNumber(IMPORTER_DPO),
        }),
    ],
    ...overrides,
});

/**
 * The duty is paid through TSS's own deferment account instead.
 *
 * The mirror image of the route above: everything describing the TRADER's deferment
 * arrangement has to come off, at both levels, because the declaration would otherwise
 * name an arrangement it is not using. The trader's account number is not added either -
 * there is no authorisation left on the declaration for it to belong to.
 */
export const tssDefermentSupplementaryDeclaration = (
    overrides?: Partial<SupplementaryDeclarationData>
): SupplementaryDeclarationData => supplementaryDeclaration({
    methodOfPayment: METHOD_OF_PAYMENT.CARD_PAYMENT_THROUGH_TSS,
    holdersOfAuthorisationToRemove: [
        AUTHORISATION_TYPE_CODE.CUSTOMS_COMPREHENSIVE_GUARANTEE_CGU,
        AUTHORISATION_TYPE_CODE.DEFERMENT_OF_PAYMENT_DPO,
    ],
    documentReferencesToRemove: [DOCUMENT_CODE.C506, DOCUMENT_CODE.C505],
    documentReferences: [],
    ...overrides,
});

export const declaredThroughTraderApi = (
    declaration: SupplementaryDeclarationData
): SupplementaryDeclarationData => ({
    ...declaration,
    documentReferences: [...declaration.documentReferences, ...goodsDocumentsWithoutSde()],
});

/**
 * A supplementary declaration for goods entered to Temporary Admission (TA).
 *
 * Temporary Admission goods are duty-suspended and do not require payment, so this
 * route does not use a deferment account. The goods inherit the TA procedure code
 * (5300) and At Risk classification (NIREM) from the ENS-SFD movement they are
 * raised from. The TA status removes deferment-related authorisations and documents
 * that only apply to duty-paying routes.
 *
 * Unlike the trader DDA route (which adds a deferment account number), and the TSS
 * DDA route (which removes deferment authorisations), the TA route removes the same
 * deferment authorisations because TA goods do not use either trader or TSS payment.
 */
export const tempAdmissionSupplementaryDeclaration = (
    overrides?: Partial<SupplementaryDeclarationData>
): SupplementaryDeclarationData => supplementaryDeclaration({
    valuationMethod: VALUATION_METHOD.THE_FALLBACK_METHOD,
    methodOfPayment: METHOD_OF_PAYMENT.CARD_PAYMENT_THROUGH_TSS,
    holdersOfAuthorisationToRemove: [
        AUTHORISATION_TYPE_CODE.CUSTOMS_COMPREHENSIVE_GUARANTEE_CGU,
        AUTHORISATION_TYPE_CODE.DEFERMENT_OF_PAYMENT_DPO,
    ],
    documentReferencesToRemove: [DOCUMENT_CODE.C506, DOCUMENT_CODE.C505],
    documentReferences: [
        documentReference({
            documentCode: DOCUMENT_CODE['9WKS'],
            documentStatus: DOCUMENT_STATUS.AC,
            documentReference: '9WKS-TAVAL0001',
        }),
    ],
    ...overrides,
});

/**
 * A supplementary declaration for goods entered to Inward Processing (IP).
 *
 * IP goods pay duty through TSS's own deferment account - the same shape as
 * tssDefermentSupplementaryDeclaration. The IP-specific detail (procedure code, the
 * IPO/CGU authorisations, and the C601/Y922/Y824/C512 documents) already lives on the
 * ENS-SFD movement this SD is raised from - see
 * inwardProcessingSfdSupplementaryDeclarationMovement. Delegating rather than
 * repeating the same overrides keeps the two routes from silently drifting apart.
 */
export const inwardProcessingSfdSupplementaryDeclaration = (
    overrides?: Partial<SupplementaryDeclarationData>
): SupplementaryDeclarationData => tssDefermentSupplementaryDeclaration({
    additionalRiskStatus: ADDITIONAL_RISK_STATUS.NIREM,
    ...overrides,
});

/**
 * A supplementary declaration for excisable goods (e.g., tobacco) moved from an excise
 * warehouse (0700-F06) - see exciseGoodsRoRoAccompaniedSupplementaryDeclarationMovement.
 *
 * Paid from the trader's own deferment account: the importer this runs as offers no
 * TSS DDA on an excise declaration. The At Risk classification (NIREM) is declared on
 * the goods item.
 */
export const exciseGoodsSupplementaryDeclaration = (
    overrides?: Partial<SupplementaryDeclarationData>
): SupplementaryDeclarationData => traderDefermentSupplementaryDeclaration({
    additionalRiskStatus: ADDITIONAL_RISK_STATUS.NIREM,
    countryOfOrigin: COUNTRY_CODE.UNITED_KINGDOM,
    ...overrides,
});