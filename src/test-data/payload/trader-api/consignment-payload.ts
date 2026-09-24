import { ConsignmentData } from '../../consignment-data';
import { PreviousDocumentData } from '../../previous-document-data';
import { GoodsData } from '../../goods-data';
import { HolderOfAuthorisationData } from '../../holder-of-authorisation-data';
import {
    TRADER_API_YES, INTERNAL_MARKET, OP_TYPE,
} from '../../../constant/trader-api/trader-api-request-constant';
import { orNull, yesNo } from '../../../helper/api-payload-helper';


export type PreviousDocumentPayload = {
    op_type: string;
    previous_document_class: string;
    previous_document_type: string;
    previous_document_ref: string;
};

export type HolderOfAuthorisationPayload = {
    op_type: string;
    auth_type_code: string;
    auth_role_id: string;
};

/** The API carries one address line where the screens collect a street and a number. */
function addressLine(streetName: string, streetNumber: string): string {
    return [streetName, streetNumber].filter(Boolean).join(' ').trim();
}

/**
 * A party declared as "same as" another is carried by that other one, so its own fields
 * are left unsent rather than filled with a second, contradictory address.
 */
function partyField(sameAsAnother: boolean, value: string): string | null {
    return sameAsAnother ? null : value;
}

function previousDocumentPayload(document: PreviousDocumentData): PreviousDocumentPayload {
    return {
        op_type: OP_TYPE.CREATE,
        previous_document_class: document.documentCategory,
        previous_document_type: document.documentType,
        previous_document_ref: document.documentReference,
    };
}

function holderOfAuthorisationPayload(
    holder: HolderOfAuthorisationData
): HolderOfAuthorisationPayload {
    return {
        op_type: OP_TYPE.CREATE,
        auth_type_code: holder.typeCode,
        auth_role_id: holder.roleId,
    };
}

export type ConsignmentPayload = {
    declaration_number: string;
    consignment_number: string | null;
    no_sfd_reason: string | null;
    goods_description: string;
    trader_reference: string | null;
    transport_document_number: string;
    controlled_goods: string;
    goods_domestic_status: string;
    destination_country: string;
    supervising_customs_office: string | null;
    customs_warehouse_identifier: string | null;
    ducr: string | null;
    consignor_eori: string;
    consignor_name: string | null;
    consignor_street_number: string | null;
    consignor_city: string | null;
    consignor_postcode: string | null;
    consignor_country: string | null;
    consignee_eori: string;
    consignee_name: string | null;
    consignee_street_number: string | null;
    consignee_city: string | null;
    consignee_postcode: string | null;
    consignee_country: string | null;
    align_ukims: string | null;
    internal_market?: string;
    importer_eori: string;
    importer_name: string | null;
    importer_street_number: string | null;
    importer_city: string | null;
    importer_postcode: string | null;
    importer_country: string | null;
    exporter_eori: string | null;
    exporter_name: string;
    exporter_street_number: string;
    exporter_city: string;
    exporter_postcode: string;
    exporter_country: string;
    importer_parent_organisation_eori: string | null;
    use_importer_sde: string;
    declaration_choice: string | null;
    generate_SD: string;
    container_indicator: string;
    buyer_same_as_importer: string;
    buyer_eori: string | null;
    buyer_name: string | null;
    buyer_street_and_number: string | null;
    buyer_city: string | null;
    buyer_postcode: string | null;
    buyer_country: string | null;
    seller_same_as_exporter: string;
    seller_eori: string | null;
    seller_name: string | null;
    seller_street_and_number: string | null;
    seller_city: string | null;
    seller_postcode: string | null;
    seller_country: string | null;
    header_previous_document: PreviousDocumentPayload[];
    holder_of_authorisation: HolderOfAuthorisationPayload[];
};

/**
 * Answers the consignment screens never ask and the API requires. Samples, not rules:
 * a journey that declares under another choice overrides them.
 */
const DEFAULTS = {
    container_indicator: '0',
    generate_SD: TRADER_API_YES,
};

export function consignmentPayload(
    declarationNumber: string,
    consignment: ConsignmentData,
    goods: GoodsData,
    overrides: Partial<ConsignmentPayload> = {}
): ConsignmentPayload {
    const buyerIsImporter = consignment.isBuyerSameAsImporter;
    const sellerIsExporter = consignment.isSellerSameAsExporter;

    return {
        declaration_number: declarationNumber,
        consignment_number: null,
        no_sfd_reason: null,
        goods_description: goods.goodsDescription,
        trader_reference: orNull(consignment.traderReference),
        transport_document_number: consignment.transportDocumentNumber,
        controlled_goods: yesNo(consignment.isControlledGoods),
        goods_domestic_status: consignment.goodsDomesticStatus,
        destination_country: consignment.destinationCountryCode,
        supervising_customs_office: null,
        customs_warehouse_identifier: null,
        ducr: null,
        consignor_eori: consignment.consignorEORI,
        consignor_name: consignment.consignorName,
        consignor_street_number: addressLine(consignment.consignorStreetName, consignment.consignorStreetNumber),
        consignor_city: consignment.consignorCity,
        consignor_postcode: consignment.consignorPostCode,
        consignor_country: consignment.consignorCountryCode,
        consignee_eori: consignment.consigneeEORI,
        consignee_name: consignment.consigneeName,
        consignee_street_number: addressLine(consignment.consigneeStreetName, consignment.consigneeStreetNumber),
        consignee_city: consignment.consigneeCity,
        consignee_postcode: consignment.consigneePostCode,
        consignee_country: consignment.consigneeCountryCode,
        align_ukims: consignment.useIMMI ? yesNo(consignment.useIMMI) : null,
        ...(consignment.useIMMI ? { internal_market: INTERNAL_MARKET.CONFIRMED } : {}),
        importer_eori: consignment.importerEORI,
        importer_name: null,
        importer_street_number: null,
        importer_city: null,
        importer_postcode: null,
        importer_country: null,
        exporter_eori: null,
        exporter_name: consignment.exporterName,
        exporter_street_number: addressLine(
            consignment.exporterStreetName, consignment.exporterStreetNumber
        ),
        exporter_city: consignment.exporterCity,
        exporter_postcode: consignment.exporterPostCode,
        exporter_country: consignment.exporterCountryCode,
        importer_parent_organisation_eori: null,
        use_importer_sde: yesNo(consignment.useImporterSde ?? !consignment.useIMMI),
        declaration_choice: null,
        generate_SD: DEFAULTS.generate_SD,
        container_indicator: DEFAULTS.container_indicator,
        buyer_same_as_importer: yesNo(buyerIsImporter),
        buyer_eori: partyField(buyerIsImporter, consignment.buyerEORI),
        buyer_name: partyField(buyerIsImporter, consignment.buyerName),
        buyer_street_and_number: partyField(
            buyerIsImporter,
            addressLine(consignment.buyerStreetName, consignment.buyerStreetNumber)
        ),
        buyer_city: partyField(buyerIsImporter, consignment.buyerCity),
        buyer_postcode: partyField(buyerIsImporter, consignment.buyerPostCode),
        buyer_country: partyField(buyerIsImporter, consignment.buyerCountryCode),
        seller_same_as_exporter: yesNo(sellerIsExporter),
        seller_eori: partyField(sellerIsExporter, consignment.sellerEORI),
        seller_name: partyField(sellerIsExporter, consignment.sellerName),
        seller_street_and_number: partyField(
            sellerIsExporter,
            addressLine(consignment.sellerStreetName, consignment.sellerStreetNumber)
        ),
        seller_city: partyField(sellerIsExporter, consignment.sellerCity),
        seller_postcode: partyField(sellerIsExporter, consignment.sellerPostCode),
        seller_country: partyField(sellerIsExporter, consignment.sellerCountryCode),
        header_previous_document: consignment.headerPreviousDocuments.map(previousDocumentPayload),
        holder_of_authorisation: consignment.holdersOfAuthorisation.map(holderOfAuthorisationPayload),
        ...overrides,
    };
}
