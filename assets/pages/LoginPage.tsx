import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useSearchParams } from "react-router";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
        <Card className="mx-auto max-w-sm">
            <CardHeader>
                <CardTitle>Connexion</CardTitle>
                <CardDescription>Compte de démo : jane@example.com, mot de passe demo1234.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error !== null && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Mot de passe</Label>
                        <Input
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={submitting}>
                        Se connecter
                    </Button>
                </form>
                <p className="mt-4 text-center text-sm text-muted-foreground">
                    Pas encore de compte ?{" "}
                    <Link to={authPath("/register", target)} className="text-primary underline-offset-4 hover:underline">
                        Créer un compte
                    </Link>
                </p>
            </CardContent>
        </Card>
    );
}
