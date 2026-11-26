import { Globe, List, ListOrdered, Loader2, LockKeyhole, Pencil, Plus } from "lucide-react";
import { useId, useRef, useState, type FormEvent } from "react";
import { ChoiceCards, type Choice } from "@/components/form/ChoiceCards";
import { Field } from "@/components/form/Field";
import { fieldDescription } from "@/components/form/field-description";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSaveListMutation } from "@/features/movie-lists/mutations";
import type { MovieList } from "@/features/movie-lists/types";
import { ApiError } from "@/lib/api";
import type { Session } from "@/lib/session";

const NAME_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 1000;

type Visibility = "public" | "private";
type Kind = "unranked" | "ranked";

const VISIBILITY_CHOICES: Choice<Visibility>[] = [
    { value: "public", label: "Publique", description: "Visible par tous, dans l'annuaire des listes et sur votre profil.", icon: Globe },
    { value: "private", label: "Privée", description: "Visible seulement par vous.", icon: LockKeyhole },
];

const KIND_CHOICES: Choice<Kind>[] = [
    { value: "unranked", label: "Liste simple", description: "Les films sans ordre particulier.", icon: List },
    { value: "ranked", label: "Classement", description: "Chaque film affiche sa position, comme un top.", icon: ListOrdered },
];

type ListValues = { name: string; description: string; visibility: Visibility; kind: Kind };

function initialValues(list?: MovieList): ListValues {
    return {
        name: list?.name ?? "",
        description: list?.description ?? "",
        visibility: list?.public === false ? "private" : "public",
        kind: list?.ranked === true ? "ranked" : "unranked",
    };
}

export function ListFormButton({ session, list, disabled = false, onSaved }: {
    session: Session;
    list?: MovieList;
    disabled?: boolean;
    onSaved?: (saved: MovieList) => void;
}) {
    const [open, setOpen] = useState(false);
    const [values, setValues] = useState(() => initialValues(list));
    const [fieldErrors, setFieldErrors] = useState<{ name?: string; description?: string }>({});
    const id = useId();
    const nameRef = useRef<HTMLInputElement>(null);
    const descriptionRef = useRef<HTMLTextAreaElement>(null);
    const saveList = useSaveListMutation(session, list?.id);

    // Chaque ouverture repart de la liste enregistrée : une saisie abandonnée n'est pas gardée.
    function changeOpen(next: boolean): void {
        if (saveList.isPending) {
            return;
        }
        if (next) {
            saveList.reset();
            setValues(initialValues(list));
            setFieldErrors({});
        }
        setOpen(next);
    }

    function change<TField extends keyof ListValues>(field: TField, value: ListValues[TField]): void {
        setValues((previous) => ({ ...previous, [field]: value }));
        if (field === "name" || field === "description") {
            setFieldErrors((previous) => ({ ...previous, [field]: undefined }));
        }
    }

    function submit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        if (saveList.isPending) {
            return;
        }

        const name = values.name.trim();
        const description = values.description.trim();
        const errors = {
            name: name === "" ? "Donnez un nom à la liste." : Array.from(name).length > NAME_MAX_LENGTH ? `Le nom doit compter au maximum ${NAME_MAX_LENGTH} caractères.` : undefined,
            description: Array.from(description).length > DESCRIPTION_MAX_LENGTH ? `La description doit compter au maximum ${DESCRIPTION_MAX_LENGTH} caractères.` : undefined,
        };
        setFieldErrors(errors);
        if (errors.name !== undefined || errors.description !== undefined) {
            (errors.name !== undefined ? nameRef : descriptionRef).current?.focus();
            return;
        }

        saveList.mutate({
            name,
            description: description || null,
            public: values.visibility === "public",
            ranked: values.kind === "ranked",
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
                <Button variant={list === undefined ? "default" : "outline"} className="h-10 rounded-full px-5" disabled={disabled}>
                    <Icon aria-hidden="true" />
                    {label}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{label}</DialogTitle>
                    <DialogDescription>Vous pourrez ajouter et réordonner les films depuis la page de la liste.</DialogDescription>
                </DialogHeader>
                {error !== null && (
                    <Alert variant="destructive" role="alert">
                        <AlertDescription>La liste n’a pas été enregistrée. {details}</AlertDescription>
                    </Alert>
                )}
                <form onSubmit={submit} noValidate>
                    <fieldset disabled={saveList.isPending} className="space-y-6">
                        <Field id={`${id}-name`} label="Nom" error={fieldErrors.name} count={{ value: values.name.length, max: NAME_MAX_LENGTH }}>
                            <Input
                                ref={nameRef}
                                id={`${id}-name`}
                                required
                                placeholder="Ex. : Mes films de chevet"
                                value={values.name}
                                aria-invalid={fieldErrors.name !== undefined}
                                aria-describedby={fieldDescription(`${id}-name`, { error: fieldErrors.name })}
                                onChange={(event) => change("name", event.target.value)}
                            />
                        </Field>
                        <Field
                            id={`${id}-description`}
                            label="Description"
                            optional
                            error={fieldErrors.description}
                            count={{ value: values.description.length, max: DESCRIPTION_MAX_LENGTH }}
                        >
                            <Textarea
                                ref={descriptionRef}
                                id={`${id}-description`}
                                rows={3}
                                placeholder="Ce qui relie ces films."
                                value={values.description}
                                aria-invalid={fieldErrors.description !== undefined}
                                aria-describedby={fieldDescription(`${id}-description`, { error: fieldErrors.description })}
                                onChange={(event) => change("description", event.target.value)}
                            />
                        </Field>
                        <ChoiceCards name={`${id}-visibility`} legend="Visibilité" choices={VISIBILITY_CHOICES} value={values.visibility} onChange={(value) => change("visibility", value)} />
                        <ChoiceCards name={`${id}-kind`} legend="Type de liste" choices={KIND_CHOICES} value={values.kind} onChange={(value) => change("kind", value)} />
                        <DialogFooter>
                            <Button type="button" variant="ghost" className="h-11 rounded-full px-5" onClick={() => changeOpen(false)}>
                                Annuler
                            </Button>
                            <Button type="submit" className="h-11 rounded-full px-6">
                                {saveList.isPending && <Loader2 aria-hidden="true" className="animate-spin" />}
                                {saveList.isPending ? "Enregistrement…" : list === undefined ? "Créer la liste" : "Enregistrer"}
                            </Button>
                        </DialogFooter>
                    </fieldset>
                </form>
            </DialogContent>
        </Dialog>
    );
}
