const RATING_FORMAT = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function formatRating(rating: number): string {
    return `${RATING_FORMAT.format(rating)} / 5`;
}

export function formatRuntime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;

    return hours === 0 ? `${rest} min` : `${hours} h ${String(rest).padStart(2, "0")}`;
}

export function releaseYear(releaseDate: string | null): string | undefined {
    return releaseDate?.slice(0, 4);
}
