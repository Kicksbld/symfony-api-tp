import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MovieCard } from "@/features/movies/MovieCard";
import { POPULAR_MOVIES_PAGE_SIZE, popularMoviesQuery } from "@/features/movies/queries";

export function HomePage() {
    const [searchParams] = useSearchParams();
    const requestedPage = Number(searchParams.get("page"));
    const page = Number.isSafeInteger(requestedPage) && requestedPage >= 1 ? requestedPage : 1;
    const { data, error, isFetching, isFetched, isPending, isPlaceholderData, refetch } = useQuery(popularMoviesQuery(page));
    // TanStack Query retire les données temporaires si la nouvelle page échoue.
    const [lastResult, setLastResult] = useState<typeof data>();

    if (data !== undefined && !isPlaceholderData && data !== lastResult) {
        setLastResult(data);
    }

    const result = data ?? lastResult;

    return (
        <section className="space-y-6">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <h1 className="text-2xl font-semibold">Films populaires</h1>
                <p role="status" className="text-sm text-muted-foreground">
                    {isFetching && (result === undefined ? "Chargement des films…" : "Mise à jour des films…")}
                </p>
            </div>
            {error !== null && (
                <Alert variant="destructive">
                    <AlertDescription>Impossible de charger les films de la page {page}. {error.message}</AlertDescription>
                    <Button variant="outline" size="sm" className="mt-2 justify-self-start" onClick={() => void refetch()} disabled={isFetching}>
                        Réessayer
                    </Button>
                </Alert>
            )}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6" aria-busy={isFetching}>
                {result === undefined && isPending && !isFetched
                    ? Array.from({ length: POPULAR_MOVIES_PAGE_SIZE }, (_, index) => (
                        <Skeleton key={index} className="aspect-[2/3]" aria-hidden="true" />
                    ))
                    : result?.movies.items.map((movie) => <MovieCard key={movie.id} movie={movie} />)}
            </div>
            {result !== undefined && (
                <nav className="flex items-center justify-center gap-4 text-sm" aria-label="Pagination des films">
                    <PageLink page={page - 1} disabled={page <= 1} label="Précédent" />
                    <span>
                        Page {result.page} sur {result.movies.lastPage}
                    </span>
                    <PageLink page={page + 1} disabled={page >= result.movies.lastPage} label="Suivant" />
                </nav>
            )}
        </section>
    );
}

function PageLink({ page, disabled, label }: { page: number; disabled: boolean; label: string }) {
    if (disabled) {
        return (
            <Button variant="outline" size="sm" disabled>
                {label}
            </Button>
        );
    }

    return (
        <Button asChild variant="outline" size="sm">
            <Link to={`/?page=${page}`}>{label}</Link>
        </Button>
    );
}
