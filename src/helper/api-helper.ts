import { StringUtil } from '../core/util/string-util';
import { ICS2_DECLARANT_ID } from '../../config/environment';

// Builders for the API/message payloads this service exchanges. Named for the role
// (an api helper) rather than for today's only subject, so the next payload builder
// joins it here instead of starting another file - same reason as report-helper.
// Each builder keeps a name that says exactly what it builds.

const ICS2_EXCHANGE = 'ics2-exchange';
const ICS2_ROUTING_KEY = 'portal.ics2.notification';
const ICS2_STATUS_RESPONSE_TYPE = 'nc.uk.hmrc.tss.common.shared.model.adapter.ics2.Ics2StatusResponse';
const DECLARANT_ID = ICS2_DECLARANT_ID;
export const PUBLISH_ENDPOINT = `/api/exchanges/%2F/${ICS2_EXCHANGE}/publish`;

export function buildIe3n03PublishBody(ensMrn: string, ensN730: string): Record<string, unknown> {
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
    `<declarant><identificationNumber>${DECLARANT_ID}</identificationNumber></declarant>` +
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
    vhost: '/',
    name: ICS2_EXCHANGE,
    routing_key: ICS2_ROUTING_KEY,
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