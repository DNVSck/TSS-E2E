import { faker } from '@faker-js/faker';

export class StringUtil {
    
    /**
     * Clean and normalize string for comparison
     */
    static normalizeString(str: string): string {
        return str.trim().toLowerCase().replace(/\s+/g, ' ');
    }

    /**
     * Check if string contains only numbers
     */
    static isNumeric(str: string): boolean {
        return /^\d+$/.test(str);
    }

    /**
     * Check if string is valid email format
     */
    static isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Check if a value matches a regex
     */
    static verifyRegex(value: string, regex: RegExp): boolean {
        return regex.test(value);
    }

    /**
     * Extract numbers from string
     */
    static extractNumbers(str: string): string {
        return str.replace(/\D/g, '');
    }

    /**
     * Convert string to title case
     */
    static toTitleCase(str: string): string {
        return str.toLowerCase().replace(/(?:^|\s)\w/g, (match) => match.toUpperCase());
    }

    /**
     * Truncate string to specified length with ellipsis
     */
    static truncate(str: string, maxLength: number, suffix: string = '...'): string {
        if (str.length <= maxLength) return str;
        return str.substring(0, maxLength - suffix.length) + suffix;
    }

    /**
     * Remove special characters from string
     */
    static removeSpecialChars(str: string, keepSpaces: boolean = true): string {
        const pattern = keepSpaces ? /[^a-zA-Z0-9\s]/g : /[^a-zA-Z0-9]/g;
        return str.replace(pattern, '');
    }

    /**
     * Strip any trailing slashes from a URL path without a regex. Done as a manual
     * scan (rather than /\/+$/) so the unbounded quantifier can never backtrack — a
     * linear walk from the end is both safe and clearer about intent.
     */
    static stripTrailingSlashes(path: string): string {
        let end = path.length;
        while (end > 0 && path[end - 1] === '/') {
            end--;
        }
        return path.slice(0, end);
    }

    /**
     * Mask sensitive data (e.g., credit card, SSN)
     */
    static maskString(str: string, visibleStart: number = 2, visibleEnd: number = 2, maskChar: string = '*'): string {
        if (str.length <= visibleStart + visibleEnd) return str;
        const start = str.substring(0, visibleStart);
        const end = str.substring(str.length - visibleEnd);
        const masked = maskChar.repeat(str.length - visibleStart - visibleEnd);
        return start + masked + end;
    }


    /**
     * Compare two strings ignoring case and whitespace
     */
    static fuzzyMatch(str1: string, str2: string): boolean {
        return this.normalizeString(str1) === this.normalizeString(str2);
    }

    /**
     * Format currency string
     */
    static formatCurrency(amount: number, currency: string = 'USD', locale: string = 'en-US'): string {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency
        }).format(amount);
    }

    // ===== FAKER.JS METHODS =====
    
    /**
     * Generate random email using Faker
     */
    static randomEmail(): string {
        return faker.internet.email();
    }


    static randomNumeric(minLength: number, maxLength: number): string {
        return faker.string.numeric({
            length: { min: minLength, max: maxLength },
            allowLeadingZeros: false,
        });
    }

    /**
     * Generate random first name using Faker
     */
    static randomFirstName(): string {
        return faker.person.firstName();
    }

    /**
     * Generate random last name using Faker
     */
    static randomLastName(): string {
        return faker.person.lastName();
    }

    /**
     * Generate random full name using Faker
     */
    static randomFullName(): string {
        return faker.person.fullName();
    }

    /**
     * Generate random phone number using Faker
     */
    static randomPhone(): string {
        return faker.phone.number();
    }

    /**
     * Generate random address using Faker
     */
    static randomAddress(): string {
        return faker.location.streetAddress();
    }

    static randomStreetName(): string {
        return faker.location.street();
    }

    static randomBuildingNumber(): string {
        return faker.location.buildingNumber();
    }

    /**
     * Generate random city using Faker
     */
    static randomCity(): string {
        return faker.location.city();
    }

    /**
     * Generate random company name using Faker
     */
    static randomCompany(): string {
        return faker.company.name();
    }

    /**
     * Generate random UUID using Faker
     */
    static randomUuid(): string {
        return faker.string.uuid();
    }

    /**
     * Generate random password using Faker
     */
    static randomPassword(length: number = 12): string {
        return faker.internet.password({length});
    }

    /**
     * Generate random username using Faker
     */
    static randomUsername(): string {
        return faker.internet.username();
    }

    /**
     * Generate random sentence using Faker
     */
    static randomSentence(wordCount: number = 5): string {
        return faker.lorem.sentence(wordCount);
    }

    /**
     * Generate random paragraph using Faker
     */
    static randomParagraph(): string {
        return faker.lorem.paragraph();
    }

    /**
     * Generate random color hex using Faker
     */
    static randomColor(): string {
        return faker.color.rgb();
    }

    /**
     * Generate random website URL using Faker
     */
    static randomUrl(): string {
        return faker.internet.url();
    }

    /**
     * Generate random credit card number using Faker
     */
    static randomCreditCard(): string {
        return faker.finance.creditCardNumber();
    }

    /**
     * Generate random job title using Faker
     */
    static randomJobTitle(): string {
        return faker.person.jobTitle();
    }

    /**
     * Generate random product name using Faker
     */
    static randomProductName(): string {
        return faker.commerce.productName();
    }

    /**
     * Generate random price using Faker
     */
    static randomPrice(): string {
        return faker.commerce.price();
    }
}
