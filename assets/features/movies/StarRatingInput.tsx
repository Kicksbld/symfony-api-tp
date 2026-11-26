import { cn } from "cn";
import { Star, StarHalf, X } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { formatStarCount } from "@/features/movies/format";

const STARS = [1, 2, 3, 4, 5];
const STEP = 0.5;

type StarRatingInputProps = {
    id?: string;
    label: string;
    value: number | null;
    onChange: (rating: number | null) => void;
    disabled?: boolean;
    invalid?: boolean;
    describedBy?: string;
    size?: "md" | "lg";
    className?: string;
};

/**
 * Note par demi-étoile : chaque étoile a deux zones cliquables (gauche pour la demie, droite pour l'étoile pleine).
 * Au clavier, c'est un groupe de boutons radio : les flèches changent la note d'une demi-étoile.
 */
export function StarRatingInput({ id, label, value, onChange, disabled = false, invalid = false, describedBy, size = "md", className }: StarRatingInputProps) {
    const [hovered, setHovered] = useState<number | null>(null);
    const shown = hovered ?? value ?? 0;
    // Sans note, la première demi-étoile reçoit le focus de la touche Tab.
    const tabStop = value ?? STEP;

    function select(rating: number): void {
        if (!disabled) {
            onChange(rating);
        }
    }

    function moveWithArrows(event: KeyboardEvent<HTMLDivElement>): void {
        const direction = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[event.key];
        if (direction === undefined || disabled) {
            return;
        }
        event.preventDefault();
        const next = Math.min(5, Math.max(STEP, (value ?? 0) + direction * STEP));
        onChange(next);
        event.currentTarget.querySelector<HTMLButtonElement>(`[data-rating="${next}"]`)?.focus();
    }

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div
                id={id}
                role="radiogroup"
                aria-label={label}
                aria-invalid={invalid || undefined}
                aria-describedby={describedBy}
                aria-disabled={disabled || undefined}
                onKeyDown={moveWithArrows}
                onPointerLeave={() => setHovered(null)}
                className="flex aria-disabled:opacity-60"
            >
                {STARS.map((star) => (
                    <span key={star} className={cn("relative flex items-center justify-center text-primary [&>svg]:transition-transform [&>svg]:duration-150 hover:[&>svg]:scale-110 [&>span]:transition-transform [&>span]:duration-150 hover:[&>span]:scale-110", size === "lg" ? "size-11" : "size-8")}>
                        <StarShape fill={shown >= star ? "full" : shown >= star - STEP ? "half" : "empty"} className={size === "lg" ? "size-9" : "size-6"} />
                        {[star - STEP, star].map((rating, half) => (
                            <button
                                key={rating}
                                type="button"
                                role="radio"
                                data-rating={rating}
                                aria-checked={value === rating}
                                aria-label={formatStarCount(rating)}
                                tabIndex={rating === tabStop ? 0 : -1}
                                onClick={() => select(rating)}
                                onPointerEnter={() => setHovered(rating)}
                                className={cn(
                                    "absolute inset-y-0 w-1/2 rounded-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                                    half === 0 ? "left-0" : "right-0",
                                )}
                            />
                        ))}
                    </span>
                ))}
            </div>
            {value !== null && (
                <button
                    type="button"
                    onClick={() => !disabled && onChange(null)}
                    aria-label="Retirer la note"
                    className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                    <X aria-hidden="true" className="size-4" />
                </button>
            )}
        </div>
    );
}

function StarShape({ fill, className }: { fill: "full" | "half" | "empty"; className: string }) {
    if (fill === "half") {
        return (
            <span aria-hidden="true" className="relative inline-flex">
                <Star className={cn(className, "text-muted-foreground/40")} />
                <StarHalf className={cn(className, "absolute inset-0 fill-current")} />
            </span>
        );
    }

    return <Star aria-hidden="true" className={cn(className, fill === "full" ? "fill-current" : "text-muted-foreground/40")} />;
}
