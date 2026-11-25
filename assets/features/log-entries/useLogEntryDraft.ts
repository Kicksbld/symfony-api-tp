import { useState } from "react";
import { draftPayload, NO_ERRORS, submissionErrors, type LogEntryDraft, type LogEntryPayload } from "@/features/log-entries/draft";

export function useLogEntryDraft(initialDraft: () => LogEntryDraft) {
    const [draft, setDraft] = useState(initialDraft);
    const [errors, setErrors] = useState(NO_ERRORS);

    function reset(next: LogEntryDraft): void {
        setDraft(next);
        setErrors(NO_ERRORS);
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

    return { draft, setDraft, errors, reset, submit };
}
