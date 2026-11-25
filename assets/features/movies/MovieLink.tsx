import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { movieQuery } from "@/features/movies/queries";

type MovieLinkProps = {
    movieId: number;
    className?: string;
    children: ReactNode;
};

export function MovieLink({ movieId, className, children }: MovieLinkProps) {
    const queryClient = useQueryClient();

    function prefetchMovie(): void {
        void queryClient.prefetchQuery(movieQuery(movieId));
    }

    return (
        <Link to={`/movies/${movieId}`} className={className} onPointerEnter={prefetchMovie} onFocus={prefetchMovie}>
            {children}
        </Link>
    );
}
