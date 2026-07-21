/**
 * "Type code" on the holder-of-authorisation screen — the opaque authorisation
 * code posted by the `typeCode` select, not the translated description.
 */
export const AUTHORISATION_TYPE_CODE = {
    /** ACE - Authorised consignee for Union transit. */
    AUTHORISED_CONSIGNEE_UNION_TRANSIT: 'ACE',
    /** ACP - Authorised issuer to establish the proof of the customs status of Union goods. */
    AUTHORISED_ISSUER_PROOF_UNION_STATUS: 'ACP',
    /** ACR - Authorised consignor for Union transit. */
    AUTHORISED_CONSIGNOR_UNION_TRANSIT: 'ACR',
    /** ACT - Authorised consignee for TIR procedure. */
    AUTHORISED_CONSIGNEE_TIR: 'ACT',
    /** AEOC - Authorised Economic Operator — Customs simplifications. */
    AEO_CUSTOMS_SIMPLIFICATIONS: 'AEOC',
    /** AEOF - Authorised Economic Operator — Customs simplifications/Security and safety. */
    AEO_CUSTOMS_AND_SECURITY: 'AEOF',
    /** AEOS - Authorised Economic Operator — Security and safety. */
    AEO_SECURITY_AND_SAFETY: 'AEOS',
    /** APEX - Approved Exporter. */
    APPROVED_EXPORTER: 'APEX',
    /** AOR - Advance Origin Ruling. */
    ADVANCE_ORIGIN_RULING: 'AOR',
    /** ATR - Advance Tariff Ruling. */
    ADVANCE_TARIFF_RULING: 'ATR',
    /** AVR - Advance Valuation Ruling. */
    ADVANCE_VALUATION_RULING: 'AVR',
    /** AWB - Authorised Weigher of Bananas. */
    AUTHORISED_WEIGHER_OF_BANANAS: 'AWB',
    /** BOI - Binding Origin Information. */
    BINDING_ORIGIN_INFORMATION: 'BOI',
    /** BRD - Bulk Import Reduced Data Set Authorisation. */
    BULK_IMPORT_REDUCED_DATA_SET: 'BRD',
    /** BTI - Binding Tariff Information. */
    BINDING_TARIFF_INFORMATION: 'BTI',
    /** CCL - Authorisation for centralised clearance. */
    CENTRALISED_CLEARANCE: 'CCL',
    /** CGU - Customs comprehensive guarantee. */
    CUSTOMS_COMPREHENSIVE_GUARANTEE: 'CGU',
    /** CSDR - Community System of Duty Reliefs. */
    COMMUNITY_SYSTEM_OF_DUTY_RELIEFS: 'CSDR',
    /** CSE - Customs Supervised Exports. */
    CUSTOMS_SUPERVISED_EXPORTS: 'CSE',
    /** CVA - Simplification of the determination of amounts being part of the customs value of goods. */
    CUSTOMS_VALUATION_SIMPLIFICATION: 'CVA',
    /** CW1 - Public customs warehouse type I. */
    PUBLIC_CUSTOMS_WAREHOUSE_TYPE_I: 'CW1',
    /** CW2 - Public customs warehouse type II. */
    PUBLIC_CUSTOMS_WAREHOUSE_TYPE_II: 'CW2',
    /** CWP - Private customs warehouse. */
    PRIVATE_CUSTOMS_WAREHOUSE: 'CWP',
    /** DEP - Designated Export Place. */
    DESIGNATED_EXPORT_PLACE: 'DEP',
    /** DPO - Deferment of payment authorisation. */
    DEFERMENT_OF_PAYMENT: 'DPO',
    /** EIR - Authorisation for the use of customs declaration through EIDR. */
    ENTRY_IN_DECLARANTS_RECORDS: 'EIR',
    /** EORI - Economic Operator Registration and Identification. */
    ECONOMIC_OPERATOR_REGISTRATION_IDENTIFICATION: 'EORI',
    /** EXRR - RORO Exporter. */
    RORO_EXPORTER: 'EXRR',
    /** EPSS - Excise Payment Security System. */
    EXCISE_PAYMENT_SECURITY_SYSTEM: 'EPSS',
    /** ETD - Electronic Transport Document (authorised for use as a customs declaration). */
    ELECTRONIC_TRANSPORT_DOCUMENT: 'ETD',
    /** EUS - End Use authorisation. */
    END_USE: 'EUS',
    /** EXEE - Registered Consignee (Excise). */
    REGISTERED_CONSIGNEE_EXCISE: 'EXEE',
    /** EXOR - Registered Consignor (Excise). */
    REGISTERED_CONSIGNOR_EXCISE: 'EXOR',
    /** EXW - Excise Warehouse. */
    EXCISE_WAREHOUSE: 'EXW',
    /** EXWH - Excise Warehouse — Hydrocarbon Oils. */
    EXCISE_WAREHOUSE_HYDROCARBON_OILS: 'EXWH',
    /** FAS - Flexible Accounting System. */
    FLEXIBLE_ACCOUNTING_SYSTEM: 'FAS',
    /** FP - Freeport Authorisation. */
    FREEPORT: 'FP',
    /** FTI - Fixed Transport Installation. */
    FIXED_TRANSPORT_INSTALLATION: 'FTI',
    /** FZ - Free Zone (only for the use of the Isle of Man). */
    FREE_ZONE: 'FZ',
    /** GGA - General Guarantee Account. */
    GENERAL_GUARANTEE_ACCOUNT: 'GGA',
    /** GVS - General Valuation Statement. */
    GENERAL_VALUATION_STATEMENT: 'GVS',
    /** IPO - Inward Processing authorisation. */
    INWARD_PROCESSING: 'IPO',
    /** MIB - Merchandise in Baggage. */
    MERCHANDISE_IN_BAGGAGE: 'MIB',
    /** MOU - Memorandum of Understanding (approved exporters only). */
    MEMORANDUM_OF_UNDERSTANDING: 'MOU',
    /** NIRM - The EORI number of the NIRMS authorisation holder. */
    NIRMS_AUTHORISATION_HOLDER: 'NIRM',
    /** OPO - Outward Processing authorisation. */
    OUTWARD_PROCESSING: 'OPO',
    /** PUKC - The EORI number of the UKC authorisation holder. */
    UKC_AUTHORISATION_HOLDER: 'PUKC',
    /** REM - Remission of the amounts of import or export duty. */
    REMISSION_OF_DUTY: 'REM',
    /** REP - Repayment of the amounts of import or export duty. */
    REPAYMENT_OF_DUTY: 'REP',
    /** REX - Registered Exporter. */
    REGISTERED_EXPORTER: 'REX',
    /** RSS - Regular Shipping Services authorisation. */
    REGULAR_SHIPPING_SERVICES: 'RSS',
    /** SAS - Authorisation for self-assessment. */
    SELF_ASSESSMENT: 'SAS',
    /** SASP - Single Authorisation for Simplified Procedures. */
    SINGLE_AUTHORISATION_SIMPLIFIED_PROCEDURES: 'SASP',
    /** SDE - Simplified Declaration Procedure authorisation (SDP). */
    SIMPLIFIED_DECLARATION_PROCEDURE: 'SDE',
    /** SIVA - Simplified Import VAT Accounting. */
    SIMPLIFIED_IMPORT_VAT_ACCOUNTING: 'SIVA',
    /** SSE - Authorisation for the use of seals of a special type. */
    SEALS_OF_A_SPECIAL_TYPE: 'SSE',
    /** TEA - Temporary Admission authorisation. */
    TEMPORARY_ADMISSION: 'TEA',
    /** TEAH - Temporary Admission authorisation — Auction Houses. */
    TEMPORARY_ADMISSION_AUCTION_HOUSES: 'TEAH',
    /** TRD - Authorisation to use transit declaration with a reduced dataset. */
    TRANSIT_DECLARATION_REDUCED_DATASET: 'TRD',
    /** TST - Authorisation to operate temporary storage facilities. */
    TEMPORARY_STORAGE_FACILITIES: 'TST',
    /** UKCS - UK Continental Shelf. */
    UK_CONTINENTAL_SHELF: 'UKCS',
    /** UKD - UK Destination Authorisation. */
    UK_DESTINATION: 'UKD',
    /** UKTS - UK Trader Scheme Authorisation. */
    UK_TRADER_SCHEME: 'UKTS',
    /** UKIM - UK Internal Market Scheme Authorisation. */
    UK_INTERNAL_MARKET_SCHEME: 'UKIM',
} as const;

export type AuthorisationTypeCode =
    (typeof AUTHORISATION_TYPE_CODE)[keyof typeof AUTHORISATION_TYPE_CODE];
