import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { personQuery } from "@/features/people/queries";

type PersonLinkProps = {
    personId: number;
    className?: string;
    children: ReactNode;
};

// Comme les cartes de films, la fiche est préchargée au survol ou à la prise de focus.
export function PersonLink({ personId, className, children }: PersonLinkProps) {
    const queryClient = useQueryClient();

    function prefetchPerson(): void {
        void queryClient.prefetchQuery(personQuery(personId));
    }

    return (
        <Link to={`/people/${personId}`} className={className} onPointerEnter={prefetchPerson} onFocus={prefetchPerson}>
            {children}
        </Link>
    );
}
