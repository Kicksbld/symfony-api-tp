import { useQuery } from "@tanstack/react-query";
import { QueryError } from "@/components/QueryError";
import { SectionSkeleton } from "@/components/SectionSkeleton";
import { formatStarCount } from "@/features/movies/format";
import { movieRatingsQuery } from "@/features/movies/queries";
import type { RatingDistribution } from "@/lib/types";

const AVERAGE_FORMAT = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function MovieRatings({ movieId }: { movieId: number }) {
    const { data: ratings, error, isFetching, refetch } = useQuery(movieRatingsQuery(movieId));

    return (
        <section className="space-y-3" aria-labelledby="ratings-title">
            <h2 id="ratings-title" className="eyebrow">
                Notes des membres
            </h2>
            {/* Une relecture ratée après un journal garde la répartition déjà affichée sous le message d'erreur. */}
            {error !== null && (
                <QueryError message="Impossible de charger les notes." error={error} onRetry={() => void refetch()} retrying={isFetching} />
            )}
            {ratings === undefined ? (
                error === null && <SectionSkeleton label="Chargement des notes…" className="h-24 w-full max-w-sm" />
            ) : ratings.average === null ? (
                <p className="text-sm text-muted-foreground">Pas encore noté par les membres.</p>
            ) : (
                <RatingHistogram ratings={ratings} average={ratings.average} />
            )}
        </section>
    );
}

function RatingHistogram({ ratings, average }: { ratings: RatingDistribution; average: number }) {
    // Hauteur relative à la colonne la plus remplie, pour que l'écart entre les notes reste lisible avec peu de votes.
    const maxCount = Math.max(...ratings.histogram.map((bar) => bar.count));

    return (
        <div className="flex items-end gap-5">
            <figure className="min-w-0 flex-1">
                <div className="flex h-20 items-end gap-0.5" aria-hidden="true">
                    {ratings.histogram.map((bar) => (
                        <div
                            key={bar.rating}
                            className="flex-1 rounded-t-sm bg-primary/70 transition-colors hover:bg-primary"
                            style={{ height: `${Math.max((bar.count / maxCount) * 100, 2)}%` }}
                            title={`${formatStarCount(bar.rating)} : ${bar.count}`}
                        />
                    ))}
                </div>
                <div className="mt-1 flex justify-between text-xs text-muted-foreground" aria-hidden="true">
                    <span>0,5</span>
                    <span>5</span>
                </div>
                <table className="sr-only">
                    <caption>Nombre de notes par demi-étoile</caption>
                    <thead>
                        <tr>
                            <th scope="col">Note</th>
                            <th scope="col">Nombre de notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ratings.histogram.map((bar) => (
                            <tr key={bar.rating}>
                                <th scope="row">{formatStarCount(bar.rating)}</th>
                                <td>{bar.count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </figure>
            <p className="shrink-0 text-right">
                <span className="block font-heading text-4xl font-extrabold tracking-tight">{AVERAGE_FORMAT.format(average)}</span>
                <span className="text-xs text-muted-foreground">
                    sur 5, {ratings.count} {ratings.count > 1 ? "notes" : "note"}
                </span>
            </p>
        </div>
    );
}
