import { useQuery } from "@tanstack/react-query";
import { Link, Navigate, useLocation } from "react-router";
import { PageHeader } from "@/components/PageHeader";
import { QueryError } from "@/components/QueryError";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth";
import { currentUserQuery } from "@/features/auth/queries";
import { FavoriteMoviesForm } from "@/features/users/FavoriteMoviesForm";
import { ProfileDetailsForm } from "@/features/users/ProfileDetailsForm";
import { useProfileMutation } from "@/features/users/profile-editing";
import { authPath, returnPathFor } from "@/lib/redirect";
import type { Session } from "@/lib/session";
import type { CurrentUser } from "@/lib/types";

export function EditProfilePage() {
    const { session } = useAuth();
    const location = useLocation();

    if (session === null) {
        return <Navigate to={authPath("/login", returnPathFor(location))} replace />;
    }

    return <EditProfileLoader key={session.cacheId} session={session} />;
}

function EditProfileLoader({ session }: { session: Session }) {
    const { data, error, isFetching, refetch } = useQuery(currentUserQuery(session));

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <PageHeader title="Modifier mon profil">
                <Button asChild variant="outline" className="h-10 rounded-full px-5">
                    <Link to={`/users/${encodeURIComponent(data?.username ?? session.user.username)}`}>Voir mon profil public</Link>
                </Button>
            </PageHeader>
            {data !== undefined ? (
                <ProfileEditor session={session} user={data} />
            ) : error !== null ? (
                <QueryError message="Impossible de charger votre profil." error={error} onRetry={() => void refetch()} retrying={isFetching} />
            ) : (
                <p role="status" className="text-sm text-muted-foreground">Chargement de votre profil…</p>
            )}
        </div>
    );
}

const PANEL_CLASS_NAME = "rounded-2xl border border-white/5 bg-card/50 p-6 sm:p-8";

function ProfileEditor({ session, user }: { session: Session; user: CurrentUser }) {
    const { isPending, mutateAsync } = useProfileMutation(session, user);

    return (
        <div className="space-y-6">
            <div className={PANEL_CLASS_NAME}>
                <ProfileDetailsForm
                    username={user.username}
                    bio={user.bio ?? ""}
                    saving={isPending}
                    onSave={(fields) => mutateAsync({ type: "profile", fields })}
                />
            </div>
            <div className={PANEL_CLASS_NAME}>
                <FavoriteMoviesForm
                    favorites={user.favorites}
                    saving={isPending}
                    onSave={(movies) => mutateAsync({ type: "favorites", movies })}
                />
            </div>
        </div>
    );
}
