import { GoodsData } from '../../goods-data';
import { orNull, yesNo } from '../../../helper/api-payload-helper';

export type GoodsPayload = {
    consignment_number: string;
    goods_id: string | null;
    equipment_number: string | null;
    un_dangerous_goods_code: string | null;
    type_of_packages: string;
    number_of_packages: string;
    number_of_individual_pieces: string | null;
    package_marks: string;
    gross_mass_kg: string;
    net_mass_kg: string | null;
    goods_description: string;
    invoice_number: string | null;
    controlled_goods: string;
    controlled_goods_type: string | null;
    commodity_code: string;
    country_of_origin: string;
    item_invoice_amount: number;
    item_invoice_currency: string;
    procedure_code: string;
    additional_procedure_code: string;
    taric_code: string | null;
    cus_code: string | null;
    national_additional_code: string | null;
    ni_additional_information_codes: string | null;
    supplementary_units: string | null;
};

/** Only asked of controlled goods, and only this one value has been exercised. */
const CONTROLLED_GOODS_TYPE = 'certifications_required';

export function goodsPayload(
    consignmentNumber: string,
    goods: GoodsData,
    overrides: Partial<GoodsPayload> = {}
): GoodsPayload {
    return {
        consignment_number: consignmentNumber,
        goods_id: null,
        equipment_number: null,
        un_dangerous_goods_code: null,
        type_of_packages: goods.typeOfPackages,
        number_of_packages: goods.numberOfPackages,
        number_of_individual_pieces: orNull(goods.numberOfPieces),
        package_marks: goods.shippingMarks,
        gross_mass_kg: goods.grossMass,
        net_mass_kg: orNull(goods.netMass),
        goods_description: goods.goodsDescription,
        invoice_number: orNull(goods.invoiceNumber),
        controlled_goods: yesNo(goods.areGoodsControlled),
        controlled_goods_type: goods.areGoodsControlled ? CONTROLLED_GOODS_TYPE : null,
        commodity_code: goods.commodityCode,
        country_of_origin: goods.countryOfOrigin,
        item_invoice_amount: Number(goods.itemPriceAmount),
        item_invoice_currency: goods.itemCurrency,
        procedure_code: goods.procedureCode,
        additional_procedure_code: goods.additionalProcedureCode,
        taric_code: orNull(goods.taricAdditionalCode),
        cus_code: orNull(goods.cusCode),
        national_additional_code: orNull(goods.nationalAdditionalCode),
        ni_additional_information_codes: null,
        supplementary_units: orNull(goods.supplementaryUnits),
        ...overrides,
    };
}
