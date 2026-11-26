import { cn } from "cn";
import { CircleCheck, NotebookPen } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/features/auth/auth";
import { newDraft } from "@/features/log-entries/draft";
import { LogEntryDialogContent, LogEntryForm } from "@/features/log-entries/LogEntryForm";
import { useCreateLogEntryMutation } from "@/features/log-entries/queries";
import { useLogEntryDraft } from "@/features/log-entries/useLogEntryDraft";
import { authPath, returnPathFor } from "@/lib/redirect";
import type { Session } from "@/lib/session";
import type { MovieSummary } from "@/lib/types";

const BUTTON_CLASS_NAME = "h-11 rounded-full px-5 text-base";

export function LogMovieButton({ movie, className }: { movie: MovieSummary; className?: string }) {
    const { session } = useAuth();
    const location = useLocation();

    if (session === null) {
        return (
            <Button asChild className={cn(BUTTON_CLASS_NAME, className)}>
                <Link to={authPath("/login", returnPathFor(location))}>
                    <NotebookPen aria-hidden="true" />
                    Journaliser
                </Link>
            </Button>
        );
    }

    // La clé recrée le formulaire au changement de compte : le brouillon d'un membre ne passe pas au suivant.
    return <MemberLogMovieButton key={session.cacheId} session={session} movie={movie} className={className} />;
}

function MemberLogMovieButton({ session, movie, className }: { session: Session; movie: MovieSummary; className?: string }) {
    const [open, setOpen] = useState(false);
    const { draft, change, errors, reset, submit } = useLogEntryDraft(newDraft, `log-entry-draft:${session.user.id}:${movie.id}`);
    const [logged, setLogged] = useState(false);
    const createLogEntry = useCreateLogEntryMutation(session, movie.id);

    // Fermer la fenêtre garde le brouillon, seule la confirmation d'un visionnage déjà enregistré disparaît.
    function changeOpen(next: boolean): void {
        setOpen(next);
        if (!next) {
            setLogged(false);
        }
    }

    async function save(): Promise<void> {
        if (await submit(createLogEntry.mutateAsync, "Le visionnage n'a pas été enregistré.")) {
            reset(newDraft());
            setLogged(true);
        }
    }

    return (
        <Dialog open={open} onOpenChange={changeOpen}>
            <DialogTrigger asChild>
                <Button className={cn(BUTTON_CLASS_NAME, className)}>
                    <NotebookPen aria-hidden="true" />
                    Journaliser
                </Button>
            </DialogTrigger>
            <LogEntryDialogContent title={`Journaliser ${movie.title}`} description="Le film passe dans vos films vus et sort de votre watchlist.">
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
                        onChange={change}
                        onSubmit={() => void save()}
                    />
                )}
            </LogEntryDialogContent>
        </Dialog>
    );
}
