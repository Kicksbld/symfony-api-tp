import type { UseQueryResult } from "@tanstack/react-query";
import { useState } from "react";
import { Link, Navigate, useLocation, type To } from "react-router";
import { PaginatedResults } from "@/components/PaginatedList";
import { Button } from "@/components/ui/button";
import { ListCommentForm } from "@/features/movie-lists/ListCommentForm";
import { ListCommentRow } from "@/features/movie-lists/ListCommentRow";
import type { ListComment, MovieList } from "@/features/movie-lists/types";
import { authPath, returnPathFor } from "@/lib/redirect";
import type { Session } from "@/lib/session";
import type { Paginated } from "@/lib/types";
import { TEXT_LINK_CLASS_NAME } from "@/lib/utils";

export function ListComments({ list, page, pathForPage, result, session }: {
    list: MovieList;
    page: number;
    pathForPage: (page: number) => To;
    result: UseQueryResult<Paginated<ListComment>>;
    session: Session | null;
}) {
    const location = useLocation();
    const [published, setPublished] = useState(false);
    const lastPage = Math.max(1, result.data?.lastPage ?? page);

    if (result.data !== undefined && !result.isFetching && !result.isError && page > lastPage) {
        return <Navigate to={pathForPage(lastPage)} replace />;
    }

    return (
        <section aria-labelledby="list-comments" className="space-y-4">
            <h2 id="list-comments" className="text-lg font-semibold">Commentaires</h2>
            {session === null ? (
                <Button asChild variant="outline" size="sm">
                    <Link to={authPath("/login", returnPathFor(location))}>Se connecter pour commenter</Link>
                </Button>
            ) : (
                <ListCommentForm listId={list.id} session={session} onSaved={() => setPublished(true)} />
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
                label="Pagination des commentaires de la liste"
                emptyMessage="Aucun commentaire pour le moment."
                errorMessage="Impossible de charger les commentaires."
            >
                {(comments) => (
                    <ul className="divide-y border-y">
                        {comments.map((comment) => <ListCommentRow key={comment.id} comment={comment} list={list} session={session} />)}
                    </ul>
                )}
            </PaginatedResults>
        </section>
    );
}
