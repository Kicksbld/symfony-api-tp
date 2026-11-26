import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { QueryError } from "@/components/QueryError";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MoviePoster } from "@/features/movies/MoviePoster";
import { MovieRelationshipControls } from "@/features/movie-relationships/MovieRelationshipControls";
import { LogMovieButton } from "@/features/log-entries/LogMovieButton";
import { reviewsPath } from "@/features/log-entries/reviews";
import { DEFAULT_CATALOG_SEARCH, catalogPath, catalogPathWith } from "@/features/movies/catalog-search";
import { formatRuntime, releaseYear } from "@/features/movies/format";
import { MovieRatings } from "@/features/movies/MovieRatings";
import { movieQuery } from "@/features/movies/queries";
import { countryLabel } from "@/features/movies/regions";
import { WatchProviders } from "@/features/movies/WatchProviders";
import { jobLabel } from "@/features/people/jobs";
import { PersonLink } from "@/features/people/PersonLink";
import { ApiError } from "@/lib/api";
import { parsePositiveInteger } from "@/lib/numbers";
import { TEXT_LINK_CLASS_NAME } from "@/lib/utils";
import type { Company, Country, CrewCredit, MovieDetail } from "@/lib/types";

// La fiche ne montre que les têtes d'affiche, TMDB en fournit jusqu'à 15.
const MAIN_CAST_SIZE = 8;

export function MoviePage() {
    const { id = "" } = useParams();
    const movieId = parsePositiveInteger(id);

    if (movieId === null) {
        return <MovieNotFound />;
    }

    return <MovieDetails movieId={movieId} />;
}

function MovieDetails({ movieId }: { movieId: number }) {
    const { data: movie, error, isFetching, refetch } = useQuery(movieQuery(movieId));

    if (error instanceof ApiError && error.status === 404) {
        return <MovieNotFound />;
    }
    if (error !== null) {
        return <QueryError message="Impossible de charger le film." error={error} onRetry={() => void refetch()} retrying={isFetching} />;
    }
    if (movie === undefined) {
        return (
            <div className="grid gap-8 md:grid-cols-[16rem_1fr]" aria-busy="true">
                <p role="status" className="sr-only">
                    Chargement du film…
                </p>
                <Skeleton className="aspect-[2/3] w-full max-w-64" aria-hidden="true" />
                <div className="space-y-4" aria-hidden="true">
                    <Skeleton className="h-9 w-2/3" />
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-24 w-full" />
                </div>
            </div>
        );
    }

    return <MovieSheet movie={movie} />;
}

function MovieSheet({ movie }: { movie: MovieDetail }) {
    const year = releaseYear(movie.releaseDate);
    const crewByJob = groupCrewByJob(movie.crew);
    const mainCast = movie.cast.slice(0, MAIN_CAST_SIZE);
    const facts = [movie.runtime !== null && formatRuntime(movie.runtime), ...movie.genres.map((genre) => genre.name)].filter(Boolean);

    return (
        <article className="grid gap-8 md:grid-cols-[16rem_1fr]">
            <MoviePoster movie={movie} alt={`Affiche de ${movie.title}`} className="max-w-64 rounded-xl" />
            <div className="space-y-6">
                <header className="space-y-2">
                    <h1 className="text-3xl font-semibold">
                        {movie.title}
                        {year !== undefined && <span className="ml-3 text-xl font-normal text-muted-foreground">{year}</span>}
                    </h1>
                    {movie.originalTitle !== movie.title && <p className="text-muted-foreground">Titre original : {movie.originalTitle}</p>}
                    {facts.length > 0 && <p className="text-sm text-muted-foreground">{facts.join(" · ")}</p>}
                </header>
                <div className="flex flex-wrap items-start gap-3">
                    <LogMovieButton movie={movie} />
                    <MovieRelationshipControls movieId={movie.id} />
                </div>
                <Link to={reviewsPath({ movie: String(movie.id) })} className={`text-sm ${TEXT_LINK_CLASS_NAME}`}>Voir les critiques du film</Link>
                <MovieRatings movieId={movie.id} />
                {movie.overview !== null && movie.overview !== "" && (
                    <section className="space-y-2">
                        <h2 className="text-lg font-semibold">Synopsis</h2>
                        <p className="leading-relaxed text-muted-foreground">{movie.overview}</p>
                    </section>
                )}
                {mainCast.length > 0 && (
                    <section className="space-y-2">
                        <h2 className="text-lg font-semibold">Distribution</h2>
                        <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                            {/* Un acteur peut avoir deux rôles dans le même film : son id ne suffit pas comme clé. */}
                            {mainCast.map((credit, index) => (
                                <li key={index} className="text-sm">
                                    <PersonLink personId={credit.person.id} className={TEXT_LINK_CLASS_NAME}>
                                        {credit.person.name}
                                    </PersonLink>
                                    {credit.character !== null && credit.character !== "" && (
                                        <span className="text-muted-foreground"> : {credit.character}</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
                {crewByJob.size > 0 && <CrewSection crewByJob={crewByJob} />}
                {movie.companies.length > 0 && <CompaniesSection companies={movie.companies} />}
                {movie.countries.length > 0 && <CountriesSection countries={movie.countries} />}
                <WatchProviders movieId={movie.id} />
            </div>
        </article>
    );
}

// Les postes gardent l'ordre de l'import TMDB, la réalisation vient en premier.
function groupCrewByJob(crew: CrewCredit[]): Map<string, CrewCredit[]> {
    const crewByJob = new Map<string, CrewCredit[]>();
    for (const credit of crew) {
        crewByJob.set(credit.job, [...(crewByJob.get(credit.job) ?? []), credit]);
    }

    return crewByJob;
}

function CrewSection({ crewByJob }: { crewByJob: Map<string, CrewCredit[]> }) {
    return (
        <section className="space-y-2">
            <h2 className="text-lg font-semibold">Équipe</h2>
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
                {[...crewByJob].map(([job, credits]) => (
                    <div key={job} className="contents">
                        <dt className="text-muted-foreground">{jobLabel(job)}</dt>
                        <dd className="mb-2 sm:mb-0">
                            {credits.map((credit, index) => (
                                <span key={index}>
                                    {index > 0 && ", "}
                                    <PersonLink personId={credit.person.id} className={TEXT_LINK_CLASS_NAME}>
                                        {credit.person.name}
                                    </PersonLink>
                                </span>
                            ))}
                        </dd>
                    </div>
                ))}
            </dl>
        </section>
    );
}

function CompaniesSection({ companies }: { companies: Company[] }) {
    return (
        <section className="space-y-2">
            <h2 className="text-lg font-semibold">Studios</h2>
            <ul className="flex flex-wrap gap-2">
                {companies.map((company) => (
                    <li key={company.id}>
                        <Button asChild variant="outline" size="sm">
                            <Link to={`/companies/${company.id}`}>{company.name}</Link>
                        </Button>
                    </li>
                ))}
            </ul>
        </section>
    );
}

function CountriesSection({ countries }: { countries: Country[] }) {
    return (
        <section className="space-y-2">
            <h2 className="text-lg font-semibold">Pays de production</h2>
            <ul className="flex flex-wrap gap-2">
                {countries.map((country) => (
                    <li key={country.code}>
                        <Button asChild variant="outline" size="sm">
                            <Link to={catalogPathWith({ country: country.code })}>{countryLabel(country)}</Link>
                        </Button>
                    </li>
                ))}
            </ul>
        </section>
    );
}

function MovieNotFound() {
    return (
        <section className="space-y-4 text-center">
            <h1 className="text-2xl font-semibold">Film introuvable</h1>
            <p className="text-muted-foreground">Ce film n'existe pas ou n'est plus dans le catalogue.</p>
            <Button asChild variant="outline">
                <Link to={catalogPath(DEFAULT_CATALOG_SEARCH)}>Retour au catalogue</Link>
            </Button>
        </section>
    );
}
