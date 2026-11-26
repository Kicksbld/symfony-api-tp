export function formatRuntime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;

    return hours === 0 ? `${rest} min` : `${hours} h ${String(rest).padStart(2, "0")}`;
}

export function releaseYear(releaseDate: string | null): string | undefined {
    return releaseDate?.slice(0, 4);
}

const STARS_FORMAT = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

export function formatStarCount(rating: number): string {
    return `${STARS_FORMAT.format(rating)} ${rating > 1 ? "étoiles" : "étoile"}`;
}
