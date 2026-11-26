import { Navigate, useSearchParams } from "react-router";
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
        <section className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-semibold">Listes publiques</h1>
                {session !== null && <CreateListButton session={session} />}
            </div>
            <ListFilterForm
                key={new URLSearchParams(params).toString()}
                filters={filters}
                onSubmit={(next) => setSearchParams(listFilterParams(next))}
            />
            <PaginatedList
                key={session?.cacheId ?? "public"}
                query={publicListsQuery(filters, page, session)}
                page={page}
                pathForPage={(nextPage) => pageSearch(nextPage, params)}
                label="Pagination des listes publiques"
                emptyMessage="Aucune liste publique ne correspond à cette recherche."
                errorMessage="Impossible de charger les listes publiques."
            >
                {(lists) => <ListResults lists={lists} showAuthor />}
            </PaginatedList>
        </section>
    );
}
