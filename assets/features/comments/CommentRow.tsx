import { useState } from "react";
import { Link } from "react-router";
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
import { CommentForm } from "@/features/comments/CommentForm";
import { useCommentMutation, type CommentThread, type Comment } from "@/features/comments/queries";
import type { Session } from "@/lib/session";
import { UserAvatar } from "@/features/users/UserAvatar";
import { TEXT_LINK_CLASS_NAME } from "@/lib/utils";

const COMMENT_DATE = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });

export function CommentRow({ comment, thread, ownerId, session }: {
    comment: Comment;
    thread: CommentThread;
    ownerId: number;
    session: Session | null;
}) {
    const [editing, setEditing] = useState(false);
    const canEdit = session !== null && session.user.id === comment.user.id;
    const canDelete = session !== null && (canEdit || session.user.id === ownerId);

    return (
        <li className="space-y-2 py-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <UserAvatar username={comment.user.username} className="size-7 text-[0.65rem]" />
                <Link to={`/users/${comment.user.username}`} className={`text-sm font-semibold ${TEXT_LINK_CLASS_NAME}`}>{comment.user.username}</Link>
                <time dateTime={comment.createdAt} className="text-xs text-muted-foreground">{COMMENT_DATE.format(new Date(comment.createdAt))}</time>
                {comment.updatedAt !== comment.createdAt && <span className="text-xs text-muted-foreground">Modifié</span>}
            </div>
            {editing && canEdit ? (
                <CommentForm
                    thread={thread}
                    session={session}
                    comment={comment}
                    onCancel={() => setEditing(false)}
                    onSaved={() => setEditing(false)}
                />
            ) : (
                <>
                    <p className="max-w-prose pl-10 wrap-break-word whitespace-pre-wrap text-foreground/85">{comment.content}</p>
                    {canDelete && (
                        <div className="flex flex-wrap items-center gap-2">
                            {canEdit && <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>Modifier</Button>}
                            <DeleteCommentButton thread={thread} comment={comment} session={session} />
                        </div>
                    )}
                </>
            )}
        </li>
    );
}

function DeleteCommentButton({ thread, comment, session }: { thread: CommentThread; comment: Comment; session: Session }) {
    const [open, setOpen] = useState(false);
    const remove = useCommentMutation(thread, session);

    return (
        <AlertDialog open={open} onOpenChange={(next) => {
            if (!remove.isPending) {
                if (next) {
                    remove.reset();
                }
                setOpen(next);
            }
        }}>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm">Supprimer</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer ce commentaire ?</AlertDialogTitle>
                    <AlertDialogDescription>Le commentaire de {comment.user.username} sera supprimé définitivement.</AlertDialogDescription>
                </AlertDialogHeader>
                {remove.isError && <p role="alert" className="text-sm text-destructive">La suppression a échoué. Réessayez.</p>}
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={remove.isPending}>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                        variant="destructive"
                        disabled={remove.isPending}
                        onClick={(event) => {
                            event.preventDefault();
                            remove.mutate({ method: "DELETE", id: comment.id }, { onSuccess: () => setOpen(false) });
                        }}
                    >
                        {remove.isPending ? "Suppression…" : "Supprimer"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
