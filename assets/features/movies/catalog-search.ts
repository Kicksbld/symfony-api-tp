export const MOVIE_SORTS = [
    { value: "popular", label: "Populaires" },
    { value: "trending", label: "Tendances de la semaine" },
    { value: "rating", label: "Mieux notés" },
    { value: "releaseDate", label: "Plus récents" },
    { value: "title", label: "Titre (A à Z)" },
] as const;

export type MovieSort = (typeof MOVIE_SORTS)[number]["value"];

const FIRST_DECADE = 1900;
const LAST_DECADE = 2020;

export const DECADES = Array.from({ length: (LAST_DECADE - FIRST_DECADE) / 10 + 1 }, (_, index) => LAST_DECADE - index * 10);

export type CatalogSearch = {
    q: string;
    genre: number | null;
    decade: number | null;
    sort: MovieSort;
    page: number;
};

export const DEFAULT_CATALOG_SEARCH: CatalogSearch = { q: "", genre: null, decade: null, sort: "popular", page: 1 };

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
        q: searchParams.get("q")?.trim().slice(0, 255) ?? "",
        genre: read("genre", (value) => parsePositiveInteger(value), null),
        decade: read("decade", (value) => DECADES.find((decade) => String(decade) === value) ?? null, null),
        sort: read("sort", (value) => MOVIE_SORTS.find((sort) => sort.value === value)?.value ?? null, DEFAULT_CATALOG_SEARCH.sort),
        page: read("page", (value) => parsePositiveInteger(value), 1),
    };

    return { search, hasInvalidParams };
}

// Seuls les critères différents des valeurs par défaut apparaissent dans l'URL, pour garder des liens courts.
export function catalogSearchParams(search: CatalogSearch): URLSearchParams {
    const params = new URLSearchParams();
    if (search.q !== "") {
        params.set("q", search.q);
    }
    if (search.genre !== null) {
        params.set("genre", String(search.genre));
    }
    if (search.decade !== null) {
        params.set("decade", String(search.decade));
    }
    if (search.sort !== DEFAULT_CATALOG_SEARCH.sort) {
        params.set("sort", search.sort);
    }
    if (search.page !== 1) {
        params.set("page", String(search.page));
    }

    return params;
}

export function catalogPath(search: CatalogSearch): string {
    const params = catalogSearchParams(search).toString();

    return params === "" ? "/" : `/?${params}`;
}

export function hasCatalogFilters(search: CatalogSearch): boolean {
    return search.q !== "" || search.genre !== null || search.decade !== null;
}

function parsePositiveInteger(value: string): number | null {
    if (!/^\d+$/.test(value)) {
        return null;
    }

    const number = Number(value);

    return Number.isSafeInteger(number) && number >= 1 ? number : null;
}
