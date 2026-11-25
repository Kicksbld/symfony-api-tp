import { MovieCard } from "@/features/movies/MovieCard";
import type { MovieSummary } from "@/lib/types";

export function MovieGrid({ movies }: { movies: MovieSummary[] }) {
    return (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {movies.map((movie) => (
                <li key={movie.id}>
                    <MovieCard movie={movie} />
                </li>
            ))}
        </ul>
    );
}
