import { cn } from "cn";
import type { ComponentProps } from "react";

// Accepte les props d'un span pour servir aussi de titre au menu mobile (SheetTitle asChild).
export function BrandLogo({ className, ...props }: ComponentProps<"span">) {
    return (
        <span className={cn("font-heading text-xl font-extrabold tracking-tight text-foreground", className)} {...props}>
            Letterboxd
        </span>
    );
}
