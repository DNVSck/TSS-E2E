import { PreviousDocumentPayload, HolderOfAuthorisationPayload } from './consignment-payload';

export type ImmiStandalonePayload = {
    glr_number: string | null;
    internal_market: string | null;
    free_circulation_home_use: string;
    declaration_category: string;
    arrival_date_time: string;
    importer_eori: string;
    exporter_eori: string | null;
    exporter_name: string;
    exporter_street_number: string;
    exporter_city: string;
    exporter_postcode: string;
    exporter_country: string;
    customs_warehouse_identifier: string | null;
    representation_type: string | null;
    trader_reference: string | null;
    mode_of_transport: string;
    icr: string | null;
    house_airway_bill: string | null;
    transport_document_reference: string | null;
    transport_document_type: string | null;
    location_of_goods_border: string;
    location_of_goods_other: string | null;
    maritime_inventory: string | null;
    header_previous_document: PreviousDocumentPayload[];
    holder_of_authorisation: HolderOfAuthorisationPayload[];
};
