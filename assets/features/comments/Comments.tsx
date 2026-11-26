import type { UseQueryResult } from "@tanstack/react-query";
import { useState } from "react";
import { Link, Navigate, useLocation, type To } from "react-router";
import { PaginatedResults } from "@/components/PaginatedList";
import { Button } from "@/components/ui/button";
import { CommentForm } from "@/features/comments/CommentForm";
import { CommentRow } from "@/features/comments/CommentRow";
import type { Comment, CommentThread } from "@/features/comments/queries";
import { authPath, returnPathFor } from "@/lib/redirect";
import type { Session } from "@/lib/session";
import type { Paginated } from "@/lib/types";
import { TEXT_LINK_CLASS_NAME } from "@/lib/utils";

export function Comments({ thread, ownerId, page, pathForPage, result, session, total }: {
    thread: CommentThread;
    ownerId: number;
    page: number;
    pathForPage: (page: number) => To;
    result: UseQueryResult<Paginated<Comment>>;
    session: Session | null;
    total?: number;
}) {
    const location = useLocation();
    const [published, setPublished] = useState(false);
    const lastPage = Math.max(1, result.data?.lastPage ?? page);

    if (result.data !== undefined && !result.isFetching && !result.isError && page > lastPage) {
        return <Navigate to={pathForPage(lastPage)} replace />;
    }

    return (
        <section aria-labelledby="comments" className="space-y-4">
            <h2 id="comments" className="text-2xl font-bold">Commentaires{total !== undefined && <span className="ml-2 text-muted-foreground">{total}</span>}</h2>
            {session === null ? (
                <Button asChild variant="outline" size="sm">
                    <Link to={authPath("/login", returnPathFor(location))}>Se connecter pour commenter</Link>
                </Button>
            ) : (
                <CommentForm thread={thread} session={session} onSaved={() => setPublished(true)} />
            )}
            <p role="status" className={published ? "text-sm text-muted-foreground" : "sr-only"}>{published && "Commentaire publié."}</p>
            {published && page < lastPage && (
                <Link to={pathForPage(lastPage)} className={`text-sm ${TEXT_LINK_CLASS_NAME}`}>Voir la dernière page</Link>
            )}
            <PaginatedResults
                result={result}
                keepPreviousPage={false}
                page={page}
                pathForPage={pathForPage}
                label="Pagination des commentaires"
                emptyMessage="Aucun commentaire pour le moment."
                errorMessage="Impossible de charger les commentaires."
            >
                {(comments) => (
                    <ul className="divide-y divide-white/5">
                        {comments.map((comment) => <CommentRow key={comment.id} comment={comment} thread={thread} ownerId={ownerId} session={session} />)}
                    </ul>
                )}
            </PaginatedResults>
        </section>
    );
}
