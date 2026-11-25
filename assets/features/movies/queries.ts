import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { MovieSummary, Paginated } from "@/lib/types";

export const POPULAR_MOVIES_PAGE_SIZE = 24;

export function popularMoviesQuery(page: number) {
    const params = { sort: "popular", page: String(page), limit: String(POPULAR_MOVIES_PAGE_SIZE) };

    return queryOptions({
        queryKey: ["movies", params],
        queryFn: async ({ signal }) => ({
            page,
            movies: await apiFetch<Paginated<MovieSummary>>(`/movies?${new URLSearchParams(params)}`, { signal, session: null }),
        }),
        placeholderData: keepPreviousData,
    });
}
