import { WATCH_REGIONS, type Country, type WatchRegion } from "@/lib/types";

const COUNTRY_NAMES = new Intl.DisplayNames("fr-FR", { type: "region" });

// L'API renvoie les noms de pays de TMDB en anglais : on les traduit à partir du code ISO.
export function countryName(code: string, fallback: string = code): string {
    return COUNTRY_NAMES.of(code) ?? fallback;
}

export function countryLabel(country: Country): string {
    return countryName(country.code, country.name);
}

export function isWatchRegion(value: string): value is WatchRegion {
    return WATCH_REGIONS.some((region) => region === value);
}
