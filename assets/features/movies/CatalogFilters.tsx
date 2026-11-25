import { Search } from "lucide-react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { DECADES, MOVIE_SORTS, hasCatalogFilters, type CatalogSearch, type MovieSort } from "@/features/movies/catalog-search";
import type { Genre } from "@/lib/types";

type CatalogFiltersProps = {
    search: CatalogSearch;
    genres: Genre[] | undefined;
    onChange: (changes: Partial<CatalogSearch>) => void;
};

export function CatalogFilters({ search, genres, onChange }: CatalogFiltersProps) {
    function submitTitle(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        const title = new FormData(event.currentTarget).get("q");
        onChange({ q: typeof title === "string" ? title.trim() : "" });
    }

    return (
        <div className="flex flex-wrap items-end gap-3">
            {/* La clé recrée le champ quand l'URL change (Précédent, lien partagé) pour qu'il affiche la recherche en cours. */}
            <form key={search.q} role="search" onSubmit={submitTitle} className="flex min-w-60 flex-1 items-end gap-2">
                <div className="flex-1 space-y-1.5">
                    <Label htmlFor="catalog-title">Titre</Label>
                    <Input id="catalog-title" name="q" type="search" defaultValue={search.q} maxLength={255} placeholder="Rechercher un film" />
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
                    onChange={(event) => onChange({ genre: event.target.value === "" ? null : Number(event.target.value) })}
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
                    onChange={(event) => onChange({ decade: event.target.value === "" ? null : Number(event.target.value) })}
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
                <NativeSelect id="catalog-sort" value={search.sort} onChange={(event) => onChange({ sort: event.target.value as MovieSort })}>
                    {MOVIE_SORTS.map((sort) => (
                        <NativeSelectOption key={sort.value} value={sort.value}>
                            {sort.label}
                        </NativeSelectOption>
                    ))}
                </NativeSelect>
            </div>
            {hasCatalogFilters(search) && (
                <Button variant="ghost" onClick={() => onChange({ q: "", genre: null, decade: null })}>
                    Effacer les filtres
                </Button>
            )}
        </div>
    );
}
