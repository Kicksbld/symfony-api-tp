import { authPath, returnPathFor } from "@/lib/redirect";
import { clearSession, getSession, isCurrentSession, type Session } from "@/lib/session";

export type Violation = {
    propertyPath: string;
    title: string;
};

export class ApiError extends Error {
    constructor(
        public readonly status: number,
        message: string,
        public readonly violations: Violation[] = [],
    ) {
        super(message);
    }
}

export type FormErrors<TField extends string> = {
    fields: Partial<Record<TField, string>>;
    others: string[];
};

// Une violation sans champ du formulaire (règle sur l'objet entier) reste affichée en haut du formulaire.
export function formErrors<TField extends string>(violations: Violation[], fields: readonly TField[]): FormErrors<TField> {
    const errors: FormErrors<TField> = { fields: {}, others: [] };
    for (const { propertyPath, title } of violations) {
        const field = fields.find((candidate) => candidate === propertyPath);
        if (field === undefined) {
            errors.others.push(title);
        } else {
            errors.fields[field] ??= title;
        }
    }

    return errors;
}

type ApiRequestInit =RequestInit & { session?: Session | null };

type ErrorBody = {
    message?: string;
    detail?: string;
    violations?: Violation[];
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
        window.location.assign(authPath("/login", returnPathFor(window.location)));
    }
    if (!response.ok) {
        const body: ErrorBody = await response.json().catch(() => ({}));
        throw new ApiError(response.status, body.message ?? body.detail ?? response.statusText, body.violations);
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
