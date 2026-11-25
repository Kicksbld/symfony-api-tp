<?php

namespace App\Repository;

use App\Dto\MovieSearchDto;
use App\Dto\PersonMovieSearchDto;
use App\Entity\Movie;
use App\Entity\Person;
use App\Enum\CreditType;
use App\Enum\MovieSort;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Movie>
 */
class MovieRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Movie::class);
    }

    public function createSearchQueryBuilder(MovieSearchDto $movieSearchDto): QueryBuilder
    {
        $queryBuilder = $this->createQueryBuilder('movie');

        // LIKE ignore déjà la casse sous SQLite. LOWER() n'y gère que l'ASCII et casserait les titres accentués.
        if (null !== $movieSearchDto->q) {
            $queryBuilder
                ->andWhere('movie.title LIKE :q OR movie.originalTitle LIKE :q')
                ->setParameter('q', '%'.$movieSearchDto->q.'%');
        }

        if (null !== $movieSearchDto->genre) {
            $queryBuilder
                ->andWhere(':genre MEMBER OF movie.genres')
                ->setParameter('genre', $movieSearchDto->genre);
        }

        if (null !== $movieSearchDto->decade) {
            $this->filterByReleasePeriod($queryBuilder, 'decade', $movieSearchDto->decade, 10);
        }

        if (null !== $movieSearchDto->year) {
            $this->filterByReleasePeriod($queryBuilder, 'year', $movieSearchDto->year, 1);
        }

        if (null !== $movieSearchDto->country) {
            $queryBuilder
                ->innerJoin('movie.countries', 'country')
                ->andWhere('country.code = :country')
                ->setParameter('country', $movieSearchDto->country);
        }

        if (null !== $movieSearchDto->company) {
            $queryBuilder
                ->andWhere(':company MEMBER OF movie.companies')
                ->setParameter('company', $movieSearchDto->company);
        }

        if (null !== $movieSearchDto->person) {
            $this->filterByPerson($queryBuilder, $movieSearchDto->person);
        }

        // Un film peut être à la fois en location et à l'achat sur la même plateforme : le Paginator dédoublonne.
        if (null !== $movieSearchDto->provider) {
            $queryBuilder
                ->innerJoin('movie.watchProviders', 'movieWatchProvider')
                ->andWhere('IDENTITY(movieWatchProvider.watchProvider) = :provider')
                ->andWhere('movieWatchProvider.region = :region')
                ->setParameter('provider', $movieSearchDto->provider)
                ->setParameter('region', $movieSearchDto->region);
        }

        match ($movieSearchDto->sort) {
            MovieSort::Popular => $queryBuilder->orderBy('movie.popularity', 'DESC'),
            MovieSort::ReleaseDate => $queryBuilder->orderBy('movie.releaseDate', 'DESC'),
            MovieSort::Title => $queryBuilder->orderBy('movie.title', 'ASC'),
        };

        // Départage les égalités pour que l'ordre reste stable d'une page à l'autre.
        return $queryBuilder->addOrderBy('movie.id', 'ASC');
    }

    public function createFilmographyQueryBuilder(Person $person, PersonMovieSearchDto $personMovieSearchDto): QueryBuilder
    {
        $queryBuilder = $this->createQueryBuilder('movie');
        $this->filterByPerson($queryBuilder, $person->getId());

        $job = $personMovieSearchDto->job;
        if (PersonMovieSearchDto::ACTOR_JOB === $job) {
            $queryBuilder
                ->andWhere('credit.type = :creditType')
                ->setParameter('creditType', CreditType::Cast);
        } elseif (null !== $job) {
            $queryBuilder
                ->andWhere('credit.job = :job')
                ->setParameter('job', $job);
        }

        return $queryBuilder
            ->orderBy('movie.releaseDate', 'DESC')
            ->addOrderBy('movie.id', 'ASC');
    }

    /**
     * @return list<int>
     */
    public function findAllTmdbIds(): array
    {
        return $this->createQueryBuilder('movie')
            ->select('movie.tmdbId')
            ->orderBy('movie.id')
            ->getQuery()
            ->getSingleColumnResult();
    }

    // Comparaison sur des dates plutôt qu'avec YEAR(), qui n'existe pas en DQL.
    private function filterByReleasePeriod(QueryBuilder $queryBuilder, string $name, int $firstYear, int $yearCount): void
    {
        $queryBuilder
            ->andWhere(\sprintf('movie.releaseDate >= :%1$sStart AND movie.releaseDate < :%1$sEnd', $name))
            ->setParameter($name.'Start', new \DateTimeImmutable($firstYear.'-01-01'), Types::DATE_IMMUTABLE)
            ->setParameter($name.'End', new \DateTimeImmutable(($firstYear + $yearCount).'-01-01'), Types::DATE_IMMUTABLE);
    }

    // Une personne peut avoir plusieurs crédits sur un même film (réalisateur et scénariste) : le Paginator dédoublonne.
    private function filterByPerson(QueryBuilder $queryBuilder, int $personId): void
    {
        $queryBuilder
            ->innerJoin('movie.credits', 'credit')
            ->andWhere('IDENTITY(credit.person) = :person')
            ->setParameter('person', $personId);
    }
}
