import { queryOptions } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { MovieSummary, Paginated } from "@/lib/types";

const FEATURED_MOVIE_COUNT = 5;

// Le tri « tendances » départage par popularité TMDB : sans activité récente, on obtient les films populaires.
export function featuredMoviesQuery() {
    const params = new URLSearchParams({ sort: "trending", limit: "20" });

    return queryOptions({
        queryKey: ["movies", "featured"],
        queryFn: async ({ signal }) => {
            const movies = await apiFetch<Paginated<MovieSummary>>(`/movies?${params}`, { signal, session: null });

            // Le héros n'a de sens qu'avec une image de fond.
            return movies.items.filter((movie) => movie.backdropUrl !== null).slice(0, FEATURED_MOVIE_COUNT);
        },
    });
}
