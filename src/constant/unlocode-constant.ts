/**
 * UN/LOCODE - the United Nations code for a trade location, as the delivery screens
 * ask for it.
 *
 * Five characters: two for the country, three for the place. Opaque to anyone reading
 * a test, which is what earns it a constant - "GBBEL" says nothing on its own, and
 * BELFAST says all of it.
 *
 * Not to be confused with SUPERVISING_CUSTOMS_OFFICE.GBBEL004, which starts the same
 * way and is a different thing entirely: that names a customs office, this names a
 * place goods are delivered to.
 */
export const UNLOCODE = {
    BELFAST: 'GBBEL',
} as const;

export type UnlocodeCode = (typeof UNLOCODE)[keyof typeof UNLOCODE];
