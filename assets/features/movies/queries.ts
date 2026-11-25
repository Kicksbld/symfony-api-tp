import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Genre, MovieSummary, Paginated } from "@/lib/types";
import { catalogSearchParams, type CatalogSearch } from "@/features/movies/catalog-search";

export const CATALOG_PAGE_SIZE = 24;

export type CatalogResult = {
    search: CatalogSearch;
    movies: Paginated<MovieSummary>;
};

// L'API pagine aussi les genres : TMDB en compte moins de 20, une seule page à 100 suffit.
const GENRES_LIMIT = 100;

export function moviesQuery(search: CatalogSearch) {
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
    });
}

export function genresQuery() {
    return queryOptions({
        queryKey: ["genres"],
        queryFn: async ({ signal }) => {
            const genres = await apiFetch<Paginated<Genre>>(`/genres?limit=${GENRES_LIMIT}`, { signal, session: null });

            return genres.items;
        },
        staleTime: Infinity,
    });
}
