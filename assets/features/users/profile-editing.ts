import { useMutation, useQueryClient } from "@tanstack/react-query";
import { currentUserQuery } from "@/features/auth/queries";
import { profileQuery } from "@/features/users/queries";
import { ApiError, apiFetch, formErrors, type FormErrors } from "@/lib/api";
import { sessionKey } from "@/lib/query-client";
import { isCurrentSession, updateSessionUser, type Session } from "@/lib/session";
import type { CurrentUser, MovieSummary } from "@/lib/types";

const PROFILE_FIELDS = ["username", "bio"] as const;

export type ProfileFields = Record<(typeof PROFILE_FIELDS)[number], string>;
export type ProfileErrors = FormErrors<keyof ProfileFields>;

type ProfileChange =
    | { type: "profile"; fields: Partial<ProfileFields> }
    | { type: "favorites"; movies: number[] };

type SavedProfileChange =
    | { type: "profile"; user: CurrentUser }
    | { type: "favorites"; favorites: MovieSummary[] };

export function profileErrors(error: unknown): ProfileErrors {
    if (error instanceof ApiError && error.status === 422 && error.violations.length > 0) {
        const errors = formErrors(error.violations, PROFILE_FIELDS);
        if (errors.fields.username === "This username is already taken.") {
            errors.fields.username = "Ce pseudo est déjà utilisé.";
        }

        return errors;
    }

    return { fields: {}, others: ["Impossible d'enregistrer le profil. Réessayez."] };
}

export function favoritesError(error: unknown): string {
    if (error instanceof ApiError && error.status === 422 && error.violations.length > 0) {
        return error.violations.map(({ title }) => title).join(" ");
    }

    return "Impossible d'enregistrer les films favoris. Réessayez.";
}

export function useProfileMutation(session: Session, user: CurrentUser) {
    const queryClient = useQueryClient();
    const meKey = currentUserQuery(session).queryKey;

    return useMutation({
        mutationKey: [...sessionKey(session), "profile", "edit"],
        mutationFn: async (change: ProfileChange): Promise<SavedProfileChange> => {
            if (change.type === "profile") {
                const user = await apiFetch<CurrentUser>("/me", { session, method: "PATCH", body: JSON.stringify(change.fields) });

                return { type: "profile", user };
            }

            const favorites = await apiFetch<MovieSummary[]>("/me/favorites", {
                session,
                method: "PUT",
                body: JSON.stringify({ movies: change.movies }),
            });

            return { type: "favorites", favorites };
        },
        onSuccess: async (change) => {
            if (change.type === "profile") {
                updateSessionUser(session, change.user);
                return;
            }

            if (!isCurrentSession(session)) {
                return;
            }
            await queryClient.cancelQueries({ queryKey: meKey });
            if (!isCurrentSession(session)) {
                return;
            }

            const current = queryClient.getQueryData<CurrentUser>(meKey) ?? user;
            queryClient.setQueryData(meKey, { ...current, favorites: change.favorites });
            void queryClient.invalidateQueries({ queryKey: profileQuery(current.username).queryKey });
        },
    });
}
