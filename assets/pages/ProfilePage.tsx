import { useQuery } from "@tanstack/react-query";
import { Link, NavLink, Outlet, useParams } from "react-router";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DiaryEntry } from "@/features/log-entries/DiaryEntry";
import { MovieCard } from "@/features/movies/MovieCard";
import { ProfileHeader } from "@/features/users/ProfileHeader";
import { ProfileTabContent } from "@/features/users/ProfileTabContent";
import { diaryQuery, movieRelationshipsQuery, profileQuery } from "@/features/users/queries";
import { ApiError } from "@/lib/api";
import type { MovieRelationshipItem } from "@/lib/types";

const TABS = [
    { path: "diary", label: "Journal" },
    { path: "watched", label: "Films vus" },
    { path: "watchlist", label: "Watchlist" },
] as const;

const MOVIE_GRID_CLASS_NAME = "grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5";

export function ProfilePage() {
    const { username = "" } = useParams();
    const { data: profile, error, isFetching, refetch } = useQuery(profileQuery(username));

    if (error instanceof ApiError && error.status === 404) {
        return <ProfileNotFound />;
    }

    return (
        <div className="space-y-8">
            {error !== null ? (
                <Alert variant="destructive">
                    <AlertDescription>Impossible de charger le profil. {error.message}</AlertDescription>
                    <Button variant="outline" size="sm" className="mt-2 justify-self-start" onClick={() => void refetch()} disabled={isFetching}>
                        Réessayer
                    </Button>
                </Alert>
            ) : profile === undefined ? (
                <div className="space-y-4" aria-busy="true">
                    <p role="status" className="sr-only">
                        Chargement du profil…
                    </p>
                    <Skeleton className="h-9 w-48" aria-hidden="true" />
                    <Skeleton className="h-5 w-72" aria-hidden="true" />
                </div>
            ) : (
                <ProfileHeader profile={profile} />
            )}
            <section className="space-y-6">
                <nav aria-label="Onglets du profil" className="flex gap-1 overflow-x-auto border-b">
                    {TABS.map((tab) => (
                        <NavLink
                            key={tab.path}
                            to={tab.path}
                            className="-mb-px border-b-2 border-transparent px-4 py-3 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:border-primary aria-[current=page]:text-foreground"
                        >
                            {tab.label}
                        </NavLink>
                    ))}
                </nav>
                <Outlet />
            </section>
        </div>
    );
}

export function DiaryTab() {
    const { username = "" } = useParams();

    return (
        <ProfileTabContent query={(page) => diaryQuery(username, page)} label="Pagination du journal" emptyMessage="Aucun film dans le journal pour l'instant.">
            {(entries) => (
                <ul className="space-y-3">
                    {entries.map((entry) => (
                        <li key={entry.id}>
                            <DiaryEntry entry={entry} />
                        </li>
                    ))}
                </ul>
            )}
        </ProfileTabContent>
    );
}

export function WatchedTab() {
    const { username = "" } = useParams();

    return (
        <ProfileTabContent
            query={(page) => movieRelationshipsQuery(username, "watched", page)}
            label="Pagination des films vus"
            emptyMessage="Aucun film vu pour l'instant."
        >
            {(items) => <MovieGrid items={items} />}
        </ProfileTabContent>
    );
}

export function WatchlistTab() {
    const { username = "" } = useParams();

    return (
        <ProfileTabContent
            query={(page) => movieRelationshipsQuery(username, "watchlist", page)}
            label="Pagination de la watchlist"
            emptyMessage="La watchlist est vide."
        >
            {(items) => <MovieGrid items={items} />}
        </ProfileTabContent>
    );
}

function MovieGrid({ items }: { items: MovieRelationshipItem[] }) {
    return (
        <ul className={MOVIE_GRID_CLASS_NAME}>
            {items.map((item) => (
                <li key={item.movie.id}>
                    <MovieCard movie={item.movie} />
                </li>
            ))}
        </ul>
    );
}

function ProfileNotFound() {
    return (
        <section className="space-y-4 text-center">
            <h1 className="text-2xl font-semibold">Membre introuvable</h1>
            <p className="text-muted-foreground">Ce membre n'existe pas ou a changé de pseudo.</p>
            <Button asChild variant="outline">
                <Link to="/">Retour au catalogue</Link>
            </Button>
        </section>
    );
}
