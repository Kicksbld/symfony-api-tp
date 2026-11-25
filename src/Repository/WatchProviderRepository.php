<?php

namespace App\Repository;

use App\Entity\MovieWatchProvider;
use App\Entity\WatchProvider;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<WatchProvider>
 */
class WatchProviderRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, WatchProvider::class);
    }

    /**
     * Plateformes qui proposent au moins un film dans le pays de diffusion, par ordre alphabétique.
     */
    public function createByRegionQueryBuilder(string $region): QueryBuilder
    {
        $providerIdsInRegion = $this->getEntityManager()->createQueryBuilder()
            ->select('IDENTITY(movieWatchProvider.watchProvider)')
            ->from(MovieWatchProvider::class, 'movieWatchProvider')
            ->where('movieWatchProvider.region = :region');

        $queryBuilder = $this->createQueryBuilder('watchProvider');

        return $queryBuilder
            ->where($queryBuilder->expr()->in('watchProvider.id', $providerIdsInRegion->getDQL()))
            ->setParameter('region', $region)
            ->orderBy('watchProvider.name', 'ASC');
    }
}
