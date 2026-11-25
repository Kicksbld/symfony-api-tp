# Letterboxd API

API REST inspirée de [Letterboxd](https://letterboxd.com), réalisée pour le TP Symfony du module CCI DNMADE3. Chaque membre peut tenir un journal des films qu'il regarde, les noter, écrire des critiques, faire des listes et suivre d'autres membres.

Le projet ne contient que l'API : pas de front, toutes les routes renvoient du JSON et sont testables avec les fichiers du dossier [`http/`](http).

## Stack

- PHP 8.4 ou plus et Symfony 8.1
- Doctrine ORM avec une base SQLite (aucun serveur de base de données à installer)
- LexikJWTAuthenticationBundle pour l'authentification par token JWT
- HttpClient pour l'import du catalogue depuis [TMDB](https://www.themoviedb.org)
- PHPUnit, dama/doctrine-test-bundle et Foundry pour les tests

## Prérequis

- PHP 8.4 ou plus avec les extensions `pdo_sqlite`, `ctype`, `iconv` et `openssl`
- [Composer](https://getcomposer.org)
- [Symfony CLI](https://symfony.com/download) pour lancer le serveur local

## Installation

```bash
git clone https://github.com/Kicksbld/symfony-api-tp.git
cd symfony-api-tp
composer install

# Clés utilisées pour signer les tokens JWT (dans config/jwt/, non versionnées)
php bin/console lexik:jwt:generate-keypair

# Création de la base SQLite (var/data_dev.db)
php bin/console doctrine:migrations:migrate -n

# Chargement du catalogue de films depuis data/movies.jsonl, sans clé TMDB
php bin/console app:tmdb:import --from-file
```

## Catalogue de films

Les films, genres, studios, pays, personnes, crédits et plateformes de streaming viennent de [TMDB](https://www.themoviedb.org). Le catalogue est en lecture seule dans l'API : il est rempli uniquement par les commandes ci-dessous.

### Sans clé TMDB

Le dépôt contient un export du catalogue dans [`data/movies.jsonl`](data/movies.jsonl) (un film par ligne, au format des réponses TMDB). Pour le charger :

```bash
php bin/console app:tmdb:import --from-file
```

Aucune requête n'est envoyée à TMDB. On peut aussi passer un autre fichier : `--from-file=chemin/vers/fichier.jsonl`.

### Avec une clé TMDB

1. Créer un compte sur [themoviedb.org](https://www.themoviedb.org/signup).
2. Dans [Paramètres > API](https://www.themoviedb.org/settings/api), demander une clé (usage personnel ou éducatif).
3. Copier le « Jeton d'accès en lecture à l'API » (le long jeton qui commence par `eyJ`, pas la « Clé d'API » courte).
4. Le coller dans un fichier `.env.local` à la racine du projet (non versionné) :

```dotenv
TMDB_API_TOKEN=eyJ...
```

### Commandes

| Commande | Description |
| --- | --- |
| `php bin/console app:tmdb:import` | Importe les films populaires et les mieux notés depuis TMDB, avec leurs détails, la distribution (15 premiers acteurs), l'équipe (réalisateur, scénariste, chef opérateur, compositeur, monteur), les studios, les pays de production et les plateformes pour FR, BE, CH, CA et US. |
| `php bin/console app:tmdb:import --pages=5` | Même chose en limitant le nombre de pages lues dans chaque liste TMDB (20 films par page, 50 pages par défaut). |
| `php bin/console app:tmdb:import --from-file` | Charge `data/movies.jsonl` sans appeler TMDB. |
| `php bin/console app:tmdb:export` | Écrit le catalogue de la base dans `data/movies.jsonl` (ou dans le fichier donné avec `--output`). |
| `php bin/console app:tmdb:refresh-providers` | Met à jour uniquement les plateformes de streaming des films déjà en base. |

Les films sont retrouvés par leur identifiant TMDB : relancer un import met à jour les films existants au lieu de créer des doublons. Seules les commandes qui appellent TMDB demandent `TMDB_API_TOKEN`.

## Lancement

```bash
symfony serve -d
```

L'API répond sur `http://127.0.0.1:8000/api`. Pour arrêter le serveur : `symfony server:stop`.

Si le serveur démarre en HTTPS (certificat local installé avec `symfony server:ca:install`), il faut changer la `baseURL` dans [`http/http-client.env.json`](http/http-client.env.json).

## Authentification

1. Créer un compte avec `POST /api/register`.
2. Se connecter avec `POST /api/login_check` (email et mot de passe). La réponse contient le `token`, sa durée de vie en secondes (`ttl`, 1 h) et le profil du membre (`user`).
3. Envoyer le token dans l'en-tête `Authorization: Bearer <token>` sur les routes protégées.

Il n'y a pas de refresh token : une fois le token expiré, il faut se reconnecter. Une route protégée appelée sans token valide renvoie une erreur `401`.

## Tester les routes

Le dossier [`http/`](http) contient un fichier `.http` par ressource, avec des requêtes valides et des cas d'erreur. Ils s'ouvrent dans PhpStorm (ou VS Code avec une extension compatible) en choisissant l'environnement `dev`.

Commencer par [`http/auth.http`](http/auth.http) : la requête de connexion enregistre le token, qui est ensuite réutilisé automatiquement par les autres fichiers.

## Routes

| Méthode | Route | Description | Connexion |
| --- | --- | --- | --- |
| `POST` | `/api/register` | Crée un compte (email, username, mot de passe) | Non |
| `POST` | `/api/login_check` | Se connecte et renvoie le token JWT avec le profil | Non |
| `GET` | `/api/me` | Profil du membre connecté | Oui |
| `PATCH` | `/api/me` | Modifie le username et la bio du membre connecté | Oui |
| `GET` | `/api/movies` | Liste paginée des films, avec recherche, filtres et tri | Non |
| `GET` | `/api/movies/{id}` | Fiche complète d'un film | Non |
| `GET` | `/api/movies/{id}/watch-providers` | Plateformes où regarder le film dans un pays (`?region=FR` par défaut), par type d'offre | Non |
| `GET` | `/api/people` | Liste paginée des personnes (acteurs et équipe), avec recherche par nom (`?q=`) | Non |
| `GET` | `/api/people/{id}` | Fiche d'une personne : rôles joués (`cast`) et films par poste (`crew`) | Non |
| `GET` | `/api/people/{id}/movies` | Liste paginée des films d'une personne, filtrable par poste (`?job=Director`, `?job=Actor`) | Non |
| `GET` | `/api/companies/{id}` | Fiche d'un studio, ses films sont dans `GET /api/movies?company={id}` | Non |
| `GET` | `/api/genres` | Liste paginée des genres | Non |
| `GET` | `/api/countries` | Liste paginée des pays de production | Non |
| `GET` | `/api/watch-providers` | Liste paginée des plateformes présentes dans un pays (`?region=FR` par défaut) | Non |

### Pagination

Toutes les listes sont paginées avec `?page=1&limit=20` (valeurs par défaut, `limit` va jusqu'à 100) et renvoient le même format :

```json
{
  "items": [],
  "total": 1591,
  "lastPage": 80
}
```

### Recherche dans le catalogue

Paramètres de `GET /api/movies`, tous facultatifs et combinables :

| Paramètre | Exemple | Description |
| --- | --- | --- |
| `q` | `q=dark knight` | Cherche dans le titre français et le titre original |
| `genre` | `genre=1` | Identifiant d'un genre (voir `GET /api/genres`) |
| `decade` | `decade=1990` | Films sortis de 1990 à 1999 |
| `year` | `year=2010` | Films sortis en 2010 |
| `country` | `country=FR` | Code ISO d'un pays de production (voir `GET /api/countries`) |
| `company` | `company=1` | Identifiant d'un studio |
| `person` | `person=1` | Identifiant d'une personne, quel que soit son poste (voir `GET /api/people`) |
| `provider` | `provider=1` | Identifiant d'une plateforme (voir `GET /api/watch-providers`) |
| `region` | `region=BE` | Pays de diffusion pour le filtre `provider` : `FR` (par défaut), `BE`, `CH`, `CA` ou `US` |
| `sort` | `sort=title` | `popular` (par défaut, score de popularité TMDB), `releaseDate` (plus récents d'abord) ou `title` |

La liste renvoie une vue allégée (titre, titre original, date de sortie, affiche). La fiche `GET /api/movies/{id}` ajoute le synopsis, la durée en minutes, la note moyenne TMDB sur 10 (`voteAverage`, à titre indicatif), les genres, les studios, les pays, la distribution avec les rôles (`cast`) et l'équipe avec les postes (`crew`). Les images (`posterUrl`, `profileUrl`, `logoUrl`) sont des URL complètes vers TMDB.

### Personnes et studios

La fiche `GET /api/people/{id}` liste les films du plus récent au plus ancien : `cast` contient les rôles joués (`movie` et `character`), `crew` range les films par poste TMDB, par exemple `{ "Director": [...], "Writer": [...] }`.

Le paramètre `job` de `GET /api/people/{id}/movies` reprend ces postes (`Director`, `Writer`, `Screenplay`, `Director of Photography`, `Original Music Composer`, `Editor`). `job=Actor` renvoie les films où la personne joue. Sans `job`, tous ses films sont listés une seule fois.

`region` désigne toujours un pays de diffusion (où regarder le film) et `country` un pays de production.

### Validation

Règles de validation :

- `email` : adresse valide et unique.
- `username` : unique, de 3 à 20 caractères, uniquement des minuscules, des chiffres et `_`.
- `password` : 8 caractères minimum.
- `bio` : 500 caractères maximum, une chaîne vide efface la bio.

Codes de retour utilisés : `200` lecture et modification, `201` création, `401` non connecté ou mauvais identifiants, `404` ressource introuvable, `422` données invalides, dans le corps de la requête comme dans les paramètres de l'URL (avec la liste des champs en erreur dans `violations`). Toutes les erreurs sont renvoyées en JSON.

## Tests

```bash
php bin/phpunit
```

Les tests fonctionnels envoient de vraies requêtes HTTP à l'API. Ils utilisent une base SQLite séparée (`var/data_test.db`), créée automatiquement au premier lancement, et chaque test tourne dans une transaction annulée à la fin. Les commandes TMDB sont testées sans réseau : les appels à TMDB sont remplacés par des réponses enregistrées dans [`tests/Fixtures/tmdb`](tests/Fixtures/tmdb).

## Qualité du code

```bash
vendor/bin/php-cs-fixer fix          # style @Symfony
php bin/console lint:container       # vérification du conteneur de services
```
