import { apiFetch, formErrors, type FormErrors, type Violation } from "@/lib/api";

const REGISTER_FIELDS = ["email", "username", "password"] as const;

export type RegisterField = (typeof REGISTER_FIELDS)[number];

export type RegisterValues = Record<RegisterField, string>;

export type RegisterErrors = FormErrors<RegisterField>;

export function register(values: RegisterValues): Promise<void> {
    return apiFetch("/register", { session: null, method: "POST", body: JSON.stringify(values) });
}

export function registerErrors(violations: Violation[]): RegisterErrors {
    return formErrors(violations, REGISTER_FIELDS);
}
