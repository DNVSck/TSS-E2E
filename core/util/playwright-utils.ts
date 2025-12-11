export class PlaywrightUtils {
    /**
     * Retry until the provided function succeeds or timeout is reached
     */
    static async retry<T>(
        fn: () => Promise<T>,
        timeoutMs = 5000,
        intervalMs = 300
    ): Promise<T> {
        const start = Date.now();
        let lastError;

        while (Date.now() - start < timeoutMs) {
            try {
                return await fn();
            } catch (err) {
                lastError = err;
                await new Promise(res => setTimeout(res, intervalMs));
            }
        }

        throw new Error(`Retry exhausted after ${timeoutMs}ms: ${lastError}`);
    }
}
