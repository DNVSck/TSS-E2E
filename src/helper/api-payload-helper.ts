import {
    TRADER_API_YES, TRADER_API_NO, INTERNAL_MARKET, OP_TYPE, CONTAINER_INDICATOR, CONTROLLED_GOODS_TYPE,
    IMMI_MODE_OF_TRANSPORT, IMMI_DECLARATION_CATEGORY,
} from '../constant/trader-api/trader-api-request-constant';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../constant/type-of-movement-code-constant';
import { DateTimeUtil } from '../core/util/date-time-util';
import { IMPORTER_EORI } from '../../config/environment';
import { MovementData } from '../test-data/movements-data';
import {
    ConsignmentData, declaresControlledGoods, declaresExporter,
} from '../test-data/consignment-data';
import { GoodsData } from '../test-data/goods-data';
import { PreviousDocumentData } from '../test-data/previous-document-data';
import { HolderOfAuthorisationData } from '../test-data/holder-of-authorisation-data';
import { DocumentReferenceData } from '../test-data/document-reference-data';
import { ImmiStandaloneConsignmentData } from '../test-data/immi-standalone-consignment-data';
import { HeaderPayload } from '../test-data/payload/trader-api/header-payload';
import {
    ConsignmentPayload, PreviousDocumentPayload, HolderOfAuthorisationPayload,
} from '../test-data/payload/trader-api/consignment-payload';
import {
    GoodsPayload, GoodsRecordsPayload, GoodsWithRecordsPayload, DocumentReferencePayload,
} from '../test-data/payload/trader-api/goods-payload';
import { ImmiStandalonePayload } from '../test-data/payload/trader-api/immi-standalone-payload';
import { requiresWarehouseIdentifier } from './procedure-code-helper';

/**
 * The API is not consistent about case: a header answers "YES" and a consignment
 * answers "yes". Two named helpers keep that visible - folded into one, the next
 * person to tidy it would break the header.
 */
export function yesNo(value: boolean): string {
    return value ? TRADER_API_YES : TRADER_API_NO;
}

export function yesNoUpper(value: boolean): string {
    return yesNo(value).toUpperCase();
}

export function orNull(value: string | undefined): string | null {
    return value || null;
}

/** The API carries one address line where the screens collect a street and a number. */
export function addressLine(streetName: string, streetNumber: string): string {
    return [streetName, streetNumber].filter(Boolean).join(' ').trim();
}

/**
 * A party declared as "same as" another is carried by that other one, so its own fields
 * are left unsent rather than filled with a second, contradictory address.
 */
function partyField(sameAsAnother: boolean, value: string): string | null {
    return sameAsAnother ? null : value;
}

export function previousDocumentPayload(document: PreviousDocumentData): PreviousDocumentPayload {
    return {
        op_type: OP_TYPE.CREATE,
        previous_document_class: document.documentCategory,
        previous_document_type: document.documentType,
        previous_document_ref: document.documentReference,
    };
}

export function holderOfAuthorisationPayload(
    holder: HolderOfAuthorisationData
): HolderOfAuthorisationPayload {
    return {
        op_type: OP_TYPE.CREATE,
        auth_type_code: holder.typeCode,
        auth_role_id: holder.roleId,
    };
}

function identityOfTransport(movement: MovementData): string {
    const vessel = `IMO${movement.imoNumber}`;

    if (movement.typeOfMovement === TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED) {
        return `${vessel}#${movement.vehicleRegistrationNumber}`;
    }

    if (movement.typeOfMovement === TYPE_OF_MOVEMENT_OPTION_CODE.RORO_UNACCOMPANIED) {
        if (!movement.trailerRegistrationNumber) {
            throw new Error(
                `An unaccompanied movement must declare a trailerRegistrationNumber - the `
                + `Trader API carries it in identity_no_of_transport, and a GMR raised on a `
                + `movement without one is refused.`
            );
        }
        return `${vessel}#${movement.trailerRegistrationNumber}`;
    }

    return vessel;
}

export function headerPayload(
    movement: MovementData,
    overrides: Partial<HeaderPayload> = {}
): HeaderPayload {
    return {
        declaration_number: null,
        movement_type: movement.typeOfMovement,
        type_of_passive_transport: null,
        identity_no_of_transport: identityOfTransport(movement),
        nationality_of_transport: movement.nationalityOfMeanOfTransport,
        conveyance_ref: orNull(movement.conveyanceReferenceNumber),
        arrival_date_time: DateTimeUtil.toUkDateTime(movement.arrivalDateTime),
        arrival_port: movement.portOfArrival,
        place_of_loading: movement.placeOfLoading,
        place_of_acceptance_same_as_loading: yesNoUpper(movement.isSamePlaceOfLoading),
        place_of_acceptance: orNull(movement.placeOfacceptance),
        place_of_unloading: movement.placeOfUnloading,
        place_of_delivery_same_as_unloading: yesNoUpper(movement.isSamePlaceOfUnloading),
        place_of_delivery: orNull(movement.placeOfDelivery),
        seal_number: orNull(movement.sealNumber),
        transport_charges: movement.transportCharges,
        carrier_eori: movement.carrierEori,
        carrier_name: null,
        carrier_street_number: null,
        carrier_city: null,
        carrier_postcode: null,
        carrier_country: null,
        haulier_eori: null,
        ...overrides,
    };
}

export function consignmentPayload(
    declarationNumber: string,
    consignment: ConsignmentData,
    goods: GoodsData,
    overrides: Partial<ConsignmentPayload> = {}
): ConsignmentPayload {
    const buyerIsImporter = consignment.isBuyerSameAsImporter;
    const sellerIsExporter = consignment.isSellerSameAsExporter;
    const warehoused = requiresWarehouseIdentifier(goods.procedureCode);

    return {
        declaration_number: declarationNumber,
        consignment_number: null,
        no_sfd_reason: consignment.isEnsOnly ? orNull(consignment.ensOnlyReason) : null,
        goods_description: goods.goodsDescription,
        trader_reference: orNull(consignment.traderReference),
        transport_document_number: consignment.transportDocumentNumber,
        controlled_goods: yesNo(declaresControlledGoods(consignment)),
        goods_domestic_status: consignment.isEnsOnly || consignment.useIMMI ? null : consignment.goodsDomesticStatus,
        destination_country: consignment.destinationCountryCode,
        supervising_customs_office: warehoused ? goods.supervisingCustomsOffice : null,
        customs_warehouse_identifier: warehoused ? goods.warehouseIdentifier : null,
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
        align_ukims: yesNo(false),
        ...(consignment.useIMMI ? { internal_market: INTERNAL_MARKET.CONFIRMED } : {}),
        importer_eori: consignment.importerEORI,
        importer_name: null,
        importer_street_number: null,
        importer_city: null,
        importer_postcode: null,
        importer_country: null,
        exporter_eori: null,
        ...exporterOf(consignment),
        importer_parent_organisation_eori: null,
        use_importer_sde: yesNo(consignment.useImporterSde ?? declaresControlledGoods(consignment)),
        declaration_choice: null,
        generate_SD: yesNo(consignment.generateSupplementaryDeclaration ?? false),
        container_indicator: consignment.isGoodsCrossEUBorder
            ? CONTAINER_INDICATOR.CONTAINERISED
            : CONTAINER_INDICATOR.NOT_CONTAINERISED,
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

function exporterOf(consignment: ConsignmentData): Pick<ConsignmentPayload,
    'exporter_name' | 'exporter_street_number' | 'exporter_city' | 'exporter_postcode' | 'exporter_country'> {
    if (!declaresExporter(consignment)) {
        return {
            exporter_name: null, exporter_street_number: null, exporter_city: null,
            exporter_postcode: null, exporter_country: null,
        };
    }

    return {
        exporter_name: consignment.exporterName,
        exporter_street_number: addressLine(consignment.exporterStreetName, consignment.exporterStreetNumber),
        exporter_city: consignment.exporterCity,
        exporter_postcode: consignment.exporterPostCode,
        exporter_country: consignment.exporterCountryCode,
    };
}

export function goodsPayload(
    consignmentNumber: string,
    goods: GoodsData,
    overrides: Partial<GoodsPayload> = {}
): GoodsPayload {
    return {
        consignment_number: consignmentNumber,
        goods_id: null,
        equipment_number: null,
        un_dangerous_goods_code: null,
        type_of_packages: goods.typeOfPackages,
        number_of_packages: goods.numberOfPackages,
        number_of_individual_pieces: orNull(goods.numberOfPieces),
        package_marks: goods.shippingMarks,
        gross_mass_kg: goods.grossMass,
        net_mass_kg: orNull(goods.netMass),
        goods_description: goods.goodsDescription,
        invoice_number: orNull(goods.invoiceNumber),
        controlled_goods: yesNo(goods.areGoodsControlled),
        controlled_goods_type: null,
        commodity_code: goods.commodityCode,
        country_of_origin: goods.countryOfOrigin,
        item_invoice_amount: Number(goods.itemPriceAmount),
        item_invoice_currency: goods.itemCurrency,
        procedure_code: goods.procedureCode,
        additional_procedure_code: goods.additionalProcedureCode,
        taric_code: orNull(goods.taricAdditionalCode),
        cus_code: orNull(goods.cusCode),
        national_additional_code: orNull(goods.nationalAdditionalCode),
        ni_additional_information_codes: null,
        supplementary_units: orNull(goods.supplementaryUnits),
        ...overrides,
    };
}

export function immiStandaloneGoodsPayload(
    consignmentNumber: string,
    goods: GoodsData
): GoodsWithRecordsPayload {
    return {
        ...goodsPayload(consignmentNumber, goods),
        controlled_goods: yesNo(false),
        number_of_individual_pieces: null,
        ...goodsRecordsPayload(goods),
    };
}

const ENS_ONLY_UNASKED_GOODS_FIELDS: Partial<GoodsPayload> = {
    procedure_code: null,
    additional_procedure_code: null,
    country_of_origin: null,
    item_invoice_amount: null,
    item_invoice_currency: null,
    net_mass_kg: null,
};

export function ensGoodsPayload(
    consignmentNumber: string,
    goods: GoodsData,
    consignment: ConsignmentData
): GoodsWithRecordsPayload {
    const controlled = declaresControlledGoods(consignment) && goods.areGoodsControlled;

    return {
        ...goodsPayload(consignmentNumber, goods),
        equipment_number: equipmentNumberOf(consignment, goods),
        controlled_goods: yesNo(controlled),
        controlled_goods_type: controlled ? CONTROLLED_GOODS_TYPE.EXCISE_GOODS : null,
        ...(consignment.isEnsOnly ? ENS_ONLY_UNASKED_GOODS_FIELDS : {}),
        ...(consignment.useIMMI ? { net_mass_kg: null, supplementary_units: null } : {}),
        ...goodsRecordsPayload(goods),
    };
}

function equipmentNumberOf(consignment: ConsignmentData, goods: GoodsData): string | null {
    if (!consignment.isGoodsCrossEUBorder) {
        return null;
    }
    return consignment.isSameContainer ? consignment.containerIdentifierNumber : goods.containerIdentifierNumber;
}

function goodsRecordsPayload(goods: GoodsData): GoodsRecordsPayload {
    assertRecordsMapped(goods);

    return {
        document_references: goods.documentReferences.map(documentReferencePayload),
        detail_previous_document: goods.previousDocuments.map(previousDocumentPayload),
        additional_information: goods.additionalInformations.map(information => ({
            op_type: OP_TYPE.CREATE,
            additional_info_code: information.code,
            additional_info_description: information.description,
        })),
        additional_procedures: goods.additionalProcedureCodes.map(code => ({
            op_type: OP_TYPE.CREATE,
            additional_procedure_code: code,
        })),
    };
}

function documentReferencePayload(document: DocumentReferenceData): DocumentReferencePayload {
    return {
        op_type: OP_TYPE.CREATE,
        document_code: document.documentCode,
        document_status: orNull(document.documentStatus),
        document_reference: orNull(document.documentReference),
    };
}

function assertRecordsMapped(goods: GoodsData): void {
    const unmapped = Object.entries({
        taricAdditionalCodes: goods.taricAdditionalCodes,
        nationalAdditionalCodes: goods.nationalAdditionalCodes,
    }).filter(([, records]) => records.length > 0).map(([name]) => name);

    if (unmapped.length > 0) {
        throw new Error(
            `The Trader API goods payload does not carry ${unmapped.join(', ')} yet - the record `
            + 'shape was never measured. Map it before seeding a goods item that declares it.'
        );
    }
}

export function immiStandalonePayload(
    consignment: ImmiStandaloneConsignmentData,
    importerEori: string = IMPORTER_EORI
): ImmiStandalonePayload {
    return {
        glr_number: null,
        internal_market: null,
        free_circulation_home_use: yesNo(false),
        declaration_category: declarationCategory(consignment),
        arrival_date_time: DateTimeUtil.toUkDateTime(arrivalDateTime(consignment)),
        importer_eori: importerEori,
        exporter_eori: orNull(consignment.exporterEORI),
        exporter_name: consignment.exporterName,
        exporter_street_number: addressLine(consignment.exporterStreetName, consignment.exporterStreetNumber),
        exporter_city: consignment.exporterCity,
        exporter_postcode: consignment.exporterPostCode,
        exporter_country: consignment.exporterCountryCode,
        customs_warehouse_identifier: null,
        representation_type: orNull(consignment.representationType),
        trader_reference: orNull(consignment.traderReference),
        mode_of_transport: modeOfTransport(consignment),
        icr: null,
        house_airway_bill: null,
        transport_document_reference: null,
        transport_document_type: null,
        location_of_goods_border: consignment.portOfArrival,
        location_of_goods_other: orNull(consignment.locationOfGoods),
        maritime_inventory: null,
        header_previous_document: consignment.headerPreviousDocuments.map(previousDocumentPayload),
        holder_of_authorisation: consignment.holdersOfAuthorisation.map(holderOfAuthorisationPayload),
    };
}

function declarationCategory(consignment: ImmiStandaloneConsignmentData): string {
    if (!consignment.isPreLodged) {
        throw new Error(
            'An arrived standalone IMMI has no declaration category mapped for the Trader API '
            + `yet - only pre-lodged ("${IMMI_DECLARATION_CATEGORY.PRE_LODGED}") was measured.`
        );
    }
    return IMMI_DECLARATION_CATEGORY.PRE_LODGED;
}

function modeOfTransport(consignment: ImmiStandaloneConsignmentData): string {
    const code = IMMI_MODE_OF_TRANSPORT[consignment.typeOfMovement];

    if (!code) {
        throw new Error(
            `No Trader API mode_of_transport is mapped for type of movement `
            + `"${consignment.typeOfMovement}" - add it to IMMI_MODE_OF_TRANSPORT once measured.`
        );
    }
    return code;
}

function arrivalDateTime(consignment: ImmiStandaloneConsignmentData): string {
    if (!consignment.arrivalDateTime) {
        throw new Error('immiStandaloneConsignment() always derives arrivalDateTime - build the data through it.');
    }
    return consignment.arrivalDateTime;
}
