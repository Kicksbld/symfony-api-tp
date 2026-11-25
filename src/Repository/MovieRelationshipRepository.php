<?php

namespace App\Repository;

use App\Entity\Movie;
use App\Entity\MovieRelationship;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
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
}
