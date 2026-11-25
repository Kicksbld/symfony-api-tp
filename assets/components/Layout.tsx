import { Link, Outlet } from "react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export function Layout() {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="border-b">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
                    <Link to="/" className="text-lg font-semibold">
                        Letterboxd
                    </Link>
                    {user === null ? (
                        <Button asChild variant="outline" size="sm">
                            <Link to="/login">Connexion</Link>
                        </Button>
                    ) : (
                        <div className="flex items-center gap-3 text-sm">
                            <span>{user.username}</span>
                            <Button variant="outline" size="sm" onClick={logout}>
                                Déconnexion
                            </Button>
                        </div>
                    )}
                </div>
            </header>
            <main className="mx-auto max-w-6xl px-4 py-8">
                <Outlet />
            </main>
        </div>
    );
}
