import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CatalogFilters } from "@/features/movies/CatalogFilters";
import { MovieCard } from "@/features/movies/MovieCard";
import { DEFAULT_CATALOG_SEARCH, catalogPath, hasCatalogFilters, parseCatalogSearch, type CatalogSearch } from "@/features/movies/catalog-search";
import { CATALOG_PAGE_SIZE, genresQuery, moviesQuery, type CatalogResult } from "@/features/movies/queries";

export function HomePage() {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const navigate = useNavigate();
    const genres = useQuery(genresQuery());
    const { search, hasInvalidParams } = parseCatalogSearch(searchParams);
    const unknownGenre = search.genre !== null && genres.data !== undefined && !genres.data.some((genre) => genre.id === search.genre);
    const { data, error, isFetching, isPending, isPlaceholderData, refetch } = useQuery(moviesQuery(search));
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
    const showsInvalidParams = location.state?.invalidParams === true;

    // Changer un critère renvoie à la première page, les anciens numéros de page ne veulent plus rien dire.
    function changeSearch(changes: Partial<CatalogSearch>): void {
        void navigate(catalogPath({ ...search, ...changes, page: 1 }));
    }

    return (
        <section className="space-y-6">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <h1 className="text-2xl font-semibold">Films</h1>
                <p role="status" className="text-sm text-muted-foreground">
                    {isFetching
                        ? result === undefined ? "Chargement des films…" : "Mise à jour des films…"
                        : result !== undefined && `${result.movies.total.toLocaleString("fr-FR")} films`}
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
                <Alert variant="destructive">
                    <AlertDescription>Impossible de charger les films. {error.message}</AlertDescription>
                    <Button variant="outline" size="sm" className="mt-2 justify-self-start" onClick={() => void refetch()} disabled={isFetching}>
                        Réessayer
                    </Button>
                </Alert>
            )}
            {result === undefined && isPending ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
                    {Array.from({ length: CATALOG_PAGE_SIZE }, (_, index) => (
                        <Skeleton key={index} className="aspect-[2/3]" aria-hidden="true" />
                    ))}
                </div>
            ) : (
                result !== undefined && <CatalogResults result={result} isFetching={isFetching} />
            )}
        </section>
    );
}

function CatalogResults({ result, isFetching }: { result: CatalogResult; isFetching: boolean }) {
    const { search, movies } = result;

    if (movies.total === 0) {
        return (
            <EmptyState message={hasCatalogFilters(search) ? "Aucun film ne correspond à ces critères." : "Le catalogue est vide."}>
                {hasCatalogFilters(search) && (
                    <Button asChild variant="outline" size="sm">
                        <Link to={catalogPath({ ...DEFAULT_CATALOG_SEARCH, sort: search.sort })}>Effacer les filtres</Link>
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
            <div className="grid grid-cols-2 gap-4 transition-opacity aria-busy:opacity-60 sm:grid-cols-4 lg:grid-cols-6" aria-busy={isFetching}>
                {movies.items.map((movie) => (
                    <MovieCard key={movie.id} movie={movie} />
                ))}
            </div>
            <nav className="flex items-center justify-center gap-4 text-sm" aria-label="Pagination des films">
                <PageLink search={search} page={search.page - 1} disabled={search.page <= 1} label="Précédent" />
                <span>
                    Page {search.page} sur {movies.lastPage}
                </span>
                <PageLink search={search} page={search.page + 1} disabled={search.page >= movies.lastPage} label="Suivant" />
            </nav>
        </>
    );
}

function EmptyState({ message, children }: { message: string; children?: ReactNode }) {
    return (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
            <p>{message}</p>
            {children}
        </div>
    );
}

function PageLink({ search, page, disabled, label }: { search: CatalogSearch; page: number; disabled: boolean; label: string }) {
    if (disabled) {
        return (
            <Button variant="outline" size="sm" disabled>
                {label}
            </Button>
        );
    }

    return (
        <Button asChild variant="outline" size="sm">
            <Link to={catalogPath({ ...search, page })}>{label}</Link>
        </Button>
    );
}
