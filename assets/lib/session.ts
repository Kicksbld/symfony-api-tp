import type { CurrentUser } from "@/lib/types";

const STORAGE_KEY = "session";

type StoredSession = {
    token: string;
    expiresAt: number;
    user: CurrentUser;
};

export type Session = StoredSession & { cacheId: number };

type SessionListener = (previous: Session | null) => void;

const listeners = new Set<SessionListener>();
let revision = 0;
let session: Session | null = null;
let storedSession: string | null = null;
let expiryTimer: number | undefined;

export function getSession(): Session | null {
    return session;
}

export function getSessionRevision(): number {
    return revision;
}

export function subscribeToSession(listener: SessionListener): () => void {
    listeners.add(listener);

    return () => {
        listeners.delete(listener);
    };
}

export function saveSession(value: StoredSession, expectedRevision: number): boolean {
    syncStoredSession();
    if (expectedRevision !== revision) {
        return false;
    }

    const stored = JSON.stringify(value);
    localStorage.setItem(STORAGE_KEY, stored);
    replaceSession(value, stored);

    return true;
}

export function clearSession(expected: Session): boolean {
    syncStoredSession();
    if (session !== expected) {
        return false;
    }

    forgetStoredSession();

    return true;
}

export function isCurrentSession(expected: Session): boolean {
    return session === expected
        && expected.expiresAt > Date.now()
        && localStorage.getItem(STORAGE_KEY) === storedSession;
}

function syncStoredSession(): void {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === storedSession) {
        return;
    }
    if (stored === null) {
        replaceSession(null, null);
        return;
    }

    let value: StoredSession | null = null;
    try {
        value = JSON.parse(stored);
    } catch {
        // Une session illisible est traitée comme une session expirée.
    }
    if (!value || typeof value.token !== "string" || !value.user || !(value.expiresAt > Date.now())) {
        forgetStoredSession();
        return;
    }

    replaceSession(value, stored);
}

function forgetStoredSession(): void {
    localStorage.removeItem(STORAGE_KEY);
    replaceSession(null, null);
}

function replaceSession(value: StoredSession | null, stored: string | null): void {
    const previous = session;
    revision++;
    const current = value === null ? null : { ...value, cacheId: revision };
    session = current;
    storedSession = stored;

    window.clearTimeout(expiryTimer);
    if (current !== null) {
        expiryTimer = window.setTimeout(() => clearSession(current), current.expiresAt - Date.now());
    }
    for (const listener of listeners) {
        listener(previous);
    }
}

syncStoredSession();
window.addEventListener("storage", (event) => {
    if (event.storageArea === localStorage && (event.key === STORAGE_KEY || event.key === null)) {
        syncStoredSession();
    }
});
