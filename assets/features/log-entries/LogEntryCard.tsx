import { Heart, Repeat } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { LogEntryReview } from "@/features/log-entries/LogEntryReview";
import { formatDate } from "@/features/log-entries/format";
import { MoviePoster } from "@/features/movies/MoviePoster";
import { StarRating } from "@/features/movies/StarRating";
import { releaseYear } from "@/features/movies/format";
import { UserAvatar } from "@/features/users/UserAvatar";
import type { LogEntry } from "@/lib/types";

export function LogEntryCard({ entry, heading: Heading, children }: {
    entry: LogEntry;
    heading: "h1" | "h2" | "h3";
    children: ReactNode;
}) {
    const { movie } = entry;
    const year = releaseYear(movie.releaseDate);

    return (
        <article className="flex gap-4 rounded-2xl border border-white/5 bg-card/50 p-4 sm:gap-5 sm:p-5">
            <Link to={`/movies/${movie.id}`} tabIndex={-1} aria-hidden="true" className="w-16 shrink-0 sm:w-24">
                <MoviePoster movie={movie} alt="" className="rounded-lg text-xs ring-1 ring-white/10" loading="lazy" />
            </Link>
            <div className="min-w-0 flex-1 space-y-3">
                <header className="space-y-1.5">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                        <UserAvatar username={entry.user.username} className="size-6 text-[0.6rem]" />
                        <Link to={`/users/${entry.user.username}`} className="font-semibold text-foreground underline-offset-4 hover:underline">
                            {entry.user.username}
                        </Link>
                        <span aria-hidden="true">·</span>
                        {entry.watchedOn === null ? <span>Date non précisée</span> : <time dateTime={entry.watchedOn}>Vu le {formatDate(entry.watchedOn)}</time>}
                    </p>
                    <Heading className={Heading === "h1" ? "text-3xl font-extrabold sm:text-4xl" : "text-xl font-bold"}>
                        <Link to={`/movies/${movie.id}`} className="wrap-break-word underline-offset-4 hover:underline">
                            {movie.title}
                        </Link>
                        {year !== undefined && <span className="ml-2 text-base font-normal text-muted-foreground">{year}</span>}
                    </Heading>
                    {(entry.rating !== null || entry.liked || entry.rewatch) && (
                        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                            {entry.rating !== null && <StarRating rating={entry.rating} className="[&_svg]:size-4" />}
                            {entry.liked && (
                                <span className="inline-flex items-center gap-1 text-chart-5">
                                    <Heart aria-hidden="true" className="size-4 fill-current" />
                                    Aimé
                                </span>
                            )}
                            {entry.rewatch && (
                                <span className="inline-flex items-center gap-1">
                                    <Repeat aria-hidden="true" className="size-4" />
                                    Revu
                                </span>
                            )}
                        </p>
                    )}
                </header>
                {entry.review !== null && entry.review !== "" && <LogEntryReview key={entry.review} review={entry.review} containsSpoilers={entry.containsSpoilers} />}
                {children}
            </div>
        </article>
    );
}
