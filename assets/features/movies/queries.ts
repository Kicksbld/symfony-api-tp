import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Genre, MovieDetail, MovieSummary, Paginated, RatingDistribution, WatchProvidersByType, WatchRegion } from "@/lib/types";
import { catalogSearchParams, type CatalogSearch } from "@/features/movies/catalog-search";

export const CATALOG_PAGE_SIZE = 24;

export type CatalogResult = {
    search: CatalogSearch;
    movies: Paginated<MovieSummary>;
};

// L'API pagine aussi les genres : TMDB en compte moins de 20, une seule page à 100 suffit.
const GENRES_PARAMS = { limit: "100" };

export function moviesQuery(search: CatalogSearch, enabled: boolean) {
    // L'URL omet les valeurs par défaut, l'API reçoit tous les paramètres pour ne pas dépendre de ses propres défauts.
    const params = catalogSearchParams(search);
    params.set("sort", search.sort);
    params.set("page", String(search.page));
    params.set("limit", String(CATALOG_PAGE_SIZE));

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

export function genresQuery() {
    return queryOptions({
        queryKey: ["genres", GENRES_PARAMS],
        queryFn: async ({ signal }) => {
            const genres = await apiFetch<Paginated<Genre>>(`/genres?${new URLSearchParams(GENRES_PARAMS)}`, { signal, session: null });

            return genres.items;
        },
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
