import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { LIST_MEMBER_PATTERN, LIST_SORTS, MAX_LIST_SEARCH_LENGTH, listFilterParams, readListFilters, type ListFilters } from "@/features/movie-lists/list-search";
import { MoviePicker } from "@/features/movies/MoviePicker";
import { movieQuery } from "@/features/movies/queries";

type ListFilterFormProps = {
    filters: ListFilters;
    onSubmit: (filters: ListFilters) => void;
};

export function ListFilterForm({ filters, onSubmit }: ListFilterFormProps) {
    const [movie, setMovie] = useState(filters.movie);
    const hasFilters = Object.keys(listFilterParams(filters)).length > 0;

    function submit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        if (movie !== null) {
            data.set("movie", String(movie));
        }
        onSubmit(readListFilters(data));
    }

    return (
        <div role="search" aria-label="Rechercher des listes" className="space-y-4 rounded-lg border p-4">
            <form id="list-filters" onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
                <div className="space-y-1.5">
                    <Label htmlFor="list-name">Nom de la liste</Label>
                    <Input id="list-name" name="q" type="search" defaultValue={filters.q} maxLength={MAX_LIST_SEARCH_LENGTH} />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="list-member">Pseudo du membre</Label>
                    <Input
                        id="list-member"
                        name="user"
                        defaultValue={filters.user}
                        pattern={LIST_MEMBER_PATTERN}
                        maxLength={20}
                        autoCapitalize="none"
                        spellCheck={false}
                        title="Entre 3 et 20 lettres, chiffres ou tirets bas"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="list-sort">Trier par</Label>
                    <NativeSelect id="list-sort" name="sort" className="w-full" defaultValue={filters.sort}>
                        {LIST_SORTS.map(({ value, label }) => <NativeSelectOption key={value} value={value}>{label}</NativeSelectOption>)}
                    </NativeSelect>
                </div>
            </form>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <MoviePicker
                        selected={[]}
                        disabled={false}
                        onSelect={({ id }) => setMovie(id)}
                        triggerLabel={movie === null ? "Choisir un film" : "Changer de film"}
                        title="Filtrer par film"
                    />
                    {movie !== null && <SelectedMovie id={movie} onRemove={() => setMovie(null)} />}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {hasFilters && <Button asChild variant="ghost"><Link to="/lists">Effacer les filtres</Link></Button>}
                    <Button type="submit" form="list-filters">Rechercher</Button>
                </div>
            </div>
        </div>
    );
}

function SelectedMovie({ id, onRemove }: { id: number; onRemove: () => void }) {
    const { data: movie } = useQuery(movieQuery(id));

    return (
        <div className="flex items-center gap-2 text-sm">
            <span>{movie?.title ?? `Film n° ${id}`}</span>
            <Button type="button" variant="outline" size="icon" onClick={onRemove} aria-label="Retirer le filtre par film">
                <X aria-hidden="true" />
            </Button>
        </div>
    );
}
