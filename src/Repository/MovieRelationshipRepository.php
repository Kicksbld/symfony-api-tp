<?php

namespace App\Repository;

use App\Entity\Movie;
use App\Entity\MovieRelationship;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<MovieRelationship>
 */
class MovieRelationshipRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, MovieRelationship::class);
    }

    public function findOneByUserAndMovie(User $user, Movie $movie): ?MovieRelationship
    {
        return $this->findOneBy(['user' => $user, 'movie' => $movie]);
    }

    /**
     * @return array<int, int> nombre de membres par note, la note étant en demi-étoiles (1 à 10)
     */
    public function countRatingsByValue(Movie $movie): array
    {
        $rows = $this->createQueryBuilder('movieRelationship')
            ->select('movieRelationship.rating', 'COUNT(movieRelationship.id) AS ratingCount')
            ->andWhere('movieRelationship.movie = :movie')
            ->andWhere('movieRelationship.rating IS NOT NULL')
            ->groupBy('movieRelationship.rating')
            ->setParameter('movie', $movie)
            ->getQuery()
            ->getArrayResult();

        return array_map(intval(...), array_column($rows, 'ratingCount', 'rating'));
    }

    public function createWatchedQueryBuilder(User $user): QueryBuilder
    {
        return $this->createByUserQueryBuilder($user)->andWhere('movieRelationship.watched = true');
    }

    public function createLikedQueryBuilder(User $user): QueryBuilder
    {
        return $this->createByUserQueryBuilder($user)->andWhere('movieRelationship.liked = true');
    }

    public function createWatchlistQueryBuilder(User $user): QueryBuilder
    {
        return $this->createByUserQueryBuilder($user)->andWhere('movieRelationship.inWatchlist = true');
    }

    // Le film est joint pour être sérialisé sans une requête par relation. Plusieurs relations peuvent changer dans
    // la même seconde : l'identifiant départage.
    private function createByUserQueryBuilder(User $user): QueryBuilder
    {
        return $this->createQueryBuilder('movieRelationship')
            ->addSelect('movie')
            ->innerJoin('movieRelationship.movie', 'movie')
            ->andWhere('movieRelationship.user = :user')
            ->setParameter('user', $user)
            ->orderBy('movieRelationship.updatedAt', 'DESC')
            ->addOrderBy('movieRelationship.id', 'DESC');
    }
}
