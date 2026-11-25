import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router";
import { Card, CardContent } from "@/components/ui/card";
import { MoviePoster } from "@/features/movies/MoviePoster";
import { formatRating, releaseYear } from "@/features/movies/format";
import { movieQuery } from "@/features/movies/queries";
import type { MovieSummary } from "@/lib/types";

export function MovieCard({ movie }: { movie: MovieSummary }) {
    const queryClient = useQueryClient();

    function prefetchMovie(): void {
        void queryClient.prefetchQuery(movieQuery(movie.id));
    }

    return (
        <Link
            to={`/movies/${movie.id}`}
            className="block rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            onPointerEnter={prefetchMovie}
            onFocus={prefetchMovie}
        >
            <Card className="gap-0 overflow-hidden py-0 transition-colors hover:bg-muted">
                {/* Le titre est déjà écrit sous l'affiche, la répéter dans le nom du lien n'apporte rien. */}
                <MoviePoster movie={movie} alt="" className="text-sm" loading="lazy" />
                <CardContent className="space-y-1 p-3">
                    <p className="line-clamp-1 text-sm font-medium">{movie.title}</p>
                    <p className="flex justify-between text-xs text-muted-foreground">
                        <span>{releaseYear(movie.releaseDate)}</span>
                        {movie.averageRating !== null && <span>{formatRating(movie.averageRating)}</span>}
                    </p>
                </CardContent>
            </Card>
        </Link>
    );
}
