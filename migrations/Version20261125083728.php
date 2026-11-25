<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261125083728 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create the movie list and movie list item tables';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE movie_list (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, name VARCHAR(100) NOT NULL, description CLOB DEFAULT NULL, ranked BOOLEAN NOT NULL, public BOOLEAN NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, user_id INTEGER NOT NULL, CONSTRAINT FK_B7AED915A76ED395 FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE INDEX IDX_B7AED9158B8E8428 ON movie_list (created_at)');
        $this->addSql('CREATE INDEX IDX_B7AED915A76ED395 ON movie_list (user_id)');
        $this->addSql('CREATE TABLE movie_list_item (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, position INTEGER NOT NULL, note CLOB DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, movie_list_id INTEGER NOT NULL, movie_id INTEGER NOT NULL, CONSTRAINT FK_C900F3F11D3854A5 FOREIGN KEY (movie_list_id) REFERENCES movie_list (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_C900F3F18F93B6FC FOREIGN KEY (movie_id) REFERENCES movie (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_C900F3F11D3854A58F93B6FC ON movie_list_item (movie_list_id, movie_id)');
        $this->addSql('CREATE INDEX IDX_C900F3F11D3854A5 ON movie_list_item (movie_list_id)');
        $this->addSql('CREATE INDEX IDX_C900F3F18F93B6FC ON movie_list_item (movie_id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE movie_list_item');
        $this->addSql('DROP TABLE movie_list');
    }
}
