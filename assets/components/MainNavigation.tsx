import { cn } from "cn";
import { NavLink } from "react-router";
import { useAuth } from "@/features/auth/auth";
import { DEFAULT_CATALOG_SEARCH, catalogPath } from "@/features/movies/catalog-search";

type MainNavigationProps = {
    layout: "bar" | "panel";
    className?: string;
    onNavigate?: () => void;
};

export function MainNavigation({ layout, className, onNavigate }: MainNavigationProps) {
    const { session } = useAuth();
    const links = [
        { to: catalogPath(DEFAULT_CATALOG_SEARCH), label: "Films", end: true },
        { to: "/people", label: "Personnes", end: false },
        { to: "/lists", label: "Listes", end: false },
        { to: "/reviews", label: "Critiques", end: false },
        { to: "/users", label: "Membres", end: true },
        ...(session === null ? [] : [{ to: "/feed", label: "Activité", end: false }]),
    ];

    return (
        <nav aria-label="Navigation principale" className={cn("flex", layout === "bar" ? "items-center gap-1" : "flex-col gap-1", className)}>
            {links.map(({ to, label, end }) => (
                <NavLink key={to} to={to} end={end} onClick={onNavigate} className={layout === "bar" ? BAR_LINK_CLASS_NAME : PANEL_LINK_CLASS_NAME}>
                    {label}
                </NavLink>
            ))}
        </nav>
    );
}

// Le lien actif garde un trait vert sous le texte, comme un onglet.
const BAR_LINK_CLASS_NAME =
    "relative rounded-md px-2.5 py-2 text-sm font-medium xl:px-3 text-muted-foreground transition-colors after:absolute after:inset-x-2.5 after:-bottom-px xl:after:inset-x-3 after:h-0.5 after:scale-x-0 after:rounded-full after:bg-primary after:transition-transform hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none aria-[current=page]:text-foreground aria-[current=page]:after:scale-x-100";

const PANEL_LINK_CLASS_NAME =
    "flex min-h-12 items-center rounded-lg px-3 font-heading text-2xl font-bold tracking-tight text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none aria-[current=page]:text-primary";
