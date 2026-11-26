import { useMutation, useQueryClient, type QueryFilters } from "@tanstack/react-query";
import { listViewKeys } from "@/features/movie-lists/list-view-keys";
import { listDetailKey } from "@/features/movie-lists/queries";
import type { MovieList } from "@/features/movie-lists/types";
import { ApiError, apiFetch } from "@/lib/api";
import { isCurrentSession, type Session } from "@/lib/session";
import type { Paginated } from "@/lib/types";

export function listLikeKey(id: number, session: Session) {
    return [...listDetailKey(id, session), "like"] as const;
}

export function likeCountFor(list: MovieList, likedByMe: boolean): number {
    if (list.likedByMe === likedByMe) {
        return list.likeCount;
    }

    return Math.max(0, list.likeCount + (likedByMe ? 1 : -1));
}

export function useListLikeMutation(list: MovieList, session: Session) {
    const client = useQueryClient();
    const views = [session, null].map((viewer) => ({
        viewer,
        ...listViewKeys(list.id, list.user.username, viewer),
    }));
    const filters: QueryFilters[] = views.flatMap(({ detail, collections }) => [
        { queryKey: detail, exact: true },
        ...collections.map((queryKey) => ({ queryKey })),
    ]);

    return useMutation({
        mutationKey: listLikeKey(list.id, session),
        mutationFn: (likedByMe: boolean) => likedByMe
            ? apiFetch<MovieList>(`/lists/${list.id}/like`, { method: "POST", session })
            : apiFetch<undefined>(`/lists/${list.id}/like`, { method: "DELETE", session }),
        onSuccess: async (saved, likedByMe) => {
            await Promise.all(filters.map((filter) => client.cancelQueries(filter)));
            if (!isCurrentSession(session)) {
                return;
            }

            const likeCount = saved?.likeCount ?? likeCountFor(list, likedByMe);
            for (const { viewer, detail, collections } of views) {
                const update = (entry: MovieList) => ({
                    ...entry,
                    likeCount,
                    likedByMe: viewer !== null && likedByMe,
                });
                client.setQueryData<MovieList>(detail, (entry) => entry === undefined ? undefined : update(entry));
                for (const queryKey of collections) {
                    client.setQueriesData<Paginated<MovieList>>({ queryKey }, (page) => page?.items.some(({ id }) => id === list.id) ? {
                        ...page,
                        items: page.items.map((entry) => entry.id === list.id ? update(entry) : entry),
                    } : page);
                }
            }
            // Le tri par popularité est recalculé par l’API.
            await Promise.all(filters.map((filter) => client.invalidateQueries(filter)));
        },
        onError: (error) => {
            if (isCurrentSession(session) && error instanceof ApiError && [404, 409].includes(error.status)) {
                // Un autre onglet a pu changer le like depuis la dernière lecture.
                void Promise.all(filters.map((filter) => client.invalidateQueries(filter)));
            }
        },
    });
}
