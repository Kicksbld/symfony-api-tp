import { Pencil, Trash2 } from "lucide-react";
import { useState, type MouseEvent } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/features/auth/auth";
import { draftFromEntry, draftPayload, NO_ERRORS, submissionErrors } from "@/features/log-entries/draft";
import { formatDate } from "@/features/log-entries/format";
import { LogEntryForm } from "@/features/log-entries/LogEntryForm";
import { useDeleteLogEntryMutation, useUpdateLogEntryMutation } from "@/features/log-entries/queries";
import type { Session } from "@/lib/session";
import type { LogEntry } from "@/lib/types";

const BUTTON_CLASS_NAME = "h-9";

// Seul l'auteur voit les contrôles. L'API vérifie aussi les droits et renverrait une 403 aux autres.
export function LogEntryActions({ entry }: { entry: LogEntry }) {
    const { session } = useAuth();

    if (session === null || session.user.id !== entry.user.id) {
        return null;
    }

    return (
        <div key={session.cacheId} className="flex flex-wrap gap-2">
            <EditLogEntryButton session={session} entry={entry} />
            <DeleteLogEntryButton session={session} entry={entry} />
        </div>
    );
}

function EditLogEntryButton({ session, entry }: { session: Session; entry: LogEntry }) {
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState(() => draftFromEntry(entry));
    const [errors, setErrors] = useState(NO_ERRORS);
    const updateLogEntry = useUpdateLogEntryMutation(session, entry);

    // Chaque ouverture repart de l'entrée enregistrée, un brouillon abandonné n'est pas gardé.
    function changeOpen(next: boolean): void {
        if (next) {
            setDraft(draftFromEntry(entry));
            setErrors(NO_ERRORS);
        }
        setOpen(next);
    }

    async function submit(): Promise<void> {
        setErrors(NO_ERRORS);
        try {
            await updateLogEntry.mutateAsync(draftPayload(draft));
        } catch (reason) {
            setErrors(submissionErrors(reason, "Les modifications n'ont pas été enregistrées."));
            return;
        }

        setOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={changeOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className={BUTTON_CLASS_NAME}>
                    <Pencil aria-hidden="true" />
                    Modifier
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Modifier le visionnage de {entry.movie.title}</DialogTitle>
                    <DialogDescription>Votre note et votre coup de cœur sur le film suivent votre dernière entrée.</DialogDescription>
                </DialogHeader>
                <LogEntryForm
                    draft={draft}
                    errors={errors}
                    submitting={updateLogEntry.isPending}
                    submitLabel="Enregistrer les modifications"
                    onChange={setDraft}
                    onSubmit={() => void submit()}
                />
            </DialogContent>
        </Dialog>
    );
}

function DeleteLogEntryButton({ session, entry }: { session: Session; entry: LogEntry }) {
    const [open, setOpen] = useState(false);
    const deleteLogEntry = useDeleteLogEntryMutation(session, entry);
    const watchedOn = entry.watchedOn === null ? "" : ` du ${formatDate(entry.watchedOn)}`;

    function changeOpen(next: boolean): void {
        if (next) {
            deleteLogEntry.reset();
        }
        setOpen(next);
    }

    // La fenêtre reste ouverte pendant l'envoi pour pouvoir afficher une éventuelle erreur.
    function confirm(event: MouseEvent<HTMLButtonElement>): void {
        event.preventDefault();
        if (!deleteLogEntry.isPending) {
            deleteLogEntry.mutate(undefined, { onSuccess: () => setOpen(false) });
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={changeOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className={BUTTON_CLASS_NAME}>
                    <Trash2 aria-hidden="true" />
                    Supprimer
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer cette entrée ?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Le visionnage de {entry.movie.title}
                        {watchedOn} sera retiré de votre journal. Le film reste dans vos films vus, avec votre note et votre coup de cœur.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                {deleteLogEntry.error !== null && (
                    <Alert variant="destructive">
                        <AlertDescription>La suppression a échoué. {deleteLogEntry.error.message}</AlertDescription>
                    </Alert>
                )}
                <AlertDialogFooter>
                    <AlertDialogCancel className="h-11">Annuler</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" className="h-11" aria-busy={deleteLogEntry.isPending} onClick={confirm}>
                        Supprimer
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
