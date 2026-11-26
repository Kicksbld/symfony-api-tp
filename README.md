# Letterboxd

API REST inspirée de [Letterboxd](https://letterboxd.com), réalisée pour le TP Symfony du module CCI DNMADE3. Chaque membre tient un journal des films qu'il regarde, les note, écrit des critiques, fait des listes et suit d'autres membres. Un front React, servi par Symfony, utilise cette API.

**Version en ligne : https://158-178-194-149.sslip.io** (API sous [`/api`](https://158-178-194-149.sslip.io/api/movies))

- [Tester en ligne](#tester-en-ligne)
- [Lancer le projet en local](#lancer-le-projet-en-local)
- [Architecture](#architecture)
- [Ce que fait l'API](#ce-que-fait-lapi)
- [Routes](#routes)
- [Tests et qualité](#tests-et-qualité)
- [Déploiement](#déploiement)

Documentation détaillée : [API](docs/api.md) (formats, filtres, règles métier, validation), [front](docs/front.md) (écrans et parcours de test) et [déploiement](docs/deploiement.md).

## Tester en ligne

Ouvrir https://158-178-194-149.sslip.io et se connecter avec un des comptes de démonstration.

### Comptes de démonstration

Tous ont le mot de passe `demo1234` :

| Username | Email |
| --- | --- |
| `jane_doe` | `jane@example.com` |
| `arthur` | `arthur@example.com` |
| `camille` | `camille@example.com` |
| `leo` | `leo@example.com` |

Ils ont des abonnements, des entrées de journal, des critiques (dont une avec spoilers), des films vus, aimés et en watchlist, des favoris, des listes (dont une privée pour `jane_doe`), des likes et des commentaires.

Quelques choses à essayer avec `jane_doe` :

1. **Catalogue** (`/films`) : chercher un titre, combiner les filtres (genre, période, pays, plateforme, personne) et les tris, puis changer de page.
2. **Fiche film** : marquer le film vu ou aimé, le noter, l'ajouter à la watchlist, puis le journaliser avec une critique.
3. **Activité** (`/feed`) : les entrées des membres suivis par Jane.
4. **Listes** : créer une liste classée, y ajouter des films, les réordonner. Liker et commenter la liste d'`arthur`.
5. **Membres** : suivre `leo`, puis voir ses entrées apparaître dans l'activité.

Côté API, les fichiers [`http/`](http) se lancent directement sur la version en ligne avec l'environnement `prod` (voir [Tester les routes](#tester-les-routes)). Exemple sans token :

```bash
curl "https://158-178-194-149.sslip.io/api/movies?sort=trending&limit=5"
```

## Lancer le projet en local

Prérequis : PHP 8.4 ou plus (extensions `pdo_sqlite`, `ctype`, `iconv`, `openssl`), [Composer](https://getcomposer.org), [Symfony CLI](https://symfony.com/download) et [Node.js](https://nodejs.org) 20.19 ou plus. Pas de Docker ni de serveur de base de données : tout tient dans un fichier SQLite.

```bash
git clone https://github.com/Kicksbld/symfony-api-tp.git
cd symfony-api-tp
composer install
npm install

php bin/console lexik:jwt:generate-keypair                 # clés de signature des tokens JWT (config/jwt/)
php bin/console doctrine:migrations:migrate -n             # base SQLite (var/data_dev.db)
php bin/console app:tmdb:import --from-file --no-debug     # catalogue de 1 765 films depuis data/movies.jsonl
php bin/console app:seed-demo                              # membres de démonstration et leur activité
npm run build                                              # front React (public/build/)

symfony serve -d
```

Le front répond sur http://127.0.0.1:8000 et l'API sur http://127.0.0.1:8000/api. `symfony server:stop` arrête le serveur.

Aucune clé TMDB n'est nécessaire : le catalogue est versionné dans [`data/movies.jsonl`](data/movies.jsonl). L'option `--no-debug` évite que le profiler garde toutes les requêtes SQL en mémoire pendant l'import. Pour repartir de zéro, supprimer `var/data_dev.db` et reprendre à la migration.

Pour travailler sur le front, lancer aussi `npm run dev` : les modifications s'affichent sans recharger la page.

## Architecture

### Parcours d'une requête

```
React (assets/)  ──  JSON + Authorization: Bearer <JWT>  ──▶  /api/...
                                                               │
Controller          #[Route], #[IsGranted] et Voter ───────────┤  401 non connecté, 403 pas l'auteur
                    #[MapRequestPayload] / #[MapQueryString] ──┤  DTO validé avec #[Assert], 422 sinon
                                                               ▼
Service             règles métier (ex. journaliser un film met à jour le suivi du film)
                                                               ▼
Repository          QueryBuilder : recherche, filtres, tri, puis Paginator
                                                               ▼
Doctrine ORM        SQLite
                                                               │
Réponse             $this->json($data, groups) ◀───────────────┘  groupes <entité>:read, <entité>:list, paginate
```

Les contrôleurs restent fins : ils lisent l'entrée (DTO), vérifient les droits et délèguent. Toute requête SQL est dans un repository.

### Organisation du code

| Dossier | Rôle |
| --- | --- |
| [`src/Controller/`](src/Controller) | Un contrôleur `final` par ressource, toutes les routes sous `/api` et nommées `api_<ressource>_<action>`. `FrontController` renvoie la page du front sur les autres adresses. |
| [`src/Dto/`](src/Dto) | Entrées de l'API (`final readonly`) avec leurs contraintes de validation : `CreateMovieListDto`, `MovieSearchDto`, `PaginationDto`... |
| [`src/Entity/`](src/Entity), [`src/Repository/`](src/Repository) | Modèle Doctrine et requêtes. `createdAt` et `updatedAt` sont remplis par des lifecycle callbacks (`TimestampableTrait`). |
| [`src/Service/`](src/Service) | Logique métier : journal, listes, likes, commentaires, abonnements, comptes. [`Tmdb/`](src/Service/Tmdb) importe et exporte le catalogue. |
| [`src/Security/Voter/`](src/Security/Voter) | Qui peut modifier ou supprimer une entrée, une liste, un commentaire. |
| [`src/Validator/`](src/Validator) | Contraintes maison : `StarRating` (0,5 à 5 par demi-étoile), `Username`, `EntityExists`. |
| [`src/Model/`](src/Model) | `Paginator` du cours (format `{ items, total, lastPage }`), conversion des notes, histogramme des notes. |
| [`src/Serializer/`](src/Serializer), [`src/EventListener/`](src/EventListener) | `likedByMe` et `followedByMe`, erreurs toujours en JSON sur `/api`, profil ajouté à la réponse du login. |
| [`src/Command/`](src/Command) | Import et export TMDB, données de démonstration. |
| [`assets/`](assets) | Front React + TypeScript, rangé par fonctionnalité (`features/`), écrans dans `pages/`, client HTTP dans `lib/`. |
| [`http/`](http) | Un fichier `.http` par ressource. |
| [`tests/`](tests) | Tests fonctionnels de l'API et des commandes. |

### Modèle de données

- **Catalogue** (`Movie`, `Person`, `Credit`, `Genre`, `Company`, `Country`, `WatchProvider`) : rempli par l'import TMDB, en lecture seule dans l'API.
- **Suivi d'un film** : `MovieRelationship`, une par membre et par film (vu, aimé, note, watchlist). `LogEntry`, une par visionnage (date, note, revisionnage, critique, spoilers). Une critique est une entrée de journal avec du texte. Journaliser un film met à jour son `MovieRelationship` : vu, retiré de la watchlist, note reprise.
- **Listes** : `MovieList` (publique ou privée, classée ou non) et `MovieListItem` (position et note facultative).
- **Social** : likes (`LogEntryLike`, `MovieListLike`) et commentaires (`LogEntryComment`, `MovieListComment`) en entités séparées, qui partagent `AbstractLike` et `AbstractComment`. Abonnements en relation `User` vers `User`.

### Choix à noter

- **Notes** : l'API reçoit et renvoie des étoiles de `0.5` à `5`, stockées en base en entier de 1 à 10 pour éviter les flottants ([`Rating`](src/Model/Rating.php)).
- **Droits** : modifier la ressource d'un autre membre renvoie `403`. Une liste privée renvoie `404` aux autres, comme si elle n'existait pas.
- **`PATCH` partiel** : un champ absent n'est pas modifié, un champ à `null` est effacé (date, note, critique...).
- **Pas de N+1** : `likedByMe` et `followedByMe` sont calculés en une requête par page, puis ajoutés par [`SocialStateNormalizer`](src/Serializer/SocialStateNormalizer.php).
- **Front** : Symfony sert une seule page Twig et React gère la navigation. Même origine que l'API, donc pas de CORS. Le front ne passe que par l'API, avec le JWT gardé dans le `localStorage`.

## Ce que fait l'API

| Critère du sujet | Dans le projet |
| --- | --- |
| CRUD avec validation | Listes et leurs films, entrées de journal, commentaires, profil et favoris. DTO validés, erreurs `422` avec la liste des champs dans `violations`. |
| Recherche et pagination | `GET /api/movies` : titre, genre, décennie, année, pays, studio, plateforme, personne, et 5 tris (populaires, tendances de la semaine, mieux notés, récents, titre). Recherche aussi sur les entrées de journal, listes, membres et personnes. Toutes les listes sont paginées (`?page=1&limit=20`, 100 au plus). |
| Authentification, interactions et feed | Inscription, connexion JWT (1 h). Notes, vu, aimé et watchlist. Likes et commentaires sur les critiques et les listes, abonnements, `GET /api/feed` avec les entrées des membres suivis. |
| Routes testables | 56 routes, toutes dans les 226 requêtes des fichiers [`http/`](http) (cas valides et cas d'erreur). |

Le détail des formats JSON, des filtres et des règles est dans [docs/api.md](docs/api.md).

## Routes

Connexion : `Oui` demande le header `Authorization: Bearer <token>`, obtenu avec `POST /api/login_check`.

| Méthode | Route | Description | Connexion |
| --- | --- | --- | --- |
| `POST` | `/api/register` | Crée un compte (email, username, mot de passe) | Non |
| `POST` | `/api/login_check` | Se connecte et renvoie le token JWT avec le profil | Non |
| `GET` | `/api/me` | Profil du membre connecté | Oui |
| `PATCH` | `/api/me` | Modifie le username et la bio | Oui |
| `PUT` | `/api/me/favorites` | Remplace mes 4 films favoris, dans l'ordre | Oui |
| `GET` | `/api/users` | Membres, recherche par username (`?q=`) | Non |
| `GET` | `/api/users/{username}` | Profil public : bio, favoris, compteurs | Non |
| `GET` | `/api/users/{username}/diary` | Journal, filtrable par année et mois | Non |
| `GET` | `/api/users/{username}/watched` | Films vus | Non |
| `GET` | `/api/users/{username}/likes` | Films aimés | Non |
| `GET` | `/api/users/{username}/watchlist` | Watchlist | Non |
| `GET` | `/api/users/{username}/lists` | Listes (les privées seulement pour leur auteur) | Non |
| `GET` | `/api/users/{username}/followers` | Abonnés | Non |
| `GET` | `/api/users/{username}/following` | Abonnements | Non |
| `POST` | `/api/users/{username}/followers` | Suit un membre | Oui |
| `DELETE` | `/api/users/{username}/followers` | Ne suit plus un membre | Oui |
| `GET` | `/api/feed` | Entrées de journal des membres suivis | Oui |
| `GET` | `/api/movies` | Films, avec recherche, filtres et tri | Non |
| `GET` | `/api/movies/{id}` | Fiche complète d'un film | Non |
| `GET` | `/api/movies/{id}/ratings` | Histogramme et moyenne des notes des membres | Non |
| `GET` | `/api/movies/{id}/relationship` | Mon état sur le film : vu, aimé, note, watchlist | Oui |
| `PATCH` | `/api/movies/{id}/relationship` | Modifie mon état sur le film | Oui |
| `GET` | `/api/movies/{id}/watch-providers` | Où regarder le film (`?region=FR` par défaut) | Non |
| `GET` | `/api/log-entries` | Fil public, filtrable par film, membre et critiques | Non |
| `POST` | `/api/log-entries` | Journalise un film (date, note, coup de cœur, critique) | Oui |
| `GET` | `/api/log-entries/{id}` | Une entrée de journal | Non |
| `PATCH` | `/api/log-entries/{id}` | Modifie une de mes entrées | Oui, auteur |
| `DELETE` | `/api/log-entries/{id}` | Supprime une de mes entrées | Oui, auteur |
| `POST` | `/api/log-entries/{id}/like` | Like une entrée | Oui |
| `DELETE` | `/api/log-entries/{id}/like` | Retire mon like | Oui |
| `GET` | `/api/log-entries/{id}/comments` | Commentaires d'une entrée | Non |
| `POST` | `/api/log-entries/{id}/comments` | Commente une entrée | Oui |
| `PATCH` | `/api/log-entries/{id}/comments/{commentId}` | Modifie mon commentaire | Oui, auteur du commentaire |
| `DELETE` | `/api/log-entries/{id}/comments/{commentId}` | Supprime un commentaire | Oui, auteur du commentaire ou de l'entrée |
| `GET` | `/api/lists` | Listes publiques, recherche par nom, membre et film | Non |
| `POST` | `/api/lists` | Crée une liste | Oui |
| `GET` | `/api/lists/{id}` | Une liste (privée : visible par son auteur seulement) | Non |
| `PATCH` | `/api/lists/{id}` | Modifie une de mes listes | Oui, auteur |
| `DELETE` | `/api/lists/{id}` | Supprime une de mes listes | Oui, auteur |
| `GET` | `/api/lists/{id}/items` | Films d'une liste, dans l'ordre | Non |
| `POST` | `/api/lists/{id}/items` | Ajoute un film à une de mes listes | Oui, auteur |
| `PATCH` | `/api/lists/{id}/items/{itemId}` | Change la position ou la note d'un film | Oui, auteur |
| `DELETE` | `/api/lists/{id}/items/{itemId}` | Retire un film d'une de mes listes | Oui, auteur |
| `POST` | `/api/lists/{id}/like` | Like une liste | Oui |
| `DELETE` | `/api/lists/{id}/like` | Retire mon like | Oui |
| `GET` | `/api/lists/{id}/comments` | Commentaires d'une liste | Non |
| `POST` | `/api/lists/{id}/comments` | Commente une liste | Oui |
| `PATCH` | `/api/lists/{id}/comments/{commentId}` | Modifie mon commentaire | Oui, auteur du commentaire |
| `DELETE` | `/api/lists/{id}/comments/{commentId}` | Supprime un commentaire | Oui, auteur du commentaire ou de la liste |
| `GET` | `/api/people` | Personnes, recherche par nom (`?q=`) | Non |
| `GET` | `/api/people/{id}` | Fiche d'une personne : rôles et postes | Non |
| `GET` | `/api/people/{id}/movies` | Films d'une personne, filtrables par poste (`?job=Director`) | Non |
| `GET` | `/api/companies/{id}` | Fiche d'un studio | Non |
| `GET` | `/api/genres` | Genres | Non |
| `GET` | `/api/countries` | Pays de production | Non |
| `GET` | `/api/watch-providers` | Plateformes d'un pays (`?region=FR` par défaut) | Non |

Les routes qui renvoient une liste sont paginées. Codes de retour : `200` lecture et modification, `201` création, `204` suppression, `401` non connecté, `403` ressource d'un autre membre, `404` introuvable, `409` like ou abonnement en double, `422` données invalides. Toutes les erreurs sont en JSON.

## Tester les routes

Le dossier [`http/`](http) contient un fichier `.http` par ressource, avec des requêtes valides et des cas d'erreur (le code attendu est dans le titre de chaque requête). Ils s'ouvrent dans PhpStorm, ou dans VS Code avec une extension compatible, avec l'environnement `dev` (local) ou `prod` (version en ligne), définis dans [`http-client.env.json`](http/http-client.env.json).

1. Lancer la connexion de [`auth.http`](http/auth.http) : le token de `jane_doe` est enregistré et réutilisé par les autres fichiers pendant 1 h.
2. Lancer les requêtes d'un fichier de haut en bas. [`list-items.http`](http/list-items.http), [`likes.http`](http/likes.http) et [`comments.http`](http/comments.http) utilisent la liste créée dans [`lists.http`](http/lists.http).

Les identifiants utilisés (films, personnes...) sont ceux d'une base installée comme plus haut.

## Tests et qualité

```bash
php bin/phpunit                      # 269 tests fonctionnels
vendor/bin/php-cs-fixer fix          # style @Symfony
php bin/console lint:container       # conteneur de services
npm run lint                         # ESLint sur le front
npm run build                        # types TypeScript, puis build du front
```

Les tests envoient de vraies requêtes JSON à l'API, avec un JWT pour les routes protégées. Ils utilisent une base séparée (`var/data_test.db`, créée au premier lancement), et chaque test tourne dans une transaction annulée à la fin. Les commandes TMDB sont testées sans réseau, avec des réponses enregistrées dans [`tests/Fixtures/tmdb`](tests/Fixtures/tmdb).

## Commandes

| Commande | Description |
| --- | --- |
| `php bin/console app:tmdb:import --from-file --no-debug` | Charge `data/movies.jsonl`, sans appel à TMDB |
| `php bin/console app:tmdb:import --no-debug` | Importe depuis TMDB les films populaires et les mieux notés (`--pages=5` pour en prendre moins) |
| `php bin/console app:tmdb:export --no-debug` | Écrit le catalogue de la base dans `data/movies.jsonl` |
| `php bin/console app:tmdb:refresh-providers --no-debug` | Met à jour les plateformes de streaming des films en base |
| `php bin/console app:seed-demo` | Crée les membres de démonstration et leur activité (sans doublon si relancée) |

Relancer un import met à jour les films existants au lieu de les dupliquer. Seules les commandes qui appellent TMDB demandent une clé : créer un compte sur [themoviedb.org](https://www.themoviedb.org/signup), demander une clé dans [Paramètres > API](https://www.themoviedb.org/settings/api), puis copier le « Jeton d'accès en lecture à l'API » (celui qui commence par `eyJ`) dans `.env.local` :

```dotenv
TMDB_API_TOKEN=eyJ...
```

## Déploiement

La version en ligne tourne sur une VM gratuite Oracle Cloud (2 cœurs ARM, 12 Go de RAM) avec [FrankenPHP](https://frankenphp.dev), qui gère aussi le HTTPS. La configuration est dans [`deploy/`](deploy). Pour mettre en ligne la version locale :

```bash
deploy/deploy.sh ubuntu@158.178.194.149 ~/.ssh/oracle_tp
```

Le script construit le front, envoie les fichiers, installe les dépendances, lance les migrations et redémarre le serveur. La base et les secrets restent sur la VM. L'installation complète du serveur est dans [docs/deploiement.md](docs/deploiement.md).

## Stack

PHP 8.4+, Symfony 8.1, Doctrine ORM avec SQLite, LexikJWTAuthenticationBundle, HttpClient (TMDB), PHPUnit avec dama/doctrine-test-bundle et Foundry. Front : React, TypeScript, [shadcn/ui](https://ui.shadcn.com) et Tailwind CSS, construits par Vite avec [pentatrion/vite-bundle](https://symfony-vite.pentatrion.com/fr/).
