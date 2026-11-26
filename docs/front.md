# Front

Symfony renvoie la même page sur toutes les adresses hors `/api` ([`FrontController`](../src/Controller/FrontController.php)), et React choisit la page à afficher selon l'adresse : recharger `/login` fonctionne donc comme ouvrir `/`. Le front et l'API sont sur la même origine, il n'y a pas de CORS à configurer.

Le code est dans [`assets/`](../assets) :

| Dossier | Contenu |
| --- | --- |
| `pages/` | Composition des écrans par route et lecture des filtres ou de la page dans l’URL |
| `features/` | Composants, requêtes et mutations propres à chaque fonctionnalité |
| `components/` | Mise en page (en-tête, pied de page, écrans de connexion) et composants partagés (pagination numérotée, état vide) |
| `components/ui/` | Composants [shadcn/ui](https://ui.shadcn.com), ajoutés avec `npx shadcn add <composant>` |
| `lib/` | Client HTTP de l'API, configuration de TanStack Query, état de la session et types partagés |

## En-tête et recherche globale

L'en-tête reste visible en haut de chaque page. Il donne accès aux sections du site, à la recherche et au compte : boutons « Connexion » et « Créer un compte » pour un visiteur, menu avec avatar pour un membre (profil, journal, watchlist, listes, modification du profil, déconnexion). Sur mobile, la navigation s'ouvre dans un panneau latéral.

La recherche s'ouvre avec le champ de l'en-tête ou le raccourci `Ctrl K` (`Cmd K` sur Mac). Les résultats arrivent pendant la frappe, 300 ms après la dernière touche et à partir de 2 caractères, sans bouton à valider : 5 films, 5 personnes et 5 membres, lus en parallèle avec `GET /api/movies`, `GET /api/people` et `GET /api/users`. Les flèches du clavier parcourent les résultats et `Entrée` ouvre la page choisie. Un lien mène au catalogue filtré sur le titre tapé quand il y a plus de 5 films.

Les membres n'ont pas de photo : leur avatar affiche les deux premières lettres du pseudo sur une couleur tirée du pseudo, toujours la même pour un membre donné.

## Inscription et connexion

`/login` et `/register` s'affichent en plein écran, sans la navigation, à côté d'un mur d'affiches des films populaires qui défile lentement (l'animation est coupée quand le système demande de réduire les animations). Les identifiants des comptes de démo ne sont donnés que dans le [README](../README.md#comptes-de-démonstration).

`/register` crée un compte avec `POST /api/register`, puis ouvre la session avec `POST /api/login_check`. Les erreurs de validation renvoyées par l'API s'affichent sous les champs concernés. Si le compte est créé mais que la connexion échoue, la page propose de se connecter avec l'email déjà rempli.

La page d'origine passe d'un écran à l'autre dans le paramètre `redirect` (par exemple `/login?redirect=%2F%3Fpage%3D2`), avec son chemin et ses paramètres. Seuls les chemins du site sont acceptés : une adresse externe ou absente renvoie vers l'accueil. Quand l'API refuse le token (`401`), le membre est renvoyé vers `/login` et revient ensuite sur la page où il était. Le retour ne rejoue aucune action : le membre la relance lui-même.

## Accueil

L'accueil `/` s'ouvre sur un carrousel plein écran des 5 films les plus journalisés de la semaine (`GET /api/movies?sort=trending`, seuls les films avec une image de fond sont gardés). Les films défilent toutes les 8 secondes. C'est la fin de l'animation de la barre de progression qui fait passer au film suivant : la barre et le défilement restent synchronisés. Le défilement s'arrête au survol ou au focus clavier du panneau « À la une », avec le bouton pause, et ne démarre pas quand le système demande de réduire les animations. Le tri « tendances » départage par popularité TMDB : sans activité récente, le carrousel montre les films populaires.

Viennent ensuite des rangées qui défilent au doigt, à la souris ou avec leurs flèches, chacune avec un lien « Tout voir » : le top 10 de la semaine (le rang s'affiche devant le titre, toutes les affiches gardent la même taille), les critiques récentes (`GET /api/log-entries?withReview=true`), les films populaires, les genres (chaque tuile a une icône et ouvre le catalogue filtré), les listes les plus likées et les films les mieux notés par les membres. Un membre connecté voit en premier ce que ses abonnements ont vu (`GET /api/feed`). Une rangée sans contenu ou en erreur ne s'affiche pas, pour ne pas bloquer le reste de la page.

## Catalogue

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

## Fiche film et suivi personnel

Chaque carte du catalogue ouvre la fiche `/movies/{id}`, lue avec `GET /api/movies/{id}`. La fiche est préchargée dès le survol ou la prise de focus de la carte, elle s'affiche donc sans attente au clic. Elle s'ouvre sur un bandeau avec l'image de fond du film (ou son affiche floutée s'il n'en a pas), l'affiche, le titre, l'année, la durée, la réalisation et les genres, qui mènent au catalogue filtré. Viennent ensuite le synopsis, la distribution en rangée de photos, l'équipe par poste (réalisation, scénario, image, musique, montage), les 3 dernières critiques du film et la production (studios et pays). Une colonne latérale, fixe au défilement sur grand écran, regroupe le journal, le suivi personnel, les notes des membres et « Où regarder ». Un identifiant invalide ou un film absent (`404`) affiche « Film introuvable ».

Deux sections de la fiche ont leur propre requête, lancée une fois le film chargé. Si l'une échoue, elle affiche son erreur et un bouton « Réessayer » sans bloquer le reste de la fiche, et garde ce qu'elle affichait déjà.

- « Notes des membres » lit `GET /api/movies/{id}/ratings` : un histogramme de 10 colonnes, de 0,5 à 5 étoiles, avec la moyenne et le nombre de notes, ou « Pas encore noté » sans note. Les colonnes sont aussi décrites dans un tableau lu par les lecteurs d'écran. Journaliser, modifier ou supprimer une entrée relit la répartition.
- « Où regarder » lit `GET /api/movies/{id}/watch-providers?region=FR` et groupe les plateformes par abonnement, location et achat. Des boutons changent de pays (France par défaut, Belgique, Suisse, Canada, États-Unis), les offres du pays précédent restent affichées pendant le chargement. Un pays sans offre l'indique.

Un membre connecté voit son état avec `GET /api/movies/{id}/relationship`. Depuis la fiche, il peut marquer le film comme vu ou aimé, l'ajouter à sa watchlist ou changer sa note en cliquant sur les étoiles : la moitié gauche d'une étoile donne la demi-étoile, la moitié droite l'étoile pleine, et les flèches du clavier changent la note d'une demi-étoile. Chaque action envoie seulement le champ modifié à `PATCH /api/movies/{id}/relationship`. Le bouton de la croix retire la note et envoie `{ "rating": null }`. Ces actions ne créent aucune entrée de journal.

Le suivi change tout de suite, puis la fiche et les onglets du profil se synchronisent avec le serveur. Un changement de note actualise aussi l'histogramme. En cas d'erreur, le suivi revient à son état précédent et un message s'affiche. Depuis la watchlist, un visiteur est envoyé vers la connexion, puis revient sur la fiche.

## Profil public

`/users/{username}` affiche le profil d'un membre, lu avec `GET /api/users/{username}`. Le profil est accessible sans compte et montre l'avatar, le pseudo, la bio, le nombre de films vus, d'abonnés et d'abonnements, un lien vers ses critiques et les 4 films favoris qui mènent à leur fiche. Le bandeau reprend en flou l'image de fond du premier favori. Un pseudo inconnu (`404`) affiche « Membre introuvable ». Le lien avec le pseudo dans la navigation ouvre le profil du membre connecté.

Le profil a cinq onglets, chacun avec son adresse :

| Adresse | Endpoint | Contenu |
| --- | --- | --- |
| `/users/{username}/diary` | `GET /api/users/{username}/diary` | Journal rangé par mois : jour, film, note, aimé, revu et critique |
| `/users/{username}/watched` | `GET /api/users/{username}/watched` | Films vus |
| `/users/{username}/likes` | `GET /api/users/{username}/likes` | Films aimés |
| `/users/{username}/watchlist` | `GET /api/users/{username}/watchlist` | Watchlist |
| `/users/{username}/lists` | `GET /api/users/{username}/lists` | Listes du membre, avec ses listes privées lorsqu'il consulte son propre profil |

`/users/{username}` ouvre le journal. Chaque onglet est paginé par 20 avec `?page=2` dans l'adresse, comme le catalogue. Une page invalide revient à la première, une page au-delà de la dernière propose d'y aller. Un onglet vide l'indique, et une critique marquée spoiler reste cachée jusqu'au clic sur « Afficher la critique ».

Le journal peut être filtré par année, puis par mois, avec deux pastilles qui ouvrent une liste de choix. Les filtres sont conservés dans l'adresse et dans les liens de pagination, par exemple `?year=2026&month=11&page=2`. Changer un filtre revient à la première page. Effacer l'année efface aussi le mois.

## Rechercher et suivre des membres

Le lien « Membres » ouvre l'annuaire public `/users`, lu avec `GET /api/users`. Le pseudo se cherche pendant la frappe, sans bouton à valider. La recherche et la pagination restent dans l'adresse, par exemple `/users?q=jane&page=2`. Chaque membre a une carte avec son avatar, sa bio, ses compteurs, ses 4 films favoris et le bouton « Suivre ».

Depuis un profil, les compteurs d'abonnés et d'abonnements ouvrent un panneau latéral par-dessus l'onglet affiché, au lieu de le remplacer. Le panneau vit dans l'adresse (`?panel=followers` ou `?panel=following`, et `panelPage` pour sa pagination) : le lien se partage, et Précédent ou la croix le ferment. Deux boutons en haut du panneau passent des abonnés aux abonnements.

Le profil utilise `followedByMe` pour afficher « Suivre » ou « Ne plus suivre ». L'action envoie un `POST` ou un `DELETE` à `/api/users/{username}/followers`. Le bouton et le compteur d'abonnés changent dès le clic. En cas d'erreur, ils reprennent leur état précédent et un message s'affiche. Sur son propre profil, le membre voit le bouton « Modifier mon profil ». Un visiteur qui clique sur « Suivre » passe par la connexion et revient sur la même page pour relancer l'action.

Pour vérifier le parcours avec les comptes de démonstration :

1. Sans compte, rechercher `leo` depuis « Membres », ouvrir son profil et consulter les deux listes. Ouvrir un pseudo depuis une liste, puis revenir en arrière. Essayer aussi une recherche sans résultat et une adresse de liste avec `?page=999`.
2. Depuis le panneau des abonnés de `leo`, cliquer sur « Suivre » et se connecter avec `jane@example.com` et `demo1234`. Vérifier le retour à la liste et cliquer à nouveau sur « Suivre ». Vérifier que le bouton et le compteur changent avant la fin de la requête, que `jane_doe` apparaît dans les abonnés de `leo` et que `leo` apparaît dans les abonnements de `jane_doe`. Vérifier l'absence du bouton de suivi sur son propre profil.
3. Couper le réseau une fois le profil de `leo` chargé et cliquer sur « Ne plus suivre ». Vérifier le retour au compteur précédent et le message d'erreur. Rétablir le réseau et réessayer, puis vérifier que les deux listes ont été mises à jour.
4. Se déconnecter, puis ouvrir le même profil avec `camille@example.com` et `demo1234`. La démo démarre avec `camille` déjà abonnée à `leo`, ce qui permet de vérifier que le bouton reflète le compte actif.

Avec au moins 21 résultats dans l'annuaire ou dans une liste du profil, passer à la deuxième page et recharger. Vérifier que la page et, dans l'annuaire, le pseudo recherché restent dans l'adresse.

## Lire les critiques et répondre

« Critiques » ouvre le fil public `/reviews`, paginé par 20 via `GET /api/log-entries?withReview=true`. Depuis une fiche film ou un profil, le lien ouvre ce fil filtré avec `?movie={id}` ou `?user={username}`. « Voir le détail » ouvre `/log-entries/{id}` depuis une critique ou le journal. Les commentaires sont publics et paginés.

Pour vérifier le parcours avec les données de démonstration :

1. Sans compte, ouvrir « Critiques », puis une fiche film et le profil d’un auteur. Depuis chacun, revenir au fil par le lien « Critiques » et vérifier le filtre. Depuis le fil, ouvrir « Voir le détail », recharger cette adresse et vérifier les liens vers le film et le profil. Essayer aussi depuis une entrée du journal sans critique.
2. Ouvrir la critique de `camille` qui contient des spoilers. Vérifier que le texte apparaît uniquement après « Afficher la critique », séparément dans le fil et dans le détail.
3. Depuis la critique d’`arthur` qui a deux commentaires, cliquer sur le cœur en tant que visiteur. Se connecter avec `jane@example.com` et `demo1234`, vérifier le retour à la même adresse puis retirer et remettre le like. Comparer le cœur et le compteur dans le fil et le détail. Couper le réseau avant de cliquer une nouvelle fois, puis vérifier que le cœur et le compteur reprennent leur état précédent et qu’un message d’erreur apparaît.
4. Avec le réseau rétabli, publier un commentaire sur une entrée d’`arthur`, le modifier et vérifier le compteur dans le détail puis dans le fil. Vérifier que Jane peut supprimer son commentaire. Publier un second commentaire, puis ouvrir l’entrée avec `leo@example.com` et vérifier que Léo ne peut ni modifier ni supprimer le commentaire de Jane. Avec `arthur@example.com`, vérifier qu’Arthur peut le supprimer, puis vérifier que le compteur diminue.
5. Avec au moins 21 critiques, passer à la page 2 puis recharger. Vérifier que le numéro de page ainsi que les éventuels filtres restent dans l’adresse. Avec les seules données de démo, `?page=2` permet de vérifier le retour à la dernière page disponible.

## Consulter l’activité des membres suivis

Le lien « Activité » ouvre `/feed` après connexion. Les entrées de `GET /api/feed` sont affichées par 20 dans l’ordre de création, de la plus récente à la plus ancienne. Chaque carte permet d’ouvrir le film, le profil de l’auteur ou le détail du visionnage. Les critiques à spoilers restent masquées jusqu’au clic sur « Afficher la critique ».

Pour vérifier le parcours avec les données de démonstration :

1. Sans compte, ouvrir `/feed` et vérifier la redirection vers la connexion. Se connecter avec `jane@example.com` et `demo1234`, puis vérifier le retour au flux. Sur les données de démo initiales, seules les entrées d’`arthur` et de `camille` apparaissent. Vérifier les trois liens d’une carte, le masquage de la critique de `camille` avant de la révéler et l’accès à « Activité » depuis le menu compact.
2. Depuis « Membres », suivre `leo` et revenir au flux par « Activité ». Vérifier que ses entrées apparaissent sans recharger. Se désabonner, puis revenir au flux pour vérifier qu’elles ont disparu.
3. Se déconnecter depuis le flux et vérifier le retour à la connexion et la disparition des cartes. Se connecter avec `leo@example.com` et `demo1234`. Sur les données de démo initiales, seules les entrées de `camille` doivent apparaître. Si la critique à spoilers a été révélée avec Jane, vérifier qu’elle est de nouveau masquée.
4. Avec un nouveau compte, ouvrir « Activité » et vérifier le message de flux vide et son lien vers la recherche de membres. Sur la page « Membres », attendre au moins 30 secondes pour que la prochaine ouverture du flux relance la requête, puis couper le réseau et cliquer sur « Activité ». Vérifier le message d’erreur. Rétablir le réseau et cliquer sur « Réessayer » pour retrouver le message de flux vide.
5. Avec au moins 21 entrées publiées par les membres suivis, ouvrir la page suivante et recharger `/feed?page=2`. Vérifier que les entrées se suivent dans l’ordre fourni par l’API. Sur les données de démo initiales, ouvrir `/feed?page=2` pour vérifier que la page propose de revenir à la dernière page disponible.

## Découvrir les listes

Le lien « Listes » de la navigation ouvre l'annuaire public `/lists`, lu avec `GET /api/lists`. Les filtres combinent le nom de la liste (`q`) et le pseudo de son auteur (`user`), cherchés pendant la frappe, et un film choisi dans le catalogue (`movie`). Il n'y a pas de bouton à valider : chaque changement met la liste à jour. Un pseudo incomplet n'est pas envoyé tant qu'il ne fait pas 3 caractères. Chaque liste est une carte avec l'aperçu de ses 4 premières affiches. Les listes les plus récentes sont affichées par défaut. Le tri « Les plus populaires » (`sort=popular`) affiche les listes par nombre de mentions J'aime. Les filtres et la pagination restent dans l'adresse, par exemple `/lists?user=jane_doe&sort=popular&page=2`.

La fiche `/lists/{id}` lit `GET /api/lists/{id}` et `GET /api/lists/{id}/items`. Son en-tête reprend le collage des affiches. Elle affiche les films dans l'ordre renvoyé par l'API, avec leur position en gros chiffres pour les listes classées et la note de l'auteur si elle existe. Les films et les listes sont paginés par 20. Le badge « Privée » apparaît sur le profil du propriétaire et sur la fiche qui lui est accessible. Pour les autres visiteurs, le lien direct d'une liste privée affiche « Liste introuvable », comme pour une liste absente.

## Gérer ses listes

Une fois connecté, le bouton « Créer une liste » est disponible dans l’annuaire et dans l’onglet « Listes » de son profil. Le formulaire permet de choisir le nom, la description facultative, la visibilité et l’affichage du classement. Le propriétaire peut modifier ces réglages depuis la fiche ou supprimer la liste après confirmation.

Sur la fiche, le propriétaire peut rechercher un film à ajouter, écrire une note de texte, l’effacer en laissant le champ vide ou retirer le film. Les boutons « Monter » et « Descendre » fonctionnent au clavier et déplacent le film d’une position dans la liste entière, y compris entre deux pages.

## Aimer et commenter une liste

Le cœur permet d’ajouter ou de retirer une mention J’aime depuis la fiche, l’annuaire ou le profil de l’auteur. Le compteur change tout de suite et revient à sa valeur précédente si la requête échoue. Depuis la fiche, les commentaires sont affichés du plus ancien au plus récent, par pages de 20. Le paramètre `commentsPage` conserve la page des commentaires indépendamment de la page des films.

Le formulaire accepte de 1 à 1 000 caractères. Chaque membre peut modifier ou supprimer ses propres commentaires. Le propriétaire d’une liste peut aussi supprimer les commentaires des autres membres sur sa liste. Les actions disponibles sans compte ouvrent la connexion, puis ramènent à la page d’origine.

Pour vérifier le parcours avec les comptes de démonstration :

1. Sans compte, ouvrir « Les incontournables » depuis `/lists`. Lire les commentaires, cliquer sur le cœur ou sur « Se connecter pour commenter », puis se connecter avec `jane_doe`. La fiche doit se rouvrir.
2. Retirer puis remettre la mention J’aime de `jane_doe`. Comparer le cœur et le compteur sur la fiche, dans `/lists` et dans `/users/arthur/lists`. Couper la connexion réseau après le chargement de la fiche et retenter l’action pour observer le retour au compteur précédent et le message d’erreur.
3. Essayer de publier un texte vide et un texte de plus de 1 000 caractères, puis publier un commentaire valide et le modifier. Vérifier que `jane_doe` peut supprimer ses propres commentaires mais qu’elle ne peut ni modifier ni supprimer celui de `camille`.
4. Avec `arthur`, vérifier qu’il peut supprimer le commentaire ajouté par `jane_doe` sur sa liste et que le bouton « Modifier » est absent pour ce commentaire.
5. Avec `jane_doe`, ouvrir sa liste privée « À revoir un jour » et copier son adresse. La fiche doit afficher « Liste introuvable » avec `arthur` ou sans compte.
6. Sur la liste « Les incontournables », ajouter des commentaires de test jusqu’à en avoir 21 (la démo en fournit deux au départ). Ouvrir la deuxième page des commentaires, vérifier que la page des films reste la même et que recharger la fiche conserve la page de commentaires.

## Modification du profil

Depuis son propre profil, le membre connecté peut ouvrir « Modifier mon profil » (`/settings/profile`). Le pseudo et la bio sont enregistrés avec `PATCH /api/me`. Une bio vide efface la bio existante. Si le pseudo change, la navigation et le lien « Voir mon profil public » utilisent la nouvelle adresse.

Le bouton « Ajouter un film » ouvre une recherche dans le catalogue, qui affiche les films pendant la frappe, et permet d'ajouter jusqu'à quatre films distincts. Les flèches changent leur ordre, et « Enregistrer les favoris » envoie la liste complète à `PUT /api/me/favorites`. Chaque formulaire conserve ses saisies si l'enregistrement échoue.

## Personnes et studios

Sur la fiche film, chaque nom de la distribution et de l'équipe ouvre la fiche de la personne, et chaque studio ouvre sa page. Comme pour les films, la fiche d'une personne est préchargée au survol ou à la prise de focus du lien.

| Adresse | Endpoint | Contenu |
| --- | --- | --- |
| `/people?q=nolan` | `GET /api/people?q=` | Recherche de personnes par nom, paginée par 24 |
| `/people/{id}` | `GET /api/people/{id}` | Photo, postes occupés, rôles joués avec le nom du personnage |
| `/people/{id}?job=Director` | `GET /api/people/{id}/movies?job=` | Filmographie paginée, filtrée par poste |
| `/companies/{id}` | `GET /api/companies/{id}` et `GET /api/movies?company={id}` | Logo, nom et films du studio, des plus populaires aux moins connus |

Le lien « Personnes » de la navigation ouvre la recherche, qui part pendant la frappe. Sans nom, la page invite à en taper un plutôt que de lister toutes les personnes du catalogue. Sur la fiche d'une personne, la filmographie a un bouton par poste avec son nombre de films (« Tous », « Interprétation », « Réalisation », « Scénario »...) : le poste et la page vivent dans l'URL. Un poste que la personne n'a jamais occupé renvoie vers toute sa filmographie, et une page invalide revient à la première.

Une personne sans photo garde le même format, avec une icône à la place. Un studio sans logo affiche seulement son nom. Une recherche sans résultat l'indique, et une personne ou un studio absent (`404`) affiche « Personne introuvable » ou « Studio introuvable ».

## Journaliser un film

Sur la fiche, le bouton « Journaliser » ouvre un formulaire avec l'affiche du film en en-tête : date de visionnage (obligatoire, préremplie avec le jour local du navigateur, avec des raccourcis « Aujourd'hui » et « Hier »), note facultative de 0,5 à 5 en cliquant sur les étoiles, boutons « Coup de cœur » et « Je l'avais déjà vu », critique avec compteur de caractères, et option spoilers qui n'apparaît qu'une fois la critique commencée. Il envoie `POST /api/log-entries` avec tous les champs, une note ou une critique vide part à `null`. Un visiteur est envoyé vers la connexion, puis revient sur la fiche.

Le succès n'est affiché qu'après la réponse de l'API, avec un lien « Voir mon journal ». Mon état sur le film, la moyenne du film et les onglets et compteurs de mon profil sont alors relus : le film sort de la watchlist, passe dans les films vus et l'entrée apparaît dans le journal. En cas d'erreur, le brouillon reste dans le formulaire, même après avoir fermé la fenêtre, et les erreurs de validation (`422`) s'affichent sous les champs concernés. Il est aussi gardé dans le `sessionStorage` de l'onglet, par membre et par film : si la session expire pendant la saisie, le membre se reconnecte et retrouve son brouillon sur la fiche. Il est effacé après l'enregistrement.

Dans mon journal, chaque entrée a les boutons « Modifier » et « Supprimer ». Les autres visiteurs ne les voient pas, et l'API répond de toute façon `403` à un autre membre. La modification envoie `PATCH /api/log-entries/{id}` avec tous les champs. La suppression demande une confirmation puis envoie `DELETE /api/log-entries/{id}`. Le front ne calcule pas lui-même mon état sur le film : il relit les mêmes vues qu'à la création, et c'est l'API qui applique ses règles (seule la dernière entrée change la note et le coup de cœur, une suppression laisse le film vu).

## Thème et navigation

Le thème sombre utilise un gris-bleu pour les fonds et les cartes, et garde le vert comme couleur d'action. Les formulaires partagent les mêmes briques ([`assets/components/form/`](../assets/components/form)) : libellé visible, mention « Facultatif », aide et compteur de caractères sous le champ, erreur juste en dessous, bascules en pastilles et choix exclusifs en cartes (visibilité et type d'une liste).

Sur mobile, le héros de l'accueil grandit avec son contenu et réserve la place de l'en-tête posé dessus, et ses 5 films deviennent une rangée de barres de progression cliquables. La fiche film place le journal et le suivi juste sous l'en-tête, avant le synopsis. La pagination ne garde que la première page, la page courante et la dernière, avec des boutons de 40 px. Entre 1024 et 1280 px, l'en-tête masque le bouton « Créer un compte » et le pseudo du menu de compte pour que la navigation tienne sur une ligne.

Les animations restent légères : entrée douce à chaque nouvelle page, apparition décalée des cartes dans les grilles, rebond du cœur quand on aime. Elles utilisent toutes la même courbe de décélération et sont coupées quand le système demande de réduire les animations.

Les couleurs, polices et rayons viennent d'un thème [TweakCN](https://tweakcn.com), appliqué dans [`assets/app.css`](../assets/app.css) avec :

```bash
npx shadcn@latest add https://tweakcn.com/r/themes/cmww4uejt000104l52cis7jqp
```

Le thème fournit une variante claire et une variante sombre. Le front est toujours affiché en sombre grâce à la classe `dark` posée sur `<html>` dans [`templates/front.html.twig`](../templates/front.html.twig). Après une nouvelle application du thème, vérifier `assets/app.css` : la commande remet l'import de police et des variables propres à l'éditeur de TweakCN, et écrit les ombres avec une syntaxe de couleur invalide. Les autres variables du thème (ombres, polices serif et mono, espacement des lettres) sont gardées telles quelles pour les composants shadcn à venir. La variante claire n'est pas utilisée et n'a pas été vérifiée : son texte blanc sur les couleurs vert, bleu et orange est sous le contraste AA.

La navigation ([`MainNavigation`](../assets/components/MainNavigation.tsx)) s'affiche dans l'en-tête sur desktop et dans un panneau latéral sur mobile, avec des entrées de 48 px de haut. Échap ferme le panneau et rend le focus au bouton, et un lien « Aller au contenu » apparaît à la première tabulation. Les titres utilisent Inter Tight, le texte Inter. L'accueil et la fiche film utilisent la variante immersive du layout : l'en-tête est posé sur l'image et devient opaque au défilement. Une nouvelle page s'y ajoute avec un `NavLink`, qui marque l'entrée active avec `aria-current="page"`.

## Requêtes et cache

- Définir les lectures avec `queryOptions` dans le dossier de la fonctionnalité. La clé contient la ressource et les paramètres de la requête, par exemple `["movies", { sort: "popular", page: "1", limit: "24" }]`. Passer le `signal` de TanStack Query à `apiFetch` pour annuler la requête.
- Une lecture publique identique pour tous, comme le catalogue des films, appelle `apiFetch` avec `session: null`. Si la réponse dépend du membre, préfixer la clé par `sessionKey(session)` et passer cette même session à `apiFetch`, comme pour `/api/me`. Une déconnexion, une expiration ou un changement de compte annule les lectures de la session précédente et efface ses entrées du cache.
- Afficher des squelettes au premier chargement. Pour une pagination ou un filtre, garder les données visibles avec `placeholderData: keepPreviousData` et signaler la mise à jour. Limiter cette conservation à la même session pour les lectures personnalisées. En cas d'erreur, garder les résultats déjà affichés et proposer de relancer la requête avec `refetch`.
- Précharger à l'intention de navigation, par exemple au survol ou à la prise de focus d'un lien vers une fiche. Appeler `queryClient.prefetchQuery` avec les mêmes options que l'écran de destination pour réutiliser son cache.

## Mutations

- Pour une action simple et réversible comme un ajout à la watchlist, préfixer la `mutationKey` avec `sessionKey(session)` et passer cette même session à `apiFetch`. Dans `onMutate`, annuler les lectures concernées, garder une copie des données et appliquer le changement optimiste au cache.
- En cas d'erreur, restaurer la copie dans `onError` et afficher l'erreur. Dans `onSettled`, attendre l'invalidation des clés concernées pour les resynchroniser avec le serveur après un succès ou un échec. Vérifier `isCurrentSession(session)` avant d'écrire dans le cache, y compris après une attente, pour que les callbacks d'une ancienne session ne recréent pas ses données.
- Pour une action avec plusieurs effets côté serveur, comme journaliser un visionnage, attendre la réponse avant d'afficher le succès. En cas d'erreur, garder le brouillon.

Le client partagé [`apiFetch`](../assets/lib/api.ts) ajoute le JWT pour les requêtes authentifiées. Le token et sa date d'expiration sont gardés dans le `localStorage` pour restaurer la session après un rechargement. La session expire au bout d'une heure. Une réponse `401` à une requête de la session active efface aussi la session et renvoie vers la connexion.
