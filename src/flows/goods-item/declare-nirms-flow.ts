import { expect } from '@playwright/test';
import { GoodsData } from '../../test-data/goods-data';
import { GoodsItemSteps } from './goods-item-steps';
import { nirmsExpectation, nirmsNeedsTariff } from '../../helper/nirms-helper';
import {
    CompanyPermissionService,
} from '../../api-service/portal-api/company-permission-service';
import { TariffService } from '../../api-service/portal-api/tariff-service';
import { ENV } from '../../../config/environment';
import { AccessibilityCheckpoint } from '../accessibility-audit-flow';

/**
 * What a journey must state about itself before the NIRMS rule can be applied to it.
 * Three facts, because those are the three the rule reads - see nirms-helper.
 */
export interface NirmsJourney {
    readonly isEnsOnly: boolean;
    readonly useIMMI: boolean;
    /** Whose NIRMS authorisation decides the question. */
    readonly importerEORI: string;
}

/**
 * The NIRMS screens at goods-item level, for every journey that reaches them.
 *
 * One owner, because the four goods-item wizards differ only in WHERE the question
 * sits - which is the caller's business - and not in what it means, what is owed or
 * what the answer must be held against. Each wizard calls this at its own point.
 */
export class DeclareNirmsFlow {
    constructor(
        private readonly steps: GoodsItemSteps,
        private readonly companyPermissionService: CompanyPermissionService,
        private readonly tariffService: TariffService,
    ) { }

    async answerNirms(
        input: GoodsData,
        journey: NirmsJourney,
        checkpoint?: AccessibilityCheckpoint
    ): Promise<void> {
        const { expected, because, tariffDocumentCodes } = await this.expectedScreen(input, journey);

        // IMMI writes its own NIRMS document (1RMS) and never offers the choice; every
        // other journey follows the question with the tariff's document list.
        const picksDocuments = !journey.useIMMI;

        if (input.useNirms && !expected) {
            throw new Error(
                `Test data sets "useNirms" but the NIRMS screen is never put for this item on `
                + `"${ENV}": ${because}.`
            );
        }

        // The documents screen takes ONE of what the tariff offers, so which one is a
        // choice the test has to make. Checked before the wizard is touched, so a test
        // that forgot fails on its own mistake rather than on a declaration nobody shaped.
        if (input.useNirms && picksDocuments && input.nirmsDocumentCodes.length === 0) {
            throw new Error(
                'Test data sets "useNirms" but names no "nirmsDocumentCodes". The screen that '
                + 'follows takes one of the documents the tariff lists for this commodity, and '
                + 'there is no default: which one a declaration cites is what the test is for.'
            );
        }

        // Behind "expected", not before it: on a journey the service never asks, a
        // checkpoint here would scan whatever screen came next under the NIRMS name.
        if (expected) {
            await checkpoint?.('Goods item - NIRMS', { probeErrors: true });
        }

        const asked = await this.steps.answerNirmsIfAsked(input);

        if (asked === expected) {
            if (asked && input.useNirms && picksDocuments) {
                await checkpoint?.('Goods item - NIRMS documents', { probeErrors: true });
                await this.verifyNirmsDocuments(input, tariffDocumentCodes);
            }
            return;
        }

        throw new Error(
            expected
                ? `The NIRMS screen was never shown, but it was owed: ${because}. Nothing in `
                + `the test data explains this - the screen was not offered.`
                : `The NIRMS screen was shown, but it should not have been: ${because}. `
                + `The service and what it permits disagree.`
        );
    }

    private async verifyNirmsDocuments(input: GoodsData, tariffDocumentCodes?: string[]): Promise<void> {
        const offered = await this.steps.selectNirmsDocuments(input);

        for (const code of tariffDocumentCodes ?? []) {
            expect.soft(offered,
                `NIRMS documents offered for commodity ${input.commodityCode} `
                + `(the tariff requires ${code})`)
                .toContain(code);
        }
    }

    private async expectedScreen(input: GoodsData, journey: NirmsJourney) {
        const grant = journey.isEnsOnly
            ? undefined
            : await this.companyPermissionService.readPermissionGrant(journey.importerEORI);

        const facts = {
            isEnsOnly: journey.isEnsOnly,
            useIMMI: journey.useIMMI,
            importerEORI: journey.importerEORI,
            hasNirmsAuthorisation: grant?.hasNirmsAuthorisation ?? false,
            additionalProcedureCode: input.additionalProcedureCode,
            commodityCode: input.commodityCode,
            countryOfOrigin: input.countryOfOrigin,
        };

        const tariff = nirmsNeedsTariff(facts)
            ? await this.tariffService.readNirmsDocuments(input.commodityCode, input.countryOfOrigin)
            : undefined;

        return {
            ...nirmsExpectation({ ...facts, tariffCoversCommodity: tariff?.isSupported }),
            tariffDocumentCodes: tariff?.codes,
        };
    }
}
