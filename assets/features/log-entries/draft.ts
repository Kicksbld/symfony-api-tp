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

export const RATING_CHOICES = Array.from({ length: 10 }, (_, index) => (index + 1) / 2);

// Le champ date attend le jour local : toISOString() donnerait celui de Greenwich, qui peut être la veille ou le lendemain.
export function localToday(): string {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${today.getFullYear()}-${month}-${day}`;
}

export function newDraft(): LogEntryDraft {
    return { watchedOn: localToday(), rating: "", liked: false, rewatch: false, review: "", containsSpoilers: false };
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
