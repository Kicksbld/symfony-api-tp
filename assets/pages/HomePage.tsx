import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router";
import { EmptyState } from "@/components/EmptyState";
import { Pagination } from "@/components/Pagination";
import { QueryError } from "@/components/QueryError";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CatalogFilters } from "@/features/movies/CatalogFilters";
import { MovieCard } from "@/features/movies/MovieCard";
import { catalogPath, hasCatalogFilters, parseCatalogSearch, withoutFilters, type CatalogSearch } from "@/features/movies/catalog-search";
import { CATALOG_PAGE_SIZE, genresQuery, moviesQuery, type CatalogResult } from "@/features/movies/queries";

export function HomePage() {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const navigate = useNavigate();
    const genres = useQuery(genresQuery());
    const { search, hasInvalidParams } = parseCatalogSearch(searchParams);
    const unknownGenre = search.genre !== null && genres.data !== undefined && !genres.data.some((genre) => genre.id === search.genre);
    // Un genre inconnu est retiré de l'URL : on attend la liste des genres pour ne pas afficher « aucun film » avant la redirection.
    const canSearch = search.genre === null || !genres.isPending;
    const { data, error, isFetching, isPending, isPlaceholderData, refetch } = useQuery(moviesQuery(search, canSearch && !unknownGenre));
    // TanStack Query retire les données temporaires si la nouvelle recherche échoue.
    const [lastResult, setLastResult] = useState<typeof data>();

    if (data !== undefined && !isPlaceholderData && data !== lastResult) {
        setLastResult(data);
    }

    if (hasInvalidParams || unknownGenre) {
        const validSearch = unknownGenre ? { ...search, genre: null, page: 1 } : search;

        return <Navigate to={catalogPath(validSearch)} replace state={{ invalidParams: true }} />;
    }

    const result = data ?? lastResult;
    // Les résultats affichés peuvent venir d'une recherche précédente, le temps du chargement ou après une erreur.
    const isStale = result !== undefined && (isPlaceholderData || data === undefined);
    const showsInvalidParams = location.state?.invalidParams === true;

    // Changer un critère renvoie à la première page, les anciens numéros de page ne veulent plus rien dire.
    function changeSearch(next: CatalogSearch): void {
        const path = catalogPath({ ...next, page: 1 });
        if (path !== catalogPath(search)) {
            void navigate(path);
        }
    }

    return (
        <section className="space-y-6">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <h1 className="text-2xl font-semibold">Films</h1>
                <p role="status" className="text-sm text-muted-foreground">
                    {statusText(isFetching, result)}
                </p>
            </div>
            <CatalogFilters search={search} genres={genres.data} onChange={changeSearch} />
            {showsInvalidParams && (
                <Alert>
                    <AlertDescription>Certains critères de l'adresse étaient invalides et ont été ignorés.</AlertDescription>
                </Alert>
            )}
            {genres.error !== null && (
                <Alert variant="destructive">
                    <AlertDescription>Impossible de charger les genres. {genres.error.message}</AlertDescription>
                </Alert>
            )}
            {error !== null && (
                <QueryError message="Impossible de charger les films." error={error} onRetry={() => void refetch()} retrying={isFetching} />
            )}
            {result === undefined && isPending ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
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
            <div className="grid grid-cols-2 gap-4 transition-opacity aria-busy:opacity-60 sm:grid-cols-4 lg:grid-cols-6" aria-busy={isStale}>
                {movies.items.map((movie) => (
                    <MovieCard key={movie.id} movie={movie} />
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
