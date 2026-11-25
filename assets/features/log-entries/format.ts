// L'API renvoie une date sans heure (« 2026-11-24 ») : lue en UTC, elle doit être affichée en UTC pour ne pas changer de jour.
const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export function formatDate(date: string): string {
    return DATE_FORMAT.format(new Date(date));
}
