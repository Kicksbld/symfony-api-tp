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

// Le cœur passe en rouge une fois aimé, comme la mention « Aimé » des entrées de journal.
const LIKE_BUTTON_CLASS_NAME = "h-8 rounded-full bg-white/5 px-3 hover:bg-white/10 aria-pressed:text-chart-5";

export function LikeButton(props: LikeButtonProps) {
    const { session } = useAuth();
    const location = useLocation();

    if (session === null) {
        return (
            <Button asChild variant="ghost" size="sm" className={LIKE_BUTTON_CLASS_NAME}>
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
    const changes = useMutationState({
        filters: { mutationKey, exact: true },
        select: ({ state }) => ({ status: state.status, liked: state.variables === true }),
    });
    // Toutes les vues affichent le même état pendant la requête et après un échec.
    const latest = changes.at(-1);
    const pending = latest?.status === "pending";
    const liked = pending ? latest.liked : target.likedByMe;
    const count = likeCountFor(target, liked);

    return (
        <div className="space-y-1">
            <Button
                variant="ghost"
                size="sm"
                className={LIKE_BUTTON_CLASS_NAME}
                aria-label={`J’aime ${title}`}
                aria-describedby={countId}
                aria-pressed={liked}
                aria-disabled={pending}
                onClick={() => {
                    if (client.isMutating({ mutationKey, exact: true }) === 0) {
                        toggle.mutate(!liked);
                    }
                }}
            >
                <LikeCount count={count} liked={liked} />
            </Button>
            <span id={countId} className="sr-only">{count} {count === 1 ? "mention J’aime" : "mentions J’aime"}</span>
            {latest?.status === "error" && <p role="alert" className="text-sm text-destructive">Impossible de modifier la mention J’aime. Réessayez.</p>}
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
