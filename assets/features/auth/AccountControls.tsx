import { useQuery } from "@tanstack/react-query";
import { CircleUserRound, RefreshCw } from "lucide-react";
import { NavLink } from "react-router";
import { navigationItemClassName, type NavigationLayout } from "@/components/navigation-item";
import { Button } from "@/components/ui/button";
import { currentUserQuery } from "@/features/auth/queries";
import type { Session } from "@/lib/session";

type AccountControlsProps = {
    layout: NavigationLayout;
    session: Session;
    onLogout: () => void;
    onNavigate?: () => void;
};

export function AccountControls({ layout, session, onLogout, onNavigate }: AccountControlsProps) {
    const { data: user, error, isFetching, refetch } = useQuery(currentUserQuery(session));
    const username = user?.username ?? session.user.username;

    return (
        <>
            <NavLink to={`/users/${username}`} className={navigationItemClassName(layout)} onClick={onNavigate}>
                <CircleUserRound aria-hidden="true" />
                {username}
            </NavLink>
            {error !== null && (
                <Button
                    variant="ghost"
                    size="icon-lg"
                    className={layout === "panel" ? "size-11" : undefined}
                    aria-label="Réessayer le chargement du profil"
                    title="Réessayer le chargement du profil"
                    onClick={() => void refetch()}
                    disabled={isFetching}
                >
                    <RefreshCw aria-hidden="true" />
                </Button>
            )}
            <button type="button" className={navigationItemClassName(layout, "outline")} onClick={onLogout}>
                Déconnexion
            </button>
        </>
    );
}
