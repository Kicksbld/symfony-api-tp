import { Menu } from "lucide-react";
import { cn } from "cn";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { BrandLogo } from "@/components/BrandLogo";
import { MainNavigation } from "@/components/MainNavigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AccountMenu } from "@/features/auth/AccountMenu";
import { useAuth } from "@/features/auth/auth";
import { CommandSearch } from "@/features/search/CommandSearch";
import { authPath, returnPathFor } from "@/lib/redirect";

type LayoutProps = {
    // Pages qui s'ouvrent sur une grande image : l'en-tête est posé dessus et le contenu prend toute la largeur.
    immersive?: boolean;
};

export function Layout({ immersive = false }: LayoutProps) {
    const { session } = useAuth();
    const scrolled = useScrolled();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const contentRef = useRef<HTMLElement>(null);
    const loginPath = authPath("/login", returnPathFor(location));
    const registerPath = authPath("/register", returnPathFor(location));

    // Le navigateur ne donne pas toujours le focus à la cible d'une ancre, on le déplace nous-mêmes.
    function skipToContent(event: MouseEvent<HTMLAnchorElement>): void {
        event.preventDefault();
        contentRef.current?.focus();
    }

    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            <a
                href="#content"
                onClick={skipToContent}
                className="sr-only rounded-md bg-primary text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2"
            >
                Aller au contenu
            </a>
            <header
                className={cn(
                    "top-0 z-40 border-b transition-colors duration-300",
                    immersive ? "fixed inset-x-0" : "sticky",
                    immersive && !scrolled
                        ? "border-transparent bg-gradient-to-b from-background/80 to-transparent"
                        : "border-white/5 bg-background/75 backdrop-blur-xl",
                )}
            >
                <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:gap-8">
                    <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon-lg" className="-ml-2 size-11 lg:hidden" aria-label="Ouvrir le menu">
                                <Menu aria-hidden="true" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-80 p-6">
                            <SheetHeader className="p-0">
                                <SheetTitle asChild>
                                    <BrandLogo />
                                </SheetTitle>
                                <SheetDescription className="sr-only">Navigation principale</SheetDescription>
                            </SheetHeader>
                            <MainNavigation layout="panel" className="mt-6" onNavigate={() => setMenuOpen(false)} />
                            {session === null && (
                                <div className="mt-auto grid gap-2">
                                    <Button asChild size="lg" className="h-11 rounded-full">
                                        <Link to={registerPath} onClick={() => setMenuOpen(false)}>
                                            Créer un compte
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" size="lg" className="h-11 rounded-full">
                                        <Link to={loginPath} onClick={() => setMenuOpen(false)}>
                                            Connexion
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </SheetContent>
                    </Sheet>
                    <Link to="/" className="rounded-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
                        <BrandLogo />
                    </Link>
                    <MainNavigation layout="bar" className="hidden lg:flex" />
                    <div className="ml-auto flex items-center gap-2">
                        <CommandSearch />
                        {session === null ? (
                            <>
                                <Button asChild variant="ghost" className="hidden h-10 rounded-full px-4 sm:inline-flex">
                                    <Link to={loginPath}>Connexion</Link>
                                </Button>
                                <Button asChild className="hidden h-10 rounded-full bg-foreground px-4 text-background hover:bg-foreground/85 sm:inline-flex">
                                    <Link to={registerPath}>Créer un compte</Link>
                                </Button>
                            </>
                        ) : (
                            <AccountMenu session={session} />
                        )}
                    </div>
                </div>
            </header>
            <main
                id="content"
                ref={contentRef}
                tabIndex={-1}
                className={cn("w-full flex-1 focus:outline-none", !immersive && "mx-auto max-w-7xl px-4 py-10 sm:px-6")}
            >
                {/* Entrée douce à chaque nouvelle page. Les onglets d'une même page (profil) ne la rejouent pas. */}
                <div key={pageKey(location.pathname)} className="animate-page-in">
                    <Outlet />
                </div>
            </main>
            <footer className="border-t border-white/5">
                <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <BrandLogo className="text-base" />
                    <p>Données des films, des personnes et des plateformes fournies par TMDB.</p>
                </div>
            </footer>
        </div>
    );
}

function useScrolled(): boolean {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        function update(): void {
            setScrolled(window.scrollY > 24);
        }

        update();
        window.addEventListener("scroll", update, { passive: true });

        return () => window.removeEventListener("scroll", update);
    }, []);

    return scrolled;
}

// « /users/jane/diary » et « /users/jane/lists » sont la même page : seuls les deux premiers segments comptent.
function pageKey(pathname: string): string {
    return pathname.split("/").slice(0, 3).join("/");
}

