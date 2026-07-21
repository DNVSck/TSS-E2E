import { faker } from '@faker-js/faker';

export class DateTimeUtil {

    /**
     * Get current timestamp in various formats
     */
    static getCurrentTimestamp(format: 'iso' | 'epoch' | 'readable' = 'iso'): string | number {
        const now = new Date();
        switch (format) {
            case 'iso':
                return now.toISOString();
            case 'epoch':
                return now.getTime();
            case 'readable':
                return now.toLocaleString();
            default:
                return now.toISOString();
        }
    }

    /**
     * Format date for test data
     */
    static formatDate(date: Date, format: string = 'YYYY-MM-DD'): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return format
            .replace('YYYY', year.toString())
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);
    }

    /**
     * Get date relative to current date
     */
    static getRelativeDate(days: number, format: string = 'YYYY-MM-DD'): string {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return this.formatDate(date, format);
    }

    /**
     * Generate random date within range
     */
    static generateRandomDate(startDate: Date, endDate: Date): Date {
        const start = startDate.getTime();
        const end = endDate.getTime();
        const randomTime = faker.number.int({ min: start, max: end });
        return new Date(randomTime);
    }

    /**
     * Get age from birth date
     */
    static calculateAge(birthDate: Date): number {
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age;
    }

    /**
     * Check if date is weekend
     */
    static isWeekend(date: Date): boolean {
        const day = date.getDay();
        return day === 0 || day === 6; // Sunday = 0, Saturday = 6
    }

    /**
     * Get business days between two dates
     */
    static getBusinessDaysBetween(startDate: Date, endDate: Date): number {
        let count = 0;
        const current = new Date(startDate);

        while (current <= endDate) {
            if (!this.isWeekend(current)) {
                count++;
            }
            current.setDate(current.getDate() + 1);
        }

        return count;
    }

    /**
     * Add business days to a date
     */
    static addBusinessDays(date: Date, days: number): Date {
        const result = new Date(date);
        let addedDays = 0;

        while (addedDays < days) {
            result.setDate(result.getDate() + 1);
            if (!this.isWeekend(result)) {
                addedDays++;
            }
        }

        return result;
    }

    /**
     * Get start and end of current month
     */
    static getCurrentMonthRange(): { start: Date; end: Date } {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return { start, end };
    }

    /**
     * Convert timezone
     */
    static convertTimezone(date: Date, timezone: string): string {
        return date.toLocaleString('en-US', { timeZone: timezone });
    }

    /**
     * Parse date string with multiple formats
     */
    static parseDate(dateString: string): Date | null {
        const formats = [
            /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
            /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
            /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
        ];

        for (const format of formats) {
            if (format.test(dateString)) {
                const parsed = new Date(dateString);
                if (!Number.isNaN(parsed.getTime())) {
                    return parsed;
                }
            }
        }

        return null;
    }

    /**
     * Get time duration in human readable format
     */
    static formatDuration(milliseconds: number): string {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
        if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    /**
     * Check if date is valid
     */
    static isValidDate(date: any): boolean {
        return date instanceof Date && !Number.isNaN(date.getTime());
    }

    /**
     * Generate test-friendly timestamp for filenames
     */
    static getTestTimestamp(): string {
        return this.formatDate(new Date(), 'YYYYMMDD_HHmmss');
    }

    /**
     * Wait for specific time (useful for delays in tests)
     */
    static async sleep(milliseconds: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    // ===== FAKER.JS METHODS =====

    /**
     * Generate random past date using Faker
     */
    static randomPastDate(years: number = 1): Date {
        return faker.date.past({ years });
    }

    /**
     * Generate random future date using Faker
     */
    static randomFutureDate(years: number = 1): Date {
        return faker.date.future({ years });
    }

    /**
     * Generate random recent date using Faker
     */
    static randomRecentDate(days: number = 10): Date {
        return faker.date.recent({ days });
    }

    /**
     * Generate random soon date using Faker
     */
    static randomSoonDate(days: number = 10): Date {
        return faker.date.soon({ days });
    }

    /**
     * Generate random birthdate using Faker
     */
    static randomBirthdate(minAge: number = 18, maxAge: number = 80): Date {
        return faker.date.birthdate({ min: minAge, max: maxAge, mode: 'age' });
    }

    /**
     * Generate random date between two dates using Faker
     */
    static randomDateBetween(from: Date, to: Date): Date {
        return faker.date.between({ from, to });
    }

    /**
     * Generate random weekday using Faker
     */
    static randomWeekday(): string {
        return faker.date.weekday();
    }

    /**
     * Generate random month using Faker
     */
    static randomMonth(): string {
        return faker.date.month();
    }

    /**
     * A valid arrival date/time for TSS forms: the current UTC (UTC+0) date and
     * time plus 30 minutes, formatted as `YYYY-MM-DDTHH:mm` for the
     * datetime-local input. The 30-minute lead keeps it safely in the future
     * without tripping the form's far-future validation.
     */
    static generateValidArrivalDate(): string {
        const arrival = new Date(Date.now() + 30 * 60 * 1000);
        return this.formatUtcDateTimeLocal(arrival);
    }

    /** `YYYY-MM-DDTHH:mm` in UTC (UTC+0) — `toISOString` is always UTC. */
    private static formatUtcDateTimeLocal(date: Date): string {
        return date.toISOString().slice(0, 16);
    }

}
