import { Link, Outlet } from "react-router";
import { BrandLogo } from "@/components/BrandLogo";
import { PosterWall } from "@/features/auth/PosterWall";

// Connexion et inscription sortent du layout principal : pas de navigation qui détourne du formulaire.
export function AuthLayout() {
    return (
        <div className="relative grid min-h-screen bg-background text-foreground lg:grid-cols-[1.1fr_1fr]">
            <div className="absolute inset-0 overflow-hidden lg:relative">
                <PosterWall />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
                <div className="absolute inset-0 hidden bg-gradient-to-r from-transparent to-background lg:block" />
                <div className="absolute inset-x-0 bottom-0 hidden max-w-xl space-y-4 p-12 lg:block">
                    <p className="display">Votre journal de films.</p>
                    <p className="max-w-md text-lg text-muted-foreground">Notez ce que vous regardez, écrivez des critiques, faites des listes et suivez d'autres membres.</p>
                </div>
            </div>
            <div className="relative flex min-h-screen flex-col bg-background/85 px-6 py-8 backdrop-blur-md sm:px-12 lg:bg-background lg:backdrop-blur-none">
                <Link to="/" className="self-start rounded-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
                    <BrandLogo />
                </Link>
                <main className="flex flex-1 items-center justify-center py-10">
                    <div className="w-full max-w-sm">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
