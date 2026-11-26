import { useMutation, useQueryClient } from "@tanstack/react-query";
import { listCommentsKey } from "@/features/movie-lists/queries";
import type { ListComment } from "@/features/movie-lists/types";
import { ApiError, apiFetch } from "@/lib/api";
import { isCurrentSession, type Session } from "@/lib/session";

type CommentChange =
    | { method: "POST"; content: string }
    | { method: "PATCH"; id: number; content: string }
    | { method: "DELETE"; id: number };

export function useListCommentMutation(listId: number, session: Session) {
    const client = useQueryClient();

    return useMutation({
        mutationKey: listCommentsKey(listId, session),
        mutationFn: (change: CommentChange) => {
            const path = `/lists/${listId}/comments`;
            if (change.method === "DELETE") {
                return apiFetch<ListComment | undefined>(`${path}/${change.id}`, { method: change.method, session });
            }

            return apiFetch<ListComment | undefined>(change.method === "POST" ? path : `${path}/${change.id}`, {
                method: change.method,
                body: JSON.stringify({ content: change.content }),
                session,
            });
        },
        onSettled: async (_saved, error) => {
            if (!isCurrentSession(session) || (error !== null && !(error instanceof ApiError && error.status === 404))) {
                return;
            }

            await Promise.all([session, null].map(async (viewer) => {
                const filter = { queryKey: listCommentsKey(listId, viewer) };
                await client.cancelQueries(filter);
                await client.invalidateQueries(filter);
            }));
        },
    });
}
