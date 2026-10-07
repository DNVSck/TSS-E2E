import { StringUtil } from '../../core/util/string-util';

/**
 * The bodies TSS accepts on the HMRC-GVMS callback: the same push-notification envelope
 * the CDS callback takes, whose `message` is the GVMS status update as a JSON STRING.
 *
 * A payload builder, so it lives with the other test data and states facts only - it
 * opens no connection, signs nothing and decides nothing. The client sends it and signs
 * it; the flow decides when one is due.
 *
 * Each state is a row of GVMS_STATE rather than a builder of its own, because unlike the
 * CDS messages these genuinely ARE one template with values pulled out: same fields, same
 * order, same shape. The only field that comes and goes is reportToLocations, which the
 * service sends with an inspection and not otherwise.
 */

const MESSAGE_CONTENT_TYPE = 'application/json';

/**
 * Which GMR a notification is about.
 *
 * Both halves come from the Portal API's own answer for that GMR - see
 * GmrService.readGmr. The boxId is NOT invented: it addresses the subscription the
 * portal registered with HMRC, and a made-up one is delivered nowhere.
 */
export interface GmrIdentity {
    /** The id GVMS assigned ("GMRCKR9LQVDZ"), not the local reference. */
    gmrId: string;
    boxId: string;
}

/** Where an inspection is to be reported, as GVMS words it. */
export interface InspectionLocation {
    inspectionTypeId: string;
    locationIds: string[];
}

export interface GvmsStateMessage {
    /** What this state is called in GVMS - the name a person searches for, and reports. */
    readonly name: string;
    readonly gmrState: string;
    /**
     * Whether the movement is held for inspection, and where to report if it is.
     */
    readonly inspectionRequired: boolean;
    readonly reportToLocations?: InspectionLocation[];
    /**
     * The envelope's own status. RECEIVED on the first push of a GMR's life and
     * ACKNOWLEDGED afterwards, which is how the recorded exchange read.
     */
    readonly notificationStatus: string;
    /**
     * Which version of the GMR's status this message carries.
     *
     * A DEFAULT, not a rule. The recorded samples disagree with each other - 3 for
     * CHECKED_IN, 4 for EMBARKED, 1 for COMPLETED - which is what a set of captures
     * taken from different GMRs at different times looks like, not a sequence. A caller
     * that knows the real version passes it.
     */
    readonly statusVersion: number;
}

const NOTIFICATION_STATUS = {
    RECEIVED: 'RECEIVED',
    ACKNOWLEDGED: 'ACKNOWLEDGED',
} as const;

/**
 * The inspection locations the recorded EMBARKED-with-inspection message carried.
 *
 * Opaque codes, kept as they were seen. Nothing here decides them - they are what the
 * service said, and the test's job is to hand them back.
 */
const RECORDED_INSPECTION_LOCATIONS: InspectionLocation[] = [
    { inspectionTypeId: '1', locationIds: ['L0029A', 'L0030A', 'L0031A'] },
    { inspectionTypeId: '2', locationIds: ['L0029A', 'L0031A'] },
];

export const GVMS_STATE = {
    CHECKED_IN: {
        name: 'CHECKED_IN',
        gmrState: 'CHECKED_IN',
        inspectionRequired: false,
        notificationStatus: NOTIFICATION_STATUS.RECEIVED,
        statusVersion: 3,
    },
    EMBARKED: {
        name: 'EMBARKED',
        gmrState: 'EMBARKED',
        inspectionRequired: false,
        notificationStatus: NOTIFICATION_STATUS.ACKNOWLEDGED,
        statusVersion: 4,
    },
    EMBARKED_FOR_INSPECTION: {
        name: 'EMBARKED (inspection required)',
        gmrState: 'EMBARKED',
        inspectionRequired: true,
        reportToLocations: RECORDED_INSPECTION_LOCATIONS,
        notificationStatus: NOTIFICATION_STATUS.ACKNOWLEDGED,
        statusVersion: 4,
    },
    COMPLETED: {
        name: 'COMPLETED',
        gmrState: 'COMPLETED',
        inspectionRequired: false,
        notificationStatus: NOTIFICATION_STATUS.ACKNOWLEDGED,
        statusVersion: 1,
    },
    CANCELLED: {
        name: 'CANCELLED',
        gmrState: 'CANCELLED',
        inspectionRequired: false,
        notificationStatus: NOTIFICATION_STATUS.RECEIVED,
        statusVersion: 3,
    },
} as const satisfies Record<string, GvmsStateMessage>;

/**
 * The envelope's timestamp: milliseconds and a NUMERIC UTC offset (…103+0000).
 *
 * Deliberately UTC, and deliberately not the CDS payload's envelopeDateTime, which
 * stamps the machine's local offset (…+0700 from here). The two formats look alike and
 * are not the same claim: what GVMS was recorded accepting is +0000, so that is what
 * this sends rather than whatever timezone the runner happens to sit in.
 */
function utcEnvelopeDateTime(date: Date): string {
    return `${date.toISOString().replace('Z', '')}+0000`;
}

/**
 * The message's own timestamps: the same instant, ending in a literal Z.
 *
 * Two formats in one body is not a mistake to tidy - the envelope is HMRC's push
 * wrapper and the message is the GVMS document inside it, and they were captured
 * disagreeing.
 */
function messageDateTime(date: Date): string {
    return date.toISOString();
}

/**
 * Wrap one GVMS status update in the push-notification envelope the callback expects.
 *
 * The message is a STRING, not an object: HMRC's push notification carries its payload
 * serialised, which is also why the signature the client adds is taken over the whole
 * body exactly as it goes on the wire.
 */
export function buildGvmsNotification(
    state: GvmsStateMessage,
    gmr: GmrIdentity,
    statusVersion = state.statusVersion
): Record<string, unknown> {
    const issuedAt = new Date();
    const stamped = messageDateTime(issuedAt);

    const message = {
        messageId: StringUtil.randomUuid(),
        gmrId: gmr.gmrId,
        gmrStatusVersion: statusVersion,
        createdDateTime: stamped,
        updatedDateTime: stamped,
        gmrState: state.gmrState,
        inspectionRequired: state.inspectionRequired,
        ...(state.reportToLocations ? { reportToLocations: state.reportToLocations } : {}),
    };

    return {
        notificationId: StringUtil.randomUuid(),
        boxId: gmr.boxId,
        messageContentType: MESSAGE_CONTENT_TYPE,
        message: JSON.stringify(message),
        status: state.notificationStatus,
        createdDateTime: utcEnvelopeDateTime(issuedAt),
    };
}
