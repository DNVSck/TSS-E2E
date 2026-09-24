import { PortalApiClient } from '../../api-client/portal-api-client';
import { PORTAL_API_PATH } from '../../constant/portal-api/portal-api-path-constant';
import { buildPath } from '../../helper/api-path-helper';

interface NirmsDocumentGroup {
    measureTypeDesc?: string;
    documents?: { certificateCode?: string; description?: string }[];
}

export class TariffService {
    constructor(private readonly api: PortalApiClient) { }

    /**
     * Whether this commodity can move under NIRMS at all, and the certificates it needs.
     *
     * The tariff answers with the document groups NIRMS would require - a veterinary
     * control and its CHED-P certificate, for instance - and with an EMPTY array when
     * the commodity is not covered. So "covered" is "the tariff named at least one
     * requirement", which is the service's own contract rather than a reading of it.
     *
     * The codes are the same list the "Select the NIRMS document references" screen is
     * built from, which is what lets that screen be checked against its source.
     */
    async readNirmsDocuments(
        commodityCode: string,
        countryOfOrigin: string
    ): Promise<{ isSupported: boolean; codes: string[] }> {
        const groups = await this.api.read<NirmsDocumentGroup[]>(
            buildPath(PORTAL_API_PATH.NirmsDocuments, { commodityCode, countryOfOrigin })
        );

        if (!Array.isArray(groups)) {
            throw new TypeError(
                `Read the NIRMS tariff for ${commodityCode} (origin ${countryOfOrigin}): the `
                + `Portal API answered something other than a list, so whether the commodity `
                + `is covered is unknown rather than false. The endpoint's contract has changed.`
            );
        }

        return {
            isSupported: groups.length > 0,
            codes: groups.flatMap(group => (group.documents ?? [])
                .map(document => document.certificateCode ?? '')
                .filter(code => code !== '')),
        };
    }
}
