import { useIsMutating, useQuery } from "@tanstack/react-query";
import { BookmarkCheck, BookmarkPlus, Eye, Heart } from "lucide-react";
import { useId } from "react";
import { Link, useLocation } from "react-router";
import { QueryError } from "@/components/QueryError";
import { SectionSkeleton } from "@/components/SectionSkeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/auth";
import { relationshipQuery, useRelationshipMutation } from "@/features/movie-relationships/queries";
import { RatingSelect } from "@/features/movies/RatingSelect";
import { authPath, returnPathFor } from "@/lib/redirect";
import type { Session } from "@/lib/session";
import type { MovieRelationship } from "@/lib/types";

export function MovieRelationshipControls({ movieId }: { movieId: number }) {
    const { session } = useAuth();
    const location = useLocation();

    if (session === null) {
        return (
            <Button asChild variant="outline" className="h-11 px-4">
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
    const ratingId = useId();

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
                <div role="group" aria-label="Mon suivi du film" aria-busy={pending} className="flex flex-wrap items-center gap-2 aria-busy:opacity-70">
                    <Button
                        variant={state.watched ? "secondary" : "outline"}
                        className="h-11"
                        aria-pressed={state.watched}
                        aria-disabled={pending}
                        onClick={() => update({ watched: !state.watched })}
                    >
                        <Eye aria-hidden="true" /> Vu
                    </Button>
                    <Button
                        variant={state.liked ? "secondary" : "outline"}
                        className="h-11"
                        aria-pressed={state.liked}
                        aria-disabled={pending}
                        onClick={() => update({ liked: !state.liked })}
                    >
                        <Heart aria-hidden="true" className={state.liked ? "fill-current" : undefined} /> Aimé
                    </Button>
                    <Button
                        variant={state.inWatchlist ? "secondary" : "outline"}
                        className="h-11"
                        aria-disabled={pending}
                        onClick={() => update({ inWatchlist: !state.inWatchlist })}
                    >
                        {state.inWatchlist ? <BookmarkCheck aria-hidden="true" /> : <BookmarkPlus aria-hidden="true" />}
                        {state.inWatchlist ? "Retirer de ma watchlist" : "Ajouter à ma watchlist"}
                    </Button>
                    <div className="flex items-center gap-2">
                        <Label htmlFor={ratingId}>Ma note</Label>
                        <RatingSelect
                            id={ratingId}
                            className="[&_select]:h-11"
                            value={state.rating ?? ""}
                            aria-disabled={pending}
                            onChange={(event) => update({ rating: event.target.value === "" ? null : Number(event.target.value) })}
                        />
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
