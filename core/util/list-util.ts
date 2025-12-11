import { faker } from '@faker-js/faker';

export class ListUtil {

    // ===== BASIC LIST OPERATIONS =====

    /**
     * Create a new list from array
     */
    static createList<T>(...items: T[]): T[] {
        return [...items];
    }

    /**
     * Check if list is empty
     */
    static isEmpty<T>(list: T[]): boolean {
        return list.length === 0;
    }

    /**
     * Check if list is not empty
     */
    static isNotEmpty<T>(list: T[]): boolean {
        return list.length > 0;
    }

    /**
     * Get list size/length
     */
    static size<T>(list: T[]): number {
        return list.length;
    }

    /**
     * Add item to end of list
     */
    static add<T>(list: T[], item: T): T[] {
        return [...list, item];
    }

    /**
     * Add multiple items to end of list
     */
    static addAll<T>(list: T[], ...items: T[]): T[] {
        return [...list, ...items];
    }

    /**
     * Add item at specific index
     */
    static addAt<T>(list: T[], index: number, item: T): T[] {
        const result = [...list];
        result.splice(index, 0, item);
        return result;
    }

    /**
     * Remove item by value (first occurrence)
     */
    static remove<T>(list: T[], item: T): T[] {
        const index = list.indexOf(item);
        return index >= 0 ? this.removeAt(list, index) : [...list];
    }

    /**
     * Remove all occurrences of item
     */
    static removeAll<T>(list: T[], item: T): T[] {
        return list.filter(listItem => listItem !== item);
    }

    /**
     * Remove item at specific index
     */
    static removeAt<T>(list: T[], index: number): T[] {
        if (index < 0 || index >= list.length) return [...list];
        const result = [...list];
        result.splice(index, 1);
        return result;
    }

    /**
     * Remove multiple items at indices
     */
    static removeAtIndices<T>(list: T[], indices: number[]): T[] {
        const sortedIndices = [...indices].sort((a, b) => b - a); // Sort in descending order
        let result = [...list];
        for (const index of sortedIndices) {
            if (index >= 0 && index < result.length) {
                result.splice(index, 1);
            }
        }
        return result;
    }

    /**
     * Clear all items from list
     */
    static clear<T>(list: T[]): T[] {
        return [];
    }

    /**
     * Get item at specific index
     */
    static get<T>(list: T[], index: number): T | undefined {
        return index >= 0 && index < list.length ? list[index] : undefined;
    }

    /**
     * Set item at specific index
     */
    static set<T>(list: T[], index: number, item: T): T[] {
        if (index < 0 || index >= list.length) return [...list];
        const result = [...list];
        result[index] = item;
        return result;
    }

    /**
     * Check if list contains item
     */
    static contains<T>(list: T[], item: T): boolean {
        return list.includes(item);
    }

    /**
     * Check if list contains all items
     */
    static containsAll<T>(list: T[], items: T[]): boolean {
        return items.every(item => list.includes(item));
    }

    /**
     * Check if list contains any of the items
     */
    static containsAny<T>(list: T[], items: T[]): boolean {
        return items.some(item => list.includes(item));
    }

    /**
     * Find index of item (first occurrence)
     */
    static indexOf<T>(list: T[], item: T): number {
        return list.indexOf(item);
    }

    /**
     * Find index of item (last occurrence)
     */
    static lastIndexOf<T>(list: T[], item: T): number {
        return list.lastIndexOf(item);
    }

    /**
     * Find all indices of item
     */
    static allIndicesOf<T>(list: T[], item: T): number[] {
        const indices: number[] = [];
        let index = list.indexOf(item);
        while (index !== -1) {
            indices.push(index);
            index = list.indexOf(item, index + 1);
        }
        return indices;
    }

    // ===== LIST MANIPULATION =====

    /**
     * Get sublist from start to end (exclusive)
     */
    static subList<T>(list: T[], start: number, end?: number): T[] {
        return list.slice(start, end);
    }

    /**
     * Get first N items
     */
    static take<T>(list: T[], count: number): T[] {
        return list.slice(0, count);
    }

    /**
     * Get last N items
     */
    static takeLast<T>(list: T[], count: number): T[] {
        return list.slice(-count);
    }

    /**
     * Skip first N items
     */
    static skip<T>(list: T[], count: number): T[] {
        return list.slice(count);
    }

    /**
     * Skip last N items
     */
    static skipLast<T>(list: T[], count: number): T[] {
        return list.slice(0, -count);
    }

    /**
     * Reverse the list
     */
    static reverse<T>(list: T[]): T[] {
        return [...list].reverse();
    }

    /**
     * Sort the list
     */
    static sort<T>(list: T[], compareFn?: (a: T, b: T) => number): T[] {
        return [...list].sort(compareFn);
    }

    /**
     * Sort list by property
     */
    static sortBy<T, K extends keyof T>(list: T[], property: K, direction: 'asc' | 'desc' = 'asc'): T[] {
        return [...list].sort((a, b) => {
            const aVal = a[property];
            const bVal = b[property];
            
            if (aVal < bVal) return direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    /**
     * Shuffle the list randomly
     */
    static shuffle<T>(list: T[]): T[] {
        const result = [...list];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    /**
     * Rotate list by N positions
     */
    static rotate<T>(list: T[], positions: number): T[] {
        if (list.length === 0) return [...list];
        const normalizedPositions = ((positions % list.length) + list.length) % list.length;
        return [...list.slice(normalizedPositions), ...list.slice(0, normalizedPositions)];
    }

    // ===== FILTERING AND SEARCHING =====

    /**
     * Filter list by predicate
     */
    static filter<T>(list: T[], predicate: (item: T, index: number) => boolean): T[] {
        return list.filter(predicate);
    }

    /**
     * Find first item matching predicate
     */
    static find<T>(list: T[], predicate: (item: T, index: number) => boolean): T | undefined {
        return list.find(predicate);
    }

    /**
     * Find last item matching predicate
     */
    static findLast<T>(list: T[], predicate: (item: T, index: number) => boolean): T | undefined {
        for (let i = list.length - 1; i >= 0; i--) {
            if (predicate(list[i], i)) {
                return list[i];
            }
        }
        return undefined;
    }

    /**
     * Find all items matching predicate
     */
    static findAll<T>(list: T[], predicate: (item: T, index: number) => boolean): T[] {
        return list.filter(predicate);
    }

    /**
     * Check if any item matches predicate
     */
    static any<T>(list: T[], predicate: (item: T, index: number) => boolean): boolean {
        return list.some(predicate);
    }

    /**
     * Check if all items match predicate
     */
    static all<T>(list: T[], predicate: (item: T, index: number) => boolean): boolean {
        return list.every(predicate);
    }

    /**
     * Count items matching predicate
     */
    static count<T>(list: T[], predicate?: (item: T, index: number) => boolean): number {
        return predicate ? list.filter(predicate).length : list.length;
    }

    // ===== TRANSFORMATION =====

    /**
     * Map each item to new type
     */
    static map<T, U>(list: T[], mapper: (item: T, index: number) => U): U[] {
        return list.map(mapper);
    }

    /**
     * Flat map (map then flatten)
     */
    static flatMap<T, U>(list: T[], mapper: (item: T, index: number) => U[]): U[] {
        return list.flatMap(mapper);
    }

    /**
     * Reduce list to single value
     */
    static reduce<T, U>(list: T[], reducer: (accumulator: U, current: T, index: number) => U, initialValue: U): U {
        return list.reduce(reducer, initialValue);
    }

    /**
     * Group items by key function
     */
    static groupBy<T, K extends string | number | symbol>(
        list: T[], 
        keySelector: (item: T) => K
    ): Record<K, T[]> {
        return list.reduce((groups, item) => {
            const key = keySelector(item);
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(item);
            return groups;
        }, {} as Record<K, T[]>);
    }

    /**
     * Partition list into two lists based on predicate
     */
    static partition<T>(list: T[], predicate: (item: T) => boolean): [T[], T[]] {
        const passed: T[] = [];
        const failed: T[] = [];
        
        for (const item of list) {
            if (predicate(item)) {
                passed.push(item);
            } else {
                failed.push(item);
            }
        }
        
        return [passed, failed];
    }

    /**
     * Split list into chunks of specified size
     */
    static chunk<T>(list: T[], size: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < list.length; i += size) {
            chunks.push(list.slice(i, i + size));
        }
        return chunks;
    }

    // ===== SET OPERATIONS =====

    /**
     * Get unique items (remove duplicates)
     */
    static distinct<T>(list: T[]): T[] {
        return [...new Set(list)];
    }

    /**
     * Get distinct items by key function
     */
    static distinctBy<T, K>(list: T[], keySelector: (item: T) => K): T[] {
        const seen = new Set<K>();
        return list.filter(item => {
            const key = keySelector(item);
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    /**
     * Get union of two lists (no duplicates)
     */
    static union<T>(list1: T[], list2: T[]): T[] {
        return this.distinct([...list1, ...list2]);
    }

    /**
     * Get intersection of two lists
     */
    static intersection<T>(list1: T[], list2: T[]): T[] {
        return list1.filter(item => list2.includes(item));
    }

    /**
     * Get difference (items in first list but not in second)
     */
    static difference<T>(list1: T[], list2: T[]): T[] {
        return list1.filter(item => !list2.includes(item));
    }

    /**
     * Get symmetric difference (items in either list but not both)
     */
    static symmetricDifference<T>(list1: T[], list2: T[]): T[] {
        return [
            ...this.difference(list1, list2),
            ...this.difference(list2, list1)
        ];
    }

    // ===== AGGREGATION =====

    /**
     * Get first item
     */
    static first<T>(list: T[]): T | undefined {
        return list[0];
    }

    /**
     * Get last item
     */
    static last<T>(list: T[]): T | undefined {
        return list[list.length - 1];
    }

    /**
     * Get random item
     */
    static random<T>(list: T[]): T | undefined {
        return list.length === 0 ? undefined : list[Math.floor(Math.random() * list.length)];
    }

    /**
     * Get multiple random items (no duplicates)
     */
    static randomMultiple<T>(list: T[], count: number): T[] {
        if (list.length === 0 || count <= 0) return [];
        if (count >= list.length) return this.shuffle(list);
        
        const shuffled = this.shuffle(list);
        return shuffled.slice(0, count);
    }

    /**
     * Get min value (for comparable items)
     */
    static min(list: number[]): number | undefined {
        return list.length === 0 ? undefined : Math.min(...list);
    }

    /**
     * Get max value (for comparable items)
     */
    static max(list: number[]): number | undefined {
        return list.length === 0 ? undefined : Math.max(...list);
    }

    /**
     * Get sum (for numeric lists)
     */
    static sum(list: number[]): number {
        return list.reduce((sum, num) => sum + num, 0);
    }

    /**
     * Get average (for numeric lists)
     */
    static average(list: number[]): number {
        return list.length === 0 ? 0 : this.sum(list) / list.length;
    }

   
}