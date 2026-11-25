import { useQuery } from "@tanstack/react-query";
import { Link, Navigate, NavLink, Outlet, useOutletContext, useParams, useSearchParams } from "react-router";
import { QueryError } from "@/components/QueryError";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DiaryEntry } from "@/features/log-entries/DiaryEntry";
import { MovieCard } from "@/features/movies/MovieCard";
import { ProfileHeader } from "@/features/users/ProfileHeader";
import { ProfileTabContent } from "@/features/users/ProfileTabContent";
import { diaryQuery, movieRelationshipsQuery, profileQuery } from "@/features/users/queries";
import { ApiError } from "@/lib/api";
import { parsePositiveInteger } from "@/lib/numbers";
import type { MovieRelationshipItem } from "@/lib/types";

const TABS = [
    { path: "diary", label: "Journal" },
    { path: "watched", label: "Films vus" },
    { path: "watchlist", label: "Watchlist" },
] as const;

type ProfileTabContext = {
    username: string;
    page: number;
};

export function ProfilePage() {
    const { username = "" } = useParams();
    const [searchParams] = useSearchParams();
    const pageParam = searchParams.get("page");
    const page = pageParam === null ? 1 : parsePositiveInteger(pageParam);
    const { data: profile, error, isFetching, refetch } = useQuery(profileQuery(username));

    if (page === null) {
        return <Navigate to={{ search: "" }} replace />;
    }
    if (error instanceof ApiError && error.status === 404) {
        return <ProfileNotFound />;
    }
    if (error !== null) {
        return <QueryError message="Impossible de charger le profil." error={error} onRetry={() => void refetch()} retrying={isFetching} />;
    }
    if (profile === undefined) {
        return (
            <div className="space-y-4" aria-busy="true">
                <p role="status" className="sr-only">
                    Chargement du profil…
                </p>
                <Skeleton className="h-9 w-48" aria-hidden="true" />
                <Skeleton className="h-5 w-72" aria-hidden="true" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <ProfileHeader profile={profile} />
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
                <Outlet context={{ username, page } satisfies ProfileTabContext} />
            </section>
        </div>
    );
}

export function DiaryTab() {
    const { username, page } = useOutletContext<ProfileTabContext>();

    return (
        <ProfileTabContent query={diaryQuery(username, page)} page={page} label="Pagination du journal" emptyMessage="Aucun film dans le journal pour l'instant.">
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
    const { username, page } = useOutletContext<ProfileTabContext>();

    return (
        <ProfileTabContent
            query={movieRelationshipsQuery(username, "watched", page)}
            page={page}
            label="Pagination des films vus"
            emptyMessage="Aucun film vu pour l'instant."
        >
            {(items) => <MovieGrid items={items} />}
        </ProfileTabContent>
    );
}

export function WatchlistTab() {
    const { username, page } = useOutletContext<ProfileTabContext>();

    return (
        <ProfileTabContent
            query={movieRelationshipsQuery(username, "watchlist", page)}
            page={page}
            label="Pagination de la watchlist"
            emptyMessage="La watchlist est vide."
        >
            {(items) => <MovieGrid items={items} />}
        </ProfileTabContent>
    );
}

function MovieGrid({ items }: { items: MovieRelationshipItem[] }) {
    return (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
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
