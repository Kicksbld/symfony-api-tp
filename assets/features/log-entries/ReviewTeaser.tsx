import { Heart, MessageCircle } from "lucide-react";
import { Link } from "react-router";
import { MoviePoster } from "@/features/movies/MoviePoster";
import { StarRating } from "@/features/movies/StarRating";
import { releaseYear } from "@/features/movies/format";
import { UserAvatar } from "@/features/users/UserAvatar";
import type { LogEntry } from "@/lib/types";

// Aperçu d'une critique dans une grille : toute la carte mène au détail, où se trouvent les interactions.
export function ReviewTeaser({ entry }: { entry: LogEntry }) {
    return (
        <article className="group relative flex h-full gap-4 overflow-hidden rounded-2xl border border-white/5 bg-card/60 p-4 transition-colors hover:border-white/15 hover:bg-card">
            <div className="w-20 shrink-0 overflow-hidden rounded-md ring-1 ring-white/10">
                <MoviePoster movie={entry.movie} alt="" className="text-[0.6rem]" loading="lazy" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <UserAvatar username={entry.user.username} className="size-6 text-[0.6rem]" />
                    <span className="truncate font-medium text-foreground/80">{entry.user.username}</span>
                    {entry.rating !== null && <StarRating rating={entry.rating} className="ml-auto [&_svg]:size-3" />}
                </div>
                <h3 className="font-bold">
                    <Link
                        to={`/log-entries/${entry.id}`}
                        className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
                    >
                        {entry.movie.title}
                    </Link>
                    <span className="ml-2 text-sm font-normal text-muted-foreground">{releaseYear(entry.movie.releaseDate)}</span>
                </h3>
                {entry.containsSpoilers ? (
                    <p className="text-sm text-muted-foreground italic">Cette critique révèle des éléments de l'intrigue.</p>
                ) : (
                    <p className="line-clamp-3 text-sm leading-relaxed text-foreground/75">{entry.review}</p>
                )}
                <p className="mt-auto flex items-center gap-4 pt-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                        <Heart aria-hidden="true" className="size-3" />
                        {entry.likeCount} <span className="sr-only">{entry.likeCount > 1 ? "likes" : "like"}</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <MessageCircle aria-hidden="true" className="size-3" />
                        {entry.commentCount} <span className="sr-only">{entry.commentCount > 1 ? "commentaires" : "commentaire"}</span>
                    </span>
                </p>
            </div>
        </article>
    );
}
