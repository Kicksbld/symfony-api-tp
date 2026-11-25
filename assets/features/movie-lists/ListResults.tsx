import { Heart, LockKeyhole } from "lucide-react";
import { Link } from "react-router";
import type { MovieList } from "@/features/movie-lists/types";
import { TEXT_LINK_CLASS_NAME } from "@/lib/utils";

export function ListResults({ lists, showAuthor = false }: { lists: MovieList[]; showAuthor?: boolean }) {
    return (
        <ul className="divide-y border-y">
            {lists.map((list) => (
                <li key={list.id} className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2 py-4">
                    <div className="min-w-0 flex-1 basis-64 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <h2 className="min-w-0 font-semibold wrap-break-word">
                                <Link to={`/lists/${list.id}`} className={TEXT_LINK_CLASS_NAME}>{list.name}</Link>
                            </h2>
                            {list.ranked && <span className="text-xs text-muted-foreground">Classée</span>}
                            {!list.public && (
                                <span className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs">
                                    <LockKeyhole className="size-3" aria-hidden="true" />
                                    Privée
                                </span>
                            )}
                        </div>
                        {list.description && <p className="line-clamp-2 max-w-prose text-sm wrap-break-word text-muted-foreground">{list.description}</p>}
                        {showAuthor && (
                            <p className="text-sm text-muted-foreground">
                                Par <Link to={`/users/${list.user.username}/lists`} className={TEXT_LINK_CLASS_NAME}>{list.user.username}</Link>
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{list.itemCount} {list.itemCount === 1 ? "film" : "films"}</span>
                        <span className="inline-flex items-center gap-1">
                            <Heart className="size-4" aria-hidden="true" />
                            {list.likeCount}<span className="sr-only"> {list.likeCount === 1 ? "mention J’aime" : "mentions J’aime"}</span>
                        </span>
                    </div>
                </li>
            ))}
        </ul>
    );
}
