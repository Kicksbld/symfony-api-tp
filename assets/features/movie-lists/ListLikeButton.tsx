import { useMutationState } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { useId } from "react";
import { Link, useLocation } from "react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth";
import { likeCountFor, listLikeKey, useListLikeMutation } from "@/features/movie-lists/likes";
import type { MovieList } from "@/features/movie-lists/types";
import { authPath, returnPathFor } from "@/lib/redirect";
import type { Session } from "@/lib/session";

export function ListLikeButton({ list }: { list: MovieList }) {
    const { session } = useAuth();
    const location = useLocation();
    const label = `J’aime la liste « ${list.name} »`;

    if (session === null) {
        return (
            <Button asChild variant="outline" size="sm">
                <Link to={authPath("/login", returnPathFor(location))} aria-label={`Se connecter pour aimer la liste « ${list.name} » (${list.likeCount})`}>
                    <LikeCount count={list.likeCount} />
                </Link>
            </Button>
        );
    }

    return <ConnectedListLikeButton key={session.cacheId} list={list} session={session} label={label} />;
}

function ConnectedListLikeButton({ list, session, label }: { list: MovieList; session: Session; label: string }) {
    const toggle = useListLikeMutation(list, session);
    const countId = useId();
    const pendingChanges = useMutationState({
        filters: { mutationKey: listLikeKey(list.id, session), exact: true, status: "pending" },
        select: ({ state }) => state.variables === true,
    });
    // Une seule mise à jour en attente est affichée sur toutes les vues de la liste.
    const pending = pendingChanges.at(-1);
    const liked = pending ?? list.likedByMe;
    const count = likeCountFor(list, liked);

    return (
        <div className="space-y-1">
            <Button
                variant="outline"
                size="sm"
                aria-label={label}
                aria-describedby={countId}
                aria-pressed={liked}
                aria-disabled={pending !== undefined}
                onClick={() => {
                    if (pending === undefined && !toggle.isPending) {
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
