import { PartyAddress } from '../../page-object/components/party-block';

/**
 * Every trade party (buyer, consignor, consignee, exporter, seller, ...) is
 * captured in test data as the same six suffixed fields:
 * `{prefix}Name`, `{prefix}StreetName`, `{prefix}StreetNumber`, `{prefix}City`,
 * `{prefix}PostCode`, `{prefix}CountryCode`.
 *
 * This type describes "any object that has that shape for a given prefix",
 * so toPartyAddress can be called against the real, much larger *Data classes
 * without those classes needing to implement anything explicitly - they
 * already have the fields.
 */
type PartyFields<Prefix extends string> = {
    [K in
        | `${Prefix}Name`
        | `${Prefix}StreetName`
        | `${Prefix}StreetNumber`
        | `${Prefix}City`
        | `${Prefix}PostCode`
        | `${Prefix}CountryCode`]: string;
};

/**
 * Maps the `{prefix}...` fields on a test-data object to a PartyAddress.
 *
 * Replaces the buyerAddress/consignorAddress/consigneeAddress/exporterAddress/
 * sellerAddress mapper functions that were duplicated verbatim (same six
 * fields, different prefix) across add-new-consignment-flow.ts and each
 * standalone consignment flow.
 *
 * Usage: toPartyAddress('exporter', input)
 */
export function toPartyAddress<Prefix extends string>(
    prefix: Prefix,
    data: PartyFields<Prefix>,
): PartyAddress {
    return {
        name: data[`${prefix}Name` as keyof PartyFields<Prefix>],
        streetName: data[`${prefix}StreetName` as keyof PartyFields<Prefix>],
        streetNumber: data[`${prefix}StreetNumber` as keyof PartyFields<Prefix>],
        city: data[`${prefix}City` as keyof PartyFields<Prefix>],
        postCode: data[`${prefix}PostCode` as keyof PartyFields<Prefix>],
        country: data[`${prefix}CountryCode` as keyof PartyFields<Prefix>],
    };
}
