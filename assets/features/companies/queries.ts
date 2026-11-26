import { queryOptions } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Company, MovieSummary, Paginated } from "@/lib/types";

export const COMPANY_MOVIES_PAGE_SIZE = 24;

export function companyQuery(id: number) {
    return queryOptions({
        queryKey: ["companies", id],
        queryFn: ({ signal }) => apiFetch<Company>(`/companies/${id}`, { signal, session: null }),
    });
}

// Les films d'un studio viennent du catalogue filtré. La clé reste sous « movies » pour être relue après un changement de
// note, mais avec son propre segment : le catalogue met en cache une autre forme de réponse pour les mêmes paramètres.
export function companyMoviesQuery(id: number, page: number) {
    const params = new URLSearchParams({ company: String(id), sort: "popular", page: String(page), limit: String(COMPANY_MOVIES_PAGE_SIZE) });

    return queryOptions({
        queryKey: ["movies", "company", id, { page }],
        queryFn: ({ signal }) => apiFetch<Paginated<MovieSummary>>(`/movies?${params}`, { signal, session: null }),
    });
}
