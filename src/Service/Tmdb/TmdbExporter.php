<?php

namespace App\Service\Tmdb;

use App\Entity\Company;
use App\Entity\Country;
use App\Entity\Credit;
use App\Entity\Genre;
use App\Entity\Movie;
use App\Entity\Person;
use App\Repository\MovieRepository;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Remet les films de la base au format des réponses TMDB, pour que l'export soit relu par TmdbImporter
 * sans code de lecture spécifique.
 */
final readonly class TmdbExporter
{
    private const int BATCH_SIZE = 100;

    public function __construct(
        private EntityManagerInterface $entityManager,
        private MovieRepository $movieRepository,
    ) {
    }

    /**
     * @return \Generator<array<string, mixed>>
     */
    public function exportMovies(): \Generator
    {
        foreach (array_chunk($this->movieRepository->findAllTmdbIds(), self::BATCH_SIZE) as $tmdbIds) {
            foreach ($this->movieRepository->findBy(['tmdbId' => $tmdbIds], ['id' => 'ASC']) as $movie) {
                yield $this->exportMovie($movie);
            }
            $this->entityManager->clear();
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function exportMovie(Movie $movie): array
    {
        return [
            'id' => $movie->getTmdbId(),
            'title' => $movie->getTitle(),
            'original_title' => $movie->getOriginalTitle(),
            'overview' => $movie->getOverview(),
            'release_date' => $movie->getReleaseDate()?->format('Y-m-d'),
            'runtime' => $movie->getRuntime(),
            'poster_path' => $movie->getPosterPath(),
            'backdrop_path' => $movie->getBackdropPath(),
            'popularity' => $movie->getPopularity(),
            'vote_average' => $movie->getVoteAverage(),
            'vote_count' => $movie->getVoteCount(),
            'genres' => $movie->getGenres()->map(static fn (Genre $genre): array => [
                'id' => $genre->getTmdbId(),
                'name' => $genre->getName(),
            ])->getValues(),
            'production_companies' => $movie->getCompanies()->map(static fn (Company $company): array => [
                'id' => $company->getTmdbId(),
                'name' => $company->getName(),
                'logo_path' => $company->getLogoPath(),
            ])->getValues(),
            'production_countries' => $movie->getCountries()->map(static fn (Country $country): array => [
                'iso_3166_1' => $country->getCode(),
                'name' => $country->getName(),
            ])->getValues(),
            'credits' => [
                'cast' => array_map(fn (Credit $credit): array => $this->exportPerson($credit->getPerson()) + [
                    'character' => $credit->getCharacter(),
                ], $movie->getCast()),
                'crew' => array_map(fn (Credit $credit): array => $this->exportPerson($credit->getPerson()) + [
                    'job' => $credit->getJob(),
                    'department' => $credit->getDepartment(),
                ], $movie->getCrew()),
            ],
            'watch/providers' => ['results' => $this->exportWatchProviders($movie)],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function exportPerson(Person $person): array
    {
        return [
            'id' => $person->getTmdbId(),
            'name' => $person->getName(),
            'profile_path' => $person->getProfilePath(),
        ];
    }

    /**
     * @return array<string, array<string, list<array<string, mixed>>>> plateformes par pays puis par type d'offre
     */
    private function exportWatchProviders(Movie $movie): array
    {
        $watchProvidersByRegion = [];
        foreach ($movie->getWatchProviders() as $movieWatchProvider) {
            $watchProvider = $movieWatchProvider->getWatchProvider();
            $watchProvidersByRegion[$movieWatchProvider->getRegion()][$movieWatchProvider->getType()->value][] = [
                'provider_id' => $watchProvider->getTmdbId(),
                'provider_name' => $watchProvider->getName(),
                'logo_path' => $watchProvider->getLogoPath(),
            ];
        }

        return $watchProvidersByRegion;
    }
}
