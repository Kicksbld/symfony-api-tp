import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { SectionHeader } from "@/components/SectionHeader";
import { catalogPathWith } from "@/features/movies/catalog-search";
import { genreIcon } from "@/features/movies/genre-icons";
import { genresQuery } from "@/features/movies/queries";

// Chaque tuile reprend une couleur du thème à tour de rôle, pour l'icône et le halo.
const TILE_ACCENTS = [
    "text-chart-1 group-hover:bg-chart-1/10",
    "text-chart-2 group-hover:bg-chart-2/10",
    "text-chart-3 group-hover:bg-chart-3/10",
    "text-chart-4 group-hover:bg-chart-4/10",
    "text-chart-5 group-hover:bg-chart-5/10",
];

export function GenreTiles() {
    const { data: genres } = useQuery(genresQuery());

    if (genres === undefined || genres.length === 0) {
        return null;
    }

    return (
        <section aria-labelledby="home-genres" className="space-y-5">
            <SectionHeader id="home-genres" title="Genres" />
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {genres.map((genre, index) => {
                    const Icon = genreIcon(genre.name);

                    return (
                        <li key={genre.id}>
                            <Link
                                to={catalogPathWith({ genre: genre.id })}
                                className="group relative flex h-28 flex-col justify-between overflow-hidden rounded-2xl border border-white/5 bg-card/60 p-4 transition-colors duration-200 hover:border-white/15 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                            >
                                <span className={`flex size-10 items-center justify-center rounded-xl bg-white/5 transition-colors duration-200 ${TILE_ACCENTS[index % TILE_ACCENTS.length]}`}>
                                    <Icon aria-hidden="true" className="size-5" />
                                </span>
                                <span className="font-heading text-lg font-bold tracking-tight">{genre.name}</span>
                                {/* Grande icône en filigrane pour que la tuile ne paraisse pas vide. */}
                                <Icon aria-hidden="true" className="absolute -right-3 -bottom-3 size-20 text-white/[0.04] transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110" />
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
