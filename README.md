# Letterboxd API

API REST inspirée de [Letterboxd](https://letterboxd.com), réalisée pour le TP Symfony du module CCI DNMADE3. Chaque membre peut tenir un journal des films qu'il regarde, les noter, écrire des critiques, faire des listes et suivre d'autres membres.

Le projet ne contient que l'API : pas de front, toutes les routes renvoient du JSON et sont testables avec les fichiers du dossier [`http/`](http).

## Stack

- PHP 8.4 ou plus et Symfony 8.1
- Doctrine ORM avec une base SQLite (aucun serveur de base de données à installer)
- LexikJWTAuthenticationBundle pour l'authentification par token JWT
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
```

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

Règles de validation :

- `email` : adresse valide et unique.
- `username` : unique, de 3 à 20 caractères, uniquement des minuscules, des chiffres et `_`.
- `password` : 8 caractères minimum.
- `bio` : 500 caractères maximum, une chaîne vide efface la bio.

Codes de retour utilisés : `200` lecture et modification, `201` création, `401` non connecté ou mauvais identifiants, `404` ressource introuvable, `422` données invalides (avec la liste des champs en erreur dans `violations`). Toutes les erreurs sont renvoyées en JSON.

## Tests

```bash
php bin/phpunit
```

Les tests fonctionnels envoient de vraies requêtes HTTP à l'API. Ils utilisent une base SQLite séparée (`var/data_test.db`), créée automatiquement au premier lancement, et chaque test tourne dans une transaction annulée à la fin.

## Qualité du code

```bash
vendor/bin/php-cs-fixer fix          # style @Symfony
php bin/console lint:container       # vérification du conteneur de services
```
