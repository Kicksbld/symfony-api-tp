import { Link, useNavigate, useSearchParams } from "react-router";
import { PaginatedList } from "@/components/PaginatedList";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/features/auth/auth";
import { MemberCard } from "@/features/users/MemberCard";
import { followPanelSearch, readFollowPanel } from "@/features/users/follow-panel";
import { followListQuery, type FollowList } from "@/features/users/queries";
import type { PublicProfile } from "@/lib/types";

const PANEL_COPY: Record<FollowList, { label: string; pagination: string; emptyMessage: string }> = {
    followers: { label: "Abonnés", pagination: "Pagination des abonnés", emptyMessage: "Ce membre n’a aucun abonné." },
    following: { label: "Abonnements", pagination: "Pagination des abonnements", emptyMessage: "Ce membre ne suit encore personne." },
};

// Abonnés et abonnements s'ouvrent par-dessus le profil, sans remplacer l'onglet affiché dessous.
export function FollowSheet({ profile }: { profile: PublicProfile }) {
    const { session } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const panel = readFollowPanel(searchParams);
    const counts: Record<FollowList, number> = { followers: profile.followersCount, following: profile.followingCount };

    function close(): void {
        void navigate(followPanelSearch(searchParams, null), { replace: true });
    }

    return (
        <Sheet open={panel !== null} onOpenChange={(open) => !open && close()}>
            <SheetContent side="right" className="w-full gap-6 overflow-y-auto p-6 sm:max-w-md">
                <SheetHeader className="p-0">
                    <SheetTitle className="text-2xl font-extrabold">{profile.username}</SheetTitle>
                    <SheetDescription className="sr-only">Abonnés et abonnements du membre</SheetDescription>
                </SheetHeader>
                <nav aria-label="Abonnés ou abonnements" className="flex gap-1 rounded-full bg-white/5 p-1">
                    {(["followers", "following"] as const).map((list) => (
                        <Link
                            key={list}
                            to={followPanelSearch(searchParams, list)}
                            replace
                            aria-current={panel?.list === list ? "page" : undefined}
                            className="flex-1 rounded-full py-2 text-center text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground"
                        >
                            {PANEL_COPY[list].label} <span className="tabular-nums opacity-80">{counts[list]}</span>
                        </Link>
                    ))}
                </nav>
                {panel !== null && (
                    <PaginatedList
                        key={`${profile.username}:${panel.list}:${session?.cacheId ?? "public"}`}
                        query={followListQuery(profile.username, panel.list, panel.page, session)}
                        page={panel.page}
                        pathForPage={(page) => followPanelSearch(searchParams, panel.list, page)}
                        label={PANEL_COPY[panel.list].pagination}
                        emptyMessage={PANEL_COPY[panel.list].emptyMessage}
                        errorMessage="Impossible de charger les membres."
                    >
                        {(members) => (
                            <ul className="space-y-3">
                                {members.map((member) => (
                                    <li key={member.id}>
                                        <MemberCard member={member} />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </PaginatedList>
                )}
            </SheetContent>
        </Sheet>
    );
}
