import { parsePositiveInteger } from "@/lib/numbers";

// Sans paramètre, on est sur la première page. Un numéro invalide renvoie null pour que la page nettoie l'URL.
export function parsePage(searchParams: URLSearchParams): number | null {
    const page = searchParams.get("page");

    return page === null ? 1 : parsePositiveInteger(page);
}

// La première page n'est pas écrite dans l'URL, comme sur le catalogue.
export function pageSearch(page: number, params: Record<string, string> = {}): { search: string } {
    const search = new URLSearchParams(params);
    if (page !== 1) {
        search.set("page", String(page));
    }
    const query = search.toString();

    return { search: query === "" ? "" : `?${query}` };
}
