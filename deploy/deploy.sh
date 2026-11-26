#!/usr/bin/env bash
# Met en ligne la version locale du projet : build du front ici, puis envoi des fichiers,
# dépendances, migrations et redémarrage de FrankenPHP sur le serveur.
set -euo pipefail

HOST="${1:?Usage : deploy/deploy.sh ubuntu@<ip> [cle_ssh]}"
SSH_KEY="${2:-$HOME/.ssh/id_ed25519}"
APP_DIR=/var/www/letterboxd
SSH="ssh -i $SSH_KEY"

cd "$(dirname "$0")/.."
npm run build

# Ce qui est exclu ici n'est ni envoyé ni supprimé sur le serveur : la base, les secrets et les dépendances y restent.
rsync -az --delete -e "$SSH" \
    --exclude-from=.git/info/exclude \
    --exclude /.git/ --exclude /node_modules/ --exclude /vendor/ --exclude /var/ \
    --exclude /.env.local --exclude /.env.local.php --exclude '/config/jwt/*.pem' \
    --exclude /public/build/ --exclude /public/bundles/ \
    --exclude .DS_Store --exclude /.idea/ --exclude /.vscode/ \
    --exclude /.phpunit.cache/ --exclude /.php-cs-fixer.cache --exclude /phpunit.xml \
    ./ "$HOST:$APP_DIR/"
rsync -az --delete -e "$SSH" public/build/ "$HOST:$APP_DIR/public/build/"

$SSH "$HOST" "cd $APP_DIR \
    && composer install --no-dev --optimize-autoloader --classmap-authoritative --no-interaction \
    && composer dump-env prod \
    && php bin/console doctrine:migrations:migrate -n \
    && php bin/console cache:clear \
    && sudo systemctl restart frankenphp"
