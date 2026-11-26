import { useQuery } from "@tanstack/react-query";
import { LockKeyhole } from "lucide-react";
import { Link, Navigate, useParams, useSearchParams } from "react-router";
import { QueryError } from "@/components/QueryError";
import { SectionSkeleton } from "@/components/SectionSkeleton";
import { NotFoundMessage } from "@/components/NotFoundMessage";
import { useAuth } from "@/features/auth/auth";
import { ListActions } from "@/features/movie-lists/ListActions";
import { Comments } from "@/features/comments/Comments";
import { commentsQuery, type CommentThread } from "@/features/comments/queries";
import { EditableListFilms, ListFilms } from "@/features/movie-lists/ListFilms";
import { ListLikeButton } from "@/features/movie-lists/ListLikeButton";
import { listDetailQuery, listItemsQuery } from "@/features/movie-lists/queries";
import { MoviePoster } from "@/features/movies/MoviePoster";
import { UserAvatar } from "@/features/users/UserAvatar";
import { ApiError } from "@/lib/api";
import { parsePositiveInteger } from "@/lib/numbers";
import { pageSearch, parsePage } from "@/lib/pagination";
import type { Session } from "@/lib/session";

export function ListPage() {
    const { id = "" } = useParams();
    const { session } = useAuth();
    const [searchParams] = useSearchParams();
    const listId = parsePositiveInteger(id);
    const page = parsePage(searchParams);
    const rawCommentsPage = searchParams.get("commentsPage");
    const commentsPage = rawCommentsPage === null ? 1 : parsePositiveInteger(rawCommentsPage);

    if (listId === null) {
        return <ListNotFound />;
    }
    if (page === null || commentsPage === null) {
        return <Navigate to={listPaginationSearch(page ?? 1, commentsPage ?? 1)} replace />;
    }

    return <ListDetails key={`${listId}:${session?.cacheId ?? "public"}`} id={listId} page={page} commentsPage={commentsPage} session={session} />;
}

function listPaginationSearch(filmsPage: number, commentsPage: number) {
    return pageSearch(filmsPage, commentsPage === 1 ? {} : { commentsPage: String(commentsPage) });
}

function ListDetails({ id, page, commentsPage, session }: { id: number; page: number; commentsPage: number; session: Session | null }) {
    const { data: list, error, isFetching, refetch } = useQuery(listDetailQuery(id, session));
    const items = useQuery(listItemsQuery(id, page, session));
    const thread: CommentThread = { resource: "lists", id };
    const comments = useQuery(commentsQuery(thread, commentsPage, session));

    if ([error, items.error, comments.error].some((failure) => failure instanceof ApiError && failure.status === 404)) {
        return <ListNotFound />;
    }
    if (error !== null) {
        return <QueryError message="Impossible de charger la liste." error={error} onRetry={() => void refetch()} retrying={isFetching} />;
    }
    if (list === undefined) {
        return <SectionSkeleton label="Chargement de la liste…" className="h-64 w-full rounded-3xl" />;
    }

    const author = list.user.username;
    const ownerSession = session?.user.id === list.user.id ? session : null;
    const pathForFilms = (next: number) => listPaginationSearch(next, commentsPage);

    return (
        <article className="space-y-12">
            <header className="relative isolate overflow-hidden rounded-3xl border border-white/5 bg-card/40 p-6 sm:p-10">
                {list.previewMovies[0]?.backdropUrl != null && (
                    <img src={list.previewMovies[0].backdropUrl} alt="" className="absolute inset-0 -z-10 size-full scale-110 object-cover opacity-30 blur-2xl" />
                )}
                <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background/95 to-background/40" />
                <div className="flex flex-col gap-8 md:flex-row md:items-end">
                    {list.previewMovies.length > 0 && (
                        <div aria-hidden="true" className="flex w-56 shrink-0">
                            {list.previewMovies.map((movie, position) => (
                                <div key={movie.id} className="-mr-[14%] w-1/3 overflow-hidden rounded-md shadow-[4px_0_12px_rgb(0_0_0/0.6)] ring-1 ring-white/10" style={{ zIndex: list.previewMovies.length - position }}>
                                    <MoviePoster movie={movie} alt="" className="text-[0.5rem]" />
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="min-w-0 flex-1 space-y-4">
                        <p className="eyebrow flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span>{list.ranked ? "Liste classée" : "Liste"}</span>
                            {!list.public && (
                                <span className="inline-flex items-center gap-1 text-foreground">
                                    <LockKeyhole className="size-3.5" aria-hidden="true" />
                                    Privée
                                </span>
                            )}
                        </p>
                        <h1 className="text-4xl font-extrabold wrap-break-word sm:text-5xl">{list.name}</h1>
                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                            <UserAvatar username={author} className="size-7 text-[0.65rem]" />
                            Par{" "}
                            <Link to={`/users/${author}/lists`} className="font-semibold text-foreground underline-offset-4 hover:underline">
                                {author}
                            </Link>
                        </p>
                        {list.description && <p className="max-w-prose leading-relaxed wrap-break-word whitespace-pre-wrap text-foreground/80">{list.description}</p>}
                        <div className="flex flex-wrap items-start gap-2">
                            <ListLikeButton list={list} />
                            {ownerSession !== null && <ListActions session={ownerSession} list={list} />}
                        </div>
                    </div>
                </div>
            </header>
            {ownerSession === null
                ? <ListFilms list={list} page={page} pathForPage={pathForFilms} result={items} />
                : <EditableListFilms list={list} page={page} pathForPage={pathForFilms} result={items} session={ownerSession} />}
            <Comments thread={thread} ownerId={list.user.id} page={commentsPage} pathForPage={(next) => listPaginationSearch(page, next)} result={comments} session={session} />
        </article>
    );
}

function ListNotFound() {
    return <NotFoundMessage title="Liste introuvable" message="Cette liste n'existe pas ou son auteur l'a rendue privée." action={{ to: "/lists", label: "Voir les listes publiques" }} />;
}
