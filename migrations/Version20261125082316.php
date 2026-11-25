<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261125082316 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create the log entry table';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE log_entry (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, watched_on DATE DEFAULT NULL, rating SMALLINT DEFAULT NULL, liked BOOLEAN NOT NULL, rewatch BOOLEAN NOT NULL, review CLOB DEFAULT NULL, contains_spoilers BOOLEAN NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, user_id INTEGER NOT NULL, movie_id INTEGER NOT NULL, CONSTRAINT FK_B5F762DA76ED395 FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_B5F762D8F93B6FC FOREIGN KEY (movie_id) REFERENCES movie (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE INDEX IDX_B5F762D8B8E8428 ON log_entry (created_at)');
        $this->addSql('CREATE INDEX IDX_B5F762DA76ED395 ON log_entry (user_id)');
        $this->addSql('CREATE INDEX IDX_B5F762D8F93B6FC ON log_entry (movie_id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE log_entry');
    }
}
