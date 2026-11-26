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
            <LogEntryDialogContent movie={movie} title="Journaliser" description="Le film passe dans vos films vus et sort de votre watchlist.">
                {logged ? (
                    <>
                        <div role="status" className="flex flex-col items-center gap-3 py-6 text-center">
                            <span className="flex size-14 items-center justify-center rounded-full bg-primary/15 text-primary">
                                <CircleCheck aria-hidden="true" className="size-7" />
                            </span>
                            <p className="text-lg font-bold">Visionnage ajouté à votre journal</p>
                            <p className="text-sm text-muted-foreground">Le film est dans vos films vus et sorti de votre watchlist.</p>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="ghost" className="h-11 rounded-full px-5">
                                    Fermer
                                </Button>
                            </DialogClose>
                            <Button asChild className="h-11 rounded-full px-5">
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
