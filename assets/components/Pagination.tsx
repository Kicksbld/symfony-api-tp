import { cn } from "cn";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { Link, type To } from "react-router";
import { buttonVariants } from "@/components/ui/button";

type PaginationProps = {
    page: number;
    lastPage: number;
    pathForPage: (page: number) => To;
    label: string;
    disabled?: boolean;
};

// Pages voisines de la page courante affichées de chaque côté, en plus de la première et de la dernière.
const SIBLING_COUNT = 1;

export function Pagination({ page, lastPage, pathForPage, label, disabled = false }: PaginationProps) {
    return (
        <nav className="flex items-center justify-center gap-0.5 pt-2 sm:gap-1" aria-label={label}>
            <PageLink to={pathForPage(page - 1)} disabled={disabled || page <= 1} label="Page précédente">
                <ChevronLeft aria-hidden="true" />
            </PageLink>
            {visiblePages(page, lastPage).map((item, index) =>
                item === null ? (
                    <span key={`gap-${index}`} aria-hidden="true" className="w-4 text-center text-muted-foreground sm:w-6">
                        …
                    </span>
                ) : (
                    <PageLink
                        key={item}
                        to={pathForPage(item)}
                        disabled={disabled}
                        current={item === page}
                        label={`Page ${item}`}
                        // Sur mobile, on ne garde que la première, la courante et la dernière : la barre tient en largeur.
                        className={hiddenOnMobile(item, page, lastPage) ? "hidden sm:inline-flex" : undefined}
                    >
                        {item}
                    </PageLink>
                ),
            )}
            <PageLink to={pathForPage(page + 1)} disabled={disabled || page >= lastPage} label="Page suivante">
                <ChevronRight aria-hidden="true" />
            </PageLink>
        </nav>
    );
}

function hiddenOnMobile(candidate: number, page: number, lastPage: number): boolean {
    return candidate !== page && candidate !== 1 && candidate !== lastPage;
}

// null marque un trou entre deux groupes de pages.
function visiblePages(page: number, lastPage: number): (number | null)[] {
    const pages: (number | null)[] = [];
    for (let candidate = 1; candidate <= lastPage; candidate++) {
        const isEdge = candidate === 1 || candidate === lastPage;
        if (isEdge || Math.abs(candidate - page) <= SIBLING_COUNT) {
            pages.push(candidate);
        } else if (pages.at(-1) !== null) {
            pages.push(null);
        }
    }

    return pages;
}

type PageLinkProps = {
    to: To;
    disabled: boolean;
    current?: boolean;
    label: string;
    className?: string;
    children: ReactNode;
};

function PageLink({ to, disabled, current = false, label, className: extraClassName, children }: PageLinkProps) {
    const className = cn(
        buttonVariants({ variant: current ? "default" : "ghost", size: "icon-lg" }),
        "size-10 rounded-full font-semibold tabular-nums sm:size-9",
        disabled && !current && "pointer-events-none opacity-40",
        extraClassName,
    );

    if (current) {
        return (
            <span aria-current="page" aria-label={label} className={className}>
                {children}
            </span>
        );
    }
    if (disabled) {
        return (
            <span aria-disabled="true" aria-label={label} className={className}>
                {children}
            </span>
        );
    }

    return (
        <Link to={to} aria-label={label} className={className}>
            {children}
        </Link>
    );
}
