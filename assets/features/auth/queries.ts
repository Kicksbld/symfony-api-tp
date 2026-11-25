import { queryOptions } from "@tanstack/react-query";
import { profileQuery, userQueriesKey } from "@/features/users/queries";
import { apiFetch } from "@/lib/api";
import { queryClient, sessionKey } from "@/lib/query-client";
import { getSession, subscribeToSession, type Session } from "@/lib/session";
import type { CurrentUser } from "@/lib/types";

export function currentUserQuery(session: Session) {
    return queryOptions({
        queryKey: [...sessionKey(session), "me"],
        queryFn: ({ signal }) => apiFetch<CurrentUser>("/me", { signal, session }),
    });
}

subscribeToSession((previous) => {
    const session = getSession();
    if (previous === null || session === null || previous.cacheId !== session.cacheId) {
        return;
    }

    const queryKey = currentUserQuery(session).queryKey;
    const cached = queryClient.getQueryData<CurrentUser>(queryKey);
    void queryClient.cancelQueries({ queryKey });
    queryClient.setQueryData(queryKey, session.user);

    const oldUsername = cached?.username ?? previous.user.username;
    if (oldUsername === session.user.username) {
        void queryClient.invalidateQueries({ queryKey: profileQuery(session.user.username).queryKey });
        return;
    }

    const oldKey = userQueriesKey(oldUsername);
    queryClient.removeQueries({ queryKey: oldKey, type: "inactive" });
    void queryClient.invalidateQueries({ queryKey: oldKey });
    void queryClient.invalidateQueries({ queryKey: userQueriesKey(session.user.username) });
});
