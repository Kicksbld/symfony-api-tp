import { Link, useLocation } from "react-router";
import { Button } from "@/components/ui/button";
import { useFollowMutation } from "@/features/users/follows";
import { authPath, returnPathFor } from "@/lib/redirect";
import type { Session } from "@/lib/session";
import type { PublicProfile } from "@/lib/types";

export function FollowButton({ profile, session }: { profile: PublicProfile; session: Session | null }) {
    const location = useLocation();

    if (session === null) {
        return (
            <Button asChild>
                <Link to={authPath("/login", returnPathFor(location))} aria-label={`Se connecter pour suivre ${profile.username}`}>
                    Suivre
                </Link>
            </Button>
        );
    }

    return <ConnectedFollowButton key={`${session.cacheId}:${profile.id}`} profile={profile} session={session} />;
}

function ConnectedFollowButton({ profile, session }: { profile: PublicProfile; session: Session }) {
    const { error, pending, toggle } = useFollowMutation(profile, session);

    return (
        <div className="space-y-1">
            <Button
                variant={profile.followedByMe ? "outline" : "default"}
                aria-disabled={pending}
                onClick={toggle}
            >
                {profile.followedByMe ? "Ne plus suivre" : "Suivre"}
            </Button>
            {error !== null && (
                <p role="alert" className="text-sm text-destructive">
                    Impossible de modifier l’abonnement. {error.message}
                </p>
            )}
        </div>
    );
}
