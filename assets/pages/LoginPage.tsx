import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useSearchParams } from "react-router";
import { FormField } from "@/components/FormField";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/features/auth/auth";
import { authPath, redirectTarget } from "@/lib/redirect";

export function LoginPage() {
    const { session, login } = useAuth();
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const target = redirectTarget(searchParams);
    // L'inscription transmet l'email du compte créé quand l'ouverture de session a échoué.
    const [email, setEmail] = useState(typeof location.state?.email === "string" ? location.state.email : "");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    if (session !== null) {
        return <Navigate to={target} replace />;
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            await login(email, password);
        } catch (reason) {
            setError(reason instanceof ApiError && reason.status === 401 ? "Email ou mot de passe incorrect." : "La connexion a échoué, réessayez.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <section className="space-y-8">
            <header className="space-y-2">
                <h1 className="text-4xl font-extrabold">Bon retour.</h1>
                <p className="text-muted-foreground">Connectez-vous pour reprendre votre journal là où vous l'avez laissé.</p>
            </header>
            <form onSubmit={handleSubmit} className="space-y-5">
                {error !== null && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                <FormField id="email" label="Email" type="email" autoComplete="email" value={email} onChange={setEmail} />
                <FormField id="password" label="Mot de passe" type="password" autoComplete="current-password" value={password} onChange={setPassword} />
                <Button type="submit" size="lg" className="h-11 w-full rounded-full text-base" disabled={submitting}>
                    {submitting ? "Connexion…" : "Se connecter"}
                </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground">
                Pas encore de compte ?{" "}
                <Link to={authPath("/register", target)} className="font-medium text-primary underline-offset-4 hover:underline">
                    Créer un compte
                </Link>
            </p>
        </section>
    );
}
