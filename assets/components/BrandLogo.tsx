import { cn } from "cn";
import type { ComponentProps } from "react";

// Accepte les props d'un span pour servir aussi de titre au menu mobile (SheetTitle asChild).
export function BrandLogo({ className, ...props }: ComponentProps<"span">) {
    return (
        <span className={cn("inline-flex items-center gap-2 font-heading text-xl font-extrabold tracking-tight text-foreground", className)} {...props}>
            <span aria-hidden="true" className="size-2.5 rounded-full bg-primary shadow-[0_0_12px] shadow-primary" />
            Letterboxd
        </span>
    );
}
