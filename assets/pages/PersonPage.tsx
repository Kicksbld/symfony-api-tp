import { useQuery } from "@tanstack/react-query";
import { Link, Navigate, useParams, useSearchParams, type To } from "react-router";
import { EmptyState } from "@/components/EmptyState";
import { PaginatedList } from "@/components/PaginatedList";
import { QueryError } from "@/components/QueryError";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
        <article className="space-y-10">
            <header className="grid gap-8 md:grid-cols-[12rem_1fr]">
                <PersonPhoto person={person} alt={`Photo de ${person.name}`} className="max-w-48 rounded-xl" />
                <div className="space-y-2">
                    <h1 className="text-3xl font-semibold">{person.name}</h1>
                    {jobs.length > 0 && <p className="text-muted-foreground">{jobs.map((job) => job.label).join(" · ")}</p>}
                    <p className="text-sm text-muted-foreground">
                        {movieCount.toLocaleString("fr-FR")} {movieCount > 1 ? "films" : "film"} dans le catalogue
                    </p>
                </div>
            </header>
            {person.cast.length > 0 && (
                <section className="space-y-3">
                    <h2 className="text-lg font-semibold">Rôles joués</h2>
                    <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
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
        <section className="space-y-6">
            <h2 className="text-lg font-semibold">Filmographie</h2>
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
        <Button asChild variant={active ? "default" : "outline"} size="sm">
            <Link to={to} aria-current={active ? "page" : undefined}>
                {label}
                <span className={active ? "opacity-80" : "text-muted-foreground"}>{movieCount}</span>
            </Link>
        </Button>
    );
}

function PersonNotFound() {
    return (
        <section className="space-y-4 text-center">
            <h1 className="text-2xl font-semibold">Personne introuvable</h1>
            <p className="text-muted-foreground">Cette personne n'existe pas ou n'est plus dans le catalogue.</p>
            <Button asChild variant="outline">
                <Link to="/people">Rechercher une personne</Link>
            </Button>
        </section>
    );
}
