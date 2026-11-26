import { Heart, Repeat } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { LogEntryReview } from "@/features/log-entries/LogEntryReview";
import { formatDate } from "@/features/log-entries/format";
import { MoviePoster } from "@/features/movies/MoviePoster";
import { formatRating, releaseYear } from "@/features/movies/format";
import type { LogEntry } from "@/lib/types";
import { TEXT_LINK_CLASS_NAME } from "@/lib/utils";

export function LogEntryCard({ entry, heading: Heading, children }: {
    entry: LogEntry;
    heading: "h1" | "h2" | "h3";
    children: ReactNode;
}) {
    const { movie } = entry;
    const year = releaseYear(movie.releaseDate);

    return (
        <article className="flex gap-4 rounded-xl border p-4">
            <Link to={`/movies/${movie.id}`} tabIndex={-1} aria-hidden="true" className="w-16 shrink-0 sm:w-20">
                <MoviePoster movie={movie} alt="" className="rounded-md text-xs" loading="lazy" />
            </Link>
            <div className="min-w-0 flex-1 space-y-2">
                <header className="space-y-1">
                    <Heading className={Heading === "h1" ? "text-2xl font-semibold sm:text-3xl" : "font-medium"}>
                        <Link to={`/movies/${movie.id}`} className="wrap-break-word hover:underline">
                            {movie.title}
                        </Link>
                        {year !== undefined && <span className="ml-2 text-sm font-normal text-muted-foreground">{year}</span>}
                    </Heading>
                    <p className="text-sm text-muted-foreground">
                        Par <Link to={`/users/${entry.user.username}`} className={TEXT_LINK_CLASS_NAME}>{entry.user.username}</Link>
                    </p>
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                        {entry.watchedOn === null ? <span>Date non précisée</span> : <time dateTime={entry.watchedOn}>Vu le {formatDate(entry.watchedOn)}</time>}
                        {entry.rating !== null && <span className="font-medium text-foreground">{formatRating(entry.rating)}</span>}
                        {entry.liked && (
                            <span className="inline-flex items-center gap-1">
                                <Heart aria-hidden="true" className="size-4 fill-current text-primary" />
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
                </header>
                {entry.review !== null && entry.review !== "" && <LogEntryReview key={entry.review} review={entry.review} containsSpoilers={entry.containsSpoilers} />}
                {children}
            </div>
        </article>
    );
}
