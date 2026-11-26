import { MovieCard } from "@/features/movies/MovieCard";
import type { MovieSummary } from "@/lib/types";
import { staggerStyle } from "@/lib/utils";

export function MovieGrid({ movies }: { movies: MovieSummary[] }) {
    return (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 lg:grid-cols-6">
            {movies.map((movie, index) => (
                <li key={movie.id} className="animate-rise" style={staggerStyle(index)}>
                    <MovieCard movie={movie} />
                </li>
            ))}
        </ul>
    );
}
