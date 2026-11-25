import { expect, test, type Page } from "@playwright/test";

test.use({ baseURL: "http://127.0.0.1:8000" });

async function fillLogin(page: Page, email: string) {
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Mot de passe").fill("demo1234");
    await page.getByRole("button", { name: "Se connecter" }).click();
}

test("la connexion ramène à la page d'origine avec ses paramètres", async ({ page }) => {
    await page.goto("/?page=2");
    await page.getByRole("link", { name: "Connexion", exact: true }).click();
    await fillLogin(page, "jane@example.com");

    await expect(page).toHaveURL("/?page=2");
    await expect(page.getByText(/Page 2 sur/)).toBeVisible();
});

for (const redirect of ["//example.com/movies", "https://example.com/", "/\\example.com"]) {
    test(`une destination externe (${redirect}) renvoie vers l'accueil`, async ({ page }) => {
        await page.goto(`/login?${new URLSearchParams({ redirect })}`);
        await fillLogin(page, "jane@example.com");

        await expect(page.getByRole("link", { name: "jane_doe" })).toBeVisible();
        await expect(page).toHaveURL("/");
    });
}

function uniqueUsername(): string {
    return `member_${Date.now().toString(36)}`;
}

async function fillRegister(page: Page, values: { email: string; username: string; password: string }) {
    await expect(page.getByText("Inscription", { exact: true })).toBeVisible();
    await page.getByLabel("Email").fill(values.email);
    await page.getByLabel("Pseudo").fill(values.username);
    await page.getByLabel("Mot de passe").fill(values.password);
    await page.getByRole("button", { name: "Créer mon compte" }).click();
}

test("l'inscription ouvre la session et ramène à la page d'origine", async ({ page }) => {
    const username = uniqueUsername();
    await page.goto("/?page=3");
    await page.getByRole("link", { name: "Connexion", exact: true }).click();
    await page.getByRole("link", { name: "Créer un compte" }).click();
    await fillRegister(page, { email: `${username}@example.com`, username, password: "password123" });

    await expect(page.getByRole("link", { name: username })).toBeVisible();
    await expect(page).toHaveURL("/?page=3");
});

test("les erreurs de l'API s'affichent sur les champs concernés sans perdre la destination", async ({ page }) => {
    await page.goto(`/register?${new URLSearchParams({ redirect: "/?page=2" })}`);
    await fillRegister(page, { email: "new_member@example.com", username: "new_member", password: "short" });
    await expect(page.getByRole("textbox", { name: "Mot de passe" })).toHaveAccessibleDescription(/too short/);
    await expect(page.getByRole("textbox", { name: "Pseudo" })).not.toHaveAttribute("aria-invalid", "true");

    await fillRegister(page, { email: "new_member@example.com", username: "jane_doe", password: "password123" });
    await expect(page.getByRole("textbox", { name: "Pseudo" })).toHaveAccessibleDescription(/This username is already taken\./);
    await expect(page.getByRole("textbox", { name: "Mot de passe" })).not.toHaveAttribute("aria-invalid", "true");

    const username = uniqueUsername();
    await page.getByLabel("Pseudo").fill(username);
    await page.getByLabel("Mot de passe").fill("password123");
    await page.getByLabel("Email").fill(`${username}@example.com`);
    await page.getByRole("button", { name: "Créer mon compte" }).click();

    await expect(page.getByRole("link", { name: username })).toBeVisible();
    await expect(page).toHaveURL("/?page=2");
});

test("si la connexion échoue après l'inscription, le membre se connecte au compte créé", async ({ page }) => {
    const username = uniqueUsername();
    const email = `${username}@example.com`;
    await page.route("**/api/login_check", (route) => route.fulfill({ status: 503, json: { message: "Service indisponible" } }), { times: 1 });

    await page.goto(`/register?${new URLSearchParams({ redirect: "/?page=2" })}`);
    await fillRegister(page, { email, username, password: "password123" });
    await expect(page.getByText("Votre compte est créé, mais la connexion a échoué.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Créer mon compte" })).toHaveCount(0);

    await page.getByRole("main").getByRole("link", { name: "Se connecter" }).click();
    await expect(page.getByLabel("Email")).toHaveValue(email);
    await page.getByLabel("Mot de passe").fill("password123");
    await page.getByRole("button", { name: "Se connecter" }).click();

    await expect(page.getByRole("link", { name: username })).toBeVisible();
    await expect(page).toHaveURL("/?page=2");
});

test("une session refusée par l'API renvoie à la connexion puis à la page en cours", async ({ page }) => {
    await page.goto("/login");
    await fillLogin(page, "arthur@example.com");
    await expect(page.getByRole("link", { name: "arthur" })).toBeVisible();

    await page.route("**/api/me", (route) => route.fulfill({ status: 401, json: { message: "Expired JWT Token" } }), { times: 1 });
    await page.goto("/?page=2");
    await expect(page).toHaveURL(`/login?${new URLSearchParams({ redirect: "/?page=2" })}`);

    await fillLogin(page, "arthur@example.com");
    await expect(page).toHaveURL("/?page=2");
});

test("la déconnexion garde la page en cours et le lien de connexion y ramène", async ({ page }) => {
    await page.goto(`/login?${new URLSearchParams({ redirect: "/?page=2" })}`);
    await fillLogin(page, "jane@example.com");
    await page.getByRole("button", { name: "Déconnexion" }).click();

    await expect(page).toHaveURL("/?page=2");
    await page.getByRole("link", { name: "Connexion", exact: true }).click();
    await fillLogin(page, "jane@example.com");
    await expect(page.getByRole("link", { name: "jane_doe" })).toBeVisible();
    await expect(page).toHaveURL("/?page=2");
});
