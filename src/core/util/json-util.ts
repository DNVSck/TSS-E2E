export class JsonUtil {
    /**
     * Parse JSON string with error handling
     */
    static parseJson<T>(jsonString: string): T | null {
        try {
            return JSON.parse(jsonString) as T;
        } catch (error) {
            console.error('Invalid JSON string:', error);
            return null;
        }
    }

    /**
     * Stringify object with pretty formatting
     */
    static stringify(obj: any, pretty: boolean = false): string {
        try {
            return pretty ? JSON.stringify(obj, null, 2) : JSON.stringify(obj);
        } catch (error) {
            console.error('Error stringifying object:', error);
            return '';
        }
    }

    /**
     * Deep clone object using JSON
     */
    static deepClone<T>(obj: T): T | null {
        try {
            return JSON.parse(JSON.stringify(obj));
        } catch (error) {
            console.error('Error cloning object:', error);
            return null;
        }
    }

    /**
     * Compare two objects for equality
     */
    static isEqual(obj1: any, obj2: any): boolean {
        try {
            return JSON.stringify(obj1) === JSON.stringify(obj2);
        } catch {
            return false;
        }
    }

    /**
     * Get value from nested object using dot notation
     */
    static getValue(obj: any, path: string, defaultValue: any = undefined): any {
        try {
            const keys = path.split('.');
            let current = obj;

            for (const key of keys) {
                if (current === null || current === undefined || !current.hasOwnProperty(key)) {
                    return defaultValue;
                }
                current = current[key];
            }

            return current;
        } catch {
            return defaultValue;
        }
    }

    /**
     * Set value in nested object using dot notation
     */
    static setValue(obj: any, path: string, value: any): void {
        const keys = path.split('.');
        let current = obj;

        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }

        current[keys[keys.length - 1]] = value;
    }

    /**
     * Remove null and undefined values from object
     */
    static removeNullValues(obj: any): any {
        if (Array.isArray(obj)) {
            return obj.map(item => this.removeNullValues(item)).filter(item => item != null);
        } else if (obj !== null && typeof obj === 'object') {
            const result: any = {};
            Object.keys(obj).forEach(key => {
                const value = this.removeNullValues(obj[key]);
                if (value != null) {
                    result[key] = value;
                }
            });
            return result;
        }
        return obj;
    }

    /**
     * Flatten nested object
     */
    static flatten(obj: any, prefix: string = ''): any {
        const result: any = {};

        Object.keys(obj).forEach(key => {
            const newKey = prefix ? `${prefix}.${key}` : key;
            const value = obj[key];

            if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
                Object.assign(result, this.flatten(value, newKey));
            } else {
                result[newKey] = value;
            }
        });

        return result;
    }

    /**
     * Merge multiple objects deeply
     */
    static mergeDeep(...objects: any[]): any {
        if (objects.length === 0) return {};
        if (objects.length === 1) return objects[0];

        const target = {};

        objects.forEach(obj => {
            Object.keys(obj).forEach(key => {
                const value = obj[key];
                if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
                    (target as any)[key] = this.mergeDeep((target as any)[key] || {}, value);
                } else {
                    (target as any)[key] = value;
                }
            });
        });

        return target;
    }

    /**
     * Get all keys from nested object
     */
    static getAllKeys(obj: any, prefix: string = ''): string[] {
        let keys: string[] = [];

        Object.keys(obj).forEach(key => {
            const newKey = prefix ? `${prefix}.${key}` : key;
            keys.push(newKey);

            const value = obj[key];
            if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
                keys = keys.concat(this.getAllKeys(value, newKey));
            }
        });

        return keys;
    }

    /**
     * Validate JSON schema (basic validation)
     */
    static validateSchema(obj: any, schema: any): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        const validate = (current: any, currentSchema: any, path: string = '') => {
            errors.push(
                ...this.checkType(current, currentSchema, path),
                ...this.checkRequired(current, currentSchema, path)
            );

            // Recurse into declared properties that are present on the object.
            if (currentSchema.properties && current && typeof current === 'object') {
                Object.keys(currentSchema.properties).forEach(prop => {
                    if (current[prop] !== undefined) {
                        const newPath = path ? `${path}.${prop}` : prop;
                        validate(current[prop], currentSchema.properties[prop], newPath);
                    }
                });
            }
        };

        validate(obj, schema);
        return { valid: errors.length === 0, errors };
    }

    /** Schema `type` check for one node — empty if it matches or no type is declared. */
    private static checkType(current: any, currentSchema: any, path: string): string[] {
        if (!currentSchema.type) {
            return [];
        }
        const actualType = Array.isArray(current) ? 'array' : typeof current;
        return actualType === currentSchema.type
            ? []
            : [`${path}: expected ${currentSchema.type}, got ${actualType}`];
    }

    /** Schema `required` check for one node — one message per missing field. */
    private static checkRequired(current: any, currentSchema: any, path: string): string[] {
        if (!currentSchema.required || !Array.isArray(currentSchema.required)) {
            return [];
        }
        return currentSchema.required
            .filter((field: string) => !current?.hasOwnProperty(field))
            .map((field: string) => `${path}.${field}: required field missing`);
    }

    /**
     * Generate sample data from schema
     */
    static generateSampleFromSchema(schema: any): any {
        if (schema.type === 'object') {
            const result: any = {};
            if (schema.properties) {
                Object.keys(schema.properties).forEach(key => {
                    result[key] = this.generateSampleFromSchema(schema.properties[key]);
                });
            }
            return result;
        } else if (schema.type === 'array') {
            return [this.generateSampleFromSchema(schema.items || { type: 'string' })];
        } else if (schema.type === 'string') {
            return schema.example || 'sample string';
        } else if (schema.type === 'number') {
            return schema.example || 123;
        } else if (schema.type === 'boolean') {
            return schema.example !== undefined ? schema.example : true;
        }
        
        return null;
    }

    /**
     * Load JSON from file (for Node.js environment)
     */
    static async loadFromFile(filePath: string): Promise<any | null> {
        try {
            const fs = await import('fs');
            const content = fs.readFileSync(filePath, 'utf-8');
            return this.parseJson(content);
        } catch (error) {
            console.error(`Error loading JSON from file ${filePath}:`, error);
            return null;
        }
    }

    /**
     * Save JSON to file (for Node.js environment)
     */
    static async saveToFile(obj: any, filePath: string, pretty: boolean = true): Promise<boolean> {
        try {
            const fs = await import('fs');
            const path = await import('path');
            
            // Ensure directory exists
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            const content = this.stringify(obj, pretty);
            fs.writeFileSync(filePath, content, 'utf-8');
            return true;
        } catch (error) {
            console.error(`Error saving JSON to file ${filePath}:`, error);
            return false;
        }
    }
}
