import { expect, test, type Page } from "@playwright/test";

test.use({ baseURL: "http://127.0.0.1:8000" });

function popularMoviesPage(page: number) {
    return ({ pathname, searchParams }: URL) =>
        pathname === "/api/movies" && searchParams.get("sort") === "popular" && searchParams.get("page") === String(page);
}

function holdResponse() {
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
        release = resolve;
    });

    return { pending, release };
}

test("les films restent visibles pendant la pagination et après un échec", async ({ page }) => {
    const { pending, release } = holdResponse();
    await page.route(popularMoviesPage(2), async (route) => {
        await pending;
        await route.fulfill({ status: 503, json: { message: "Service indisponible" } });
    }, { times: 1 });

    await page.goto("/");
    const firstPoster = page.getByRole("main").getByRole("img").first();
    await expect(firstPoster).toBeVisible();
    const previousTitle = await firstPoster.evaluate((poster: HTMLImageElement) => poster.alt);

    await page.getByRole("link", { name: "Suivant" }).click();
    await expect(page).toHaveURL(/\?page=2$/);
    try {
        await expect(firstPoster).toHaveAttribute("alt", previousTitle);
        await expect(page.getByRole("status")).toHaveText("Mise à jour des films…");
    } finally {
        release();
    }

    await expect(page.getByRole("alert")).toContainText("Impossible de charger les films");
    await expect(firstPoster).toHaveAttribute("alt", previousTitle);
    await page.getByRole("button", { name: "Réessayer" }).click();

    await expect(page.getByText(/Page 2 sur/)).toBeVisible();
    await expect(firstPoster).not.toHaveAttribute("alt", previousTitle);
});

async function login(page: Page, email: string) {
    await page.getByRole("link", { name: "Connexion", exact: true }).click();
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Mot de passe").fill("demo1234");
    await page.getByRole("button", { name: "Se connecter" }).click();
}

function profileResponse(page: Page) {
    return page.waitForResponse((response) => response.url().endsWith("/api/me") && response.ok(), { timeout: 5000 });
}

test("deux comptes ne partagent pas leur profil et la déconnexion annule la lecture en cours", async ({ page }) => {
    await page.goto("/");
    const janeProfile = profileResponse(page);
    await login(page, "jane@example.com");
    expect(await (await janeProfile).json()).toMatchObject({ username: "jane_doe" });
    await page.getByRole("button", { name: "Déconnexion" }).click();

    const { pending, release } = holdResponse();
    await page.route("**/api/me", async (route) => {
        await pending;
        await route.fulfill({ status: 401, json: { message: "Expired JWT Token" } });
    }, { times: 1 });

    const newJaneRequest = page.waitForRequest("**/api/me", { timeout: 5000 });
    await login(page, "jane@example.com");
    const request = await newJaneRequest;

    try {
        const cancelled = page.waitForEvent("requestfailed", { predicate: (failed) => failed === request, timeout: 5000 });
        await page.getByRole("button", { name: "Déconnexion" }).click();
        await cancelled;

        const arthurProfile = profileResponse(page);
        await login(page, "arthur@example.com");
        expect(await (await arthurProfile).json()).toMatchObject({ username: "arthur" });
        await expect(page.getByText("arthur", { exact: true })).toBeVisible();
        await expect(page.getByText("jane_doe", { exact: true })).toHaveCount(0);
    } finally {
        release();
    }

    await expect(page).toHaveURL("/");
});

test("le chargement des films peut être relancé après une erreur", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    let shouldFail = true;
    await page.route(popularMoviesPage(1), (route) => {
        if (shouldFail) {
            return route.fulfill({ status: 503, json: { message: "Service indisponible" } });
        }

        return route.continue();
    });

    await page.goto("/");
    await expect(page.getByRole("alert")).toContainText("Impossible de charger les films");
    shouldFail = false;
    await page.getByRole("button", { name: "Réessayer" }).click();

    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(page.getByRole("main").getByRole("img").first()).toBeVisible();
});

test("l'expiration de la session garde le catalogue accessible", async ({ page }) => {
    await page.clock.install();
    await page.goto("/");

    const credentials = page.waitForResponse("**/api/login_check");
    const profile = profileResponse(page);
    await login(page, "jane@example.com");
    const { ttl } = await (await credentials).json();
    await profile;

    await page.clock.fastForward(ttl * 1000 + 1000);
    await expect(page.getByRole("link", { name: "Connexion", exact: true })).toBeVisible();
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("main").getByRole("img").first()).toBeVisible();
});

test("une 401 sur le profil oublie la session restaurée au rechargement", async ({ page }) => {
    await page.goto("/");
    const profile = profileResponse(page);
    await login(page, "arthur@example.com");
    await profile;

    await page.route("**/api/me", (route) => route.fulfill({ status: 401, json: { message: "Expired JWT Token" } }));
    await page.reload();

    await expect(page).toHaveURL("/login");
    await expect(page.getByRole("link", { name: "Connexion", exact: true })).toBeVisible();
});

test("une réponse de connexion tardive ne remplace pas le compte actif", async ({ page, context }) => {
    const { pending, release } = holdResponse();
    await page.route("**/api/login_check", async (route) => {
        const response = await route.fetch();
        await pending;
        await route.fulfill({ response });
    });

    await page.goto("/");
    const janeLoginStarted = page.waitForRequest("**/api/login_check");
    await login(page, "jane@example.com");
    await janeLoginStarted;

    try {
        const secondTab = await context.newPage();
        await secondTab.goto("/");
        const arthurProfile = profileResponse(secondTab);
        await login(secondTab, "arthur@example.com");
        await arthurProfile;
        await expect(page.getByText("arthur", { exact: true })).toBeVisible();

        const lateResponse = page.waitForResponse("**/api/login_check");
        release();
        await (await lateResponse).finished();
        await page.evaluate(() => new Promise<void>((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        }));
        await expect(page.getByText("arthur", { exact: true })).toBeVisible();
        await expect(secondTab.getByText("arthur", { exact: true })).toBeVisible();
    } finally {
        release();
    }
});
