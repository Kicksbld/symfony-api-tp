import { QueryClient } from "@tanstack/react-query";
import { getSession, subscribeToSession, type Session } from "@/lib/session";

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
            staleTime: 30_000,
        },
    },
});

export function sessionKey(session: Session): readonly ["session", number] {
    return ["session", session.cacheId];
}

subscribeToSession((previous) => {
    if (previous === null || previous.cacheId === getSession()?.cacheId) {
        return;
    }

    const key = sessionKey(previous);
    void queryClient.cancelQueries({ queryKey: key });
    queryClient.removeQueries({ queryKey: key });

    const mutations = queryClient.getMutationCache();
    for (const mutation of mutations.findAll({ mutationKey: key })) {
        mutations.remove(mutation);
    }
});
