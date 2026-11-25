import { Search } from "lucide-react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { DECADES, MAX_TITLE_LENGTH, MOVIE_SORTS, catalogPath, findMovieSort, hasCatalogFilters, withoutFilters, type CatalogSearch } from "@/features/movies/catalog-search";
import type { Genre } from "@/lib/types";

type CatalogFiltersProps = {
    search: CatalogSearch;
    genres: Genre[] | undefined;
    onChange: (search: CatalogSearch) => void;
};

export function CatalogFilters({ search, genres, onChange }: CatalogFiltersProps) {
    function submitTitle(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        const title = new FormData(event.currentTarget).get("q");
        onChange({ ...search, q: typeof title === "string" ? title.trim() : "" });
    }

    return (
        <div className="flex flex-wrap items-end gap-3">
            {/* La clé recrée le champ à chaque changement d'URL (Précédent, autre filtre) : un titre tapé mais pas validé disparaît. */}
            <form key={catalogPath(search)} role="search"onSubmit={submitTitle} className="flex min-w-60 flex-1 items-end gap-2">
                <div className="flex-1 space-y-1.5">
                    <Label htmlFor="catalog-title">Titre</Label>
                    <Input id="catalog-title" name="q" type="search" defaultValue={search.q} maxLength={MAX_TITLE_LENGTH} placeholder="Rechercher un film" />
                </div>
                <Button type="submit" variant="outline" size="icon" aria-label="Rechercher">
                    <Search aria-hidden="true" />
                </Button>
            </form>
            <div className="space-y-1.5">
                <Label htmlFor="catalog-genre">Genre</Label>
                <NativeSelect
                    id="catalog-genre"
                    value={search.genre ?? ""}
                    disabled={genres === undefined}
                    onChange={(event) => onChange({ ...search, genre: optionalNumber(event.target.value) })}
                >
                    <NativeSelectOption value="">Tous les genres</NativeSelectOption>
                    {genres?.map((genre) => (
                        <NativeSelectOption key={genre.id} value={genre.id}>
                            {genre.name}
                        </NativeSelectOption>
                    ))}
                </NativeSelect>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="catalog-decade">Décennie</Label>
                <NativeSelect
                    id="catalog-decade"
                    value={search.decade ?? ""}
                    onChange={(event) => onChange({ ...search, decade: optionalNumber(event.target.value) })}
                >
                    <NativeSelectOption value="">Toutes</NativeSelectOption>
                    {DECADES.map((decade) => (
                        <NativeSelectOption key={decade} value={decade}>
                            Années {decade}
                        </NativeSelectOption>
                    ))}
                </NativeSelect>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="catalog-sort">Trier par</Label>
                <NativeSelect id="catalog-sort" value={search.sort} onChange={(event) => onChange({ ...search, sort: findMovieSort(event.target.value) ?? search.sort })}>
                    {MOVIE_SORTS.map((sort) => (
                        <NativeSelectOption key={sort.value} value={sort.value}>
                            {sort.label}
                        </NativeSelectOption>
                    ))}
                </NativeSelect>
            </div>
            {hasCatalogFilters(search) && (
                <Button variant="ghost" onClick={() => onChange(withoutFilters(search))}>
                    Effacer les filtres
                </Button>
            )}
        </div>
    );
}

// L'option « Tous » ou « Toutes » a une valeur vide, qui veut dire sans filtre.
function optionalNumber(value: string): number | null {
    return value === "" ? null : Number(value);
}
