import { CircleCheck, NotebookPen } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/features/auth/auth";
import { draftPayload, newDraft, NO_ERRORS, submissionErrors } from "@/features/log-entries/draft";
import { LogEntryForm } from "@/features/log-entries/LogEntryForm";
import { useCreateLogEntryMutation } from "@/features/log-entries/queries";
import { authPath, returnPathFor } from "@/lib/redirect";
import type { Session } from "@/lib/session";
import type { MovieSummary } from "@/lib/types";

const BUTTON_CLASS_NAME = "h-11 px-4";

export function LogMovieButton({ movie }: { movie: MovieSummary }) {
    const { session } = useAuth();
    const location = useLocation();

    if (session === null) {
        return (
            <Button asChild className={BUTTON_CLASS_NAME}>
                <Link to={authPath("/login", returnPathFor(location))}>
                    <NotebookPen aria-hidden="true" />
                    Journaliser
                </Link>
            </Button>
        );
    }

    // La clé recrée le formulaire au changement de compte : le brouillon d'un membre ne passe pas au suivant.
    return <MemberLogMovieButton key={session.cacheId} session={session} movie={movie} />;
}

function MemberLogMovieButton({ session, movie }: { session: Session; movie: MovieSummary }) {
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState(newDraft);
    const [errors, setErrors] = useState(NO_ERRORS);
    const [logged, setLogged] = useState(false);
    const createLogEntry = useCreateLogEntryMutation(session, movie.id);

    // Fermer la fenêtre garde le brouillon, seule la confirmation d'un visionnage déjà enregistré disparaît.
    function changeOpen(next: boolean): void {
        setOpen(next);
        if (!next) {
            setLogged(false);
        }
    }

    async function submit(): Promise<void> {
        setErrors(NO_ERRORS);
        try {
            await createLogEntry.mutateAsync(draftPayload(draft));
        } catch (reason) {
            setErrors(submissionErrors(reason, "Le visionnage n'a pas été enregistré."));
            return;
        }

        setDraft(newDraft());
        setLogged(true);
    }

    return (
        <Dialog open={open} onOpenChange={changeOpen}>
            <DialogTrigger asChild>
                <Button className={BUTTON_CLASS_NAME}>
                    <NotebookPen aria-hidden="true" />
                    Journaliser
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Journaliser {movie.title}</DialogTitle>
                    <DialogDescription>Le film passe dans vos films vus et sort de votre watchlist.</DialogDescription>
                </DialogHeader>
                {logged ? (
                    <>
                        <p role="status" className="flex items-center gap-2 font-medium">
                            <CircleCheck aria-hidden="true" className="size-5 text-primary" />
                            Visionnage ajouté à votre journal.
                        </p>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline" className="h-11">
                                    Fermer
                                </Button>
                            </DialogClose>
                            <Button asChild className="h-11">
                                <Link to={`/users/${encodeURIComponent(session.user.username)}/diary`}>Voir mon journal</Link>
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <LogEntryForm
                        draft={draft}
                        errors={errors}
                        submitting={createLogEntry.isPending}
                        submitLabel="Enregistrer le visionnage"
                        onChange={setDraft}
                        onSubmit={() => void submit()}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
