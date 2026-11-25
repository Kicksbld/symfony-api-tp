<?php

namespace App\Repository;

use App\Dto\MovieSearchDto;
use App\Entity\Movie;
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
}
