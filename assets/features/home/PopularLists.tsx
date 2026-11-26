import { useQuery } from "@tanstack/react-query";
import { SectionHeader } from "@/components/SectionHeader";
import { useAuth } from "@/features/auth/auth";
import { RowSkeleton } from "@/features/home/RowSkeleton";
import { ListCard } from "@/features/movie-lists/ListCard";
import { publicListsQuery } from "@/features/movie-lists/queries";

const LIST_COUNT = 3;

export function PopularLists() {
    const { session } = useAuth();
    const { data, isPending } = useQuery(publicListsQuery({ q: "", user: "", movie: null, sort: "popular" }, 1, session));

    if (isPending) {
        return <RowSkeleton label="Chargement des listes…" count={3} className="h-56" />;
    }
    if (data === undefined || data.items.length === 0) {
        return null;
    }

    return (
        <section aria-labelledby="home-lists" className="space-y-5">
            <SectionHeader id="home-lists" eyebrow="Sélections des membres" title="Listes populaires" link={{ to: "/lists?sort=popular", label: "Toutes les listes" }} />
            <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data.items.slice(0, LIST_COUNT).map((list) => (
                    <li key={list.id}>
                        <ListCard list={list} />
                    </li>
                ))}
            </ul>
        </section>
    );
}
