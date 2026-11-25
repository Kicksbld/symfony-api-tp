import { cn } from "cn";
import type { MovieSummary } from "@/lib/types";

type MoviePosterProps = {
    movie: Pick<MovieSummary, "title" | "posterUrl">;
    alt: string;
    className?: string;
    loading?: "lazy" | "eager";
};

// Sans affiche chez TMDB, on garde le même format avec le titre pour ne pas décaler la grille.
export function MoviePoster({ movie, alt, className, loading }: MoviePosterProps) {
    if (movie.posterUrl === null) {
        return (
            <div className={cn("flex aspect-[2/3] w-full items-center justify-center bg-muted p-2 text-center text-muted-foreground", className)}>
                {movie.title}
            </div>
        );
    }

    return <img src={movie.posterUrl} alt={alt} className={cn("aspect-[2/3] w-full object-cover", className)} loading={loading} />;
}
