/**
 * "National additional code" on the goods-declaration and the goods item's
 * "National additional codes" tab — the code posted by the `nationalAdditionalCode`
 * select. Full mirror of the select's options; the key is the code (all are valid
 * identifiers, so dot access), the description is kept as a comment.
 *
 * Generated from the live select; regenerate if the national-additional-code list changes.
 */
export const NATIONAL_ADDITIONAL_CODE = {
    VATE: 'VATE', // VAT Exempt duty rate
    VATR: 'VATR', // VAT 5% duty rate
    VATZ: 'VATZ', // VAT 0% duty rate
    X301: 'X301', // UK Tax Type 301, Low Alcohol - not exc 1.2%
    X311: 'X311', // UK Tax Type 311, Beer less than 3.5% abv
    X312: 'X312', // UK Tax Type 312, Cider less than 3.5% abv
    X313: 'X313', // UK Tax Type 313, Wine less than 3.5% abv
    X314: 'X314', // UK Tax Type 314, Other fermented products less than 3.5% abv
    X315: 'X315', // UK Tax Type 315, Spirits less than 3.5% abv
    X321: 'X321', // UK Tax Type 321, Beer at least 3.5% abv but less than 8.5% abv
    X322: 'X322', // UK Tax Type 322, Cider at least 3.5% abv but less than 8.5% abv & sparkling cider at least 3.5% abv not exceeding 5.5% abv
    X323: 'X323', // UK Tax Type 323, Wine at least 3.5% abv but less than 8.5% abv
    X324: 'X324', // UK Tax Type 324, Other fermented products at least 3.5% abv but less than 8.5% abv & sparkling cider exceeding 5.5% abv but less than 8.5% abv
    X325: 'X325', // UK Tax Type 325, Spirits at least 3.5% abv but less than 8.5% abv
    X331: 'X331', // UK Tax Type 331, Beer at least 8.5% abv but not exceeding 22% abv
    X333: 'X333', // UK Tax Type 333, Wine at least 8.5% abv but not exceeding 22% abv
    X334: 'X334', // UK Tax Type 334, Other fermented products at least 8.5% abv but not exceeding 22% abv
    X335: 'X335', // UK Tax Type 335, Spirits at least 8.5%  abv but not exceeding 22% abv
    X341: 'X341', // UK Tax Type 341, Beer exceeding 22% abv
    X343: 'X343', // UK Tax Type 343, Wine exceeding 22% abv
    X344: 'X344', // UK Tax Type 344, Other fermented products exceeding 22% abv
    X345: 'X345', // UK Tax Type 345, Spirits exceeding 22% abv
    X351: 'X351', // UK Tax Type 351, Beer less than 3.5% abv & eligible for Draught Relief
    X352: 'X352', // UK Tax Type 352, Cider less than 3.5% abv & eligible for Draught Relief
    X353: 'X353', // UK Tax Type 353, Wine less than 3.5% abv & eligible for Draught Relief
    X354: 'X354', // UK Tax Type 354, Other fermented products less than 3.5% abv & eligible for Draught Relief
    X355: 'X355', // UK Tax Type 355, Spirits less than 3.5% abv & eligible for Draught Relief
    X356: 'X356', // UK Tax Type 356, Beer at least 3.5% abv but less than 8.5% abv & eligible for Draught Relief
    X357: 'X357', // UK Tax Type 357, Cider at least 3.5% abv but less than 8.5% abv & Sparkling cider at least 3.5% abv but less than not exceeding 5.5% abv & eligible for Draught Relief
    X358: 'X358', // UK Tax Type 358, Wine at least 3.5% abv but less than 8.5% abv & eligible for Draught Relief
    X359: 'X359', // UK Tax Type 359, Other fermented products at least 3.5% abv but less than 8.5% abv & Sparkling cider exceeding 5.5% abv but less than 8.5% abv & eligible for Draught Relief
    X360: 'X360', // UK Tax Type 360, Spirits at least 3.5% abv but less than 8.5% abv & eligible for Draught Relief
    X361: 'X361', // UK Tax Type 361, Beer less than 3.5% abv & eligible for Small Producer Relief
    X362: 'X362', // UK Tax Type 362, Cider less than 3.5% abv & eligible for Small Producer Relief
    X363: 'X363', // UK Tax Type 363, Wine less than 3.5% abv & eligible for Small Producer Relief
    X364: 'X364', // UK Tax Type 364, Other fermented products less than 3.5% abv & eligible for Small Producer Relief
    X365: 'X365', // UK Tax Type 365, Spirits less than 3.5% abv & eligible for Small Producer Relief
    X366: 'X366', // UK Tax Type 366, Beer at least 3.5% abv but less than 8.5% abv & eligible for Small Producer Relief
    X367: 'X367', // UK Tax Type 367, Cider at least 3.5% abv but less than 8.5% abv & Sparkling cider at least 3.5% abv but less than not exceeding 5.5% abv & eligible for Small Producer Relief
    X368: 'X368', // UK Tax Type 368, Wine at least 3.5% abv but less than 8.5% abv & eligible for Small Producer Relief
    X369: 'X369', // UK Tax Type 369, Other fermented products at least 3.5% abv but less than 8.5% abv & Sparkling cider exceeding 5.5% abv but less than 8.5% abv & eligible for Small Producer Relief
    X370: 'X370', // UK Tax Type 370, Spirits at least 3.5% abv but less than 8.5% abv & eligible for Small Producer Relief
    X371: 'X371', // UK Tax Type 371, Beer less than 3.5% abv & eligible for Small Producer Relief and Draught Relief
    X372: 'X372', // UK Tax Type 372, Cider less than 3.5% abv & eligible for Small Producer Relief and Draught Relief
    X373: 'X373', // UK Tax Type 373, Wine less than 3.5% abv & eligible for Small Producer Relief and Draught Relief
    X374: 'X374', // UK Tax Type 374, Other fermented products less than 3.5% abv & eligible for Small Producer Relief and Draught Relief
    X375: 'X375', // UK Tax Type 375, Spirits less than 3.5% abv & eligible for Small Producer Relief and Draught Relief
    X376: 'X376', // UK Tax Type 376, Beer at least 3.5% abv but less than 8.5% abv & eligible for Small Producer Relief and Draught Relief
    X377: 'X377', // UK Tax Type 377, Cider at least 3.5% abv but less than 8.5% abv & Sparkling cider at least 3.5% abv but less than not exceeding 5.5% abv & eligible for Small Producer Relief and Draught Relief
    X378: 'X378', // UK Tax Type 378, Wine at least 3.5% abv but less than 8.5% abv & eligible for Small Producer Relief and Draught Relief
    X379: 'X379', // UK Tax Type 379, Other fermented products at least 3.5% abv but less than 8.5% abv & Sparkling cider exceeding 5.5% abv but less than 8.5% abv & eligible for Small Producer Relief and Draught Relief
    X380: 'X380', // UK Tax Type 380, Spirits at least 3.5% abv but less than 8.5% abv & eligible for Small Producer Relief and Draught Relief
    X399: 'X399', // Cooking alcohol with 5% abv or less
    X511: 'X511', // UK tax type 511, Light oil (unmarked) - aviation gasoline (including light oil aviation turbine fuel)
    X520: 'X520', // UK tax type 520, Light oil (unmarked) - other unrebated light oil
    X521: 'X521', // UK tax type 521, Light oil, furnace fuel
    X522: 'X522', // UK tax type 522, Light oil, unleaded fuel
    X540: 'X540', // UK tax type 540, Heavy oil - other (unmarked) heavy oil (other than kerosene) intended for use as heating fuel, or as fuel for an engine; which would otherwise be eligible for a full rebate
    X541: 'X541', // UK tax type 541, Heavy oil (unmarked; including Diesel Engine Road Vehicle (DERV)) or road fuel extender and unmarked kerosene or unmarked gas oil for which no marking waiver has been granted
    X542: 'X542', // UK tax type 542, Heavy oil kerosene to be used as motor fuel off road or in an excepted vehicle
    X551: 'X551', // UK tax type 551, Heavy oil kerosene (marked/unmarked under marking waiver, including heavy oil aviation turbine fuel) to be used other than as motor fuel off-road or in an excepted vehicle
    X556: 'X556', // UK tax type 556, Heavy gas oil (marked/unmarked under marking waiver)
    X561: 'X561', // UK tax type 561, Heavy oil, fuel oil (unmarked)
    X570: 'X570', // UK tax type 570, Heavy oil, other (unmarked)
    X571: 'X571', // UK tax type 571, Biodiesel to be used as motor fuel off road or in an excepted vehicle
    X572: 'X572', // UK tax type 572, Biodiesel blended with kerosene for use as heating fuel
    X589: 'X589', // UK tax type 589, Biodiesel
    X591: 'X591', // UK tax type 591, Road fuel gases - natural gas including biogas
    X592: 'X592', // UK tax type 592, Road fuel gases - other than natural gas, e.g. LPG
    X595: 'X595', // UK tax type 595, Bioethanol
    X611: 'X611', // UK tax type 611, Cigarettes
    X615: 'X615', // UK tax type 615, Cigars
    X619: 'X619', // UK tax type 619, Hand rolling tobacco
    X623: 'X623', // UK tax type 623, Smoking tobacco - other
    X627: 'X627', // UK tax type 627, Chewing tobacco
    X633: 'X633', // UK tax type 633, Tobacco for heating
    X99A: 'X99A', // Solid fuels i.e. coal and lignite, coke and semi-coke of coal or lignite, and petroleum coke
    X99B: 'X99B', // Any petroleum gas, or other gaseous hydrocarbon supplied in a liquid state
    X99C: 'X99C', // Gas supplied by a gas utility or any gas supplied in a gaseous state that is of a kind supplied by a gas utility Great Britain
    X99D: 'X99D', // Electricity
} as const;

export type NationalAdditionalCode =
    (typeof NATIONAL_ADDITIONAL_CODE)[keyof typeof NATIONAL_ADDITIONAL_CODE];
