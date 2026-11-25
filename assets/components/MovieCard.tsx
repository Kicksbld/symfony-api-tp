import { Card, CardContent } from "@/components/ui/card";
import type { MovieSummary } from "@/lib/types";

export function MovieCard({ movie }: { movie: MovieSummary }) {
    return (
        <Card className="gap-0 overflow-hidden py-0">
            {movie.posterUrl === null ? (
                <div className="flex aspect-[2/3] items-center justify-center bg-muted p-2 text-center text-sm text-muted-foreground">
                    {movie.title}
                </div>
            ) : (
                <img src={movie.posterUrl} alt={movie.title} className="aspect-[2/3] w-full object-cover" loading="lazy" />
            )}
            <CardContent className="space-y-1 p-3">
                <p className="line-clamp-1 text-sm font-medium">{movie.title}</p>
                <p className="flex justify-between text-xs text-muted-foreground">
                    <span>{movie.releaseDate?.slice(0, 4)}</span>
                    {movie.averageRating !== null && <span>{movie.averageRating.toFixed(1)} / 5</span>}
                </p>
            </CardContent>
        </Card>
    );
}
