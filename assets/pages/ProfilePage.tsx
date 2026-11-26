import { useQuery } from "@tanstack/react-query";
import { Navigate, NavLink, Outlet, useOutletContext, useParams, useSearchParams } from "react-router";
import { PaginatedList } from "@/components/PaginatedList";
import { QueryError } from "@/components/QueryError";
import { NotFoundMessage } from "@/components/NotFoundMessage";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/auth";
import { CreateListButton } from "@/features/movie-lists/CreateListButton";
import { ListResults } from "@/features/movie-lists/ListResults";
import { MovieGrid } from "@/features/movies/MovieGrid";
import { DiaryEntries } from "@/features/users/DiaryEntries";
import { DiaryFilterControls } from "@/features/users/DiaryFilterControls";
import { FollowSheet } from "@/features/users/FollowSheet";
import { diaryFilterParams, readDiaryFilters } from "@/features/users/diary-search";
import { ProfileHeader } from "@/features/users/ProfileHeader";
import { diaryQuery, movieRelationshipsQuery, profileListsQuery, profileQuery, type MovieRelationshipList } from "@/features/users/queries";
import { ApiError } from "@/lib/api";
import { pageSearch, parsePage } from "@/lib/pagination";
import type { UserProfile } from "@/lib/types";

const TABS = [
    { path: "diary", label: "Journal" },
    { path: "watched", label: "Films vus" },
    { path: "likes", label: "Films aimés" },
    { path: "watchlist", label: "Watchlist" },
    { path: "lists", label: "Listes" },
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
    const { session } = useAuth();
    const { data: profile, error, isFetching, refetch } = useQuery(profileQuery(username, session));

    if (error instanceof ApiError && error.status === 404) {
        return <ProfileNotFound />;
    }
    const requestError = error === null ? null : (
        <QueryError message="Impossible de charger le profil." error={error} onRetry={() => void refetch()} retrying={isFetching} />
    );
    if (profile === undefined) {
        return requestError ?? (
            <div className="space-y-4" aria-busy="true">
                <p role="status" className="sr-only">
                    Chargement du profil…
                </p>
                <Skeleton className="h-64 w-full rounded-3xl" aria-hidden="true" />
            </div>
        );
    }

    return (
        <div className="space-y-12">
            {requestError}
            <ProfileHeader profile={profile} />
            <FollowSheet profile={profile} />
            <section className="space-y-8">
                <nav aria-label="Onglets du profil" className="flex gap-1 overflow-x-auto [scrollbar-width:none] rounded-full border border-white/5 bg-white/[0.03] p-1 sm:w-fit">
                    {TABS.map((tab) => (
                        <NavLink
                            key={tab.path}
                            to={tab.path}
                            className="rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none aria-[current=page]:bg-foreground aria-[current=page]:text-background"
                        >
                            {tab.label}
                        </NavLink>
                    ))}
                </nav>
                <Outlet context={profile} />
            </section>
        </div>
    );
}

export function DiaryTab() {
    const { username } = useOutletContext<UserProfile>();
    const [searchParams, setSearchParams] = useSearchParams();
    const page = parsePage(searchParams);
    const filters = readDiaryFilters(searchParams);
    const params = diaryFilterParams(filters);

    if (page === null || searchParams.get("year") !== (params.year ?? null) || searchParams.get("month") !== (params.month ?? null)) {
        return <Navigate to={pageSearch(page ?? 1, params)} replace />;
    }

    return (
        <div className="space-y-6">
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
                {(entries) => <DiaryEntries entries={entries} />}
            </PaginatedList>
        </div>
    );
}

export function MovieRelationshipsTab({ list }: { list: MovieRelationshipList }) {
    const { username } = useOutletContext<UserProfile>();
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

export function ProfileListsTab() {
    const { id, username } = useOutletContext<UserProfile>();
    const { session } = useAuth();
    const [searchParams] = useSearchParams();
    const page = parsePage(searchParams);
    const ownerSession = session?.user.id === id ? session : null;

    if (page === null) {
        return <Navigate to={pageSearch(1)} replace />;
    }

    return (
        <div className="space-y-4">
            {ownerSession !== null && <CreateListButton session={ownerSession} />}
            <PaginatedList
                key={`${username}:${session?.cacheId ?? "public"}`}
                query={profileListsQuery(username, page, session)}
                page={page}
                pathForPage={pageSearch}
                label="Pagination des listes du profil"
                emptyMessage={ownerSession === null ? "Ce membre n’a aucune liste publique." : "Vous n’avez encore aucune liste."}
                errorMessage={TAB_ERROR_MESSAGE}
            >
                {(lists) => <ListResults lists={lists} />}
            </PaginatedList>
        </div>
    );
}

function ProfileNotFound() {
    return <NotFoundMessage title="Membre introuvable" message="Ce membre n'existe pas ou a changé de pseudo." action={{ to: "/users", label: "Rechercher un membre" }} />;
}
