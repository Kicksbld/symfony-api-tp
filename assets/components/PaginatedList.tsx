import { useQuery, type QueryKey, type UseQueryOptions, type UseQueryResult } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Link, type To } from "react-router";
import { EmptyState } from "@/components/EmptyState";
import { Pagination } from "@/components/Pagination";
import { QueryError } from "@/components/QueryError";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Paginated } from "@/lib/types";

type PaginatedListProps<T> = {
    page: number;
    pathForPage: (page: number) => To;
    label: string;
    emptyMessage: string;
    emptyAction?: ReactNode;
    errorMessage: string;
    children: (items: T[], total: number) => ReactNode;
};

// La clé de requête reste générique : TanStack Query refuse une clé élargie à « readonly unknown[] ».
export function PaginatedList<T, TKey extends QueryKey>({
    query,
    ...props
}: PaginatedListProps<T> & { query: UseQueryOptions<Paginated<T>, Error, Paginated<T>, TKey> }) {
    const result = useQuery(query);

    return <PaginatedResults {...props} result={result} keepPreviousPage={query.placeholderData !== undefined} />;
}

export function PaginatedResults<T>({
    result: { data, error, isFetching, isPlaceholderData, refetch },
    keepPreviousPage,
    page,
    pathForPage,
    label,
    emptyMessage,
    emptyAction,
    errorMessage,
    children,
}: PaginatedListProps<T> & { result: UseQueryResult<Paginated<T>>; keepPreviousPage: boolean }) {
    const [previousPage, setPreviousPage] = useState<Paginated<T>>();
    if (keepPreviousPage && data !== undefined && !isPlaceholderData && data !== previousPage) {
        setPreviousPage(data);
    }

    // Les listes qui gardent la page précédente pendant le chargement la gardent aussi si la nouvelle requête échoue.
    const visiblePage = data ?? previousPage;
    const showingCurrentPage = data !== undefined && !isPlaceholderData;
    const requestError = error === null ? null : (
        <QueryError message={errorMessage} error={error} onRetry={() => void refetch()} retrying={isFetching} />
    );
    if (visiblePage === undefined) {
        if (requestError !== null) {
            return requestError;
        }

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
    return (
        <div className="space-y-6">
            {requestError}
            {!showingCurrentPage && isFetching && (
                <p role="status" className="text-sm text-muted-foreground">Mise à jour des résultats…</p>
            )}
            {requestError === null && showingCurrentPage && visiblePage.total === 0 && (
                <EmptyState message={emptyMessage}>{emptyAction}</EmptyState>
            )}
            {showingCurrentPage && visiblePage.total > 0 && page > visiblePage.lastPage && (
                <EmptyState message={`La page ${page} n'existe pas, la liste s'arrête à la page ${visiblePage.lastPage}.`}>
                    <Button asChild variant="outline" size="sm">
                        <Link to={pathForPage(visiblePage.lastPage)}>Aller à la dernière page</Link>
                    </Button>
                </EmptyState>
            )}
            {visiblePage.items.length > 0 && children(visiblePage.items, visiblePage.total)}
            {showingCurrentPage && page <= visiblePage.lastPage && visiblePage.lastPage > 1 && (
                <Pagination page={page} lastPage={visiblePage.lastPage} pathForPage={pathForPage} label={label} />
            )}
        </div>
    );
}
