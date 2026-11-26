import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { Link } from "react-router";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/features/auth/auth";
import { currentUserQuery } from "@/features/auth/queries";
import { UserAvatar } from "@/features/users/UserAvatar";
import type { Session } from "@/lib/session";

export function AccountMenu({ session }: { session: Session }) {
    const { logout } = useAuth();
    const { data: user, error, refetch } = useQuery(currentUserQuery(session));
    // Le pseudo de la session peut dater d'avant une modification du profil : on préfère celui de /api/me.
    const username = user?.username ?? session.user.username;
    const profilePath = `/users/${encodeURIComponent(username)}`;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="flex h-10 items-center gap-2 rounded-full py-1 pr-2 pl-1 transition-colors hover:bg-white/10 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
                <UserAvatar username={username} className="size-8 text-xs" />
                <span className="hidden max-w-32 truncate text-sm font-medium md:inline lg:hidden xl:inline">{username}</span>
                <ChevronDown aria-hidden="true" className="size-4 text-muted-foreground" />
                <span className="sr-only">Menu du compte</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{username}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link to={profilePath}>Mon profil</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link to={`${profilePath}/diary`}>Mon journal</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link to={`${profilePath}/watchlist`}>Ma watchlist</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link to={`${profilePath}/lists`}>Mes listes</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link to="/settings/profile">Modifier mon profil</Link>
                </DropdownMenuItem>
                {error !== null && (
                    <DropdownMenuItem onSelect={() => void refetch()}>Réessayer le chargement du profil</DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={logout}>Déconnexion</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
