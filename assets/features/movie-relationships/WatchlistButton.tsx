import { useQuery } from "@tanstack/react-query";
import { BookmarkCheck, BookmarkPlus, RefreshCw } from "lucide-react";
import { Link, useLocation } from "react-router";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth";
import { relationshipQuery, useWatchlistMutation } from "@/features/movie-relationships/queries";
import { authPath, returnPathFor } from "@/lib/redirect";
import type { Session } from "@/lib/session";

const BUTTON_CLASS_NAME = "h-11 px-4";

export function WatchlistButton({ movieId }: { movieId: number }) {
    const { session } = useAuth();
    const location = useLocation();

    if (session === null) {
        return (
            <Button asChild variant="outline" className={BUTTON_CLASS_NAME}>
                <Link to={authPath("/login", returnPathFor(location))}>
                    <BookmarkPlus aria-hidden="true" />
                    Ajouter à ma watchlist
                </Link>
            </Button>
        );
    }

    // La clé recrée le bouton au changement de compte, pour ne pas garder l'erreur de la session précédente.
    return <MemberWatchlistButton key={session.cacheId} session={session} movieId={movieId} />;
}

function MemberWatchlistButton({ session, movieId }: { session: Session; movieId: number }) {
    const relationship = useQuery(relationshipQuery(session, movieId));
    const watchlist = useWatchlistMutation(session, movieId);

    if (relationship.data === undefined) {
        if (relationship.error === null) {
            return (
                <Button variant="outline" className={BUTTON_CLASS_NAME} disabled>
                    <BookmarkPlus aria-hidden="true" />
                    Watchlist
                </Button>
            );
        }

        return (
            <Button variant="outline" className={BUTTON_CLASS_NAME} onClick={() => void relationship.refetch()} disabled={relationship.isFetching}>
                <RefreshCw aria-hidden="true" />
                Réessayer de charger ma watchlist
            </Button>
        );
    }

    const { inWatchlist } = relationship.data;

    // Un clic pendant l'envoi est ignoré : la requête en cours décide de l'état, et le bouton garde le focus.
    function toggle(): void {
        if (!watchlist.isPending) {
            watchlist.mutate(!inWatchlist);
        }
    }

    return (
        <div className="space-y-2">
            <Button
                variant={inWatchlist ? "secondary" : "outline"}
                className={`${BUTTON_CLASS_NAME} aria-busy:opacity-70`}
                aria-busy={watchlist.isPending}
                onClick={toggle}
            >
                {inWatchlist ? <BookmarkCheck aria-hidden="true" /> : <BookmarkPlus aria-hidden="true" />}
                {inWatchlist ? "Retirer de ma watchlist" : "Ajouter à ma watchlist"}
            </Button>
            {watchlist.error !== null && (
                <Alert variant="destructive">
                    <AlertDescription>
                        {watchlist.variables ? "L'ajout à la watchlist a échoué." : "Le retrait de la watchlist a échoué."} {watchlist.error.message}
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
