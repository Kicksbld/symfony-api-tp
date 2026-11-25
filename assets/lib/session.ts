import type { CurrentUser } from "@/lib/types";

const STORAGE_KEY = "session";

export type Session = {
    token: string;
    expiresAt: number;
    user: CurrentUser;
};

// Le token JWT expire au bout d'une heure et l'API n'a pas de refresh token : une session expirée est oubliée.
export function loadSession(): Session | null {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) {
        return null;
    }

    const session: Session = JSON.parse(stored);
    if (session.expiresAt <= Date.now()) {
        clearSession();

        return null;
    }

    return session;
}

export function saveSession(session: Session): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
    localStorage.removeItem(STORAGE_KEY);
}
