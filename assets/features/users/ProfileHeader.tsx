import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth";
import { MovieCard } from "@/features/movies/MovieCard";
import type { UserProfile } from "@/lib/types";

function formatCount(count: number, singular: string, pluralForm: string): string {
    return `${count.toLocaleString("fr-FR")} ${count > 1 ? pluralForm : singular}`;
}

export function ProfileHeader({ profile }: { profile: UserProfile }) {
    const { session } = useAuth();
    const counts = [
        formatCount(profile.watchedCount, "film vu", "films vus"),
        formatCount(profile.followersCount, "abonné", "abonnés"),
        formatCount(profile.followingCount, "abonnement", "abonnements"),
    ];

    return (
        <header className="space-y-6">
            <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-3xl font-semibold">{profile.username}</h1>
                    {session?.user.id === profile.id && (
                        <Button asChild variant="outline">
                            <Link to="/settings/profile">Modifier mon profil</Link>
                        </Button>
                    )}
                </div>
                {profile.bio !== null && profile.bio !== "" && <p className="max-w-2xl leading-relaxed whitespace-pre-line text-muted-foreground">{profile.bio}</p>}
                <p className="text-sm text-muted-foreground">{counts.join(" · ")}</p>
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
