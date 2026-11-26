import { NavLink, useLocation } from "react-router";
import { cn } from "cn";
import { navigationItemClassName, type NavigationLayout } from "@/components/navigation-item";
import { AccountControls } from "@/features/auth/AccountControls";
import { useAuth } from "@/features/auth/auth";
import { authPath, returnPathFor } from "@/lib/redirect";

type MainNavigationProps = {
    layout: NavigationLayout;
    id?: string;
    className?: string;
    onNavigate?: () => void;
};

export function MainNavigation({ layout, id, className, onNavigate }: MainNavigationProps) {
    const { session, logout } = useAuth();
    const location = useLocation();

    return (
        <nav
            id={id}
            aria-label="Navigation principale"
            className={cn("flex gap-1", layout === "bar" ? "items-center" : "flex-col", className)}
        >
            <NavLink to="/" end className={navigationItemClassName(layout)} onClick={onNavigate}>
                Films
            </NavLink>
            <NavLink to="/people" className={navigationItemClassName(layout)} onClick={onNavigate}>
                Personnes
            </NavLink>
            <NavLink to="/lists" className={navigationItemClassName(layout)} onClick={onNavigate}>
                Listes
            </NavLink>
            <NavLink to="/reviews" className={navigationItemClassName(layout)} onClick={onNavigate}>
                Critiques
            </NavLink>
            <NavLink to="/users" end className={navigationItemClassName(layout)} onClick={onNavigate}>
                Membres
            </NavLink>
            {session === null ? (
                <NavLink to={authPath("/login", returnPathFor(location))} className={navigationItemClassName(layout, "outline")} onClick={onNavigate}>
                    Connexion
                </NavLink>
            ) : (
                <AccountControls
                    layout={layout}
                    session={session}
                    onLogout={() => {
                        logout();
                        onNavigate?.();
                    }}
                    onNavigate={onNavigate}
                />
            )}
        </nav>
    );
}
