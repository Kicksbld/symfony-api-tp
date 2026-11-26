import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { sessionKey } from "@/lib/query-client";
import type { Session } from "@/lib/session";
import type { LogEntry, Paginated } from "@/lib/types";

type FeedEntry = LogEntry & { likedByMe: boolean };

export function feedKey(session: Session) {
    return [...sessionKey(session), "feed"] as const;
}

export function feedQuery(session: Session, page: number) {
    const params = new URLSearchParams({ page: String(page), limit: "20" });

    return queryOptions({
        queryKey: [...feedKey(session), { page }],
        queryFn: ({ signal }) => apiFetch<Paginated<FeedEntry>>(`/feed?${params}`, { signal, session }),
        placeholderData: keepPreviousData,
    });
}
