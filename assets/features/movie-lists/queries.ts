import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { listFilterParams, type ListFilters } from "@/features/movie-lists/list-search";
import type { ListComment, MovieList, MovieListItem } from "@/features/movie-lists/types";
import { apiFetch } from "@/lib/api";
import { sessionKey } from "@/lib/query-client";
import type { Session } from "@/lib/session";
import type { Paginated } from "@/lib/types";

const PAGE_SIZE = "20";

export function listDirectoryKey(session: Session | null) {
    const scope = session === null ? [] : sessionKey(session);

    return [...scope, "lists", "directory"] as const;
}

export function listDetailKey(id: number, session: Session | null) {
    const scope = session === null ? [] : sessionKey(session);

    return [...scope, "lists", id] as const;
}

function pageParams(page: number): Record<string, string> {
    return { page: String(page), limit: PAGE_SIZE };
}

export function publicListsQuery(filters: ListFilters, page: number, session: Session | null) {
    const params = new URLSearchParams({ ...listFilterParams(filters), ...pageParams(page), sort: filters.sort });

    return queryOptions({
        queryKey: [...listDirectoryKey(session), { ...filters, page }],
        queryFn: ({ signal }) => apiFetch<Paginated<MovieList>>(`/lists?${params}`, { signal, session }),
        placeholderData: keepPreviousData,
    });
}

export function listDetailQuery(id: number, session: Session | null) {
    return queryOptions({
        queryKey: listDetailKey(id, session),
        queryFn: ({ signal }) => apiFetch<MovieList>(`/lists/${id}`, { signal, session }),
    });
}

export function listItemsQuery(id: number, page: number, session: Session | null) {
    const params = new URLSearchParams(pageParams(page));

    return queryOptions({
        queryKey: [...listDetailKey(id, session), "items", { page }],
        queryFn: ({ signal }) => apiFetch<Paginated<MovieListItem>>(`/lists/${id}/items?${params}`, { signal, session }),
        placeholderData: keepPreviousData,
    });
}

export function listCommentsKey(id: number, session: Session | null) {
    return [...listDetailKey(id, session), "comments"] as const;
}

export function listCommentsQuery(id: number, page: number, session: Session | null) {
    const params = new URLSearchParams(pageParams(page));

    return queryOptions({
        queryKey: [...listCommentsKey(id, session), { page }],
        queryFn: ({ signal }) => apiFetch<Paginated<ListComment>>(`/lists/${id}/comments?${params}`, { signal, session }),
    });
}
