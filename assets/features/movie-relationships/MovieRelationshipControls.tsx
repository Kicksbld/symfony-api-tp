import { useIsMutating, useQuery } from "@tanstack/react-query";
import { BookmarkCheck, BookmarkPlus, Eye, Heart } from "lucide-react";
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { QueryError } from "@/components/QueryError";
import { SectionSkeleton } from "@/components/SectionSkeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth";
import { relationshipQuery, useRelationshipMutation } from "@/features/movie-relationships/queries";
import { StarRatingInput } from "@/features/movies/StarRatingInput";
import { authPath, returnPathFor } from "@/lib/redirect";
import type { Session } from "@/lib/session";
import type { MovieRelationship } from "@/lib/types";

export function MovieRelationshipControls({ movieId }: { movieId: number }) {
    const { session } = useAuth();
    const location = useLocation();

    if (session === null) {
        return (
            <Button asChild variant="outline" className="h-11 w-full rounded-full px-4">
                <Link to={authPath("/login", returnPathFor(location))}>
                    <BookmarkPlus aria-hidden="true" />
                    Ajouter à ma watchlist
                </Link>
            </Button>
        );
    }

    return <MemberRelationshipControls key={`${session.cacheId}:${movieId}`} session={session} movieId={movieId} />;
}

function MemberRelationshipControls({ session, movieId }: { session: Session; movieId: number }) {
    const options = relationshipQuery(session, movieId);
    const relationship = useQuery(options);
    const mutation = useRelationshipMutation(session, movieId);
    const pending = useIsMutating({ mutationKey: options.queryKey }) > 0;

    if (relationship.data === undefined && relationship.error === null) {
        return <SectionSkeleton label="Chargement de mon suivi…" className="h-11 w-48" />;
    }

    function update(patch: Partial<MovieRelationship>): void {
        if (!pending) {
            mutation.mutate(patch);
        }
    }

    const state = relationship.data;

    return (
        <div className="w-full space-y-3">
            {relationship.error !== null && (
                <QueryError
                    message="Impossible de charger mon suivi."
                    error={relationship.error}
                    onRetry={() => void relationship.refetch()}
                    retrying={relationship.isFetching}
                />
            )}
            {state !== undefined && (
                <div role="group" aria-label="Mon suivi du film" aria-busy={pending} className="space-y-4 aria-busy:opacity-70">
                    <div className="grid grid-cols-3 gap-2">
                        <ToggleAction label="Vu" pressed={state.watched} pending={pending} onToggle={() => update({ watched: !state.watched })}>
                            <Eye aria-hidden="true" />
                        </ToggleAction>
                        <ToggleAction label="Aimé" pressed={state.liked} pending={pending} onToggle={() => update({ liked: !state.liked })}>
                            <Heart aria-hidden="true" className={state.liked ? "fill-current" : undefined} />
                        </ToggleAction>
                        <ToggleAction label="Watchlist" pressed={state.inWatchlist} pending={pending} onToggle={() => update({ inWatchlist: !state.inWatchlist })}>
                            {state.inWatchlist ? <BookmarkCheck aria-hidden="true" /> : <BookmarkPlus aria-hidden="true" />}
                        </ToggleAction>
                    </div>
                    <div className="flex flex-col items-center gap-1 border-t border-white/10 pt-3">
                        <span aria-hidden="true" className="eyebrow">
                            Ma note
                        </span>
                        <StarRatingInput label="Ma note" value={state.rating} disabled={pending} onChange={(rating) => update({ rating })} />
                    </div>
                </div>
            )}
            {mutation.error !== null && (
                <Alert variant="destructive">
                    <AlertDescription>Impossible de mettre à jour mon suivi. {mutation.error.message}</AlertDescription>
                </Alert>
            )}
        </div>
    );
}

type ToggleActionProps = {
    label: string;
    pressed: boolean;
    pending: boolean;
    onToggle: () => void;
    children: ReactNode;
};

function ToggleAction({ label, pressed, pending, onToggle, children }: ToggleActionProps) {
    return (
        <button
            type="button"
            aria-pressed={pressed}
            aria-disabled={pending}
            onClick={onToggle}
            className="flex flex-col items-center gap-1.5 rounded-xl py-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none aria-pressed:text-primary aria-pressed:[&_svg]:animate-pop [&_svg]:size-6"
        >
            {children}
            {label}
        </button>
    );
}

