import { useIsMutating, useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { currentUserQuery } from "@/features/auth/queries";
import { feedKey, feedQuery } from "@/features/feed/queries";
import { followListKey, profileQuery } from "@/features/users/queries";
import { apiFetch } from "@/lib/api";
import { sessionKey } from "@/lib/query-client";
import { getSession, isCurrentSession, type Session } from "@/lib/session";
import type { PublicProfile } from "@/lib/types";

export function useFollowMutation(profile: PublicProfile, session: Session) {
    const client = useQueryClient();
    const mutationKey = [...sessionKey(session), "follows"];
    const targetKey = profileQuery(profile.username, session).queryKey;
    const ownerKey = profileQuery(session.user.username, session).queryKey;
    const pending = useIsMutating({ mutationKey }) > 0;

    const mutation = useMutation({
        mutationKey,
        // Hors ligne, le clic doit échouer tout de suite pour rétablir les compteurs.
        networkMode: "always",
        mutationFn: (follow: boolean) => apiFetch<void>(`/users/${encodeURIComponent(profile.username)}/followers`, {
            method: follow ? "POST" : "DELETE",
            session,
        }),
        onMutate: async (follow) => {
            await Promise.all([targetKey, ownerKey].map((queryKey) => client.cancelQueries({ queryKey })));
            if (!isCurrentSession(session)) {
                return;
            }

            const target = client.getQueryData(targetKey) ?? profile;
            const owner = client.getQueryData(ownerKey);
            const difference = follow === target.followedByMe ? 0 : follow ? 1 : -1;
            const updatedTarget = client.setQueryData(targetKey, {
                ...target,
                followedByMe: follow,
                followersCount: Math.max(0, target.followersCount + difference),
            });
            const updatedOwner = owner === undefined ? undefined : client.setQueryData(ownerKey, {
                ...owner,
                followingCount: Math.max(0, owner.followingCount + difference),
            });

            return { target, updatedTarget, owner, updatedOwner };
        },
        onError: (_error, _follow, previous) => {
            if (previous === undefined || !isCurrentSession(session)) {
                return;
            }

            client.setQueryData(targetKey, (current) => current === previous.updatedTarget ? previous.target : current);
            client.setQueryData(ownerKey, (current) => current === previous.updatedOwner ? previous.owner : current);
        },
        onSettled: async (_data, error) => {
            const viewer = getSession();
            const viewers = viewer === null ? [null] : [null, viewer];
            const owner = viewer?.cacheId === session.cacheId ? viewer.user.username : session.user.username;
            const refresh: QueryKey[] = [
                ...viewers.flatMap((scope) => [profile.username, owner].map((username) => profileQuery(username, scope).queryKey)),
                followListKey(profile.username, "followers"),
                followListKey(owner, "following"),
            ];

            if (viewer !== null) {
                refresh.push(currentUserQuery(viewer).queryKey);
            }

            // Une réponse perdue ou un changement dans un autre onglet peut aussi rendre les données obsolètes.
            const reads = refresh.map((queryKey) => client.invalidateQueries({ queryKey }));
            if (error === null && isCurrentSession(session)) {
                const queryKey = feedKey(session);
                reads.push(client.cancelQueries({ queryKey }).then(async () => {
                    if (!isCurrentSession(session)) {
                        return;
                    }

                    await client.invalidateQueries({ queryKey });
                    if (isCurrentSession(session)) {
                        await client.prefetchQuery(feedQuery(session, 1));
                    }
                }));
            }
            await Promise.all(reads);
        },
    });

    return {
        error: mutation.error,
        pending,
        toggle: () => {
            // Deux changements simultanés fausseraient le compteur d’abonnements du même membre.
            if (client.isMutating({ mutationKey }) === 0) {
                mutation.mutate(!profile.followedByMe);
            }
        },
    };
}
