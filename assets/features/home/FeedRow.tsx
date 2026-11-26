import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { ContentRow } from "@/components/ContentRow";
import { feedQuery } from "@/features/feed/queries";
import { RowSkeleton } from "@/features/home/RowSkeleton";
import { MoviePoster } from "@/features/movies/MoviePoster";
import { StarRating } from "@/features/movies/StarRating";
import { UserAvatar } from "@/features/users/UserAvatar";
import type { Session } from "@/lib/session";

// Rangée personnelle de l'accueil. Sans activité ou en cas d'erreur, elle s'efface : le flux complet reste accessible.
export function FeedRow({ session }: { session: Session }) {
    const { data, isPending } = useQuery(feedQuery(session, 1));

    if (isPending) {
        return <RowSkeleton label="Chargement de l'activité de vos abonnements…" />;
    }
    if (data === undefined || data.items.length === 0) {
        return null;
    }

    return (
        <ContentRow
            id="home-feed"
            title="Vu par vos abonnements"
            link={{ to: "/feed", label: "Toute l'activité" }}
            items={data.items}
            itemKey={(entry) => entry.id}
            itemClassName="basis-[42%] sm:basis-[26%] lg:basis-[16.66%]"
            renderItem={(entry) => (
                <Link to={`/log-entries/${entry.id}`} className="group block rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
                    <div className="overflow-hidden rounded-lg ring-1 ring-white/10 transition group-hover:ring-primary/70">
                        <MoviePoster movie={entry.movie} alt="" className="text-sm transition duration-500 group-hover:scale-105" loading="lazy" />
                    </div>
                    <p className="mt-2.5 line-clamp-1 text-sm font-semibold">{entry.movie.title}</p>
                    <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <UserAvatar username={entry.user.username} className="size-5 text-[0.55rem]" />
                        <span className="truncate">{entry.user.username}</span>
                        {entry.rating !== null && <StarRating rating={entry.rating} className="ml-auto [&_svg]:size-3" />}
                    </p>
                </Link>
            )}
        />
    );
}
