import { Page, Locator } from '@playwright/test';
import { selectDropdownValue } from '../../helper/element-helper';

export class WarehouseScreen {
    readonly typeDropdown: Locator;
    private readonly identifierInput: Locator;

    constructor(page: Page) {
        this.typeDropdown = page.locator('select#warehouseType');
        this.identifierInput = page.locator('input#warehouseIdentifier');
    }

    async fill(warehouseType: string, warehouseIdentifier: string): Promise<void> {
        await selectDropdownValue(this.typeDropdown, warehouseType);
        await this.identifierInput.fill(warehouseIdentifier);
    }
}
