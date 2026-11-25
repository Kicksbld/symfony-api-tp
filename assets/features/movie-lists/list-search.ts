import { parsePositiveInteger } from "@/lib/numbers";

export const MAX_LIST_SEARCH_LENGTH = 255;
export const LIST_MEMBER_PATTERN = "[a-zA-Z0-9_]{3,20}";

export const LIST_SORTS = [
    { value: "recent", label: "Les plus récentes" },
    { value: "popular", label: "Les plus populaires" },
] as const;

const DEFAULT_SORT = LIST_SORTS[0].value;

export type ListFilters = {
    q: string;
    user: string;
    movie: number | null;
    sort: (typeof LIST_SORTS)[number]["value"];
};

export function readListFilters(params: URLSearchParams | FormData): ListFilters {
    const q = String(params.get("q") ?? "").trim();
    const user = String(params.get("user") ?? "");
    const sort = params.get("sort");

    return {
        q: q.length <= MAX_LIST_SEARCH_LENGTH ? q : "",
        user: new RegExp(`^${LIST_MEMBER_PATTERN}$`).test(user) ? user.toLowerCase() : "",
        movie: parsePositiveInteger(String(params.get("movie") ?? "")),
        sort: LIST_SORTS.find(({ value }) => value === sort)?.value ?? DEFAULT_SORT,
    };
}

export function listFilterParams({ q, user, movie, sort }: ListFilters): Record<string, string> {
    return {
        ...(q !== "" && { q }),
        ...(user !== "" && { user }),
        ...(movie !== null && { movie: String(movie) }),
        ...(sort !== DEFAULT_SORT && { sort }),
    };
}
