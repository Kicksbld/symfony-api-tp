import { useMutation, useQueryClient, type QueryFilters, type QueryKey } from "@tanstack/react-query";
import { ApiError, apiFetch } from "@/lib/api";
import { isCurrentSession, type Session } from "@/lib/session";
import type { Paginated } from "@/lib/types";

export type LikeTarget = {
    id: number;
    likeCount: number;
    likedByMe: boolean;
};

export type LikeViews = {
    detail: QueryKey;
    collections: readonly QueryKey[];
};

export function likeMutationKey(detail: QueryKey) {
    return [...detail, "like"] as const;
}

export function likeCountFor(target: LikeTarget, likedByMe: boolean): number {
    if (target.likedByMe === likedByMe) {
        return target.likeCount;
    }

    return Math.max(0, target.likeCount + (likedByMe ? 1 : -1));
}

export function useLikeMutation(
    target: LikeTarget,
    session: Session,
    path: string,
    viewsFor: (viewer: Session | null) => LikeViews,
) {
    const client = useQueryClient();
    const views = [session, null].map((viewer) => ({
        viewer,
        ...viewsFor(viewer),
    }));
    const filters: QueryFilters[] = views.flatMap(({ detail, collections }) => [
        { queryKey: detail, exact: true },
        ...collections.map((queryKey) => ({ queryKey })),
    ]);

    return useMutation({
        mutationKey: likeMutationKey(viewsFor(session).detail),
        // Une requête hors ligne doit échouer pour que l’affichage optimiste soit annulé.
        networkMode: "always",
        mutationFn: (likedByMe: boolean) => likedByMe
            ? apiFetch<LikeTarget>(path, { method: "POST", session })
            : apiFetch<undefined>(path, { method: "DELETE", session }),
        onSuccess: async (saved, likedByMe) => {
            await Promise.all(filters.map((filter) => client.cancelQueries(filter)));
            if (!isCurrentSession(session)) {
                return;
            }

            const likeCount = saved?.likeCount ?? likeCountFor(target, likedByMe);
            for (const { viewer, detail, collections } of views) {
                const update = (entry: LikeTarget) => ({
                    ...entry,
                    likeCount,
                    likedByMe: viewer !== null && likedByMe,
                });
                client.setQueryData<LikeTarget>(detail, (entry) => entry === undefined ? undefined : update(entry));
                for (const queryKey of collections) {
                    client.setQueriesData<Paginated<LikeTarget>>({ queryKey }, (page) => page?.items.some(({ id }) => id === target.id) ? {
                        ...page,
                        items: page.items.map((entry) => entry.id === target.id ? update(entry) : entry),
                    } : page);
                }
            }
            // L’API confirme les compteurs et l’ordre des collections.
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
