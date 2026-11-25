import { useState, type FormEvent } from "react";
import { Link, Navigate, useSearchParams } from "react-router";
import { FormField } from "@/components/FormField";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/features/auth/auth";
import { register, registerErrors, type RegisterErrors, type RegisterField, type RegisterValues } from "@/features/auth/register";
import { ApiError } from "@/lib/api";
import { authPath, redirectTarget } from "@/lib/redirect";

const NO_ERRORS: RegisterErrors = { fields: {}, others: [] };

export function RegisterPage() {
    const { session, login } = useAuth();
    const [searchParams] = useSearchParams();
    const target = redirectTarget(searchParams);
    const [values, setValues] = useState<RegisterValues>({ email: "", username: "", password: "" });
    const [errors, setErrors] = useState<RegisterErrors>(NO_ERRORS);
    const [submitting, setSubmitting] = useState(false);
    const [loginFailed, setLoginFailed] = useState(false);

    if (session !== null) {
        return <Navigate to={target} replace />;
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();
        setSubmitting(true);
        setErrors(NO_ERRORS);

        try {
            await registerThenLogin();
        } finally {
            setSubmitting(false);
        }
    }

    async function registerThenLogin(): Promise<void> {
        try {
            await register(values);
        } catch (reason) {
            const failed = reason instanceof ApiError && reason.status === 422;
            setErrors(failed ? registerErrors(reason.violations) : { fields: {}, others: ["L'inscription a échoué, réessayez."] });
            return;
        }

        // Le compte existe déjà à ce stade : si la connexion échoue, on propose de se connecter plutôt que de
        // laisser le formulaire renvoyer une erreur « email déjà utilisé ».
        try {
            await login(values.email, values.password);
        } catch {
            setLoginFailed(true);
        }
    }

    function updateField(field: RegisterField): (value: string) => void {
        return (value) => setValues((previous) => ({ ...previous, [field]: value }));
    }

    return (
        <Card className="mx-auto max-w-sm">
            <CardHeader>
                <CardTitle>Inscription</CardTitle>
                <CardDescription>Tenez votre journal de films, notez-les et suivez d'autres membres.</CardDescription>
            </CardHeader>
            <CardContent>
                {loginFailed ? (
                    <Alert>
                        <AlertDescription>
                            Votre compte est créé, mais la connexion a échoué.
                            <Button asChild size="sm" className="mt-2 justify-self-start">
                                <Link to={authPath("/login", target)} state={{ email: values.email }}>
                                    Se connecter
                                </Link>
                            </Button>
                        </AlertDescription>
                    </Alert>
                ) : (
                    // noValidate : les règles sont celles de l'API, ses messages s'affichent sous chaque champ.
                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                        {errors.others.length > 0 && (
                            <Alert variant="destructive">
                                <AlertDescription>{errors.others.join(" ")}</AlertDescription>
                            </Alert>
                        )}
                        <FormField
                            id="register-email"
                            label="Email"
                            type="email"
                            autoComplete="email"
                            value={values.email}
                            error={errors.fields.email}
                            onChange={updateField("email")}
                        />
                        <FormField
                            id="register-username"
                            label="Pseudo"
                            hint="3 à 20 caractères : minuscules, chiffres et _."
                            autoComplete="username"
                            value={values.username}
                            error={errors.fields.username}
                            onChange={updateField("username")}
                        />
                        <FormField
                            id="register-password"
                            label="Mot de passe"
                            hint="8 caractères minimum."
                            type="password"
                            autoComplete="new-password"
                            value={values.password}
                            error={errors.fields.password}
                            onChange={updateField("password")}
                        />
                        <Button type="submit" className="w-full" disabled={submitting}>
                            Créer mon compte
                        </Button>
                        <p className="text-center text-sm text-muted-foreground">
                            Déjà membre ?{" "}
                            <Link to={authPath("/login", target)} className="text-primary underline-offset-4 hover:underline">
                                Se connecter
                            </Link>
                        </p>
                    </form>
                )}
            </CardContent>
        </Card>
    );
}
