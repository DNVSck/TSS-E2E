import { StringUtil } from '../../core/util/string-util';
import { ICS2_DECLARANT_ID } from '../../../config/environment';

/**
 * The body the RabbitMQ management API publishes to reach ICS2: an envelope carrying a
 * JSON payload that itself carries the IE3N03 XML.
 *
 * A payload builder, so it states facts only - it opens no connection and knows no
 * host. Moved here from helper/api-helper on 2026-08-20, alongside the CDS builders:
 * that file predated this layer and held a payload and an endpoint together, which is
 * one file doing the jobs of two.
 *
 * The exchange and routing key did NOT come with it - those say where the message
 * goes, so they belong to Ics2MockApiClient the way a route belongs to a client and a
 * locator belongs to a page object.
 */

/** The Spring type header the consumer deserialises against. */
const ICS2_STATUS_RESPONSE_TYPE =
    'nc.uk.hmrc.tss.common.shared.model.adapter.ics2.Ics2StatusResponse';

/**
 * IE3N03 "Authorised for Movement" - ICS2 telling the portal the movement may go.
 *
 * @param ensMrn  the ENS MRN the notification is about
 * @param ensN730 the transport document number declared on the consignment
 */
export function buildIe3n03Message(ensMrn: string, ensN730: string): Record<string, unknown> {
    const jobId = StringUtil.randomUuid();
    const completionDate = new Date().toISOString();
    const d = new Date(completionDate);
    const dateAndTime = [
        d.getUTCFullYear(),
        d.getUTCMonth() + 1,
        d.getUTCDate(),
        d.getUTCHours(),
        d.getUTCMinutes(),
    ];

    const xmlPayload =
        `<?xml version="1.0" encoding="UTF-8"?>` +
        `<IE3N03 xmlns="urn:wco:datamodel:eu:ics2:2">` +
        `<MRN>${ensMrn}</MRN>` +
        `<completionDate><DateTime>${completionDate}</DateTime></completionDate>` +
        `<responsibleMemberState><country>XI</country></responsibleMemberState>` +
        `<transportDocument><documentNumber>${ensN730}</documentNumber><type>N730</type></transportDocument>` +
        `<declarant><identificationNumber>${ICS2_DECLARANT_ID}</identificationNumber></declarant>` +
        `</IE3N03>`;

    const innerPayload = JSON.stringify({
        response: {
            type: 'assessmentComplete',
            dateAndTime,
            jobId,
            messageTypeId: 'IE3N03',
            mrn: ensMrn,
            xmlPayload,
        },
        status: {
            type: 'completed',
            mrn: ensMrn,
            status: 'COMPLETED',
        },
    });

    return {
        payload_encoding: 'string',
        properties: {
            delivery_mode: 2,
            content_encoding: 'UTF-8',
            content_type: 'application/json',
            headers: {
                __TypeId__: ICS2_STATUS_RESPONSE_TYPE,
            },
        },
        payload: innerPayload,
    };
}
