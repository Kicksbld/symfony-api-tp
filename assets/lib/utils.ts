import type { CSSProperties } from "react";

export { cn } from "cn"

// Lien dans un texte (crédits, titres de films) : souligné seulement au survol.
export const TEXT_LINK_CLASS_NAME = "font-medium underline-offset-4 hover:underline";

// Lien secondaire en forme de pastille (filtres d'une page, genres, studios).
export const CHIP_LINK_CLASS_NAME =
    "inline-flex h-8 items-center rounded-full bg-white/5 px-3 text-sm text-foreground/85 transition-colors hover:bg-white/10 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";

// Position d'un élément dans une grille, lue par l'animation animate-rise pour décaler les apparitions.
export function staggerStyle(index: number): CSSProperties {
    return { "--i": index } as CSSProperties;
}
