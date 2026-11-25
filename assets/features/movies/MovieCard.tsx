import { Card, CardContent } from "@/components/ui/card";
import { MovieLink } from "@/features/movies/MovieLink";
import { MoviePoster } from "@/features/movies/MoviePoster";
import { formatRating, releaseYear } from "@/features/movies/format";
import type { MovieSummary } from "@/lib/types";

export function MovieCard({ movie }: { movie: MovieSummary }) {
    return (
        <MovieLink
            movieId={movie.id}
            className="block rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
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
        </MovieLink>
    );
}
