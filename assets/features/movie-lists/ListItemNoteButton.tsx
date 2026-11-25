import { useId, useState, type FormEvent } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { MovieListItem } from "@/features/movie-lists/types";

const NOTE_MAX_LENGTH = 1000;

export function ListItemNoteButton({ item, disabled, onSave }: {
    item: MovieListItem;
    disabled: boolean;
    onSave: (note: string | null) => Promise<void>;
}) {
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [failed, setFailed] = useState(false);
    const [noteError, setNoteError] = useState<string>();
    const id = useId();
    const label = item.note === null ? "Ajouter une note" : "Modifier la note";

    function changeOpen(next: boolean): void {
        if (!saving) {
            setOpen(next);
            setFailed(false);
            setNoteError(undefined);
        }
    }

    async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();
        if (disabled || saving) {
            return;
        }
        const form = event.currentTarget;
        const note = String(new FormData(form).get("note")).trim();
        setFailed(false);
        if (Array.from(note).length > NOTE_MAX_LENGTH) {
            setNoteError(`La note doit compter au maximum ${NOTE_MAX_LENGTH} caractères.`);
            form.querySelector("textarea")?.focus();
            return;
        }

        setSaving(true);
        try {
            await onSave(note || null);
            setOpen(false);
        } catch {
            setFailed(true);
        } finally {
            setSaving(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={changeOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={disabled} aria-label={`${label} pour ${item.movie.title}`}>{label}</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90dvh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{label}</DialogTitle>
                    <DialogDescription>{item.movie.title}. Laissez le champ vide pour retirer la note.</DialogDescription>
                </DialogHeader>
                {failed && (
                    <Alert variant="destructive" role="alert">
                        <AlertDescription>La note n’a pas été enregistrée. Réessayez.</AlertDescription>
                    </Alert>
                )}
                <form onSubmit={(event) => void submit(event)}>
                    <fieldset disabled={saving} className="space-y-3">
                        <div className="space-y-2">
                            <Label htmlFor={id}>Note</Label>
                            <Textarea
                                id={id}
                                name="note"
                                defaultValue={item.note ?? ""}
                                aria-invalid={noteError !== undefined}
                                aria-describedby={noteError === undefined ? undefined : `${id}-error`}
                                onChange={() => setNoteError(undefined)}
                            />
                            {noteError && <p id={`${id}-error`} className="text-sm text-destructive" role="alert">{noteError}</p>}
                        </div>
                        <div className="flex flex-wrap justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => changeOpen(false)}>Annuler</Button>
                            <Button type="submit" disabled={disabled}>{saving ? "Enregistrement…" : "Enregistrer"}</Button>
                        </div>
                    </fieldset>
                </form>
            </DialogContent>
        </Dialog>
    );
}
