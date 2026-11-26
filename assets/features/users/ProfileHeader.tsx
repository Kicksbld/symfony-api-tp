import { Link, NavLink } from "react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth";
import { reviewsPath } from "@/features/log-entries/reviews";
import { MovieCard } from "@/features/movies/MovieCard";
import { FollowButton } from "@/features/users/FollowButton";
import type { PublicProfile } from "@/lib/types";

const COUNT_LINK_CLASS = "rounded-sm underline underline-offset-4 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-[current=page]:font-semibold aria-[current=page]:text-foreground";

function formatCount(count: number, singular: string, pluralForm: string): string {
    return `${count.toLocaleString("fr-FR")} ${count > 1 ? pluralForm : singular}`;
}

export function ProfileHeader({ profile }: { profile: PublicProfile }) {
    const { session } = useAuth();

    return (
        <header className="space-y-6">
            <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-3xl font-semibold">{profile.username}</h1>
                    {session?.user.id === profile.id ? (
                        <Button asChild variant="outline">
                            <Link to="/settings/profile">Modifier mon profil</Link>
                        </Button>
                    ) : <FollowButton profile={profile} session={session} />}
                </div>
                {profile.bio !== null && profile.bio !== "" && <p className="max-w-2xl leading-relaxed whitespace-pre-line text-muted-foreground">{profile.bio}</p>}
                <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <li>{formatCount(profile.watchedCount, "film vu", "films vus")}</li>
                    <li>
                        <NavLink to="followers" className={COUNT_LINK_CLASS}>
                            {formatCount(profile.followersCount, "abonné", "abonnés")}
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="following" className={COUNT_LINK_CLASS}>
                            {formatCount(profile.followingCount, "abonnement", "abonnements")}
                        </NavLink>
                    </li>
                    <li><Link to={reviewsPath({ user: profile.username })} className={COUNT_LINK_CLASS}>Critiques</Link></li>
                </ul>
            </div>
            <section className="space-y-3">
                <h2 className="text-lg font-semibold">Films favoris</h2>
                {profile.favorites.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun film favori pour l'instant.</p>
                ) : (
                    <ul className="grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
                        {profile.favorites.map((movie) => (
                            <li key={movie.id}>
                                <MovieCard movie={movie} />
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </header>
    );
}
