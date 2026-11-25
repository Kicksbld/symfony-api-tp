import { useIsMutating } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
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
import { ListFormButton } from "@/features/movie-lists/ListFormButton";
import { useDeleteListMutation } from "@/features/movie-lists/mutations";
import { listDetailKey } from "@/features/movie-lists/queries";
import type { MovieList } from "@/features/movie-lists/types";
import type { Session } from "@/lib/session";

export function ListActions({ session, list }: { session: Session; list: MovieList }) {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const deleteList = useDeleteListMutation(session, list.id);
    const busy = useIsMutating({ mutationKey: listDetailKey(list.id, session) }) > 0;

    function changeOpen(next: boolean): void {
        if (deleteList.isPending) {
            return;
        }
        if (next) {
            deleteList.reset();
        }
        setOpen(next);
    }

    return (
        <div className="flex flex-wrap gap-2">
            <ListFormButton session={session} list={list} disabled={busy} />
            <AlertDialog open={open} onOpenChange={changeOpen}>
                <AlertDialogTrigger asChild>
                    <Button variant="outline" disabled={busy}>
                        <Trash2 aria-hidden="true" />
                        Supprimer la liste
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer cette liste ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            La liste « {list.name} » et les notes de ses films seront supprimées définitivement.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {deleteList.isError && (
                        <Alert variant="destructive" role="alert">
                            <AlertDescription>La suppression a échoué. Réessayez.</AlertDescription>
                        </Alert>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteList.isPending}>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            disabled={deleteList.isPending}
                            onClick={(event) => {
                                event.preventDefault();
                                deleteList.mutate(undefined, {
                                    onSuccess: () => void navigate(`/users/${list.user.username}/lists`, { replace: true }),
                                });
                            }}
                        >
                            {deleteList.isPending ? "Suppression…" : "Supprimer"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
