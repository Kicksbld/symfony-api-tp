import { useIsMutating, type UseQueryResult } from "@tanstack/react-query";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useLayoutEffect, useRef, useState, type ReactNode, type Ref } from "react";
import { Navigate, type To } from "react-router";
import { PaginatedResults } from "@/components/PaginatedList";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ListItemNoteButton } from "@/features/movie-lists/ListItemNoteButton";
import { useChangeListItemMutation } from "@/features/movie-lists/mutations";
import { listDetailKey } from "@/features/movie-lists/queries";
import type { MovieList, MovieListItem } from "@/features/movie-lists/types";
import { MovieLink } from "@/features/movies/MovieLink";
import { MoviePicker } from "@/features/movies/MoviePicker";
import { MoviePoster } from "@/features/movies/MoviePoster";
import { releaseYear } from "@/features/movies/format";
import { ApiError } from "@/lib/api";
import type { Session } from "@/lib/session";
import type { MovieSummary, Paginated } from "@/lib/types";
import { TEXT_LINK_CLASS_NAME } from "@/lib/utils";

const NOT_UNIQUE_VIOLATION = "urn:uuid:23bd9dbf-6b9b-41cd-a99e-4844bcf3077f";

type ListFilmsProps = {
    list: MovieList;
    page: number;
    pathForPage: (page: number) => To;
    result: UseQueryResult<Paginated<MovieListItem>>;
};

export function EditableListFilms({ list, page, pathForPage, result, session }: ListFilmsProps & { session: Session }) {
    const changeItem = useChangeListItemMutation(session, list.id);
    const busy = useIsMutating({ mutationKey: listDetailKey(list.id, session) }) > 0;
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const heading = useRef<HTMLHeadingElement>(null);
    const focusAfterChange = useRef<HTMLButtonElement>(null);
    const current = result.isPlaceholderData ? undefined : result.data;
    const disabled = busy || result.isError || current === undefined;

    useLayoutEffect(() => {
        const button = focusAfterChange.current;
        if (button === null || busy || result.isFetching || current === undefined || heading.current === null) {
            return;
        }

        focusAfterChange.current = null;
        if (document.activeElement === document.body) {
            (button.isConnected && !button.disabled ? button : heading.current).focus();
        }
    }, [busy, current, page, result.isFetching]);

    function add(movie: MovieSummary): void {
        setError("");
        setMessage("");
        changeItem.mutate({ type: "add", movie: movie.id }, {
            onSuccess: () => setMessage(`« ${movie.title} » a été ajouté à la liste.`),
            onError: (failure) => {
                const duplicate = failure instanceof ApiError && failure.violations.some(
                    ({ propertyPath, type }) => propertyPath === "movie" && type === NOT_UNIQUE_VIOLATION,
                );

                setError(duplicate ? `« ${movie.title} » figure déjà dans cette liste.` : "Le film n’a pas été ajouté. Réessayez.");
            },
        });
    }

    function move(item: MovieListItem, position: number, button: HTMLButtonElement): void {
        focusAfterChange.current = button === document.activeElement ? button : null;
        setError("");
        setMessage("");
        changeItem.mutate({ type: "update", id: item.id, fields: { position } }, {
            onSuccess: (saved) => {
                if (saved !== undefined) {
                    setMessage(`« ${item.movie.title} » est en position ${saved.position}.`);
                }
            },
            onError: () => setError("Le film n’a pas été déplacé. Réessayez."),
        });
    }

    function remove(item: MovieListItem, button: HTMLButtonElement): void {
        focusAfterChange.current = button === document.activeElement ? button : null;
        setError("");
        setMessage("");
        changeItem.mutate({ type: "remove", id: item.id }, {
            onSuccess: () => setMessage(`« ${item.movie.title} » a été retiré de la liste.`),
            onError: () => setError("Le film n’a pas été retiré. Réessayez."),
        });
    }

    const lastPage = Math.max(1, current?.lastPage ?? page);
    if (current !== undefined && !result.isError && page > lastPage) {
        return <Navigate to={pathForPage(lastPage)} replace />;
    }

    return (
        <ListFilms
            list={list}
            page={page}
            pathForPage={pathForPage}
            result={result}
            headingRef={heading}
            toolbar={(
                <>
                    <MoviePicker
                        selected={current?.items.map(({ movie }) => movie) ?? []}
                        disabled={busy}
                        title="Ajouter un film à la liste"
                        onSelect={add}
                    />
                    <p role="status" className={message ? "text-sm text-muted-foreground" : "sr-only"}>{message}</p>
                    {error && (
                        <Alert variant="destructive" role="alert">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </>
            )}
            actions={(item, total) => (
                <div className="flex flex-wrap items-center gap-2">
                    {([[-1, "Monter", ArrowUp], [1, "Descendre", ArrowDown]] as const).map(([step, label, Icon]) => {
                        const target = item.position + step;
                        const unavailable = disabled || target < 1 || target > total;

                        return (
                            <Button
                                key={label}
                                variant="outline"
                                size="icon-sm"
                                aria-label={`${label} « ${item.movie.title} »`}
                                title={label}
                                aria-disabled={unavailable}
                                className="aria-disabled:opacity-50"
                                onClick={(event) => {
                                    if (!unavailable) {
                                        move(item, target, event.currentTarget);
                                    }
                                }}
                            >
                                <Icon aria-hidden="true" />
                            </Button>
                        );
                    })}
                    <ListItemNoteButton
                        item={item}
                        disabled={disabled}
                        onSave={async (note) => {
                            setError("");
                            setMessage("");
                            await changeItem.mutateAsync({ type: "update", id: item.id, fields: { note } });
                            setMessage(note === null ? "La note a été retirée." : "La note a été enregistrée.");
                        }}
                    />
                    <Button variant="ghost" size="sm" disabled={disabled} aria-label={`Retirer « ${item.movie.title} » de la liste`} onClick={(event) => remove(item, event.currentTarget)}>
                        Retirer
                    </Button>
                </div>
            )}
        />
    );
}

export function ListFilms({ list, page, pathForPage, result, headingRef, toolbar, actions }: ListFilmsProps & {
    headingRef?: Ref<HTMLHeadingElement>;
    toolbar?: ReactNode;
    actions?: (item: MovieListItem, total: number) => ReactNode;
}) {
    return (
        <section aria-labelledby="list-films" className="space-y-4">
            <h2 id="list-films" ref={headingRef} tabIndex={actions === undefined ? undefined : -1} className="text-2xl font-bold sm:text-3xl">
                {list.itemCount} {list.itemCount === 1 ? "film" : "films"}
            </h2>
            {toolbar}
            <PaginatedResults
                result={result}
                keepPreviousPage
                page={page}
                pathForPage={pathForPage}
                label="Pagination des films de la liste"
                emptyMessage="Cette liste ne contient encore aucun film."
                errorMessage="Impossible de charger les films de la liste."
            >
                {(entries, total) => (
                    <ul className="divide-y divide-white/5">
                        {entries.map((item) => (
                            <ListMovie key={item.id} item={item} ranked={list.ranked}>{actions?.(item, total)}</ListMovie>
                        ))}
                    </ul>
                )}
            </PaginatedResults>
        </section>
    );
}

function ListMovie({ item, ranked, children }: { item: MovieListItem; ranked: boolean; children: ReactNode }) {
    const { movie, position, note } = item;
    const year = releaseYear(movie.releaseDate);

    return (
        <li className="flex items-center gap-4 py-4 sm:gap-6">
            {ranked && (
                <span className="w-12 shrink-0 text-right font-heading text-4xl font-extrabold tracking-tighter text-transparent tabular-nums [-webkit-text-stroke:1.5px_var(--color-primary)] sm:w-16 sm:text-5xl">
                    <span className="sr-only">Position </span>{position}
                </span>
            )}
            <MoviePoster movie={movie} alt="" className="w-14 shrink-0 rounded-md text-xs ring-1 ring-white/10 sm:w-20" loading="lazy" />
            <div className="min-w-0 space-y-1.5">
                <h3 className="text-lg font-bold wrap-break-word">
                    <MovieLink movieId={movie.id} className={TEXT_LINK_CLASS_NAME}>{movie.title}</MovieLink>
                    {year && <span className="ml-2 text-sm text-muted-foreground">{year}</span>}
                </h3>
                {note && <p className="max-w-prose text-sm wrap-break-word whitespace-pre-wrap text-muted-foreground">{note}</p>}
                {children}
            </div>
        </li>
    );
}
