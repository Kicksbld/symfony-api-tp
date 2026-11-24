<?php

namespace App\Command;

use App\Service\Tmdb\MovieCatalogFile;
use App\Service\Tmdb\TmdbExporter;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Attribute\Option;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(name: 'app:tmdb:export', description: 'Export the movie catalog to a file that app:tmdb:import --from-file can load')]
final readonly class TmdbExportCommand
{
    public function __construct(
        private TmdbExporter $tmdbExporter,
        private MovieCatalogFile $movieCatalogFile,
    ) {
    }

    public function __invoke(
        SymfonyStyle $io,
        #[Option('Path of the exported file (data/movies.jsonl by default)')]
        ?string $output = null,
    ): int {
        $path = $output ?? $this->movieCatalogFile->getDefaultPath();
        $count = $this->movieCatalogFile->write($path, $this->tmdbExporter->exportMovies());

        $io->success(\sprintf('%d movies exported to %s.', $count, $path));

        return Command::SUCCESS;
    }
}
