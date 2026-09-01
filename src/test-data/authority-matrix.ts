import { ACCESS_LEVEL } from '../constant/access-level-constant';
import { AuthoritySituation } from '../flows/authority-check-flow';

/**
 * The permission rules, as data.
 *
 * Trung's tables of 2026-08-13 written where a test can read them, so that a rule
 * changing is one edited cell rather than a hunt through a spec for every place that
 * spelled it out - and so that a rule the service breaks fails somewhere that names it.
 *
 * A row is keyed by SITUATION, not by state, because the two journeys disagree about
 * what decides access. For an integrated declaration it is the state the record is in;
 * for a standalone one it is WHO CREATED it - which is why a standalone row says nothing
 * about draft versus submitted, and why the party that never created anything is the
 * interesting column there. That disagreement between the two tables is the most
 * valuable thing in this file, so the shape has to hold both.
 */

const { NONE, READ, FULL } = ACCESS_LEVEL;

/**
 * An ENS-ONLY declaration - one that generates nothing else.
 *
 * The Importer is None here, not Read, and that is the point of measuring the ENS on
 * this journey rather than on ENS-SFD. MEASURED 2026-08-14: an importer is refused an
 * ENS-only declaration outright - not listed in its search, not served by URL. Nothing
 * is being declared on anybody's behalf, so there is no importer party to read it.
 *
 * Trung's table 1 gives the Importer Read on an ENS consignment, and that stays true
 * where it was written - a declaration made FOR an importer, which is the ENS-SFD
 * journey. The two rows disagreeing is a fact about the journeys, not a contradiction.
 *
 * Only measurable at draft and at Trader Input Required. Once a consignment is accepted
 * the service offers nothing to anybody, so Read there would be true but unfalsifiable -
 * see assertFalsifiable, which is why no row exists for that state.
 */
export const ENS_ONLY_AUTHORITY: Record<
    'draftMovement' | 'rejectedMovement' | 'draftConsignment' | 'rejectedConsignment',
    AuthoritySituation
> = {
    /**
     * The movement header - the ENS itself, a level above its consignments.
     *
     * Asked separately because the two levels are separate decisions: a company shut out
     * of a consignment could still be shown the movement carrying it, and a movement
     * still being written is where its own fields are changed.
     */
    draftMovement: {
        agent: FULL,
        importer: NONE,
    },
    rejectedMovement: {
        agent: FULL,
        importer: NONE,
    },
    draftConsignment: {
        agent: FULL,
        importer: NONE,
    },
    rejectedConsignment: {
        agent: FULL,
        importer: NONE,
    },
};

/**
 * A declaration the service GENERATES from an ENS - an SFD or an IMMI, one table for
 * both (Trung, 2026-08-14: "IMMI and SFD are the same mechanism for every party").
 *
 * Measured on each rather than assumed for one and inherited by the other: the two are
 * produced by different journeys and needed different levers to reject, so the rule
 * holding across them is a finding, not a definition. The SFD is refused by an
 * authorisation naming the wrong party; the IMMI by a UKIMS number naming the wrong
 * party, which is the same rule expressed where an IMMI declares it.
 *
 * The EIDR is NOT here. It is the one generated declaration nobody may edit, which is a
 * different rule and gets its own table below.
 *
 * The ENS half of these journeys is not repeated either - an ENS consignment answers the
 * same way whatever is generated from it, and is measured on the ENS-ONLY journey where
 * it stands alone.
 */
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
 * The odd one out: **nobody holds Full on a generated EIDR** (Trung, 2026-08-14). Every
 * party may look it up and read it, and none may change it - so this row has no
 * contrast, and the spec passes `unfalsifiableBecause` to say so out loud rather than
 * letting assertFalsifiable stop it.
 *
 */
export const ENS_EIDR_AUTHORITY: Record<'generatedEidrConsignment', AuthoritySituation> = {
    generatedEidrConsignment: {
        agent: READ,
        importer: READ,
    },
};

/**
 * Standalone declarations (SFD, IMMI), keyed by who created them.
 * NO REJECTION IS NEEDED to measure Full here, unlike every integrated journey. Measured
 * 2026-08-14: a standalone declaration stays editable after the service has accepted it -
 * the creating agent is still offered its change links and record actions at "Awaiting
 * arrival". An integrated declaration is not, which is why those tests have to arrange a
 * rejection first and these do not.
 */
export const STANDALONE_AUTHORITY: Record<'createdByThisAgent', AuthoritySituation> = {
    createdByThisAgent: {
        agentNotRepresenting: NONE,
        agentAsImporter: FULL,
        anotherAgent: NONE,
        importer: FULL,
    },
};
