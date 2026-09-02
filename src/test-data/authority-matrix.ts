import { ACCESS_LEVEL } from '../constant/access-level-constant';
import { AuthoritySituation } from '../flows/authority-check-flow';

/**
 * The permission rules, as data.
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
 * Table 1 gives the Importer Read on an ENS consignment, and that stays true
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
        agentAsImporter: NONE,
        importer: NONE,
    },
};

/**
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
 *
 */
export const ENS_EIDR_AUTHORITY: Record<'generatedEidrConsignment', AuthoritySituation> = {
    generatedEidrConsignment: {
        agent: READ,
        agentAsImporter: READ,
        importer: READ,
    },
};

/**
 * The GMR on a movement the Agent submitted as ITSELF.
 *
 * Table 1 gives the importer Read on a GMR, and that half is stated from it.
 * The two agent cells follow the submitter rule instead: the account that made the
 * movement holds it, and representing somebody else does not cost it that. STATED,
 * NEVER MEASURED, like the haulier GMR row below.
 */
export const MOVEMENT_GMR_AUTHORITY: Record<'gmr', AuthoritySituation> = {
    gmr: {
        agent: FULL,
        agentAsImporter: READ,
        importer: READ,
    },
};

/**
 * An ENS declared by the Agent WHILE REPRESENTING THE HAULIER, and what it generates.
 *
 * The other side of the submitter rule: Full follows the company the
 * declaration was submitted BY, plus whoever represents it. Above, the Agent submitted as
 * itself and keeps Full whatever it does next; here it submitted as the Haulier, so
 * giving the representation up takes the record away entirely - None, not Read.
 *
 * The Importer is deliberately absent: nobody has ruled on what an importer sees on a
 * declaration a haulier submitted, and inventing that cell would dress a guess as a rule.
 */
export const REPRESENTED_HAULIER_AUTHORITY: Record<
    'ensConsignment' | 'rejectedGeneratedConsignment' | 'generatedEidrConsignment' | 'gmr',
    AuthoritySituation
> = {
    ensConsignment: {
        agentAsHaulier: FULL,
        agentNotRepresenting: NONE,
        haulier: FULL,
    },
    rejectedGeneratedConsignment: {
        agentAsHaulier: FULL,
        agentNotRepresenting: NONE,
        haulier: FULL,
    },
    // An EIDR nobody may edit, reached through a Haulier. Read where the row above says
    // Full, because the EIDR rule outranks the submitter rule - measured 2026-09-01 on
    // the Agent-as-itself journey. None still means None: whatever the record allows,
    // an account representing nobody is not shown it.
    generatedEidrConsignment: {
        agentAsHaulier: READ,
        agentNotRepresenting: NONE,
        haulier: READ,
    },
    // The GMR, from table 1 (2026-08-13): Full for the haulier and for an
    // agent acting as one, None for an agent acting for nobody. STATED, NEVER
    // MEASURED - no test in this suite has ever asked a GMR about authority, on this
    // branch or on v1, so the first green run is what turns this from a plan into a
    // finding.
    gmr: {
        agentAsHaulier: FULL,
        agentNotRepresenting: NONE,
        haulier: FULL,
        // The Importer on its OWN login, not an agent acting for it: the question is
        // what a company named on the declarations aboard this movement may do with a
        // movement somebody else filed.
        //
        // STATED, NOT MEASURED. Read is the answer on a GMR the Agent made itself
        // (2026-09-02), and the importer is named on the declarations either way - but
        // None is just as arguable, because a GMR is movement-level and this movement
        // belongs to the haulier. The first run decides it, and None would be the more
        // interesting answer.
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
