<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261124151407 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create the movie catalog tables';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE company (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, tmdb_id INTEGER NOT NULL, name VARCHAR(255) NOT NULL, logo_path VARCHAR(255) DEFAULT NULL)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_4FBF094F55BCC5E5 ON company (tmdb_id)');
        $this->addSql('CREATE TABLE country (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, code VARCHAR(2) NOT NULL, name VARCHAR(100) NOT NULL)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_5373C96677153098 ON country (code)');
        $this->addSql('CREATE TABLE credit (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, type VARCHAR(255) NOT NULL, character VARCHAR(255) DEFAULT NULL, job VARCHAR(100) DEFAULT NULL, department VARCHAR(100) DEFAULT NULL, position INTEGER NOT NULL, movie_id INTEGER NOT NULL, person_id INTEGER NOT NULL, CONSTRAINT FK_1CC16EFE8F93B6FC FOREIGN KEY (movie_id) REFERENCES movie (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_1CC16EFE217BBB47 FOREIGN KEY (person_id) REFERENCES person (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE INDEX IDX_1CC16EFE8F93B6FC ON credit (movie_id)');
        $this->addSql('CREATE INDEX IDX_1CC16EFE217BBB47 ON credit (person_id)');
        $this->addSql('CREATE TABLE genre (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, tmdb_id INTEGER NOT NULL, name VARCHAR(100) NOT NULL)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_835033F855BCC5E5 ON genre (tmdb_id)');
        $this->addSql('CREATE TABLE movie (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, tmdb_id INTEGER NOT NULL, title VARCHAR(255) NOT NULL, original_title VARCHAR(255) NOT NULL, overview CLOB DEFAULT NULL, release_date DATE DEFAULT NULL, runtime SMALLINT DEFAULT NULL, poster_path VARCHAR(255) DEFAULT NULL, popularity DOUBLE PRECISION NOT NULL, vote_average DOUBLE PRECISION NOT NULL, vote_count INTEGER NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_1D5EF26F55BCC5E5 ON movie (tmdb_id)');
        $this->addSql('CREATE TABLE movie_genre (movie_id INTEGER NOT NULL, genre_id INTEGER NOT NULL, PRIMARY KEY (movie_id, genre_id), CONSTRAINT FK_FD1229648F93B6FC FOREIGN KEY (movie_id) REFERENCES movie (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_FD1229644296D31F FOREIGN KEY (genre_id) REFERENCES genre (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE INDEX IDX_FD1229648F93B6FC ON movie_genre (movie_id)');
        $this->addSql('CREATE INDEX IDX_FD1229644296D31F ON movie_genre (genre_id)');
        $this->addSql('CREATE TABLE movie_company (movie_id INTEGER NOT NULL, company_id INTEGER NOT NULL, PRIMARY KEY (movie_id, company_id), CONSTRAINT FK_6F294B618F93B6FC FOREIGN KEY (movie_id) REFERENCES movie (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_6F294B61979B1AD6 FOREIGN KEY (company_id) REFERENCES company (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE INDEX IDX_6F294B618F93B6FC ON movie_company (movie_id)');
        $this->addSql('CREATE INDEX IDX_6F294B61979B1AD6 ON movie_company (company_id)');
        $this->addSql('CREATE TABLE movie_country (movie_id INTEGER NOT NULL, country_id INTEGER NOT NULL, PRIMARY KEY (movie_id, country_id), CONSTRAINT FK_73E58B488F93B6FC FOREIGN KEY (movie_id) REFERENCES movie (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_73E58B48F92F3E70 FOREIGN KEY (country_id) REFERENCES country (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE INDEX IDX_73E58B488F93B6FC ON movie_country (movie_id)');
        $this->addSql('CREATE INDEX IDX_73E58B48F92F3E70 ON movie_country (country_id)');
        $this->addSql('CREATE TABLE movie_watch_provider (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, region VARCHAR(2) NOT NULL, type VARCHAR(255) NOT NULL, movie_id INTEGER NOT NULL, watch_provider_id INTEGER NOT NULL, CONSTRAINT FK_D85DDBD58F93B6FC FOREIGN KEY (movie_id) REFERENCES movie (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_D85DDBD51DB79FA6 FOREIGN KEY (watch_provider_id) REFERENCES watch_provider (id) NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE INDEX IDX_D85DDBD58F93B6FC ON movie_watch_provider (movie_id)');
        $this->addSql('CREATE INDEX IDX_D85DDBD51DB79FA6 ON movie_watch_provider (watch_provider_id)');
        $this->addSql('CREATE TABLE person (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, tmdb_id INTEGER NOT NULL, name VARCHAR(255) NOT NULL, profile_path VARCHAR(255) DEFAULT NULL)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_34DCD17655BCC5E5 ON person (tmdb_id)');
        $this->addSql('CREATE TABLE watch_provider (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, tmdb_id INTEGER NOT NULL, name VARCHAR(255) NOT NULL, logo_path VARCHAR(255) DEFAULT NULL)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_FB3B4FFD55BCC5E5 ON watch_provider (tmdb_id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE company');
        $this->addSql('DROP TABLE country');
        $this->addSql('DROP TABLE credit');
        $this->addSql('DROP TABLE genre');
        $this->addSql('DROP TABLE movie');
        $this->addSql('DROP TABLE movie_genre');
        $this->addSql('DROP TABLE movie_company');
        $this->addSql('DROP TABLE movie_country');
        $this->addSql('DROP TABLE movie_watch_provider');
        $this->addSql('DROP TABLE person');
        $this->addSql('DROP TABLE watch_provider');
    }
}
