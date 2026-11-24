<?php

namespace App\Command;

use App\Repository\MovieRepository;
use App\Service\Tmdb\TmdbClient;
use App\Service\Tmdb\TmdbImporter;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(name: 'app:tmdb:refresh-providers', description: 'Update the watch providers of the movies already in the catalog')]
final readonly class TmdbRefreshProvidersCommand
{
    public function __construct(
        private TmdbClient $tmdbClient,
        private TmdbImporter $tmdbImporter,
        private MovieRepository $movieRepository,
    ) {
    }

    public function __invoke(SymfonyStyle $io): int
    {
        if (!$this->tmdbClient->hasApiToken()) {
            $io->error('TMDB_API_TOKEN is empty: set it in .env.local.');

            return Command::FAILURE;
        }

        $tmdbIds = $this->movieRepository->findAllTmdbIds();
        $count = $this->tmdbImporter->refreshWatchProviders($io->progressIterate($this->tmdbClient->getWatchProviders($tmdbIds), \count($tmdbIds)));
        $io->success(\sprintf('%d movies updated.', $count));

        return Command::SUCCESS;
    }
}
