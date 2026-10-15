import * as path from 'node:path';
import { FileUtil } from '../core/util/file-utils';
import { GOODS_CSV_COLUMN } from '../constant/goods-csv-upload-constant';

const csvFile = (name: string): string => path.join(__dirname, 'csv', name);

export const GOODS_CSV = {
    ENS_ONLY: csvFile('ens-only.csv'),
    ENS_SFD: csvFile('ens-sfd.csv'),
    ENS_SFD_99_GOODS: csvFile('ens-sfd-99-goods.csv'),
    ENS_IMMI: csvFile('ens-immi.csv'),
    ENS_EIDR: csvFile('ens-eidr.csv'),
    SFD_STANDALONE: csvFile('sfd-standalone.csv'),
    EIDR_STANDALONE: csvFile('eidr-standalone.csv'),
    IMMI_STANDALONE: csvFile('immi-standalone.csv'),
    // Header row only, no goods rows: refused with ERROR 100136.
    HEADERS_ONLY: csvFile('headers-only.csv'),
    // Old header set, refused with ERROR 100137. It lacks the required
    // nature_of_transaction_code, preference_code, country_of_preferential_origin,
    // valuation_indicator_code, valuation_method_code and are_goods_controlled, and
    // still carries controlled_goods_type, which the service no longer supports.
    // Missing headers are reported first; the unsupported one only once they are added.
    LEGACY_HEADERS: csvFile('legacy-headers.csv'),
} as const;

export interface GoodsCsvRow {
    description: string;
    commodityCode: string;
    procedureCode: string;
}

export const readGoodsCsv = (csvFile: string): GoodsCsvRow[] =>
    (FileUtil.readCSV(csvFile) ?? []).map(record => ({
        description: record[GOODS_CSV_COLUMN.DESCRIPTION],
        commodityCode: record[GOODS_CSV_COLUMN.COMMODITY_CODE],
        procedureCode: record[GOODS_CSV_COLUMN.PROCEDURE_CODE],
    }));
