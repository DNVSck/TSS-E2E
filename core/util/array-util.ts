import { faker } from '@faker-js/faker';

export class ArrayUtil {

    // ===== BASIC ARRAY OPERATIONS =====

    /**
     * Check if value is an array
     */
    static isArray(value: any): boolean {
        return Array.isArray(value);
    }

    /**
     * Check if array is empty
     */
    static isEmpty(array: any[]): boolean {
        return array.length === 0;
    }

    /**
     * Get first element of array
     */
    static first<T>(array: T[]): T | undefined {
        return array[0];
    }

    /**
     * Get last element of array
     */
    static last<T>(array: T[]): T | undefined {
        return array[array.length - 1];
    }

    /**
     * Get random element from array
     */
    static random<T>(array: T[]): T | undefined {
        if (array.length === 0) return undefined;
        return array[Math.floor(Math.random() * array.length)];
    }

    /**
     * Get multiple random elements from array
     */
    static randomMultiple<T>(array: T[], count: number): T[] {
        if (array.length === 0) return [];
        const result: T[] = [];
        const used = new Set<number>();
        
        while (result.length < count && result.length < array.length) {
            const index = Math.floor(Math.random() * array.length);
            if (!used.has(index)) {
                used.add(index);
                result.push(array[index]);
            }
        }
        
        return result;
    }

    /**
     * Shuffle array using Fisher-Yates algorithm
     */
    static shuffle<T>(array: T[]): T[] {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    /**
     * Remove duplicates from array
     */
    static unique<T>(array: T[]): T[] {
        return [...new Set(array)];
    }

    /**
     * Remove falsy values from array
     */
    static compact<T>(array: (T | null | undefined | false | 0 | "")[]): T[] {
        return array.filter(Boolean) as T[];
    }

    /**
     * Flatten nested arrays
     */
    static flatten<T>(array: (T | T[])[]): T[] {
        return array.flat() as T[];
    }

    /**
     * Deep flatten nested arrays
     */
    static flattenDeep(array: any[]): any[] {
        return array.reduce((acc, item) => {
            if (Array.isArray(item)) {
                acc.push(...this.flattenDeep(item));
            } else {
                acc.push(item);
            }
            return acc;
        }, []);
    }

    /**
     * Chunk array into smaller arrays of specified size
     */
    static chunk<T>(array: T[], size: number): T[][] {
        const result: T[][] = [];
        for (let i = 0; i < array.length; i += size) {
            result.push(array.slice(i, i + size));
        }
        return result;
    }

    /**
     * Partition array into two arrays based on predicate
     */
    static partition<T>(array: T[], predicate: (item: T) => boolean): [T[], T[]] {
        const passed: T[] = [];
        const failed: T[] = [];
        
        for (const item of array) {
            if (predicate(item)) {
                passed.push(item);
            } else {
                failed.push(item);
            }
        }
        
        return [passed, failed];
    }

    /**
     * Group array elements by key
     */
    static groupBy<T, K extends string | number | symbol>(
        array: T[], 
        keySelector: (item: T) => K
    ): Record<K, T[]> {
        return array.reduce((groups, item) => {
            const key = keySelector(item);
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(item);
            return groups;
        }, {} as Record<K, T[]>);
    }

    /**
     * Find difference between two arrays
     */
    static difference<T>(array1: T[], array2: T[]): T[] {
        return array1.filter(item => !array2.includes(item));
    }

    /**
     * Find intersection of two arrays
     */
    static intersection<T>(array1: T[], array2: T[]): T[] {
        return array1.filter(item => array2.includes(item));
    }

    /**
     * Find union of two arrays (no duplicates)
     */
    static union<T>(...arrays: T[][]): T[] {
        return this.unique(arrays.flat());
    }

    /**
     * Check if two arrays are equal
     */
    static areEqual<T>(array1: T[], array2: T[]): boolean {
        if (array1.length !== array2.length) return false;
        return array1.every((item, index) => item === array2[index]);
    }

    /**
     * Sort array of objects by property
     */
    static sortBy<T>(array: T[], property: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] {
        return [...array].sort((a, b) => {
            const aVal = a[property];
            const bVal = b[property];
            
            if (aVal < bVal) return direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    /**
     * Find min value in array
     */
    static min(array: number[]): number | undefined {
        return array.length === 0 ? undefined : Math.min(...array);
    }

    /**
     * Find max value in array
     */
    static max(array: number[]): number | undefined {
        return array.length === 0 ? undefined : Math.max(...array);
    }

    /**
     * Calculate sum of numeric array
     */
    static sum(array: number[]): number {
        return array.reduce((sum, num) => sum + num, 0);
    }

    /**
     * Calculate average of numeric array
     */
    static average(array: number[]): number {
        return array.length === 0 ? 0 : this.sum(array) / array.length;
    }

    // ===== FAKER.JS METHODS =====

    /**
     * Generate array of random strings
     */
    static randomStrings(count: number = 5): string[] {
        return Array.from({ length: count }, () => faker.lorem.word());
    }

    /**
     * Generate array of random numbers
     */
    static randomNumbers(count: number = 5, min: number = 0, max: number = 100): number[] {
        return Array.from({ length: count }, () => faker.number.int({ min, max }));
    }

    /**
     * Generate array of random emails
     */
    static randomEmails(count: number = 5): string[] {
        return Array.from({ length: count }, () => faker.internet.email());
    }

    /**
     * Generate array of random names
     */
    static randomNames(count: number = 5): string[] {
        return Array.from({ length: count }, () => faker.person.fullName());
    }

    /**
     * Generate array of random UUIDs
     */
    static randomUuids(count: number = 5): string[] {
        return Array.from({ length: count }, () => faker.string.uuid());
    }

    /**
     * Generate array of random colors
     */
    static randomColors(count: number = 5): string[] {
        return Array.from({ length: count }, () => faker.color.human());
    }

    /**
     * Generate array of random dates
     */
    static randomDates(count: number = 5): Date[] {
        return Array.from({ length: count }, () => faker.date.past());
    }

    /**
     * Generate array of random booleans
     */
    static randomBooleans(count: number = 5): boolean[] {
        return Array.from({ length: count }, () => faker.datatype.boolean());
    }

    /**
     * Generate array of random URLs
     */
    static randomUrls(count: number = 5): string[] {
        return Array.from({ length: count }, () => faker.internet.url());
    }

    /**
     * Generate array of random sentences
     */
    static randomSentences(count: number = 5): string[] {
        return Array.from({ length: count }, () => faker.lorem.sentence());
    }

    /**
     * Generate array of random words
     */
    static randomWords(count: number = 5, wordCount: number = 1): string[] {
        return Array.from({ length: count }, () => faker.lorem.words(wordCount));
    }

    /**
     * Generate array of random phone numbers
     */
    static randomPhones(count: number = 5): string[] {
        return Array.from({ length: count }, () => faker.phone.number());
    }

    /**
     * Generate array of random companies
     */
    static randomCompanies(count: number = 5): string[] {
        return Array.from({ length: count }, () => faker.company.name());
    }

    /**
     * Generate array of random job titles
     */
    static randomJobTitles(count: number = 5): string[] {
        return Array.from({ length: count }, () => faker.person.jobTitle());
    }

    /**
     * Generate array of random addresses
     */
    static randomAddresses(count: number = 5): string[] {
        return Array.from({ length: count }, () => faker.location.streetAddress());
    }

    /**
     * Generate array of random cities
     */
    static randomCities(count: number = 5): string[] {
        return Array.from({ length: count }, () => faker.location.city());
    }

    /**
     * Generate array of random countries
     */
    static randomCountries(count: number = 5): string[] {
        return Array.from({ length: count }, () => faker.location.country());
    }

    /**
     * Generate array of random prices
     */
    static randomPrices(count: number = 5, min: number = 1, max: number = 1000): string[] {
        return Array.from({ length: count }, () => faker.commerce.price({ min, max }));
    }

    /**
     * Generate array of random product names
     */
    static randomProductNames(count: number = 5): string[] {
        return Array.from({ length: count }, () => faker.commerce.productName());
    }

    /**
     * Generate array of random departments
     */
    static randomDepartments(count: number = 5): string[] {
        return Array.from({ length: count }, () => faker.commerce.department());
    }

    /**
     * Generate array using Faker helper arrayElements
     */
    static randomFromArray<T>(sourceArray: T[], count: number = 3): T[] {
        return faker.helpers.arrayElements(sourceArray, count);
    }

    /**
     * Generate array using Faker helper multiple
     */
    static randomMultipleFaker<T>(generator: () => T, count: number = 5): T[] {
        return faker.helpers.multiple(generator, { count });
    }

    /**
     * Generate weighted array selection
     */
    static randomWeighted<T>(items: Array<{ weight: number; value: T }>): T {
        return faker.helpers.weightedArrayElement(items);
    }

    /**
     * Generate object array with random data
     */
    static randomObjectArray(count: number = 5): Array<{
        id: string;
        name: string;
        email: string;
        age: number;
        active: boolean;
    }> {
        return Array.from({ length: count }, () => ({
            id: faker.string.uuid(),
            name: faker.person.fullName(),
            email: faker.internet.email(),
            age: faker.number.int({ min: 18, max: 80 }),
            active: faker.datatype.boolean()
        }));
    }
}