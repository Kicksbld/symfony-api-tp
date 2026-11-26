import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { QueryError } from "@/components/QueryError";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { MoviePoster } from "@/features/movies/MoviePoster";
import { DEFAULT_CATALOG_SEARCH, MAX_TITLE_LENGTH } from "@/features/movies/catalog-search";
import { releaseYear } from "@/features/movies/format";
import { moviesQuery } from "@/features/movies/queries";
import type { MovieSummary } from "@/lib/types";
import { useDebouncedValue } from "@/lib/useDebouncedValue";

type MoviePickerProps = {
    selected: MovieSummary[];
    disabled: boolean;
    onSelect: (movie: MovieSummary) => void;
    triggerLabel?: string;
    title?: string;
};

// En dessous, presque tous les titres correspondent : la liste n'aiderait pas à choisir.
const MIN_TITLE_LENGTH = 2;

export function MoviePicker({ selected, disabled, onSelect, triggerLabel = "Ajouter un film", title = "Ajouter un film favori" }: MoviePickerProps) {
    const [open, setOpen] = useState(false);

    function changeOpen(next: boolean): void {
        if (!next || !disabled) {
            setOpen(next);
        }
    }

    return (
        <Dialog open={open} onOpenChange={changeOpen}>
            <DialogTrigger asChild>
                <Button type="button" variant="outline" aria-disabled={disabled} className="h-10 rounded-full px-4 aria-disabled:opacity-50">
                    <Plus aria-hidden="true" />
                    {triggerLabel}
                </Button>
            </DialogTrigger>
            <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
                <DialogHeader className="p-5 pb-3">
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>Tapez un titre, les films du catalogue s'affichent pendant la frappe.</DialogDescription>
                </DialogHeader>
                {/* Le contenu est recréé à chaque ouverture : la recherche repart d'un champ vide. */}
                {open && (
                    <MovieResults
                        selected={selected}
                        disabled={disabled}
                        onSelect={(movie) => {
                            onSelect(movie);
                            setOpen(false);
                        }}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}

type MovieResultsProps = Pick<MoviePickerProps, "selected" | "disabled" | "onSelect">;

function MovieResults({ selected, disabled, onSelect }: MovieResultsProps) {
    const [term, setTerm] = useState("");
    const debouncedTerm = useDebouncedValue(term.trim());
    const searching = debouncedTerm.length >= MIN_TITLE_LENGTH;
    const { data, error, isFetching, refetch } = useQuery(moviesQuery({ ...DEFAULT_CATALOG_SEARCH, q: debouncedTerm }, searching));

    return (
        // Les résultats viennent déjà filtrés de l'API, cmdk ne doit pas les filtrer une seconde fois.
        <Command shouldFilter={false} className="rounded-none border-t">
            <CommandInput value={term} onValueChange={setTerm} maxLength={MAX_TITLE_LENGTH} placeholder="Titre du film…" className="h-11 text-base" />
            <CommandList className="max-h-[min(24rem,55dvh)]">
                {!searching && <p className="px-3 py-6 text-center text-sm text-muted-foreground">Tapez au moins 2 lettres.</p>}
                {searching && error !== null && (
                    <div className="p-3">
                        <QueryError message="Impossible de charger les films." error={error} onRetry={() => void refetch()} retrying={isFetching} />
                    </div>
                )}
                {searching && error === null && <CommandEmpty>{isFetching ? "Recherche en cours…" : "Aucun film ne correspond."}</CommandEmpty>}
                {searching && data !== undefined && (
                    <CommandGroup>
                        {data.movies.items.map((movie) => {
                            const alreadySelected = selected.some(({ id }) => id === movie.id);

                            return (
                                <CommandItem
                                    key={movie.id}
                                    value={String(movie.id)}
                                    disabled={disabled || alreadySelected}
                                    onSelect={() => onSelect(movie)}
                                    className="gap-3"
                                >
                                    <MoviePoster movie={movie} alt="" className="w-8 shrink-0 rounded text-[0.5rem]" loading="lazy" />
                                    <span className="min-w-0 flex-1 truncate font-medium">{movie.title}</span>
                                    <span className="text-xs text-muted-foreground">{alreadySelected ? "Déjà ajouté" : releaseYear(movie.releaseDate)}</span>
                                </CommandItem>
                            );
                        })}
                    </CommandGroup>
                )}
                {searching && data !== undefined && data.movies.lastPage > 1 && (
                    <p className="px-3 py-2 text-xs text-muted-foreground">Seuls les premiers résultats sont affichés, précisez le titre.</p>
                )}
            </CommandList>
        </Command>
    );
}
