import { expect } from '@playwright/test';
import { MovementService } from '../../../api-service/trader-api/movement-service';
import { ConsignmentService } from '../../../api-service/trader-api/consignment-service';
import { GoodsService } from '../../../api-service/trader-api/goods-service';
import {
    SimplifiedFrontierDeclarationService, SfdSummary,
} from '../../../api-service/trader-api/simplified-frontier-declaration-service';
import {
    InternalMarketMovementService, InternalMarketMovementSummary,
} from '../../../api-service/trader-api/internal-market-movement-service';
import { DECLARATION_STATUS } from '../../../constant/trader-api/declaration-status-constant';
import {
    isDeclarationStatus, declarationStatusPattern, traderInputRequiredError,
} from '../../../helper/declaration-status-helper';
import { MovementData, movement } from '../../../test-data/movements-data';
import { ConsignmentData, consignment } from '../../../test-data/consignment-data';
import { GoodsData, goods } from '../../../test-data/goods-data';
import { headerPayload } from '../../../test-data/payload/trader-api/header-payload';
import { consignmentPayload } from '../../../test-data/payload/trader-api/consignment-payload';
import { goodsPayload } from '../../../test-data/payload/trader-api/goods-payload';
import { DeclarationIdentity } from '../../../test-data/payload/cds-notification-payload';
import { ReportLog } from '../../../core/report/report-log';
import { attachRequest } from '../../../helper/report-helper';

/** How many times a submit that neither answered nor raised an SFD is sent again. */
const SUBMIT_ATTEMPTS = 3;

const SFD = 'SFD';
const EIDR = 'EIDR';
const IMMI = 'IMMI';

const SFD_APPEARS_TIMEOUT = 120_000;

const SFD_SETTLES_TIMEOUT = 180_000;

const IMMI_APPEARS_TIMEOUT = 120_000;

const IMMI_SETTLES_TIMEOUT = 180_000;

const SFD_ARRIVES_TIMEOUT = 180_000;

const ENS_MRN_TIMEOUT = 120_000;

const EIDR_APPEARS_TIMEOUT = 120_000;

const EIDR_AUTHORISES_TIMEOUT = 180_000;

/**
 * Statuses an SFD never leaves, so a wait that sees one has its answer and should not
 * spend the rest of its timeout asking again. "Trader Input Required" means the
 * submission was handed back to the trader: no MRN is ever assigned, so the CDS
 * messages this flow exists to address can never be sent.
 */
const NEVER_REACHES_ARRIVAL: string[] = [DECLARATION_STATUS.TRADER_INPUT_REQUIRED];

export interface DeclareEnsOptions {
    movementOverrides?: Partial<MovementData>;
    consignmentOverrides?: Partial<ConsignmentData>;
    goodsItemOverrides?: Partial<GoodsData>;
}

export interface DeclaredConsignment {
    movementLrn: string;
    consignmentReference: string;
    transportDocumentNumber: string;
}

export interface DeclaredConsignmentUnderMovement {
    consignmentReference: string;
    transportDocumentNumber: string;
}

interface DeclarationStatusWait<T> {
    what: string;
    expected: string;
    timeout: number;
    unread: T;
    read: () => Promise<T>;
}

export interface EnsSfdDeclaration extends DeclaredConsignment {
    sfd: DeclarationIdentity;
}

export class DeclareEnsThroughApiFlow {
    constructor(
        private readonly movementService: MovementService,
        private readonly consignmentService: ConsignmentService,
        private readonly goodsService: GoodsService,
        private readonly sfdService: SimplifiedFrontierDeclarationService,
        private readonly internalMarketMovementService: InternalMarketMovementService,
    ) { }

    async declareEnsSfd(options: DeclareEnsOptions = {}): Promise<EnsSfdDeclaration> {
        const { movementLrn, consignmentReference, transportDocumentNumber } =
            await this.declareAndSubmit(options);

        const sfd = await this.waitForSfdAwaitingArrival(consignmentReference);

        return { movementLrn, consignmentReference, transportDocumentNumber, sfd };
    }


    async declareAndSubmit(options: DeclareEnsOptions = {}): Promise<DeclaredConsignment> {
        const movementData = movement(options.movementOverrides);

        const movementLrn = await ReportLog.step(
            'Create the movement header through the Trader API',
            async () => {
                const header = headerPayload(movementData);
                attachRequest('Movement header', header);

                const reference = await this.movementService.createHeader(header);
                ReportLog.setParameter('Movement LRN', reference);
                ReportLog.setParameter('Type of movement', movementData.typeOfMovement);
                return reference;
            }
        );

        const { consignmentReference, transportDocumentNumber } =
            await this.declareUnderMovement(movementLrn, options);

        return { movementLrn, consignmentReference, transportDocumentNumber };
    }

    async declareUnderMovement(
        movementLrn: string,
        options: DeclareEnsOptions = {}
    ): Promise<DeclaredConsignmentUnderMovement> {
        const consignmentData = consignment({
            isControlledGoods: true,
            useIMMI: false,
            ...options.consignmentOverrides,
        });
        const goodsData = goods(options.goodsItemOverrides);

        const consignmentReference = await ReportLog.step(
            `Create the ENS consignment under ${movementLrn}`,
            async () => {
                const payload = consignmentPayload(movementLrn, consignmentData, goodsData);
                attachRequest('ENS consignment', payload);

                const reference = await this.consignmentService.createConsignment(payload);
                ReportLog.setParameter('ENS consignment', reference);
                return reference;
            }
        );

        await ReportLog.step(
            `Add the goods item to ${consignmentReference}`,
            async () => {
                const payload = goodsPayload(consignmentReference, goodsData);
                attachRequest('Goods item', payload);

                await this.goodsService.createGoodsItem(payload);
            }
        );

        await this.submitConsignment(consignmentReference);

        await this.refuseIfHandedBack(consignmentReference);

        return {
            consignmentReference,
            transportDocumentNumber: consignmentData.transportDocumentNumber,
        };
    }

    /**
     * The declaration a submitted consignment generates carries the CDS validation that
     * refused it, and nothing downstream can happen once it has. Read it here so the
     * report names the reason, instead of a later screen failing for a cause it cannot
     * see.
     */
    private async refuseIfHandedBack(consignmentReference: string): Promise<void> {
        await ReportLog.step(
            `Read the declaration generated by ${consignmentReference}`,
            async () => {
                // A read that does not answer is not a verdict. This endpoint is only
                // known to resolve an IMMI consignment's reference; an SFD journey has
                // its own guard in waitForSimplifiedDeclarationStatus, so refusing here on
                // may simply not apply would fail a journey for the wrong reason.
                const declaration = await this.readDeclarationOrSkip(consignmentReference);

                if (!declaration) {
                    return;
                }

                ReportLog.setParameter('Declaration reference', declaration.reference);
                ReportLog.setParameter('Declaration status', declaration.status);

                if (!isDeclarationStatus(
                    declaration.status, DECLARATION_STATUS.TRADER_INPUT_REQUIRED
                )) {
                    return;
                }

                ReportLog.addAttachment(
                    `${declaration.reference} - validation errors`,
                    declaration.errorMessage,
                    'text/plain'
                );

                throw traderInputRequiredError(
                    `Declaration ${declaration.reference}`, declaration.status
                );
            }
        );
    }

    private async readDeclarationOrSkip(
        consignmentReference: string
    ): Promise<InternalMarketMovementSummary | undefined> {
        try {
            return await this.internalMarketMovementService.readByReference(consignmentReference);
        } catch (error) {
            await ReportLog.info(
                `No declaration could be read for ${consignmentReference}, so it was not `
                + `checked for a hand-back: ${error instanceof Error ? error.message : error}`
            );
            return undefined;
        }
    }

    private async submitConsignment(consignmentReference: string): Promise<void> {
        await ReportLog.step(`Submit consignment ${consignmentReference}`, async () => {
            for (let attempt = 1; attempt <= SUBMIT_ATTEMPTS; attempt++) {
                try {
                    await this.consignmentService.submitConsignment(consignmentReference);
                    return;
                } catch (error) {
                    if (await this.sfdExists(consignmentReference)) {
                        await ReportLog.info(
                            `The submit call did not answer on attempt ${attempt}, but an SFD `
                            + `exists for ${consignmentReference}, so the submission was taken.`
                        );
                        return;
                    }

                    if (attempt === SUBMIT_ATTEMPTS) {
                        throw error;
                    }

                    await ReportLog.info(
                        `Submit failed on attempt ${attempt} and raised no SFD, so nothing was `
                        + `taken - submitting ${consignmentReference} again.`
                    );
                }
            }
        });
    }

    private async sfdExists(consignmentReference: string): Promise<boolean> {
        try {
            return await this.sfdService.findSfdByConsignment(consignmentReference) !== '';
        } catch {
            return false;
        }
    }

    async waitForSfdArrived(sfdNumber: string): Promise<void> {
        await ReportLog.step(
            `Wait for SFD ${sfdNumber} to reach "${DECLARATION_STATUS.ARRIVED}"`,
            () => this.waitForSimplifiedDeclarationStatus(
                { label: SFD, number: sfdNumber }, DECLARATION_STATUS.ARRIVED, SFD_ARRIVES_TIMEOUT
            )
        );
    }

    // The declaration is created a beat after the consignment is submitted, so
    // the lookup answers with a business error until it exists.
    private async waitForLookupToAnswer(
        lookUp: () => Promise<string>,
        options: { timeout: number; message: string }
    ): Promise<string> {
        let found = '';
        let refusal = '';

        try {
            await expect.poll(async () => {
                try {
                    found = await lookUp();
                    refusal = '';
                } catch (error) {
                    found = '';
                    refusal = (error as Error).message;
                }
                return found;
            }, {
                timeout: options.timeout,
                intervals: [2_000, 5_000],
                message: options.message,
            }).not.toBe('');
        } catch (error_) {
            if (!refusal) {
                throw error_;
            }

            throw new Error(
                `${(error_ as Error).message}

The last lookup was refused with: ${refusal}`
            );
        }

        return found;
    }

    async waitForEnsMrn(consignmentReference: string): Promise<string> {
        return ReportLog.step(
            `Wait for the MRN of ${consignmentReference}`,
            async () => {
                const mrn = await this.waitForLookupToAnswer(
                    () => this.consignmentService.readMovementReferenceNumber(consignmentReference),
                    {
                        timeout: ENS_MRN_TIMEOUT,
                        message: `consignment ${consignmentReference} was never given an MRN, `
                            + `so there is nothing to name ICS2 the movement with`,
                    }
                );

                ReportLog.setParameter('ENS MRN', mrn);
                return mrn;
            }
        );
    }

    async waitForEidrAuthorised(consignmentReference: string): Promise<void> {
        const eidrNumber = await this.waitForEidrToExist(consignmentReference);

        await this.waitForEidrToSettle(eidrNumber);
    }

    async waitForSfdAwaitingArrival(
        consignmentReference: string
    ): Promise<DeclarationIdentity> {
        const sfdNumber = await this.waitForSfdToExist(consignmentReference);
        const mrn = await this.waitForSfdToSettle(sfdNumber);

        return { lrn: sfdNumber, mrn };
    }

    async waitForImmiAwaitingArrival(
        consignmentReference: string
    ): Promise<DeclarationIdentity> {
        const immiNumber = await this.waitForImmiToExist(consignmentReference);
        const mrn = await this.waitForImmiToSettle(immiNumber);

        return { lrn: immiNumber, mrn };
    }

    private async waitForImmiToExist(consignmentReference: string): Promise<string> {
        return ReportLog.step(
            `Wait for the ${IMMI} generated by ${consignmentReference}`,
            async () => {
                const immiNumber = await this.waitForLookupToAnswer(
                    () => this.internalMarketMovementService
                        .findImmiByConsignment(consignmentReference),
                    {
                        timeout: IMMI_APPEARS_TIMEOUT,
                        message: `no ${IMMI} was generated by ${consignmentReference}`,
                    }
                );

                ReportLog.setParameter(IMMI, immiNumber);
                return immiNumber;
            }
        );
    }

    private async waitForImmiToSettle(immiNumber: string): Promise<string> {
        return ReportLog.step(
            `Wait for ${IMMI} ${immiNumber} to reach "${DECLARATION_STATUS.AWAITING_ARRIVAL}"`,
            async () => {
                const immi = await this.waitForImmiStatus(
                    immiNumber, DECLARATION_STATUS.AWAITING_ARRIVAL, IMMI_SETTLES_TIMEOUT
                );

                ReportLog.setParameter(`${IMMI} MRN`, immi.movementReferenceNumber);
                return immi.movementReferenceNumber;
            }
        );
    }

    private async waitForSfdToExist(consignmentReference: string): Promise<string> {
        return ReportLog.step(
            `Wait for the ${SFD} generated by ${consignmentReference}`,
            async () => {
                const sfdNumber = await this.waitForLookupToAnswer(
                    () => this.sfdService.findSfdByConsignment(consignmentReference),
                    {
                        timeout: SFD_APPEARS_TIMEOUT,
                        message: `no ${SFD} was generated by ${consignmentReference}`,
                    }
                );

                ReportLog.setParameter(SFD, sfdNumber);
                return sfdNumber;
            }
        );
    }

    private async waitForEidrToExist(consignmentReference: string): Promise<string> {
        return ReportLog.step(
            `Wait for the ${EIDR} generated by ${consignmentReference}`,
            async () => {
                const eidrNumber = await this.waitForLookupToAnswer(
                    () => this.sfdService.findSfdByConsignment(consignmentReference),
                    {
                        timeout: EIDR_APPEARS_TIMEOUT,
                        message: `no ${EIDR} was generated by ${consignmentReference}`,
                    }
                );

                ReportLog.setParameter(EIDR, eidrNumber);
                return eidrNumber;
            }
        );
    }

    private async waitForEidrToSettle(eidrNumber: string): Promise<void> {
        await ReportLog.step(
            `Wait for ${EIDR} ${eidrNumber} to reach "${DECLARATION_STATUS.AUTHORISED}"`,
            () => this.waitForSimplifiedDeclarationStatus(
                { label: EIDR, number: eidrNumber },
                DECLARATION_STATUS.AUTHORISED,
                EIDR_AUTHORISES_TIMEOUT
            )
        );
    }


    private async waitForSfdToSettle(sfdNumber: string): Promise<string> {
        return ReportLog.step(
            `Wait for SFD ${sfdNumber} to reach "${DECLARATION_STATUS.AWAITING_ARRIVAL}"`,
            async () => {
                const sfd = await this.waitForSimplifiedDeclarationStatus(
                    { label: SFD, number: sfdNumber },
                    DECLARATION_STATUS.AWAITING_ARRIVAL,
                    SFD_SETTLES_TIMEOUT
                );

                ReportLog.setParameter('SFD MRN', sfd.movementReferenceNumber);
                return sfd.movementReferenceNumber;
            }
        );
    }

    private async waitForSimplifiedDeclarationStatus(
        declaration: { label: string; number: string },
        expected: string,
        timeout: number
    ): Promise<SfdSummary> {
        const { label, number } = declaration;

        return this.waitForDeclarationStatus({
            what: `${label} ${number}`,
            expected,
            timeout,
            unread: { sfdNumber: number, status: '', movementReferenceNumber: '' },
            read: () => this.sfdService.readSfd(number),
        });
    }

    private async waitForImmiStatus(
        immiNumber: string, expected: string, timeout: number
    ): Promise<InternalMarketMovementSummary> {
        return this.waitForDeclarationStatus({
            what: `${IMMI} ${immiNumber}`,
            expected,
            timeout,
            unread: {
                reference: immiNumber,
                status: '',
                errorMessage: '',
                movementReferenceNumber: '',
            },
            read: () => this.internalMarketMovementService.readByReference(immiNumber),
        });
    }

    private async waitForDeclarationStatus<T extends { status: string }>(
        wait: DeclarationStatusWait<T>
    ): Promise<T> {
        const { what, expected, timeout, read } = wait;
        let lastRead = wait.unread;

        await expect.poll(async () => {
            try {
                lastRead = await read();
            } catch {
                lastRead = { ...lastRead, status: '' };
            }

            if (NEVER_REACHES_ARRIVAL.some(status => isDeclarationStatus(lastRead.status, status))) {
                throw new Error(
                    `${what} settled on "${lastRead.status}", which it never leaves, `
                    + `so it will not reach "${expected}". The declaration was handed back to `
                    + `the trader - read it in the portal to see which answer it was refused for.`
                );
            }

            return lastRead.status;
        }, {
            timeout,
            intervals: [3_000, 5_000, 10_000],
            message: `${what} never reached "${expected}" - a blank status below `
                + `means the last read was refused, not that the declaration has no status`,
        }).toMatch(declarationStatusPattern(expected));

        return lastRead;
    }
}
