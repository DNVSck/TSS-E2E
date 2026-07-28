import * as fs from 'node:fs';
import * as path from 'node:path';
import { authStatePath } from './auth-state';
import { UserCredentials } from './credentials';

/**
 * A cross-process lock over ONE account's session.
 *
 * A single-account profile hands every worker the same login (see accountFor), so
 * two tests using it at once would replay one server session and contend. Playwright
 * has no notion of that: describe-level `mode: 'serial'` only orders tests inside one
 * block, and fullyParallel runs separate spec FILES concurrently. Workers are separate
 * processes, so the lock has to live on disk rather than in memory.
 *
 * Holding it for the test's duration lets such tests sit in ANY spec file and still
 * take turns, while every other profile keeps running in parallel around them.
 */

/** How long a lock may be held before it is assumed abandoned by a crashed worker. */
const STALE_LOCK_MS = 15 * 60_000;

/**
 * Cap on a single wait before the loop re-checks staleness. The watcher below is what
 * actually detects a release; this only bounds how long a lock left behind by a killed
 * worker can block others, since a file nobody deletes fires no watch event.
 */
const STALE_RECHECK_MS = 5_000;

/** How long a test waits for its turn before giving up with a diagnosable error. */
const DEFAULT_ACQUIRE_TIMEOUT_MS = 30 * 60_000;

interface LockFileContents {
    token: string;
    pid: number;
    test: string;
    acquiredAt: number;
}

export interface AccountLock {
    /** Milliseconds spent queueing. Give it back with testInfo.setTimeout(). */
    waitedMs: number;
    release: () => void;
}

let lockCounter = 0;

/** Same name as the account's session file, so the pairing is obvious on disk. */
function lockPathFor(account: UserCredentials): string {
    return authStatePath(account.profile, account.accountNumber).replace(/\.json$/, '.lock');
}

function readLock(lockFile: string): LockFileContents | null {
    try {
        return JSON.parse(fs.readFileSync(lockFile, 'utf8')) as LockFileContents;
    } catch {
        // Unreadable or half-written: treat as absent so the staleness check can clear it.
        return null;
    }
}

/** Signal 0 tests for existence without touching the process. EPERM means it is alive. */
function isProcessAlive(pid: number): boolean {
    try {
        process.kill(pid, 0);
        return true;
    } catch (error) {
        return (error as NodeJS.ErrnoException).code === 'EPERM';
    }
}

/** Clear a lock whose owner died, or one held far longer than any test may run. */
function clearIfStale(lockFile: string): void {
    const holder = readLock(lockFile);

    if (!fs.existsSync(lockFile)) return;

    const abandoned =
        !holder
        || !isProcessAlive(holder.pid)
        || Date.now() - holder.acquiredAt > STALE_LOCK_MS;

    if (!abandoned) return;

    try {
        fs.unlinkSync(lockFile);
    } catch {
        // Another worker cleared it first - that is the outcome we wanted anyway.
    }
}

/**
 * Create the lock file, or report that someone else holds it. The 'wx' flag makes
 * creation atomic: exactly one worker can win, however many race for it.
 */
function tryCreate(lockFile: string, contents: LockFileContents): boolean {
    try {
        fs.mkdirSync(path.dirname(lockFile), { recursive: true });
        const handle = fs.openSync(lockFile, 'wx');
        fs.writeFileSync(handle, JSON.stringify(contents));
        fs.closeSync(handle);
        return true;
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'EEXIST') return false;
        throw error;
    }
}

/**
 * Resolve once the lock file disappears, or after `timeoutMs` so the caller can
 * re-evaluate staleness. Watches the directory rather than polling, so a released
 * lock is picked up immediately instead of on the next tick of some interval.
 */
function waitForRelease(lockFile: string, timeoutMs: number): Promise<void> {
    return new Promise<void>(resolve => {
        let settled = false;
        let watcher: fs.FSWatcher | undefined;
        let timer: NodeJS.Timeout | undefined;

        const finish = (): void => {
            if (settled) return;
            settled = true;
            watcher?.close();
            if (timer) clearTimeout(timer);
            resolve();
        };

        try {
            watcher = fs.watch(path.dirname(lockFile), (_event, filename) => {
                if (filename && filename !== path.basename(lockFile)) return;
                if (!fs.existsSync(lockFile)) finish();
            });
        } catch {
            // No watcher available: the timeout below still drives the retry loop.
        }

        timer = setTimeout(finish, timeoutMs);

        // The lock may have gone between the failed create and the watcher starting.
        if (!fs.existsSync(lockFile)) finish();
    });
}

/**
 * Take the account's lock, waiting for whoever holds it. Returns how long the wait
 * took so the caller can hand that time back to the test's timeout budget - queueing
 * must not eat into what the test itself is allowed to spend.
 */
export async function acquireAccountLock(
    account: UserCredentials,
    testTitle: string,
    timeoutMs: number = DEFAULT_ACQUIRE_TIMEOUT_MS,
): Promise<AccountLock> {
    const lockFile = lockPathFor(account);
    const token = `${process.pid}-${Date.now()}-${lockCounter++}`;
    const startedAt = Date.now();

    for (;;) {
        const contents: LockFileContents = {
            token,
            pid: process.pid,
            test: testTitle,
            acquiredAt: Date.now(),
        };

        if (tryCreate(lockFile, contents)) {
            return {
                waitedMs: Date.now() - startedAt,
                release: () => releaseIfOwned(lockFile, token),
            };
        }

        clearIfStale(lockFile);

        const elapsed = Date.now() - startedAt;
        if (elapsed >= timeoutMs) {
            throw buildTimeoutError(account, lockFile, elapsed);
        }

        await waitForRelease(lockFile, Math.min(STALE_RECHECK_MS, timeoutMs - elapsed));
    }
}

/**
 * Only delete a lock this process still owns. Without the token check, a worker whose
 * lock was cleared as stale could later delete the lock its successor is holding.
 */
function releaseIfOwned(lockFile: string, token: string): void {
    if (readLock(lockFile)?.token !== token) return;

    try {
        fs.unlinkSync(lockFile);
    } catch {
        // Already gone - nothing to release.
    }
}

function buildTimeoutError(account: UserCredentials, lockFile: string, elapsed: number): Error {
    const holder = readLock(lockFile);
    const heldBy = holder
        ? `Held by pid ${holder.pid} running "${holder.test}".`
        : 'The lock file could not be read.';

    return new Error(
        `Timed out after ${Math.round(elapsed / 1000)}s waiting for the ${account.profile} account. ` +
        `${account.profile} has a single account, so its tests take turns. ${heldBy}\n` +
        `If no run is in progress, delete the stale lock: ${lockFile}\n` +
        `To stop queueing altogether, give the profile a pool: ${account.profile}_USER_NAME_1, _2, ...`
    );
}
