import { useQuery } from "@tanstack/react-query";
import { Link, Navigate, NavLink, Outlet, useOutletContext, useParams, useSearchParams } from "react-router";
import { PaginatedList } from "@/components/PaginatedList";
import { QueryError } from "@/components/QueryError";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DiaryEntry } from "@/features/log-entries/DiaryEntry";
import { MovieGrid } from "@/features/movies/MovieGrid";
import { DiaryFilterControls } from "@/features/users/DiaryFilterControls";
import { diaryFilterParams, readDiaryFilters } from "@/features/users/diary-search";
import { ProfileHeader } from "@/features/users/ProfileHeader";
import { diaryQuery, movieRelationshipsQuery, profileQuery, type MovieRelationshipList } from "@/features/users/queries";
import { ApiError } from "@/lib/api";
import { pageSearch, parsePage } from "@/lib/pagination";

const TABS = [
    { path: "diary", label: "Journal" },
    { path: "watched", label: "Films vus" },
    { path: "likes", label: "Films aimés" },
    { path: "watchlist", label: "Watchlist" },
] as const;

const TAB_ERROR_MESSAGE = "Impossible de charger cet onglet.";

const MOVIE_LIST_COPY = {
    watched: { label: "Pagination des films vus", emptyMessage: "Aucun film vu pour l'instant." },
    likes: { label: "Pagination des films aimés", emptyMessage: "Aucun film aimé pour l'instant." },
    watchlist: { label: "Pagination de la watchlist", emptyMessage: "La watchlist est vide." },
};

export function ProfileIndex() {
    const [searchParams] = useSearchParams();

    return <Navigate to={{ pathname: "diary", search: searchParams.toString() }} replace />;
}

export function ProfilePage() {
    const { username = "" } = useParams();
    const { data: profile, error, isFetching, refetch } = useQuery(profileQuery(username));

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
                <Outlet context={profile.username} />
            </section>
        </div>
    );
}

export function DiaryTab() {
    const username = useOutletContext<string>();
    const [searchParams, setSearchParams] = useSearchParams();
    const page = parsePage(searchParams);
    const filters = readDiaryFilters(searchParams);
    const params = diaryFilterParams(filters);

    if (page === null || searchParams.get("year") !== (params.year ?? null) || searchParams.get("month") !== (params.month ?? null)) {
        return <Navigate to={pageSearch(page ?? 1, params)} replace />;
    }

    return (
        <div className="space-y-5">
            <DiaryFilterControls filters={filters} onChange={(next) => setSearchParams(diaryFilterParams(next))} />
            <PaginatedList
                key={username}
                query={diaryQuery(username, page, filters)}
                page={page}
                pathForPage={(nextPage) => pageSearch(nextPage, params)}
                label="Pagination du journal"
                emptyMessage={filters.year === null ? "Aucun film dans le journal pour l'instant." : "Aucun visionnage pour cette période."}
                errorMessage={TAB_ERROR_MESSAGE}
            >
                {(entries) => (
                    <ul className="space-y-3">
                        {entries.map((entry) => (
                            <li key={entry.id}>
                                <DiaryEntry entry={entry} />
                            </li>
                        ))}
                    </ul>
                )}
            </PaginatedList>
        </div>
    );
}

export function MovieRelationshipsTab({ list }: { list: MovieRelationshipList }) {
    const username = useOutletContext<string>();
    const [searchParams] = useSearchParams();
    const page = parsePage(searchParams);

    if (page === null) {
        return <Navigate to={pageSearch(1)} replace />;
    }

    return (
        <PaginatedList
            key={`${username}:${list}`}
            query={movieRelationshipsQuery(username, list, page)}
            page={page}
            pathForPage={pageSearch}
            errorMessage={TAB_ERROR_MESSAGE}
            {...MOVIE_LIST_COPY[list]}
        >
            {(items) => <MovieGrid movies={items.map((item) => item.movie)} />}
        </PaginatedList>
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
