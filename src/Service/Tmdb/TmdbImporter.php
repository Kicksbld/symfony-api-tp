<?php

namespace App\Service\Tmdb;

use App\Entity\Company;
use App\Entity\Country;
use App\Entity\Credit;
use App\Entity\Genre;
use App\Entity\Movie;
use App\Entity\MovieWatchProvider;
use App\Entity\Person;
use App\Entity\WatchProvider;
use App\Enum\CreditType;
use App\Enum\WatchProviderType;
use App\Repository\MovieRepository;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Transforme les réponses de TMDB en entités. Chaque entité est retrouvée par son identifiant TMDB
 * (ou son code pour les pays), ce qui permet de relancer l'import sans créer de doublon.
 */
final class TmdbImporter
{
    private const int CAST_LIMIT = 15;

    // Postes importés, dans l'ordre d'affichage de l'équipe.
    private const array CREW_JOBS = ['Director', 'Screenplay', 'Writer', 'Director of Photography', 'Original Music Composer', 'Editor'];

    // Nombre de films gardés en mémoire avant d'écrire en base et de vider l'EntityManager.
    private const int BATCH_SIZE = 50;

    /**
     * Entités déjà chargées ou créées depuis le dernier flush, indexées par classe et identifiant.
     * Sans ce cache, une personne présente deux fois dans un film (réalisateur et scénariste) serait créée deux fois.
     *
     * @var array<string, object>
     */
    private array $loadedEntities = [];

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly MovieRepository $movieRepository,
    ) {
    }

    /**
     * @param iterable<array<string, mixed>> $tmdbMovies
     *
     * @return int nombre de films importés
     */
    public function importMovies(iterable $tmdbMovies): int
    {
        $count = 0;
        foreach ($tmdbMovies as $tmdbMovie) {
            $this->importMovie($tmdbMovie);

            if (0 === ++$count % self::BATCH_SIZE) {
                $this->flushAndClear();
            }
        }
        $this->flushAndClear();

        return $count;
    }

    /**
     * Met à jour uniquement les plateformes des films déjà en base.
     *
     * @param iterable<int, array<string, mixed>> $watchProvidersByTmdbId
     *
     * @return int nombre de films mis à jour
     */
    public function refreshWatchProviders(iterable $watchProvidersByTmdbId): int
    {
        $count = 0;
        foreach ($watchProvidersByTmdbId as $tmdbId => $watchProviders) {
            $movie = $this->movieRepository->findOneBy(['tmdbId' => $tmdbId]);
            if (null === $movie) {
                continue;
            }

            $this->updateWatchProviders($movie, $watchProviders);

            if (0 === ++$count % self::BATCH_SIZE) {
                $this->flushAndClear();
            }
        }
        $this->flushAndClear();

        return $count;
    }

    /**
     * @param array<string, mixed> $data
     */
    private function importMovie(array $data): void
    {
        $movie = $this->findOrCreate(Movie::class, 'tmdbId', $data['id'])
            ->setTmdbId($data['id'])
            ->setTitle($data['title'])
            ->setOriginalTitle($data['original_title'])
            ->setOverview(($data['overview'] ?? '') ?: null)
            ->setReleaseDate(empty($data['release_date']) ? null : new \DateTimeImmutable($data['release_date']))
            ->setRuntime(($data['runtime'] ?? 0) ?: null)
            ->setPosterPath($data['poster_path'] ?? null)
            ->setBackdropPath($data['backdrop_path'] ?? null)
            ->setPopularity($data['popularity'])
            ->setVoteAverage($data['vote_average'])
            ->setVoteCount($data['vote_count'])
            ->replaceGenres(array_map($this->importGenre(...), $data['genres']))
            ->replaceCompanies(array_map($this->importCompany(...), $data['production_companies']))
            ->replaceCountries(array_map($this->importCountry(...), $data['production_countries']))
            ->replaceCredits($this->createCredits($data['credits']));

        $this->updateWatchProviders($movie, $data['watch/providers']['results']);
    }

    /**
     * @param array<string, mixed> $data
     */
    private function importGenre(array $data): Genre
    {
        return $this->findOrCreate(Genre::class, 'tmdbId', $data['id'])
            ->setTmdbId($data['id'])
            ->setName($data['name']);
    }

    /**
     * @param array<string, mixed> $data
     */
    private function importCompany(array $data): Company
    {
        return $this->findOrCreate(Company::class, 'tmdbId', $data['id'])
            ->setTmdbId($data['id'])
            ->setName($data['name'])
            ->setLogoPath($data['logo_path'] ?? null);
    }

    /**
     * @param array<string, mixed> $data
     */
    private function importCountry(array $data): Country
    {
        return $this->findOrCreate(Country::class, 'code', $data['iso_3166_1'])
            ->setCode($data['iso_3166_1'])
            ->setName($data['name']);
    }

    /**
     * @param array<string, mixed> $data
     */
    private function importPerson(array $data): Person
    {
        return $this->findOrCreate(Person::class, 'tmdbId', $data['id'])
            ->setTmdbId($data['id'])
            ->setName($data['name'])
            ->setProfilePath($data['profile_path'] ?? null);
    }

    /**
     * @param array<string, mixed> $data
     */
    private function importWatchProvider(array $data): WatchProvider
    {
        return $this->findOrCreate(WatchProvider::class, 'tmdbId', $data['provider_id'])
            ->setTmdbId($data['provider_id'])
            ->setName($data['provider_name'])
            ->setLogoPath($data['logo_path'] ?? null);
    }

    /**
     * @param array{cast: list<array<string, mixed>>, crew: list<array<string, mixed>>} $data
     *
     * @return list<Credit>
     */
    private function createCredits(array $data): array
    {
        $credits = [];

        foreach (\array_slice($data['cast'], 0, self::CAST_LIMIT) as $position => $castData) {
            $credits[] = (new Credit())
                ->setType(CreditType::Cast)
                ->setPerson($this->importPerson($castData))
                ->setCharacter(($castData['character'] ?? '') ?: null)
                ->setPosition($position);
        }

        $crew = [];
        foreach ($data['crew'] as $crewData) {
            // TMDB liste parfois deux fois la même personne au même poste.
            if (\in_array($crewData['job'], self::CREW_JOBS, true)) {
                $crew[$crewData['id'].'|'.$crewData['job']] ??= $crewData;
            }
        }
        usort($crew, static fn (array $a, array $b): int => array_search($a['job'], self::CREW_JOBS, true) <=> array_search($b['job'], self::CREW_JOBS, true));

        foreach ($crew as $position => $crewData) {
            $credits[] = (new Credit())
                ->setType(CreditType::Crew)
                ->setPerson($this->importPerson($crewData))
                ->setJob($crewData['job'])
                ->setDepartment($crewData['department'])
                ->setPosition($position);
        }

        return $credits;
    }

    /**
     * @param array<string, array<string, mixed>> $watchProvidersByRegion réponse TMDB indexée par pays
     */
    private function updateWatchProviders(Movie $movie, array $watchProvidersByRegion): void
    {
        $movieWatchProviders = [];

        foreach (MovieWatchProvider::REGIONS as $region) {
            foreach (WatchProviderType::cases() as $type) {
                foreach ($watchProvidersByRegion[$region][$type->value] ?? [] as $watchProviderData) {
                    $movieWatchProviders[] = (new MovieWatchProvider())
                        ->setWatchProvider($this->importWatchProvider($watchProviderData))
                        ->setRegion($region)
                        ->setType($type);
                }
            }
        }

        $movie->replaceWatchProviders($movieWatchProviders);
    }

    /**
     * @template T of object
     *
     * @param class-string<T> $class
     *
     * @return T
     */
    private function findOrCreate(string $class, string $field, int|string $value): object
    {
        $key = $class.'#'.$value;

        if (!isset($this->loadedEntities[$key])) {
            $entity = $this->entityManager->getRepository($class)->findOneBy([$field => $value]);

            if (null === $entity) {
                $entity = new $class();
                $this->entityManager->persist($entity);
            }

            $this->loadedEntities[$key] = $entity;
        }

        return $this->loadedEntities[$key];
    }

    private function flushAndClear(): void
    {
        $this->entityManager->flush();
        $this->entityManager->clear();
        $this->loadedEntities = [];
    }
}
