import { Search } from "lucide-react";
import type { FormEvent } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router";
import { PaginatedList } from "@/components/PaginatedList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MemberResults } from "@/features/users/MemberResults";
import { MAX_USERNAME_LENGTH, membersQuery } from "@/features/users/queries";
import { pageSearch, parsePage } from "@/lib/pagination";

export function MembersPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const rawUsername = searchParams.get("q");
    const username = rawUsername?.trim().slice(0, MAX_USERNAME_LENGTH) ?? "";
    const params: Record<string, string> = username === "" ? {} : { q: username };
    const page = parsePage(searchParams);

    if (page === null || rawUsername !== (username || null)) {
        return <Navigate to={pageSearch(page ?? 1, params)} replace />;
    }

    function submitUsername(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        const value = new FormData(event.currentTarget).get("q");
        const nextUsername = typeof value === "string" ? value.trim() : "";
        void navigate(pageSearch(1, nextUsername === "" ? {} : { q: nextUsername }));
    }

    return (
        <section className="space-y-6">
            <h1 className="text-2xl font-semibold">Membres</h1>
            <form key={username} role="search" onSubmit={submitUsername} className="flex max-w-xl items-end gap-2">
                <div className="flex-1 space-y-1.5">
                    <Label htmlFor="member-username">Pseudo</Label>
                    <Input
                        id="member-username"
                        name="q"
                        type="search"
                        defaultValue={username}
                        maxLength={MAX_USERNAME_LENGTH}
                        placeholder="Rechercher un membre…"
                    />
                </div>
                <Button type="submit" variant="outline" size="icon" aria-label="Rechercher">
                    <Search aria-hidden="true" />
                </Button>
            </form>
            <PaginatedList
                query={membersQuery(username, page)}
                page={page}
                pathForPage={(nextPage) => pageSearch(nextPage, params)}
                label="Pagination des membres"
                emptyMessage={username === "" ? "Aucun membre pour l’instant." : `Aucun membre ne correspond à « ${username} ».`}
                errorMessage="Impossible de charger les membres."
            >
                {(members) => <MemberResults members={members} />}
            </PaginatedList>
        </section>
    );
}
