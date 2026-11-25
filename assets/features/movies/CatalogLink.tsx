import { SlidersHorizontal } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";

// Ouvre le catalogue avec le filtre de la fiche : l'adresse se partage et se combine avec les autres filtres.
export function CatalogLink({ to }: { to: string }) {
    return (
        <Button asChild variant="outline" size="sm">
            <Link to={to}>
                <SlidersHorizontal aria-hidden="true" />
                Affiner dans le catalogue
            </Link>
        </Button>
    );
}
