import { Check, Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { FormField } from "@/components/FormField";
import { Field } from "@/components/form/Field";
import { fieldDescription } from "@/components/form/field-description";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { profileErrors, type ProfileErrors, type ProfileFields } from "@/features/users/profile-editing";
import { UserAvatar } from "@/features/users/UserAvatar";
import { USERNAME_PATTERN } from "@/features/users/username";

// Même limite que l'API.
const BIO_MAX_LENGTH = 500;

type ProfileDetailsFormProps = {
    username: string;
    bio: string;
    saving: boolean;
    onSave: (fields: Partial<ProfileFields>) => Promise<unknown>;
};

export function ProfileDetailsForm({ username, bio, saving, onSave }: ProfileDetailsFormProps) {
    const [draft, setDraft] = useState<Partial<ProfileFields>>({});
    const [errors, setErrors] = useState<ProfileErrors | null>(null);
    const [saved, setSaved] = useState(false);
    const values = { username, bio, ...draft };
    const dirty = values.username !== username || values.bio !== bio;

    function change(field: keyof ProfileFields, value: string): void {
        setDraft((previous) => ({ ...previous, [field]: value }));
        setErrors((previous) => previous === null ? null : { fields: { ...previous.fields, [field]: undefined }, others: [] });
        setSaved(false);
    }

    async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();
        if (saving || !dirty) {
            return;
        }
        setErrors(null);
        setSaved(false);

        const fields: Partial<ProfileFields> = {};
        if (values.username !== username) {
            if (!USERNAME_PATTERN.test(values.username)) {
                setErrors({ fields: { username: "Choisissez un pseudo de 3 à 20 caractères." }, others: [] });
                return;
            }
            fields.username = values.username;
        }
        if (values.bio !== bio) {
            fields.bio = values.bio;
        }

        try {
            await onSave(fields);
            setDraft({});
            setSaved(true);
        } catch (error) {
            setErrors(profileErrors(error));
        }
    }

    const bioError = errors?.fields.bio;
    // Aperçu de l'avatar : il suit le pseudo tapé tant qu'il reste valide.
    const previewName = USERNAME_PATTERN.test(values.username) ? values.username : username;

    return (
        <form aria-labelledby="profile-details-title" onSubmit={submit} noValidate>
            <fieldset disabled={saving} className="space-y-6">
                <div className="flex items-center gap-4">
                    <UserAvatar username={previewName} className="size-16 text-xl" />
                    <div>
                        <h2 id="profile-details-title" className="text-2xl font-bold">
                            Pseudo et bio
                        </h2>
                        <p className="text-sm text-muted-foreground">Votre avatar reprend les deux premières lettres du pseudo.</p>
                    </div>
                </div>
                {errors && errors.others.length > 0 && (
                    <Alert variant="destructive">
                        <AlertDescription>{errors.others.join(" ")}</AlertDescription>
                    </Alert>
                )}
                <FormField
                    id="profile-username"
                    label="Pseudo"
                    hint="3 à 20 caractères : lettres minuscules, chiffres et _."
                    autoComplete="username"
                    value={values.username}
                    error={errors?.fields.username}
                    onChange={(value) => change("username", value)}
                />
                <Field id="profile-bio" label="Bio" optional error={bioError} count={{ value: values.bio.length, max: BIO_MAX_LENGTH }}>
                    <Textarea
                        id="profile-bio"
                        rows={4}
                        placeholder="Vos genres préférés, vos réalisateurs fétiches…"
                        value={values.bio}
                        aria-invalid={bioError !== undefined}
                        aria-describedby={fieldDescription("profile-bio", { error: bioError })}
                        onChange={(event) => change("bio", event.target.value)}
                    />
                </Field>
                <div className="flex flex-wrap items-center gap-3">
                    <Button type="submit" className="h-11 rounded-full px-6" disabled={!dirty}>
                        {saving && <Loader2 aria-hidden="true" className="animate-spin" />}
                        {saving ? "Enregistrement…" : "Enregistrer le profil"}
                    </Button>
                    <span role="status" className="inline-flex items-center gap-1.5 text-sm text-primary">
                        {saved && (
                            <>
                                <Check aria-hidden="true" className="size-4" />
                                Profil enregistré
                            </>
                        )}
                    </span>
                </div>
            </fieldset>
        </form>
    );
}
