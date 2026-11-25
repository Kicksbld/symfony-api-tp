import { useState } from "react";
import { draftPayload, NO_ERRORS, submissionErrors, type LogEntryDraft, type LogEntryPayload } from "@/features/log-entries/draft";

/**
 * Avec une clé, le brouillon est aussi gardé dans le sessionStorage : quand la session expire pendant la saisie,
 * le membre est renvoyé vers la connexion (la page est rechargée) et retrouve son brouillon au retour sur la fiche.
 */
export function useLogEntryDraft(initialDraft: () => LogEntryDraft, storageKey?: string) {
    const [draft, setDraft] = useState(() => (storageKey === undefined ? null : readStoredDraft(storageKey)) ?? initialDraft());
    const [errors, setErrors] = useState(NO_ERRORS);

    function change(next: LogEntryDraft): void {
        setDraft(next);
        if (storageKey !== undefined) {
            sessionStorage.setItem(storageKey, JSON.stringify(next));
        }
    }

    function reset(next: LogEntryDraft): void {
        setDraft(next);
        setErrors(NO_ERRORS);
        if (storageKey !== undefined) {
            sessionStorage.removeItem(storageKey);
        }
    }

    // Renvoie false si l'envoi échoue : le brouillon reste tel quel et les erreurs s'affichent dans le formulaire.
    async function submit(send: (payload: LogEntryPayload) => Promise<unknown>, failure: string): Promise<boolean> {
        setErrors(NO_ERRORS);
        try {
            await send(draftPayload(draft));
        } catch (reason) {
            setErrors(submissionErrors(reason, failure));
            return false;
        }

        return true;
    }

    return { draft, change, errors, reset, submit };
}

// Un brouillon illisible ou d'une ancienne forme est ignoré, le formulaire repart d'un brouillon neuf.
function readStoredDraft(storageKey: string): LogEntryDraft | null {
    try {
        const value: Partial<LogEntryDraft> | null = JSON.parse(sessionStorage.getItem(storageKey) ?? "null");
        if (
            typeof value?.watchedOn === "string"
            && typeof value.rating === "string"
            && typeof value.liked === "boolean"
            && typeof value.rewatch === "boolean"
            && typeof value.review === "string"
            && typeof value.containsSpoilers === "boolean"
        ) {
            return value as LogEntryDraft;
        }
    } catch {
        // Même traitement qu'un brouillon absent.
    }

    return null;
}
