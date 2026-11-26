import { keepPreviousData, queryOptions, type QueryClient, type QueryFilters } from "@tanstack/react-query";
import { feedKey } from "@/features/feed/queries";
import { apiFetch } from "@/lib/api";
import { pageSearch } from "@/lib/pagination";
import { sessionKey } from "@/lib/query-client";
import { isCurrentSession, type Session } from "@/lib/session";
import type { LogEntry, Paginated } from "@/lib/types";

export type PublicLogEntry = LogEntry & { likedByMe: boolean };

type ReviewFilters = { movie?: string; user?: string };

export function reviewsPath(filters: ReviewFilters = {}) {
    return { pathname: "/reviews", ...pageSearch(1, filters) };
}

function logEntriesKey(session: Session | null) {
    return [...(session === null ? [] : sessionKey(session)), "log-entries"] as const;
}

function reviewsKey(session: Session | null) {
    return [...logEntriesKey(session), "reviews"] as const;
}

function logEntryKey(id: number, session: Session | null) {
    return [...logEntriesKey(session), id] as const;
}

export function reviewsQuery(filters: ReviewFilters, page: number, session: Session | null) {
    const params = new URLSearchParams({ ...filters, withReview: "true", page: String(page), limit: "20" });

    return queryOptions({
        queryKey: [...reviewsKey(session), { ...filters, page }],
        queryFn: ({ signal }) => apiFetch<Paginated<PublicLogEntry>>(`/log-entries?${params}`, { signal, session }),
        placeholderData: keepPreviousData,
    });
}

export function logEntryQuery(id: number, session: Session | null) {
    return queryOptions({
        queryKey: logEntryKey(id, session),
        queryFn: ({ signal }) => apiFetch<PublicLogEntry>(`/log-entries/${id}`, { signal, session }),
    });
}

function logEntryCollectionKeys(session: Session | null) {
    return session === null ? [reviewsKey(null)] : [reviewsKey(session), feedKey(session)];
}

export function logEntryViewKeys(id: number, session: Session | null) {
    return {
        detail: logEntryKey(id, session),
        collections: logEntryCollectionKeys(session),
    };
}

export async function refreshReviewViews(client: QueryClient, session: Session, id?: number) {
    const filters: QueryFilters[] = [session, null].flatMap((viewer) => [
        ...logEntryCollectionKeys(viewer).map((queryKey) => ({ queryKey })),
        ...(id === undefined ? [] : [{ queryKey: logEntryKey(id, viewer), exact: true }]),
    ]);

    await Promise.all(filters.map((filter) => client.cancelQueries(filter)));
    if (isCurrentSession(session)) {
        await Promise.all(filters.map((filter) => client.invalidateQueries(filter)));
    }
}
