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
| `PUT` | `/api/me/favorites` | Remplace mes 4 films favoris, dans l'ordre d'affichage | Oui |
| `GET` | `/api/users` | Liste paginée des membres, avec recherche par username (`?q=`) | Non |
| `GET` | `/api/users/{username}` | Profil public d'un membre : bio, 4 favoris, nombre de films vus, d'abonnés et d'abonnements | Non |
| `GET` | `/api/users/{username}/diary` | Journal paginé du membre, filtrable par année et mois (`?year=2026&month=11`) | Non |
| `GET` | `/api/users/{username}/watched` | Liste paginée des films vus par le membre, avec sa note | Non |
| `GET` | `/api/users/{username}/likes` | Liste paginée des films aimés par le membre | Non |
| `GET` | `/api/users/{username}/watchlist` | Watchlist paginée du membre | Non |
| `GET` | `/api/users/{username}/lists` | Listes paginées du membre (les privées seulement pour lui-même) | Non |
| `GET` | `/api/users/{username}/followers` | Abonnés paginés du membre, triés par username | Non |
| `GET` | `/api/users/{username}/following` | Membres suivis paginés, triés par username | Non |
| `POST` | `/api/users/{username}/followers` | Suit un membre : je m'ajoute à ses abonnés | Oui |
| `DELETE` | `/api/users/{username}/followers` | Ne suit plus un membre : je me retire de ses abonnés | Oui |
| `GET` | `/api/feed` | Feed paginé : entrées de journal des membres suivis, de la plus récente à la plus ancienne | Oui |
| `GET` | `/api/movies` | Liste paginée des films, avec recherche, filtres et tri | Non |
| `GET` | `/api/movies/{id}` | Fiche complète d'un film | Non |
| `GET` | `/api/movies/{id}/ratings` | Répartition des notes des membres sur le film : histogramme, nombre de notes et moyenne | Non |
| `GET` | `/api/movies/{id}/relationship` | Mon état sur le film : vu, aimé, note, watchlist | Oui |
| `PATCH` | `/api/movies/{id}/relationship` | Modifie mon état sur le film | Oui |
| `GET` | `/api/movies/{id}/watch-providers` | Plateformes où regarder le film dans un pays (`?region=FR` par défaut), par type d'offre | Non |
| `GET` | `/api/log-entries` | Fil public paginé des entrées de journal, du plus récent au plus ancien, filtrable par film, membre et critiques | Non |
| `POST` | `/api/log-entries` | Journalise un film : date, note, coup de coeur, revisionnage, critique | Oui |
| `GET` | `/api/log-entries/{id}` | Une entrée de journal | Non |
| `PATCH` | `/api/log-entries/{id}` | Modifie une de mes entrées | Oui, auteur |
| `DELETE` | `/api/log-entries/{id}` | Supprime une de mes entrées | Oui, auteur |
| `POST` | `/api/log-entries/{id}/like` | Like une entrée de journal | Oui |
| `DELETE` | `/api/log-entries/{id}/like` | Retire mon like d'une entrée de journal | Oui |
| `GET` | `/api/log-entries/{id}/comments` | Commentaires paginés d'une entrée, du plus ancien au plus récent | Non |
| `POST` | `/api/log-entries/{id}/comments` | Commente une entrée de journal | Oui |
| `PATCH` | `/api/log-entries/{id}/comments/{commentId}` | Modifie un de mes commentaires | Oui, auteur du commentaire |
| `DELETE` | `/api/log-entries/{id}/comments/{commentId}` | Supprime un commentaire | Oui, auteur du commentaire ou de l'entrée |
| `GET` | `/api/lists` | Liste paginée des listes publiques, des plus récentes ou des plus likées, avec recherche par nom et filtres par membre et par film | Non |
| `POST` | `/api/lists` | Crée une liste : nom, description, classée ou non, publique ou privée | Oui |
| `GET` | `/api/lists/{id}` | Une liste (une liste privée n'est visible que par son auteur) | Non |
| `PATCH` | `/api/lists/{id}` | Modifie une de mes listes | Oui, auteur |
| `DELETE` | `/api/lists/{id}` | Supprime une de mes listes avec ses films | Oui, auteur |
| `GET` | `/api/lists/{id}/items` | Liste paginée des films d'une liste, dans l'ordre | Non |
| `POST` | `/api/lists/{id}/items` | Ajoute un film à la fin d'une de mes listes, avec une note facultative | Oui, auteur |
| `PATCH` | `/api/lists/{id}/items/{itemId}` | Change la position ou la note d'un film dans une de mes listes | Oui, auteur |
| `DELETE` | `/api/lists/{id}/items/{itemId}` | Retire un film d'une de mes listes | Oui, auteur |
| `POST` | `/api/lists/{id}/like` | Like une liste | Oui |
| `DELETE` | `/api/lists/{id}/like` | Retire mon like d'une liste | Oui |
| `GET` | `/api/lists/{id}/comments` | Commentaires paginés d'une liste, du plus ancien au plus récent | Non |
| `POST` | `/api/lists/{id}/comments` | Commente une liste | Oui |
| `PATCH` | `/api/lists/{id}/comments/{commentId}` | Modifie un de mes commentaires | Oui, auteur du commentaire |
| `DELETE` | `/api/lists/{id}/comments/{commentId}` | Supprime un commentaire | Oui, auteur du commentaire ou de la liste |
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
| `sort` | `sort=title` | `popular` (par défaut, score de popularité TMDB), `trending` (films les plus journalisés par les membres ces 7 derniers jours, puis par popularité TMDB à égalité), `rating` (moyenne des membres, films sans note à la fin), `releaseDate` (plus récents d'abord) ou `title` |

La liste renvoie une vue allégée (titre, titre original, date de sortie, moyenne des membres sur 5 `averageRating`, affiche). La fiche `GET /api/movies/{id}` ajoute le synopsis, la durée en minutes, le nombre de notes des membres (`ratingCount`), la note moyenne TMDB sur 10 (`voteAverage`, à titre indicatif), les genres, les studios, les pays, la distribution avec les rôles (`cast`) et l'équipe avec les postes (`crew`). Les images (`posterUrl`, `profileUrl`, `logoUrl`) sont des URL complètes vers TMDB.

### Personnes et studios

La fiche `GET /api/people/{id}` liste les films du plus récent au plus ancien : `cast` contient les rôles joués (`movie` et `character`), `crew` range les films par poste TMDB, par exemple `{ "Director": [...], "Writer": [...] }`.

Le paramètre `job` de `GET /api/people/{id}/movies` reprend ces postes (`Director`, `Writer`, `Screenplay`, `Director of Photography`, `Original Music Composer`, `Editor`). `job=Actor` renvoie les films où la personne joue. Sans `job`, tous ses films sont listés une seule fois.

`region` désigne toujours un pays de diffusion (où regarder le film) et `country` un pays de production.

### Mon état sur un film

`GET /api/movies/{id}/relationship` renvoie l'état du membre connecté sur un film :

```json
{
  "watched": true,
  "liked": false,
  "rating": 4.5,
  "inWatchlist": false
}
```

Tant que le membre n'a rien modifié, les valeurs par défaut sont renvoyées (`false` et `rating` à `null`). `PATCH` ne modifie que les champs envoyés. `rating` va de `0.5` à `5` par demi-étoile, et `null` retire la note.

`GET /api/movies/{id}/ratings` donne la répartition des notes des membres (la note actuelle de chacun) :

```json
{
  "histogram": [
    { "rating": 0.5, "count": 1 },
    { "rating": 1, "count": 0 },
    "...",
    { "rating": 5, "count": 12 }
  ],
  "count": 27,
  "average": 3.85
}
```

### Journal et critiques

Chaque visionnage est une entrée de journal. Une critique est simplement une entrée avec du texte dans `review` :

```json
{
  "id": 12,
  "user": { "id": 3, "username": "jane_doe" },
  "movie": { "id": 1, "title": "Inception", "originalTitle": "Inception", "releaseDate": "2010-07-15", "averageRating": 4.2, "posterUrl": "https://image.tmdb.org/t/p/w500/..." },
  "watchedOn": "2026-11-20",
  "rating": 4.5,
  "liked": true,
  "rewatch": false,
  "review": "Un rêve dans un rêve.",
  "containsSpoilers": false,
  "likeCount": 4,
  "commentCount": 2,
  "createdAt": "2026-11-25T09:12:00+00:00"
}
```

Seul `movie` est obligatoire à la création. Journaliser un film met à jour mon état sur ce film : il passe en vu et sort de la watchlist, la note et le coup de coeur de l'entrée sont repris s'ils sont renseignés (une entrée sans note ne retire pas la note déjà donnée). Modifier ma dernière entrée sur un film met aussi à jour ma note et mon coup de coeur sur ce film, modifier une entrée plus ancienne n'y touche pas. Supprimer une entrée ne change pas cet état : le film reste vu.

`PATCH /api/log-entries/{id}` ne modifie que les champs envoyés, et `null` efface `watchedOn`, `rating` ou `review`. Seul l'auteur peut modifier ou supprimer son entrée, les autres membres reçoivent une `403`.

Le texte de la critique est toujours renvoyé, même quand `containsSpoilers` vaut `true` : c'est au client de le masquer.

Paramètres de `GET /api/log-entries`, tous facultatifs et combinables :

| Paramètre | Exemple | Description |
| --- | --- | --- |
| `movie` | `movie=1` | Entrées d'un film |
| `user` | `user=jane_doe` | Entrées d'un membre, par son username |
| `withReview` | `withReview=true` | Seulement les critiques |

### Listes

Une liste a un nom, une description facultative, et peut être classée (`ranked`, un top) ou non, publique ou privée (`public`). Par défaut, une nouvelle liste est publique et non classée. La fiche d'une liste donne son nombre de films (`itemCount`), de likes (`likeCount`) et de commentaires (`commentCount`), les films eux-mêmes sont dans `GET /api/lists/{id}/items` :

```json
{
  "items": [
    {
      "id": 7,
      "movie": { "id": 1, "title": "Inception", "originalTitle": "Inception", "releaseDate": "2010-07-15", "averageRating": 4.2, "posterUrl": "https://image.tmdb.org/t/p/w500/..." },
      "position": 1,
      "note": "Le plus abouti."
    }
  ],
  "total": 1,
  "lastPage": 1
}
```

Un film ne peut être qu'une fois dans une liste. Il est ajouté à la fin, et `PATCH` sur l'élément le déplace : les autres films se décalent pour que les positions restent continues de 1 au nombre de films. Une position au-delà de la fin place le film en dernier. Retirer un film fait remonter ceux qui le suivent. Les positions existent aussi pour une liste non classée : elles donnent l'ordre d'affichage.

Une liste privée n'est visible que par son auteur : tous les autres reçoivent une `404` sur la liste et ses films, comme si elle n'existait pas, et elle n'apparaît jamais dans `GET /api/lists`. Seul l'auteur peut modifier ou supprimer sa liste et ses films, les autres membres reçoivent une `403` sur une liste publique.

`PATCH /api/lists/{id}` ne modifie que les champs envoyés, et `null` efface la description. De même, `null` efface la note d'un film.

Paramètres de `GET /api/lists`, tous facultatifs et combinables :

| Paramètre | Exemple | Description |
| --- | --- | --- |
| `q` | `q=nolan` | Cherche dans le nom de la liste |
| `user` | `user=jane_doe` | Listes publiques d'un membre, par son username |
| `movie` | `movie=1` | Listes qui contiennent ce film |
| `sort` | `sort=popular` | `recent` (par défaut, plus récentes d'abord) ou `popular` (plus likées d'abord, puis plus récentes à égalité) |

### Likes et commentaires

Les entrées de journal (et donc les critiques) et les listes se likent et se commentent. Une liste privée ne peut être likée ou commentée que par son auteur : les autres reçoivent une `404`, comme pour la liste elle-même.

`POST /api/log-entries/{id}/like` et `POST /api/lists/{id}/like` renvoient une `201` avec l'entrée ou la liste likée, pour avoir son nouveau `likeCount`. `DELETE` sur la même route retire le like et renvoie une `204`. Liker deux fois renvoie une `409`, retirer un like absent une `404`.

Un commentaire contient de 1 à 1000 caractères. `updatedAt` permet de savoir qu'il a été modifié :

```json
{
  "id": 5,
  "user": { "id": 4, "username": "arthur" },
  "content": "La toupie tombe, non ?",
  "createdAt": "2026-11-25T10:02:00+00:00",
  "updatedAt": "2026-11-25T10:02:00+00:00"
}
```

Seul l'auteur d'un commentaire peut le modifier. Il peut aussi le supprimer, tout comme l'auteur de l'entrée ou de la liste commentée, pour modérer ce qui est écrit chez lui. Les autres membres reçoivent une `403`.

### Profils

`GET /api/users/{username}` renvoie le profil public d'un membre. `GET /api/me` renvoie le même profil avec l'email en plus :

```json
{
  "id": 3,
  "username": "jane_doe",
  "bio": "Surtout des films d'horreur.",
  "favorites": [
    { "id": 1, "title": "Inception", "originalTitle": "Inception", "releaseDate": "2010-07-15", "averageRating": 4.2, "posterUrl": "https://image.tmdb.org/t/p/w500/..." }
  ],
  "watchedCount": 128,
  "followersCount": 42,
  "followingCount": 17
}
```

`PUT /api/me/favorites` remplace tous les favoris d'un coup avec `{ "movies": [1, 2, 3, 4] }` : 4 films au plus, sans doublon, dans l'ordre d'affichage. Une liste vide retire tous les favoris. La réponse est la nouvelle liste des favoris.

Le journal (`/diary`) ne contient que les entrées datées (`watchedOn`), de la plus récente à la plus ancienne, comme sur Letterboxd. `year` filtre sur une année, `month` (de 1 à 12) sur un mois de cette année et demande donc `year`.

`/watched`, `/likes` et `/watchlist` renvoient l'état du membre sur chaque film, du plus récemment modifié au plus ancien :

```json
{
  "items": [
    {
      "movie": { "id": 1, "title": "Inception", "originalTitle": "Inception", "releaseDate": "2010-07-15", "averageRating": 4.2, "posterUrl": "https://image.tmdb.org/t/p/w500/..." },
      "watched": true,
      "liked": true,
      "rating": 4.5,
      "inWatchlist": false
    }
  ],
  "total": 1,
  "lastPage": 1
}
```

`/lists` ne montre que les listes publiques, sauf quand le membre consulte son propre profil en étant connecté : ses listes privées sont alors incluses.

### Abonnements et feed

`POST /api/users/{username}/followers` suit un membre et renvoie une `201` avec le membre suivi (`id` et `username`). `DELETE` sur la même route arrête de le suivre et renvoie une `204` sans contenu. Suivre un membre déjà suivi renvoie une `409`, se suivre soi-même une `422`, et ne plus suivre un membre qu'on ne suit pas une `404`.

`/followers` et `/following` renvoient des membres au même format que `GET /api/users` (`id` et `username`).

`GET /api/feed` renvoie les entrées de journal des membres que je suis, au même format que `GET /api/log-entries` et dans le même ordre : de la dernière entrée créée à la plus ancienne, quelle que soit la date de visionnage. Mes propres entrées n'y apparaissent pas.

### Validation

Règles de validation :

- `email` : adresse valide et unique.
- `username` : unique, de 3 à 20 caractères, uniquement des minuscules, des chiffres et `_`.
- `password` : 8 caractères minimum.
- `bio` : 500 caractères maximum, une chaîne vide efface la bio.
- `rating` : de `0.5` à `5` par pas de `0.5`, ou `null`.
- `watched`, `liked`, `inWatchlist`, `rewatch`, `containsSpoilers` : booléens.
- `movie` : identifiant d'un film existant, une seule fois par liste.
- `watchedOn` : date au format `AAAA-MM-JJ`, pas dans le futur, ou `null`.
- `review` : texte non vide de 10 000 caractères maximum, ou `null`.
- `name` (liste) : texte non vide de 100 caractères maximum.
- `description` (liste) : texte non vide de 1 000 caractères maximum, ou `null`.
- `ranked`, `public` : booléens.
- `note` (film d'une liste) : texte non vide de 1 000 caractères maximum, ou `null`.
- `position` : entier à partir de 1.
- `movies` (favoris) : liste de 4 identifiants de films existants au plus, sans doublon.
- `content` (commentaire) : texte non vide de 1 000 caractères maximum.

Codes de retour utilisés : `200` lecture et modification, `201` création, `204` suppression, `401` non connecté ou mauvais identifiants, `403` ressource d'un autre membre, `404` ressource introuvable, `409` like ou abonnement en double, `422` données invalides, dans le corps de la requête comme dans les paramètres de l'URL (avec la liste des champs en erreur dans `violations`). Toutes les erreurs sont renvoyées en JSON.

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
