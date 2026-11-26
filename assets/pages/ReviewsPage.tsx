import { Link, Navigate, useSearchParams } from "react-router";
import { PageHeader } from "@/components/PageHeader";
import { PaginatedList } from "@/components/PaginatedList";
import { useAuth } from "@/features/auth/auth";
import { LogEntryCard } from "@/features/log-entries/LogEntryCard";
import { LogEntryLikeButton, LogEntryLink } from "@/features/log-entries/LogEntryInteractions";
import { reviewsPath, reviewsQuery } from "@/features/log-entries/reviews";
import { USERNAME_PATTERN } from "@/features/users/username";
import { parsePositiveInteger } from "@/lib/numbers";
import { pageSearch, parsePage } from "@/lib/pagination";
import { CHIP_LINK_CLASS_NAME } from "@/lib/utils";

export function ReviewsPage() {
    const { session } = useAuth();
    const [params] = useSearchParams();
    const page = parsePage(params);
    const movie = params.get("movie");
    const user = params.get("user");
    const filters = {
        ...(movie !== null && parsePositiveInteger(movie) !== null ? { movie } : {}),
        ...(user !== null && USERNAME_PATTERN.test(user) ? { user } : {}),
    };

    if (page === null || movie !== (filters.movie ?? null) || user !== (filters.user ?? null)) {
        return <Navigate to={pageSearch(page ?? 1, filters)} replace />;
    }

    return (
        <section className="mx-auto max-w-3xl space-y-8">
            <PageHeader title={user === null ? "Critiques" : `Critiques de ${user}`} />
            {(movie !== null || user !== null) && (
                <nav aria-label="Autres critiques" className="flex flex-wrap gap-2">
                    <Link to={reviewsPath()} className={CHIP_LINK_CLASS_NAME}>Toutes les critiques</Link>
                    {movie !== null && <Link to={`/movies/${movie}`} className={CHIP_LINK_CLASS_NAME}>Retour au film</Link>}
                    {user !== null && <Link to={`/users/${user}`} className={CHIP_LINK_CLASS_NAME}>Voir le profil</Link>}
                </nav>
            )}
            <PaginatedList
                key={session?.cacheId ?? "public"}
                query={reviewsQuery(filters, page, session)}
                page={page}
                pathForPage={(next) => pageSearch(next, filters)}
                label="Pagination des critiques"
                emptyMessage="Aucune critique pour le moment."
                errorMessage="Impossible de charger les critiques."
            >
                {(entries) => (
                    <ul className="space-y-4">
                        {entries.map((entry) => (
                            <li key={entry.id}>
                                <LogEntryCard entry={entry} heading="h2">
                                    <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
                                        <LogEntryLikeButton entry={entry} />
                                        <LogEntryLink entry={entry} showCount />
                                    </div>
                                </LogEntryCard>
                            </li>
                        ))}
                    </ul>
                )}
            </PaginatedList>
        </section>
    );
}
