import { queryOptions } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { LogEntry, MovieRelationshipItem, Paginated, UserProfile } from "@/lib/types";

const PROFILE_PAGE_SIZE = 20;

type MovieRelationshipList = "watched" | "watchlist";

// Un profil est public : ses clés ne dépendent pas de la session, et ses requêtes partent sans token.
function userKey<T extends string>(username: string, resource: T): readonly ["users", string, T] {
    return ["users", username, resource];
}

function userPath(username: string, resource?: string): string {
    const path = `/users/${encodeURIComponent(username)}`;

    return resource === undefined ? path : `${path}/${resource}`;
}

function pageParams(page: number): URLSearchParams {
    return new URLSearchParams({ page: String(page), limit: String(PROFILE_PAGE_SIZE) });
}

export function watchlistKey(username: string): readonly ["users", string, "watchlist"] {
    return userKey(username, "watchlist");
}

export function profileQuery(username: string) {
    return queryOptions({
        queryKey: userKey(username, "profile"),
        queryFn: ({ signal }) => apiFetch<UserProfile>(userPath(username), { signal, session: null }),
    });
}

export function diaryQuery(username: string, page: number) {
    return queryOptions({
        queryKey: [...userKey(username, "diary"), { page }],
        queryFn: ({ signal }) => apiFetch<Paginated<LogEntry>>(`${userPath(username, "diary")}?${pageParams(page)}`, { signal, session: null }),
    });
}

export function movieRelationshipsQuery(username: string, list: MovieRelationshipList, page: number) {
    return queryOptions({
        queryKey: [...userKey(username, list), { page }],
        queryFn: ({ signal }) =>
            apiFetch<Paginated<MovieRelationshipItem>>(`${userPath(username, list)}?${pageParams(page)}`, { signal, session: null }),
    });
}
