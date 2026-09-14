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
     * Whether this commodity can move under NIRMS at all.
     *
     * The tariff answers with the document groups NIRMS would require - a veterinary
     * control and its CHED-P certificate, for instance - and with an EMPTY array when
     * the commodity is not covered. So "covered" is "the tariff named at least one
     * requirement", which is the service's own contract rather than a reading of it.
     */
    async isNirmsSupported(commodityCode: string, countryOfOrigin: string): Promise<boolean> {
        const groups = await this.api.read<NirmsDocumentGroup[]>(
            buildPath(PORTAL_API_PATH.ReadNirmsDocuments, { commodityCode, countryOfOrigin })
        );

        if (!Array.isArray(groups)) {
            throw new TypeError(
                `Read the NIRMS tariff for ${commodityCode} (origin ${countryOfOrigin}): the `
                + `Portal API answered something other than a list, so whether the commodity `
                + `is covered is unknown rather than false. The endpoint's contract has changed.`
            );
        }

        return groups.length > 0;
    }
}
