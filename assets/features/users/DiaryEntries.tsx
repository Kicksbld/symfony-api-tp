import { Heart, MessageSquareText, Repeat } from "lucide-react";
import { Link } from "react-router";
import { LogEntryActions } from "@/features/log-entries/LogEntryActions";
import { MoviePoster } from "@/features/movies/MoviePoster";
import { StarRating } from "@/features/movies/StarRating";
import { releaseYear } from "@/features/movies/format";
import type { LogEntry } from "@/lib/types";

const MONTH_FORMAT = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });

// Le journal ne contient que des entrées datées, de la plus récente à la plus ancienne : on les range par mois.
export function DiaryEntries({ entries }: { entries: LogEntry[] }) {
    const months = new Map<string, LogEntry[]>();
    for (const entry of entries) {
        const month = entry.watchedOn?.slice(0, 7) ?? "";
        months.set(month, [...(months.get(month) ?? []), entry]);
    }

    return (
        <div className="space-y-10">
            {[...months].map(([month, monthEntries]) => (
                <section key={month} aria-labelledby={`diary-${month}`} className="space-y-2">
                    <h3 id={`diary-${month}`} className="eyebrow border-b border-white/10 pb-3 text-primary">
                        {MONTH_FORMAT.format(new Date(`${month}-01T00:00:00Z`))}
                    </h3>
                    <ul className="divide-y divide-white/5">
                        {monthEntries.map((entry) => (
                            <li key={entry.id}>
                                <DiaryEntryRow entry={entry} />
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </div>
    );
}

function DiaryEntryRow({ entry }: { entry: LogEntry }) {
    const day = entry.watchedOn?.slice(8, 10);

    return (
        <article className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
            <time dateTime={entry.watchedOn ?? undefined} className="w-10 shrink-0 text-center font-heading text-2xl font-extrabold text-muted-foreground tabular-nums">
                {day}
            </time>
            <Link to={`/movies/${entry.movie.id}`} tabIndex={-1} aria-hidden="true" className="w-12 shrink-0">
                <MoviePoster movie={entry.movie} alt="" className="rounded-md text-[0.5rem] ring-1 ring-white/10" loading="lazy" />
            </Link>
            <div className="min-w-0 flex-1 space-y-1">
                <h4 className="truncate font-bold">
                    <Link to={`/log-entries/${entry.id}`} className="underline-offset-4 hover:underline">
                        {entry.movie.title}
                    </Link>
                    <span className="ml-2 text-sm font-normal text-muted-foreground">{releaseYear(entry.movie.releaseDate)}</span>
                </h4>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {entry.rating !== null && <StarRating rating={entry.rating} className="[&_svg]:size-3.5" />}
                    {entry.liked && (
                        <span className="inline-flex items-center gap-1 text-chart-5">
                            <Heart aria-hidden="true" className="size-3.5 fill-current" />
                            Aimé
                        </span>
                    )}
                    {entry.rewatch && (
                        <span className="inline-flex items-center gap-1">
                            <Repeat aria-hidden="true" className="size-3.5" />
                            Revu
                        </span>
                    )}
                    {entry.review !== null && entry.review !== "" && (
                        <span className="inline-flex items-center gap-1">
                            <MessageSquareText aria-hidden="true" className="size-3.5" />
                            Critique
                        </span>
                    )}
                </p>
            </div>
            {/* Sur mobile, les actions passent sous la ligne, alignées sur le titre (jour + affiche + écarts = 7,5rem). */}
            <div className="w-full pl-[7.5rem] sm:w-auto sm:pl-0">
                <LogEntryActions entry={entry} />
            </div>
        </article>
    );
}
