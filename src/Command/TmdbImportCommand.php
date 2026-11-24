<?php

namespace App\Command;

use App\Service\Tmdb\MovieCatalogFile;
use App\Service\Tmdb\TmdbClient;
use App\Service\Tmdb\TmdbImporter;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Attribute\Option;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(name: 'app:tmdb:import', description: 'Import popular and top rated movies from TMDB, or from an exported file')]
final readonly class TmdbImportCommand
{
    public function __construct(
        private TmdbClient $tmdbClient,
        private TmdbImporter $tmdbImporter,
        private MovieCatalogFile $movieCatalogFile,
    ) {
    }

    public function __invoke(
        SymfonyStyle $io,
        #[Option('Number of pages (20 movies each) fetched from each TMDB list')]
        int $pages = 50,
        #[Option('Load the movies from an exported file instead of calling TMDB (data/movies.jsonl by default)')]
        string|bool $fromFile = false,
    ): int {
        if (false !== $fromFile) {
            return $this->importFromFile($io, true === $fromFile ? $this->movieCatalogFile->getDefaultPath() : $fromFile);
        }

        if (!$this->tmdbClient->hasApiToken()) {
            $io->error('TMDB_API_TOKEN is empty: set it in .env.local or use --from-file.');

            return Command::FAILURE;
        }

        $io->text('Fetching the popular and top rated lists...');
        $tmdbIds = $this->tmdbClient->getPopularAndTopRatedMovieIds($pages);

        $count = $this->tmdbImporter->importMovies($io->progressIterate($this->tmdbClient->getMovies($tmdbIds), \count($tmdbIds)));
        $io->success(\sprintf('%d movies imported.', $count));

        return Command::SUCCESS;
    }

    private function importFromFile(SymfonyStyle $io, string $path): int
    {
        if (!is_file($path)) {
            $io->error(\sprintf('The file "%s" does not exist, run app:tmdb:export first.', $path));

            return Command::FAILURE;
        }

        $count = $this->tmdbImporter->importMovies($io->progressIterate($this->movieCatalogFile->read($path)));
        $io->success(\sprintf('%d movies imported from %s.', $count, $path));

        return Command::SUCCESS;
    }
}
