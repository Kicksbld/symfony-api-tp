import { useQuery } from "@tanstack/react-query";
import { Link, Navigate, useLocation } from "react-router";
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
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-3xl font-semibold">Modifier mon profil</h1>
                <Button asChild variant="outline">
                    <Link to={`/users/${encodeURIComponent(data?.username ?? session.user.username)}`}>Voir mon profil public</Link>
                </Button>
            </div>
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

function ProfileEditor({ session, user }: { session: Session; user: CurrentUser }) {
    const { isPending, mutateAsync } = useProfileMutation(session, user);

    return (
        <div className="space-y-6">
            <ProfileDetailsForm
                username={user.username}
                bio={user.bio ?? ""}
                saving={isPending}
                onSave={(fields) => mutateAsync({ type: "profile", fields })}
            />
            <div className="border-t pt-6">
                <FavoriteMoviesForm
                    favorites={user.favorites}
                    saving={isPending}
                    onSave={(movies) => mutateAsync({ type: "favorites", movies })}
                />
            </div>
        </div>
    );
}
