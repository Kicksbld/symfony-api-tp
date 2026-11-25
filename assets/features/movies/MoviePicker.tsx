import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { QueryError } from "@/components/QueryError";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoviePoster } from "@/features/movies/MoviePoster";
import { DEFAULT_CATALOG_SEARCH, MAX_TITLE_LENGTH } from "@/features/movies/catalog-search";
import { releaseYear } from "@/features/movies/format";
import { moviesQuery } from "@/features/movies/queries";
import type { MovieSummary } from "@/lib/types";

type MoviePickerProps = {
    selected: MovieSummary[];
    disabled: boolean;
    onSelect: (movie: MovieSummary) => void;
    triggerLabel?: string;
    title?: string;
};

export function MoviePicker({ selected, disabled, onSelect, triggerLabel = "Ajouter un film", title = "Ajouter un film favori" }: MoviePickerProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState({ title: "", page: 1 });
    const { data, error, isFetching, isPlaceholderData, refetch } = useQuery(
        moviesQuery({ ...DEFAULT_CATALOG_SEARCH, q: search.title, page: search.page }, open && search.title !== ""),
    );

    function submit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        const title = String(new FormData(event.currentTarget).get("q") ?? "").trim();
        setSearch({ title, page: 1 });
    }

    function changeOpen(next: boolean): void {
        if (!next || !disabled) {
            setOpen(next);
        }
    }

    return (
        <Dialog open={open} onOpenChange={changeOpen}>
            <DialogTrigger asChild>
                <Button type="button" variant="outline" aria-disabled={disabled} className="aria-disabled:opacity-50">
                    <Plus aria-hidden="true" />
                    {triggerLabel}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>Recherchez un film par son titre dans le catalogue.</DialogDescription>
                </DialogHeader>
                <form role="search" onSubmit={submit} className="flex items-end gap-2">
                    <div className="min-w-0 flex-1 space-y-2">
                        <Label htmlFor="movie-picker-title">Titre</Label>
                        <Input id="movie-picker-title" name="q" type="search" defaultValue={search.title} maxLength={MAX_TITLE_LENGTH} />
                    </div>
                    <Button type="submit" variant="outline">Rechercher</Button>
                </form>
                {search.title !== "" && (
                    error !== null ? (
                        <QueryError message="Impossible de charger les films." error={error} onRetry={() => void refetch()} retrying={isFetching} />
                    ) : data === undefined || isPlaceholderData ? (
                        <p role="status" className="text-sm text-muted-foreground">Recherche en cours…</p>
                    ) : data.movies.items.length === 0 ? (
                        <p role="status" className="text-sm text-muted-foreground">Aucun film ne correspond à « {search.title} ».</p>
                    ) : (
                        <div className="space-y-3">
                            <ul className="space-y-1">
                                {data.movies.items.map((movie) => {
                                    const alreadySelected = selected.some(({ id }) => id === movie.id);
                                    const year = releaseYear(movie.releaseDate);

                                    return (
                                        <li key={movie.id}>
                                            <Button
                                                variant="ghost"
                                                className="h-auto w-full justify-start whitespace-normal px-2 py-1.5 text-left"
                                                disabled={disabled || alreadySelected}
                                                onClick={() => {
                                                    onSelect(movie);
                                                    setOpen(false);
                                                }}
                                            >
                                                <MoviePoster movie={movie} alt="" className="w-8 shrink-0 overflow-hidden rounded text-[0.5rem]" loading="lazy" />
                                                <span>{movie.title}{year && ` (${year})`}{alreadySelected && " · Déjà ajouté"}</span>
                                            </Button>
                                        </li>
                                    );
                                })}
                            </ul>
                            {data.movies.lastPage > 1 && (
                                <nav aria-label="Pagination de la recherche de films" className="flex flex-wrap items-center justify-between gap-2">
                                    <Button variant="outline" disabled={search.page === 1} onClick={() => setSearch({ ...search, page: search.page - 1 })}>
                                        Précédente
                                    </Button>
                                    <span className="text-sm text-muted-foreground">Page {search.page} sur {data.movies.lastPage}</span>
                                    <Button variant="outline" disabled={search.page >= data.movies.lastPage} onClick={() => setSearch({ ...search, page: search.page + 1 })}>
                                        Suivante
                                    </Button>
                                </nav>
                            )}
                        </div>
                    )
                )}
            </DialogContent>
        </Dialog>
    );
}
