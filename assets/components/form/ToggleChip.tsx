import { cn } from "cn";
import type { ReactNode } from "react";

type ToggleChipProps = {
    pressed: boolean;
    onToggle: () => void;
    icon?: ReactNode;
    children: ReactNode;
    // Couleur du choix actif : vert par défaut, rouge pour un coup de cœur.
    tone?: "primary" | "heart";
};

export function ToggleChip({ pressed, onToggle, icon, children, tone = "primary" }: ToggleChipProps) {
    return (
        <button
            type="button"
            aria-pressed={pressed}
            onClick={onToggle}
            className={cn(
                "inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-muted-foreground transition-colors duration-200 hover:border-white/20 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none [&_svg]:size-4",
                tone === "primary" ? "aria-pressed:border-primary/60 aria-pressed:bg-primary/10 aria-pressed:text-primary" : "aria-pressed:border-chart-5/60 aria-pressed:bg-chart-5/10 aria-pressed:text-chart-5 aria-pressed:[&_svg]:fill-current aria-pressed:[&_svg]:animate-pop",
            )}
        >
            {icon}
            {children}
        </button>
    );
}
