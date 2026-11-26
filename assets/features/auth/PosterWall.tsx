import { useQuery } from "@tanstack/react-query";
import { cn } from "cn";
import { DEFAULT_CATALOG_SEARCH } from "@/features/movies/catalog-search";
import { moviesQuery } from "@/features/movies/queries";

const COLUMN_COUNT = 4;

// Décor des écrans de connexion : les affiches populaires défilent lentement, une colonne sur deux en sens inverse.
export function PosterWall() {
    const { data } = useQuery(moviesQuery(DEFAULT_CATALOG_SEARCH, true));
    const posters = (data?.movies.items ?? []).flatMap((movie) => (movie.posterUrl === null ? [] : [movie.posterUrl]));
    const columns = Array.from({ length: COLUMN_COUNT }, (_, column) => posters.filter((_, index) => index % COLUMN_COUNT === column));

    return (
        <div aria-hidden="true" className="absolute inset-0 flex -rotate-6 scale-125 gap-4 opacity-60">
            {columns.map((column, index) => (
                <div key={index} className={cn("flex flex-1 flex-col gap-4 animate-poster-scroll", index % 2 === 1 && "[animation-direction:reverse]")}>
                    {/* La colonne est doublée pour que l'animation boucle sans trou. */}
                    {[...column, ...column].map((url, position) => (
                        <img key={position} src={url} alt="" className="aspect-[2/3] w-full rounded-xl object-cover" />
                    ))}
                </div>
            ))}
        </div>
    );
}
