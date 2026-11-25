<?php

namespace App\Repository;

use App\Entity\MovieListLike;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<MovieListLike>
 */
class MovieListLikeRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, MovieListLike::class);
    }

    /**
     * @param list<int> $movieListIds
     *
     * @return list<int>
     */
    public function findLikedIds(User $user, array $movieListIds): array
    {
        return $this->createQueryBuilder('listLike')
            ->select('IDENTITY(listLike.movieList)')
            ->where('listLike.user = :user')
            ->andWhere('listLike.movieList IN (:ids)')
            ->setParameter('user', $user)
            ->setParameter('ids', $movieListIds)
            ->getQuery()
            ->getSingleColumnResult();
    }
}
