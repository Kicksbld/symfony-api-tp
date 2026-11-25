import { Link, Outlet } from "react-router";
import { Button } from "@/components/ui/button";
import { AccountControls } from "@/features/auth/AccountControls";
import { useAuth } from "@/features/auth/auth";

export function Layout() {
    const { session, logout } = useAuth();

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="border-b">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
                    <Link to="/" className="text-lg font-semibold">
                        Letterboxd
                    </Link>
                    {session === null ? (
                        <Button asChild variant="outline" size="sm">
                            <Link to="/login">Connexion</Link>
                        </Button>
                    ) : (
                        <AccountControls session={session} logout={logout} />
                    )}
                </div>
            </header>
            <main className="mx-auto max-w-6xl px-4 py-8">
                <Outlet />
            </main>
        </div>
    );
}
