import { Menu, X } from "lucide-react";
import { useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { Link, Outlet } from "react-router";
import { Button } from "@/components/ui/button";
import { MainNavigation } from "@/components/MainNavigation";

export function Layout() {
    const [menuOpen, setMenuOpen] = useState(false);
    const contentRef = useRef<HTMLElement>(null);
    const menuButtonRef = useRef<HTMLButtonElement>(null);

    // Le navigateur ne donne pas toujours le focus à la cible d'une ancre, on le déplace nous-mêmes.
    function skipToContent(event: MouseEvent<HTMLAnchorElement>): void {
        event.preventDefault();
        contentRef.current?.focus();
    }

    function closeMenuOnEscape(event: KeyboardEvent<HTMLElement>): void {
        if (event.key === "Escape" && menuOpen) {
            setMenuOpen(false);
            menuButtonRef.current?.focus();
        }
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <a
                href="#content"
                onClick={skipToContent}
                className="sr-only rounded-md bg-primary text-primary-foreground focus:not-sr-only focus:px-4 focus:py-2 focus:fixed focus:top-2 focus:left-2 focus:z-50"
            >
                Aller au contenu
            </a>
            <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur" onKeyDown={closeMenuOnEscape}>
                <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
                    <Link to="/" className="rounded-md text-lg font-semibold text-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
                        Letterboxd
                    </Link>
                    <MainNavigation layout="bar" className="hidden lg:flex" />
                    <Button
                        ref={menuButtonRef}
                        variant="ghost"
                        size="icon-lg"
                        className="size-11 lg:hidden"
                        aria-expanded={menuOpen}
                        aria-controls="mobile-navigation"
                        aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
                        onClick={() => setMenuOpen(!menuOpen)}
                    >
                        {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
                    </Button>
                </div>
                {menuOpen && (
                    <MainNavigation
                        id="mobile-navigation"
                        layout="panel"
                        className="border-t px-4 py-2 lg:hidden"
                        onNavigate={() => setMenuOpen(false)}
                    />
                )}
            </header>
            <main id="content" ref={contentRef} tabIndex={-1} className="mx-auto max-w-6xl px-4 py-8 focus:outline-none">
                <Outlet />
            </main>
        </div>
    );
}
