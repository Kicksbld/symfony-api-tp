<?php

namespace App\Repository;

use App\Dto\LogEntrySearchDto;
use App\Entity\LogEntry;
use App\Entity\Movie;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<LogEntry>
 */
class LogEntryRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, LogEntry::class);
    }

    public function createSearchQueryBuilder(LogEntrySearchDto $logEntrySearchDto): QueryBuilder
    {
        // Auteur et film sont joints pour être sérialisés sans une requête par entrée.
        $queryBuilder = $this->createQueryBuilder('logEntry')
            ->addSelect('user', 'movie')
            ->innerJoin('logEntry.user', 'user')
            ->innerJoin('logEntry.movie', 'movie');

        if (null !== $logEntrySearchDto->movie) {
            $queryBuilder
                ->andWhere('logEntry.movie = :movie')
                ->setParameter('movie', $logEntrySearchDto->movie);
        }

        if (null !== $logEntrySearchDto->user) {
            $queryBuilder
                ->andWhere('user.username = :username')
                ->setParameter('username', $logEntrySearchDto->user);
        }

        if ($logEntrySearchDto->withReview) {
            $queryBuilder->andWhere('logEntry.review IS NOT NULL');
        }

        return $this->orderByMostRecent($queryBuilder);
    }

    public function findLatestByUserAndMovie(User $user, Movie $movie): ?LogEntry
    {
        $queryBuilder = $this->createQueryBuilder('logEntry')
            ->andWhere('logEntry.user = :user')
            ->andWhere('logEntry.movie = :movie')
            ->setParameter('user', $user)
            ->setParameter('movie', $movie)
            ->setMaxResults(1);

        return $this->orderByMostRecent($queryBuilder)->getQuery()->getOneOrNullResult();
    }

    // Plusieurs entrées peuvent être créées dans la même seconde : l'identifiant départage.
    private function orderByMostRecent(QueryBuilder $queryBuilder): QueryBuilder
    {
        return $queryBuilder
            ->orderBy('logEntry.createdAt', 'DESC')
            ->addOrderBy('logEntry.id', 'DESC');
    }
}
