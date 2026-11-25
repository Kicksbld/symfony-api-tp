// Lit un identifiant ou un numéro de page venant de l'URL : « 2.5 », « 1e3 » ou « -1 » sont refusés.
export function parsePositiveInteger(value: string): number | null {
    if (!/^\d+$/.test(value)) {
        return null;
    }

    const number = Number(value);

    return Number.isSafeInteger(number) && number >= 1 ? number : null;
}
