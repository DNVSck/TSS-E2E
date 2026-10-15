import * as fs from 'node:fs';
import * as path from 'node:path';

export class FileUtil {
    /**
     * Check if file exists
     */
    static exists(filePath: string): boolean {
        try {
            return fs.existsSync(filePath);
        } catch {
            return false;
        }
    }

    /**
     * Create directory if it doesn't exist
     */
    static createDirectory(dirPath: string): boolean {
        try {
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
            return true;
        } catch (error) {
            console.error(`Error creating directory ${dirPath}:`, error);
            return false;
        }
    }

    /**
     * Read file content
     */
    static readFile(filePath: string, encoding: BufferEncoding = 'utf-8'): string | null {
        try {
            return fs.readFileSync(filePath, encoding);
        } catch (error) {
            console.error(`Error reading file ${filePath}:`, error);
            return null;
        }
    }

    /**
     * Write content to file
     */
    static writeFile(filePath: string, content: string, encoding: BufferEncoding = 'utf-8'): boolean {
        try {
            // Ensure directory exists
            const dir = path.dirname(filePath);
            this.createDirectory(dir);
            
            fs.writeFileSync(filePath, content, encoding);
            return true;
        } catch (error) {
            console.error(`Error writing file ${filePath}:`, error);
            return false;
        }
    }

    /**
     * Append content to file
     */
    static appendFile(filePath: string, content: string, encoding: BufferEncoding = 'utf-8'): boolean {
        try {
            fs.appendFileSync(filePath, content, encoding);
            return true;
        } catch (error) {
            console.error(`Error appending to file ${filePath}:`, error);
            return false;
        }
    }

    /**
     * Delete file
     */
    static deleteFile(filePath: string): boolean {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            return true;
        } catch (error) {
            console.error(`Error deleting file ${filePath}:`, error);
            return false;
        }
    }

    /**
     * Delete directory recursively
     */
    static deleteDirectory(dirPath: string): boolean {
        try {
            if (fs.existsSync(dirPath)) {
                fs.rmSync(dirPath, { recursive: true, force: true });
            }
            return true;
        } catch (error) {
            console.error(`Error deleting directory ${dirPath}:`, error);
            return false;
        }
    }

    /**
     * Copy file
     */
    static copyFile(sourcePath: string, destinationPath: string): boolean {
        try {
            // Ensure destination directory exists
            const destDir = path.dirname(destinationPath);
            this.createDirectory(destDir);
            
            fs.copyFileSync(sourcePath, destinationPath);
            return true;
        } catch (error) {
            console.error(`Error copying file from ${sourcePath} to ${destinationPath}:`, error);
            return false;
        }
    }

    /**
     * Move file
     */
    static moveFile(sourcePath: string, destinationPath: string): boolean {
        try {
            // Ensure destination directory exists
            const destDir = path.dirname(destinationPath);
            this.createDirectory(destDir);
            
            fs.renameSync(sourcePath, destinationPath);
            return true;
        } catch (error) {
            console.error(`Error moving file from ${sourcePath} to ${destinationPath}:`, error);
            return false;
        }
    }

    /**
     * Get file size in bytes
     */
    static getFileSize(filePath: string): number | null {
        try {
            const stats = fs.statSync(filePath);
            return stats.size;
        } catch (error) {
            console.error(`Error getting file size for ${filePath}:`, error);
            return null;
        }
    }

    /**
     * Get file extension
     */
    static getExtension(filePath: string): string {
        return path.extname(filePath).toLowerCase();
    }

    /**
     * Get filename without extension
     */
    static getFilenameWithoutExtension(filePath: string): string {
        const filename = path.basename(filePath);
        return path.parse(filename).name;
    }

    /**
     * List files in directory
     */
    static listFiles(dirPath: string, recursive: boolean = false): string[] {
        try {
            if (!fs.existsSync(dirPath)) {
                return [];
            }

            let files: string[] = [];
            const items = fs.readdirSync(dirPath);

            for (const item of items) {
                const itemPath = path.join(dirPath, item);
                const stats = fs.statSync(itemPath);

                if (stats.isFile()) {
                    files.push(itemPath);
                } else if (stats.isDirectory() && recursive) {
                    files = files.concat(this.listFiles(itemPath, recursive));
                }
            }

            return files;
        } catch (error) {
            console.error(`Error listing files in ${dirPath}:`, error);
            return [];
        }
    }

    /**
     * Find files by pattern
     */
    static findFiles(dirPath: string, pattern: string, recursive: boolean = true): string[] {
        const files = this.listFiles(dirPath, recursive);
        const regex = new RegExp(pattern);
        return files.filter(file => regex.test(path.basename(file)));
    }

    /**
     * Get file modification time
     */
    static getModificationTime(filePath: string): Date | null {
        try {
            const stats = fs.statSync(filePath);
            return stats.mtime;
        } catch (error) {
            console.error(`Error getting modification time for ${filePath}:`, error);
            return null;
        }
    }

    /**
     * Check if path is directory
     */
    static isDirectory(dirPath: string): boolean {
        try {
            const stats = fs.statSync(dirPath);
            return stats.isDirectory();
        } catch {
            return false;
        }
    }

    /**
     * Check if path is file
     */
    static isFile(filePath: string): boolean {
        try {
            const stats = fs.statSync(filePath);
            return stats.isFile();
        } catch {
            return false;
        }
    }

    /**
     * Create temporary file
     */
    static createTempFile(content: string = '', extension: string = '.tmp'): string | null {
        try {
            const tempDir = path.join(__dirname, 'temp');
            this.createDirectory(tempDir);
            
            const timestamp = Date.now();
            const filename = `temp_${timestamp}${extension}`;
            const tempPath = path.join(tempDir, filename);
            
            this.writeFile(tempPath, content);
            return tempPath;
        } catch (error) {
            console.error('Error creating temporary file:', error);
            return null;
        }
    }

    /**
     * Clean up temporary files
     */
    static cleanupTempFiles(): boolean {
        try {
            const tempDir = path.join(__dirname, 'temp');
            if (this.exists(tempDir)) {
                this.deleteDirectory(tempDir);
            }
            return true;
        } catch (error) {
            console.error('Error cleaning up temporary files:', error);
            return false;
        }
    }

    /**
     * Get relative path
     */
    static getRelativePath(fromPath: string, toPath: string): string {
        return path.relative(fromPath, toPath);
    }

    /**
     * Join paths safely
     */
    static joinPath(...paths: string[]): string {
        return path.join(...paths);
    }

    /**
     * Normalize path
     */
    static normalizePath(filePath: string): string {
        return path.normalize(filePath);
    }

    /**
     * Convert file size to human readable format
     */
    static formatFileSize(bytes: number): string {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Bytes';
        
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        const size = parseFloat((bytes / Math.pow(1024, i)).toFixed(2));
        return `${size} ${sizes[i]}`;
    }

    /**
     * Backup file with timestamp
     */
    static backupFile(filePath: string): string | null {
        try {
            if (!this.exists(filePath)) {
                return null;
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const ext = this.getExtension(filePath);
            const nameWithoutExt = this.getFilenameWithoutExtension(filePath);
            const dir = path.dirname(filePath);
            
            const backupPath = path.join(dir, `${nameWithoutExt}_backup_${timestamp}${ext}`);
            
            if (this.copyFile(filePath, backupPath)) {
                return backupPath;
            }
            
            return null;
        } catch (error) {
            console.error(`Error backing up file ${filePath}:`, error);
            return null;
        }
    }

    /**
     * Read CSV file as array of objects
     */
    static readCSV(filePath: string): Record<string, string>[] | null {
        try {
            const content = this.readFile(filePath);
            if (!content) return null;

            const [headers, ...rows] = this.parseCsvRecords(content.replace(/^\uFEFF/, ''))
                .filter(record => record.some(field => field.trim()));
            if (!headers) return [];

            return rows.map(values => Object.fromEntries(
                headers.map((header, index) => [header.trim(), (values[index] ?? '').trim()])
            ));
        } catch (error) {
            console.error(`Error reading CSV file ${filePath}:`, error);
            return null;
        }
    }

    private static parseCsvRecords(content: string): string[][] {
        const records: string[][] = [];
        let record: string[] = [];
        let field = '';
        let quoted = false;
        let index = 0;

        while (index < content.length) {
            const char = content[index++];
            if (quoted && char === '"' && content[index] === '"') {
                field += char;
                index++;
            } else if (char === '"' && (quoted || field === '')) {
                quoted = !quoted;
            } else if (quoted || !',\r\n'.includes(char)) {
                field += char;
            } else if (char === ',') {
                record.push(field);
                field = '';
            } else if (char === '\n') {
                records.push([...record, field]);
                record = [];
                field = '';
            }
        }
        records.push([...record, field]);
        return records;
    }

    /**
     * Write array of objects to CSV file
     */
    static writeCSV(filePath: string, data: any[]): boolean {
        try {
            if (data.length === 0) return false;

            const headers = Object.keys(data[0]);
            let csvContent = headers.join(',') + '\n';

            data.forEach(row => {
                const values = headers.map(header => row[header] || '');
                csvContent += values.join(',') + '\n';
            });

            return this.writeFile(filePath, csvContent);
        } catch (error) {
            console.error(`Error writing CSV file ${filePath}:`, error);
            return false;
        }
    }
}
