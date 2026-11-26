import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { listViewKeys } from "@/features/movie-lists/list-view-keys";
import { listDetailKey } from "@/features/movie-lists/queries";
import type { MovieList, MovieListItem } from "@/features/movie-lists/types";
import { apiFetch } from "@/lib/api";
import { sessionKey } from "@/lib/query-client";
import type { Session } from "@/lib/session";

type ListFields = Pick<MovieList, "name" | "description" | "public" | "ranked">;

type ItemChange =
    | { type: "add"; movie: number }
    | { type: "update"; id: number; fields: { position?: number; note?: string | null } }
    | { type: "remove"; id: number };

async function refreshListViews(client: QueryClient, session: Session, id: number, deleted = false) {
    const views = [session, null].map((viewer) => listViewKeys(id, session.user.username, viewer));
    const detailKeys = views.map(({ detail }) => detail);
    const collectionKeys = views.flatMap(({ collections }) => collections);
    const keys = [...detailKeys, ...collectionKeys];

    // Une requête lancée avant l'écriture peut encore renvoyer l'ancien état.
    await Promise.all(keys.map((queryKey) => client.cancelQueries({ queryKey })));
    // En revenant sur une page, le cache ne doit plus afficher une liste devenue privée ou supprimée.
    for (const queryKey of keys) {
        client.removeQueries({ queryKey, type: "inactive" });
    }
    if (deleted) {
        for (const queryKey of detailKeys) {
            client.removeQueries({ queryKey });
        }
    }
    const visibleKeys = deleted ? collectionKeys : keys;
    await Promise.all(visibleKeys.map((queryKey) => client.invalidateQueries({ queryKey })));
}

export function useSaveListMutation(session: Session, id?: number) {
    const client = useQueryClient();

    return useMutation({
        mutationKey: [...(id === undefined ? sessionKey(session) : listDetailKey(id, session)), "save-list"],
        mutationFn: (fields: ListFields) => apiFetch<MovieList>(id === undefined ? "/lists" : `/lists/${id}`, {
            method: id === undefined ? "POST" : "PATCH",
            body: JSON.stringify(fields),
            session,
        }),
        onSuccess: (list) => refreshListViews(client, session, list.id),
    });
}

export function useDeleteListMutation(session: Session, id: number) {
    const client = useQueryClient();

    return useMutation({
        mutationKey: [...listDetailKey(id, session), "delete"],
        mutationFn: () => apiFetch<void>(`/lists/${id}`, { method: "DELETE", session }),
        onSuccess: () => refreshListViews(client, session, id, true),
    });
}

export function useChangeListItemMutation(session: Session, id: number) {
    const client = useQueryClient();
    const path = `/lists/${id}/items`;

    return useMutation({
        mutationKey: [...listDetailKey(id, session), "items"],
        mutationFn: (change: ItemChange): Promise<MovieListItem | undefined> => {
            switch (change.type) {
                case "add":
                    return apiFetch<MovieListItem>(path, { method: "POST", body: JSON.stringify({ movie: change.movie }), session });
                case "update":
                    return apiFetch<MovieListItem>(`${path}/${change.id}`, { method: "PATCH", body: JSON.stringify(change.fields), session });
                case "remove":
                    return apiFetch<undefined>(`${path}/${change.id}`, { method: "DELETE", session });
            }
        },
        onSuccess: () => refreshListViews(client, session, id),
    });
}
