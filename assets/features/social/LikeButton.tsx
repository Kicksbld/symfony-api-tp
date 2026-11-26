import { useMutationState, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { useId } from "react";
import { Link, useLocation } from "react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth";
import { likeCountFor, likeMutationKey, useLikeMutation, type LikeTarget, type LikeViews } from "@/features/social/likes";
import { authPath, returnPathFor } from "@/lib/redirect";
import type { Session } from "@/lib/session";

type LikeButtonProps = {
    target: LikeTarget;
    title: string;
    path: string;
    viewsFor: (viewer: Session | null) => LikeViews;
};

export function LikeButton(props: LikeButtonProps) {
    const { session } = useAuth();
    const location = useLocation();

    if (session === null) {
        return (
            <Button asChild variant="outline" size="sm">
                <Link to={authPath("/login", returnPathFor(location))} aria-label={`Se connecter pour aimer ${props.title} (${props.target.likeCount})`}>
                    <LikeCount count={props.target.likeCount} />
                </Link>
            </Button>
        );
    }

    return <ConnectedLikeButton key={session.cacheId} {...props} session={session} />;
}

function ConnectedLikeButton({ target, title, path, viewsFor, session }: LikeButtonProps & { session: Session }) {
    const client = useQueryClient();
    const toggle = useLikeMutation(target, session, path, viewsFor);
    const mutationKey = likeMutationKey(viewsFor(session).detail);
    const countId = useId();
    const pendingChanges = useMutationState({
        filters: { mutationKey, exact: true, status: "pending" },
        select: ({ state }) => state.variables === true,
    });
    // Une seule mise à jour en attente est affichée sur toutes les vues.
    const pending = pendingChanges.at(-1);
    const liked = pending ?? target.likedByMe;
    const count = likeCountFor(target, liked);

    return (
        <div className="space-y-1">
            <Button
                variant="outline"
                size="sm"
                aria-label={`J’aime ${title}`}
                aria-describedby={countId}
                aria-pressed={liked}
                aria-disabled={pending !== undefined}
                onClick={() => {
                    if (client.isMutating({ mutationKey, exact: true }) === 0) {
                        toggle.mutate(!liked);
                    }
                }}
            >
                <LikeCount count={count} liked={liked} />
            </Button>
            <span id={countId} className="sr-only">{count} {count === 1 ? "mention J’aime" : "mentions J’aime"}</span>
            {toggle.isError && <p role="alert" className="text-sm text-destructive">Impossible de modifier la mention J’aime. Réessayez.</p>}
        </div>
    );
}

function LikeCount({ count, liked = false }: { count: number; liked?: boolean }) {
    return (
        <>
            <Heart aria-hidden="true" className={liked ? "fill-current" : undefined} />
            <span aria-hidden="true">{count}</span>
        </>
    );
}
