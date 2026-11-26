<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261126084440 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add the backdrop path to movies';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE movie ADD COLUMN backdrop_path VARCHAR(255) DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('CREATE TEMPORARY TABLE __temp__movie AS SELECT id, tmdb_id, title, original_title, overview, release_date, runtime, poster_path, popularity, vote_average, vote_count, average_rating, rating_count, created_at, updated_at FROM movie');
        $this->addSql('DROP TABLE movie');
        $this->addSql('CREATE TABLE movie (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, tmdb_id INTEGER NOT NULL, title VARCHAR(255) NOT NULL, original_title VARCHAR(255) NOT NULL, overview CLOB DEFAULT NULL, release_date DATE DEFAULT NULL, runtime SMALLINT DEFAULT NULL, poster_path VARCHAR(255) DEFAULT NULL, popularity DOUBLE PRECISION NOT NULL, vote_average DOUBLE PRECISION NOT NULL, vote_count INTEGER NOT NULL, average_rating DOUBLE PRECISION DEFAULT NULL, rating_count INTEGER DEFAULT 0 NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL)');
        $this->addSql('INSERT INTO movie (id, tmdb_id, title, original_title, overview, release_date, runtime, poster_path, popularity, vote_average, vote_count, average_rating, rating_count, created_at, updated_at) SELECT id, tmdb_id, title, original_title, overview, release_date, runtime, poster_path, popularity, vote_average, vote_count, average_rating, rating_count, created_at, updated_at FROM __temp__movie');
        $this->addSql('DROP TABLE __temp__movie');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_1D5EF26F55BCC5E5 ON movie (tmdb_id)');
    }
}
