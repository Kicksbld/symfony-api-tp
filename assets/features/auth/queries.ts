import { queryOptions } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { sessionKey } from "@/lib/query-client";
import type { Session } from "@/lib/session";
import type { CurrentUser } from "@/lib/types";

export function currentUserQuery(session: Session) {
    return queryOptions({
        queryKey: [...sessionKey(session), "me"],
        queryFn: ({ signal }) => apiFetch<CurrentUser>("/me", { signal, session }),
    });
}
