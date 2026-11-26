import { ApiError, formErrors, type FormErrors } from "@/lib/api";
import type { LogEntry } from "@/lib/types";

const DRAFT_FIELDS = ["watchedOn", "rating", "review"] as const;

export type DraftErrors = FormErrors<(typeof DRAFT_FIELDS)[number]>;

export const NO_ERRORS: DraftErrors = { fields: {}, others: [] };

// La note reste une chaîne tant qu'elle est dans le formulaire : « » veut dire « pas de note ».
export type LogEntryDraft = {
    watchedOn: string;
    rating: string;
    liked: boolean;
    rewatch: boolean;
    review: string;
    containsSpoilers: boolean;
};

export type LogEntryPayload = {
    watchedOn: string;
    rating: number | null;
    liked: boolean;
    rewatch: boolean;
    review: string | null;
    containsSpoilers: boolean;
};

// Le champ date attend le jour local : toISOString() donnerait celui de Greenwich, qui peut être la veille ou le lendemain.
export function localDate(daysAgo = 0): string {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${date.getFullYear()}-${month}-${day}`;
}

export function newDraft(): LogEntryDraft {
    return { watchedOn: localDate(), rating: "", liked: false, rewatch: false, review: "", containsSpoilers: false };
}

export function draftFromEntry(entry: LogEntry): LogEntryDraft {
    return {
        watchedOn: entry.watchedOn ?? "",
        rating: entry.rating === null ? "" : String(entry.rating),
        liked: entry.liked,
        rewatch: entry.rewatch,
        review: entry.review ?? "",
        containsSpoilers: entry.containsSpoilers,
    };
}

// Tous les champs sont envoyés, y compris en modification : une note ou une critique effacée part à null.
export function draftPayload(draft: LogEntryDraft): LogEntryPayload {
    const review = draft.review.trim() === "" ? null : draft.review;

    return {
        watchedOn: draft.watchedOn,
        rating: draft.rating === "" ? null : Number(draft.rating),
        liked: draft.liked,
        rewatch: draft.rewatch,
        review,
        containsSpoilers: review !== null && draft.containsSpoilers,
    };
}

// Une 422 place chaque message sous son champ, les autres erreurs s'affichent en haut du formulaire.
export function submissionErrors(reason: unknown, failure: string): DraftErrors {
    if (reason instanceof ApiError && reason.status === 422) {
        return formErrors(reason.violations, DRAFT_FIELDS);
    }

    return { fields: {}, others: [reason instanceof Error ? `${failure} ${reason.message}` : failure] };
}
