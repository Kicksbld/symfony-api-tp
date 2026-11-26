import { Heart, LockKeyhole } from "lucide-react";
import { Link } from "react-router";
import { MoviePoster } from "@/features/movies/MoviePoster";
import type { MovieList } from "@/features/movie-lists/types";
import { UserAvatar } from "@/features/users/UserAvatar";

// Les affiches se chevauchent comme un paquet de cartes, la première devant.
const POSTER_SLOTS = 4;

export function ListCard({ list }: { list: MovieList }) {
    const emptySlots = Math.max(0, POSTER_SLOTS - list.previewMovies.length);

    return (
        <article className="group relative flex h-full flex-col gap-4 rounded-2xl border border-white/5 bg-card/60 p-4 transition-colors hover:border-white/15 hover:bg-card">
            <div className="flex" aria-hidden="true">
                {list.previewMovies.map((movie, position) => (
                    <div
                        key={movie.id}
                        className="-mr-[12%] w-1/3 overflow-hidden rounded-md shadow-[4px_0_12px_rgb(0_0_0/0.6)] ring-1 ring-white/10 transition-transform duration-300 group-hover:-translate-y-1"
                        style={{ zIndex: POSTER_SLOTS - position, transitionDelay: `${position * 40}ms` }}
                    >
                        <MoviePoster movie={movie} alt="" className="text-[0.6rem]" loading="lazy" />
                    </div>
                ))}
                {Array.from({ length: emptySlots }, (_, position) => (
                    <div key={position} className="-mr-[12%] aspect-[2/3] w-1/3 rounded-md bg-muted ring-1 ring-white/5" style={{ zIndex: emptySlots - position }} />
                ))}
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
                <h3 className="line-clamp-2 text-lg font-bold wrap-break-word">
                    {/* Le lien couvre toute la carte grâce au pseudo-élément. */}
                    <Link to={`/lists/${list.id}`} className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:ring-3 focus-visible:after:ring-ring/50">
                        {list.name}
                    </Link>
                </h3>
                {list.description !== null && list.description !== "" && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">{list.description}</p>
                )}
            </div>
            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span className="flex min-w-0 items-center gap-2">
                    <UserAvatar username={list.user.username} className="size-6 text-[0.6rem]" />
                    <span className="truncate font-medium text-foreground/80">{list.user.username}</span>
                </span>
                <span className="flex shrink-0 items-center gap-3">
                    {!list.public && (
                        <span className="inline-flex items-center gap-1">
                            <LockKeyhole aria-hidden="true" className="size-3" />
                            Privée
                        </span>
                    )}
                    <span>
                        {list.itemCount} {list.itemCount > 1 ? "films" : "film"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <Heart aria-hidden="true" className="size-3" />
                        <span className="sr-only">Likes :</span>
                        {list.likeCount}
                    </span>
                </span>
            </div>
        </article>
    );
}
