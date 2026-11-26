# Letterboxd

API REST inspirée de [Letterboxd](https://letterboxd.com), réalisée pour le TP Symfony du module CCI DNMADE3. Chaque membre peut tenir un journal des films qu'il regarde, les noter, écrire des critiques, faire des listes et suivre d'autres membres.

Le projet contient :

- une API REST : toutes les routes sont sous `/api`, renvoient du JSON et sont testables avec les fichiers du dossier [`http/`](http) ;
- un front React servi par Symfony sur toutes les autres adresses, qui appelle cette API depuis le navigateur.

## Stack

- PHP 8.4 ou plus et Symfony 8.1
- Doctrine ORM avec une base SQLite (aucun serveur de base de données à installer)
- LexikJWTAuthenticationBundle pour l'authentification par token JWT
- HttpClient pour l'import du catalogue depuis [TMDB](https://www.themoviedb.org)
- PHPUnit, dama/doctrine-test-bundle et Foundry pour les tests
- Front : React, TypeScript, [shadcn/ui](https://ui.shadcn.com) et Tailwind CSS, construits par [Vite](https://vite.dev) avec [pentatrion/vite-bundle](https://symfony-vite.pentatrion.com/fr/)

## Prérequis

- PHP 8.4 ou plus avec les extensions `pdo_sqlite`, `ctype`, `iconv` et `openssl`
- [Composer](https://getcomposer.org)
- [Symfony CLI](https://symfony.com/download) pour lancer le serveur local
- [Node.js](https://nodejs.org) 20.19 ou plus avec npm, pour le front

## Installation

```bash
git clone https://github.com/Kicksbld/symfony-api-tp.git
cd symfony-api-tp
composer install
npm install

# Clés utilisées pour signer les tokens JWT (dans config/jwt/, non versionnées)
php bin/console lexik:jwt:generate-keypair

# Création de la base SQLite (var/data_dev.db)
php bin/console doctrine:migrations:migrate -n

# Chargement du catalogue de films depuis data/movies.jsonl, sans clé TMDB
php bin/console app:tmdb:import --from-file --no-debug

# Membres de démonstration et leur activité
php bin/console app:seed-demo

# Construction du front (dans public/build/, non versionné)
npm run build
```

Aucune clé TMDB n'est nécessaire. L'option `--no-debug` est importante : en mode debug, Symfony garde en mémoire toutes les requêtes SQL pour le profiler, et l'import du catalogue complet dépasse alors la limite de mémoire de PHP.

## Comptes de démonstration

`app:seed-demo` crée 4 membres, qui ont tous le mot de passe `demo1234` :

| Username | Email |
| --- | --- |
| `jane_doe` | `jane@example.com` |
| `arthur` | `arthur@example.com` |
| `camille` | `camille@example.com` |
| `leo` | `leo@example.com` |

Ils ont des abonnements, des entrées de journal et des critiques, des films vus, aimés et en watchlist, des favoris, des listes (dont une privée pour `jane_doe`), des likes et des commentaires. Les dates de visionnage sont calculées à partir du jour du lancement, pour que le tri des films tendances ait du contenu.

La commande utilise les films les plus populaires du catalogue en base, qui doit donc être chargé avant. Si un des membres de démo existe déjà (même username ou même email), elle ne crée rien : on peut la relancer sans risque de doublon.

## Catalogue de films

Les films, genres, studios, pays, personnes, crédits et plateformes de streaming viennent de [TMDB](https://www.themoviedb.org). Le catalogue est en lecture seule dans l'API : il est rempli uniquement par les commandes ci-dessous.

### Sans clé TMDB

Le dépôt contient un export du catalogue dans [`data/movies.jsonl`](data/movies.jsonl) (un film par ligne, au format des réponses TMDB). Pour le charger :

```bash
php bin/console app:tmdb:import --from-file --no-debug
```

Aucune requête n'est envoyée à TMDB. On peut aussi passer un autre fichier : `--from-file=chemin/vers/fichier.jsonl`. L'import et l'export du catalogue complet se lancent avec `--no-debug` (voir [Installation](#installation)).

### Avec une clé TMDB

1. Créer un compte sur [themoviedb.org](https://www.themoviedb.org/signup).
2. Dans [Paramètres > API](https://www.themoviedb.org/settings/api), demander une clé (usage personnel ou éducatif).
3. Copier le « Jeton d'accès en lecture à l'API » (le long jeton qui commence par `eyJ`, pas la « Clé d'API » courte).
4. Le coller dans un fichier `.env.local` à la racine du projet (non versionné) :

```dotenv
TMDB_API_TOKEN=eyJ...
```

## Commandes

| Commande | Description |
| --- | --- |
| `php bin/console app:tmdb:import --no-debug` | Importe les films populaires et les mieux notés depuis TMDB, avec leurs détails, la distribution (15 premiers acteurs), l'équipe (réalisateur, scénariste, chef opérateur, compositeur, monteur), les studios, les pays de production et les plateformes pour FR, BE, CH, CA et US. |
| `php bin/console app:tmdb:import --pages=5 --no-debug` | Même chose en limitant le nombre de pages lues dans chaque liste TMDB (20 films par page, 50 pages par défaut). |
| `php bin/console app:tmdb:import --from-file --no-debug` | Charge `data/movies.jsonl` sans appeler TMDB. |
| `php bin/console app:tmdb:export --no-debug` | Écrit le catalogue de la base dans `data/movies.jsonl` (ou dans le fichier donné avec `--output`). |
| `php bin/console app:tmdb:refresh-providers --no-debug` | Met à jour uniquement les plateformes de streaming des films déjà en base. |
| `php bin/console app:seed-demo` | Crée les [membres de démonstration](#comptes-de-démonstration) et leur activité à partir du catalogue en base. |

Les films sont retrouvés par leur identifiant TMDB : relancer un import met à jour les films existants au lieu de créer des doublons. Seules les commandes qui appellent TMDB demandent `TMDB_API_TOKEN`.

## Lancement

```bash
symfony serve -d
```

Le front répond sur `http://127.0.0.1:8000` et l'API sur `http://127.0.0.1:8000/api`. Pour arrêter le serveur : `symfony server:stop`.

Le front utilise les fichiers construits par `npm run build`. Pour travailler dessus, lancer aussi le serveur de Vite dans un second terminal : les modifications sont alors visibles sans recharger la page.

```bash
npm run dev
```

### Front

Symfony renvoie la même page sur toutes les adresses hors `/api` ([`FrontController`](src/Controller/FrontController.php)), et React choisit la page à afficher selon l'adresse : recharger `/login` fonctionne donc comme ouvrir `/`. Le front et l'API sont sur la même origine, il n'y a pas de CORS à configurer.

Le code est dans [`assets/`](assets) :

| Dossier | Contenu |
| --- | --- |
| `pages/` | Composition des écrans par route et lecture des filtres ou de la page dans l’URL |
| `features/` | Composants, requêtes et mutations propres à chaque fonctionnalité |
| `components/` | Mise en page (en-tête, pied de page, écrans de connexion) et composants partagés (pagination numérotée, état vide) |
| `components/ui/` | Composants [shadcn/ui](https://ui.shadcn.com), ajoutés avec `npx shadcn add <composant>` |
| `lib/` | Client HTTP de l'API, configuration de TanStack Query, état de la session et types partagés |

#### En-tête et recherche globale

L'en-tête reste visible en haut de chaque page. Il donne accès aux sections du site, à la recherche et au compte : boutons « Connexion » et « Créer un compte » pour un visiteur, menu avec avatar pour un membre (profil, journal, watchlist, listes, modification du profil, déconnexion). Sur mobile, la navigation s'ouvre dans un panneau latéral.

La recherche s'ouvre avec le champ de l'en-tête ou le raccourci `Ctrl K` (`Cmd K` sur Mac). Les résultats arrivent pendant la frappe, 300 ms après la dernière touche et à partir de 2 caractères, sans bouton à valider : 5 films, 5 personnes et 5 membres, lus en parallèle avec `GET /api/movies`, `GET /api/people` et `GET /api/users`. Les flèches du clavier parcourent les résultats et `Entrée` ouvre la page choisie. Un lien mène au catalogue filtré sur le titre tapé quand il y a plus de 5 films.

Les membres n'ont pas de photo : leur avatar affiche les deux premières lettres du pseudo sur une couleur tirée du pseudo, toujours la même pour un membre donné.

#### Inscription et connexion

`/login` et `/register` s'affichent en plein écran, sans la navigation, à côté d'un mur d'affiches des films populaires qui défile lentement (l'animation est coupée quand le système demande de réduire les animations). Les identifiants du compte de démo ne sont donnés que dans ce README.


`/register` crée un compte avec `POST /api/register`, puis ouvre la session avec `POST /api/login_check`. Les erreurs de validation renvoyées par l'API s'affichent sous les champs concernés. Si le compte est créé mais que la connexion échoue, la page propose de se connecter avec l'email déjà rempli.

La page d'origine passe d'un écran à l'autre dans le paramètre `redirect` (par exemple `/login?redirect=%2F%3Fpage%3D2`), avec son chemin et ses paramètres. Seuls les chemins du site sont acceptés : une adresse externe ou absente renvoie vers l'accueil. Quand l'API refuse le token (`401`), le membre est renvoyé vers `/login` et revient ensuite sur la page où il était. Le retour ne rejoue aucune action : le membre la relance lui-même.

#### Accueil

L'accueil `/` s'ouvre sur un carrousel plein écran des 5 films les plus journalisés de la semaine (`GET /api/movies?sort=trending`, seuls les films avec une image de fond sont gardés). Les films défilent toutes les 8 secondes. Le défilement s'arrête au survol, au focus clavier, avec le bouton pause, et ne démarre pas quand le système demande de réduire les animations. Le tri « tendances » départage par popularité TMDB : sans activité récente, le carrousel montre les films populaires.

Viennent ensuite des rangées qui défilent au doigt, à la souris ou avec leurs flèches, chacune avec un lien « Tout voir » : le top 10 de la semaine, les critiques récentes (`GET /api/log-entries?withReview=true`), les films populaires, les genres (chaque tuile ouvre le catalogue filtré), les listes les plus likées et les films les mieux notés par les membres. Un membre connecté voit en premier ce que ses abonnements ont vu (`GET /api/feed`). Une rangée sans contenu ou en erreur ne s'affiche pas, pour ne pas bloquer le reste de la page.

#### Catalogue

`/films` liste les films avec `GET /api/movies`, triés par popularité par défaut. Le titre se cherche pendant la frappe : la recherche part 300 ms après la dernière touche, sans bouton à valider, et remplace l'adresse au lieu d'ajouter une entrée d'historique par mot. Les filtres sont des pastilles qui ouvrent un panneau (genre, période, pays de production, plateforme, personne), avec un champ qui filtre les choix pendant la frappe. Le tri est dans un menu à part (populaires, tendances de la semaine, mieux notés, plus récents, titre). Sur mobile, les pastilles sont dans un tiroir ouvert par le bouton « Filtres », qui affiche le nombre de filtres actifs.

Les critères et la page vivent dans l'URL, par exemple `/films?q=nuit&genre=18&decade=1990&sort=rating&page=2` : un rechargement, un lien partagé ou les boutons Précédent et Suivant du navigateur retrouvent la même recherche. Seuls les critères différents des valeurs par défaut sont écrits dans l'URL, et changer un critère revient à la page 1.

Les filtres avancés reprennent ceux de l'API et se combinent entre eux (un film doit respecter tous les critères) :

| Filtre | Paramètre | Liste de choix |
| --- | --- | --- |
| Genre | `genre` | `GET /api/genres` |
| Pays de production | `country` (code ISO) | `GET /api/countries`, noms affichés en français |
| Plateforme | `provider` et `region` | `GET /api/watch-providers?region=`, pour le pays de diffusion choisi en haut du panneau (France par défaut) |
| Période | `decade` puis `year` | Décennies depuis 1900, puis les années de la décennie choisie |
| Personne | `person` | Recherche pendant la frappe avec `GET /api/people?q=`, à partir de 2 lettres |
| Studio | `company` | Pas de liste : bouton « Affiner dans le catalogue » sur la page du studio |

La fiche d'une personne et la page d'un studio ont aussi ce bouton, qui ouvre le catalogue filtré (`/films?person=38`, `/films?company=1`), et les pays de production de la fiche film mènent à `/films?country=FR`. L'adresse obtenue se partage et accepte d'autres filtres, par exemple `/films?person=38&decade=2010&provider=7`. Les filtres actifs s'affichent sous les pastilles avec leur nom, chacun avec un bouton pour le retirer.

Le pays de diffusion n'est envoyé à l'API qu'avec une plateforme, et chaque combinaison de critères a sa propre entrée dans le cache de TanStack Query. Si la plateforme choisie n'a aucun film du catalogue dans le nouveau pays de diffusion, le filtre est retiré avec un message. Les listes de genres, de pays et de plateformes sont lues en entier (100 par page, les États-Unis en comptent plus) et gardées en cache jusqu'au rechargement.

Un paramètre invalide (titre vide ou trop long, genre, pays, personne ou studio inconnu, décennie ou année hors liste, année hors de la décennie choisie, tri ou page non reconnus) est retiré de l'adresse avec un message, au lieu d'envoyer une requête que l'API refuserait en `422`. Une page au-delà de la dernière propose d'aller à la dernière page, et une recherche sans résultat propose d'effacer les filtres.

#### Fiche film et suivi personnel

Chaque carte du catalogue ouvre la fiche `/movies/{id}`, lue avec `GET /api/movies/{id}`. La fiche est préchargée dès le survol ou la prise de focus de la carte, elle s'affiche donc sans attente au clic. Elle montre l'affiche, le synopsis, la durée, les genres, les têtes d'affiche, l'équipe par poste (réalisation, scénario, image, musique, montage), les studios, les pays de production et la moyenne des membres (ou « Pas encore noté » sans note). Un identifiant invalide ou un film absent (`404`) affiche « Film introuvable ».

Deux sections de la fiche ont leur propre requête, lancée une fois le film chargé. Si l'une échoue, elle affiche son erreur et un bouton « Réessayer » sans bloquer le reste de la fiche, et garde ce qu'elle affichait déjà.

- « Notes des membres » lit `GET /api/movies/{id}/ratings` : un histogramme de 10 colonnes, de 0,5 à 5 étoiles, avec la moyenne et le nombre de notes, ou « Pas encore noté » sans note. Les colonnes sont aussi décrites dans un tableau lu par les lecteurs d'écran. Journaliser, modifier ou supprimer une entrée relit la répartition.
- « Où regarder » lit `GET /api/movies/{id}/watch-providers?region=FR` et groupe les plateformes par abonnement, location et achat. Un menu change de pays (France par défaut, Belgique, Suisse, Canada, États-Unis), les offres du pays précédent restent affichées pendant le chargement. Un pays sans offre l'indique.

Un membre connecté voit son état avec `GET /api/movies/{id}/relationship`. Depuis la fiche, il peut marquer le film comme vu ou aimé, l'ajouter à sa watchlist ou changer sa note par demi-étoile. Chaque action envoie seulement le champ modifié à `PATCH /api/movies/{id}/relationship`. L'option « Pas de note » envoie `{ "rating": null }`. Ces actions ne créent aucune entrée de journal.

Le suivi change tout de suite, puis la fiche et les onglets du profil se synchronisent avec le serveur. Un changement de note actualise aussi l'histogramme. En cas d'erreur, le suivi revient à son état précédent et un message s'affiche. Depuis la watchlist, un visiteur est envoyé vers la connexion, puis revient sur la fiche.

#### Profil public

`/users/{username}` affiche le profil d'un membre, lu avec `GET /api/users/{username}`. Le profil est accessible sans compte et montre le pseudo, la bio, le nombre de films vus, d'abonnés et d'abonnements, et les 4 films favoris qui mènent à leur fiche. Un pseudo inconnu (`404`) affiche « Membre introuvable ». Le lien avec le pseudo dans la navigation ouvre le profil du membre connecté.

Le profil a cinq onglets, chacun avec son adresse :

| Adresse | Endpoint | Contenu |
| --- | --- | --- |
| `/users/{username}/diary` | `GET /api/users/{username}/diary` | Journal : film, date de visionnage, note, aimé, revu et critique |
| `/users/{username}/watched` | `GET /api/users/{username}/watched` | Films vus |
| `/users/{username}/likes` | `GET /api/users/{username}/likes` | Films aimés |
| `/users/{username}/watchlist` | `GET /api/users/{username}/watchlist` | Watchlist |
| `/users/{username}/lists` | `GET /api/users/{username}/lists` | Listes du membre, avec ses listes privées lorsqu'il consulte son propre profil |

`/users/{username}` ouvre le journal. Chaque onglet est paginé par 20 avec `?page=2` dans l'adresse, comme le catalogue. Une page invalide revient à la première, une page au-delà de la dernière propose d'y aller. Un onglet vide l'indique, et une critique marquée spoiler reste cachée jusqu'au clic sur « Afficher la critique ».

Le journal peut être filtré par année, puis par mois. Les filtres sont conservés dans l'adresse et dans les liens de pagination, par exemple `?year=2026&month=11&page=2`. Changer un filtre revient à la première page. Effacer l'année efface aussi le mois.

#### Rechercher et suivre des membres

Le lien « Membres » ouvre l'annuaire public `/users`, lu avec `GET /api/users`. La recherche par pseudo et la pagination restent dans l'adresse, par exemple `/users?q=jane&page=2`. Depuis un profil, les compteurs ouvrent les listes paginées « Abonnés » (`/users/{username}/followers`) et « Abonnements » (`/users/{username}/following`). Chaque pseudo mène à son profil.

Le profil utilise `followedByMe` pour afficher « Suivre » ou « Ne plus suivre ». L'action envoie un `POST` ou un `DELETE` à `/api/users/{username}/followers`. Le bouton et le compteur d'abonnés changent dès le clic. En cas d'erreur, ils reprennent leur état précédent et un message s'affiche. Sur son propre profil, le membre voit le bouton « Modifier mon profil ». Un visiteur qui clique sur « Suivre » passe par la connexion et revient sur la même page pour relancer l'action.

Pour vérifier le parcours avec les comptes de démonstration :

1. Sans compte, rechercher `leo` depuis « Membres », ouvrir son profil et consulter les deux listes. Ouvrir un pseudo depuis une liste, puis revenir en arrière. Essayer aussi une recherche sans résultat et une adresse de liste avec `?page=999`.
2. Depuis les abonnés de `leo`, cliquer sur « Suivre » et se connecter avec `jane@example.com` et `demo1234`. Vérifier le retour à la liste et cliquer à nouveau sur « Suivre ». Vérifier que le bouton et le compteur changent avant la fin de la requête, que `jane_doe` apparaît dans les abonnés de `leo` et que `leo` apparaît dans les abonnements de `jane_doe`. Vérifier l'absence du bouton de suivi sur son propre profil.
3. Couper le réseau une fois le profil de `leo` chargé et cliquer sur « Ne plus suivre ». Vérifier le retour au compteur précédent et le message d'erreur. Rétablir le réseau et réessayer, puis vérifier que les deux listes ont été mises à jour.
4. Se déconnecter, puis ouvrir le même profil avec `camille@example.com` et `demo1234`. La démo démarre avec `camille` déjà abonnée à `leo`, ce qui permet de vérifier que le bouton reflète le compte actif.

Avec au moins 21 résultats dans l'annuaire ou dans une liste du profil, passer à la deuxième page et recharger. Vérifier que la page et, dans l'annuaire, le pseudo recherché restent dans l'adresse.

#### Lire les critiques et répondre

« Critiques » ouvre le fil public `/reviews`, paginé par 20 via `GET /api/log-entries?withReview=true`. Depuis une fiche film ou un profil, le lien ouvre ce fil filtré avec `?movie={id}` ou `?user={username}`. « Voir le détail » ouvre `/log-entries/{id}` depuis une critique ou le journal. Les commentaires sont publics et paginés.

Pour vérifier le parcours avec les données de démonstration :

1. Sans compte, ouvrir « Critiques », puis une fiche film et le profil d’un auteur. Depuis chacun, revenir au fil par le lien « Critiques » et vérifier le filtre. Depuis le fil, ouvrir « Voir le détail », recharger cette adresse et vérifier les liens vers le film et le profil. Essayer aussi depuis une entrée du journal sans critique.
2. Ouvrir la critique de `camille` qui contient des spoilers. Vérifier que le texte apparaît uniquement après « Afficher la critique », séparément dans le fil et dans le détail.
3. Depuis la critique d’`arthur` qui a deux commentaires, cliquer sur le cœur en tant que visiteur. Se connecter avec `jane@example.com` et `demo1234`, vérifier le retour à la même adresse puis retirer et remettre le like. Comparer le cœur et le compteur dans le fil et le détail. Couper le réseau avant de cliquer une nouvelle fois, puis vérifier que le cœur et le compteur reprennent leur état précédent et qu’un message d’erreur apparaît.
4. Avec le réseau rétabli, publier un commentaire sur une entrée d’`arthur`, le modifier et vérifier le compteur dans le détail puis dans le fil. Vérifier que Jane peut supprimer son commentaire. Publier un second commentaire, puis ouvrir l’entrée avec `leo@example.com` et vérifier que Léo ne peut ni modifier ni supprimer le commentaire de Jane. Avec `arthur@example.com`, vérifier qu’Arthur peut le supprimer, puis vérifier que le compteur diminue.
5. Avec au moins 21 critiques, passer à la page 2 puis recharger. Vérifier que le numéro de page ainsi que les éventuels filtres restent dans l’adresse. Avec les seules données de démo, `?page=2` permet de vérifier le retour à la dernière page disponible.

#### Consulter l’activité des membres suivis

Le lien « Activité » ouvre `/feed` après connexion. Les entrées de `GET /api/feed` sont affichées par 20 dans l’ordre de création, de la plus récente à la plus ancienne. Chaque carte permet d’ouvrir le film, le profil de l’auteur ou le détail du visionnage. Les critiques à spoilers restent masquées jusqu’au clic sur « Afficher la critique ».

Pour vérifier le parcours avec les données de démonstration :

1. Sans compte, ouvrir `/feed` et vérifier la redirection vers la connexion. Se connecter avec `jane@example.com` et `demo1234`, puis vérifier le retour au flux. Sur les données de démo initiales, seules les entrées d’`arthur` et de `camille` apparaissent. Vérifier les trois liens d’une carte, le masquage de la critique de `camille` avant de la révéler et l’accès à « Activité » depuis le menu compact.
2. Depuis « Membres », suivre `leo` et revenir au flux par « Activité ». Vérifier que ses entrées apparaissent sans recharger. Se désabonner, puis revenir au flux pour vérifier qu’elles ont disparu.
3. Se déconnecter depuis le flux et vérifier le retour à la connexion et la disparition des cartes. Se connecter avec `leo@example.com` et `demo1234`. Sur les données de démo initiales, seules les entrées de `camille` doivent apparaître. Si la critique à spoilers a été révélée avec Jane, vérifier qu’elle est de nouveau masquée.
4. Avec un nouveau compte, ouvrir « Activité » et vérifier le message de flux vide et son lien vers la recherche de membres. Sur la page « Membres », attendre au moins 30 secondes pour que la prochaine ouverture du flux relance la requête, puis couper le réseau et cliquer sur « Activité ». Vérifier le message d’erreur. Rétablir le réseau et cliquer sur « Réessayer » pour retrouver le message de flux vide.
5. Avec au moins 21 entrées publiées par les membres suivis, ouvrir la page suivante et recharger `/feed?page=2`. Vérifier que les entrées se suivent dans l’ordre fourni par l’API. Sur les données de démo initiales, ouvrir `/feed?page=2` pour vérifier que la page propose de revenir à la dernière page disponible.

#### Découvrir les listes

Le lien « Listes » de la navigation ouvre l'annuaire public `/lists`, lu avec `GET /api/lists`. Le formulaire combine le nom de la liste (`q`), le pseudo de son auteur (`user`) et un film choisi dans le catalogue (`movie`). Les listes les plus récentes sont affichées par défaut. Le tri « Les plus populaires » (`sort=popular`) affiche les listes par nombre de mentions J'aime. Les filtres et la pagination restent dans l'adresse, par exemple `/lists?user=jane_doe&sort=popular&page=2`.

La fiche `/lists/{id}` lit `GET /api/lists/{id}` et `GET /api/lists/{id}/items`. Elle affiche les films dans l'ordre renvoyé par l'API, avec leur position pour les listes classées et la note de l'auteur si elle existe. Les films et les listes sont paginés par 20. Le badge « Privée » apparaît sur le profil du propriétaire et sur la fiche qui lui est accessible. Pour les autres visiteurs, le lien direct d'une liste privée affiche « Liste introuvable », comme pour une liste absente.

#### Gérer ses listes

Une fois connecté, le bouton « Créer une liste » est disponible dans l’annuaire et dans l’onglet « Listes » de son profil. Le formulaire permet de choisir le nom, la description facultative, la visibilité et l’affichage du classement. Le propriétaire peut modifier ces réglages depuis la fiche ou supprimer la liste après confirmation.

Sur la fiche, le propriétaire peut rechercher un film à ajouter, écrire une note de texte, l’effacer en laissant le champ vide ou retirer le film. Les boutons « Monter » et « Descendre » fonctionnent au clavier et déplacent le film d’une position dans la liste entière, y compris entre deux pages.

#### Aimer et commenter une liste

Le cœur permet d’ajouter ou de retirer une mention J’aime depuis la fiche, l’annuaire ou le profil de l’auteur. Le compteur change tout de suite et revient à sa valeur précédente si la requête échoue. Depuis la fiche, les commentaires sont affichés du plus ancien au plus récent, par pages de 20. Le paramètre `commentsPage` conserve la page des commentaires indépendamment de la page des films.

Le formulaire accepte de 1 à 1 000 caractères. Chaque membre peut modifier ou supprimer ses propres commentaires. Le propriétaire d’une liste peut aussi supprimer les commentaires des autres membres sur sa liste. Les actions disponibles sans compte ouvrent la connexion, puis ramènent à la page d’origine.

Pour vérifier le parcours avec les comptes de démonstration :

1. Sans compte, ouvrir « Les incontournables » depuis `/lists`. Lire les commentaires, cliquer sur le cœur ou sur « Se connecter pour commenter », puis se connecter avec `jane_doe`. La fiche doit se rouvrir.
2. Retirer puis remettre la mention J’aime de `jane_doe`. Comparer le cœur et le compteur sur la fiche, dans `/lists` et dans `/users/arthur/lists`. Couper la connexion réseau après le chargement de la fiche et retenter l’action pour observer le retour au compteur précédent et le message d’erreur.
3. Essayer de publier un texte vide et un texte de plus de 1 000 caractères, puis publier un commentaire valide et le modifier. Vérifier que `jane_doe` peut supprimer ses propres commentaires mais qu’elle ne peut ni modifier ni supprimer celui de `camille`.
4. Avec `arthur`, vérifier qu’il peut supprimer le commentaire ajouté par `jane_doe` sur sa liste et que le bouton « Modifier » est absent pour ce commentaire.
5. Avec `jane_doe`, ouvrir sa liste privée « À revoir un jour » et copier son adresse. La fiche doit afficher « Liste introuvable » avec `arthur` ou sans compte.
6. Sur la liste « Les incontournables », ajouter des commentaires de test jusqu’à en avoir 21 (la démo en fournit deux au départ). Ouvrir la deuxième page des commentaires, vérifier que la page des films reste la même et que recharger la fiche conserve la page de commentaires.

#### Modification du profil

Depuis son propre profil, le membre connecté peut ouvrir « Modifier mon profil » (`/settings/profile`). Le pseudo et la bio sont enregistrés avec `PATCH /api/me`. Une bio vide efface la bio existante. Si le pseudo change, la navigation et le lien « Voir mon profil public » utilisent la nouvelle adresse.

La recherche du catalogue permet d'ajouter jusqu'à quatre films distincts. Les flèches changent leur ordre, et « Enregistrer les favoris » envoie la liste complète à `PUT /api/me/favorites`. Chaque formulaire conserve ses saisies si l'enregistrement échoue.

#### Personnes et studios

Sur la fiche film, chaque nom de la distribution et de l'équipe ouvre la fiche de la personne, et chaque studio ouvre sa page. Comme pour les films, la fiche d'une personne est préchargée au survol ou à la prise de focus du lien.

| Adresse | Endpoint | Contenu |
| --- | --- | --- |
| `/people?q=nolan` | `GET /api/people?q=` | Recherche de personnes par nom, paginée par 24 |
| `/people/{id}` | `GET /api/people/{id}` | Photo, postes occupés, rôles joués avec le nom du personnage |
| `/people/{id}?job=Director` | `GET /api/people/{id}/movies?job=` | Filmographie paginée, filtrée par poste |
| `/companies/{id}` | `GET /api/companies/{id}` et `GET /api/movies?company={id}` | Logo, nom et films du studio, des plus populaires aux moins connus |

Le lien « Personnes » de la navigation ouvre la recherche. Sans nom, la page invite à en taper un plutôt que de lister toutes les personnes du catalogue. Sur la fiche d'une personne, la filmographie a un bouton par poste avec son nombre de films (« Tous », « Interprétation », « Réalisation », « Scénario »...) : le poste et la page vivent dans l'URL. Un poste que la personne n'a jamais occupé renvoie vers toute sa filmographie, et une page invalide revient à la première.

Une personne sans photo garde le même format, avec une icône à la place. Un studio sans logo affiche seulement son nom. Une recherche sans résultat l'indique, et une personne ou un studio absent (`404`) affiche « Personne introuvable » ou « Studio introuvable ».

#### Journaliser un film

Sur la fiche, le bouton « Journaliser » ouvre un formulaire : date de visionnage (obligatoire, préremplie avec le jour local du navigateur), note facultative de 0,5 à 5 par demi-étoile, coup de cœur, revisionnage, critique et case « spoilers » (active seulement avec une critique). Il envoie `POST /api/log-entries` avec tous les champs, une note ou une critique vide part à `null`. Un visiteur est envoyé vers la connexion, puis revient sur la fiche.

Le succès n'est affiché qu'après la réponse de l'API, avec un lien « Voir mon journal ». Mon état sur le film, la moyenne du film et les onglets et compteurs de mon profil sont alors relus : le film sort de la watchlist, passe dans les films vus et l'entrée apparaît dans le journal. En cas d'erreur, le brouillon reste dans le formulaire, même après avoir fermé la fenêtre, et les erreurs de validation (`422`) s'affichent sous les champs concernés. Il est aussi gardé dans le `sessionStorage` de l'onglet, par membre et par film : si la session expire pendant la saisie, le membre se reconnecte et retrouve son brouillon sur la fiche. Il est effacé après l'enregistrement.

Dans mon journal, chaque entrée a les boutons « Modifier » et « Supprimer ». Les autres visiteurs ne les voient pas, et l'API répond de toute façon `403` à un autre membre. La modification envoie `PATCH /api/log-entries/{id}` avec tous les champs. La suppression demande une confirmation puis envoie `DELETE /api/log-entries/{id}`. Le front ne calcule pas lui-même mon état sur le film : il relit les mêmes vues qu'à la création, et c'est l'API qui applique ses règles (seule la dernière entrée change la note et le coup de cœur, une suppression laisse le film vu).

#### Thème et navigation

Les couleurs, polices et rayons viennent d'un thème [TweakCN](https://tweakcn.com), appliqué dans [`assets/app.css`](assets/app.css) avec :

```bash
npx shadcn@latest add https://tweakcn.com/r/themes/cmww4uejt000104l52cis7jqp
```

Le thème fournit une variante claire et une variante sombre. Le front est toujours affiché en sombre grâce à la classe `dark` posée sur `<html>` dans [`templates/front.html.twig`](templates/front.html.twig). Après une nouvelle application du thème, vérifier `assets/app.css` : la commande remet l'import de police et des variables propres à l'éditeur de TweakCN, et écrit les ombres avec une syntaxe de couleur invalide. Les autres variables du thème (ombres, polices serif et mono, espacement des lettres) sont gardées telles quelles pour les composants shadcn à venir. La variante claire n'est pas utilisée et n'a pas été vérifiée : son texte blanc sur les couleurs vert, bleu et orange est sous le contraste AA.

La navigation ([`MainNavigation`](assets/components/MainNavigation.tsx)) s'affiche dans l'en-tête sur desktop et dans un menu dépliant sur mobile, avec des entrées de 44 px de haut. Échap ferme le menu et rend le focus au bouton, et un lien « Aller au contenu » apparaît à la première tabulation. Une nouvelle page s'y ajoute avec un `NavLink`, qui marque l'entrée active avec `aria-current="page"`.

#### Requêtes et cache

- Définir les lectures avec `queryOptions` dans le dossier de la fonctionnalité. La clé contient la ressource et les paramètres de la requête, par exemple `["movies", { sort: "popular", page: "1", limit: "24" }]`. Passer le `signal` de TanStack Query à `apiFetch` pour annuler la requête.
- Une lecture publique identique pour tous, comme le catalogue des films, appelle `apiFetch` avec `session: null`. Si la réponse dépend du membre, préfixer la clé par `sessionKey(session)` et passer cette même session à `apiFetch`, comme pour `/api/me`. Une déconnexion, une expiration ou un changement de compte annule les lectures de la session précédente et efface ses entrées du cache.
- Afficher des squelettes au premier chargement. Pour une pagination ou un filtre, garder les données visibles avec `placeholderData: keepPreviousData` et signaler la mise à jour. Limiter cette conservation à la même session pour les lectures personnalisées. En cas d'erreur, garder les résultats déjà affichés et proposer de relancer la requête avec `refetch`.
- Précharger à l'intention de navigation, par exemple au survol ou à la prise de focus d'un lien vers une fiche. Appeler `queryClient.prefetchQuery` avec les mêmes options que l'écran de destination pour réutiliser son cache.

#### Mutations

- Pour une action simple et réversible comme un ajout à la watchlist, préfixer la `mutationKey` avec `sessionKey(session)` et passer cette même session à `apiFetch`. Dans `onMutate`, annuler les lectures concernées, garder une copie des données et appliquer le changement optimiste au cache.
- En cas d'erreur, restaurer la copie dans `onError` et afficher l'erreur. Dans `onSettled`, attendre l'invalidation des clés concernées pour les resynchroniser avec le serveur après un succès ou un échec. Vérifier `isCurrentSession(session)` avant d'écrire dans le cache, y compris après une attente, pour que les callbacks d'une ancienne session ne recréent pas ses données.
- Pour une action avec plusieurs effets côté serveur, comme journaliser un visionnage, attendre la réponse avant d'afficher le succès. En cas d'erreur, garder le brouillon.

Le client partagé [`apiFetch`](assets/lib/api.ts) ajoute le JWT pour les requêtes authentifiées. Le token et sa date d'expiration sont gardés dans le `localStorage` pour restaurer la session après un rechargement. La session expire au bout d'une heure. Une réponse `401` à une requête de la session active efface aussi la session et renvoie vers la connexion.

Si le serveur démarre en HTTPS (certificat local installé avec `symfony server:ca:install`), il faut changer la `baseURL` dans [`http/http-client.env.json`](http/http-client.env.json).

## Authentification

1. Créer un compte avec `POST /api/register`.
2. Se connecter avec `POST /api/login_check` (email et mot de passe). La réponse contient le `token`, sa durée de vie en secondes (`ttl`, 1 h) et le profil du membre (`user`).
3. Envoyer le token dans l'en-tête `Authorization: Bearer <token>` sur les routes protégées.

Il n'y a pas de refresh token : une fois le token expiré, il faut se reconnecter. Une route protégée appelée sans token valide renvoie une erreur `401`.

## Tester les routes

Le dossier [`http/`](http) contient un fichier `.http` par ressource, avec des requêtes valides et des cas d'erreur. Ils s'ouvrent dans PhpStorm (ou VS Code avec une extension compatible) en choisissant l'environnement `dev`.

Ils sont écrits pour une base fraîchement installée avec les commandes de la section [Installation](#installation) : les identifiants utilisés (films, personnes, studios...) sont ceux d'un premier import de `data/movies.jsonl`, et les requêtes en `403` visent les données de démo des autres membres. Le code attendu est indiqué entre parenthèses dans le titre de chaque requête.

Commencer par [`http/auth.http`](http/auth.http) : la requête de connexion avec `jane_doe` enregistre le token, qui est ensuite réutilisé automatiquement par les autres fichiers. Les requêtes d'un fichier se lancent de haut en bas, et [`list-items.http`](http/list-items.http), [`likes.http`](http/likes.http) et [`comments.http`](http/comments.http) demandent d'avoir d'abord créé la liste de [`lists.http`](http/lists.http). Le token expire au bout d'une heure : il suffit alors de relancer la connexion.

Pour repartir de zéro : supprimer `var/data_dev.db`, puis reprendre à partir de la migration.

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

La liste renvoie une vue allégée (titre, titre original, date de sortie, moyenne des membres sur 5 `averageRating`, affiche). La fiche `GET /api/movies/{id}` ajoute le synopsis, la durée en minutes, le nombre de notes des membres (`ratingCount`), la note moyenne TMDB sur 10 (`voteAverage`, à titre indicatif), les genres, les studios, les pays, la distribution avec les rôles (`cast`) et l'équipe avec les postes (`crew`). La liste et la fiche donnent aussi l'image de fond du film (`backdropUrl`, en 1280 pixels de large), utilisée par les grands bandeaux du front. Les images (`posterUrl`, `backdropUrl`, `profileUrl`, `logoUrl`) sont des URL complètes vers TMDB.

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

### Listes

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

### Likes et commentaires

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

### Profils

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

### Abonnements et feed

`POST /api/users/{username}/followers` suit un membre et renvoie une `201`, par exemple `{ "id": 3, "username": "jane_doe", "followedByMe": true }`. `DELETE` sur la même route arrête de le suivre et renvoie une `204` sans contenu. Suivre un membre déjà suivi renvoie une `409`, se suivre soi-même une `422`, et ne plus suivre un membre qu'on ne suit pas une `404`.

`GET /api/users`, `/followers` et `/following` renvoient chaque membre au même format que le profil public (bio, favoris, compteurs et `followedByMe`), pour afficher des cartes complètes sans une requête par membre.

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

## Tests

```bash
php bin/phpunit
```

Les tests fonctionnels envoient de vraies requêtes HTTP à l'API. Ils utilisent une base SQLite séparée (`var/data_test.db`), créée automatiquement au premier lancement, et chaque test tourne dans une transaction annulée à la fin. Les commandes TMDB sont testées sans réseau : les appels à TMDB sont remplacés par des réponses enregistrées dans [`tests/Fixtures/tmdb`](tests/Fixtures/tmdb).

## Qualité du code

```bash
vendor/bin/php-cs-fixer fix          # style @Symfony
php bin/console lint:container       # vérification du conteneur de services
npm run lint                         # ESLint sur le front
npm run build                        # vérification des types TypeScript, puis construction du front
```
