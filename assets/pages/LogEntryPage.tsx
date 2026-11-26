import { useQuery } from "@tanstack/react-query";
import { Link, Navigate, useParams, useSearchParams } from "react-router";
import { QueryError } from "@/components/QueryError";
import { SectionSkeleton } from "@/components/SectionSkeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth";
import { Comments } from "@/features/comments/Comments";
import { commentsQuery, type CommentThread } from "@/features/comments/queries";
import { LogEntryActions } from "@/features/log-entries/LogEntryActions";
import { LogEntryCard } from "@/features/log-entries/LogEntryCard";
import { LogEntryLikeButton } from "@/features/log-entries/LogEntryInteractions";
import { logEntryQuery, refreshReviewViews, reviewsPath } from "@/features/log-entries/reviews";
import { ApiError } from "@/lib/api";
import { parsePositiveInteger } from "@/lib/numbers";
import { pageSearch, parsePage } from "@/lib/pagination";
import type { Session } from "@/lib/session";
import { TEXT_LINK_CLASS_NAME } from "@/lib/utils";

export function LogEntryPage() {
    const { id = "" } = useParams();
    const { session } = useAuth();
    const [searchParams] = useSearchParams();
    const entryId = parsePositiveInteger(id);
    const page = parsePage(searchParams);

    if (entryId === null) {
        return <EntryNotFound />;
    }
    if (page === null) {
        return <Navigate to={pageSearch(1)} replace />;
    }

    return <LogEntryDetails key={`${entryId}:${session?.cacheId ?? "public"}`} id={entryId} page={page} session={session} />;
}

function LogEntryDetails({ id, page, session }: { id: number; page: number; session: Session | null }) {
    const { data: entry, error, isFetching, refetch } = useQuery(logEntryQuery(id, session));
    const thread: CommentThread = {
        resource: "log-entries",
        id,
        refreshCounts: session === null ? undefined : (client) => refreshReviewViews(client, session, id),
    };
    const comments = useQuery(commentsQuery(thread, page, session));

    if ([error, comments.error].some((failure) => failure instanceof ApiError && failure.status === 404)) {
        return <EntryNotFound />;
    }
    if (entry === undefined) {
        return error === null
            ? <SectionSkeleton label="Chargement de l’entrée…" className="h-32 w-full" />
            : <QueryError message="Impossible de charger l’entrée." error={error} onRetry={() => void refetch()} retrying={isFetching} />;
    }

    return (
        <div className="max-w-3xl space-y-6">
            <Link to={reviewsPath()} className={`text-sm ${TEXT_LINK_CLASS_NAME}`}>Toutes les critiques</Link>
            {error !== null && <QueryError message="Impossible d’actualiser l’entrée." error={error} onRetry={() => void refetch()} retrying={isFetching} />}
            <LogEntryCard entry={entry} heading="h1">
                <div className="flex flex-wrap items-start gap-2">
                    <LogEntryLikeButton entry={entry} />
                    <LogEntryActions entry={entry} />
                </div>
            </LogEntryCard>
            <Comments
                thread={thread}
                ownerId={entry.user.id}
                page={page}
                pathForPage={pageSearch}
                result={comments}
                session={session}
                total={comments.data?.total ?? entry.commentCount}
            />
        </div>
    );
}

function EntryNotFound() {
    return (
        <section className="space-y-4 text-center">
            <h1 className="text-2xl font-semibold">Entrée introuvable</h1>
            <Button asChild variant="outline">
                <Link to={reviewsPath()}>Voir les critiques</Link>
            </Button>
        </section>
    );
}
