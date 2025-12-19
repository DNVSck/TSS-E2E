import { faker } from '@faker-js/faker';

export class NumberUtil {

    // ===== BASIC NUMBER OPERATIONS =====

    /**
     * Check if a value is a number
     */
    static isNumber(value: any): boolean {
        return typeof value === 'number' && !isNaN(value);
    }

    /**
     * Check if a value is an integer
     */
    static isInteger(value: any): boolean {
        return Number.isInteger(value);
    }

    /**
     * Check if a number is positive
     */
    static isPositive(value: number): boolean {
        return value > 0;
    }

    /**
     * Check if a number is negative
     */
    static isNegative(value: number): boolean {
        return value < 0;
    }

    /**
     * Check if a number is even
     */
    static isEven(value: number): boolean {
        return value % 2 === 0;
    }

    /**
     * Check if a number is odd
     */
    static isOdd(value: number): boolean {
        return value % 2 !== 0;
    }

    /**
     * Round a number to specified decimal places
     */
    static round(value: number, decimals: number = 2): number {
        return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
    }

    /**
     * Get absolute value
     */
    static abs(value: number): number {
        return Math.abs(value);
    }

    /**
     * Clamp a number between min and max values
     */
    static clamp(value: number, min: number, max: number): number {
        return Math.min(Math.max(value, min), max);
    }

    /**
     * Convert string to number safely
     */
    static toNumber(value: string): number | null {
        const num = Number(value);
        return isNaN(num) ? null : num;
    }

    /**
     * Format number with thousand separators
     */
    static formatWithCommas(value: number): string {
        return value.toLocaleString();
    }

    /**
     * Format number as percentage
     */
    static toPercentage(value: number, decimals: number = 2): string {
        return `${this.round(value * 100, decimals)}%`;
    }

    /**
     * Format number as currency
     */
    static toCurrency(value: number, currency: string = 'USD', locale: string = 'en-US'): string {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency
        }).format(value);
    }

    /**
     * Generate random number between min and max (inclusive)
     */
    static randomBetween(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Generate random float between min and max
     */
    static randomFloat(min: number, max: number, decimals: number = 2): number {
        const random = Math.random() * (max - min) + min;
        return this.round(random, decimals);
    }

    /**
     * Generate array of random numbers
     */
    static randomArray(count: number, min: number = 0, max: number = 100): number[] {
        return Array.from({ length: count }, () => this.randomBetween(min, max));
    }

    /**
     * Calculate sum of array
     */
    static sum(numbers: number[]): number {
        return numbers.reduce((sum, num) => sum + num, 0);
    }

    /**
     * Calculate average of array
     */
    static average(numbers: number[]): number {
        return numbers.length === 0 ? 0 : this.sum(numbers) / numbers.length;
    }

    /**
     * Find minimum value in array
     */
    static min(numbers: number[]): number {
        return Math.min(...numbers);
    }

    /**
     * Find maximum value in array
     */
    static max(numbers: number[]): number {
        return Math.max(...numbers);
    }

    // ===== FAKER.JS METHODS =====

    /**
     * Generate random integer using Faker
     */
    static randomInt(min: number = 0, max: number = 100): number {
        return faker.number.int({ min, max });
    }

    /**
     * Generate random float using Faker
     */
    static randomFakerFloat(min: number = 0, max: number = 100, fractionDigits: number = 2): number {
        return faker.number.float({ min, max, fractionDigits });
    }

    /**
     * Generate random octal number
     */
    static randomOctal(): string {
        return faker.number.octal();
    }

    /**
     * Generate random hexadecimal number
     */
    static randomHex(): string {
        return faker.number.hex();
    }

    /**
     * Generate random BigInt
     */
    static randomBigInt(min: bigint = 0n, max: bigint = 1000000n): bigint {
        return faker.number.bigInt({ min, max });
    }

    /**
     * Generate random price
     */
    static randomPrice(min: number = 1, max: number = 1000, dec: number = 2, symbol: string = '$'): string {
        return faker.commerce.price({ min, max, dec, symbol });
    }

    /**
     * Generate random financial amount
     */
    static randomFinancialAmount(min: number = 0, max: number = 1000000, dec: number = 2): string {
        return faker.finance.amount({ min, max, dec });
    }

    /**
     * Generate random credit card number
     */
    static randomCreditCardNumber(issuer?: string): string {
        return faker.finance.creditCardNumber(issuer);
    }

    /**
     * Generate random account number
     */
    static randomAccountNumber(length?: number): string {
        return faker.finance.accountNumber(length);
    }

    /**
     * Generate random routing number
     */
    static randomRoutingNumber(): string {
        return faker.finance.routingNumber();
    }

    /**
     * Generate random percentage
     */
    static randomPercentage(min: number = 0, max: number = 100, precision: number = 2): number {
        return this.round(faker.number.float({ min, max }), precision);
    }

    /**
     * Generate random altitude
     */
    static randomAltitude(min: number = -1000, max: number = 10000): number {
        return faker.number.int({ min, max });
    }

    /**
     * Generate random weight (in kg)
     */
    static randomWeight(min: number = 0.1, max: number = 1000): number {
        return faker.number.float({ min, max, fractionDigits: 2 });
    }

    /**
     * Generate random height (in cm)
     */
    static randomHeight(min: number = 50, max: number = 250): number {
        return faker.number.int({ min, max });
    }

    /**
     * Generate random temperature (in Celsius)
     */
    static randomTemperature(min: number = -50, max: number = 50): number {
        return faker.number.float({ min, max, fractionDigits: 1 });
    }

    /**
     * Generate random distance (in meters)
     */
    static randomDistance(min: number = 1, max: number = 100000): number {
        return faker.number.int({ min, max });
    }

    /**
     * Generate random score (0-100)
     */
    static randomScore(): number {
        return faker.number.int({ min: 0, max: 100 });
    }

    /**
     * Generate random rating (1-5)
     */
    static randomRating(): number {
        return faker.number.int({ min: 1, max: 5 });
    }

    /**
     * Generate random quantity for testing
     */
    static randomQuantity(min: number = 1, max: number = 100): number {
        return faker.number.int({ min, max });
    }

    /**
     * Generate random statistical data
     */
    static generateStatistics(): {
        mean: number;
        median: number;
        mode: number;
        standardDeviation: number;
        variance: number;
        min: number;
        max: number;
        sum: number;
        count: number;
    } {
        const data = Array.from({ length: 100 }, () => faker.number.float({ min: 0, max: 100, fractionDigits: 2 }));
        const sorted = [...data].sort((a, b) => a - b);
        const mean = this.average(data);
        const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
        
        return {
            mean: this.round(mean, 2),
            median: sorted[Math.floor(sorted.length / 2)],
            mode: sorted[0], // Simplified
            standardDeviation: this.round(Math.sqrt(variance), 2),
            variance: this.round(variance, 2),
            min: this.min(data),
            max: this.max(data),
            sum: this.round(this.sum(data), 2),
            count: data.length
        };
    }
}