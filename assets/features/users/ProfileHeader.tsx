import { MovieCard } from "@/features/movies/MovieCard";
import type { UserProfile } from "@/lib/types";

function plural(count: number, singular: string, pluralForm: string): string {
    return `${count.toLocaleString("fr-FR")} ${count > 1 ? pluralForm : singular}`;
}

export function ProfileHeader({ profile }: { profile: UserProfile }) {
    const counts = [
        plural(profile.watchedCount, "film vu", "films vus"),
        plural(profile.followersCount, "abonné", "abonnés"),
        plural(profile.followingCount, "abonnement", "abonnements"),
    ];

    return (
        <header className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-semibold">{profile.username}</h1>
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
