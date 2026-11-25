import { Pencil, Plus } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { useSaveListMutation } from "@/features/movie-lists/mutations";
import type { MovieList } from "@/features/movie-lists/types";
import { ApiError } from "@/lib/api";
import type { Session } from "@/lib/session";

const NAME_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 1000;

export function ListFormButton({ session, list, disabled = false, onSaved }: {
    session: Session;
    list?: MovieList;
    disabled?: boolean;
    onSaved?: (saved: MovieList) => void;
}) {
    const [open, setOpen] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<{ name?: string; description?: string }>({});
    const id = useId();
    const saveList = useSaveListMutation(session, list?.id);

    function changeOpen(next: boolean): void {
        if (saveList.isPending) {
            return;
        }
        if (next) {
            saveList.reset();
            setFieldErrors({});
        }
        setOpen(next);
    }

    function submit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        if (saveList.isPending) {
            return;
        }

        const form = event.currentTarget;
        const data = new FormData(form);
        const name = String(data.get("name")).trim();
        const description = String(data.get("description")).trim();
        const errors = {
            name: name === "" ? "Saisissez un nom pour la liste." : undefined,
            description: Array.from(description).length > DESCRIPTION_MAX_LENGTH
                ? `La description doit compter au maximum ${DESCRIPTION_MAX_LENGTH} caractères.`
                : undefined,
        };
        if (Array.from(name).length > NAME_MAX_LENGTH) {
            errors.name = `Le nom doit compter au maximum ${NAME_MAX_LENGTH} caractères.`;
        }
        setFieldErrors(errors);
        if (errors.name || errors.description) {
            const invalidField = form.elements.namedItem(errors.name ? "name" : "description");
            if (invalidField instanceof HTMLElement) {
                invalidField.focus();
            }
            return;
        }

        saveList.mutate({
            name,
            description: description || null,
            public: data.get("visibility") === "public",
            ranked: data.has("ranked"),
        }, {
            onSuccess: (saved) => {
                setOpen(false);
                onSaved?.(saved);
            },
        });
    }

    const Icon = list === undefined ? Plus : Pencil;
    const label = list === undefined ? "Créer une liste" : "Modifier la liste";
    const error = saveList.error;
    const details = error instanceof ApiError ? error.violations.map(({ title }) => title).join(" ") : "";

    return (
        <Dialog open={open} onOpenChange={changeOpen}>
            <DialogTrigger asChild>
                <Button variant={list === undefined ? "default" : "outline"} disabled={disabled}>
                    <Icon aria-hidden="true" />
                    {label}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{label}</DialogTitle>
                    <DialogDescription>Choisissez qui peut consulter votre liste et si les films ont un rang.</DialogDescription>
                </DialogHeader>
                {error !== null && (
                    <Alert variant="destructive" role="alert">
                        <AlertDescription>La liste n’a pas été enregistrée. {details}</AlertDescription>
                    </Alert>
                )}
                <form onSubmit={submit}>
                    <fieldset disabled={saveList.isPending} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor={`${id}-name`}>Nom</Label>
                            <Input
                                id={`${id}-name`}
                                name="name"
                                required
                                defaultValue={list?.name}
                                aria-invalid={fieldErrors.name !== undefined}
                                aria-describedby={fieldErrors.name === undefined ? undefined : `${id}-name-error`}
                                onChange={() => setFieldErrors((previous) => ({ ...previous, name: undefined }))}
                            />
                            {fieldErrors.name && <p id={`${id}-name-error`} className="text-sm text-destructive" role="alert">{fieldErrors.name}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`${id}-description`}>Description (facultative)</Label>
                            <Textarea
                                id={`${id}-description`}
                                name="description"
                                defaultValue={list?.description ?? ""}
                                aria-invalid={fieldErrors.description !== undefined}
                                aria-describedby={fieldErrors.description === undefined ? undefined : `${id}-description-error`}
                                onChange={() => setFieldErrors((previous) => ({ ...previous, description: undefined }))}
                            />
                            {fieldErrors.description && (
                                <p id={`${id}-description-error`} className="text-sm text-destructive" role="alert">{fieldErrors.description}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`${id}-visibility`}>Visibilité</Label>
                            <NativeSelect id={`${id}-visibility`} name="visibility" defaultValue={list?.public === false ? "private" : "public"}>
                                <NativeSelectOption value="public">Publique</NativeSelectOption>
                                <NativeSelectOption value="private">Privée</NativeSelectOption>
                            </NativeSelect>
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox id={`${id}-ranked`} name="ranked" defaultChecked={list?.ranked ?? false} />
                            <Label htmlFor={`${id}-ranked`}>Afficher le classement des films</Label>
                        </div>
                        <div className="flex flex-wrap justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => changeOpen(false)}>Annuler</Button>
                            <Button type="submit">{saveList.isPending ? "Enregistrement…" : list === undefined ? "Créer la liste" : "Enregistrer"}</Button>
                        </div>
                    </fieldset>
                </form>
            </DialogContent>
        </Dialog>
    );
}
