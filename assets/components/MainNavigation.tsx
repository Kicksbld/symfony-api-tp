import { NavLink } from "react-router";
import { cn } from "cn";
import { navigationItemClassName, type NavigationLayout } from "@/components/navigation-item";
import { AccountControls } from "@/features/auth/AccountControls";
import { useAuth } from "@/features/auth/auth";

type MainNavigationProps = {
    layout: NavigationLayout;
    id?: string;
    className?: string;
    onNavigate?: () => void;
};

export function MainNavigation({ layout, id, className, onNavigate }: MainNavigationProps) {
    const { session, logout } = useAuth();

    return (
        <nav
            id={id}
            aria-label="Navigation principale"
            className={cn("flex gap-1", layout === "bar" ? "items-center" : "flex-col", className)}
        >
            <NavLink to="/" end className={navigationItemClassName(layout)} onClick={onNavigate}>
                Films
            </NavLink>
            {session === null ? (
                <NavLink to="/login" className={navigationItemClassName(layout, "outline")} onClick={onNavigate}>
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
