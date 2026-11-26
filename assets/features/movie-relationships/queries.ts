import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { userQueriesKey } from "@/features/users/queries";
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

export function useRelationshipMutation(session: Session, movieId: number) {
    const queryClient = useQueryClient();
    const { queryKey } = relationshipQuery(session, movieId);

    return useMutation({
        mutationKey: queryKey,
        mutationFn: (patch: Partial<MovieRelationship>) =>
            apiFetch<MovieRelationship>(`/movies/${movieId}/relationship`, {
                session,
                method: "PATCH",
                body: JSON.stringify(patch),
            }),
        onMutate: async (patch) => {
            // Une lecture en cours écraserait l'état optimiste avec l'ancienne valeur.
            await queryClient.cancelQueries({ queryKey });
            const previous = queryClient.getQueryData(queryKey);
            if (previous !== undefined && isCurrentSession(session)) {
                queryClient.setQueryData(queryKey, { ...previous, ...patch });
            }

            return previous;
        },
        onSuccess: (relationship) => {
            if (isCurrentSession(session)) {
                queryClient.setQueryData(queryKey, relationship);
            }
        },
        onError: (_error, _patch, previous) => {
            if (previous !== undefined && isCurrentSession(session)) {
                queryClient.setQueryData(queryKey, previous);
            }
        },
        onSettled: async (_data, _error, patch) => {
            const refresh = [session, null].map((viewer) => queryClient.invalidateQueries({ queryKey: userQueriesKey(session.user.username, viewer) }));
            if (isCurrentSession(session)) {
                refresh.push(queryClient.invalidateQueries({ queryKey }));
            }
            if (patch.rating !== undefined) {
                // Les résultats du catalogue affichent aussi la moyenne du film.
                refresh.push(queryClient.invalidateQueries({ queryKey: ["movies"] }));
            }

            await Promise.all(refresh);
        },
    });
}
