import { ACCESS_LEVEL } from '../constant/access-level-constant';
import { AuthoritySituation } from '../flows/authority-check-flow';


const { NONE, READ, FULL } = ACCESS_LEVEL;

export const ENS_ONLY_AUTHORITY: Record<
    'draftMovement' | 'rejectedMovement' | 'draftConsignment' | 'rejectedConsignment',
    AuthoritySituation
> = {

    draftMovement: {
        agent: FULL,
        importer: READ,
        haulier: READ,
    },
    rejectedMovement: {
        agent: FULL,
        importer: READ,
    },
    draftConsignment: {
        agent: FULL,
        importer: READ,
        haulier: READ,
    },
    rejectedConsignment: {
        agent: FULL,
        agentAsImporter: READ,
        importer: READ,
    },
};


export const GENERATED_DECLARATION_AUTHORITY: Record<'rejectedConsignment', AuthoritySituation> = {
    rejectedConsignment: {
        agent: FULL,
        agentAsImporter: FULL,
        importer: FULL,
    },
};

/**
 * ENS integrated ending in a generated EIDR.
 *
 *
 */
export const ENS_EIDR_AUTHORITY: Record<'generatedEidrConsignment', AuthoritySituation> = {
    generatedEidrConsignment: {
        agent: READ,
        agentAsImporter: READ,
        importer: READ,
    },
};


export const MOVEMENT_GMR_AUTHORITY: Record<'gmr', AuthoritySituation> = {
    gmr: {
        agent: FULL,
        importer: READ,
        haulier: READ,
    },
};


export const REPRESENTED_HAULIER_AUTHORITY: Record<
    'ensConsignment' | 'rejectedGeneratedConsignment' | 'generatedEidrConsignment' | 'gmr',
    AuthoritySituation
> = {
    ensConsignment: {
        agentAsHaulier: FULL,
        agentNotRepresenting: FULL,
        haulier: FULL,
    },
    rejectedGeneratedConsignment: {
        agentAsHaulier: FULL,
        agentNotRepresenting: FULL,
        haulier: FULL,
    },

    generatedEidrConsignment: {
        agentAsHaulier: READ,
        agentNotRepresenting: READ,
        haulier: READ,
    },

    gmr: {
        agentAsHaulier: FULL,
        agentNotRepresenting: FULL,
        haulier: FULL,
        agentAsImporter: READ,
    },
};


export const STANDALONE_AUTHORITY: Record<'createdByThisAgent' | 'authorisedEidr', AuthoritySituation> = {
    // agentNotRepresenting went None -> Full on 2026-10-10: an Agent holds the rights of
    // the trader it acts for even when it is not representing it. Measured on sit that day
    // for the standalone IMMI and SFD. Another agent company still reaches nothing.
    createdByThisAgent: {
        agentNotRepresenting: FULL,
        agentAsImporter: FULL,
        anotherAgent: NONE,
        importer: FULL,
    },

    authorisedEidr: {
        agentNotRepresenting: FULL,
        agentAsImporter: FULL,
        importer: FULL,
    },
};


export const SUPPLEMENTARY_DECLARATION_AUTHORITY: Record<
    'draft' | 'traderInputRequired' | 'representedHaulier',
    AuthoritySituation
> = {
    draft: {
        agent: FULL,
        agentAsImporter: FULL,
        agentNotRepresenting: FULL,
        importer: FULL,
        haulier: NONE,
    },
    traderInputRequired: {
        agent: FULL,
        agentAsImporter: FULL,
        agentNotRepresenting: FULL,
        importer: FULL,
        haulier: NONE,
    },
    representedHaulier: {
        agentAsHaulier: NONE,
        agentNotRepresenting: FULL,
        importer: FULL,
        haulier: NONE,
    },
};
