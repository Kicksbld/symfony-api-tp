import { Link, Navigate, useLocation, useSearchParams } from "react-router";
import { PaginatedList } from "@/components/PaginatedList";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth";
import { feedQuery } from "@/features/feed/queries";
import { LogEntryCard } from "@/features/log-entries/LogEntryCard";
import { LogEntryLink } from "@/features/log-entries/LogEntryInteractions";
import { pageSearch, parsePage } from "@/lib/pagination";
import { authPath, returnPathFor } from "@/lib/redirect";

export function FeedPage() {
    const { session } = useAuth();
    const location = useLocation();
    const [params] = useSearchParams();
    const page = parsePage(params);

    if (session === null) {
        return <Navigate to={authPath("/login", returnPathFor(location))} replace />;
    }
    if (page === null) {
        return <Navigate to={pageSearch(1)} replace />;
    }

    return (
        <section className="max-w-3xl space-y-6">
            <h1 className="text-3xl font-semibold">Activité des membres suivis</h1>
            <PaginatedList
                key={session.cacheId}
                query={feedQuery(session, page)}
                page={page}
                pathForPage={pageSearch}
                label="Pagination de l’activité"
                emptyMessage="Aucune activité des membres que vous suivez pour le moment."
                emptyAction={
                    <Button asChild variant="outline" size="sm">
                        <Link to="/users">Rechercher des membres</Link>
                    </Button>
                }
                errorMessage="Impossible de charger l’activité."
            >
                {(entries) => (
                    <ul className="space-y-4">
                        {entries.map((entry) => (
                            <li key={entry.id}>
                                <LogEntryCard entry={entry} heading="h2">
                                    <LogEntryLink entry={entry} showCount />
                                </LogEntryCard>
                            </li>
                        ))}
                    </ul>
                )}
            </PaginatedList>
        </section>
    );
}
