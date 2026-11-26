import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import type { LogEntryPayload } from "@/features/log-entries/draft";
import { relationshipQuery } from "@/features/movie-relationships/queries";
import { movieQuery } from "@/features/movies/queries";
import { userQueriesKey } from "@/features/users/queries";
import { apiFetch } from "@/lib/api";
import { sessionKey } from "@/lib/query-client";
import { isCurrentSession, type Session } from "@/lib/session";
import type { LogEntry } from "@/lib/types";

/**
 * Une entrée de journal change plusieurs vues côté serveur : mon état sur le film (vu, note, coup de cœur, watchlist),
 * la moyenne du film, et les onglets et compteurs de mon profil. On les relit toutes au lieu de deviner le résultat.
 */
async function refreshLogEntryViews(queryClient: QueryClient, session: Session, movieId: number): Promise<void> {
    if (!isCurrentSession(session)) {
        return;
    }

    await Promise.all([
        queryClient.invalidateQueries({ queryKey: relationshipQuery(session, movieId).queryKey }),
        queryClient.invalidateQueries({ queryKey: movieQuery(movieId).queryKey }),
        ...[session, null].map((viewer) => queryClient.invalidateQueries({ queryKey: userQueriesKey(session.user.username, viewer) })),
    ]);
}

export function useCreateLogEntryMutation(session: Session, movieId: number) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: [...sessionKey(session), "movies", movieId, "log-entries", "create"],
        mutationFn: (payload: LogEntryPayload) =>
            apiFetch<LogEntry>("/log-entries", { session, method: "POST", body: JSON.stringify({ movie: movieId, ...payload }) }),
        onSuccess: () => refreshLogEntryViews(queryClient, session, movieId),
    });
}

export function useUpdateLogEntryMutation(session: Session, entry: LogEntry) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: [...sessionKey(session), "log-entries", entry.id, "update"],
        mutationFn: (payload: LogEntryPayload) =>
            apiFetch<LogEntry>(`/log-entries/${entry.id}`, { session, method: "PATCH", body: JSON.stringify(payload) }),
        onSuccess: () => refreshLogEntryViews(queryClient, session, entry.movie.id),
    });
}

export function useDeleteLogEntryMutation(session: Session, entry: LogEntry) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: [...sessionKey(session), "log-entries", entry.id, "delete"],
        mutationFn: () => apiFetch<void>(`/log-entries/${entry.id}`, { session, method: "DELETE" }),
        onSuccess: () => refreshLogEntryViews(queryClient, session, entry.movie.id),
    });
}
