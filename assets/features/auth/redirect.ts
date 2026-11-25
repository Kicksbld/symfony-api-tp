const REDIRECT_PARAM = "redirect";
const AUTH_PATHS = ["/login", "/register"];

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
    if (url.origin !== window.location.origin || AUTH_PATHS.includes(url.pathname)) {
        return "/";
    }

    return url.pathname + url.search + url.hash;
}

// L'accueil est la destination par défaut, inutile de l'écrire dans l'URL.
export function authPath(path: "/login" | "/register", target: string): string {
    if (target === "/") {
        return path;
    }

    return `${path}?${new URLSearchParams({ [REDIRECT_PARAM]: target })}`;
}

export function currentTarget(location: { pathname: string; search: string; hash: string }): string {
    if (AUTH_PATHS.includes(location.pathname)) {
        return redirectTarget(new URLSearchParams(location.search));
    }

    return location.pathname + location.search + location.hash;
}
