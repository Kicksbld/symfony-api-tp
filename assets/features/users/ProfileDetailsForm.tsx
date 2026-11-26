import { useState, type FormEvent } from "react";
import { FormField } from "@/components/FormField";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { profileErrors, type ProfileErrors, type ProfileFields } from "@/features/users/profile-editing";
import { USERNAME_PATTERN } from "@/features/users/username";

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

    return (
        <form aria-labelledby="profile-details-title" onSubmit={submit} noValidate>
            <fieldset disabled={saving} className="space-y-4">
                <h2 id="profile-details-title" className="text-lg font-semibold">Pseudo et bio</h2>
                {errors && errors.others.length > 0 && (
                    <Alert variant="destructive">
                        <AlertDescription>{errors.others.join(" ")}</AlertDescription>
                    </Alert>
                )}
                <FormField
                    id="profile-username"
                    label="Pseudo"
                    hint="3 à 20 caractères parmi les lettres minuscules, les chiffres et le signe _."
                    autoComplete="username"
                    value={values.username}
                    error={errors?.fields.username}
                    onChange={(value) => change("username", value)}
                />
                <div className="space-y-2">
                    <Label htmlFor="profile-bio">Bio</Label>
                    <Textarea
                        id="profile-bio"
                        rows={4}
                        value={values.bio}
                        aria-invalid={bioError !== undefined}
                        aria-describedby={bioError ? "profile-bio-hint profile-bio-error" : "profile-bio-hint"}
                        onChange={(event) => change("bio", event.target.value)}
                    />
                    <p id="profile-bio-hint" className="text-sm text-muted-foreground">Facultative, 500 caractères maximum.</p>
                    {bioError && <p id="profile-bio-error" className="text-sm text-destructive">{bioError}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Button type="submit" disabled={!dirty}>Enregistrer le profil</Button>
                    <span role="status" className="text-sm text-muted-foreground">{saved && "Profil enregistré."}</span>
                </div>
            </fieldset>
        </form>
    );
}
