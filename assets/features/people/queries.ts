import { queryOptions } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { MovieSummary, Paginated, PersonDetail, PersonSummary } from "@/lib/types";

export const PEOPLE_PAGE_SIZE = 24;

export function peopleQuery(q: string, page: number) {
    const params = new URLSearchParams({ q, page: String(page), limit: String(PEOPLE_PAGE_SIZE) });

    return queryOptions({
        queryKey: ["people", Object.fromEntries(params)],
        queryFn: ({ signal }) => apiFetch<Paginated<PersonSummary>>(`/people?${params}`, { signal, session: null }),
    });
}

export function personQuery(id: number) {
    return queryOptions({
        queryKey: ["people", id],
        queryFn: ({ signal }) => apiFetch<PersonDetail>(`/people/${id}`, { signal, session: null }),
    });
}

// Sans poste, l'API liste tous les films de la personne une seule fois.
export function personMoviesQuery(id: number, job: string | null, page: number) {
    const params = new URLSearchParams({ page: String(page), limit: String(PEOPLE_PAGE_SIZE) });
    if (job !== null) {
        params.set("job", job);
    }

    return queryOptions({
        queryKey: ["people", id, "movies", Object.fromEntries(params)],
        queryFn: ({ signal }) => apiFetch<Paginated<MovieSummary>>(`/people/${id}/movies?${params}`, { signal, session: null }),
    });
}
