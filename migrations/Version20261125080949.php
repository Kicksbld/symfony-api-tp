<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261125080949 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create the movie relationship table and store the average rating of the members';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE movie_relationship (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, watched BOOLEAN NOT NULL, liked BOOLEAN NOT NULL, rating SMALLINT DEFAULT NULL, in_watchlist BOOLEAN NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, user_id INTEGER NOT NULL, movie_id INTEGER NOT NULL, CONSTRAINT FK_3F2A593A76ED395 FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_3F2A5938F93B6FC FOREIGN KEY (movie_id) REFERENCES movie (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_3F2A593A76ED3958F93B6FC ON movie_relationship (user_id, movie_id)');
        $this->addSql('CREATE INDEX IDX_3F2A593A76ED395 ON movie_relationship (user_id)');
        $this->addSql('CREATE INDEX IDX_3F2A5938F93B6FC ON movie_relationship (movie_id)');
        $this->addSql('ALTER TABLE movie ADD COLUMN average_rating DOUBLE PRECISION DEFAULT NULL');
        $this->addSql('ALTER TABLE movie ADD COLUMN rating_count INTEGER DEFAULT 0 NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE movie_relationship');
        $this->addSql('CREATE TEMPORARY TABLE __temp__movie AS SELECT id, tmdb_id, title, original_title, overview, release_date, runtime, poster_path, popularity, vote_average, vote_count, created_at, updated_at FROM movie');
        $this->addSql('DROP TABLE movie');
        $this->addSql('CREATE TABLE movie (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, tmdb_id INTEGER NOT NULL, title VARCHAR(255) NOT NULL, original_title VARCHAR(255) NOT NULL, overview CLOB DEFAULT NULL, release_date DATE DEFAULT NULL, runtime SMALLINT DEFAULT NULL, poster_path VARCHAR(255) DEFAULT NULL, popularity DOUBLE PRECISION NOT NULL, vote_average DOUBLE PRECISION NOT NULL, vote_count INTEGER NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL)');
        $this->addSql('INSERT INTO movie (id, tmdb_id, title, original_title, overview, release_date, runtime, poster_path, popularity, vote_average, vote_count, created_at, updated_at) SELECT id, tmdb_id, title, original_title, overview, release_date, runtime, poster_path, popularity, vote_average, vote_count, created_at, updated_at FROM __temp__movie');
        $this->addSql('DROP TABLE __temp__movie');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_1D5EF26F55BCC5E5 ON movie (tmdb_id)');
    }
}
