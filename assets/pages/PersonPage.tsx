import { useQuery } from "@tanstack/react-query";
import { Link, Navigate, useParams, useSearchParams, type To } from "react-router";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { PaginatedList } from "@/components/PaginatedList";
import { QueryError } from "@/components/QueryError";
import { NotFoundMessage } from "@/components/NotFoundMessage";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CatalogLink } from "@/features/movies/CatalogLink";
import { catalogPathWith } from "@/features/movies/catalog-search";
import { MovieGrid } from "@/features/movies/MovieGrid";
import { releaseYear } from "@/features/movies/format";
import { personJobs, personMovieCount, type PersonJob } from "@/features/people/jobs";
import { PersonPhoto } from "@/features/people/PersonPhoto";
import { personMoviesQuery, personQuery } from "@/features/people/queries";
import { ApiError } from "@/lib/api";
import { parsePositiveInteger } from "@/lib/numbers";
import { pageSearch, parsePage } from "@/lib/pagination";
import type { PersonDetail } from "@/lib/types";
import { TEXT_LINK_CLASS_NAME } from "@/lib/utils";

export function PersonPage() {
    const { id = "" } = useParams();
    const personId = parsePositiveInteger(id);

    if (personId === null) {
        return <PersonNotFound />;
    }

    return <PersonDetails personId={personId} />;
}

function PersonDetails({ personId }: { personId: number }) {
    const { data: person, error, isFetching, refetch } = useQuery(personQuery(personId));

    if (error instanceof ApiError && error.status === 404) {
        return <PersonNotFound />;
    }
    if (error !== null) {
        return <QueryError message="Impossible de charger cette personne." error={error} onRetry={() => void refetch()} retrying={isFetching} />;
    }
    if (person === undefined) {
        return (
            <div className="grid gap-8 md:grid-cols-[12rem_1fr]" aria-busy="true">
                <p role="status" className="sr-only">
                    Chargement de la personne…
                </p>
                <Skeleton className="aspect-[2/3] w-full max-w-48" aria-hidden="true" />
                <div className="space-y-4" aria-hidden="true">
                    <Skeleton className="h-9 w-1/2" />
                    <Skeleton className="h-5 w-1/3" />
                </div>
            </div>
        );
    }

    return <PersonSheet person={person} />;
}

function PersonSheet({ person }: { person: PersonDetail }) {
    const jobs = personJobs(person);
    const movieCount = personMovieCount(person);

    return (
        <article className="space-y-14">
            <header className="grid gap-8 sm:grid-cols-[11rem_1fr] sm:items-end md:grid-cols-[14rem_1fr]">
                <PersonPhoto person={person} alt={`Photo de ${person.name}`} className="max-w-44 rounded-2xl shadow-2xl ring-1 ring-white/15 sm:max-w-none" />
                <div className="space-y-4">
                    <PageHeader
                        eyebrow={jobs.length > 0 ? jobs.map((job) => job.label).join(" · ") : undefined}
                        title={person.name}
                        description={`${movieCount.toLocaleString("fr-FR")} ${movieCount > 1 ? "films" : "film"} dans le catalogue`}
                    />
                    {movieCount > 0 && <CatalogLink to={catalogPathWith({ person: person.id })} />}
                </div>
            </header>
            {person.cast.length > 0 && (
                <section aria-labelledby="roles-title" className="space-y-5">
                    <h2 id="roles-title" className="text-2xl font-bold sm:text-3xl">
                        Rôles joués
                    </h2>
                    <ul className="grid gap-x-8 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3">
                        {/* Deux rôles dans le même film donnent deux crédits avec le même film : l'id ne suffit pas comme clé. */}
                        {person.cast.map((credit, index) => (
                            <li key={index} className="text-sm">
                                <Link to={`/movies/${credit.movie.id}`} className={TEXT_LINK_CLASS_NAME}>
                                    {credit.movie.title}
                                </Link>
                                {credit.movie.releaseDate !== null && <span className="text-muted-foreground"> ({releaseYear(credit.movie.releaseDate)})</span>}
                                {credit.character !== null && credit.character !== "" && <span className="text-muted-foreground"> : {credit.character}</span>}
                            </li>
                        ))}
                    </ul>
                </section>
            )}
            <Filmography personId={person.id} jobs={jobs} movieCount={movieCount} />
        </article>
    );
}

type FilmographyProps = {
    personId: number;
    jobs: PersonJob[];
    movieCount: number;
};

function Filmography({ personId, jobs, movieCount }: FilmographyProps) {
    const [searchParams] = useSearchParams();
    const job = searchParams.get("job");
    const page = parsePage(searchParams);
    const jobParams: Record<string, string> = job === null ? {} : { job };

    // Un poste que la personne n'a jamais occupé (lien modifié à la main) renvoie vers toute la filmographie.
    if (job !== null && !jobs.some((candidate) => candidate.job === job)) {
        return <Navigate to={pageSearch(1)} replace />;
    }
    if (page === null) {
        return <Navigate to={pageSearch(1, jobParams)} replace />;
    }

    return (
        <section aria-labelledby="filmography-title" className="space-y-6">
            <h2 id="filmography-title" className="text-2xl font-bold sm:text-3xl">
                Filmographie
            </h2>
            {jobs.length === 0 ? (
                <EmptyState message="Aucun film de cette personne dans le catalogue." />
            ) : (
                <>
                    <nav aria-label="Postes" className="flex flex-wrap gap-2">
                        <JobLink to={pageSearch(1)} active={job === null} label="Tous" movieCount={movieCount} />
                        {jobs.map((candidate) => (
                            <JobLink
                                key={candidate.job}
                                to={pageSearch(1, { job: candidate.job })}
                                active={job === candidate.job}
                                label={candidate.label}
                                movieCount={candidate.movieCount}
                            />
                        ))}
                    </nav>
                    <PaginatedList
                        query={personMoviesQuery(personId, job, page)}
                        page={page}
                        pathForPage={(nextPage) => pageSearch(nextPage, jobParams)}
                        label="Pagination de la filmographie"
                        emptyMessage="Aucun film pour ce poste."
                        errorMessage="Impossible de charger la filmographie."
                    >
                        {(movies) => <MovieGrid movies={movies} />}
                    </PaginatedList>
                </>
            )}
        </section>
    );
}

type JobLinkProps = {
    to: To;
    active: boolean;
    label: string;
    movieCount: number;
};

// NavLink ne compare que le chemin, pas le paramètre job : on marque nous-mêmes le poste affiché.
function JobLink({ to, active, label, movieCount }: JobLinkProps) {
    return (
        <Button asChild variant={active ? "default" : "outline"} className="h-9 rounded-full px-4">
            <Link to={to} aria-current={active ? "page" : undefined}>
                {label}
                <span className={active ? "opacity-80" : "text-muted-foreground"}>{movieCount}</span>
            </Link>
        </Button>
    );
}

function PersonNotFound() {
    return <NotFoundMessage title="Personne introuvable" message="Cette personne n'existe pas ou n'est plus dans le catalogue." action={{ to: "/people", label: "Rechercher une personne" }} />;
}
