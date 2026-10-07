import { HAULIER_EORI, IMPORTER_EORI, IMPORTER_UKIMS } from '../../config/environment';
import { AUTHORISATION_TYPE_CODE } from '../constant/authorisation-type-code-constant';
import { ConsignmentData } from './consignment-data';
import { GoodsData } from './goods-data';
import { holderOfAuthorisation, HolderOfAuthorisationData } from './holder-of-authorisation-data';
import { importerUkimsDocument } from './document-reference-data';


export const rejectedByIcs2 = (): Partial<ConsignmentData> => ({
    isGoodsCrossEUBorder: true,
    isSameContainer: true,
    containerIdentifierNumber: '123',
});


export const rejectedByCds = (): Partial<ConsignmentData> => ({
    holdersOfAuthorisation: [holderOfAuthorisation({ roleId: HAULIER_EORI })],
});


const ukimsOfAnotherParty = IMPORTER_UKIMS.replace(
    IMPORTER_EORI.replace(/^XI/, ''),
    HAULIER_EORI.replace(/^XI/, '')
);

export const immiRejectedByCds = (): Partial<GoodsData> => ({
    documentReferences: [importerUkimsDocument(ukimsOfAnotherParty)],
});


export const immiStandaloneRejectedByCds = (): Partial<GoodsData> => ({
    documentReferences: [],
});


export const sfdStandaloneRejectedByCds = (): HolderOfAuthorisationData =>
    holderOfAuthorisation({ typeCode: AUTHORISATION_TYPE_CODE.EXCISE_WAREHOUSE_EXW });
