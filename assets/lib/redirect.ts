const REDIRECT_PARAM = "redirect";
const AUTH_PATHS = ["/login", "/register"] as const;

type AuthPath = (typeof AUTH_PATHS)[number];

type PageLocation = { pathname: string; search: string; hash: string };

/**
 * Lit la destination passée dans l'URL. Seul un chemin du site est accepté : une valeur comme
 * « //evil.com » ou « https://evil.com » enverrait le membre ailleurs juste après sa connexion.
 */
export function redirectTarget(searchParams: URLSearchParams): string {
    const value = searchParams.get(REDIRECT_PARAM);
    if (value === null || !value.startsWith("/")) {
        return "/";
    }

    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin || isAuthPath(url.pathname)) {
        return "/";
    }

    return url.pathname + url.search + url.hash;
}

// L'accueil est la destination par défaut, inutile de l'écrire dans l'URL.
export function authPath(path: AuthPath, target: string): string {
    if (target === "/") {
        return path;
    }

    return `${path}?${new URLSearchParams({ [REDIRECT_PARAM]: target })}`;
}

// Depuis une page de connexion ou d'inscription, on garde la destination déjà demandée.
export function returnPathFor(location: PageLocation): string {
    if (isAuthPath(location.pathname)) {
        return redirectTarget(new URLSearchParams(location.search));
    }

    return location.pathname + location.search + location.hash;
}

// React Router ignore la casse et le slash final : « /LOGIN/ » affiche aussi la page de connexion.
function isAuthPath(pathname: string): boolean {
    const normalized = pathname.toLowerCase().replace(/\/+$/, "");

    return AUTH_PATHS.some((path) => path === normalized);
}
