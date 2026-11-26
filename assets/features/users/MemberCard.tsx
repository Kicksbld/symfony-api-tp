import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { useAuth } from "@/features/auth/auth";
import { MoviePoster } from "@/features/movies/MoviePoster";
import { FollowButton } from "@/features/users/FollowButton";
import { UserAvatar } from "@/features/users/UserAvatar";
import { profileQuery } from "@/features/users/queries";
import type { PublicProfile } from "@/lib/types";

const FAVORITE_SLOTS = 4;

export function MemberCard({ member }: { member: PublicProfile }) {
    const { session } = useAuth();
    // La liste renvoie le profil public complet : il amorce le cache du profil, que le bouton de suivi met à jour
    // dès le clic. Sans staleTime, chaque carte relirait son profil en s'affichant.
    const { data: profile } = useQuery({ ...profileQuery(member.username, session), initialData: member, staleTime: Infinity });
    const profilePath = `/users/${encodeURIComponent(profile.username)}`;
    const isMe = session?.user.id === profile.id;

    return (
        <article className="flex h-full flex-col gap-4 rounded-2xl border border-white/5 bg-card/60 p-5 transition-colors hover:border-white/15">
            <div className="flex items-start gap-4">
                <Link to={profilePath} tabIndex={-1} aria-hidden="true">
                    <UserAvatar username={profile.username} className="size-14 text-lg" />
                </Link>
                <div className="min-w-0 flex-1">
                    <h3 className="truncate text-lg font-bold">
                        <Link to={profilePath} className="underline-offset-4 hover:underline">
                            {profile.username}
                        </Link>
                    </h3>
                    <p className="text-xs text-muted-foreground">
                        {countLabel(profile.watchedCount, "film vu", "films vus")} · {countLabel(profile.followersCount, "abonné", "abonnés")}
                    </p>
                </div>
                {!isMe && <FollowButton profile={profile} session={session} className="h-9 px-4" />}
            </div>
            <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">{profile.bio !== null && profile.bio !== "" ? profile.bio : "Pas encore de bio."}</p>
            <ul aria-label={`Films favoris de ${profile.username}`} className="mt-auto grid grid-cols-4 gap-2">
                {profile.favorites.map((movie) => (
                    <li key={movie.id}>
                        <Link to={`/movies/${movie.id}`} className="block overflow-hidden rounded-md ring-1 ring-white/10 transition hover:ring-primary/70 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
                            <MoviePoster movie={movie} alt={movie.title} className="text-[0.55rem]" loading="lazy" />
                        </Link>
                    </li>
                ))}
                {Array.from({ length: FAVORITE_SLOTS - profile.favorites.length }, (_, index) => (
                    <li key={`empty-${index}`} aria-hidden="true" className="aspect-[2/3] rounded-md bg-white/[0.03] ring-1 ring-white/5" />
                ))}
            </ul>
        </article>
    );
}

function countLabel(count: number, singular: string, plural: string): string {
    return `${count.toLocaleString("fr-FR")} ${count > 1 ? plural : singular}`;
}
