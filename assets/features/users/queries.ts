import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import type { MovieList } from "@/features/movie-lists/types";
import { diaryFilterParams, type DiaryFilters } from "@/features/users/diary-search";
import { apiFetch } from "@/lib/api";
import { sessionKey } from "@/lib/query-client";
import type { Session } from "@/lib/session";
import type { LogEntry, MovieRelationshipItem, Paginated, PublicProfile } from "@/lib/types";

const PROFILE_PAGE_SIZE = 20;
export const MAX_USERNAME_LENGTH = 20;

export type MovieRelationshipList = "watched" | "likes" | "watchlist";
export type FollowList = "followers" | "following";

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
export function userQueriesKey(username: string, session: Session | null = null) {
    const scope = session === null ? [] : sessionKey(session);

    return [...scope, "users", username] as const;
}

export function profileQuery(username: string, session: Session | null) {
    return queryOptions({
        queryKey: [...userQueriesKey(username, session), "profile"],
        queryFn: ({ signal }) => apiFetch<PublicProfile>(userPath(username), { signal, session }),
    });
}

export const memberSearchKey = ["member-search"] as const;
export const followListsKey = ["follow-lists"] as const;

// followedByMe dépend du membre connecté : chaque session a ses propres résultats.
function viewerScope(session: Session | null): number | "public" {
    return session?.cacheId ?? "public";
}

export function membersQuery(username: string, page: number, session: Session | null) {
    const params = new URLSearchParams(pageParams(page));
    if (username !== "") {
        params.set("q", username);
    }

    return queryOptions({
        queryKey: [...memberSearchKey, viewerScope(session), { username, page }],
        queryFn: ({ signal }) => apiFetch<Paginated<PublicProfile>>(`/users?${params}`, { signal, session }),
        placeholderData: keepPreviousData,
    });
}

export function followListKey(username: string, list: FollowList) {
    return [...followListsKey, username, list] as const;
}

export function followListQuery(username: string, list: FollowList, page: number, session: Session | null) {
    const params = new URLSearchParams(pageParams(page));

    return queryOptions({
        queryKey: [...followListKey(username, list), viewerScope(session), { page }],
        queryFn: ({ signal }) => apiFetch<Paginated<PublicProfile>>(`${userPath(username, list)}?${params}`, { signal, session }),
        placeholderData: keepPreviousData,
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

export function profileListsKey(username: string, session: Session | null) {
    return [...userQueriesKey(username, session), "lists"] as const;
}

export function profileListsQuery(username: string, page: number, session: Session | null) {
    const params = new URLSearchParams(pageParams(page));

    return queryOptions({
        queryKey: [...profileListsKey(username, session), { page }],
        queryFn: ({ signal }) =>
            apiFetch<Paginated<MovieList>>(`${userPath(username, "lists")}?${params}`, { signal, session }),
        placeholderData: keepPreviousData,
    });
}
