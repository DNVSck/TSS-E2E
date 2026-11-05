import { DOCUMENT_CODE } from '../constant/document-code-constant';
import { DOCUMENT_STATUS } from '../constant/document-status-constant';
import { defermentAccountNumber } from '../helper/authorisation-helper';
import {
    IMPORTER_CGU, IMPORTER_CWP, IMPORTER_DPO, IMPORTER_EXW, IMPORTER_IPO, IMPORTER_OPO,
    IMPORTER_SDE, IMPORTER_TEA, IMPORTER_UKIMS,
} from '../../config/environment';

/**
 * One "document reference" record — the shape behind the goods item's
 * "Document references" tab. A tab holds a list of these, so callers pass an
 * array; the wizard is replayed once per element.
 *
 * Only the document code is mandatory. The status screen appears only for some
 * document codes; the reference, part reference, reason and file screens still
 * appear in the wizard but are left blank / skipped when the test data omits them.
 */
export interface DocumentReferenceData {
    /** "Document code" — an opaque customs document-type code (e.g. 1421). */
    documentCode: string;
    /** "Document status" — an opaque status code (e.g. AC). Optional: some
     *  document codes skip the status screen entirely. */
    documentStatus?: string;
    /** "Document reference" (Optional field). */
    documentReference?: string;
    /** "Document part reference" (Optional field). */
    documentPartReference?: string;
    /** "Document reason" (Optional field). */
    documentReason?: string;
    /** Path to a file for the "Upload your document file" screen (Optional). */
    documentFilePath?: string;
}

const defaults: DocumentReferenceData = {
    documentCode: '',
    documentStatus: '',
    documentReference: '',
    documentPartReference: '',
    documentReason: '',
    documentFilePath: '',
};

export const documentReference = (): DocumentReferenceData => ({ ...defaults });

type DocumentOverrides = Partial<Omit<DocumentReferenceData, 'documentCode'>>;

const citedDocument = (fixed: DocumentReferenceData) =>
    (overrides?: DocumentOverrides): DocumentReferenceData => ({ ...defaults, ...fixed, ...overrides });

export const document1207 = citedDocument({
    documentCode: DOCUMENT_CODE['1207'],
    documentStatus: DOCUMENT_STATUS.AG,
    documentReference: defermentAccountNumber(IMPORTER_DPO),
});

export const document1UKI = citedDocument({
    documentCode: DOCUMENT_CODE['1UKI'],
    documentReference: IMPORTER_UKIMS,
});

export const document9028 = citedDocument({
    documentCode: DOCUMENT_CODE['9028'],
    documentStatus: DOCUMENT_STATUS.AC,
    documentReference: 'DEFRAIV 0054037-0054047',
});

export const document9120 = citedDocument({
    documentCode: DOCUMENT_CODE['9120'],
    documentStatus: DOCUMENT_STATUS.AE,
    documentReference: 'GBAHC1234',
});

export const document9WKS = citedDocument({
    documentCode: DOCUMENT_CODE['9WKS'],
    documentStatus: DOCUMENT_STATUS.AC,
});

export const documentC019 = citedDocument({
    documentCode: DOCUMENT_CODE.C019,
    documentReference: IMPORTER_OPO,
});

export const documentC505 = citedDocument({
    documentCode: DOCUMENT_CODE.C505,
    documentStatus: DOCUMENT_STATUS.CC,
    documentReference: IMPORTER_CGU,
});

export const documentC512 = citedDocument({
    documentCode: DOCUMENT_CODE.C512,
    documentReference: IMPORTER_SDE,
});

export const documentC516 = citedDocument({
    documentCode: DOCUMENT_CODE.C516,
    documentReference: IMPORTER_TEA,
});

export const documentC517 = citedDocument({
    documentCode: DOCUMENT_CODE.C517,
    documentReference: IMPORTER_CWP,
});

export const documentC601 = citedDocument({
    documentCode: DOCUMENT_CODE.C601,
    documentReference: IMPORTER_IPO,
});

export const documentC640 = citedDocument({
    documentCode: DOCUMENT_CODE.C640,
    documentStatus: DOCUMENT_STATUS.AE,
    documentReference: 'GBCHD12345',
});

export const documentC644 = citedDocument({
    documentCode: DOCUMENT_CODE.C644,
    documentStatus: DOCUMENT_STATUS.AE,
    documentReference: 'COI.XI.2025.AUTO001',
});

export const documentC669 = citedDocument({
    documentCode: DOCUMENT_CODE.C669,
    documentStatus: DOCUMENT_STATUS.AC,
    documentReference: '0054037',
});

export const documentC670 = citedDocument({
    documentCode: DOCUMENT_CODE.C670,
    documentStatus: DOCUMENT_STATUS.AC,
    documentReference: 'GBIWP12345',
});

export const documentC672 = citedDocument({
    documentCode: DOCUMENT_CODE.C672,
    documentStatus: DOCUMENT_STATUS.AC,
    documentReference: '0054037-0054047',
});

export const documentC676 = citedDocument({
    documentCode: DOCUMENT_CODE.C676,
    documentReference: IMPORTER_EXW,
});

export const documentC679 = citedDocument({
    documentCode: DOCUMENT_CODE.C679,
    documentStatus: DOCUMENT_STATUS.XB,
    documentReference: '0054037-0054047',
});

export const documentN730 = citedDocument({
    documentCode: DOCUMENT_CODE.N730,
    documentStatus: DOCUMENT_STATUS.AE,
    documentReference: '0054047',
});

export const documentN760 = citedDocument({
    documentCode: DOCUMENT_CODE.N760,
    documentStatus: DOCUMENT_STATUS.AC,
    documentReference: '0054039',
});

export const documentN853 = citedDocument({
    documentCode: DOCUMENT_CODE.N853,
    documentStatus: DOCUMENT_STATUS.XW,
    documentReference: 'GBCHD2025.001234',
    documentReason: 'Waiver claimed as licence not reqd',
});

export const documentN935 = citedDocument({
    documentCode: DOCUMENT_CODE.N935,
    documentStatus: DOCUMENT_STATUS.AC,
});

export const documentU045 = citedDocument({
    documentCode: DOCUMENT_CODE.U045,
    documentStatus: DOCUMENT_STATUS.AP,
    documentReference: 'U045-0054047',
});

export const documentY160 = citedDocument({
    documentCode: DOCUMENT_CODE.Y160,
    documentReason: 'Not concerned with Reg 2024/573',
});

export const documentY824 = citedDocument({
    documentCode: DOCUMENT_CODE.Y824,
    documentReference: 'ORIGIN CERTIFIED',
    documentReason: 'ORIGIN CERTIFIED',
});

export const documentY900 = citedDocument({
    documentCode: DOCUMENT_CODE.Y900,
    documentReason: 'CITES Permits not required',
});

export const documentY922 = citedDocument({
    documentCode: DOCUMENT_CODE.Y922,
});

export const documentY929 = citedDocument({
    documentCode: DOCUMENT_CODE.Y929,
    documentReason: 'Reason for Waiver',
});

export const documentY942 = citedDocument({
    documentCode: DOCUMENT_CODE.Y942,
    documentReason: 'Reg 2016/1141 exempt',
});

export const goodsDocumentsWithoutSde = (): DocumentReferenceData[] => [documentC672()];

export const ensSfdGoodsDocuments = (): DocumentReferenceData[] => [
    ...goodsDocumentsWithoutSde(),
    documentC512(),
];
