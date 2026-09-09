import { COMPANY_PROFILE, isProfileConfigured } from '../../../src/auth/credentials';
import {
    BASE_URL, IMPORTER_COMPANY_NAME, HAULIER_COMPANY_NAME, IS_ISC2_MOCK,
} from '../../../config/environment';
import { TYPE_OF_MOVEMENT_OPTION_CODE } from '../../../src/constant/type-of-movement-code-constant';
import { documentReference } from '../../../src/test-data/document-reference-data';
import { DOCUMENT_CODE } from '../../../src/constant/document-code-constant';
import { DOCUMENT_STATUS } from '../../../src/constant/document-status-constant';
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
    MOVEMENT_GMR_AUTHORITY,
    REPRESENTED_HAULIER_AUTHORITY,
} from '../../../src/test-data/authority-matrix';
import {
    IMMI_EIDR_DECLARATION_TABS, GMR_TABS, MOVEMENT_TABS,
} from '../../../src/constant/record-tab-constant';
import { MOVEMENT_ACTION } from '../../../src/constant/movement-action-constant';
import { ROUTE_ID_CONSTANT } from '../../../src/constant/routeId-constant';
import { gmrData } from '../../../src/test-data/gmr-data';
import { CONSIGNMENT_ACTION } from '../../../src/constant/consignment-action-constant';
import { holderOfAuthorisation } from '../../../src/test-data/holder-of-authorisation-data';
import { AUTHORISATION_TYPE_CODE } from '../../../src/constant/authorisation-type-code-constant';
import { checkRefusedOnceRepresentationEnds } from '../../../src/flows/authority-check-flow';
import { test } from '../../test-hooks';


test.describe('ENS Integrated declaration authority - Agent declares as itself', () => {
    test.use({ authProfile: COMPANY_PROFILE.AGENT });

    test.beforeEach(async () => {
        await ReportLog.setFeature('Representation authority');
    });

    /**
     * The draft half of the authority question, asked on its own.
     *
     * Split from the rejection test below because the two need different things of the
     * environment: a draft can be raised anywhere, while a rejection can only come from
     * an ICS2 that refuses the movement. Kept together, the half that cannot run on a
     * mocked environment took the half that can down with it - or worse, the test
     * returned early and reported green having measured half of what it names.
     */
    test('Verify that the Agent and the Importer are offered the right actions on a draft ENS consignment', { tag: ['@auth', '@authorisation'] }, async ({
        createDraftEnsDeclarationFlow, declarationAccessFlow, checkAuthorityFlow,
    }, testInfo) => {
        await ReportLog.setStory('Agent on its own account - what a draft offers');

        const draft = await ReportLog.step('Agent declares an ENS consignment and leaves it in draft', () =>
            createDraftEnsDeclarationFlow
                .createDraftEnsDeclaration(ensOnlyDeclaration(testInfo, rejectedByIcs2()))
        );

        await ReportLog.step('Agent and Importer on the draft consignment - check what each is offered', async () => {
            // A draft asks less than a rejection does: the question is only whether a
            // company may submit it, cancel it, and add records to it.
            const draftUrl = await declarationAccessFlow
                .openDeclarationFromSearch(draft.consignmentReference);
            const draftRecords = await declarationAccessFlow.locateRecordsAt(draftUrl);

            await checkAuthorityFlow(ENS_ONLY_AUTHORITY.draftConsignment, {
                what: 'the draft consignment',
                records: draftRecords,
                reference: draft.consignmentReference,
                parties: ['agent', 'importer'],
            });

            const draftMovement = await declarationAccessFlow.locateMovementHeader();
            await checkAuthorityFlow(ENS_ONLY_AUTHORITY.draftMovement, {
                what: 'the draft movement header',
                records: draftMovement,
                tabs: MOVEMENT_TABS,
                recordActions: [MOVEMENT_ACTION.CANCEL_DECLARATION],
            });
        });

    });

    test('Verify that the Agent, on its own account, can correct and resubmit its rejected ENS consignment', { tag: ['@auth', '@authorisation'] }, async ({
        createDraftEnsDeclarationFlow, consignmentOverviewFlow, movementOverviewFlow,
        declarationAccessFlow, representTraderFlow, checkAuthorityFlow,
    }, testInfo) => {
        // This test starts from a REJECTED consignment, and only ICS2 refusing the
        // movement produces one. A mock ICS2 authorises it instead, so "Trader Input
        // Required" is unreachable and there would be nothing to correct - a red saying
        // nothing about authority. The draft half of the same question is the test
        // above, which is why skipping here costs no coverage.
        test.skip(IS_ISC2_MOCK, 'A mock ICS2 authorises the movement, so no rejection can be produced');

        await ReportLog.setStory('Agent on its own account - reach, reject, correct, resubmit');

        const draft = await ReportLog.step('Agent declares an ENS consignment and leaves it in draft', () =>
            createDraftEnsDeclarationFlow
                .createDraftEnsDeclaration(ensOnlyDeclaration(testInfo, rejectedByIcs2()))
        );

        let rejected: Awaited<ReturnType<typeof declarationAccessFlow.locateEnsConsignmentRecords>> | undefined;

        await ReportLog.step('Agent submits it and ICS2 hands it back - expect Trader Input Required', async () => {
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
        await ReportLog.step('Agent and Importer on the rejected consignment - check what each is offered', async () => {
            const rejectedMovement = await declarationAccessFlow.locateMovementHeader();
            await checkAuthorityFlow(ENS_ONLY_AUTHORITY.rejectedMovement, {
                what: 'the movement header of the rejected consignment',
                records: rejectedMovement,
                tabs: MOVEMENT_TABS,
                // Cancel only. recordActions is also what every TAB must offer, and
                // "New consignment" belongs to the first tab alone - the SFD, IMMI and
                // EIDR lists are generated by the service. MOVEMENT_TABS asserts it on
                // the two tabs that do carry it.
                recordActions: [MOVEMENT_ACTION.CANCEL_DECLARATION],
            });

            rejected = await declarationAccessFlow.locateEnsConsignmentRecords();
            await checkAuthorityFlow(ENS_ONLY_AUTHORITY.rejectedConsignment, {
                what: 'the rejected consignment',
                records: rejected,
                parties: ['agent', 'importer'],
            });
        });

        await ReportLog.step('The same account representing the Importer - check representing costs it the ENS', async () => {
            // Representation REPLACES the account it acts for rather than adding to it:
            // while acting for the Importer this browser sees what the Importer sees, and
            // the Importer is shown nothing of an ENS - not even the one this very account
            // submitted. Measured 2026-09-02, correcting the opposite guess.
            await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);
            await checkAuthorityFlow(ENS_ONLY_AUTHORITY.rejectedConsignment, {
                what: 'the rejected consignment',
                records: rejected!,
                parties: ['agentAsImporter'],
            });

            // Handed back as itself, because the correction below is the submitter's.
            await representTraderFlow.stopRepresenting();

            // And put back ON the record. The check above ends on "You are not authorised
            // to access this", which carries no breadcrumb - so the correction below could
            // not walk up to the consignment overview and spent 15s looking for a link that
            // a refusal page never has. Giving the representation up restores the right,
            // not the page.
            await declarationAccessFlow.openRecord(rejected!.consignment);
        });

        await ReportLog.step('Agent corrects the container and resubmits - expect the service to accept it', async () => {
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
     * The SUBMITTER rule: the SFD is generated from an ENS this Agent submitted, so the
     * Agent holds Full over it on its own account - representing the importer it was
     * declared FOR neither grants that nor takes it away. Until 2026-09-01 the service
     * answered the other way and this test measured the contrast; now it measures that
     * there is none, which is a different claim and every bit as falsifiable.
     *
     * Both halves still live in ONE test because they are the same record in the same
     * state: splitting them would build a second rejected SFD only to ask the other half
     * of the question. This Agent account holds grants from BOTH companies, so the
     * comparison is the same account, the same browser, the same record, seconds apart -
     * nothing but the representation changed.
     *
     * Then the right is EXERCISED where the rule now puts it: representation is given up
     * first, and the Agent corrects and resubmits as itself. Observing Full and using it
     * are different claims, and the second is the one a trader would notice.
     */
    test('Verify that the Agent that submitted the ENS can correct and resubmit the rejected SFD on its own account', { tag: ['@auth', '@authorisation'] }, async ({
        createDraftEnsDeclarationFlow, consignmentOverviewFlow, movementOverviewFlow,
        declarationAccessFlow, representTraderFlow, checkAuthorityFlow,
    }, testInfo) => {
        await ReportLog.setStory('The Agent that submitted the ENS corrects the rejected SFD as itself');

        await ReportLog.step('Agent declares an ENS-SFD and submits it - expect CDS to reject the SFD', async () => {
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

        await ReportLog.step('Agent on its own account - check the submitter is offered every change to the rejected SFD', () =>
            // One party at a time, because the Agent can only represent one company at
            // once - which is the whole point of this test rather than an inconvenience.
            checkAuthorityFlow(GENERATED_DECLARATION_AUTHORITY.rejectedConsignment, {
                ...sfdCheck, parties: ['agent'],
            })
        );

        await ReportLog.step('The same account now representing the Importer - check representing changes nothing', async () => {
            await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);
            await checkAuthorityFlow(GENERATED_DECLARATION_AUTHORITY.rejectedConsignment, {
                ...sfdCheck, parties: ['agentAsImporter'],
            });
        });

        await ReportLog.step('Agent on its own account corrects the authorisation - expect CDS to accept it', async () => {
            // Representation is given up first, so what follows is the SUBMITTER using its
            // own right rather than the importer's borrowed one. Leaving it on would make
            // this step pass under the old rule as well, and prove nothing about the new.
            await representTraderFlow.stopRepresenting();

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
        declarationAccessFlow, checkAuthorityFlow,
    }, testInfo) => {
        await ReportLog.setStory('Importer corrects the holder of authorisation and resubmits');

        await ReportLog.step('Agent declares an ENS-SFD and submits it - expect CDS to reject the SFD', async () => {
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
        const { importer } = await ReportLog.step('Importer on its own login - check what it is offered on the record the Agent declared', () =>
            checkAuthorityFlow(GENERATED_DECLARATION_AUTHORITY.rejectedConsignment, {
                what: 'the rejected SFD',
                records: sfd,
                parties: ['importer'],
                keepOpen: ['importer'],
            })
        );

        await ReportLog.step('Importer corrects the authorisation on its own login - expect CDS to accept it', async () => {
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
     *
     * The submitter rule was measured on the SFD, and the two journeys share one row of
     * the table - so on this journey it is a prediction until this test runs green. That
     * is the whole reason both exist.
     */
    test('Verify that the Agent that submitted the ENS can correct and resubmit the rejected IMMI on its own account', { tag: ['@auth', '@authorisation'] }, async ({
        createDraftEnsDeclarationFlow, consignmentOverviewFlow, movementOverviewFlow,
        declarationAccessFlow, representTraderFlow, goodsOverviewFlow, checkAuthorityFlow,
    }, testInfo) => {
        await ReportLog.setStory('The Agent that submitted the ENS corrects the rejected IMMI as itself');

        await ReportLog.step('Agent declares an ENS-IMMI and submits it - expect CDS to reject the IMMI', async () => {
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

        await ReportLog.step('Agent on its own account and Importer on its own login - check what each is offered', () =>
            checkAuthorityFlow(GENERATED_DECLARATION_AUTHORITY.rejectedConsignment, {
                ...immiCheck, parties: ['agent', 'importer'],
            })
        );

        await ReportLog.step('The same account now representing the Importer - check representing changes nothing', async () => {
            // From the Agent's own browser, switched to represent the Importer: under the
            // submitter rule this account already held Full, so what is being asked here is
            // that taking on a representation does not COST it anything.
            await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);
            await checkAuthorityFlow(GENERATED_DECLARATION_AUTHORITY.rejectedConsignment, {
                ...immiCheck, parties: ['agentAsImporter'],
            });
        });

        await ReportLog.step('Agent on its own account corrects the UKIMS document - expect CDS to accept it', async () => {
            // Representation given up first, for the reason the SFD test gives: this step
            // exists to exercise the SUBMITTER's own right, and it would pass under the
            // old rule too if the importer's were still being borrowed.
            await representTraderFlow.stopRepresenting();

            // The correction undoes the lever exactly: the goods item's 1UKI goes back to
            // the importer's own UKIMS number. The reads left the browser on the goods
            // item, which is where that record lives.
            await declarationAccessFlow.openRecord(immi.goodsItem!); // NOSONAR - strictNullChecks makes this required; Sonar analyses without our tsconfig.
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
        declarationAccessFlow, checkAuthorityFlow,
    }, testInfo) => {
        await ReportLog.setStory('Importer corrects the UKIMS on a rejected IMMI and resubmits');

        await ReportLog.step('Agent declares an ENS-IMMI and submits it - expect CDS to reject the IMMI', async () => {
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
        const { importer } = await ReportLog.step('Agent on its own account and Importer on its own login - check what each is offered', () =>
            checkAuthorityFlow(GENERATED_DECLARATION_AUTHORITY.rejectedConsignment, {
                what: 'the rejected IMMI',
                records: immi,
                tabs: IMMI_EIDR_DECLARATION_TABS,
                parties: ['agent', 'importer'],
                keepOpen: ['importer'],
            })
        );

        await ReportLog.step('Importer corrects the UKIMS document on its own login - expect CDS to accept it', async () => {
            // The correction undoes the lever exactly: the goods item's 1UKI goes back to
            // the importer's own UKIMS number.
            await importer!.declarations.openRecord(immi.goodsItem!); // NOSONAR - strictNullChecks makes this required; Sonar analyses without our tsconfig.
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
     * cannot establish. Nobody holds Full on a generated EIDR, so
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
        declarationAccessFlow, representTraderFlow, checkAuthorityFlow,
    }, testInfo) => {
        await ReportLog.setStory('Everybody reads the generated EIDR, nobody may change it');

        await ReportLog.step('Agent declares an ENS-EIDR and submits it', async () => {
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

        await ReportLog.step('Agent on its own account and Importer on its own login - check what each is offered', () =>
            checkAuthorityFlow(ENS_EIDR_AUTHORITY.generatedEidrConsignment, {
                ...eidrCheck, parties: ['agent', 'importer'],
            })
        );

        await ReportLog.step('The same account representing the Importer - check the EIDR stays read-only', async () => {
            // The submitter rule reaches every other generated declaration; this asks
            // that it does not reach this one from the representation side either.
            await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);
            await checkAuthorityFlow(ENS_EIDR_AUTHORITY.generatedEidrConsignment, {
                ...eidrCheck, parties: ['agentAsImporter'],
            });
        });
    });

    /**
     * The GMR on a movement the Agent made as itself.
     *
     * The counterpart of the haulier GMR test below, and the only place the Importer
     * is asked about a GMR at all. Its own test for the same reason: a service that
     * refuses to create a GMR here should cost a GMR result, not a declaration one.
     */
    test('Verify that the Agent that made the movement holds its GMR, and the Importer may only read it', { tag: ['@auth', '@authorisation'] }, async ({
        createAndSubmitEnsDeclarationFlow, createAndSubmitGmrFlow,
        declarationAccessFlow, checkAuthorityFlow,
    }, testInfo) => {
        await ReportLog.setStory('The GMR belongs to the account that made the movement');

        await ReportLog.step('Agent declares an ENS-SFD and gets it accepted', async () => {
            // The journey flow, accepted rather than rejected - see the haulier GMR test
            // for why a GMR needs an SFD at "Awaiting arrival".
            await createAndSubmitEnsDeclarationFlow.completeEnsDeclarationFlow({
                testInfo,
                url: BASE_URL,
                movementOverrides: {
                    typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
                },
                goodsItemOverrides: {
                    documentReferences: [
                        documentReference({
                            documentCode: DOCUMENT_CODE.C672,
                            documentStatus: DOCUMENT_STATUS.AC,
                            documentReference: '0054037-0054047',
                        }),
                    ],
                },
            });
        });

        await ReportLog.step('Agent creates and submits a GMR for that movement', () =>
            createAndSubmitGmrFlow.addNewGmrAndSubmit(gmrData({
                route_id: ROUTE_ID_CONSTANT.GB_TO_NI.CAIRNRYAN_LARNE_FERRIES,
                external_contacts_list: ['adam1.taylor@nifreight.co.uk'],
            }))
        );

        const gmr = await declarationAccessFlow.locateGmrRecord();
        const gmrCheck = {
            what: 'the GMR the Agent made',
            records: gmr,
            tabs: GMR_TABS,
            recordActions: [],
        };

        await ReportLog.step('Agent on its own account and Importer on its own login - check what each is offered', () =>
            checkAuthorityFlow(MOVEMENT_GMR_AUTHORITY.gmr, {
                ...gmrCheck, parties: ['agent', 'importer'],
            })
        );

        // No agentAsImporter here. An agent acting for a company holds what that
        // company holds, so asking both forms of the Importer twice measures the rule
        // twice - the GMR made for the Haulier asks the representation instead.
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
        goodsOverviewFlow, representTraderFlow, checkAuthorityFlow,
    }, testInfo) => {
        await ReportLog.setStory('Standalone IMMI - the creating agent corrects it and puts it back in');

        const immi = await ReportLog.step('Agent representing the Importer declares a standalone IMMI - expect CDS to reject it', async () => {
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

            // Submitting leaves the browser on the consignment overview, which is the
            // record itself here - a standalone declaration has no movement above it.
            return declarationAccessFlow.locateRecordsHere();
        });

        const immiCheck = {
            what: 'the rejected standalone IMMI',
            records: immi,
            tabs: IMMI_EIDR_DECLARATION_TABS,
        };

        await ReportLog.step('Agent representing the Importer and Importer on its own login - check what each is offered', () =>
            checkAuthorityFlow(STANDALONE_AUTHORITY.createdByThisAgent, {
                ...immiCheck, parties: ['agentAsImporter', 'importer'],
            })
        );

        await checkRefusedOnceRepresentationEnds(
            representTraderFlow, checkAuthorityFlow, STANDALONE_AUTHORITY.createdByThisAgent, immiCheck,
            'it is refused the record it just made',
        );

        await ReportLog.step('Agent representing the Importer declares the missing transport document - expect CDS to accept it', async () => {
            // Everything above only observed a screen. Full is a claim about the service
            // ACCEPTING a change, so the agent goes on to make one: the correction undoes
            // the lever exactly, declaring the transport document it left out.
            //
            // Representing again first, because the refusal check above gave it up - and a
            // company the service will not show the record to cannot correct it either.
            await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);

            await declarationAccessFlow.openRecord(immi.goodsItem!); // NOSONAR - strictNullChecks makes this required; Sonar analyses without our tsconfig.
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
        createAndSubmitImmiStandaloneFlow, declarationAccessFlow, checkAuthorityFlow,
    }, testInfo) => {
        await ReportLog.setStory('Standalone IMMI - the importer corrects it on its own login');

        const immi = await ReportLog.step('Agent representing the Importer declares a standalone IMMI - expect CDS to reject it', async () => {
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

            return declarationAccessFlow.locateRecordsHere();
        });

        // The window is kept: the Importer is about to use what it was just shown.
        const { importer } = await ReportLog.step('Importer on its own login - check what it is offered on the record the Agent declared', () =>
            checkAuthorityFlow(STANDALONE_AUTHORITY.createdByThisAgent, {
                what: 'the rejected standalone IMMI',
                records: immi,
                tabs: IMMI_EIDR_DECLARATION_TABS,
                parties: ['importer'],
                keepOpen: ['importer'],
            })
        );

        await ReportLog.step('Importer declares the missing transport document on its own login - expect CDS to accept it', async () => {
            // A level deeper than a consignment correction: an IMMI is refused over its
            // GOODS ITEM documents, so the second session works in that item's tabs.
            await importer!.declarations.openRecord(immi.goodsItem!); // NOSONAR - strictNullChecks makes this required; Sonar analyses without our tsconfig.
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
     * the page, and that was considered and REJECTED (2026-08-14): a defect that
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
        representTraderFlow, checkAuthorityFlow,
    }, testInfo) => {
        await ReportLog.setStory('Standalone SFD - the creating agent corrects it and puts it back in');

        const sfd = await ReportLog.step('Agent representing the Importer declares a standalone SFD - expect CDS to reject it', async () => {
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

            return declarationAccessFlow.locateRecordsHere();
        });

        // No tab override: an SFD carries all nine goods-item tabs, unlike an IMMI.
        const sfdCheck = { what: 'the rejected standalone SFD', records: sfd };

        await ReportLog.step('Agent representing the Importer and Importer on its own login - check what each is offered', () =>
            checkAuthorityFlow(STANDALONE_AUTHORITY.createdByThisAgent, {
                ...sfdCheck, parties: ['agentAsImporter', 'importer'],
            })
        );

        await checkRefusedOnceRepresentationEnds(
            representTraderFlow, checkAuthorityFlow, STANDALONE_AUTHORITY.createdByThisAgent, sfdCheck,
            'it is refused the record it just made',
        );

        await ReportLog.step('Agent representing the Importer removes the authorisation - expect CDS to accept it', async () => {
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
        createAndSubmitSfdStandaloneFlow, declarationAccessFlow, checkAuthorityFlow,
    }, testInfo) => {
        await ReportLog.setStory('Standalone SFD - the importer corrects it on its own login');

        const sfd = await ReportLog.step('Agent representing the Importer declares a standalone SFD - expect CDS to reject it', async () => {
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

            return declarationAccessFlow.locateRecordsHere();
        });

        const { importer } = await ReportLog.step('Importer on its own login - check what it is offered on the record the Agent declared', () =>
            checkAuthorityFlow(STANDALONE_AUTHORITY.createdByThisAgent, {
                what: 'the rejected standalone SFD',
                records: sfd,
                parties: ['importer'],
                keepOpen: ['importer'],
            })
        );

        await ReportLog.step('Importer removes the authorisation on its own login - expect CDS to accept it', async () => {
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
        representTraderFlow, checkAuthorityFlow,
    }, testInfo) => {
        await ReportLog.setStory('Standalone EIDR - everybody reads it, nobody may change it');

        const eidr = await ReportLog.step('Agent representing the Importer declares uncontrolled goods - expect an EIDR back', async () => {
            await createAndSubmitSfdStandaloneFlow.completeSfdStandaloneFlow({
                testInfo,
                url: BASE_URL,
                // Uncontrolled goods is the whole difference: it is what the service
                // answers with an EIDR rather than an SFD.
                consignmentOverrides: { isControlledGoods: false },
                goodsItemOverrides: sfdStandaloneGoodsItem(),
            });

            return declarationAccessFlow.locateRecordsHere();
        });

        const eidrCheck = {
            what: 'the standalone EIDR',
            records: eidr,
            tabs: IMMI_EIDR_DECLARATION_TABS,
            recordActions: [CONSIGNMENT_ACTION.CANCEL_WITH_CONFIRMATION],
        };

        await ReportLog.step('Agent representing the Importer and Importer on its own login - check what each is offered', () =>
            checkAuthorityFlow(STANDALONE_AUTHORITY.createdByThisAgent, {
                ...eidrCheck, parties: ['agentAsImporter', 'importer'],
            })
        );

        await checkRefusedOnceRepresentationEnds(
            representTraderFlow, checkAuthorityFlow, STANDALONE_AUTHORITY.createdByThisAgent, eidrCheck,
            'it is refused the record it just made',
        );
    });


    test('Verify that an Agent company cannot reach a draft standalone declaration created by a different Agent company', { tag: ['@auth', '@authorisation'] }, async ({
        createDraftSfdStandaloneFlow, declarationAccessFlow, checkAuthorityFlow,
    }, testInfo) => {
        test.skip(
            !isProfileConfigured(COMPANY_PROFILE.AGENT_B),
            'No AGENT_B login in this environment - see defaultAuthProfiles in src/auth/credentials.ts'
        );
        await ReportLog.setStory('Standalone draft - a second agent company reaches nothing of it');

        const draft = await ReportLog.step('Agent representing the Importer leaves a standalone SFD in draft', async () => {
            const { consignmentReference } = await createDraftSfdStandaloneFlow.createDraftSfdStandalone({
                testInfo,
                url: BASE_URL,
                consignmentOverrides: { isControlledGoods: true },
                goodsItemOverrides: sfdStandaloneGoodsItem(),
            });

            return { consignmentReference, records: await declarationAccessFlow.locateRecordsHere() };
        });

        await ReportLog.step('The Agent that created it and a second Agent company - check only the creator reaches it', () =>
            checkAuthorityFlow(STANDALONE_AUTHORITY.createdByThisAgent, {
                what: 'the draft standalone SFD',
                records: draft.records,
                reference: draft.consignmentReference,
                parties: ['agentAsImporter', 'anotherAgent'],
            })
        );
    });
});

/**
 * The Agent declares an ENS-SFD while REPRESENTING THE HAULIER.
 *
 * The journey specs no longer do this - an integrated declaration is made by the Agent as
 * itself (2026-08-19) - so representing a haulier survives here, where it is the thing
 * being measured rather than a step on the way to something else.
 *
 * One test, three states of one account: representing the Haulier, the Haulier on its own
 * login, and the same Agent after giving the representation up. The contrast is the
 * point, so splitting it would mean building three rejected declarations to compare
 * answers that must be seconds apart on the same record.
 */
test.describe('ENS Integrated declaration authority - Agent represents the Haulier', () => {
    test.use({ authProfile: COMPANY_PROFILE.AGENT });

    test.skip(
        !isProfileConfigured(COMPANY_PROFILE.HAULIER),
        'No HAULIER login in this environment - see ON_DEMAND_PROFILES in src/auth/credentials.ts'
    );

    test.beforeEach(async () => {
        await ReportLog.setFeature('Representation authority');
    });

    test('Verify that the Agent representing the Haulier holds the declaration it submitted, and is refused it once it stops representing', { tag: ['@auth', '@authorisation'] }, async ({
        createDraftEnsDeclarationFlow, consignmentOverviewFlow, movementOverviewFlow,
        declarationAccessFlow, representTraderFlow, checkAuthorityFlow,
    }, testInfo) => {
        await ReportLog.setStory('Agent represents the Haulier - full control while it does, nothing once it does not');

        const draft = await ReportLog.step('Agent representing the Haulier declares an ENS-SFD and leaves it in draft', async () => {
            await representTraderFlow.representTrader(HAULIER_COMPANY_NAME);

            return createDraftEnsDeclarationFlow
                .createDraftEnsDeclaration(ensSfdDeclaration(testInfo, rejectedByCds()));
        });

        // The ENS is asked while it is still a DRAFT, and stopping here before submitting
        // is the whole reason. Once the service accepts a consignment it offers nobody a
        // change on it, so Full is unreachable for every party and the row would pass or
        // fail for a reason that has nothing to do with authority - measured 2026-09-02,
        // when the agent-as-haulier reached the accepted ENS and was offered nothing.
        const ensCheck = {
            what: 'the draft ENS consignment declared for the Haulier',
            records: await declarationAccessFlow.locateRecordsAt(
                await declarationAccessFlow.openDeclarationFromSearch(draft.consignmentReference)
            ),
            reference: draft.consignmentReference,
        };

        await ReportLog.step('Agent representing the Haulier, and the Haulier itself - check the draft', () =>
            checkAuthorityFlow(REPRESENTED_HAULIER_AUTHORITY.ensConsignment, {
                ...ensCheck, parties: ['agentAsHaulier', 'haulier'],
            })
        );

        await checkRefusedOnceRepresentationEnds(
            representTraderFlow, checkAuthorityFlow, REPRESENTED_HAULIER_AUTHORITY.ensConsignment, ensCheck,
            'the draft is gone from it',
        );

        await ReportLog.step('Representing the Haulier again, submit it - expect CDS to reject the SFD', async () => {
            // The representation has to come back before the declaration can be submitted:
            // the account was just shown it cannot reach the record at all without it.
            await representTraderFlow.representTrader(HAULIER_COMPANY_NAME);
            await declarationAccessFlow.openRecord(ensCheck.records.consignment);

            await consignmentOverviewFlow.goToConsignmentOverview();
            await consignmentOverviewFlow.submitConsignment();
            await movementOverviewFlow.waitForSubmittedMovementOverview();

            // The rejection is the precondition, not the failure - as in the tests above.
            await movementOverviewFlow.verifySfdConsignmentTraderInputRequired();
        });

        const sfdCheck = {
            what: 'the rejected SFD generated for the Haulier',
            records: await declarationAccessFlow.locateSfdConsignmentRecords(),
        };

        await ReportLog.step('Agent still representing the Haulier, and the Haulier itself - check the generated SFD', () =>
            checkAuthorityFlow(REPRESENTED_HAULIER_AUTHORITY.rejectedGeneratedConsignment, {
                ...sfdCheck, parties: ['agentAsHaulier', 'haulier'],
            })
        );

        await checkRefusedOnceRepresentationEnds(
            representTraderFlow, checkAuthorityFlow, REPRESENTED_HAULIER_AUTHORITY.rejectedGeneratedConsignment, sfdCheck,
            'the SFD is gone from it too',
        );
    });

    /**
     * The same question on the IMMI journey. Worth building rather than inheriting from
     * the SFD above for the reason the Agent-as-itself pair gives: the two are generated
     * by different journeys, so the rule holding across both is a finding.
     */
    test('Verify that the Agent representing the Haulier holds the IMMI it submitted, and is refused it once it stops representing', { tag: ['@auth', '@authorisation'] }, async ({
        createDraftEnsDeclarationFlow, consignmentOverviewFlow, movementOverviewFlow,
        declarationAccessFlow, representTraderFlow, checkAuthorityFlow,
    }, testInfo) => {
        await ReportLog.setStory('Agent represents the Haulier - the generated IMMI follows the same rule as the SFD');

        await ReportLog.step('Agent representing the Haulier declares an ENS-IMMI - expect CDS to reject the IMMI', async () => {
            await representTraderFlow.representTrader(HAULIER_COMPANY_NAME);

            await createDraftEnsDeclarationFlow
                .createDraftEnsDeclaration(ensImmiDeclaration(testInfo, immiRejectedByCds()));

            await consignmentOverviewFlow.goToConsignmentOverview();
            await consignmentOverviewFlow.submitConsignment();
            await movementOverviewFlow.waitForSubmittedMovementOverview();
            await movementOverviewFlow.verifyImmiConsignmentTraderInputRequired();
        });

        const immi = await declarationAccessFlow.locateImmiConsignmentRecords();
        const immiCheck = {
            what: 'the rejected IMMI generated for the Haulier',
            records: immi,
            tabs: IMMI_EIDR_DECLARATION_TABS,
        };

        await ReportLog.step('Agent still representing the Haulier, and the Haulier itself - check what each is offered', () =>
            checkAuthorityFlow(REPRESENTED_HAULIER_AUTHORITY.rejectedGeneratedConsignment, {
                ...immiCheck, parties: ['agentAsHaulier', 'haulier'],
            })
        );

        await checkRefusedOnceRepresentationEnds(
            representTraderFlow, checkAuthorityFlow, REPRESENTED_HAULIER_AUTHORITY.rejectedGeneratedConsignment, immiCheck,
            'the IMMI is gone from it',
        );
    });

    /**
     * The EIDR reached through a haulier - the one generated declaration nobody may edit.
     *
     * No rejection is arranged and no correction follows, because there is nothing anybody
     * may correct. What is left is the half that still measures something: the account
     * that gave its representation up is shut out of a record the other two are reading.
     */
    test('Verify that the Agent representing the Haulier can read the generated EIDR, and is refused it once it stops representing', { tag: ['@auth', '@authorisation'] }, async ({
        createDraftEnsDeclarationFlow, consignmentOverviewFlow, movementOverviewFlow,
        declarationAccessFlow, representTraderFlow, checkAuthorityFlow,
    }, testInfo) => {
        await ReportLog.setStory('Agent represents the Haulier - everybody reads the generated EIDR, nobody may change it');

        await ReportLog.step('Agent representing the Haulier declares an ENS-EIDR and submits it', async () => {
            await representTraderFlow.representTrader(HAULIER_COMPANY_NAME);

            await createDraftEnsDeclarationFlow
                .createDraftEnsDeclaration(ensEidrDeclaration(testInfo));

            await consignmentOverviewFlow.goToConsignmentOverview();
            await consignmentOverviewFlow.submitConsignment();
            await movementOverviewFlow.waitForSubmittedMovementOverview();
        });

        // No Trader Input Required gate, for the reason the Agent-as-itself EIDR test
        // gives: a generated EIDR settles asynchronously and has been seen at both
        // statuses here, and nothing below depends on which it reached.
        const eidr = await declarationAccessFlow.locateEidrConsignmentRecords();
        const eidrCheck = {
            what: 'the EIDR generated for the Haulier',
            records: eidr,
            tabs: IMMI_EIDR_DECLARATION_TABS,
            unfalsifiableBecause:
                'no company may edit a generated EIDR, so no party on this row holds Full. '
                + 'The contrast it does carry is reach against refusal - the account '
                + 'representing nobody is shut out of the record the other two read - which '
                + 'assertFalsifiable does not count',
        };

        await ReportLog.step('Agent still representing the Haulier, and the Haulier itself - check what each is offered', () =>
            checkAuthorityFlow(REPRESENTED_HAULIER_AUTHORITY.generatedEidrConsignment, {
                ...eidrCheck, parties: ['agentAsHaulier', 'haulier'],
            })
        );

        await checkRefusedOnceRepresentationEnds(
            representTraderFlow, checkAuthorityFlow, REPRESENTED_HAULIER_AUTHORITY.generatedEidrConsignment, eidrCheck,
            'the EIDR is gone from it',
        );
    });

    /**
     * The GMR - the vehicle movement, not a declaration.
     *
     * Its own test rather than another check bolted onto the SFD one above: creating a
     * GMR is a journey of its own, and a service that refuses to make one here would
     * take the SFD measurements down with it. Separate, a GMR problem costs a GMR test.
     *
     * The row it asks is STATED, NEVER MEASURED - see the note in authority-matrix. Two
     * things could turn it red honestly: the rule having changed, or a GMR page simply
     * not offering the change links Full is read from. Read the step titles before
     * concluding which.
     */
    test('Verify that the Agent representing the Haulier holds the GMR it created, and is refused it once it stops representing', { tag: ['@auth', '@authorisation'] }, async ({
        createAndSubmitEnsDeclarationFlow, createAndSubmitGmrFlow,
        declarationAccessFlow, representTraderFlow, checkAuthorityFlow,
    }, testInfo) => {
        await ReportLog.setStory('Agent represents the Haulier - the GMR follows the representation like the declaration does');

        await ReportLog.step('Agent representing the Haulier declares an ENS-SFD and gets it accepted', async () => {
            await representTraderFlow.representTrader(HAULIER_COMPANY_NAME);

            await createAndSubmitEnsDeclarationFlow.completeEnsDeclarationFlow({
                testInfo,
                url: BASE_URL,
                movementOverrides: {
                    typeOfMovement: TYPE_OF_MOVEMENT_OPTION_CODE.RORO_ACCOMPANIED,
                },
                goodsItemOverrides: {
                    documentReferences: [
                        documentReference({
                            documentCode: DOCUMENT_CODE.C672,
                            documentStatus: DOCUMENT_STATUS.AC,
                            documentReference: '0054037-0054047',
                        }),
                    ],
                },
            });
        });

        // The GMR is about the vehicle rather than the goods, but it cannot exist before
        // the goods have somewhere to travel - hence the accepted declaration above.
        await ReportLog.step('The same account creates and submits a GMR for that movement', () =>
            createAndSubmitGmrFlow.addNewGmrAndSubmit(gmrData({
                route_id: ROUTE_ID_CONSTANT.GB_TO_NI.CAIRNRYAN_LARNE_FERRIES,
                external_contacts_list: ['adam1.taylor@nifreight.co.uk'],
            }))
        );

        const gmr = await declarationAccessFlow.locateGmrRecord();
        const gmrCheck = {
            what: 'the GMR created for the Haulier',
            records: gmr,
            tabs: GMR_TABS,
            recordActions: [],
        };

        const { haulier } = await ReportLog.step('Agent representing the Haulier, and the Haulier itself - check what each is offered', () =>
            checkAuthorityFlow(REPRESENTED_HAULIER_AUTHORITY.gmr, {
                ...gmrCheck, parties: ['agentAsHaulier', 'haulier'],
                // The Haulier is about to use what it was just shown, so its window stays.
                keepOpen: ['haulier'],
            })
        );

        await ReportLog.step('The same account representing the Importer instead - check what a representation confers', async () => {
            // The Importer through an agent rather than on its own login: an agent
            // acting for a company holds what that company holds, so this is where the
            // rule is measured on a movement the Importer does not own.
            await representTraderFlow.representTrader(IMPORTER_COMPANY_NAME);
            await checkAuthorityFlow(REPRESENTED_HAULIER_AUTHORITY.gmr, {
                ...gmrCheck, parties: ['agentAsImporter'],
            });
        });

        await ReportLog.step('The Haulier, on its own login, changes the route and resubmits', async () => {
            await haulier!.declarations.openRecord(gmr.consignment);
            await haulier!.gmr.changeRouteAndResubmit(
                ROUTE_ID_CONSTANT.GB_TO_NI.BIRKENHEAD_LIVERPOOL_BELFAST_STENA_LINE
            );
        });

        await checkRefusedOnceRepresentationEnds(
            representTraderFlow, checkAuthorityFlow, REPRESENTED_HAULIER_AUTHORITY.gmr, gmrCheck,
            'the GMR is gone from it',
        );
    });
});
