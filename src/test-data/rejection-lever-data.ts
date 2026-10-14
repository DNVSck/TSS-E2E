import { HAULIER_EORI, IMPORTER_EORI, IMPORTER_UKIMS, BASE_URL  } from '../../config/environment';
import { AUTHORISATION_TYPE_CODE } from '../constant/authorisation-type-code-constant';
import { ConsignmentData } from './consignment-data';
import { GoodsData } from './goods-data';
import { holderOfAuthorisation, HolderOfAuthorisationData } from './holder-of-authorisation-data';
import { importerUkimsDocument } from './document-reference-data';
import { ADDITIONAL_PROCEDURE_CODES } from '../constant/additional-procedure-codes-constant';
import { TestInfo } from '@playwright/test';
import { COMPANY_PROFILE, companyIdOf } from '../auth/credentials';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../constant/type-of-movement-code-constant';
import { REPRESENTATION_TYPE } from '../constant/representation-type-constant';
import { ImmiStandaloneConsignmentData } from './immi-standalone-consignment-data';
import { immiStandaloneGoodsItem } from './immi-standalone-goods-item-data';
import { sfdStandaloneGoodsItem } from './sfd-standalone-goods-item-data';
import { DeclareStandaloneOptions } from '../flows/common-flows/trader-api/declare-standalone-through-api-flow';
import { SfdStandaloneDeclarationOptions } from '../flows/common-flows/create-draft-sfd-standalone-flow';


export const rejectedByIcs2 = (): Partial<ConsignmentData> => ({
    isGoodsCrossEUBorder: true,
    isSameContainer: true,
    containerIdentifierNumber: '123',
});


export const rejectedByCds = (): Partial<ConsignmentData> => ({
    holdersOfAuthorisation: [holderOfAuthorisation({ roleId: HAULIER_EORI })],
    useImporterSde: false,
});


const ukimsOfAnotherParty = IMPORTER_UKIMS.replace(
    IMPORTER_EORI.replace(/^XI/, ''),
    HAULIER_EORI.replace(/^XI/, '')
);

export const immiRejectedByCds = (): Partial<GoodsData> => ({
    documentReferences: [importerUkimsDocument(ukimsOfAnotherParty)],
});


export const IMMI_STANDALONE_REFUSED_PROCEDURE_CODE = ADDITIONAL_PROCEDURE_CODES.SPIMM_SPECIAL_PROCEDURE_1NR;

export const immiStandaloneRejectedByProcedureCode = (): Partial<GoodsData> => ({
    additionalProcedureCodes: [IMMI_STANDALONE_REFUSED_PROCEDURE_CODE],
});

export const immiStandaloneRejectedByCds = (): Partial<GoodsData> => ({
    documentReferences: [],
});


export const sfdStandaloneRejectedByCds = (): HolderOfAuthorisationData =>
    holderOfAuthorisation({ typeCode: AUTHORISATION_TYPE_CODE.EXCISE_WAREHOUSE_EXW });

export const rejectedImmiStandaloneForImporter = (): DeclareStandaloneOptions<ImmiStandaloneConsignmentData> => ({
    consignmentOverrides: {
        typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
        representationType: REPRESENTATION_TYPE.DIRECT,
    },
    goodsItemOverrides: immiStandaloneGoodsItem(immiStandaloneRejectedByProcedureCode()),
    representingCompanyId: companyIdOf(COMPANY_PROFILE.IMPORTER),
});

export const rejectedSfdStandaloneForImporter = (testInfo: TestInfo): SfdStandaloneDeclarationOptions => ({
    testInfo,
    url: BASE_URL,
    consignmentOverrides: {
        // The Agent is representing here, so the wizard asks how. Left
        // unanswered the journey stops on "Representation information"
        // before it ever reaches the goods item - the IMMI journeys in this
        // describe have always said it, these two had not.
        representationType: REPRESENTATION_TYPE.DIRECT,
        isControlledGoods: true,
        holdersOfAuthorisation: [sfdStandaloneRejectedByCds()],
    },
    goodsItemOverrides: sfdStandaloneGoodsItem(),
});
