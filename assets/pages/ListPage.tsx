import { useQuery } from "@tanstack/react-query";
import { LockKeyhole } from "lucide-react";
import { Link, Navigate, useParams, useSearchParams } from "react-router";
import { PaginatedResults } from "@/components/PaginatedList";
import { QueryError } from "@/components/QueryError";
import { SectionSkeleton } from "@/components/SectionSkeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth";
import { listDetailQuery, listItemsQuery } from "@/features/movie-lists/queries";
import type { MovieListItem } from "@/features/movie-lists/types";
import { MovieLink } from "@/features/movies/MovieLink";
import { MoviePoster } from "@/features/movies/MoviePoster";
import { releaseYear } from "@/features/movies/format";
import { ApiError } from "@/lib/api";
import { parsePositiveInteger } from "@/lib/numbers";
import { pageSearch, parsePage } from "@/lib/pagination";
import type { Session } from "@/lib/session";
import { TEXT_LINK_CLASS_NAME } from "@/lib/utils";

export function ListPage() {
    const { id = "" } = useParams();
    const { session } = useAuth();
    const [searchParams] = useSearchParams();
    const listId = parsePositiveInteger(id);
    const page = parsePage(searchParams);

    if (listId === null) {
        return <ListNotFound />;
    }
    if (page === null) {
        return <Navigate to={pageSearch(1)} replace />;
    }

    return <ListDetails key={`${listId}:${session?.cacheId ?? "public"}`} id={listId} page={page} session={session} />;
}

function ListDetails({ id, page, session }: { id: number; page: number; session: Session | null }) {
    const { data: list, error, isFetching, refetch } = useQuery(listDetailQuery(id, session));
    const items = useQuery(listItemsQuery(id, page, session));

    if ([error, items.error].some((failure) => failure instanceof ApiError && failure.status === 404)) {
        return <ListNotFound />;
    }
    if (error !== null) {
        return <QueryError message="Impossible de charger la liste." error={error} onRetry={() => void refetch()} retrying={isFetching} />;
    }
    if (list === undefined) {
        return <SectionSkeleton label="Chargement de la liste…" className="h-32 w-full" />;
    }

    const author = list.user.username;

    return (
        <article className="space-y-8">
            <header className="space-y-3 border-b pb-6">
                <Link to="/lists" className={`text-sm text-muted-foreground ${TEXT_LINK_CLASS_NAME}`}>Toutes les listes publiques</Link>
                <h1 className="text-3xl font-semibold wrap-break-word">{list.name}</h1>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                    <span>Par <Link to={`/users/${author}/lists`} className={TEXT_LINK_CLASS_NAME}>{author}</Link></span>
                    {list.ranked && <span>Liste classée</span>}
                    {!list.public && (
                        <span className="inline-flex items-center gap-1 text-foreground">
                            <LockKeyhole className="size-4" aria-hidden="true" />
                            Liste privée
                        </span>
                    )}
                </div>
                {list.description && <p className="max-w-prose wrap-break-word whitespace-pre-wrap">{list.description}</p>}
            </header>
            <section aria-labelledby="list-films" className="space-y-4">
                <h2 id="list-films" className="text-lg font-semibold">{list.itemCount} {list.itemCount === 1 ? "film" : "films"}</h2>
                <PaginatedResults
                    result={items}
                    keepPreviousPage
                    page={page}
                    pathForPage={pageSearch}
                    label="Pagination des films de la liste"
                    emptyMessage="Cette liste ne contient encore aucun film."
                    errorMessage="Impossible de charger les films de la liste."
                >
                    {(entries) => (
                        <ul className="divide-y border-y">
                            {entries.map((item) => <ListMovie key={item.id} item={item} ranked={list.ranked} />)}
                        </ul>
                    )}
                </PaginatedResults>
            </section>
        </article>
    );
}

function ListMovie({ item, ranked }: { item: MovieListItem; ranked: boolean }) {
    const { movie, position, note } = item;
    const year = releaseYear(movie.releaseDate);

    return (
        <li className="flex items-start gap-3 py-4 sm:gap-5">
            {ranked && (
                <span className="min-w-8 pt-1 text-sm font-medium text-muted-foreground tabular-nums">
                    <span className="sr-only">Position </span>{position}
                </span>
            )}
            <MoviePoster movie={movie} alt="" className="w-12 shrink-0 rounded-md text-xs sm:w-16" loading="lazy" />
            <div className="min-w-0 space-y-1.5">
                <h3 className="wrap-break-word">
                    <MovieLink movieId={movie.id} className={TEXT_LINK_CLASS_NAME}>{movie.title}</MovieLink>
                    {year && <span className="ml-2 text-sm text-muted-foreground">{year}</span>}
                </h3>
                {note && <p className="max-w-prose text-sm wrap-break-word whitespace-pre-wrap text-muted-foreground">{note}</p>}
            </div>
        </li>
    );
}

function ListNotFound() {
    return (
        <section className="space-y-4 text-center">
            <h1 className="text-2xl font-semibold">Liste introuvable</h1>
            <Button asChild variant="outline">
                <Link to="/lists">Voir les listes publiques</Link>
            </Button>
        </section>
    );
}
