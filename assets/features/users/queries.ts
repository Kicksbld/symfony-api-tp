import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import type { MovieList } from "@/features/movie-lists/types";
import { diaryFilterParams, type DiaryFilters } from "@/features/users/diary-search";
import { apiFetch } from "@/lib/api";
import { sessionKey } from "@/lib/query-client";
import type { Session } from "@/lib/session";
import type { LogEntry, MovieRelationshipItem, Paginated, UserProfile } from "@/lib/types";

const PROFILE_PAGE_SIZE = 20;

export type MovieRelationshipList = "watched" | "likes" | "watchlist";

function userKey<T extends string>(username: string, resource: T): readonly ["users", string, T] {
    return ["users", username, resource];
}

function userPath(username: string, resource?: string): string {
    const path = `/users/${encodeURIComponent(username)}`;

    return resource === undefined ? path : `${path}/${resource}`;
}

function pageParams(page: number): Record<string, string> {
    return { page: String(page), limit: String(PROFILE_PAGE_SIZE) };
}

// Préfixe commun au profil et à ses onglets, pour tout relire après un changement du membre.
export function userQueriesKey(username: string): readonly ["users", string] {
    return ["users", username];
}

export function profileQuery(username: string) {
    return queryOptions({
        queryKey: userKey(username, "profile"),
        queryFn: ({ signal }) => apiFetch<UserProfile>(userPath(username), { signal, session: null }),
    });
}

export function diaryQuery(username: string, page: number, filters: DiaryFilters) {
    const params = new URLSearchParams({ ...pageParams(page), ...diaryFilterParams(filters) });

    return queryOptions({
        queryKey: [...userKey(username, "diary"), { page, ...filters }],
        queryFn: ({ signal }) => apiFetch<Paginated<LogEntry>>(`${userPath(username, "diary")}?${params}`, { signal, session: null }),
        placeholderData: (previous, query) => query?.queryKey[1] === username ? previous : undefined,
    });
}

export function movieRelationshipsQuery(username: string, list: MovieRelationshipList, page: number) {
    return queryOptions({
        queryKey: [...userKey(username, list), { page }],
        queryFn: ({ signal }) =>
            apiFetch<Paginated<MovieRelationshipItem>>(`${userPath(username, list)}?${new URLSearchParams(pageParams(page))}`, { signal, session: null }),
        placeholderData: (previous, query) => query?.queryKey[1] === username && query.queryKey[2] === list ? previous : undefined,
    });
}

export function profileListsQuery(username: string, page: number, ownerSession: Session | null) {
    const params = new URLSearchParams(pageParams(page));
    const scope = ownerSession === null ? [] : sessionKey(ownerSession);

    return queryOptions({
        queryKey: [...scope, ...userKey(username, "lists"), { page }],
        queryFn: ({ signal }) =>
            apiFetch<Paginated<MovieList>>(`${userPath(username, "lists")}?${params}`, { signal, session: ownerSession }),
        placeholderData: keepPreviousData,
    });
}
