import { faker } from '@faker-js/faker';
import { StringUtil } from '../../core/util/string-util';

/**
 * The bodies TSS accepts on the HMRC-CDS callback: a push-notification envelope whose
 * `message` is the WCO RES document CDS would have sent.
 *
 * A payload builder, so it lives with the other test data and states facts only - it
 * opens no connection and decides nothing. The client sends it; the flow decides when.
 *
 * Each CDS message is its own builder rather than one template with the function code
 * pulled out as a knob. DMSACC-01 and DMSCLE-09 disagree about the XML prolog, the
 * namespace style (prefixed `_2_1:` versus a default namespace), which MetaData
 * children appear, and whether there is an AcceptanceDateTime or an
 * AdditionalInformation block - so a shared template would be a switch statement
 * wearing a template's clothes.
 *
 * Adding a message (DMSREJ, DMSCTL, ...) means writing its builder and adding one row
 * to CDS_RESPONSE. Nothing in the client or the flow changes.
 */

/** Length of the FunctionalReferenceID CDS puts on the response message itself. */
const MESSAGE_REFERENCE_HEX_LENGTH = 32;

/**
 * How far before the response the declaration is said to have been accepted.
 *
 * CDS issues a response after it accepted the declaration, so the two timestamps are
 * never equal - a minute is what the recorded exchange showed. DMSACC-01 only: the
 * other messages carry no acceptance time.
 */
const ACCEPTANCE_LEAD_MS = 60_000;

const MESSAGE_CONTENT_TYPE = 'application/xml';

/** The notification has not been consumed yet - the state a fresh push arrives in. */
const NOTIFICATION_STATUS = 'PENDING';

/**
 * Which version of the declaration a response answers.
 */
const DECLARATION_VERSION = 2;

/**
 * Which declaration a response is about.
 *
 * The whole of what a caller has to supply. Structural typing means anything carrying
 * an lrn and an mrn fits - GeneratedConsignment does - so no flow has to import this
 * to hand one over.
 */
export interface DeclarationIdentity {
    /** The declaration's own reference - its FunctionalReferenceID on the wire. */
    lrn: string;
    /** The MRN CDS assigned to it. */
    mrn: string;
}

export interface CdsResponseMessage {
    /**
     * What this message is called in CDS - the name a person would search for, and the
     * name the report shows. Left as the bare identifier on purpose: translating
     * "DMSCLE-09" into a guess at what it means would put an interpretation in the
     * report that nobody checked.
     */
    readonly name: string;
    readonly buildMessage: (declaration: DeclarationIdentity, issuedAt: Date) => string;
}

/**
 * WCO formatCode 304 - YYYYMMDDHHmmss in UTC, no separators, trailing Z.
 */
function wcoDateTime(date: Date): string {
    return `${date.toISOString().replaceAll(/[-:T.]/g, '').slice(0, 14)}Z`;
}

/**
 * The envelope's own timestamp: ISO-8601 with milliseconds and a numeric UTC offset
 * (2026-08-20T14:33:12.123+0700), which is the shape the service was seen to send.
 *
 * Written out rather than taken from DateTimeUtil.formatDate, which drops milliseconds
 * and the offset - both of which this format is entirely about.
 */
function envelopeDateTime(date: Date): string {
    const pad = (value: number, width = 2): string => String(value).padStart(width, '0');
    const offsetMinutes = -date.getTimezoneOffset();
    const sign = offsetMinutes < 0 ? '-' : '+';
    const offset = Math.abs(offsetMinutes);

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
        + `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
        + `.${pad(date.getMilliseconds(), 3)}`
        + `${sign}${pad(Math.floor(offset / 60))}${pad(offset % 60)}`;
}

/** The per-message reference CDS stamps on the response itself. */
function messageReference(): string {
    return faker.string.hexadecimal({
        length: MESSAGE_REFERENCE_HEX_LENGTH,
        casing: 'lower',
        prefix: '',
    });
}

/**
 * DMSACC-01.
 *
 * Every RES element carries an explicit `_2_1:` prefix here, and MetaData lists four
 * empty children the other message omits. Reproduced verbatim, prefixes included: the
 * receiving parser matches on them, so "tidying" this into the other message's shape
 * would change what is on the wire.
 */
function buildDmsAcc01(declaration: DeclarationIdentity, issuedAt: Date): string {
    const acceptedAt = new Date(issuedAt.getTime() - ACCEPTANCE_LEAD_MS);
    const wcoNamespace = 'xmlns:_2_2="urn:wco:datamodel:WCO:Response_DS:DMS:2"';

    return '<_2:MetaData xmlns:_2="urn:wco:datamodel:WCO:DocumentMetaData-DMS:2">'
        + '<_2:WCODataModelVersionCode>3.6</_2:WCODataModelVersionCode>'
        + '<_2:WCOTypeName>RES</_2:WCOTypeName>'
        + '<_2:ResponsibleCountryCode/>'
        + '<_2:ResponsibleAgencyName/>'
        + '<_2:AgencyAssignedCustomizationCode/>'
        + '<_2:AgencyAssignedCustomizationVersionCode/>'
        + '<_2_1:Response xmlns:_2_1="urn:wco:datamodel:WCO:RES-DMS:2">'
        + '<_2_1:FunctionCode>01</_2_1:FunctionCode>'
        + `<_2_1:FunctionalReferenceID>${messageReference()}</_2_1:FunctionalReferenceID>`
        + '<_2_1:IssueDateTime>'
        + `<_2_2:DateTimeString formatCode="304" ${wcoNamespace}>${wcoDateTime(issuedAt)}</_2_2:DateTimeString>`
        + '</_2_1:IssueDateTime>'
        + '<_2_1:Declaration>'
        + '<_2_1:AcceptanceDateTime>'
        + `<_2_2:DateTimeString formatCode="304" ${wcoNamespace}>${wcoDateTime(acceptedAt)}</_2_2:DateTimeString>`
        + '</_2_1:AcceptanceDateTime>'
        + `<_2_1:FunctionalReferenceID>${declaration.lrn}</_2_1:FunctionalReferenceID>`
        + `<_2_1:ID>${declaration.mrn}</_2_1:ID>`
        + `<_2_1:VersionID>${DECLARATION_VERSION}</_2_1:VersionID>`
        + '</_2_1:Declaration>'
        + '</_2_1:Response>'
        + '</_2:MetaData>';
}

/**
 * DMSCLE-09.
 *
 * A different document, not DMSACC-01 with another number in it: it opens with an XML
 * prolog, puts RES in the DEFAULT namespace so its elements are unprefixed, drops the
 * four empty MetaData children and the AcceptanceDateTime, and adds an
 * AdditionalInformation block.
 *
 * A2 / AFB are held fixed because the recorded exchange held them fixed. If either
 * turns out to vary per case it becomes an argument, not another message.
 */
function buildDmsCle09(declaration: DeclarationIdentity, issuedAt: Date): string {
    return '<?xml version="1.0" encoding="UTF-8"?>'
        + '<md:MetaData xmlns:md="urn:wco:datamodel:WCO:DocumentMetaData-DMS:2"'
        + ' xmlns="urn:wco:datamodel:WCO:RES-DMS:2">'
        + '<md:WCODataModelVersionCode>3.6</md:WCODataModelVersionCode>'
        + '<md:WCOTypeName>RES</md:WCOTypeName>'
        + '<Response>'
        + '<FunctionCode>09</FunctionCode>'
        + `<FunctionalReferenceID>${messageReference()}</FunctionalReferenceID>`
        + '<IssueDateTime>'
        + `<DateTimeString formatCode="304">${wcoDateTime(issuedAt)}</DateTimeString>`
        + '</IssueDateTime>'
        + '<AdditionalInformation>'
        + '<StatementCode>A2</StatementCode>'
        + '<StatementTypeCode>AFB</StatementTypeCode>'
        + '</AdditionalInformation>'
        + '<Declaration>'
        + `<FunctionalReferenceID>${declaration.lrn}</FunctionalReferenceID>`
        + `<ID>${declaration.mrn}</ID>`
        + `<VersionID>${DECLARATION_VERSION}</VersionID>`
        + '</Declaration>'
        + '</Response>'
        + '</md:MetaData>';
}

/**
 * Every CDS response the suite can send.
 *
 * The extension point: a new message is a row here, and neither CdsMockApiClient nor
 * CdsNotificationFlow has to learn about it - the same way a new journey adds a row to
 * authority-matrix rather than a branch to the runner that reads it.
 */
export const CDS_RESPONSE = {
    DMSACC_01: { name: 'DMSACC-01', buildMessage: buildDmsAcc01 },
    DMSCLE_09: { name: 'DMSCLE-09', buildMessage: buildDmsCle09 },
} as const satisfies Record<string, CdsResponseMessage>;

/**
 * Wrap one CDS message in the push-notification envelope the callback expects.
 *
 * The envelope is the same for every message - fresh ids and a timestamp per push -
 * so it is built once here rather than repeated in each builder.
 */
export function buildCdsNotification(
    response: CdsResponseMessage,
    declaration: DeclarationIdentity
): Record<string, unknown> {
    const issuedAt = new Date();

    return {
        notificationId: StringUtil.randomUuid(),
        boxId: StringUtil.randomUuid(),
        messageContentType: MESSAGE_CONTENT_TYPE,
        message: response.buildMessage(declaration, issuedAt),
        status: NOTIFICATION_STATUS,
        createdDateTime: envelopeDateTime(issuedAt),
    };
}
