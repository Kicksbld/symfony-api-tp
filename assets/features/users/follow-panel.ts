import type { FollowList } from "@/features/users/queries";
import { parsePositiveInteger } from "@/lib/numbers";

const PANEL_PARAM = "panel";
const PANEL_PAGE_PARAM = "panelPage";

type FollowPanel = { list: FollowList; page: number };

// Le panneau des abonnés vit dans l'URL : le lien se partage et Précédent le ferme.
export function readFollowPanel(searchParams: URLSearchParams): FollowPanel | null {
    const list = searchParams.get(PANEL_PARAM);
    if (list !== "followers" && list !== "following") {
        return null;
    }
    const page = searchParams.get(PANEL_PAGE_PARAM);

    return { list, page: page === null ? 1 : (parsePositiveInteger(page) ?? 1) };
}

// Les autres paramètres de l'onglet (page, filtres du journal) sont gardés sous le panneau.
export function followPanelSearch(searchParams: URLSearchParams, list: FollowList | null, page = 1): { search: string } {
    const next = new URLSearchParams(searchParams);
    next.delete(PANEL_PARAM);
    next.delete(PANEL_PAGE_PARAM);
    if (list !== null) {
        next.set(PANEL_PARAM, list);
        if (page > 1) {
            next.set(PANEL_PAGE_PARAM, String(page));
        }
    }
    const query = next.toString();

    return { search: query === "" ? "" : `?${query}` };
}
