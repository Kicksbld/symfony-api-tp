import { apiFetch, type Violation } from "@/lib/api";

export const REGISTER_FIELDS = ["email", "username", "password"] as const;

export type RegisterField = (typeof REGISTER_FIELDS)[number];

export type RegisterValues = Record<RegisterField, string>;

export type RegisterErrors = {
    fields: Partial<Record<RegisterField, string>>;
    others: string[];
};

export function register(values: RegisterValues): Promise<void> {
    return apiFetch("/register", { session: null, method: "POST", body: JSON.stringify(values) });
}

// Une violation sans champ du formulaire (règle sur l'objet entier) reste affichée en haut du formulaire.
export function registerErrors(violations: Violation[]): RegisterErrors {
    const errors: RegisterErrors = { fields: {}, others: [] };
    for (const { propertyPath, title } of violations) {
        const field = REGISTER_FIELDS.find((candidate) => candidate === propertyPath);
        if (field === undefined) {
            errors.others.push(title);
        } else {
            errors.fields[field] ??= title;
        }
    }

    return errors;
}
