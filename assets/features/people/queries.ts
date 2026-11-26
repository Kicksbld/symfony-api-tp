import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { MovieSummary, Paginated, PersonDetail, PersonSummary } from "@/lib/types";

const PEOPLE_PAGE_SIZE = 24;

// L'API refuse une recherche de plus de 255 caractères.
export const MAX_PERSON_NAME_LENGTH = 255;

export function peopleQuery(q: string, page: number) {
    const params = new URLSearchParams({ q, page: String(page), limit: String(PEOPLE_PAGE_SIZE) });

    return queryOptions({
        queryKey: ["people", Object.fromEntries(params)],
        queryFn: ({ signal }) => apiFetch<Paginated<PersonSummary>>(`/people?${params}`, { signal, session: null }),
        // La recherche part pendant la frappe : on garde les résultats précédents au lieu de faire clignoter la liste.
        placeholderData: keepPreviousData,
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
