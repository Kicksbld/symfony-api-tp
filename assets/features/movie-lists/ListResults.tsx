import { ListCard } from "@/features/movie-lists/ListCard";
import type { MovieList } from "@/features/movie-lists/types";

export function ListResults({ lists }: { lists: MovieList[] }) {
    return (
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {lists.map((list) => (
                <li key={list.id}>
                    <ListCard list={list} />
                </li>
            ))}
        </ul>
    );
}
