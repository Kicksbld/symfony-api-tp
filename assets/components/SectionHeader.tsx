import type { ReactNode } from "react";
import { Link, type To } from "react-router";

type SectionHeaderProps = {
    id: string;
    title: ReactNode;
    link?: { to: To; label: string };
    children?: ReactNode;
};

export function SectionHeader({ id, title, link, children }: SectionHeaderProps) {
    return (
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <h2 id={id} className="text-2xl font-bold sm:text-3xl">
                {title}
            </h2>
            <div className="flex items-center gap-3">
                {link !== undefined && (
                    <Link to={link.to} className="text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline">
                        {link.label}
                    </Link>
                )}
                {children}
            </div>
        </div>
    );
}
