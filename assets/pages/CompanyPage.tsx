import { useQuery } from "@tanstack/react-query";
import { Link, Navigate, useParams, useSearchParams } from "react-router";
import { PaginatedList } from "@/components/PaginatedList";
import { QueryError } from "@/components/QueryError";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { companyMoviesQuery, companyQuery } from "@/features/companies/queries";
import { MovieGrid } from "@/features/movies/MovieGrid";
import { ApiError } from "@/lib/api";
import { parsePositiveInteger } from "@/lib/numbers";
import { pageSearch, parsePage } from "@/lib/pagination";
import type { Company } from "@/lib/types";

export function CompanyPage() {
    const { id = "" } = useParams();
    const companyId = parsePositiveInteger(id);

    if (companyId === null) {
        return <CompanyNotFound />;
    }

    return <CompanyDetails companyId={companyId} />;
}

function CompanyDetails({ companyId }: { companyId: number }) {
    const [searchParams] = useSearchParams();
    const page = parsePage(searchParams);
    const { data: company, error, isFetching, refetch } = useQuery(companyQuery(companyId));

    if (page === null) {
        return <Navigate to={pageSearch(1)} replace />;
    }
    if (error instanceof ApiError && error.status === 404) {
        return <CompanyNotFound />;
    }
    if (error !== null) {
        return <QueryError message="Impossible de charger le studio." error={error} onRetry={() => void refetch()} retrying={isFetching} />;
    }
    if (company === undefined) {
        return (
            <div className="space-y-4" aria-busy="true">
                <p role="status" className="sr-only">
                    Chargement du studio…
                </p>
                <Skeleton className="h-16 w-40" aria-hidden="true" />
                <Skeleton className="h-9 w-64" aria-hidden="true" />
            </div>
        );
    }

    return (
        <article className="space-y-8">
            <CompanyHeader company={company} />
            <section className="space-y-6">
                <h2 className="text-lg font-semibold">Films</h2>
                <PaginatedList
                    query={companyMoviesQuery(company.id, page)}
                    page={page}
                    pathForPage={pageSearch}
                    label="Pagination des films du studio"
                    emptyMessage="Aucun film de ce studio dans le catalogue."
                    errorMessage="Impossible de charger les films du studio."
                >
                    {(movies, total) => (
                        <>
                            <p className="text-sm text-muted-foreground">
                                {total.toLocaleString("fr-FR")} {total > 1 ? "films" : "film"}, des plus populaires aux moins connus
                            </p>
                            <MovieGrid movies={movies} />
                        </>
                    )}
                </PaginatedList>
            </section>
        </article>
    );
}

function CompanyHeader({ company }: { company: Company }) {
    return (
        <header className="space-y-4">
            {/* Les logos TMDB sont souvent sombres sur fond transparent : un fond clair les garde lisibles en thème sombre. */}
            {company.logoUrl !== null && (
                <div className="inline-flex rounded-lg bg-white p-3">
                    <img src={company.logoUrl} alt={`Logo de ${company.name}`} className="h-12 w-auto object-contain" />
                </div>
            )}
            <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Studio</p>
                <h1 className="text-3xl font-semibold">{company.name}</h1>
            </div>
        </header>
    );
}

function CompanyNotFound() {
    return (
        <section className="space-y-4 text-center">
            <h1 className="text-2xl font-semibold">Studio introuvable</h1>
            <p className="text-muted-foreground">Ce studio n'existe pas ou n'est plus dans le catalogue.</p>
            <Button asChild variant="outline">
                <Link to="/">Retour au catalogue</Link>
            </Button>
        </section>
    );
}
