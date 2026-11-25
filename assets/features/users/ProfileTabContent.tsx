import { useQuery, type QueryKey, type UseQueryOptions } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { EmptyState } from "@/components/EmptyState";
import { Pagination } from "@/components/Pagination";
import { QueryError } from "@/components/QueryError";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Paginated } from "@/lib/types";

type ProfileTabContentProps<T, TKey extends QueryKey> = {
    query: UseQueryOptions<Paginated<T>, Error, Paginated<T>, TKey>;
    page: number;
    label: string;
    emptyMessage: string;
    children: (items: T[]) => ReactNode;
};

// La première page n'est pas écrite dans l'URL, comme sur le catalogue.
function pagePath(page: number): { search: string } {
    return { search: page === 1 ? "" : `?page=${page}` };
}

// La clé de requête reste générique : TanStack Query refuse une clé élargie à « readonly unknown[] ».
export function ProfileTabContent<T, TKey extends QueryKey>({ query, page, label, emptyMessage, children }: ProfileTabContentProps<T, TKey>) {
    const { data, error, isFetching, refetch } = useQuery(query);

    if (error !== null) {
        return <QueryError message="Impossible de charger cet onglet." error={error} onRetry={() => void refetch()} retrying={isFetching} />;
    }
    if (data === undefined) {
        return (
            <div className="space-y-3" aria-busy="true">
                <p role="status" className="sr-only">
                    Chargement…
                </p>
                {Array.from({ length: 3 }, (_, index) => (
                    <Skeleton key={index} className="h-24 w-full" aria-hidden="true" />
                ))}
            </div>
        );
    }
    if (data.total === 0) {
        return <EmptyState message={emptyMessage} />;
    }
    if (page > data.lastPage) {
        return (
            <EmptyState message={`La page ${page} n'existe pas, la liste s'arrête à la page ${data.lastPage}.`}>
                <Button asChild variant="outline" size="sm">
                    <Link to={pagePath(data.lastPage)}>Aller à la dernière page</Link>
                </Button>
            </EmptyState>
        );
    }

    return (
        <div className="space-y-6">
            {children(data.items)}
            {data.lastPage > 1 && <Pagination page={page} lastPage={data.lastPage} pathForPage={pagePath} label={label} />}
        </div>
    );
}
