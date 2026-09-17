import { TestInfo } from '@playwright/test';
import { BASE_URL, HAULIER_EORI, IMPORTER_EORI, IMPORTER_UKIMS } from '../../config/environment';
import { AUTHORISATION_TYPE_CODE } from '../constant/authorisation-type-code-constant';
import { PROCEDURE_CODES } from '../constant/procedure-codes-constant';
import { ADDITIONAL_PROCEDURE_CODES } from '../constant/additional-procedure-codes-constant';
import { PREVIOUS_DOCUMENT_TYPE } from '../constant/previous-document-type-constant';
import { ConsignmentData, ensOnlyConsignment } from './consignment-data';
import { EnsDeclarationOptions } from '../flows/common-flows/create-draft-ens-declaration-flow';
import { previousDocument } from './previous-document-data';
import { documentReference, ensSfdGoodsDocuments } from './document-reference-data';
import { GoodsData } from './goods-data';
import { holderOfAuthorisation, HolderOfAuthorisationData } from './holder-of-authorisation-data';
import { DOCUMENT_CODE } from '../constant/document-code-constant';
import { DOCUMENT_STATUS } from '../constant/document-status-constant';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../constant/type-of-movement-code-constant';

/**
 * The declarations the representation-authority specs are built on.
 *
 * Scoped to those specs the same way sfd-standalone-consignment-data is scoped to the
 * SFD journey - it is test data, so it lives with the test data, and the spec file is
 * left holding nothing but tests.
 *
 * What is unusual here, and worth knowing before reusing any of it: these factories
 * exist to make a declaration FAIL in a chosen way. A journey spec that picked one up
 * by mistake would go red for reasons that have nothing to do with the journey.
 */

/**
 * The ENS-SFD declaration under test.
 *
 * Everything named here is background - the movement type, the previous document, the
 * goods item's document reference - and exists only to make the declaration valid.
 * What a test actually varies is passed in, so the difference between two tests is the
 * only thing visible where they are written.
 *
 * The caller's overrides are spread LAST, so a test can replace any of the background
 * without the baseline quietly putting it back.
 */
export const ensSfdDeclaration = (
    testInfo: TestInfo,
    consignmentOverrides: Partial<ConsignmentData>
): EnsDeclarationOptions => ({
    testInfo,
    url: BASE_URL,
    movementOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
    },
    consignmentOverrides: {
        headerPreviousDocuments: [
            previousDocument({ documentReference: '3XI352196303000-12345' })
        ],
        ...consignmentOverrides,
    },
    goodsItemOverrides: {
        documentReferences: ensSfdGoodsDocuments(),
    },
});

/**
 * The ENS-ONLY declaration under test - the journey that generates nothing else.
 *
 *
 * `isEnsOnly` needs a reason, which ensOnlyConsignment supplies - see it for the default.
 */
export const ensOnlyDeclaration = (
    testInfo: TestInfo,
    consignmentOverrides: Partial<ConsignmentData>
): EnsDeclarationOptions => ({
    testInfo,
    url: BASE_URL,
    movementOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
    },
    consignmentOverrides: ensOnlyConsignment({
        headerPreviousDocuments: [
            previousDocument({ documentReference: '3XI352196303000-12345' })
        ],
        ...consignmentOverrides,
    }),
    goodsItemOverrides: {
        documentReferences: ensSfdGoodsDocuments(),
    },
});

/**
 * Data ICS2 refuses, which lands the ENS consignment at Trader Input Required.
 *
 * The container number passes the wizard's own validation and is only rejected
 * downstream, which is what makes it usable: a value the form blocked would never
 * reach the backend, and the consignment would never be handed back to the trader.
 *
 * The two booleans are not decoration. The container questions only appear when the
 * goods cross the EU external border, and the consignment declares one container of
 * its own only when every goods item shares it - without both, the screen carrying
 * the number is never reached.
 */
export const rejectedByIcs2 = (): Partial<ConsignmentData> => ({
    isGoodsCrossEUBorder: true,
    isSameContainer: true,
    containerIdentifierNumber: '123',
});

/**
 * Data CDS refuses, which lands the generated SFD at Trader Input Required while
 * leaving the ENS untouched - the two submit through different systems.
 *
 * The authorisation names a party other than the importer being declared for. A real
 * EORI rather than an invented one, so the rejection is the RULE being broken (this
 * party holds no such authorisation) and not merely an unrecognised number.
 */
export const rejectedByCds = (): Partial<ConsignmentData> => ({
    holdersOfAuthorisation: [holderOfAuthorisation({ roleId: HAULIER_EORI })],
});

/**
 * The ENS-IMMI declaration under test - the same shape as the ENS-SFD one above, with
 * the data that makes the service generate an IMMI instead.
 *
 * Copied from the without-TGP journey spec rather than the with-TGP one: TGP is parked
 * on a defect (see the journey suite), and an authority test that cannot be built is
 * not an authority test.
 *
 * The goods item carries more here than the SFD baseline does, and all of it is
 * background: an IMMI needs a procedure code pair, a commodity the tariff knows, the
 * trader's own UKIMS authorisation as a document reference, and the ENS it came from as
 * a previous document. None of it is what a test varies.
 */
export const ensImmiDeclaration = (
    testInfo: TestInfo,
    goodsItemOverrides: Partial<EnsDeclarationOptions['goodsItemOverrides']> = {},
    consignmentOverrides: Partial<ConsignmentData> = {}
): EnsDeclarationOptions => ({
    testInfo,
    url: BASE_URL,
    movementOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
    },
    consignmentOverrides: {
        useIMMI: true,
        headerPreviousDocuments: [
            previousDocument({ documentReference: '4GBXI553202734852-20240501' })
        ],
        // Valid, so the only thing wrong with a rejected IMMI is what the lever changed.
        holdersOfAuthorisation: [immiAuthorisation()],
        ...consignmentOverrides,
    },
    goodsItemOverrides: {
        useTGP: false,
        procedureCode: PROCEDURE_CODES.FREE_CIRCULATION_4000,
        additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_STANDARD_GOODS_1SG,
        commodityCode: '630629',
        documentReferences: [
            documentReference({
                documentCode: DOCUMENT_CODE['1UKI'],
                documentStatus: DOCUMENT_STATUS.AC,
                documentReference: IMPORTER_UKIMS,
            }),
        ],
        previousDocuments: [
            previousDocument({
                documentType: PREVIOUS_DOCUMENT_TYPE.ENTRY_SUMMARY_DECLARATION_355,
                documentReference: '24GB34F7Y1O2CX8PT4',
            }),
        ],
        supplementaryUnits: '1',
        ...goodsItemOverrides,
    },
});

/**
 * The authorisation an IMMI journey declares, and the correction its rejection needs.
 *
 * An IMMI is authorised under the UK Internal Market Scheme, not the Simplified
 * Declaration Procedure the SFD journey uses - so the type code differs from the
 * holder-of-authorisation default, and both the broken record and the fixed one have to
 * carry it. Getting that wrong would break the declaration for a reason unrelated to
 * the party being named, and the test would go red without measuring anything.
 */
const immiAuthorisation = (roleId?: string) =>
    holderOfAuthorisation({
        typeCode: AUTHORISATION_TYPE_CODE.UK_INTERNAL_MARKET_SCHEME_UKIM,
        ...(roleId ? { roleId } : {}),
    });

/**
 * A UKIMS number belonging to somebody other than the importer being declared for.
 *
 * A UKIMS number carries its holder's EORI inside it - `XIUKIM` + the EORI digits + the
 * registration timestamp - so swapping those digits for the haulier's produces a
 * correctly formed number that names the wrong party. Derived rather than typed out, so
 * it stays in step with whichever environment's importer is in use.
 *
 * The same rule the SFD lever breaks, aimed where an IMMI actually declares the
 * importer's authorisation: `1UKI` on the goods item. The authorisation TAB is not the
 * place - see below.
 */
const ukimsOfAnotherParty = IMPORTER_UKIMS.replace(
    IMPORTER_EORI.replace(/^XI/, ''),
    HAULIER_EORI.replace(/^XI/, '')
);

export const immiRejectedByCds = (): Partial<EnsDeclarationOptions['goodsItemOverrides']> => ({
    documentReferences: [importerUkimsDocument(ukimsOfAnotherParty)],
});


/**
 * IMMI standalone: declare the goods item with NO transport document.
 *
 * Correct it by declaring `immiStandaloneTransportDocument()` - the very record this
 * removes - so the correction is the exact inverse of the lever.
 */
export const immiStandaloneRejectedByCds = (): Partial<GoodsData> => ({
    documentReferences: [],
});

/**
 * SFD standalone: give the consignment an Excise Warehouse authorisation it has no
 * business holding. A standalone SFD declares no holder of
 * authorisation at all, so this adds the one record, and correcting it means putting the
 * record back to an authorisation the declaration does support.
 */
export const sfdStandaloneRejectedByCds = (): HolderOfAuthorisationData =>
    holderOfAuthorisation({ typeCode: AUTHORISATION_TYPE_CODE.EXCISE_WAREHOUSE_EXW });

export function importerUkimsDocument(ukims: string = IMPORTER_UKIMS) {
    return documentReference({
        documentCode: DOCUMENT_CODE['1UKI'],
        documentStatus: DOCUMENT_STATUS.AC,
        documentReference: ukims,
    });
}

/**
 * The ENS-EIDR declaration under test.
 *
 * `isControlledGoods: false` is the whole difference: uncontrolled goods are what the
 * service answers with an EIDR. Nothing here is meant to fail - unlike the two journeys
 * above, an EIDR authority test has no rejection to arrange, because nobody may edit a
 * generated EIDR whatever state it is in.
 */
export const ensEidrDeclaration = (
    testInfo: TestInfo,
    consignmentOverrides: Partial<ConsignmentData> = {}
): EnsDeclarationOptions => ({
    testInfo,
    url: BASE_URL,
    movementOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
    },
    consignmentOverrides: {
        isControlledGoods: false,
        headerPreviousDocuments: [
            previousDocument({ documentReference: '3XI352196303000-12345' })
        ],
        ...consignmentOverrides,
    },
});
