import { MovieLink } from "@/features/movies/MovieLink";
import { MoviePoster } from "@/features/movies/MoviePoster";
import { StarRating } from "@/features/movies/StarRating";
import { releaseYear } from "@/features/movies/format";
import type { MovieSummary } from "@/lib/types";

export function MovieCard({ movie }: { movie: MovieSummary }) {
    return (
        <MovieLink movieId={movie.id} className="group block rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
            <div className="overflow-hidden rounded-lg bg-muted ring-1 ring-white/10 transition duration-300 group-hover:-translate-y-1 group-hover:ring-primary/70 group-hover:shadow-xl">
                {/* Le titre est déjà écrit sous l'affiche, la répéter dans le nom du lien n'apporte rien. */}
                <MoviePoster movie={movie} alt="" className="text-sm transition duration-500 group-hover:scale-105" loading="lazy" />
            </div>
            <div className="mt-2.5 space-y-1">
                <p className="line-clamp-1 text-sm font-semibold transition-colors group-hover:text-primary">{movie.title}</p>
                <p className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>{releaseYear(movie.releaseDate)}</span>
                    {movie.averageRating !== null && <StarRating rating={movie.averageRating} className="[&_svg]:size-3" />}
                </p>
            </div>
        </MovieLink>
    );
}
