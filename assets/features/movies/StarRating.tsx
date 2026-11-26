import { cn } from "cn";
import { Star, StarHalf } from "lucide-react";
import { formatStarCount } from "@/features/movies/format";

const STARS = [1, 2, 3, 4, 5];

type StarRatingProps = {
    rating: number;
    className?: string;
};

// Notes de 0,5 à 5 par demi-étoile, comme sur Letterboxd.
export function StarRating({ rating, className }: StarRatingProps) {
    return (
        <span role="img" aria-label={formatStarCount(rating)} className={cn("inline-flex items-center gap-px text-primary [&_svg]:size-3.5", className)}>
            {STARS.map((star) => {
                if (rating >= star) {
                    return <Star key={star} aria-hidden="true" className="fill-current" />;
                }
                if (rating >= star - 0.5) {
                    return (
                        <span key={star} className="relative inline-flex">
                            <Star aria-hidden="true" className="text-muted-foreground/40" />
                            <StarHalf aria-hidden="true" className="absolute inset-0 fill-current" />
                        </span>
                    );
                }

                return <Star key={star} aria-hidden="true" className="text-muted-foreground/40" />;
            })}
        </span>
    );
}
