import { Settings } from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth";
import { reviewsPath } from "@/features/log-entries/reviews";
import { MovieCard } from "@/features/movies/MovieCard";
import { FollowButton } from "@/features/users/FollowButton";
import { UserAvatar } from "@/features/users/UserAvatar";
import { followPanelSearch } from "@/features/users/follow-panel";
import type { PublicProfile } from "@/lib/types";

const STAT_CLASS_NAME =
    "flex flex-col rounded-xl px-4 py-2 text-left transition-colors hover:bg-white/5 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";

export function ProfileHeader({ profile }: { profile: PublicProfile }) {
    const { session } = useAuth();
    const [searchParams] = useSearchParams();
    const banner = profile.favorites.find((movie) => movie.backdropUrl !== null)?.backdropUrl ?? null;

    return (
        <header className="space-y-10">
            <div className="relative isolate overflow-hidden rounded-3xl border border-white/5 bg-card/40">
                {banner !== null && <img src={banner} alt="" className="absolute inset-0 -z-10 size-full scale-110 object-cover opacity-35 blur-2xl" />}
                <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background/90 to-background/30" />
                <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-end sm:p-10">
                    <UserAvatar username={profile.username} className="size-24 text-3xl ring-4 ring-background sm:size-28" />
                    <div className="min-w-0 flex-1 space-y-3">
                        <h1 className="text-4xl font-extrabold wrap-break-word sm:text-5xl">{profile.username}</h1>
                        {profile.bio !== null && profile.bio !== "" && (
                            <p className="max-w-2xl leading-relaxed whitespace-pre-line text-foreground/75">{profile.bio}</p>
                        )}
                    </div>
                    {session?.user.id === profile.id ? (
                        <Button asChild variant="outline" className="h-10 rounded-full px-5">
                            <Link to="/settings/profile">
                                <Settings aria-hidden="true" />
                                Modifier mon profil
                            </Link>
                        </Button>
                    ) : (
                        <FollowButton profile={profile} session={session} />
                    )}
                </div>
                <ul className="flex flex-wrap gap-1 border-t border-white/5 px-3 py-3 sm:px-7">
                    <li>
                        <Link to="watched" className={STAT_CLASS_NAME}>
                            <Stat count={profile.watchedCount} label={profile.watchedCount > 1 ? "films vus" : "film vu"} />
                        </Link>
                    </li>
                    <li>
                        <Link to={followPanelSearch(searchParams, "followers")} className={STAT_CLASS_NAME}>
                            <Stat count={profile.followersCount} label={profile.followersCount > 1 ? "abonnés" : "abonné"} />
                        </Link>
                    </li>
                    <li>
                        <Link to={followPanelSearch(searchParams, "following")} className={STAT_CLASS_NAME}>
                            <Stat count={profile.followingCount} label={profile.followingCount > 1 ? "abonnements" : "abonnement"} />
                        </Link>
                    </li>
                    <li>
                        <Link to={reviewsPath({ user: profile.username })} className={STAT_CLASS_NAME}>
                            <span className="font-heading text-2xl font-extrabold">Critiques</span>
                            <span className="text-xs text-muted-foreground">voir la liste</span>
                        </Link>
                    </li>
                </ul>
            </div>
            <section aria-labelledby="favorites-title" className="space-y-5">
                <h2 id="favorites-title" className="text-2xl font-bold sm:text-3xl">
                    Films favoris
                </h2>
                {profile.favorites.length === 0 ? (
                    <p className="text-muted-foreground">Aucun film favori pour l'instant.</p>
                ) : (
                    <ul className="grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
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

function Stat({ count, label }: { count: number; label: string }) {
    return (
        <>
            <span className="font-heading text-2xl font-extrabold tabular-nums">{count.toLocaleString("fr-FR")}</span>
            <span className="text-xs text-muted-foreground">{label}</span>
        </>
    );
}
