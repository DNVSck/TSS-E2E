import { PreviousDocumentPayload } from './consignment-payload';

export type GoodsPayload = {
    consignment_number: string;
    goods_id: string | null;
    equipment_number: string | null;
    un_dangerous_goods_code: string | null;
    type_of_packages: string;
    number_of_packages: string;
    number_of_individual_pieces: string | null;
    package_marks: string;
    gross_mass_kg: string;
    net_mass_kg: string | null;
    goods_description: string;
    invoice_number: string | null;
    controlled_goods: string;
    controlled_goods_type: string | null;
    commodity_code: string;
    country_of_origin: string | null;
    item_invoice_amount: number | null;
    item_invoice_currency: string | null;
    procedure_code: string | null;
    additional_procedure_code: string | null;
    taric_code: string | null;
    cus_code: string | null;
    national_additional_code: string | null;
    ni_additional_information_codes: string | null;
    supplementary_units: string | null;
};

export type DocumentReferencePayload = {
    op_type: string;
    document_code: string;
    document_status: string | null;
    document_reference: string | null;
};

export type AdditionalProcedurePayload = {
    op_type: string;
    additional_procedure_code: string;
};

export type GoodsRecordsPayload = {
    document_references: DocumentReferencePayload[];
    detail_previous_document: PreviousDocumentPayload[];
    additional_information: never[];
    additional_procedures: AdditionalProcedurePayload[];
};

export type GoodsWithRecordsPayload = GoodsPayload & GoodsRecordsPayload;
