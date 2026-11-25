<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20261125091150 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create the like and comment tables for log entries and lists';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE log_entry_comment (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, content VARCHAR(1000) NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, user_id INTEGER NOT NULL, log_entry_id INTEGER NOT NULL, CONSTRAINT FK_87FFAAB4A76ED395 FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_87FFAAB4D465829D FOREIGN KEY (log_entry_id) REFERENCES log_entry (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE INDEX IDX_87FFAAB48B8E8428 ON log_entry_comment (created_at)');
        $this->addSql('CREATE INDEX IDX_87FFAAB4A76ED395 ON log_entry_comment (user_id)');
        $this->addSql('CREATE INDEX IDX_87FFAAB4D465829D ON log_entry_comment (log_entry_id)');
        $this->addSql('CREATE TABLE log_entry_like (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, user_id INTEGER NOT NULL, log_entry_id INTEGER NOT NULL, CONSTRAINT FK_257941BA76ED395 FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_257941BD465829D FOREIGN KEY (log_entry_id) REFERENCES log_entry (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_257941BA76ED395D465829D ON log_entry_like (user_id, log_entry_id)');
        $this->addSql('CREATE INDEX IDX_257941BA76ED395 ON log_entry_like (user_id)');
        $this->addSql('CREATE INDEX IDX_257941BD465829D ON log_entry_like (log_entry_id)');
        $this->addSql('CREATE TABLE movie_list_comment (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, content VARCHAR(1000) NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, user_id INTEGER NOT NULL, movie_list_id INTEGER NOT NULL, CONSTRAINT FK_6BCD6E52A76ED395 FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_6BCD6E521D3854A5 FOREIGN KEY (movie_list_id) REFERENCES movie_list (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE INDEX IDX_6BCD6E528B8E8428 ON movie_list_comment (created_at)');
        $this->addSql('CREATE INDEX IDX_6BCD6E52A76ED395 ON movie_list_comment (user_id)');
        $this->addSql('CREATE INDEX IDX_6BCD6E521D3854A5 ON movie_list_comment (movie_list_id)');
        $this->addSql('CREATE TABLE movie_list_like (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, user_id INTEGER NOT NULL, movie_list_id INTEGER NOT NULL, CONSTRAINT FK_7A78965CA76ED395 FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_7A78965C1D3854A5 FOREIGN KEY (movie_list_id) REFERENCES movie_list (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_7A78965CA76ED3951D3854A5 ON movie_list_like (user_id, movie_list_id)');
        $this->addSql('CREATE INDEX IDX_7A78965CA76ED395 ON movie_list_like (user_id)');
        $this->addSql('CREATE INDEX IDX_7A78965C1D3854A5 ON movie_list_like (movie_list_id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE log_entry_comment');
        $this->addSql('DROP TABLE log_entry_like');
        $this->addSql('DROP TABLE movie_list_comment');
        $this->addSql('DROP TABLE movie_list_like');
    }
}
