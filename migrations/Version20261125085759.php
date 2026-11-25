<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261125085759 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create the favorite movie table';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE favorite_movie (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, position INTEGER NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, user_id INTEGER NOT NULL, movie_id INTEGER NOT NULL, CONSTRAINT FK_ABD6D94BA76ED395 FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_ABD6D94B8F93B6FC FOREIGN KEY (movie_id) REFERENCES movie (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_ABD6D94BA76ED3958F93B6FC ON favorite_movie (user_id, movie_id)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_ABD6D94BA76ED395462CE4F5 ON favorite_movie (user_id, position)');
        $this->addSql('CREATE INDEX IDX_ABD6D94BA76ED395 ON favorite_movie (user_id)');
        $this->addSql('CREATE INDEX IDX_ABD6D94B8F93B6FC ON favorite_movie (movie_id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE favorite_movie');
    }
}
