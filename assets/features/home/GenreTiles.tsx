import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { SectionHeader } from "@/components/SectionHeader";
import { catalogPathWith } from "@/features/movies/catalog-search";
import { genresQuery } from "@/features/movies/queries";

// Chaque tuile reprend une couleur du thème à tour de rôle.
const TILE_ACCENTS = ["from-chart-1/25", "from-chart-2/25", "from-chart-3/25", "from-chart-4/25", "from-chart-5/25"];

export function GenreTiles() {
    const { data: genres } = useQuery(genresQuery());

    if (genres === undefined || genres.length === 0) {
        return null;
    }

    return (
        <section aria-labelledby="home-genres" className="space-y-5">
            <SectionHeader
                id="home-genres"
                eyebrow="Par genre"
                title={
                    <>
                        Envie de <em className="text-primary">quoi</em> ce soir ?
                    </>
                }
            />
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {genres.map((genre, index) => (
                    <li key={genre.id}>
                        <Link
                            to={catalogPathWith({ genre: genre.id })}
                            className={`flex h-24 items-end rounded-2xl border border-white/5 bg-gradient-to-br ${TILE_ACCENTS[index % TILE_ACCENTS.length]} to-card/60 p-4 font-heading text-lg font-bold tracking-tight transition hover:-translate-y-0.5 hover:border-white/20 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none`}
                        >
                            {genre.name}
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
}
