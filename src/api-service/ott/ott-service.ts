import { OttApiClient } from '../../api-client/ott-api-client';
import { buildPath } from '../../helper/api-path-helper';

const OTT_PATH = {
    SupplementaryUnits: 'tariff/supplementary-units/{commodityCode}?estate=UK&originCountry={originCountry}',
} as const;

interface SupplementaryUnitsResult {
    required: boolean;
    validUnits: { unitCode: string; qualifierCode: string | null; description: string }[];
}

export class OttService {
    constructor(private readonly api: OttApiClient) { }

    async readSupplementaryUnits(
        commodityCode: string,
        originCountry: string
    ): Promise<SupplementaryUnitsResult> {
        return this.api.read<SupplementaryUnitsResult>(
            buildPath(OTT_PATH.SupplementaryUnits, { commodityCode, originCountry })
        );
    }
}
