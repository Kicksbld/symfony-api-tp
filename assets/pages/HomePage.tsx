import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { MovieCard } from "@/components/MovieCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import type { MovieSummary, Paginated } from "@/lib/types";

const PAGE_SIZE = 24;

type PageResult = {
    page: number;
    movies: Paginated<MovieSummary> | null;
    error: string | null;
};

export function HomePage() {
    const [searchParams] = useSearchParams();
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const [result, setResult] = useState<PageResult | null>(null);

    useEffect(() => {
        // Une réponse arrivée après un changement de page ne doit pas écraser la nouvelle.
        let ignore = false;
        apiFetch<Paginated<MovieSummary>>(`/movies?sort=popular&page=${page}&limit=${PAGE_SIZE}`)
            .then((movies) => ignore || setResult({ page, movies, error: null }))
            .catch((reason: Error) => ignore || setResult({ page, movies: null, error: reason.message }));

        return () => {
            ignore = true;
        };
    }, [page]);

    // Tant que le résultat affiché n'est pas celui de la page demandée, la page est en cours de chargement.
    const current = result?.page === page ? result : null;
    const movies = current?.movies ?? null;
    const error = current?.error ?? null;

    return (
        <section className="space-y-6">
            <h1 className="text-2xl font-semibold">Films populaires</h1>
            {error !== null && (
                <Alert variant="destructive">
                    <AlertDescription>Impossible de charger les films : {error}</AlertDescription>
                </Alert>
            )}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
                {current === null
                    ? Array.from({ length: PAGE_SIZE }, (_, index) => <Skeleton key={index} className="aspect-[2/3]" />)
                    : movies?.items.map((movie) => <MovieCard key={movie.id} movie={movie} />)}
            </div>
            {movies !== null && (
                <nav className="flex items-center justify-center gap-4 text-sm">
                    <PageLink page={page - 1} disabled={page <= 1} label="Précédent" />
                    <span>
                        Page {page} sur {movies.lastPage}
                    </span>
                    <PageLink page={page + 1} disabled={page >= movies.lastPage} label="Suivant" />
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
