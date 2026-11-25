import { isWatchRegion } from "@/features/movies/regions";
import { parsePositiveInteger } from "@/lib/numbers";
import { DEFAULT_WATCH_REGION, type WatchRegion } from "@/lib/types";

export const MOVIE_SORTS = [
    { value: "popular", label: "Populaires" },
    { value: "trending", label: "Tendances de la semaine" },
    { value: "rating", label: "Mieux notés" },
    { value: "releaseDate", label: "Plus récents" },
    { value: "title", label: "Titre (A à Z)" },
] as const;

export type MovieSort = (typeof MOVIE_SORTS)[number]["value"];

// Le catalogue importé depuis TMDB ne contient aucun film avant 1900.
const FIRST_YEAR = 1900;
const LAST_YEAR = new Date().getFullYear();
const LAST_DECADE = Math.floor(LAST_YEAR / 10) * 10;
export const MAX_TITLE_LENGTH = 255;

export const DECADES = Array.from({ length: (LAST_DECADE - FIRST_YEAR) / 10 + 1 }, (_, index) => LAST_DECADE - index * 10);

export type CatalogSearch = {
    q: string;
    genre: number | null;
    decade: number | null;
    year: number | null;
    // Code ISO du pays de production.
    country: string | null;
    company: number | null;
    person: number | null;
    provider: number | null;
    // Pays de diffusion de la plateforme. On le garde même sans plateforme, c'est un choix de l'utilisateur.
    region: WatchRegion;
    sort: MovieSort;
    page: number;
};

export const DEFAULT_CATALOG_SEARCH: CatalogSearch = {
    q: "",
    genre: null,
    decade: null,
    year: null,
    country: null,
    company: null,
    person: null,
    provider: null,
    region: DEFAULT_WATCH_REGION,
    sort: "popular",
    page: 1,
};

const CATALOG_FILTERS = ["q", "genre", "decade", "year", "country", "company", "person", "provider"] as const;

export type CatalogFilter = (typeof CATALOG_FILTERS)[number];

type ParsedCatalogSearch = {
    search: CatalogSearch;
    hasInvalidParams: boolean;
};

/**
 * Lit les critères de l'URL. Une valeur invalide (lien modifié à la main, ancien lien partagé) retombe sur la valeur
 * par défaut au lieu de provoquer une erreur 422 de l'API.
 */
export function parseCatalogSearch(searchParams: URLSearchParams): ParsedCatalogSearch {
    let hasInvalidParams = false;

    function read<T>(name: string, parse: (value: string) => T | null, fallback: T): T {
        const value = searchParams.get(name);
        if (value === null) {
            return fallback;
        }

        const parsed = parse(value);
        if (parsed === null) {
            hasInvalidParams = true;
            return fallback;
        }

        return parsed;
    }

    const search: CatalogSearch = {
        q: read("q", parseTitle, ""),
        genre: read("genre", parsePositiveInteger, null),
        decade: read("decade", (value) => DECADES.find((decade) => String(decade) === value) ?? null, null),
        year: read("year", parseYear, null),
        country: read("country", (value) => (/^[A-Z]{2}$/.test(value) ? value : null), null),
        company: read("company", parsePositiveInteger, null),
        person: read("person", parsePositiveInteger, null),
        provider: read("provider", parsePositiveInteger, null),
        region: read("region", (value) => (isWatchRegion(value) ? value : null), DEFAULT_CATALOG_SEARCH.region),
        sort: read("sort", findMovieSort, DEFAULT_CATALOG_SEARCH.sort),
        page: read("page", parsePositiveInteger, 1),
    };

    if (search.year !== null && !selectableYears(search.decade).includes(search.year)) {
        hasInvalidParams = true;
        search.year = null;
    }

    return { search, hasInvalidParams };
}

// Seuls les critères différents des valeurs par défaut apparaissent dans l'URL, pour garder des liens courts.
export function catalogSearchParams(search: CatalogSearch): URLSearchParams {
    const params = new URLSearchParams();
    for (const [name, value] of Object.entries(search)) {
        if (value !== DEFAULT_CATALOG_SEARCH[name as keyof CatalogSearch]) {
            params.set(name, String(value));
        }
    }

    return params;
}

export function catalogPath(search: CatalogSearch): string {
    const params = catalogSearchParams(search).toString();

    return params === "" ? "/" : `/?${params}`;
}

// Lien partagé depuis une fiche (personne, studio, pays) : un seul filtre, le reste par défaut.
export function catalogPathWith(filters: Partial<CatalogSearch>): string {
    return catalogPath({ ...DEFAULT_CATALOG_SEARCH, ...filters });
}

export function activeFilters(search: CatalogSearch): CatalogFilter[] {
    return CATALOG_FILTERS.filter((filter) => search[filter] !== DEFAULT_CATALOG_SEARCH[filter]);
}

export function hasCatalogFilters(search: CatalogSearch): boolean {
    return activeFilters(search).length > 0;
}

export function withoutFilter(search: CatalogSearch, filter: CatalogFilter): CatalogSearch {
    return { ...search, [filter]: DEFAULT_CATALOG_SEARCH[filter], page: 1 };
}

// Le tri et le pays de diffusion ne sont pas des filtres : on les garde quand on efface les critères.
export function withoutFilters(search: CatalogSearch): CatalogSearch {
    return { ...DEFAULT_CATALOG_SEARCH, sort: search.sort, region: search.region };
}

// Les années proposées suivent la décennie choisie, pour ne pas combiner deux critères sans résultat.
export function selectableYears(decade: number | null): number[] {
    const newest = decade === null ? LAST_YEAR : Math.min(decade + 9, LAST_YEAR);
    const oldest = decade ?? FIRST_YEAR;

    return Array.from({ length: newest - oldest + 1 }, (_, index) => newest - index);
}

// Une année hors de la nouvelle décennie ne donnerait aucun film : on la retire.
export function withDecade(search: CatalogSearch, decade: number | null): CatalogSearch {
    const keepsYear = search.year !== null && selectableYears(decade).includes(search.year);

    return { ...search, decade, year: keepsYear ? search.year : null };
}

export function findMovieSort(value: string): MovieSort | null {
    return MOVIE_SORTS.find((sort) => sort.value === value)?.value ?? null;
}

// Un titre fait d'espaces ne filtre rien, et l'API refuse un titre de plus de 255 caractères.
function parseTitle(value: string): string | null {
    const title = value.trim();

    return title !== "" && title.length <= MAX_TITLE_LENGTH ? title : null;
}

function parseYear(value: string): number | null {
    const year = parsePositiveInteger(value);

    return year !== null && year >= FIRST_YEAR && year <= LAST_YEAR ? year : null;
}
