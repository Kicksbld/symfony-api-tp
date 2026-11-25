import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { apiFetch, apiFetchAll } from "@/lib/api";
import type { Country, Genre, MovieDetail, MovieSummary, Paginated, RatingDistribution, WatchProvider, WatchProvidersByType, WatchRegion } from "@/lib/types";
import { catalogSearchParams, type CatalogSearch } from "@/features/movies/catalog-search";
import { countryLabel } from "@/features/movies/regions";

export const CATALOG_PAGE_SIZE = 24;

export type CatalogResult = {
    search: CatalogSearch;
    movies: Paginated<MovieSummary>;
};

export function moviesQuery(search: CatalogSearch, enabled: boolean) {
    // L'URL omet les valeurs par défaut, l'API reçoit tous les paramètres pour ne pas dépendre de ses propres défauts.
    const params = catalogSearchParams(search);
    params.set("sort", search.sort);
    params.set("page", String(search.page));
    params.set("limit", String(CATALOG_PAGE_SIZE));
    // L'API n'utilise le pays de diffusion qu'avec une plateforme : sans elle, il changerait la clé de cache pour rien.
    if (search.provider === null) {
        params.delete("region");
    } else {
        params.set("region", search.region);
    }

    return queryOptions({
        queryKey: ["movies", Object.fromEntries(params)],
        queryFn: async ({ signal }): Promise<CatalogResult> => ({
            search,
            movies: await apiFetch<Paginated<MovieSummary>>(`/movies?${params}`, { signal, session: null }),
        }),
        placeholderData: keepPreviousData,
        enabled,
    });
}

// Les référentiels sont paginés comme le reste de l'API : les États-Unis comptent plus de 100 plateformes.
export function genresQuery() {
    return queryOptions({
        queryKey: ["genres"],
        queryFn: ({ signal }) => apiFetchAll<Genre>("/genres", {}, signal),
        staleTime: Infinity,
    });
}

// Triés selon leur nom français, que l'API ne connaît pas.
export function countriesQuery() {
    return queryOptions({
        queryKey: ["countries"],
        queryFn: async ({ signal }) => {
            const countries = await apiFetchAll<Country>("/countries", {}, signal);

            return countries.sort((first, second) => countryLabel(first).localeCompare(countryLabel(second), "fr"));
        },
        staleTime: Infinity,
    });
}

// Seules les plateformes qui proposent au moins un film du catalogue dans ce pays. Pas de données temporaires au
// changement de pays : la liste de l'ancien pays validerait à tort la plateforme choisie.
export function watchProvidersQuery(region: WatchRegion) {
    return queryOptions({
        queryKey: ["watch-providers", { region }],
        queryFn: ({ signal }) => apiFetchAll<WatchProvider>("/watch-providers", { region }, signal),
        staleTime: Infinity,
    });
}

export function movieQuery(id: number) {
    return queryOptions({
        queryKey: ["movies", id],
        queryFn: ({ signal }) => apiFetch<MovieDetail>(`/movies/${id}`, { signal, session: null }),
    });
}

// Clé sous celle de la fiche : relire la fiche après un journal relit aussi la répartition des notes.
export function movieRatingsQuery(id: number) {
    return queryOptions({
        queryKey: ["movies", id, "ratings"],
        queryFn: ({ signal }) => apiFetch<RatingDistribution>(`/movies/${id}/ratings`, { signal, session: null }),
    });
}

// Clé hors de celle de la fiche : un journal ne change pas les plateformes, inutile de les relire.
export function movieWatchProvidersQuery(id: number, region: WatchRegion) {
    return queryOptions({
        queryKey: ["watch-providers", { movie: id, region }],
        queryFn: ({ signal }) =>
            apiFetch<WatchProvidersByType>(`/movies/${id}/watch-providers?${new URLSearchParams({ region })}`, { signal, session: null }),
        placeholderData: keepPreviousData,
    });
}
