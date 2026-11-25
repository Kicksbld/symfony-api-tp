<?php

namespace App\Command;

use App\Repository\MovieRepository;
use App\Service\DemoDataSeeder;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(name: 'app:seed-demo', description: 'Create demo members with their activity, from the movies already in the catalog')]
final readonly class SeedDemoCommand
{
    public function __construct(
        private DemoDataSeeder $demoDataSeeder,
        private MovieRepository $movieRepository,
    ) {
    }

    public function __invoke(SymfonyStyle $io): int
    {
        if (0 === $this->movieRepository->count()) {
            $io->error('The movie catalog is empty, load it first with app:tmdb:import --from-file.');

            return Command::FAILURE;
        }
        if ($this->demoDataSeeder->isSeeded()) {
            $io->note('Demo data is already loaded, nothing was created.');
            $this->listAccounts($io);

            return Command::SUCCESS;
        }

        $this->demoDataSeeder->seed();

        $io->success('Demo data loaded.');
        $this->listAccounts($io);

        return Command::SUCCESS;
    }

    private function listAccounts(SymfonyStyle $io): void
    {
        $rows = [];
        foreach (DemoDataSeeder::USERS as $username => $profile) {
            $rows[] = [$username, $profile['email'], DemoDataSeeder::PASSWORD];
        }

        $io->table(['Username', 'Email', 'Password'], $rows);
    }
}
