import { Link, type To } from "react-router";
import { Button } from "@/components/ui/button";

type PaginationProps = {
    page: number;
    lastPage: number;
    pathForPage: (page: number) => To;
    label: string;
    disabled?: boolean;
};

export function Pagination({ page, lastPage, pathForPage, label, disabled = false }: PaginationProps) {
    return (
        <nav className="flex items-center justify-center gap-4 text-sm" aria-label={label}>
            <PageLink to={pathForPage(page - 1)} disabled={disabled || page <= 1} label="Précédent" />
            <span>
                Page {page} sur {lastPage}
            </span>
            <PageLink to={pathForPage(page + 1)} disabled={disabled || page >= lastPage} label="Suivant" />
        </nav>
    );
}

function PageLink({ to, disabled, label }: { to: To; disabled: boolean; label: string }) {
    if (disabled) {
        return (
            <Button variant="outline" size="sm" disabled>
                {label}
            </Button>
        );
    }

    return (
        <Button asChild variant="outline" size="sm">
            <Link to={to}>{label}</Link>
        </Button>
    );
}
