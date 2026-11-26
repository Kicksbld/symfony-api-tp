import { ListCard } from "@/features/movie-lists/ListCard";
import type { MovieList } from "@/features/movie-lists/types";
import { staggerStyle } from "@/lib/utils";

export function ListResults({ lists }: { lists: MovieList[] }) {
    return (
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {lists.map((list, index) => (
                <li key={list.id} className="animate-rise" style={staggerStyle(index)}>
                    <ListCard list={list} />
                </li>
            ))}
        </ul>
    );
}
