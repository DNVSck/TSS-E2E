/**
 * The shape of an answer from this API, as opposed to what the answer says.
 *
 * Two facts, and both are contract rather than convention:
 *
 * It replies 200 to everything that succeeded - a create included, so there is no 201
 * to allow for. Anything else in the 2xx band is a change to the contract rather than
 * another flavour of success, and a 204 would otherwise reach response.json() and be
 * reported as malformed JSON, which says nothing about what actually happened.
 *
 * And it reports a refusal INSIDE the envelope, as `status: "error"` with the reason in
 * `process_message`. A caller that only read the HTTP code would take a refusal for a
 * success - which is exactly how case management once did.
 */
export const TRADER_API_SUCCESS_STATUS = 200;

export const TRADER_API_RESULT_ERROR = 'error';
