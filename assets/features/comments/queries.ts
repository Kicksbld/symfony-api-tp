import { queryOptions, useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { ApiError, apiFetch } from "@/lib/api";
import { sessionKey } from "@/lib/query-client";
import { isCurrentSession, type Session } from "@/lib/session";
import type { Paginated, UserSummary } from "@/lib/types";

export type Comment = {
    id: number;
    user: UserSummary;
    content: string;
    createdAt: string;
    updatedAt: string;
};

export type CommentThread = {
    resource: "lists" | "log-entries";
    id: number;
    refreshCounts?: (client: QueryClient) => Promise<unknown>;
};

type CommentChange =
    | { method: "POST"; content: string }
    | { method: "PATCH"; id: number; content: string }
    | { method: "DELETE"; id: number };

function commentsKey({ resource, id }: CommentThread, session: Session | null) {
    return [...(session === null ? [] : sessionKey(session)), resource, id, "comments"] as const;
}

function commentsPath({ resource, id }: CommentThread): string {
    return `/${resource}/${id}/comments`;
}

export function commentsQuery(thread: CommentThread, page: number, session: Session | null) {
    const params = new URLSearchParams({ page: String(page), limit: "20" });

    return queryOptions({
        queryKey: [...commentsKey(thread, session), { page }],
        queryFn: ({ signal }) => apiFetch<Paginated<Comment>>(`${commentsPath(thread)}?${params}`, { signal, session }),
    });
}

export function useCommentMutation(thread: CommentThread, session: Session) {
    const client = useQueryClient();

    return useMutation({
        mutationKey: commentsKey(thread, session),
        mutationFn: (change: CommentChange) => {
            const base = commentsPath(thread);
            const path = change.method === "POST" ? base : `${base}/${change.id}`;
            const body = change.method === "DELETE" ? undefined : JSON.stringify({ content: change.content });

            return apiFetch<Comment | undefined>(path, { method: change.method, body, session });
        },
        onSettled: async (_saved, error, change) => {
            if (!isCurrentSession(session) || (error !== null && !(error instanceof ApiError && error.status === 404))) {
                return;
            }

            const filters = [session, null].map((viewer) => ({ queryKey: commentsKey(thread, viewer) }));
            await Promise.all(filters.map((filter) => client.cancelQueries(filter)));
            await Promise.all([
                ...filters.map((filter) => client.invalidateQueries(filter)),
                change.method !== "PATCH" || error !== null ? thread.refreshCounts?.(client) : undefined,
            ]);
        },
    });
}
