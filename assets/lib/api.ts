import { clearSession, loadSession } from "@/lib/session";

export class ApiError extends Error {
    constructor(
        public readonly status: number,
        message: string,
    ) {
        super(message);
    }
}

type ErrorBody = {
    message?: string;
    detail?: string;
};

/**
 * Appelle l'API en JSON avec le token du membre connecté. Une 401 sur une requête authentifiée veut dire que le
 * token a expiré : la session est oubliée et le membre renvoyé vers la connexion.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
    const session = loadSession();
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");
    if (init.body !== undefined) {
        headers.set("Content-Type", "application/json");
    }
    if (session !== null) {
        headers.set("Authorization", `Bearer ${session.token}`);
    }

    const response = await fetch(`/api${path}`, { ...init, headers });

    if (response.status === 401 && session !== null) {
        clearSession();
        window.location.assign("/login");
    }
    if (!response.ok) {
        const body: ErrorBody = await response.json().catch(() => ({}));
        throw new ApiError(response.status, body.message ?? body.detail ?? response.statusText);
    }
    if (response.status === 204) {
        return undefined as T;
    }

    return response.json();
}
