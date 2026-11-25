import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { currentUserQuery } from "@/features/auth/queries";
import type { Session } from "@/lib/session";

export function AccountControls({ session, logout }: { session: Session; logout: () => void }) {
    const { data: user, error, isFetching, refetch } = useQuery(currentUserQuery(session));

    return (
        <div className="flex items-center gap-3 text-sm">
            <span>{user?.username ?? session.user.username}</span>
            {error !== null && (
                <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Réessayer le chargement du profil"
                    title="Réessayer le chargement du profil"
                    onClick={() => void refetch()}
                    disabled={isFetching}
                >
                    <RefreshCw aria-hidden="true" />
                </Button>
            )}
            <Button variant="outline" size="sm" onClick={logout}>
                Déconnexion
            </Button>
        </div>
    );
}
