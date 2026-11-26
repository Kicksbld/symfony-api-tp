import { Navigate, useSearchParams } from "react-router";
import { PageHeader } from "@/components/PageHeader";
import { PaginatedList } from "@/components/PaginatedList";
import { useAuth } from "@/features/auth/auth";
import { CreateListButton } from "@/features/movie-lists/CreateListButton";
import { ListFilterForm } from "@/features/movie-lists/ListFilterForm";
import { ListResults } from "@/features/movie-lists/ListResults";
import { listFilterParams, readListFilters } from "@/features/movie-lists/list-search";
import { publicListsQuery } from "@/features/movie-lists/queries";
import { pageSearch, parsePage } from "@/lib/pagination";

export function ListsPage() {
    const { session } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const filters = readListFilters(searchParams);
    const params = listFilterParams(filters);
    const page = parsePage(searchParams) ?? 1;
    const canonicalSearch = pageSearch(page, params);

    if (canonicalSearch.search.slice(1) !== searchParams.toString()) {
        return <Navigate to={canonicalSearch} replace />;
    }

    return (
        <section className="space-y-8">
            <PageHeader eyebrow="Sélections des membres" title="Listes" description="Tops, thématiques, coups de cœur : les listes publiques des membres.">
                {session !== null && <CreateListButton session={session} />}
            </PageHeader>
            <ListFilterForm filters={filters} onChange={(next, options) => setSearchParams(listFilterParams(next), { replace: options?.replace })} />
            <PaginatedList
                key={session?.cacheId ?? "public"}
                query={publicListsQuery(filters, page, session)}
                page={page}
                pathForPage={(nextPage) => pageSearch(nextPage, params)}
                label="Pagination des listes publiques"
                emptyMessage="Aucune liste publique ne correspond à cette recherche."
                errorMessage="Impossible de charger les listes publiques."
            >
                {(lists) => <ListResults lists={lists} />}
            </PaginatedList>
        </section>
    );
}
