import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button";

export type NavigationLayout = "bar" | "panel";

// Sur mobile, chaque entrée fait 44 px de haut pour rester facile à toucher.
export function navigationItemClassName(layout: NavigationLayout, variant: "ghost" | "outline" = "ghost"): string {
    return cn(
        buttonVariants({ variant, size: "lg" }),
        "aria-[current=page]:text-primary",
        layout === "panel" && "h-11 w-full justify-start text-base",
    );
}
