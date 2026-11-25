import { clearSession, getSession, isCurrentSession, type Session } from "@/lib/session";

export class ApiError extends Error {
    constructor(
        public readonly status: number,
        message: string,
    ) {
        super(message);
    }
}

type ApiRequestInit = RequestInit & { session?: Session | null };

type ErrorBody = {
    message?: string;
    detail?: string;
};

/**
 * Appelle l'API en JSON avec le token du membre connecté. Une 401 sur une requête authentifiée veut dire que le
 * token a expiré si la requête appartient toujours à la session active.
 */
export async function apiFetch<T>(path: string, { session = getSession(), ...init }: ApiRequestInit = {}): Promise<T> {
    assertCurrentSession(session);
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");
    if (init.body !== undefined) {
        headers.set("Content-Type", "application/json");
    }
    if (session !== null) {
        headers.set("Authorization", `Bearer ${session.token}`);
    }

    const response = await fetch(`/api${path}`, { ...init, headers });

    assertCurrentSession(session);
    if (response.status === 401 && session !== null && clearSession(session)) {
        window.location.assign("/login");
    }
    if (!response.ok) {
        const body: ErrorBody = await response.json().catch(() => ({}));
        throw new ApiError(response.status, body.message ?? body.detail ?? response.statusText);
    }
    if (response.status === 204) {
        return undefined as T;
    }

    const data: T = await response.json();
    assertCurrentSession(session);

    return data;
}

function assertCurrentSession(session: Session | null): void {
    if (session !== null && !isCurrentSession(session)) {
        throw new DOMException("Session is no longer active.", "AbortError");
    }
}
