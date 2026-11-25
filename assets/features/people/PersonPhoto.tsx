import { cn } from "cn";
import { UserRound } from "lucide-react";
import type { PersonSummary } from "@/lib/types";

type PersonPhotoProps = {
    person: Pick<PersonSummary, "profileUrl">;
    alt: string;
    className?: string;
    loading?: "lazy" | "eager";
};

// Beaucoup de membres d'équipe n'ont pas de photo chez TMDB : on garde le même format pour ne pas décaler la grille.
export function PersonPhoto({ person, alt, className, loading }: PersonPhotoProps) {
    if (person.profileUrl === null) {
        return (
            <div className={cn("flex aspect-[2/3] w-full items-center justify-center bg-muted text-muted-foreground", className)}>
                <UserRound className="size-1/3" aria-hidden="true" />
            </div>
        );
    }

    return <img src={person.profileUrl} alt={alt} className={cn("aspect-[2/3] w-full object-cover", className)} loading={loading} />;
}
