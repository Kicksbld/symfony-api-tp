import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Pause, Play } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/auth";
import { featuredMoviesQuery } from "@/features/home/queries";
import { LogMovieButton } from "@/features/log-entries/LogMovieButton";
import { MovieLink } from "@/features/movies/MovieLink";
import { formatRuntime, releaseYear } from "@/features/movies/format";
import { movieQuery } from "@/features/movies/queries";
import type { MovieSummary } from "@/lib/types";

const SLIDE_DURATION = 8000;

export function HeroCarousel() {
    const { data: movies, isPending } = useQuery(featuredMoviesQuery());

    if (isPending) {
        return <Skeleton className="h-[520px] w-full rounded-none lg:h-[min(88vh,820px)]" aria-hidden="true" />;
    }
    // Sans film à mettre en avant (catalogue vide, erreur), l'accueil commence directement par les rangées.
    if (movies === undefined || movies.length === 0) {
        return <div className="h-16" />;
    }

    return <HeroSlides movies={movies} />;
}

function HeroSlides({ movies }: { movies: MovieSummary[] }) {
    const { session } = useAuth();
    const reduceMotion = useReducedMotion();
    const [index, setIndex] = useState(0);
    // Seul le panneau de sélection met en pause : le héros occupe tout l'écran, la souris est presque toujours dessus.
    const [panelActive, setPanelActive] = useState(false);
    const [stopped, setStopped] = useState(reduceMotion === true);
    const movie = movies[index];
    const { data: detail } = useQuery(movieQuery(movie.id));
    const playing = !stopped && !panelActive;

    // C'est la fin de l'animation de la barre qui fait avancer : la barre et le défilement restent synchronisés,
    // et une pause fige les deux au même endroit.
    function showNext(): void {
        setIndex((current) => (current + 1) % movies.length);
    }

    const facts = [releaseYear(movie.releaseDate), detail?.runtime != null && formatRuntime(detail.runtime), ...(detail?.genres.slice(0, 2).map((genre) => genre.name) ?? [])].filter(Boolean);

    return (
        // La hauteur est un minimum : sur mobile, le contenu peut la dépasser sans passer sous l'en-tête posé dessus.
        <section
            aria-roledescription="carrousel"
            aria-label="Films à la une"
            className="relative isolate flex min-h-[520px] items-end overflow-hidden pt-24 lg:min-h-[min(88vh,820px)]"
        >
            <AnimatePresence initial={false}>
                <motion.img
                    key={movie.id}
                    src={movie.backdropUrl ?? undefined}
                    alt=""
                    className="absolute inset-0 -z-20 size-full object-cover"
                    initial={{ opacity: 0, scale: 1.06 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                />
            </AnimatePresence>
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/50 to-background/10" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-background/95 via-background/40 to-transparent" />

            <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 pb-10 sm:px-6 lg:grid-cols-[1fr_22rem] lg:items-end lg:gap-10 lg:pb-14">
                <motion.div key={movie.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-2xl space-y-4 sm:space-y-5" aria-live={playing ? "off" : "polite"}>
                    <p className="eyebrow text-primary">Tendance n° {index + 1}</p>
                    <h2 className="display">{movie.title}</h2>
                    {facts.length > 0 && <p className="text-sm font-medium text-foreground/80">{facts.join(" · ")}</p>}
                    {detail?.overview != null && detail.overview !== "" && (
                        <p className="line-clamp-2 max-w-xl text-base leading-relaxed text-foreground/75 sm:line-clamp-3">{detail.overview}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                        <Button asChild size="lg" className="h-11 rounded-full px-5 text-base">
                            <MovieLink movieId={movie.id}>
                                Voir la fiche
                                <ArrowRight aria-hidden="true" />
                            </MovieLink>
                        </Button>
                        {session !== null && <LogMovieButton movie={movie} />}
                    </div>
                </motion.div>

                <div
                    className="rounded-2xl border border-white/10 bg-background/55 p-3 backdrop-blur-xl lg:p-4"
                    onPointerEnter={() => setPanelActive(true)}
                    onPointerLeave={() => setPanelActive(false)}
                    onFocus={() => setPanelActive(true)}
                    onBlur={(event) => {
                        if (!event.currentTarget.contains(event.relatedTarget)) {
                            setPanelActive(false);
                        }
                    }}
                >
                    <div className="mb-2 flex items-center justify-between lg:mb-3">
                        <p className="eyebrow">À la une</p>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                                {String(index + 1).padStart(2, "0")} / {String(movies.length).padStart(2, "0")}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                className="rounded-full"
                                aria-label={stopped ? "Reprendre le défilement" : "Mettre le défilement en pause"}
                                onClick={() => setStopped(!stopped)}
                            >
                                {stopped ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
                            </Button>
                        </div>
                    </div>
                    {/* Sur mobile, chaque film n'est plus qu'une barre de progression : la liste avec vignettes prendrait tout l'écran. */}
                    <ol className="grid grid-cols-5 gap-1.5 lg:block lg:space-y-1">
                        {movies.map((candidate, position) => (
                            <li key={candidate.id}>
                                <button
                                    type="button"
                                    aria-current={position === index ? "true" : undefined}
                                    aria-label={candidate.title}
                                    onClick={() => setIndex(position)}
                                    className="group flex w-full items-center gap-3 rounded-lg px-0.5 py-2.5 text-left lg:p-1.5 transition-colors hover:bg-white/10 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none aria-[current=true]:bg-white/10"
                                >
                                    <img src={candidate.backdropUrl ?? undefined} alt="" className="hidden aspect-video w-16 shrink-0 rounded-md object-cover lg:block" loading="lazy" />
                                    <span className="min-w-0 flex-1">
                                        <span aria-hidden="true" className="hidden text-sm font-semibold lg:line-clamp-1">{candidate.title}</span>
                                        <span className="block h-1 lg:mt-1.5 lg:h-0.5 overflow-hidden rounded-full bg-white/10">
                                            {position === index && (
                                                <span
                                                    key={index}
                                                    onAnimationEnd={showNext}
                                                    className="animate-slide-progress block h-full origin-left bg-primary"
                                                    style={{ animationDuration: `${SLIDE_DURATION}ms`, animationPlayState: playing ? "running" : "paused" }}
                                                />
                                            )}
                                        </span>
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
        </section>
    );
}
