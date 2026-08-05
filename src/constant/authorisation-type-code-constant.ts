/**
 * "Type code" on the holder-of-authorisation screen — the opaque authorisation
 * code posted by the `typeCode` select, not the translated description.
 */
export const AUTHORISATION_TYPE_CODE = {
    /** ACE - Authorised consignee for Union transit. */
    AUTHORISED_CONSIGNEE_UNION_TRANSIT_ACE: 'ACE',
    /** ACP - Authorised issuer to establish the proof of the customs status of Union goods. */
    AUTHORISED_ISSUER_PROOF_UNION_STATUS_ACP: 'ACP',
    /** ACR - Authorised consignor for Union transit. */
    AUTHORISED_CONSIGNOR_UNION_TRANSIT_ACR: 'ACR',
    /** ACT - Authorised consignee for TIR procedure. */
    AUTHORISED_CONSIGNEE_TIR_ACT: 'ACT',
    /** AEOC - Authorised Economic Operator — Customs simplifications. */
    AEO_CUSTOMS_SIMPLIFICATIONS_AEOC: 'AEOC',
    /** AEOF - Authorised Economic Operator — Customs simplifications/Security and safety. */
    AEO_CUSTOMS_AND_SECURITY_AEOF: 'AEOF',
    /** AEOS - Authorised Economic Operator — Security and safety. */
    AEO_SECURITY_AND_SAFETY_AEOS: 'AEOS',
    /** APEX - Approved Exporter. */
    APPROVED_EXPORTER_APEX: 'APEX',
    /** AOR - Advance Origin Ruling. */
    ADVANCE_ORIGIN_RULING_AOR: 'AOR',
    /** ATR - Advance Tariff Ruling. */
    ADVANCE_TARIFF_RULING_ATR: 'ATR',
    /** AVR - Advance Valuation Ruling. */
    ADVANCE_VALUATION_RULING_AVR: 'AVR',
    /** AWB - Authorised Weigher of Bananas. */
    AUTHORISED_WEIGHER_OF_BANANAS_AWB: 'AWB',
    /** BOI - Binding Origin Information. */
    BINDING_ORIGIN_INFORMATION_BOI: 'BOI',
    /** BRD - Bulk Import Reduced Data Set Authorisation. */
    BULK_IMPORT_REDUCED_DATA_SET_BRD: 'BRD',
    /** BTI - Binding Tariff Information. */
    BINDING_TARIFF_INFORMATION_BTI: 'BTI',
    /** CCL - Authorisation for centralised clearance. */
    CENTRALISED_CLEARANCE_CCL: 'CCL',
    /** CGU - Customs comprehensive guarantee. */
    CUSTOMS_COMPREHENSIVE_GUARANTEE_CGU: 'CGU',
    /** CSDR - Community System of Duty Reliefs. */
    COMMUNITY_SYSTEM_OF_DUTY_RELIEFS_CSDR: 'CSDR',
    /** CSE - Customs Supervised Exports. */
    CUSTOMS_SUPERVISED_EXPORTS_CSE: 'CSE',
    /** CVA - Simplification of the determination of amounts being part of the customs value of goods. */
    CUSTOMS_VALUATION_SIMPLIFICATION_CVA: 'CVA',
    /** CW1 - Public customs warehouse type I. */
    PUBLIC_CUSTOMS_WAREHOUSE_TYPE_I_CW1: 'CW1',
    /** CW2 - Public customs warehouse type II. */
    PUBLIC_CUSTOMS_WAREHOUSE_TYPE_II_CW2: 'CW2',
    /** CWP - Private customs warehouse. */
    PRIVATE_CUSTOMS_WAREHOUSE_CWP: 'CWP',
    /** DEP - Designated Export Place. */
    DESIGNATED_EXPORT_PLACE_DEP: 'DEP',
    /** DPO - Deferment of payment authorisation. */
    DEFERMENT_OF_PAYMENT_DPO: 'DPO',
    /** EIR - Authorisation for the use of customs declaration through EIDR. */
    ENTRY_IN_DECLARANTS_RECORDS_EIR: 'EIR',
    /** EORI - Economic Operator Registration and Identification. */
    ECONOMIC_OPERATOR_REGISTRATION_IDENTIFICATION_EORI: 'EORI',
    /** EXRR - RORO Exporter. */
    RORO_EXPORTER_EXRR: 'EXRR',
    /** EPSS - Excise Payment Security System. */
    EXCISE_PAYMENT_SECURITY_SYSTEM_EPSS: 'EPSS',
    /** ETD - Electronic Transport Document (authorised for use as a customs declaration). */
    ELECTRONIC_TRANSPORT_DOCUMENT_ETD: 'ETD',
    /** EUS - End Use authorisation. */
    END_USE_EUS: 'EUS',
    /** EXEE - Registered Consignee (Excise). */
    REGISTERED_CONSIGNEE_EXCISE_EXEE: 'EXEE',
    /** EXOR - Registered Consignor (Excise). */
    REGISTERED_CONSIGNOR_EXCISE_EXOR: 'EXOR',
    /** EXW - Excise Warehouse. */
    EXCISE_WAREHOUSE_EXW: 'EXW',
    /** EXWH - Excise Warehouse — Hydrocarbon Oils. */
    EXCISE_WAREHOUSE_HYDROCARBON_OILS_EXWH: 'EXWH',
    /** FAS - Flexible Accounting System. */
    FLEXIBLE_ACCOUNTING_SYSTEM_FAS: 'FAS',
    /** FP - Freeport Authorisation. */
    FREEPORT_FP: 'FP',
    /** FTI - Fixed Transport Installation. */
    FIXED_TRANSPORT_INSTALLATION_FTI: 'FTI',
    /** FZ - Free Zone (only for the use of the Isle of Man). */
    FREE_ZONE_FZ: 'FZ',
    /** GGA - General Guarantee Account. */
    GENERAL_GUARANTEE_ACCOUNT_GGA: 'GGA',
    /** GVS - General Valuation Statement. */
    GENERAL_VALUATION_STATEMENT_GVS: 'GVS',
    /** IPO - Inward Processing authorisation. */
    INWARD_PROCESSING_IPO: 'IPO',
    /** MIB - Merchandise in Baggage. */
    MERCHANDISE_IN_BAGGAGE_MIB: 'MIB',
    /** MOU - Memorandum of Understanding (approved exporters only). */
    MEMORANDUM_OF_UNDERSTANDING_MOU: 'MOU',
    /** NIRM - The EORI number of the NIRMS authorisation holder. */
    NIRMS_AUTHORISATION_HOLDER_NIRM: 'NIRM',
    /** OPO - Outward Processing authorisation. */
    OUTWARD_PROCESSING_OPO: 'OPO',
    /** PUKC - The EORI number of the UKC authorisation holder. */
    UKC_AUTHORISATION_HOLDER_PUKC: 'PUKC',
    /** REM - Remission of the amounts of import or export duty. */
    REMISSION_OF_DUTY_REM: 'REM',
    /** REP - Repayment of the amounts of import or export duty. */
    REPAYMENT_OF_DUTY_REP: 'REP',
    /** REX - Registered Exporter. */
    REGISTERED_EXPORTER_REX: 'REX',
    /** RSS - Regular Shipping Services authorisation. */
    REGULAR_SHIPPING_SERVICES_RSS: 'RSS',
    /** SAS - Authorisation for self-assessment. */
    SELF_ASSESSMENT_SAS: 'SAS',
    /** SASP - Single Authorisation for Simplified Procedures. */
    SINGLE_AUTHORISATION_SIMPLIFIED_PROCEDURES_SASP: 'SASP',
    /** SDE - Simplified Declaration Procedure authorisation (SDP). */
    SIMPLIFIED_DECLARATION_PROCEDURE_SDE: 'SDE',
    /** SIVA - Simplified Import VAT Accounting. */
    SIMPLIFIED_IMPORT_VAT_ACCOUNTING_SIVA: 'SIVA',
    /** SSE - Authorisation for the use of seals of a special type. */
    SEALS_OF_A_SPECIAL_TYPE_SSE: 'SSE',
    /** TEA - Temporary Admission authorisation. */
    TEMPORARY_ADMISSION_TEA: 'TEA',
    /** TEAH - Temporary Admission authorisation — Auction Houses. */
    TEMPORARY_ADMISSION_AUCTION_HOUSES_TEAH: 'TEAH',
    /** TRD - Authorisation to use transit declaration with a reduced dataset. */
    TRANSIT_DECLARATION_REDUCED_DATASET_TRD: 'TRD',
    /** TST - Authorisation to operate temporary storage facilities. */
    TEMPORARY_STORAGE_FACILITIES_TST: 'TST',
    /** UKCS - UK Continental Shelf. */
    UK_CONTINENTAL_SHELF_UKCS: 'UKCS',
    /** UKD - UK Destination Authorisation. */
    UK_DESTINATION_UKD: 'UKD',
    /** UKTS - UK Trader Scheme Authorisation. */
    UK_TRADER_SCHEME_UKTS: 'UKTS',
    /** UKIM - UK Internal Market Scheme Authorisation. */
    UK_INTERNAL_MARKET_SCHEME_UKIM: 'UKIM',
} as const;

export type AuthorisationTypeCode =
    (typeof AUTHORISATION_TYPE_CODE)[keyof typeof AUTHORISATION_TYPE_CODE];
