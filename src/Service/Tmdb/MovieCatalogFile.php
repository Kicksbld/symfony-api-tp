<?php

namespace App\Service\Tmdb;

use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * Fichier JSON Lines : un film par ligne, au format des réponses TMDB.
 * Le fichier est lu ligne par ligne pour ne pas charger tout le catalogue en mémoire.
 */
final readonly class MovieCatalogFile
{
    public function __construct(
        #[Autowire('%kernel.project_dir%/data/movies.jsonl')]
        private string $defaultPath,
    ) {
    }

    public function getDefaultPath(): string
    {
        return $this->defaultPath;
    }

    /**
     * @return \Generator<array<string, mixed>>
     */
    public function read(string $path): \Generator
    {
        foreach (new \SplFileObject($path, 'r') as $line) {
            if ('' !== trim($line)) {
                yield json_decode($line, true, flags: \JSON_THROW_ON_ERROR);
            }
        }
    }

    /**
     * @param iterable<array<string, mixed>> $tmdbMovies
     *
     * @return int nombre de films écrits
     */
    public function write(string $path, iterable $tmdbMovies): int
    {
        $file = new \SplFileObject($path, 'w');

        $count = 0;
        foreach ($tmdbMovies as $tmdbMovie) {
            $file->fwrite(json_encode($tmdbMovie, \JSON_UNESCAPED_SLASHES | \JSON_UNESCAPED_UNICODE | \JSON_THROW_ON_ERROR)."\n");
            ++$count;
        }

        return $count;
    }
}
