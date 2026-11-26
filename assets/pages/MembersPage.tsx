import { Navigate, useNavigate, useSearchParams } from "react-router";
import { PageHeader } from "@/components/PageHeader";
import { PaginatedList } from "@/components/PaginatedList";
import { SearchField } from "@/components/SearchField";
import { useAuth } from "@/features/auth/auth";
import { MemberCard } from "@/features/users/MemberCard";
import { MAX_USERNAME_LENGTH, membersQuery } from "@/features/users/queries";
import { pageSearch, parsePage } from "@/lib/pagination";
import { staggerStyle } from "@/lib/utils";

export function MembersPage() {
    const { session } = useAuth();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const rawUsername = searchParams.get("q");
    const username = rawUsername?.trim().slice(0, MAX_USERNAME_LENGTH) ?? "";
    const params: Record<string, string> = username === "" ? {} : { q: username };
    const page = parsePage(searchParams);

    if (page === null || rawUsername !== (username || null)) {
        return <Navigate to={pageSearch(page ?? 1, params)} replace />;
    }

    function search(nextUsername: string): void {
        void navigate(pageSearch(1, nextUsername === "" ? {} : { q: nextUsername }), { replace: true });
    }

    return (
        <section className="space-y-8">
            <PageHeader title="Membres" />
            <SearchField
                value={username}
                onSearch={search}
                label="Rechercher un membre par son pseudo"
                placeholder="Rechercher un membre…"
                maxLength={MAX_USERNAME_LENGTH}
                className="max-w-xl"
            />
            <PaginatedList
                key={session?.cacheId ?? "public"}
                query={membersQuery(username, page, session)}
                page={page}
                pathForPage={(nextPage) => pageSearch(nextPage, params)}
                label="Pagination des membres"
                emptyMessage={username === "" ? "Aucun membre pour l’instant." : `Aucun membre ne correspond à « ${username} ».`}
                errorMessage="Impossible de charger les membres."
            >
                {(members) => (
                    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {members.map((member, index) => (
                            <li key={member.id} className="animate-rise" style={staggerStyle(index)}>
                                <MemberCard member={member} />
                            </li>
                        ))}
                    </ul>
                )}
            </PaginatedList>
        </section>
    );
}
