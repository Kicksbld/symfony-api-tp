// Relie le champ à son aide et à son erreur pour les lecteurs d'écran.
export function fieldDescription(id: string, { hint, error }: { hint?: string; error?: string }): string | undefined {
    if (error !== undefined) {
        return `${id}-error`;
    }

    return hint === undefined ? undefined : `${id}-hint`;
}
