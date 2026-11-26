# Déploiement

La version en ligne est hébergée sur une VM gratuite d'[Oracle Cloud](https://www.oracle.com/cloud/free/) (offre Always Free, région Paris) :

| | |
| --- | --- |
| Adresse | https://158-178-194-149.sslip.io |
| Machine | VM.Standard.A1.Flex, 2 cœurs ARM et 12 Go de RAM, Ubuntu 24.04 |
| Serveur web | [FrankenPHP](https://frankenphp.dev), le serveur PHP mis en avant par Symfony, construit sur Caddy |
| PHP | 8.6, inclus dans le binaire FrankenPHP avec ses extensions (`pdo_sqlite`, `intl`, OPcache...) |
| Base | SQLite dans `var/data_prod.db`, sur la VM |
| HTTPS | Certificat Let's Encrypt obtenu et renouvelé automatiquement par FrankenPHP |

[sslip.io](https://sslip.io) est un service DNS gratuit : `158-178-194-149.sslip.io` pointe simplement vers l'IP de la VM. Ça permet d'avoir un nom de domaine, donc un certificat HTTPS, sans en acheter un.

Le dossier [`deploy/`](../deploy) contient la configuration du serveur :

- [`Caddyfile`](../deploy/Caddyfile) : sert le dossier `public/`, passe les requêtes à Symfony avec `php_server`, compresse les réponses et met en cache longtemps les fichiers buildés par Vite ;
- [`frankenphp.service`](../deploy/frankenphp.service) : service systemd qui lance FrankenPHP au démarrage de la VM et le relance s'il plante ;
- [`deploy.sh`](../deploy/deploy.sh) : script de mise en ligne, lancé depuis son poste.

## Mettre à jour la version en ligne

Depuis la racine du projet, avec la clé SSH de la VM :

```bash
deploy/deploy.sh ubuntu@158.178.194.149 ~/.ssh/oracle_tp
```

Le script :

1. construit le front en local avec `npm run build` ;
2. envoie les fichiers du projet et `public/build/` sur la VM avec `rsync` ;
3. lance sur la VM `composer install --no-dev`, `composer dump-env prod`, les migrations Doctrine et `cache:clear` ;
4. redémarre FrankenPHP (le site est coupé une ou deux secondes).

La base, les clés JWT, `.env.local` et `vendor/` restent sur la VM : `rsync` ne les envoie pas et ne les supprime pas. Les données créées en ligne sont donc conservées d'un déploiement à l'autre.

## Installer le serveur

Ces étapes ne se font qu'une fois, sur une VM Ubuntu neuve.

Côté Oracle Cloud, ouvrir les ports `80` et `443` en TCP dans la liste de sécurité du sous-réseau. Les images Ubuntu d'Oracle bloquent aussi tout sauf le SSH dans `iptables`, il faut donc les ouvrir sur la VM :

```bash
sudo apt-get install -y rsync iptables-persistent
sudo iptables -I INPUT 5 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 5 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

Installer FrankenPHP (binaire `linux-aarch64` des [releases](https://github.com/php/frankenphp/releases), ou `linux-x86_64` sur une machine Intel ou AMD) et Composer :

```bash
curl -fsSL -o /tmp/frankenphp https://github.com/php/frankenphp/releases/download/v1.14.0/frankenphp-linux-aarch64
sudo install -m 755 /tmp/frankenphp /usr/local/bin/frankenphp
curl -fsSL -o /tmp/composer.phar https://getcomposer.org/download/latest-stable/composer.phar
sudo install -m 755 /tmp/composer.phar /usr/local/bin/composer.phar
```

FrankenPHP n'installe pas de commande `php`. On ajoute deux petits raccourcis, et `PHP_BINARY` pour que les scripts de Composer lancent `bin/console` avec PHP et pas avec le serveur :

```bash
printf '#!/bin/sh\nexec /usr/local/bin/frankenphp php-cli "$@"\n' | sudo tee /usr/local/bin/php
printf '#!/bin/sh\nexec /usr/local/bin/php /usr/local/bin/composer.phar "$@"\n' | sudo tee /usr/local/bin/composer
sudo chmod 755 /usr/local/bin/php /usr/local/bin/composer
echo 'PHP_BINARY=/usr/local/bin/php' | sudo tee -a /etc/environment
```

Préparer le dossier du projet, le nom de domaine utilisé par le `Caddyfile` et la configuration de prod de Symfony :

```bash
sudo mkdir -p /var/www/letterboxd && sudo chown ubuntu:ubuntu /var/www/letterboxd
printf 'SERVER_NAME=158-178-194-149.sslip.io\nAPP_DIR=/var/www/letterboxd\n' | sudo tee /etc/frankenphp.env
printf 'APP_ENV=prod\nAPP_DEBUG=0\nAPP_SECRET=%s\nDEFAULT_URI=https://158-178-194-149.sslip.io\n' "$(openssl rand -hex 16)" > /var/www/letterboxd/.env.local
```

Depuis son poste, installer le service puis faire le premier déploiement (il crée aussi la base avec les migrations) :

```bash
scp -i ~/.ssh/oracle_tp deploy/frankenphp.service ubuntu@158.178.194.149:/tmp/
ssh -i ~/.ssh/oracle_tp ubuntu@158.178.194.149 'sudo install -m 644 /tmp/frankenphp.service /etc/systemd/system/ && sudo systemctl daemon-reload && sudo systemctl enable frankenphp'
deploy/deploy.sh ubuntu@158.178.194.149 ~/.ssh/oracle_tp
```

Enfin, sur la VM dans `/var/www/letterboxd`, générer les clés JWT et charger les données comme en local :

```bash
php bin/console lexik:jwt:generate-keypair
php bin/console app:tmdb:import --from-file --no-debug
php bin/console app:seed-demo
```

Les logs du serveur se lisent avec `sudo journalctl -u frankenphp -f`.
