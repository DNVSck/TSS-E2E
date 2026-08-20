import { COMPANY_PROFILE, isProvisioned } from '../../../src/auth/credentials';
import { BASE_URL, IMPORTER_COMPANY_NAME } from '../../../config/environment';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../../../src/constant/type-of-movement-code-constant';
import { REPRESENTATION_TYPE } from '../../../src/constant/representation-type-constant';
import {
    immiStandaloneGoodsItem, immiStandaloneTransportDocument,
} from '../../../src/test-data/immi-standalone-goods-item-data';
import { sfdStandaloneGoodsItem } from '../../../src/test-data/sfd-standalone-goods-item-data';
import { ReportLog } from '../../../src/core/report/report-log';
import { CONTAINER_SIZE } from '../../../src/constant/container-size-constant';
import { CONTAINER_PACKED_STATUS } from '../../../src/constant/container-packed-status-constant';
import { CONTAINER_SUPPLIER_TYPE } from '../../../src/constant/container-supplier-type-constant';
import { generateRandomContainerIdentifierNumber } from '../../../src/helper/data-generate-helper';
import {
    ensOnlyDeclaration, ensSfdDeclaration, ensImmiDeclaration, ensEidrDeclaration,
    rejectedByIcs2, rejectedByCds, immiRejectedByCds, importerUkimsDocument,
    immiStandaloneRejectedByCds, sfdStandaloneRejectedByCds,
} from '../../../src/test-data/representation-authority-data';
import {
    ENS_ONLY_AUTHORITY, GENERATED_DECLARATION_AUTHORITY, ENS_EIDR_AUTHORITY, STANDALONE_AUTHORITY,
} from '../../../src/test-data/authority-matrix';
import { IMMI_EIDR_DECLARATION_TABS } from '../../../src/constant/record-tab-constant';
import { MOVEMENT_ACTION } from '../../../src/constant/movement-action-constant';
import { CONSIGNMENT_ACTION } from '../../../src/constant/consignment-action-constant';
import { holderOfAuthorisation } from '../../../src/test-data/holder-of-authorisation-data';
import { AUTHORISATION_TYPE_CODE } from '../../../src/constant/authorisation-type-code-constant';
import { test } from '../../test-hooks';

test.describe('ENS Integrated declaration authority - Agent declares as itself', () => {
    test.use({ authProfile: COMPANY_PROFILE.AGENT });

    test.setTimeout(10 * 60_000);

    test.beforeEach(async ({ representTraderFlow }) => {
        await ReportLog.setFeature('Representation authority');
        await representTraderFlow.stopRepresenting();
    });

    test('Verify that the Agent, on its own account, can correct and resubmit its rejected ENS consignment', { tag: ['@auth', '@authorisation'] }, async ({
        createDraftEnsDeclarationFlow, consignmentOverviewFlow, movementOverviewFlow,
        declarationAccessFlow, checkAuthority,
    }, testInfo) => {
        await ReportLog.setStory('Agent on its own account - reach, reject, correct, resubmit');

        const draft = await ReportLog.step('Build the ENS declaration and leave it in draft', () =>
            createDraftEnsDeclarationFlow
                .createDraftEnsDeclaration(ensOnlyDeclaration(testInfo, rejectedByIcs2()))
        );

        // A draft asks less than a rejection does: the question is only whether a company
        // may submit it, cancel it, and add records to it.
        const draftUrl = await declarationAccessFlow.openDeclarationFromSearch(draft.consignmentReference);
        const draftRecords = await declarationAccessFlow.locateRecordsAt(draftUrl);

        const draftCheck = {
            what: 'the draft consignment',
            records: draftRecords,
            reference: draft.consignmentReference,
        };

        await ReportLog.step('Measure who may touch it while it is still a draft', async () => {
            await checkAuthority(ENS_ONLY_AUTHORITY.draftConsignment, {
                ...draftCheck, parties: ['agent', 'importer'],
            });

            const draftMovement = await declarationAccessFlow.locateMovementHeader();
            await checkAuthority(ENS_ONLY_AUTHORITY.draftMovement, {
            what: 'the draft movement header',
            records: draftMovement,
            surfaceOnly: true,
            recordActions: [MOVEMENT_ACTION.NEW_CONSIGNMENT, MOVEMENT_ACTION.CANCEL_DECLARATION],
            });
        });

        await ReportLog.step('Submit it, and let ICS2 hand it back to the trader', async () => {
            await declarationAccessFlow.openDeclarationFromSearch(draft.consignmentReference);
            await consignmentOverviewFlow.submitConsignment();
            await movementOverviewFlow.waitForSubmittedMovementOverview();
            await movementOverviewFlow.verifyEnsConsignmentTraderInputRequired();
        });

        // A consignment handed back to the trader is by definition waiting to be edited,
        // so this is the one state where "is a change offered" measures authority rather
        // than state - an accepted consignment offers nothing to anybody.
        // The header first and the consignment second, so the Agent's browser ends up
        // inside the consignment - which is where the correction below starts, and the
        // movement overview has no breadcrumb back down into it.
        await ReportLog.step('Measure who may touch it once it has been rejected', async () => {
            const rejectedMovement = await declarationAccessFlow.locateMovementHeader();
            await checkAuthority(ENS_ONLY_AUTHORITY.rejectedMovement, {
                what: 'the movement header of the rejected consignment',
                records: rejectedMovement,
                surfaceOnly: true,
                recordActions: [MOVEMENT_ACTION.NEW_CONSIGNMENT, MOVEMENT_ACTION.CANCEL_DECLARATION],
            });

            const rejected = await declarationAccessFlow.locateEnsConsignmentRecords();
            await checkAuthority(ENS_ONLY_AUTHORITY.rejectedConsignment, {
                what: 'the rejected consignment',
                records: rejected,
            });
        });

        await ReportLog.step('Correct the rejection and resubmit', async () => {
            // The reads left the Agent's browser on the goods item; the field being
            // corrected lives a level up.
            await consignmentOverviewFlow.goToConsignmentOverview();
            await consignmentOverviewFlow.correctContainerIdentification(
                generateRandomContainerIdentifierNumber(),
                CONTAINER_SIZE.TRAILER,
                CONTAINER_PACKED_STATUS.NOT_EMPTY,
                CONTAINER_SUPPLIER_TYPE.SHIPPER_SUPPLIED
            );
            await consignmentOverviewFlow.submitConsignment();
            await movementOverviewFlow.waitForSubmittedMovementOverview();
            await movementOverviewFlow.verifyEnsConsignmentDetail({ traderInputIsSettled: false });
        });
    });

    /**
     * One rejected SFD, asked twice: as the Agent itself, then representing the Importer.
     *
     * The SFD belongs to the importer being declared for - so declaring the ENS does not
     * by itself carry authority over what the service generated from it, and representing
     * the importer does.
     *
     * Both halves live in ONE test because they are the same record in the same state:
     * splitting them would build a second rejected SFD only to ask the other half of the
     * question, and would lose what makes the answer worth anything. This Agent account
     * holds grants from BOTH companies, so the comparison is the same account, the same
     * browser, the same record, seconds apart - nothing but the representation changed.
     *
     * The Importer half is exercised rather than observed: the Agent goes on to correct
     * the holder of authorisation CDS objected to and put the SFD back in.
     */
    test('Verify that the Agent cannot edit a rejected SFD on its own account, and can once it represents the Importer', { tag: ['@auth', '@authorisation'] }, async ({
        createDraftEnsDeclarationFlow, consignmentOverviewFlow, movementOverviewFlow,
        declarationAccessFlow, representTraderFlow, checkAuthority, t,
    }, testInfo) => {
        await ReportLog.setStory('Agent starts representing the Importer to correct the rejected SFD');

        await ReportLog.step('Build the ENS-SFD declaration and let CDS reject the SFD', async () => {
            await createDraftEnsDeclarationFlow
                .createDraftEnsDeclaration(ensSfdDeclaration(testInfo, rejectedByCds()));

            // Building the declaration ends on the goods-item overview; submit lives a
            // level up. The first test is already ON the consignment overview when it
            // submits, which is why only this one walks back.
            await consignmentOverviewFlow.goToConsignmentOverview();
            await consignmentOverviewFlow.submitConsignment();
            await movementOverviewFlow.waitForSubmittedMovementOverview();

            // The spine. Not routed through verifySfdConsignmentDetail, which THROWS on
            // this status - for a happy-path journey a rejected SFD is the failure, but
            // here it is the precondition.
            await movementOverviewFlow.verifySfdConsignmentTraderInputRequired();
        });

        const sfd = await declarationAccessFlow.locateSfdConsignmentRecords();
        const sfdCheck = {
            what: 'the rejected SFD',
            records: sfd,
        };

        await ReportLog.step('Measure what the Agent may do on its own account', () =>
            // One party at a time, because the Agent can only represent one company at
            // once - which is the whole point of this test rather than an inconvenience.
            checkAuthority(GENERATED_DECLARATION_AUTHORITY.rejectedConsignment, {
                ...sfdCheck, parties: ['agent'],
            })
        );

        await ReportLog.step('Measure what the same account may do representing the Importer', async () => {
            await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);
            await checkAuthority(GENERATED_DECLARATION_AUTHORITY.rejectedConsignment, {
                ...sfdCheck, parties: ['agentAsImporter'],
            });
        });

        await ReportLog.step('Correct the authorisation and resubmit', async () => {
            // The reads ended on the goods item; the authorisation record is on a tab of
            // the consignment.
            await declarationAccessFlow.openRecord(sfd.consignment);

            // Name the party the authorisation really belongs to - the importer being
            // declared for - which is exactly what CDS said it did not.
            await consignmentOverviewFlow.correctHolderOfAuthorisation(holderOfAuthorisation());

            // The wizard ends on the record's own tab, where submit is rendered disabled
            await consignmentOverviewFlow.goToConsignmentOverview();
            await consignmentOverviewFlow.submitConsignment();

            await declarationAccessFlow
                .verifyCorrectionAcceptedByCds(sfd.consignment, 'status.awaitingArrival');
        });
    });

    /**
     * The Importer corrects the record CDS actually objected to, and resubmits.
     *
     * The same correction as the test above, made from the Importer's OWN login rather
     * than by an agent representing it - the two ways the service can arrive at Full,
     * asked separately, because only one of them depends on representation working.
     *
     * The correction is also of a different KIND from the one in the ENS test above:
     * there the rejection was a consignment FIELD with its own Change link, here it is a
     * holder-of-authorisation RECORD on a tab, which has no Change link at all - opening
     * the record re-enters the wizard that created it.
     */
    test('Verify that the Importer, on its own login, can correct and resubmit a rejected SFD the Agent declared', { tag: ['@auth', '@authorisation'] }, async ({
        createDraftEnsDeclarationFlow, consignmentOverviewFlow, movementOverviewFlow,
        declarationAccessFlow, checkAuthority, t,
    }, testInfo) => {
        await ReportLog.setStory('Importer corrects the holder of authorisation and resubmits');

        await ReportLog.step('Build the ENS-SFD declaration and let CDS reject the SFD', async () => {
            await createDraftEnsDeclarationFlow
                .createDraftEnsDeclaration(ensSfdDeclaration(testInfo, rejectedByCds()));

            await consignmentOverviewFlow.goToConsignmentOverview();
            await consignmentOverviewFlow.submitConsignment();
            await movementOverviewFlow.waitForSubmittedMovementOverview();
            await movementOverviewFlow.verifySfdConsignmentTraderInputRequired();
        });

        const sfd = await declarationAccessFlow.locateSfdConsignmentRecords();

        // Asked on its own login rather than through the Agent, because the rule is
        // about the company and not about a representation. The window is kept: the
        // Importer is about to use what it was just shown.
        const { importer } = await ReportLog.step('Measure what the Importer may do on its own login', () =>
            checkAuthority(GENERATED_DECLARATION_AUTHORITY.rejectedConsignment, {
                what: 'the rejected SFD',
                records: sfd,
                parties: ['importer'],
                keepOpen: ['importer'],
            })
        );

        await ReportLog.step('The Importer corrects the authorisation and resubmits', async () => {
            // The reads ended on the goods item; the authorisation record is on a tab of
            // the consignment.
            await importer!.declarations.openRecord(sfd.consignment);

            // Name the party the authorisation really belongs to - the importer being
            // declared for - which is exactly what CDS said it did not.
            await importer!.consignment.correctHolderOfAuthorisation(holderOfAuthorisation());

            // Back up to the consignment in the IMPORTER's browser: the wizard ends on the
            // record's own tab, where submit is rendered disabled.
            await importer!.consignment.goToConsignmentOverview();
            await importer!.consignment.submitConsignment();

            // Status, not MRN. Unlike the ENS consignment, a rejected SFD ALREADY carries
            // an MRN , so an MRN here would prove nothing. Leaving
            // "Trader Input Required" is what says the correction was accepted.
            await importer!.declarations
                .verifyCorrectionAcceptedByCds(sfd.consignment, 'status.awaitingArrival');
        });
    });

    /**
     * The same rule as the SFD test above, asked of the other journey - and it holds.
     *
     * Worth building rather than assuming: an IMMI is generated by a different journey
     * and could plausibly be governed differently. It also needed a different lever. Two
     * were tried and ACCEPTED before this one (see representation-authority-data), which
     * is why the rejection is arranged where an IMMI actually declares the importer's
     * authorisation: the `1UKI` UKIMS number on the goods item.
     */
    test('Verify that the Agent cannot edit a rejected IMMI on its own account, and can once it represents the Importer', { tag: ['@auth', '@authorisation'] }, async ({
        createDraftEnsDeclarationFlow, consignmentOverviewFlow, movementOverviewFlow,
        declarationAccessFlow, representTraderFlow, goodsOverviewFlow, checkAuthority, t,
    }, testInfo) => {
        await ReportLog.setStory('The rejected IMMI is the Importer to correct, not the declaring Agent');

        await ReportLog.step('Build the ENS-IMMI declaration and let CDS reject the IMMI', async () => {
            await createDraftEnsDeclarationFlow
                .createDraftEnsDeclaration(ensImmiDeclaration(testInfo, immiRejectedByCds()));

            await consignmentOverviewFlow.goToConsignmentOverview();
            await consignmentOverviewFlow.submitConsignment();
            await movementOverviewFlow.waitForSubmittedMovementOverview();
            await movementOverviewFlow.verifyImmiConsignmentTraderInputRequired();
        });

        const immi = await declarationAccessFlow.locateImmiConsignmentRecords();

        const immiCheck = {
            what: 'the rejected IMMI',
            records: immi,
            // Seven goods-item tabs, not nine: an IMMI drops the two fiscal ones
            tabs: IMMI_EIDR_DECLARATION_TABS,
        };

        await ReportLog.step('Measure what the Agent and the Importer may do', () =>
            checkAuthority(GENERATED_DECLARATION_AUTHORITY.rejectedConsignment, {
                ...immiCheck, parties: ['agent', 'importer'],
            })
        );

        await ReportLog.step('Measure what the same account may do representing the Importer', async () => {
            // From the Agent's own browser, switched to represent the Importer: the same
            // right the Importer holds, reached the way the SFD switch test reaches it,
            // and without a second window for a correction only one company can make.
            await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);
            await checkAuthority(GENERATED_DECLARATION_AUTHORITY.rejectedConsignment, {
                ...immiCheck, parties: ['agentAsImporter'],
            });
        });

        await ReportLog.step('Correct the UKIMS document and resubmit', async () => {
            // The correction undoes the lever exactly: the goods item's 1UKI goes back to
            // the importer's own UKIMS number. The reads left the browser on the goods
            // item, which is where that record lives.
            await declarationAccessFlow.openRecord(immi.goodsItem!);
            await goodsOverviewFlow.correctDocumentReference(importerUkimsDocument());

            await consignmentOverviewFlow.goToConsignmentOverview();
            await consignmentOverviewFlow.submitConsignment();

            // Status, not MRN - a rejected IMMI already carries one, as a rejected SFD does.
            await declarationAccessFlow
                .verifyCorrectionAcceptedByCds(immi.consignment, 'status.awaitingArrival');
        });
    });

    /**
     * The Importer corrects the IMMI from its OWN login, not through an agent.
     *
     * The counterpart of the SFD test above, and the reason both exist: Full can be
     * reached two ways - by the company itself, or by an agent representing it - and only
     * one of them depends on representation working at all. The test above exercises the
     * agent's route on this journey; this one exercises the company's.
     *
     * The correction is a level deeper than the SFD's: an IMMI is refused over the `1UKI`
     * UKIMS number on its GOODS ITEM, so the second session has to reach the goods item's
     * tabs rather than the consignment's.
     */
    test('Verify that the Importer, on its own login, can correct and resubmit a rejected IMMI the Agent declared', { tag: ['@auth', '@authorisation'] }, async ({
        createDraftEnsDeclarationFlow, consignmentOverviewFlow, movementOverviewFlow,
        declarationAccessFlow, checkAuthority, t,
    }, testInfo) => {
        await ReportLog.setStory('Importer corrects the UKIMS on a rejected IMMI and resubmits');

        await ReportLog.step('Build the ENS-IMMI declaration and let CDS reject the IMMI', async () => {
            await createDraftEnsDeclarationFlow
                .createDraftEnsDeclaration(ensImmiDeclaration(testInfo, immiRejectedByCds()));

            await consignmentOverviewFlow.goToConsignmentOverview();
            await consignmentOverviewFlow.submitConsignment();
            await movementOverviewFlow.waitForSubmittedMovementOverview();
            await movementOverviewFlow.verifyImmiConsignmentTraderInputRequired();
        });

        const immi = await declarationAccessFlow.locateImmiConsignmentRecords();

        // Both companies on the same records at the same moment - the Importer offered
        // the corrections the representing Agent is not. Its window is kept, because it
        // is about to use what it was just shown.
        const { importer } = await ReportLog.step('Measure what the Agent and the Importer may do', () =>
            checkAuthority(GENERATED_DECLARATION_AUTHORITY.rejectedConsignment, {
                what: 'the rejected IMMI',
                records: immi,
                tabs: IMMI_EIDR_DECLARATION_TABS,
                parties: ['agent', 'importer'],
                keepOpen: ['importer'],
            })
        );

        await ReportLog.step('The Importer corrects the UKIMS document and resubmits', async () => {
            // The correction undoes the lever exactly: the goods item's 1UKI goes back to
            // the importer's own UKIMS number.
            await importer!.declarations.openRecord(immi.goodsItem!);
            await importer!.goods.correctDocumentReference(importerUkimsDocument());

            await importer!.consignment.goToConsignmentOverview();
            await importer!.consignment.submitConsignment();

            // Status, not MRN - a rejected IMMI already carries one, as a rejected SFD does.
            await importer!.declarations
                .verifyCorrectionAcceptedByCds(immi.consignment, 'status.awaitingArrival');
        });
    });

    /**
     * The EIDR an ENS journey generates: everybody reads it, nobody may change it.
     *
     * The odd one of the three declarations, and worth saying plainly what this can and
     * cannot establish. Nobody holds Full on a generated EIDR (Trung, 2026-08-14), so
     * "this company is offered no actions" has an innocent explanation - the screen
     * offers nobody any - and no arrangement of parties rules it out. That half is a
     * privilege-escalation net: it fails if a company GAINS an action, which is the
     * direction that matters.
     *
     * The half that measures something is the refusal: an agent representing nobody is
     * shut out of the very record the represented parties are reading, same account,
     * seconds apart. Being able to look it up is the whole of what they are promised.
     *
     * No correction and no resubmission, because there is nothing anybody may correct.
     */
    test('Verify that the Agent and the Importer can read but not edit a generated EIDR', { tag: ['@auth', '@authorisation'] }, async ({
        createDraftEnsDeclarationFlow, consignmentOverviewFlow, movementOverviewFlow,
        declarationAccessFlow, checkAuthority,
    }, testInfo) => {
        await ReportLog.setStory('Everybody reads the generated EIDR, nobody may change it');

        await ReportLog.step('Build the ENS-EIDR declaration and submit it', async () => {
            await createDraftEnsDeclarationFlow
                .createDraftEnsDeclaration(ensEidrDeclaration(testInfo));

            await consignmentOverviewFlow.goToConsignmentOverview();
            await consignmentOverviewFlow.submitConsignment();
            await movementOverviewFlow.waitForSubmittedMovementOverview();
        });

        // No Trader Input Required gate here, unlike the tests above. A generated EIDR
        // transitions asynchronously and has been seen both at "Trader Input Required"
        // and at "Authorised" at this point, so pinning either would flake - and the
        // questions below do not depend on which it reached.
        const eidr = await declarationAccessFlow.locateEidrConsignmentRecords();

        const eidrCheck = {
            what: 'the generated EIDR',
            records: eidr,
            tabs: IMMI_EIDR_DECLARATION_TABS,
            unfalsifiableBecause:
                'no company may edit a generated EIDR, so no party on this row holds Full, '
                + 'and since 2026-08-19 none is refused it either - what is left catches a '
                + 'company gaining an action, not a screen that renders nothing',
        };

        await ReportLog.step('Measure what the Agent and the Importer may do', () =>
            checkAuthority(ENS_EIDR_AUTHORITY.generatedEidrConsignment, {
                ...eidrCheck, parties: ['agent', 'importer'],
            })
        );
    });
});

/**
 * Standalone declarations, which the trader submits directly rather than having the
 * service generate them from an ENS.
 *
 * A separate describe because the setup is different in the one way that matters: the
 * Agent REPRESENTS the Importer here. An integrated declaration stopped needing that on
 * 2026-08-19 and the Agent declares as itself; a standalone one is still made on the
 * importer's behalf from the first screen, so representation is still what the rules
 * here turn on.
 *
 * The rule they measure is also different in kind. An integrated declaration's access
 * follows the RECORD (who is the importer on it); a standalone one follows WHO CREATED
 * IT - an agent reaches a standalone declaration it made itself while acting for the
 * importer, and not one another agent made while acting for the same importer. Only the
 * first half of that is testable today: the second needs an Agent C that does not exist.
 */
test.describe('Standalone declaration authority - Agent represents the Importer', () => {
    test.use({ authProfile: COMPANY_PROFILE.AGENT });

    test.beforeEach(async ({ representTraderFlow }) => {
        await ReportLog.setFeature('Representation authority');
        await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);
    });

    /**
     * A standalone IMMI the Agent created while acting for the Importer.
     *
     * Rejected on purpose by the same UKIMS lever the ENS-IMMI test uses, for the same
     * reason: a consignment the service has finished with offers nobody an action, so
     * "this company may edit it" can only be told apart from "nobody may" while the
     * declaration is still waiting on the trader.
     */
    test('Verify that the Agent representing the Importer can correct and resubmit a rejected standalone IMMI', { tag: ['@auth', '@authorisation'] }, async ({
        createAndSubmitImmiStandaloneFlow, declarationAccessFlow, consignmentOverviewFlow,
        goodsOverviewFlow, representTraderFlow, checkAuthority,
    }, testInfo) => {
        await ReportLog.setStory('Standalone IMMI - the creating agent corrects it and puts it back in');

        await createAndSubmitImmiStandaloneFlow.completeImmiStandaloneFlow({
            testInfo,
            url: BASE_URL,
            consignmentOverrides: {
                typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
                representationType: REPRESENTATION_TYPE.DIRECT,
            },
            goodsItemOverrides: immiStandaloneGoodsItem(immiStandaloneRejectedByCds()),
            expectedStatusKey: 'status.traderInputRequired',
        });

        // Submitting leaves the browser on the consignment overview, which is the record
        // itself here - a standalone declaration has no movement above it.
        const immi = await declarationAccessFlow.locateRecordsHere();

        const immiCheck = {
            what: 'the rejected standalone IMMI',
            records: immi,
            tabs: IMMI_EIDR_DECLARATION_TABS,
        };

        await ReportLog.step('Measure what the representing Agent and the Importer may do', () =>
            checkAuthority(STANDALONE_AUTHORITY.createdByThisAgent, {
                ...immiCheck, parties: ['agentAsImporter', 'importer'],
            })
        );

        await ReportLog.step('Measure what the same account may do representing nobody', async () => {
            // The half that needs no lever to mean something: the same account, no longer
            // acting for anybody, is refused the declaration it just made.
            await representTraderFlow.stopRepresenting();
            await checkAuthority(STANDALONE_AUTHORITY.createdByThisAgent, {
                ...immiCheck, parties: ['agentNotRepresenting'],
            });
        });

        await ReportLog.step('Declare the missing transport document and resubmit', async () => {
            // Everything above only observed a screen. Full is a claim about the service
            // ACCEPTING a change, so the agent goes on to make one: the correction undoes
            // the lever exactly, declaring the transport document it left out.
            //
            // Representing again first, because the refusal check above gave it up - and a
            // company the service will not show the record to cannot correct it either.
            await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);

            await declarationAccessFlow.openRecord(immi.goodsItem!);
            await goodsOverviewFlow.declareDocumentReferences([immiStandaloneTransportDocument()]);

            await consignmentOverviewFlow.goToConsignmentOverview();
            await consignmentOverviewFlow.submitConsignment();

            // Status, not MRN: a rejected standalone already carries one, so an MRN here
            // would prove nothing. Leaving "Trader Input Required" says CDS took it.
            await declarationAccessFlow
                .verifyCorrectionAcceptedByCds(immi.consignment, 'status.awaitingArrival');
        });
    });

    /**
     * The Importer corrects the standalone IMMI from its OWN login.
     *
     * The counterpart of the test above, and the reason both exist: Full can be reached
     * two ways - by the company itself, or by an agent representing it - and only one of
     * them depends on representation working at all.
     *
     * A declaration of its own, not a second correction of the one above: a rejection can
     * be corrected once, so the two routes cannot share a record however alike they look.
     *
     * The Agent still CREATES it, because that is the situation the rule is about - a
     * standalone declaration made on the importer's behalf, not one the importer made.
     */
    test('Verify that the Importer, on its own login, can correct and resubmit a rejected standalone IMMI the Agent created for it', { tag: ['@auth', '@authorisation'] }, async ({
        createAndSubmitImmiStandaloneFlow, declarationAccessFlow, checkAuthority,
    }, testInfo) => {
        await ReportLog.setStory('Standalone IMMI - the importer corrects it on its own login');

        await createAndSubmitImmiStandaloneFlow.completeImmiStandaloneFlow({
            testInfo,
            url: BASE_URL,
            consignmentOverrides: {
                typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
                representationType: REPRESENTATION_TYPE.DIRECT,
            },
            goodsItemOverrides: immiStandaloneGoodsItem(immiStandaloneRejectedByCds()),
            expectedStatusKey: 'status.traderInputRequired',
        });

        const immi = await declarationAccessFlow.locateRecordsHere();

        // The window is kept: the Importer is about to use what it was just shown.
        const { importer } = await ReportLog.step('Measure what the Importer may do on its own login', () =>
            checkAuthority(STANDALONE_AUTHORITY.createdByThisAgent, {
                what: 'the rejected standalone IMMI',
                records: immi,
                tabs: IMMI_EIDR_DECLARATION_TABS,
                parties: ['importer'],
                keepOpen: ['importer'],
            })
        );

        await ReportLog.step('The Importer declares the missing transport document and resubmits', async () => {
            // A level deeper than a consignment correction: an IMMI is refused over its
            // GOODS ITEM documents, so the second session works in that item's tabs.
            await importer!.declarations.openRecord(immi.goodsItem!);
            await importer!.goods.declareDocumentReferences([immiStandaloneTransportDocument()]);

            await importer!.consignment.goToConsignmentOverview();
            await importer!.consignment.submitConsignment();

            await importer!.declarations
                .verifyCorrectionAcceptedByCds(immi.consignment, 'status.awaitingArrival');
        });
    });

    /**
     * EXPECTED RED on "Consignment LRN", and deliberately left that way.
     *
     * A controlled-goods SFD overview renders no LRN row at all (defect 1239), so the
     * journey's own draft check reads "" and soft-fails. The same failure appears in the
     * SFD standalone JOURNEY spec - it is the product, not this test.
     *
     * It could be stepped around now that the assertion lives in the flow rather than
     * the page, and that was considered and REJECTED (Trung, 2026-08-14): a defect that
     * no longer shows anywhere is a defect nobody fixes. Everything after that line
     * passes - the lever rejects, and all three parties answer as the table says.
     *
     * A standalone SFD, refused by the OTHER lever.
     *
     * An SFD standalone goods item declares no UKIMS document to break, so the rejection
     * is arranged on the consignment instead - a holder of authorisation naming a party
     * that does not hold it, which is the ENS-SFD lever and the same underlying rule.
     */
    test('Verify that the Agent representing the Importer can correct and resubmit a rejected standalone SFD', { tag: ['@auth', '@authorisation'] }, async ({
        createAndSubmitSfdStandaloneFlow, declarationAccessFlow, consignmentOverviewFlow,
        representTraderFlow, checkAuthority,
    }, testInfo) => {
        await ReportLog.setStory('Standalone SFD - the creating agent corrects it and puts it back in');

        await createAndSubmitSfdStandaloneFlow.completeSfdStandaloneFlow({
            testInfo,
            url: BASE_URL,
            consignmentOverrides: {
                isControlledGoods: true,
                holdersOfAuthorisation: [sfdStandaloneRejectedByCds()],
            },
            goodsItemOverrides: sfdStandaloneGoodsItem(),
            expectedStatusKey: 'status.traderInputRequired',
        });

        const sfd = await declarationAccessFlow.locateRecordsHere();

        // No tab override: an SFD carries all nine goods-item tabs, unlike an IMMI.
        const sfdCheck = { what: 'the rejected standalone SFD', records: sfd };

        await ReportLog.step('Measure what the representing Agent and the Importer may do', () =>
            checkAuthority(STANDALONE_AUTHORITY.createdByThisAgent, {
                ...sfdCheck, parties: ['agentAsImporter', 'importer'],
            })
        );

        await ReportLog.step('Measure what the same account may do representing nobody', async () => {
            await representTraderFlow.stopRepresenting();
            await checkAuthority(STANDALONE_AUTHORITY.createdByThisAgent, {
                ...sfdCheck, parties: ['agentNotRepresenting'],
            });
        });

        await ReportLog.step('Remove the authorisation that does not belong and resubmit', async () => {
            // Representing again first, because the refusal check above gave it up.
            await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);

            // The Excise Warehouse authorisation is not a wrong value to edit - it is a
            // record the declaration should never have carried, so this removes it.
            await declarationAccessFlow.openRecord(sfd.consignment);
            await consignmentOverviewFlow.removeHolderOfAuthorisation(
                AUTHORISATION_TYPE_CODE.EXCISE_WAREHOUSE_EXW
            );

            await consignmentOverviewFlow.goToConsignmentOverview();
            await consignmentOverviewFlow.submitConsignment();

            await declarationAccessFlow
                .verifyCorrectionAcceptedByCds(sfd.consignment, 'status.awaitingArrival');
        });
    });

    /**
     * The Importer corrects the standalone SFD from its OWN login - the counterpart of
     * the test above, for the same reason the IMMI pair exists.
     *
     * A declaration of its own: a rejection can be corrected once, so the agent's route
     * and the company's route cannot share a record.
     *
     * Carries the same EXPECTED RED on "Consignment LRN" as the test above (defect 1239),
     * for the same reason and deliberately.
     */
    test('Verify that the Importer, on its own login, can correct and resubmit a rejected standalone SFD the Agent created for it', { tag: ['@auth', '@authorisation'] }, async ({
        createAndSubmitSfdStandaloneFlow, declarationAccessFlow, checkAuthority,
    }, testInfo) => {
        await ReportLog.setStory('Standalone SFD - the importer corrects it on its own login');

        await createAndSubmitSfdStandaloneFlow.completeSfdStandaloneFlow({
            testInfo,
            url: BASE_URL,
            consignmentOverrides: {
                isControlledGoods: true,
                holdersOfAuthorisation: [sfdStandaloneRejectedByCds()],
            },
            goodsItemOverrides: sfdStandaloneGoodsItem(),
            expectedStatusKey: 'status.traderInputRequired',
        });

        const sfd = await declarationAccessFlow.locateRecordsHere();

        const { importer } = await ReportLog.step('Measure what the Importer may do on its own login', () =>
            checkAuthority(STANDALONE_AUTHORITY.createdByThisAgent, {
                what: 'the rejected standalone SFD',
                records: sfd,
                parties: ['importer'],
                keepOpen: ['importer'],
            })
        );

        await ReportLog.step('The Importer removes the authorisation and resubmits', async () => {
            await importer!.declarations.openRecord(sfd.consignment);
            await importer!.consignment.removeHolderOfAuthorisation(
                AUTHORISATION_TYPE_CODE.EXCISE_WAREHOUSE_EXW
            );

            await importer!.consignment.goToConsignmentOverview();
            await importer!.consignment.submitConsignment();

            await importer!.declarations
                .verifyCorrectionAcceptedByCds(sfd.consignment, 'status.awaitingArrival');
        });
    });

    /**
     * A standalone EIDR - the same journey as the SFD above with uncontrolled goods.
     *
     * No lever, because there is nothing to arrange: an EIDR is authorised outright and
     * never waits on the trader, so it has no state in which the service offers anybody
     * an action. What can still fail for the right reason is the refusal - the account
     * that made it is shut out the moment it stops acting for the importer.
     */
    test('Verify that the Agent representing the Importer and the Importer can read but not edit an authorised standalone EIDR', { tag: ['@auth', '@authorisation'] }, async ({
        createAndSubmitSfdStandaloneFlow, declarationAccessFlow,
        representTraderFlow, checkAuthority,
    }, testInfo) => {
        await ReportLog.setStory('Standalone EIDR - everybody reads it, nobody may change it');

        await createAndSubmitSfdStandaloneFlow.completeSfdStandaloneFlow({
            testInfo,
            url: BASE_URL,
            // Uncontrolled goods is the whole difference: it is what the service answers
            // with an EIDR rather than an SFD.
            consignmentOverrides: { isControlledGoods: false },
            goodsItemOverrides: sfdStandaloneGoodsItem(),
        });

        const eidr = await declarationAccessFlow.locateRecordsHere();

        const eidrCheck = {
            what: 'the standalone EIDR',
            records: eidr,
            tabs: IMMI_EIDR_DECLARATION_TABS,
            recordActions: [CONSIGNMENT_ACTION.CANCEL_WITH_CONFIRMATION],
        };

        await checkAuthority(STANDALONE_AUTHORITY.createdByThisAgent, {
            ...eidrCheck, parties: ['agentAsImporter', 'importer'],
        });

        await representTraderFlow.stopRepresenting();
        await checkAuthority(STANDALONE_AUTHORITY.createdByThisAgent, {
            ...eidrCheck, parties: ['agentNotRepresenting'],
        });
    });


    test('Verify that an Agent company cannot reach a draft standalone declaration created by a different Agent company', { tag: ['@auth', '@authorisation'] }, async ({
        createDraftSfdStandaloneFlow, declarationAccessFlow, checkAuthority,
    }, testInfo) => {
        test.skip(
            !isProvisioned(COMPANY_PROFILE.AGENT_B),
            'No AGENT_B login in this environment - see defaultAuthProfiles in src/auth/credentials.ts'
        );
        await ReportLog.setStory('Standalone draft - a second agent company reaches nothing of it');

        const { consignmentReference } = await createDraftSfdStandaloneFlow.createDraftSfdStandalone({
            testInfo,
            url: BASE_URL,
            consignmentOverrides: { isControlledGoods: true },
            goodsItemOverrides: sfdStandaloneGoodsItem(),
        });

        const draft = await declarationAccessFlow.locateRecordsHere();

        await checkAuthority(STANDALONE_AUTHORITY.createdByThisAgent, {
            what: 'the draft standalone SFD',
            records: draft,
            reference: consignmentReference,
            parties: ['agentAsImporter', 'anotherAgent'],
        });
    });
});
