import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router";
import { EmptyState } from "@/components/EmptyState";
import { Pagination } from "@/components/Pagination";
import { QueryError } from "@/components/QueryError";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ActiveFilters } from "@/features/movies/ActiveFilters";
import { CatalogFilters } from "@/features/movies/CatalogFilters";
import { MovieCard } from "@/features/movies/MovieCard";
import { catalogPath, hasCatalogFilters, parseCatalogSearch, withoutFilters, type CatalogSearch } from "@/features/movies/catalog-search";
import { CATALOG_PAGE_SIZE, moviesQuery, type CatalogResult } from "@/features/movies/queries";
import { countryName } from "@/features/movies/regions";
import { useCatalogReferences, type CatalogCorrection } from "@/features/movies/useCatalogReferences";
import { staggerStyle } from "@/lib/utils";

type CorrectionState = Pick<CatalogCorrection, "invalidParams" | "unavailableProvider">;

export function CatalogPage() {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { search, hasInvalidParams } = parseCatalogSearch(searchParams);
    const references = useCatalogReferences(search);
    const { correction } = references;
    const { data, error, isFetching, isPending, isPlaceholderData, refetch } = useQuery(moviesQuery(search, !references.isChecking && correction === null));
    // TanStack Query retire les données temporaires si la nouvelle recherche échoue.
    const [lastResult, setLastResult] = useState<typeof data>();

    if (data !== undefined && !isPlaceholderData && data !== lastResult) {
        setLastResult(data);
    }

    if (hasInvalidParams || correction !== null) {
        const state: CorrectionState = {
            invalidParams: hasInvalidParams || correction?.invalidParams === true,
            unavailableProvider: correction?.unavailableProvider === true,
        };

        return <Navigate to={catalogPath(correction?.search ?? search)} replace state={state} />;
    }

    const result = data ?? lastResult;
    // Les résultats affichés peuvent venir d'une recherche précédente, le temps du chargement ou après une erreur.
    const isStale = result !== undefined && (isPlaceholderData || data === undefined);
    const showsInvalidParams = location.state?.invalidParams === true;
    const showsUnavailableProvider = location.state?.unavailableProvider === true;

    // Changer un critère renvoie à la première page, les anciens numéros de page ne veulent plus rien dire.
    function changeSearch(next: CatalogSearch, options?: { replace: boolean }): void {
        const path = catalogPath({ ...next, page: 1 });
        if (path !== catalogPath(search)) {
            void navigate(path, { replace: options?.replace });
        }
    }

    return (
        <section className="space-y-8">
            <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
                <h1 className="text-4xl font-extrabold sm:text-5xl">Films</h1>
                <p role="status" className="text-sm text-muted-foreground tabular-nums">
                    {statusText(isFetching, result)}
                </p>
            </header>
            <CatalogFilters search={search} references={references} onChange={changeSearch} />
            <ActiveFilters search={search} references={references} onChange={changeSearch} />
            {showsInvalidParams && (
                <Alert>
                    <AlertDescription>Certains critères de l'adresse étaient invalides et ont été ignorés.</AlertDescription>
                </Alert>
            )}
            {showsUnavailableProvider && (
                <Alert>
                    <AlertDescription>
                        La plateforme choisie ne propose aucun film du catalogue pour ce pays de diffusion ({countryName(search.region)}), le filtre a été retiré.
                    </AlertDescription>
                </Alert>
            )}
            {references.error !== null && (
                <QueryError message="Impossible de charger certains filtres." error={references.error} onRetry={references.retry} retrying={references.retrying} />
            )}
            {error !== null && (
                <QueryError message="Impossible de charger les films." error={error} onRetry={() => void refetch()} retrying={isFetching} />
            )}
            {result === undefined && isPending ? (
                <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 lg:grid-cols-6">
                    {Array.from({ length: CATALOG_PAGE_SIZE }, (_, index) => (
                        <Skeleton key={index} className="aspect-[2/3]" aria-hidden="true" />
                    ))}
                </div>
            ) : (
                result !== undefined && <CatalogResults result={result} isStale={isStale} />
            )}
        </section>
    );
}

function statusText(isFetching: boolean, result: CatalogResult | undefined): string {
    if (isFetching) {
        return result === undefined ? "Chargement des films…" : "Mise à jour des films…";
    }
    if (result === undefined) {
        return "";
    }

    const total = result.movies.total;

    return `${total.toLocaleString("fr-FR")} ${total > 1 ? "films" : "film"}`;
}

function CatalogResults({ result, isStale }: { result: CatalogResult; isStale: boolean }) {
    const { search, movies } = result;

    if (movies.total === 0) {
        return (
            <EmptyState message={hasCatalogFilters(search) ? "Aucun film ne correspond à ces critères." : "Le catalogue est vide."}>
                {hasCatalogFilters(search) && (
                    <Button asChild variant="outline" size="sm">
                        <Link to={catalogPath(withoutFilters(search))}>Effacer les filtres</Link>
                    </Button>
                )}
            </EmptyState>
        );
    }

    if (search.page > movies.lastPage) {
        return (
            <EmptyState message={`La page ${search.page} n'existe pas, les résultats s'arrêtent à la page ${movies.lastPage}.`}>
                <Button asChild variant="outline" size="sm">
                    <Link to={catalogPath({ ...search, page: movies.lastPage })}>Aller à la dernière page</Link>
                </Button>
            </EmptyState>
        );
    }

    return (
        <>
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 transition-opacity aria-busy:opacity-60 sm:grid-cols-4 lg:grid-cols-6" aria-busy={isStale}>
                {movies.items.map((movie, index) => (
                    <div key={movie.id} className="animate-rise" style={staggerStyle(index)}>
                        <MovieCard movie={movie} />
                    </div>
                ))}
            </div>
            <Pagination
                page={search.page}
                lastPage={movies.lastPage}
                pathForPage={(page) => catalogPath({ ...search, page })}
                label="Pagination des films"
                disabled={isStale}
            />
        </>
    );
}
