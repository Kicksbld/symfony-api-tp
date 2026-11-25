import { useState, type FormEvent } from "react";
import { Link, Navigate, useSearchParams } from "react-router";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, apiFetch, type Violation } from "@/lib/api";
import { useAuth } from "@/features/auth/auth";
import { authPath, redirectTarget } from "@/features/auth/redirect";

type Field = "email" | "username" | "password";

type FieldErrors = Partial<Record<Field, string>>;

const FIELDS: Field[] = ["email", "username", "password"];

export function RegisterPage() {
    const { session, login } = useAuth();
    const [searchParams] = useSearchParams();
    const target = redirectTarget(searchParams);
    const [values, setValues] = useState<Record<Field, string>>({ email: "", username: "", password: "" });
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [loginFailed, setLoginFailed] = useState(false);

    if (session !== null) {
        return <Navigate to={target} replace />;
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();
        setSubmitting(true);
        setFieldErrors({});
        setError(null);

        try {
            await apiFetch("/register", { session: null, method: "POST", body: JSON.stringify(values) });
        } catch (reason) {
            if (reason instanceof ApiError && reason.status === 422) {
                const { byField, others } = groupViolations(reason.violations);
                setFieldErrors(byField);
                setError(others.length > 0 ? others.join(" ") : null);
            } else {
                setError("L'inscription a échoué, réessayez.");
            }
            setSubmitting(false);
            return;
        }

        // Le compte existe déjà à ce stade : si la connexion échoue, on propose de se connecter plutôt que de
        // laisser le formulaire renvoyer une erreur « email déjà utilisé ».
        try {
            await login(values.email, values.password);
        } catch {
            setLoginFailed(true);
        } finally {
            setSubmitting(false);
        }
    }

    function updateField(field: Field, value: string): void {
        setValues((previous) => ({ ...previous, [field]: value }));
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
                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                        {error !== null && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <FormField
                            field="email"
                            label="Email"
                            type="email"
                            autoComplete="email"
                            value={values.email}
                            error={fieldErrors.email}
                            onChange={updateField}
                        />
                        <FormField
                            field="username"
                            label="Pseudo"
                            hint="3 à 20 caractères : minuscules, chiffres et _."
                            autoComplete="username"
                            value={values.username}
                            error={fieldErrors.username}
                            onChange={updateField}
                        />
                        <FormField
                            field="password"
                            label="Mot de passe"
                            hint="8 caractères minimum."
                            type="password"
                            autoComplete="new-password"
                            value={values.password}
                            error={fieldErrors.password}
                            onChange={updateField}
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

type FormFieldProps = {
    field: Field;
    label: string;
    hint?: string;
    type?: string;
    autoComplete: string;
    value: string;
    error?: string;
    onChange: (field: Field, value: string) => void;
};

function FormField({ field, label, hint, type = "text", autoComplete, value, error, onChange }: FormFieldProps) {
    const hintId = `${field}-hint`;
    const errorId = `${field}-error`;
    const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(" ") || undefined;

    return (
        <div className="space-y-2">
            <Label htmlFor={field}>{label}</Label>
            <Input
                id={field}
                type={type}
                autoComplete={autoComplete}
                required
                value={value}
                aria-invalid={error !== undefined}
                aria-describedby={describedBy}
                onChange={(event) => onChange(field, event.target.value)}
            />
            {hint && (
                <p id={hintId} className="text-sm text-muted-foreground">
                    {hint}
                </p>
            )}
            {error && (
                <p id={errorId} className="text-sm text-destructive">
                    {error}
                </p>
            )}
        </div>
    );
}

function groupViolations(violations: Violation[]): { byField: FieldErrors; others: string[] } {
    const byField: FieldErrors = {};
    const others: string[] = [];
    for (const { propertyPath, title } of violations) {
        const field = FIELDS.find((candidate) => candidate === propertyPath);
        if (field === undefined) {
            others.push(title);
        } else {
            byField[field] ??= title;
        }
    }

    return { byField, others };
}
