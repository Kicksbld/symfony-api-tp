# API

Référence détaillée de l'API : formats de réponse, paramètres de recherche, règles métier et validation. Le tableau de toutes les routes est dans le [README](../README.md#routes).

## Authentification

1. Créer un compte avec `POST /api/register`.
2. Se connecter avec `POST /api/login_check` (email et mot de passe). La réponse contient le `token`, sa durée de vie en secondes (`ttl`, 1 h) et le profil du membre (`user`).
3. Envoyer le token dans l'en-tête `Authorization: Bearer <token>` sur les routes protégées.

Il n'y a pas de refresh token : une fois le token expiré, il faut se reconnecter. Une route protégée appelée sans token valide renvoie une erreur `401`.

## Pagination

Toutes les listes sont paginées avec `?page=1&limit=20` (valeurs par défaut, `limit` va jusqu'à 100) et renvoient le même format :

```json
{
  "items": [],
  "total": 1591,
  "lastPage": 80
}
```

## Recherche dans le catalogue

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

La liste renvoie une vue allégée (titre, titre original, date de sortie, moyenne des membres sur 5 `averageRating`, affiche). La fiche `GET /api/movies/{id}` ajoute le synopsis, la durée en minutes, le nombre de notes des membres (`ratingCount`), la note moyenne TMDB sur 10 (`voteAverage`, à titre indicatif), les genres, les studios, les pays, la distribution avec les rôles (`cast`) et l'équipe avec les postes (`crew`). La liste et la fiche donnent aussi l'image de fond du film (`backdropUrl`, en 1280 pixels de large), utilisée par les grands bandeaux du front. Les images (`posterUrl`, `backdropUrl`, `profileUrl`, `logoUrl`) sont des URL complètes vers TMDB.

## Personnes et studios

La fiche `GET /api/people/{id}` liste les films du plus récent au plus ancien : `cast` contient les rôles joués (`movie` et `character`), `crew` range les films par poste TMDB, par exemple `{ "Director": [...], "Writer": [...] }`.

Le paramètre `job` de `GET /api/people/{id}/movies` reprend ces postes (`Director`, `Writer`, `Screenplay`, `Director of Photography`, `Original Music Composer`, `Editor`). `job=Actor` renvoie les films où la personne joue. Sans `job`, tous ses films sont listés une seule fois.

`region` désigne toujours un pays de diffusion (où regarder le film) et `country` un pays de production.

## Mon état sur un film

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

## Journal et critiques

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
  "likedByMe": true,
  "commentCount": 2,
  "createdAt": "2026-11-25T09:12:00+00:00"
}
```

Seul `movie` est obligatoire à la création. Journaliser un film met à jour mon état sur ce film : il passe en vu et sort de la watchlist, la note et le coup de coeur de l'entrée sont repris s'ils sont renseignés (une entrée sans note ne retire pas la note déjà donnée). Modifier ma dernière entrée sur un film met aussi à jour ma note et mon coup de coeur sur ce film, modifier une entrée plus ancienne n'y touche pas. Supprimer une entrée ne change pas cet état : le film reste vu.

`PATCH /api/log-entries/{id}` ne modifie que les champs envoyés, et `null` efface `watchedOn`, `rating` ou `review`. Seul l'auteur peut modifier ou supprimer son entrée, les autres membres reçoivent une `403`.

Le texte de la critique est toujours renvoyé, même quand `containsSpoilers` vaut `true` : c'est au client de le masquer.

`likedByMe` indique si le membre connecté a liké l'entrée. Il apparaît dans le fil public, le détail d'une entrée, le journal d'un membre et le feed. Sans token, les routes publiques renvoient `false`. Le champ `liked` indique le coup de coeur de l'auteur pour le film.

Paramètres de `GET /api/log-entries`, tous facultatifs et combinables :

| Paramètre | Exemple | Description |
| --- | --- | --- |
| `movie` | `movie=1` | Entrées d'un film |
| `user` | `user=jane_doe` | Entrées d'un membre, par son username |
| `withReview` | `withReview=true` | Seulement les critiques |

## Listes

Une liste a un nom, une description facultative, et peut être classée (`ranked`, un top) ou non, publique ou privée (`public`). Par défaut, une nouvelle liste est publique et non classée. `GET /api/lists/{id}` renvoie par exemple cette fiche.

```json
{
  "id": 7,
  "user": { "id": 3, "username": "jane_doe" },
  "name": "Tout Nolan",
  "description": null,
  "ranked": false,
  "public": true,
  "previewMovies": [
    { "id": 1, "title": "Inception", "originalTitle": "Inception", "releaseDate": "2010-07-15", "averageRating": 4.2, "posterUrl": "https://image.tmdb.org/t/p/w500/...", "backdropUrl": "https://image.tmdb.org/t/p/w1280/..." }
  ],
  "itemCount": 1,
  "likeCount": 4,
  "commentCount": 2,
  "createdAt": "2026-11-25T09:12:00+00:00",
  "likedByMe": false
}
```

`previewMovies` contient les 4 premiers films de la liste, dans son ordre, pour afficher un aperçu des affiches. `likedByMe` indique si le membre connecté a liké la liste. Le champ apparaît aussi sur chaque liste de `GET /api/lists` et `GET /api/users/{username}/lists`. Sans token, il vaut `false`.

Les films de la liste sont dans `GET /api/lists/{id}/items`.

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
| `q` | `q=top` | Cherche dans le nom de la liste |
| `user` | `user=jane_doe` | Listes publiques d'un membre, par son username |
| `movie` | `movie=1` | Listes qui contiennent ce film |
| `sort` | `sort=popular` | `recent` (par défaut, plus récentes d'abord) ou `popular` (plus likées d'abord, puis plus récentes à égalité) |

## Likes et commentaires

Les entrées de journal (et donc les critiques) et les listes se likent et se commentent. Une liste privée ne peut être likée ou commentée que par son auteur : les autres reçoivent une `404`, comme pour la liste elle-même.

`POST /api/log-entries/{id}/like` et `POST /api/lists/{id}/like` renvoient une `201` avec l'entrée ou la liste, son nouveau `likeCount` et `"likedByMe": true`. `DELETE` sur la même route retire le like et renvoie une `204`. Liker deux fois renvoie une `409`, retirer un like absent une `404`.

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

## Profils

`GET /api/users/{username}` renvoie le profil public d'un membre. `followedByMe` indique si le membre connecté suit ce profil. Sans token ou sur son propre profil, il vaut `false`.

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
  "followingCount": 17,
  "followedByMe": true
}
```

`GET /api/me` inclut l'email du compte connecté.

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

## Abonnements et feed

`POST /api/users/{username}/followers` suit un membre et renvoie une `201`, par exemple `{ "id": 3, "username": "jane_doe", "followedByMe": true }`. `DELETE` sur la même route arrête de le suivre et renvoie une `204` sans contenu. Suivre un membre déjà suivi renvoie une `409`, se suivre soi-même une `422`, et ne plus suivre un membre qu'on ne suit pas une `404`.

`GET /api/users`, `/followers` et `/following` renvoient chaque membre au même format que le profil public (bio, favoris, compteurs et `followedByMe`), pour afficher des cartes complètes sans une requête par membre.

`GET /api/feed` renvoie les entrées de journal des membres que je suis, au même format que `GET /api/log-entries` et dans le même ordre : de la dernière entrée créée à la plus ancienne, quelle que soit la date de visionnage. Mes propres entrées n'y apparaissent pas.

## Validation

Règles de validation :

- `email` : adresse valide et unique.
- `username` : unique, de 3 à 20 caractères, uniquement des minuscules, des chiffres et `_`.
- `password` : 8 caractères minimum.
- `bio` : 500 caractères maximum, une chaîne vide efface la bio.
- `rating` : de `0.5` à `5` par pas de `0.5`, ou `null`.
- `watched`, `liked`, `inWatchlist`, `rewatch`, `containsSpoilers` : booléens.
- `movie` : identifiant d'un film existant, une seule fois par liste.
- `watchedOn` : date au format `AAAA-MM-JJ` ou `null`. Le serveur est en UTC et accepte jusqu'au lendemain, pour qu'un membre en avance sur l'UTC (en France après minuit) puisse journaliser à la date de son jour.
- `review` : texte non vide de 10 000 caractères maximum, ou `null`.
- `name` (liste) : texte non vide de 100 caractères maximum.
- `description` (liste) : texte non vide de 1 000 caractères maximum, ou `null`.
- `ranked`, `public` : booléens.
- `note` (film d'une liste) : texte non vide de 1 000 caractères maximum, ou `null`.
- `position` : entier à partir de 1.
- `movies` (favoris) : liste de 4 identifiants de films existants au plus, sans doublon.
- `content` (commentaire) : texte non vide de 1 000 caractères maximum.

Codes de retour utilisés : `200` lecture et modification, `201` création, `204` suppression, `401` non connecté ou mauvais identifiants, `403` ressource d'un autre membre, `404` ressource introuvable, `409` like ou abonnement en double, `422` données invalides, dans le corps de la requête comme dans les paramètres de l'URL (avec la liste des champs en erreur dans `violations`). Toutes les erreurs sont renvoyées en JSON.
