import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Link, useParams } from "react-router";
import { ContentRow } from "@/components/ContentRow";
import { QueryError } from "@/components/QueryError";
import { SectionHeader } from "@/components/SectionHeader";
import { NotFoundMessage } from "@/components/NotFoundMessage";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/auth";
import { LogMovieButton } from "@/features/log-entries/LogMovieButton";
import { ReviewTeaser } from "@/features/log-entries/ReviewTeaser";
import { reviewsPath, reviewsQuery } from "@/features/log-entries/reviews";
import { MovieRelationshipControls } from "@/features/movie-relationships/MovieRelationshipControls";
import { DEFAULT_CATALOG_SEARCH, catalogPath, catalogPathWith } from "@/features/movies/catalog-search";
import { formatRuntime, releaseYear } from "@/features/movies/format";
import { MoviePoster } from "@/features/movies/MoviePoster";
import { MovieRatings } from "@/features/movies/MovieRatings";
import { movieQuery } from "@/features/movies/queries";
import { countryLabel } from "@/features/movies/regions";
import { WatchProviders } from "@/features/movies/WatchProviders";
import { jobLabel } from "@/features/people/jobs";
import { PersonLink } from "@/features/people/PersonLink";
import { PersonPhoto } from "@/features/people/PersonPhoto";
import { ApiError } from "@/lib/api";
import { parsePositiveInteger } from "@/lib/numbers";
import type { CastCredit, CrewCredit, MovieDetail } from "@/lib/types";
import { CHIP_LINK_CLASS_NAME } from "@/lib/utils";

const REVIEW_PREVIEW_COUNT = 3;

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
        return (
            <PageShell>
                <QueryError message="Impossible de charger le film." error={error} onRetry={() => void refetch()} retrying={isFetching} />
            </PageShell>
        );
    }
    if (movie === undefined) {
        return (
            <div aria-busy="true">
                <p role="status" className="sr-only">
                    Chargement du film…
                </p>
                <Skeleton className="h-[60vh] min-h-[420px] w-full rounded-none" aria-hidden="true" />
            </div>
        );
    }

    return <MovieSheet movie={movie} />;
}

// La fiche s'affiche dans le layout immersif : les états sans héros gardent une marge sous l'en-tête posé dessus.
function PageShell({ children }: { children: ReactNode }) {
    return <div className="mx-auto max-w-7xl px-4 pt-28 pb-16 sm:px-6">{children}</div>;
}

function MovieSheet({ movie }: { movie: MovieDetail }) {
    const year = releaseYear(movie.releaseDate);
    const directors = movie.crew.filter((credit) => credit.job === "Director");

    return (
        <article>
            <header className="relative isolate">
                <div className="absolute inset-0 -z-10 h-[min(70vh,640px)] overflow-hidden">
                    {movie.backdropUrl === null ? (
                        // Sans image de fond, l'affiche floutée donne l'ambiance du film.
                        movie.posterUrl !== null && <img src={movie.posterUrl} alt="" className="size-full scale-110 object-cover opacity-40 blur-3xl" />
                    ) : (
                        <img src={movie.backdropUrl} alt="" className="size-full object-cover object-top" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/10" />
                    <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
                </div>
                <div className="mx-auto grid max-w-7xl gap-8 px-4 pt-[min(38vh,340px)] sm:px-6 md:grid-cols-[15rem_1fr] md:items-end lg:grid-cols-[17rem_1fr]">
                    <MoviePoster movie={movie} alt={`Affiche de ${movie.title}`} className="mx-auto max-w-56 rounded-xl shadow-2xl ring-1 ring-white/15 md:max-w-none" />
                    <div className="space-y-4 pb-2">
                        <h1 className="display">{movie.title}</h1>
                        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-foreground/80">
                            {year !== undefined && <span className="font-semibold text-foreground">{year}</span>}
                            {movie.runtime !== null && <span>{formatRuntime(movie.runtime)}</span>}
                            {directors.length > 0 && (
                                <span>
                                    Réalisé par{" "}
                                    {directors.map((credit, index) => (
                                        <span key={credit.person.id}>
                                            {index > 0 && ", "}
                                            <PersonLink personId={credit.person.id} className="font-semibold text-foreground underline-offset-4 hover:underline">
                                                {credit.person.name}
                                            </PersonLink>
                                        </span>
                                    ))}
                                </span>
                            )}
                        </p>
                        {movie.originalTitle !== movie.title && <p className="text-sm text-muted-foreground">Titre original : {movie.originalTitle}</p>}
                        {movie.genres.length > 0 && (
                            <ul className="flex flex-wrap gap-2" aria-label="Genres">
                                {movie.genres.map((genre) => (
                                    <li key={genre.id}>
                                        <Link to={catalogPathWith({ genre: genre.id })} className={CHIP_LINK_CLASS_NAME}>
                                            {genre.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </header>

            <div className="mx-auto grid max-w-7xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_20rem]">
                <div className="min-w-0 space-y-14">
                    {movie.overview !== null && movie.overview !== "" && (
                        <section aria-labelledby="synopsis-title" className="space-y-3">
                            <h2 id="synopsis-title" className="eyebrow">
                                Synopsis
                            </h2>
                            <p className="max-w-3xl text-lg leading-relaxed text-foreground/85">{movie.overview}</p>
                        </section>
                    )}
                    {movie.cast.length > 0 && <CastRow cast={movie.cast} />}
                    {movie.crew.length > 0 && <CrewSection crew={movie.crew} />}
                    <MovieReviews movieId={movie.id} />
                    <ProductionSection movie={movie} />
                </div>
                <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
                    <div className="space-y-4 rounded-2xl border border-white/10 bg-card/70 p-4 backdrop-blur">
                        <LogMovieButton movie={movie} className="w-full" />
                        <MovieRelationshipControls movieId={movie.id} />
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-card/70 p-4">
                        <MovieRatings movieId={movie.id} />
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-card/70 p-4">
                        <WatchProviders movieId={movie.id} />
                    </div>
                </aside>
            </div>
        </article>
    );
}

function CastRow({ cast }: { cast: CastCredit[] }) {
    // Un acteur peut avoir deux rôles dans le même film : son id ne suffit pas comme clé.
    const credits = cast.map((credit, index) => ({ ...credit, key: index }));

    return (
        <ContentRow
            id="cast-title"
            title="Distribution"
            items={credits}
            itemKey={(credit) => credit.key}
            itemClassName="basis-[34%] sm:basis-[22%] lg:basis-[16%]"
            renderItem={(credit) => (
                <PersonLink personId={credit.person.id} className="group block rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
                    <div className="overflow-hidden rounded-lg ring-1 ring-white/10 transition group-hover:ring-primary/70">
                        <PersonPhoto person={credit.person} alt="" className="transition duration-500 group-hover:scale-105" loading="lazy" />
                    </div>
                    <p className="mt-2 line-clamp-1 text-sm font-semibold group-hover:text-primary">{credit.person.name}</p>
                    {credit.character !== null && credit.character !== "" && <p className="line-clamp-1 text-xs text-muted-foreground">{credit.character}</p>}
                </PersonLink>
            )}
        />
    );
}

// Les postes gardent l'ordre de l'import TMDB, la réalisation vient en premier.
function CrewSection({ crew }: { crew: CrewCredit[] }) {
    const crewByJob = new Map<string, CrewCredit[]>();
    for (const credit of crew) {
        crewByJob.set(credit.job, [...(crewByJob.get(credit.job) ?? []), credit]);
    }

    return (
        <section aria-labelledby="crew-title" className="space-y-5">
            <h2 id="crew-title" className="text-2xl font-bold sm:text-3xl">
                Équipe
            </h2>
            <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[...crewByJob].map(([job, credits]) => (
                    <div key={job} className="rounded-xl bg-white/[0.03] px-4 py-3">
                        <dt className="eyebrow">{jobLabel(job)}</dt>
                        <dd className="mt-1 text-sm">
                            {credits.map((credit, index) => (
                                <span key={index}>
                                    {index > 0 && ", "}
                                    <PersonLink personId={credit.person.id} className="font-medium underline-offset-4 hover:text-primary hover:underline">
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

function MovieReviews({ movieId }: { movieId: number }) {
    const { session } = useAuth();
    const { data } = useQuery(reviewsQuery({ movie: String(movieId) }, 1, session));
    const link = { to: reviewsPath({ movie: String(movieId) }), label: "Toutes les critiques" };

    return (
        <section aria-labelledby="movie-reviews-title" className="space-y-5">
            <SectionHeader id="movie-reviews-title" title="Critiques" link={data !== undefined && data.total > REVIEW_PREVIEW_COUNT ? link : undefined} />
            {data === undefined ? (
                <Skeleton className="h-40 w-full" aria-hidden="true" />
            ) : data.items.length === 0 ? (
                <p className="text-muted-foreground">Aucune critique pour l'instant. Journalisez le film pour écrire la première.</p>
            ) : (
                <ul className="grid gap-4 xl:grid-cols-2">
                    {data.items.slice(0, REVIEW_PREVIEW_COUNT).map((entry) => (
                        <li key={entry.id}>
                            <ReviewTeaser entry={entry} />
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

function ProductionSection({ movie }: { movie: MovieDetail }) {
    if (movie.companies.length === 0 && movie.countries.length === 0) {
        return null;
    }

    return (
        <section aria-labelledby="production-title" className="space-y-5">
            <h2 id="production-title" className="text-2xl font-bold sm:text-3xl">
                Production
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
                {movie.companies.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="eyebrow">Studios</h3>
                        <ul className="flex flex-wrap gap-2">
                            {movie.companies.map((company) => (
                                <li key={company.id}>
                                    <Link to={`/companies/${company.id}`} className={CHIP_LINK_CLASS_NAME}>
                                        {company.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {movie.countries.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="eyebrow">Pays de production</h3>
                        <ul className="flex flex-wrap gap-2">
                            {movie.countries.map((country) => (
                                <li key={country.code}>
                                    <Link to={catalogPathWith({ country: country.code })} className={CHIP_LINK_CLASS_NAME}>
                                        {countryLabel(country)}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </section>
    );
}

function MovieNotFound() {
    return (
        <PageShell>
            <NotFoundMessage
                title="Film introuvable"
                message="Ce film n'existe pas ou n'est plus dans le catalogue."
                action={{ to: catalogPath(DEFAULT_CATALOG_SEARCH), label: "Retour au catalogue" }}
            />
        </PageShell>
    );
}
