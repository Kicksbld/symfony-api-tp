import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useListCommentMutation } from "@/features/movie-lists/comments";
import type { ListComment } from "@/features/movie-lists/types";
import { ApiError } from "@/lib/api";
import type { Session } from "@/lib/session";

const MAX_CONTENT_LENGTH = 1000;
const CONTENT_LENGTH_HINT = `${MAX_CONTENT_LENGTH.toLocaleString("fr-FR")} caractères maximum`;

export function ListCommentForm({ listId, session, comment, onCancel, onSaved }: {
    listId: number;
    session: Session;
    comment?: ListComment;
    onCancel?: () => void;
    onSaved: () => void;
}) {
    const id = useId();
    const save = useListCommentMutation(listId, session);
    const [content, setContent] = useState(comment?.content ?? "");
    const [error, setError] = useState("");
    const editing = comment !== undefined;

    function submit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        if (save.isPending) {
            return;
        }
        const text = content.trim();
        if (text === "") {
            setError("Écrivez un commentaire.");
            return;
        }
        if ([...text].length > MAX_CONTENT_LENGTH) {
            setError(`Le commentaire est trop long (${CONTENT_LENGTH_HINT}).`);
            return;
        }

        setError("");
        save.mutate(editing ? { method: "PATCH", id: comment.id, content: text } : { method: "POST", content: text }, {
            onSuccess: () => {
                setContent("");
                onSaved();
            },
            onError: (failure) => {
                if (failure instanceof ApiError && failure.status === 422) {
                    setError(`Vérifiez que le commentaire n’est pas vide et respecte la limite (${CONTENT_LENGTH_HINT}).`);
                    return;
                }
                setError(editing ? "La modification a échoué. Réessayez." : "La publication a échoué. Réessayez.");
            },
        });
    }

    return (
        <form className="max-w-prose space-y-2" onSubmit={submit}>
            <Label htmlFor={id}>{editing ? "Modifier le commentaire" : "Ajouter un commentaire"}</Label>
            <Textarea
                id={id}
                rows={3}
                value={content}
                disabled={save.isPending}
                aria-invalid={error !== ""}
                aria-describedby={error ? `${id}-hint ${id}-error` : `${id}-hint`}
                onChange={(event) => {
                    setContent(event.target.value);
                    setError("");
                }}
            />
            <p id={`${id}-hint`} className="text-xs text-muted-foreground">{CONTENT_LENGTH_HINT}</p>
            {error && <p id={`${id}-error`} className="text-sm text-destructive" role="alert">{error}</p>}
            <div className="flex flex-wrap gap-2">
                <Button type="submit" size="sm" disabled={save.isPending}>{editing ? "Enregistrer" : "Publier"}</Button>
                {onCancel && <Button type="button" variant="ghost" size="sm" disabled={save.isPending} onClick={onCancel}>Annuler</Button>}
            </div>
        </form>
    );
}
