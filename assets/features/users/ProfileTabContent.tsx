import { useQuery, type QueryKey, type UseQueryOptions } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Link, Navigate, useSearchParams } from "react-router";
import { EmptyState } from "@/components/EmptyState";
import { Pagination } from "@/components/Pagination";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { parsePositiveInteger } from "@/lib/numbers";
import type { Paginated } from "@/lib/types";

type ProfileTabContentProps<T, TKey extends QueryKey> = {
    query: (page: number) => UseQueryOptions<Paginated<T>, Error, Paginated<T>, TKey>;
    label: string;
    emptyMessage: string;
    children: (items: T[]) => ReactNode;
};

// La première page n'est pas écrite dans l'URL, comme sur le catalogue.
function pagePath(page: number): { search: string } {
    return { search: page === 1 ? "" : `?page=${page}` };
}

/**
 * Lit la page dans l'URL et gère les états communs aux onglets du profil : chargement, erreur, liste vide et page
 * au-delà de la dernière. Chaque onglet ne s'occupe que de l'affichage de ses éléments.
 */
export function ProfileTabContent<T, TKey extends QueryKey>({ query, label, emptyMessage, children }: ProfileTabContentProps<T, TKey>) {
    const [searchParams] = useSearchParams();
    const pageParam = searchParams.get("page");
    const page = pageParam === null ? 1 : parsePositiveInteger(pageParam);
    const { data, error, isFetching, refetch } = useQuery({ ...query(page ?? 1), enabled: page !== null });

    if (page === null) {
        return <Navigate to={pagePath(1)} replace />;
    }
    if (error !== null) {
        return (
            <Alert variant="destructive">
                <AlertDescription>Impossible de charger cet onglet. {error.message}</AlertDescription>
                <Button variant="outline" size="sm" className="mt-2 justify-self-start" onClick={() => void refetch()} disabled={isFetching}>
                    Réessayer
                </Button>
            </Alert>
        );
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
