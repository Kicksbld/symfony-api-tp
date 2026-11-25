import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { watchlistKey } from "@/features/users/queries";
import { apiFetch } from "@/lib/api";
import { sessionKey } from "@/lib/query-client";
import { isCurrentSession, type Session } from "@/lib/session";
import type { MovieRelationship } from "@/lib/types";

export function relationshipQuery(session: Session, movieId: number) {
    return queryOptions({
        queryKey: [...sessionKey(session), "movies", movieId, "relationship"],
        queryFn: ({ signal }) => apiFetch<MovieRelationship>(`/movies/${movieId}/relationship`, { signal, session }),
    });
}

export function useWatchlistMutation(session: Session, movieId: number) {
    const queryClient = useQueryClient();
    const { queryKey } = relationshipQuery(session, movieId);

    return useMutation({
        mutationKey: [...queryKey, "watchlist"],
        mutationFn: (inWatchlist: boolean) =>
            apiFetch<MovieRelationship>(`/movies/${movieId}/relationship`, {
                session,
                method: "PATCH",
                body: JSON.stringify({ inWatchlist }),
            }),
        onMutate: async (inWatchlist) => {
            // Une lecture en cours écraserait l'état optimiste avec l'ancienne valeur.
            await queryClient.cancelQueries({ queryKey });
            const previous = queryClient.getQueryData(queryKey);
            if (previous !== undefined && isCurrentSession(session)) {
                queryClient.setQueryData(queryKey, { ...previous, inWatchlist });
            }

            return { previous };
        },
        onError: (_error, _inWatchlist, context) => {
            if (context?.previous !== undefined && isCurrentSession(session)) {
                queryClient.setQueryData(queryKey, context.previous);
            }
        },
        onSettled: async () => {
            if (!isCurrentSession(session)) {
                return;
            }

            await Promise.all([
                queryClient.invalidateQueries({ queryKey }),
                queryClient.invalidateQueries({ queryKey: watchlistKey(session.user.username) }),
            ]);
        },
    });
}
