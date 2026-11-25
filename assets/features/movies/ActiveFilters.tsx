import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { activeFilters, withoutFilter, withoutFilters, type CatalogFilter, type CatalogSearch } from "@/features/movies/catalog-search";
import { countryLabel, countryName } from "@/features/movies/regions";
import type { CatalogReferences } from "@/features/movies/useCatalogReferences";

type ActiveFiltersProps = {
    search: CatalogSearch;
    references: CatalogReferences;
    onChange: (search: CatalogSearch) => void;
};

export function ActiveFilters({ search, references, onChange }: ActiveFiltersProps) {
    const filters = activeFilters(search);

    if (filters.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center gap-2">
            <ul aria-label="Filtres actifs" className="flex flex-wrap gap-2">
                {filters.map((filter) => {
                    const label = filterLabel(filter, search, references);

                    return (
                        <li key={filter}>
                            <Button variant="secondary" size="sm" aria-label={`Retirer le filtre ${label}`} onClick={() => onChange(withoutFilter(search, filter))}>
                                {label}
                                <X aria-hidden="true" />
                            </Button>
                        </li>
                    );
                })}
            </ul>
            <Button variant="ghost" size="sm" onClick={() => onChange(withoutFilters(search))}>
                Effacer les filtres
            </Button>
        </div>
    );
}

// Tant qu'un référentiel charge, le nom est remplacé par des points de suspension.
function filterLabel(filter: CatalogFilter, search: CatalogSearch, references: CatalogReferences): string {
    switch (filter) {
        case "q":
            return `Titre : « ${search.q} »`;
        case "genre":
            return `Genre : ${references.genres?.find((genre) => genre.id === search.genre)?.name ?? "…"}`;
        case "decade":
            return `Années ${search.decade}`;
        case "year":
            return `Année ${search.year}`;
        case "country": {
            const country = references.countries?.find((candidate) => candidate.code === search.country);

            return `Pays de production : ${country === undefined ? "…" : countryLabel(country)}`;
        }
        case "company":
            return `Studio : ${references.company?.name ?? "…"}`;
        case "person":
            return `Personne : ${references.person?.name ?? "…"}`;
        case "provider": {
            const provider = references.providers?.find((candidate) => candidate.id === search.provider);

            return `Plateforme : ${provider?.name ?? "…"} (${countryName(search.region)})`;
        }
    }
}
