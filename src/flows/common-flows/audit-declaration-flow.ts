import { ConsignmentOverviewFlow } from '../consignment/consignment-overview-flow';
import { MovementOverviewFlow } from '../movement/movement-overview-flow';
import { CreateDraftEnsDeclarationFlow, EnsDeclarationOptions } from './create-draft-ens-declaration-flow';
import {
    CreateDraftSfdStandaloneFlow, SfdStandaloneDeclarationOptions,
} from './create-draft-sfd-standalone-flow';
import {
    CreateDraftImmiStandaloneFlow, ImmiStandaloneDeclarationOptions,
} from './create-draft-immi-standalone-flow';
import {
    CompleteAndSubmitSupplementaryDeclarationFlow, CompleteSupplementaryDeclarationOptions,
} from './complete-and-submit-supplementary-declaration-flow';
import { AddNewGMRFlow } from '../gmr/add-new-gmr-flow';
import { GmrOverviewFlow } from '../gmr/gmr-overview-flow';
import { GmrDetailsPage } from '../../page-object/gmr-details-page';
import { gmrData } from '../../test-data/gmr-data';
import { AccessibilityAudit, checkpointFor } from '../accessibility-audit-flow';
import { ConvertSupplementaryDeclarationFlow } from './convert-supplementary-declaration-flow';
import { RevertImmiDeclarationFlow } from './revert-immi-declaration-flow';
import { SupplementaryDeclarationSource } from './generate-sd-draft-from-ens-sfd-flow';
import { ADDITIONAL_PROCEDURE_CODES } from '../../constant/additional-procedure-codes-constant';
import { TestInfo } from '@playwright/test';

export interface GmrAuditOptions {
    testInfo: TestInfo;
    routeId: string;
    audit?: AccessibilityAudit;
}

export interface ReclassificationAuditOptions {
    testInfo: TestInfo;
    url: string;
    source: SupplementaryDeclarationSource;
    audit?: AccessibilityAudit;
}

export class AuditDeclarationFlow {
    constructor(
        private readonly createDraftEnsDeclarationFlow: CreateDraftEnsDeclarationFlow,
        private readonly createDraftSfdStandaloneFlow: CreateDraftSfdStandaloneFlow,
        private readonly createDraftImmiStandaloneFlow: CreateDraftImmiStandaloneFlow,
        private readonly consignmentOverviewFlow: ConsignmentOverviewFlow,
        private readonly movementOverviewFlow: MovementOverviewFlow,
        private readonly supplementaryDeclarationFlow: CompleteAndSubmitSupplementaryDeclarationFlow,
        private readonly addNewGmrFlow: AddNewGMRFlow,
        private readonly gmrDetailsPage: GmrDetailsPage,
        private readonly gmrOverviewFlow: GmrOverviewFlow,
        private readonly convertSupplementaryDeclarationFlow: ConvertSupplementaryDeclarationFlow,
        private readonly revertImmiDeclarationFlow: RevertImmiDeclarationFlow,
    ) { }

    async auditEnsDeclaration(options: EnsDeclarationOptions): Promise<void> {
        await this.createDraftEnsDeclarationFlow.createDraftEnsDeclaration(options);

        const checkpoint = checkpointFor(options.audit, options.testInfo);

        await this.consignmentOverviewFlow.submitConsignmentAndReadOutcome();
        await this.movementOverviewFlow.waitForSubmittedMovementOverview();
        // Scanned without navigating: the message box is put up once, by the redirect
        // submitting produced, and re-requesting the overview would lose it.
        await checkpoint?.('Movement - overview (submitted)');
    }

    async auditSfdStandalone(options: SfdStandaloneDeclarationOptions): Promise<void> {
        await this.createDraftSfdStandaloneFlow.createDraftSfdStandalone(options);
        await this.submitAndScan(options);
    }

    async auditImmiStandalone(options: ImmiStandaloneDeclarationOptions): Promise<void> {
        await this.createDraftImmiStandaloneFlow.createDraftImmiStandalone(options);
        await this.submitAndScan(options);
    }

    async auditSupplementaryDeclaration(
        options: CompleteSupplementaryDeclarationOptions
    ): Promise<void> {
        const checkpoint = checkpointFor(options.audit, options.testInfo);

        await this.supplementaryDeclarationFlow.declareSupplementaryDeclaration(options);
        await options.audit?.verifyEveryTab({
            testInfo: options.testInfo, record: 'Supplementary declaration',
        });
        await this.supplementaryDeclarationFlow.submitSupplementaryDeclaration(checkpoint);
        await checkpoint?.('Supplementary declaration - overview (submitted)');
    }

    async auditConversion(options: ReclassificationAuditOptions): Promise<void> {
        const { testInfo, url, source, audit } = options;
        const checkpoint = checkpointFor(audit, testInfo);

        await this.supplementaryDeclarationFlow.openSupplementaryDeclaration({ testInfo, url, ...source });
        await this.convertSupplementaryDeclarationFlow.convertToImmi(checkpoint);
        await audit?.verifyEveryTab({ testInfo, record: 'Converted IMMI' });

        await this.convertSupplementaryDeclarationFlow.updateConvertedGoodsItem(
            { additionalProcedureCode: ADDITIONAL_PROCEDURE_CODES.SPIMM_STANDARD_GOODS_1SG }, checkpoint
        );
    }

    async auditReversal(options: ReclassificationAuditOptions): Promise<void> {
        const { testInfo, url, source, audit } = options;
        const checkpoint = checkpointFor(audit, testInfo);

        const reference = await this.supplementaryDeclarationFlow.openSupplementaryDeclaration({
            testInfo, url, ...source,
        });
        await this.convertSupplementaryDeclarationFlow.convertToImmi();
        await this.revertImmiDeclarationFlow.revertToSupplementaryDeclaration({
            declaration: { reference, frontierLrn: source.frontierLrn },
            originalStatusKey: 'status.draft',
            checkpoint,
        });
    }

    async auditGmr(options: GmrAuditOptions): Promise<void> {
        const checkpoint = checkpointFor(options.audit, options.testInfo);

        await this.addNewGmrFlow.addNewGmrAndSubmit(
            gmrData({ route_id: options.routeId, external_contacts_list: [] }),
            checkpoint
        );

        // The overview after submit shares its route with the first tab below, so it is
        // scanned there rather than separately - two scans of one route trip the guard.
        await options.audit?.verifyEveryTab({ testInfo: options.testInfo, record: 'GMR (open)' });
        await this.gmrOverviewFlow.auditExternalContactWizard(options.audit, options.testInfo);

        await this.gmrDetailsPage.generateBarcode();
        await checkpoint?.('GMR - goods movement reference barcode');
    }

    // A standalone declaration has no movement overview to return to: it stays on its
    // own consignment overview, which is where the submit's outcome is shown.
    private async submitAndScan(
        options: SfdStandaloneDeclarationOptions | ImmiStandaloneDeclarationOptions
    ): Promise<void> {
        const checkpoint = checkpointFor(options.audit, options.testInfo);

        await this.consignmentOverviewFlow.submitConsignmentAndReadOutcome();
        await checkpoint?.('Consignment - overview (submitted)');
    }
}
