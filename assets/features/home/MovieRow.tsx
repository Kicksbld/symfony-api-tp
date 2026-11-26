import { useQuery } from "@tanstack/react-query";
import { ContentRow } from "@/components/ContentRow";
import { QueryError } from "@/components/QueryError";
import { RowSkeleton } from "@/features/home/RowSkeleton";
import { MovieCard } from "@/features/movies/MovieCard";
import { DEFAULT_CATALOG_SEARCH, catalogPathWith, type MovieSort } from "@/features/movies/catalog-search";
import { moviesQuery } from "@/features/movies/queries";

type MovieRowProps = {
    id: string;
    eyebrow: string;
    title: string;
    sort: MovieSort;
    // Classement affiché en gros chiffres devant chaque affiche, pour les tops.
    ranked?: boolean;
};

const RANKED_COUNT = 10;

export function MovieRow({ id, eyebrow, title, sort, ranked = false }: MovieRowProps) {
    const { data, error, isFetching, refetch } = useQuery(moviesQuery({ ...DEFAULT_CATALOG_SEARCH, sort }, true));

    if (error !== null) {
        return <QueryError message={`Impossible de charger « ${title} ».`} error={error} onRetry={() => void refetch()} retrying={isFetching} />;
    }
    if (data === undefined) {
        return <RowSkeleton label={`Chargement de « ${title} »…`} />;
    }

    const movies = ranked ? data.movies.items.slice(0, RANKED_COUNT) : data.movies.items;

    return (
        <ContentRow
            id={id}
            eyebrow={eyebrow}
            title={title}
            link={{ to: catalogPathWith({ sort }), label: "Tout voir" }}
            items={movies}
            itemKey={(movie) => movie.id}
            itemClassName={ranked ? "basis-[62%] sm:basis-[38%] lg:basis-[24%]" : "basis-[42%] sm:basis-[26%] lg:basis-[16.66%]"}
            renderItem={(movie) =>
                ranked ? (
                    <div className="flex items-end gap-1">
                        <span aria-hidden="true" className="font-heading text-[5.5rem] leading-[0.8] font-extrabold tracking-tighter text-transparent [-webkit-text-stroke:2px_var(--color-primary)]">
                            {movies.indexOf(movie) + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                            <MovieCard movie={movie} />
                        </div>
                    </div>
                ) : (
                    <MovieCard movie={movie} />
                )
            }
        />
    );
}
