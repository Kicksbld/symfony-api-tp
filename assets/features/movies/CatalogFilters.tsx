import { Search } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { DECADES, MAX_TITLE_LENGTH, MOVIE_SORTS, catalogPath, findMovieSort, selectableYears, withDecade, type CatalogSearch } from "@/features/movies/catalog-search";
import { countryLabel, countryName, isWatchRegion } from "@/features/movies/regions";
import type { CatalogReferences } from "@/features/movies/useCatalogReferences";
import { PersonPicker } from "@/features/people/PersonPicker";
import { WATCH_REGIONS } from "@/lib/types";

type CatalogFiltersProps = {
    search: CatalogSearch;
    references: CatalogReferences;
    onChange: (search: CatalogSearch) => void;
};

export function CatalogFilters({ search, references, onChange }: CatalogFiltersProps) {
    function submitTitle(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        const title = new FormData(event.currentTarget).get("q");
        onChange({ ...search, q: typeof title === "string" ? title.trim() : "" });
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-end gap-3">
                {/* La clé recrée le champ à chaque changement d'URL (Précédent, autre filtre) : un titre tapé mais pas validé disparaît. */}
                <form key={catalogPath(search)} role="search" onSubmit={submitTitle} className="flex min-w-60 flex-1 items-end gap-2">
                    <div className="flex-1 space-y-1.5">
                        <Label htmlFor="catalog-title">Titre</Label>
                        <Input id="catalog-title" name="q" type="search" defaultValue={search.q} maxLength={MAX_TITLE_LENGTH} placeholder="Rechercher un film" />
                    </div>
                    <Button type="submit" variant="outline" size="icon" aria-label="Rechercher">
                        <Search aria-hidden="true" />
                    </Button>
                </form>
                <FilterField id="catalog-sort" label="Trier par">
                    <NativeSelect id="catalog-sort" value={search.sort} onChange={(event) => onChange({ ...search, sort: findMovieSort(event.target.value) ?? search.sort })}>
                        {MOVIE_SORTS.map((sort) => (
                            <NativeSelectOption key={sort.value} value={sort.value}>
                                {sort.label}
                            </NativeSelectOption>
                        ))}
                    </NativeSelect>
                </FilterField>
            </div>
            <div className="flex flex-wrap items-end gap-3">
                <FilterField id="catalog-genre" label="Genre">
                    <NativeSelect
                        id="catalog-genre"
                        value={search.genre ?? ""}
                        disabled={references.genres === undefined}
                        onChange={(event) => onChange({ ...search, genre: optionalNumber(event.target.value) })}
                    >
                        <NativeSelectOption value="">Tous les genres</NativeSelectOption>
                        {references.genres?.map((genre) => (
                            <NativeSelectOption key={genre.id} value={genre.id}>
                                {genre.name}
                            </NativeSelectOption>
                        ))}
                    </NativeSelect>
                </FilterField>
                <FilterField id="catalog-decade" label="Décennie">
                    <NativeSelect id="catalog-decade" value={search.decade ?? ""} onChange={(event) => onChange(withDecade(search, optionalNumber(event.target.value)))}>
                        <NativeSelectOption value="">Toutes</NativeSelectOption>
                        {DECADES.map((decade) => (
                            <NativeSelectOption key={decade} value={decade}>
                                Années {decade}
                            </NativeSelectOption>
                        ))}
                    </NativeSelect>
                </FilterField>
                <FilterField id="catalog-year" label="Année">
                    <NativeSelect id="catalog-year" value={search.year ?? ""} onChange={(event) => onChange({ ...search, year: optionalNumber(event.target.value) })}>
                        <NativeSelectOption value="">Toutes</NativeSelectOption>
                        {selectableYears(search.decade).map((year) => (
                            <NativeSelectOption key={year} value={year}>
                                {year}
                            </NativeSelectOption>
                        ))}
                    </NativeSelect>
                </FilterField>
                <FilterField id="catalog-country" label="Pays de production">
                    <NativeSelect
                        id="catalog-country"
                        value={search.country ?? ""}
                        disabled={references.countries === undefined}
                        onChange={(event) => onChange({ ...search, country: event.target.value === "" ? null : event.target.value })}
                    >
                        <NativeSelectOption value="">Tous les pays</NativeSelectOption>
                        {references.countries?.map((country) => (
                            <NativeSelectOption key={country.code} value={country.code}>
                                {countryLabel(country)}
                            </NativeSelectOption>
                        ))}
                    </NativeSelect>
                </FilterField>
                <FilterField id="catalog-provider" label="Plateforme">
                    <NativeSelect
                        id="catalog-provider"
                        value={search.provider ?? ""}
                        disabled={references.providers === undefined}
                        onChange={(event) => onChange({ ...search, provider: optionalNumber(event.target.value) })}
                    >
                        <NativeSelectOption value="">Toutes les plateformes</NativeSelectOption>
                        {references.providers?.map((provider) => (
                            <NativeSelectOption key={provider.id} value={provider.id}>
                                {provider.name}
                            </NativeSelectOption>
                        ))}
                    </NativeSelect>
                </FilterField>
                <FilterField id="catalog-region" label="Pays de diffusion">
                    <NativeSelect
                        id="catalog-region"
                        value={search.region}
                        onChange={(event) => {
                            if (isWatchRegion(event.target.value)) {
                                onChange({ ...search, region: event.target.value });
                            }
                        }}
                    >
                        {WATCH_REGIONS.map((region) => (
                            <NativeSelectOption key={region} value={region}>
                                {countryName(region)}
                            </NativeSelectOption>
                        ))}
                    </NativeSelect>
                </FilterField>
                <PersonPicker
                    triggerLabel={search.person === null ? "Choisir une personne" : "Changer de personne"}
                    onSelect={(person) => onChange({ ...search, person: person.id })}
                />
            </div>
        </div>
    );
}

function FilterField({ id, label, children }: { id: string; label: string; children: ReactNode }) {
    return (
        <div className="space-y-1.5">
            <Label htmlFor={id}>{label}</Label>
            {children}
        </div>
    );
}

// L'option « Tous » ou « Toutes » a une valeur vide, qui veut dire sans filtre.
function optionalNumber(value: string): number | null {
    return value === "" ? null : Number(value);
}
