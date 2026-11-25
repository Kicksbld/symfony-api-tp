<?php

namespace App\Repository;

use App\Dto\LogEntrySearchDto;
use App\Entity\LogEntry;
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
                ->andWhere('logEntry.user = :user')
                ->setParameter('user', $logEntrySearchDto->user);
        }

        if ($logEntrySearchDto->withReview) {
            $queryBuilder->andWhere('logEntry.review IS NOT NULL');
        }

        // Plusieurs entrées peuvent être créées dans la même seconde : l'identifiant départage.
        return $queryBuilder
            ->orderBy('logEntry.createdAt', 'DESC')
            ->addOrderBy('logEntry.id', 'DESC');
    }
}
