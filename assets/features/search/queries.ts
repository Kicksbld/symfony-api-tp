import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { MAX_USERNAME_LENGTH } from "@/features/users/queries";
import type { MovieSummary, Paginated, PersonSummary, UserSummary } from "@/lib/types";

const SUGGESTION_COUNT = 5;

const NO_MEMBERS: Paginated<UserSummary> = { items: [], total: 0, lastPage: 1 };

export type SearchSuggestions = {
    movies: Paginated<MovieSummary>;
    people: Paginated<PersonSummary>;
    members: Paginated<UserSummary>;
};

export function searchSuggestionsQuery(term: string) {
    const params = new URLSearchParams({ q: term, limit: String(SUGGESTION_COUNT) });

    return queryOptions({
        queryKey: ["search", term],
        queryFn: async ({ signal }): Promise<SearchSuggestions> => {
            const [movies, people, members] = await Promise.all([
                apiFetch<Paginated<MovieSummary>>(`/movies?${params}`, { signal, session: null }),
                apiFetch<Paginated<PersonSummary>>(`/people?${params}`, { signal, session: null }),
                // Un pseudo fait 20 caractères au plus : l'API refuserait une recherche plus longue.
                term.length > MAX_USERNAME_LENGTH ? NO_MEMBERS : apiFetch<Paginated<UserSummary>>(`/users?${params}`, { signal, session: null }),
            ]);

            return { movies, people, members };
        },
        placeholderData: keepPreviousData,
    });
}
