import { BasePage } from "./base-page";
import { Page, Locator } from '@playwright/test';
import { TFunction } from '../fixtures/locale-fixture';
import { RENDER_TIMEOUT } from '../constant/timeout-constant';
import { readFieldWhenVisible, readFieldIfPresent } from '../helper/element-helper';

export class GmrBarcodePage extends BasePage {
    private readonly plannedRoute: Locator;
    private readonly vehicleRegistrationNumber: Locator;
    private readonly trailerRegistrationNumber: Locator;

    constructor(page: Page, t: TFunction) {
        super(page, t);
        this.plannedRoute = this.valueUnderHeading(t('gmrDetail.plannedRoute'));
        this.vehicleRegistrationNumber =
            this.valueUnderHeading(t('gmrDetail.vehicleRegistrationNumber'));
        this.trailerRegistrationNumber =
            this.valueUnderHeading(t('gmrDetail.trailerRegistrationNumber'));
    }

    async readBarcode(): Promise<{
        plannedRoute: string;
        vehicleRegistrationNumber: string;
        trailerRegistrationNumber: string;
    }> {
        return {
            plannedRoute: await readFieldWhenVisible(this.plannedRoute, RENDER_TIMEOUT.RECORD_DETAIL),
            vehicleRegistrationNumber: await readFieldIfPresent(this.vehicleRegistrationNumber),
            trailerRegistrationNumber: await readFieldIfPresent(this.trailerRegistrationNumber),
        };
    }

    private valueUnderHeading(label: string): Locator {
        return this.page.locator(
            `xpath=//main//*[self::h2 or self::h3][normalize-space()="${label}"]/following-sibling::p[1]`
        );
    }
}
